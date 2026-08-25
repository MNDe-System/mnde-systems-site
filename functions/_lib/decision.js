/* MNDe execution-cost decision engine — framework-agnostic, deterministic.
 *
 * The SAME module runs in three places so behavior is identical everywhere:
 *   - Cloudflare Pages Function  (functions/api/simulate.js)
 *   - Local dev server           (scripts/dev-server.mjs)
 *   - Node test suite            (tests/decision.test.js)
 *
 * Core principle: a request is validated, then a deterministic decision is
 * computed, then the decision is hashed. The same input always produces the
 * same output and the same hashes. Invalid input fails closed — it can never
 * produce ALLOW.
 */

// Authoritative policy. This is the single source of truth for the limit and
// the cost formula; changing formula_version changes decision_hash on purpose.
export const POLICY = Object.freeze({
  allowed_cost_limit_usd: 5000,
  formula_version: "mnde-cost-policy-1",
  // Advisory thresholds that add reason codes but never change the ALLOW/REFUSE
  // outcome (that is decided solely by the cost limit).
  gpu_over_allocation: 64,
  excessive_retries: 5,
  high_runtime_hours: 168
});

// Strict field specifications. Any field not listed here is rejected.
const FIELD_SPECS = Object.freeze({
  gpu_count: { integer: true, min: 0, max: 4096 },
  hours: { integer: false, min: 0, max: 8760 },
  retries: { integer: true, min: 0, max: 1000 },
  cost_per_hour: { integer: false, min: 0, max: 100000 }
});

const FIELDS = Object.keys(FIELD_SPECS);

export class ValidationError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.details = details || null;
  }
}

/* ---------- canonicalization + hashing (deterministic) ---------- */

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        if (value[key] !== undefined) acc[key] = sortValue(value[key]);
        return acc;
      }, {});
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("non-finite numbers are not canonicalizable");
  }
  return value;
}

export function canonicalize(value) {
  return JSON.stringify(sortValue(value));
}

export async function sha256Hex(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < view.length; i += 1) hex += view[i].toString(16).padStart(2, "0");
  return hex;
}

/* ---------- validation ---------- */

// Validates and normalizes raw input. Throws ValidationError on any problem.
// Never returns partially-valid data.
export function validateInput(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError("MALFORMED_BODY", "Request body must be a JSON object.");
  }

  const unknown = Object.keys(raw).filter((k) => !FIELDS.includes(k));
  if (unknown.length > 0) {
    throw new ValidationError("UNKNOWN_FIELD", `Unknown field(s): ${unknown.join(", ")}.`, {
      unknown_fields: unknown
    });
  }

  const normalized = {};
  for (const field of FIELDS) {
    const spec = FIELD_SPECS[field];
    const value = raw[field];
    if (value === undefined) {
      throw new ValidationError("MISSING_FIELD", `Missing required field: ${field}.`, { field });
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new ValidationError("NOT_A_NUMBER", `Field ${field} must be a finite number.`, { field });
    }
    if (spec.integer && !Number.isInteger(value)) {
      throw new ValidationError("NOT_AN_INTEGER", `Field ${field} must be an integer.`, { field });
    }
    if (value < spec.min || value > spec.max) {
      throw new ValidationError(
        "OUT_OF_RANGE",
        `Field ${field} must be between ${spec.min} and ${spec.max}.`,
        { field, min: spec.min, max: spec.max }
      );
    }
    normalized[field] = value;
  }
  return normalized;
}

/* ---------- deterministic decision ---------- */

// Round to whole cents so displayed money and hashed money are identical.
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function computeReasonCodes(input, totalCost) {
  const codes = [];
  if (totalCost > POLICY.allowed_cost_limit_usd) {
    codes.push("COST_LIMIT_EXCEEDED");
    if (input.gpu_count > POLICY.gpu_over_allocation) codes.push("GPU_OVER_ALLOCATION");
    if (input.retries > POLICY.excessive_retries) codes.push("EXCESSIVE_RETRIES");
    if (input.hours > POLICY.high_runtime_hours) codes.push("HIGH_RUNTIME");
  } else {
    codes.push("WITHIN_BUDGET");
  }
  return codes.sort();
}

// Pure computation from already-validated, normalized input.
export async function decide(input) {
  const limit = POLICY.allowed_cost_limit_usd;
  const attempts = 1 + input.retries; // one initial run plus each retry
  const totalCost = round2(input.gpu_count * input.hours * input.cost_per_hour * attempts);

  const decision = totalCost <= limit ? "ALLOW" : "REFUSE";
  const allowedCost = round2(Math.min(totalCost, limit));
  const preventedCost = round2(Math.max(0, totalCost - limit));
  const reasonCodes = computeReasonCodes(input, totalCost);

  const requestHash = await sha256Hex(canonicalize(input));

  // The decision hash covers every field that defines the outcome, plus the
  // policy that produced it. It intentionally excludes non-deterministic data
  // (timestamps, ids) so identical requests hash identically.
  const decisionCore = {
    policy: { allowed_cost_limit_usd: limit, formula_version: POLICY.formula_version },
    request_hash: requestHash,
    decision,
    total_cost: totalCost,
    allowed_cost: allowedCost,
    prevented_cost: preventedCost,
    reason_codes: reasonCodes
  };
  const decisionHash = await sha256Hex(canonicalize(decisionCore));

  return {
    decision,
    total_cost: totalCost,
    allowed_cost: allowedCost,
    prevented_cost: preventedCost,
    reason_codes: reasonCodes,
    request_hash: requestHash,
    decision_hash: decisionHash,
    policy: { allowed_cost_limit_usd: limit, formula_version: POLICY.formula_version },
    inputs: input
  };
}

// Full pipeline: validate → decide. Throws ValidationError on bad input so the
// caller can fail closed. A thrown error can never yield ALLOW.
export async function simulate(raw) {
  const input = validateInput(raw);
  return decide(input);
}
