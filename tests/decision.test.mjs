import test from "node:test";
import assert from "node:assert/strict";
import { simulate, decide, validateInput, ValidationError, POLICY } from "../functions/_lib/decision.js";

test("determinism: identical input yields identical hashes across 10 runs", async () => {
  const input = { gpu_count: 8, hours: 4, retries: 1, cost_per_hour: 30 };
  const results = [];
  for (let i = 0; i < 10; i += 1) results.push(await simulate({ ...input }));
  const reqHashes = new Set(results.map((r) => r.request_hash));
  const decHashes = new Set(results.map((r) => r.decision_hash));
  assert.equal(reqHashes.size, 1, "request_hash must be identical");
  assert.equal(decHashes.size, 1, "decision_hash must be identical");
  assert.match([...decHashes][0], /^[0-9a-f]{64}$/);
});

test("ALLOW: cost within limit", async () => {
  // 8 * 4 * 30 * (1+1) = 1920 <= 5000
  const r = await simulate({ gpu_count: 8, hours: 4, retries: 1, cost_per_hour: 30 });
  assert.equal(r.decision, "ALLOW");
  assert.equal(r.total_cost, 1920);
  assert.equal(r.allowed_cost, 1920);
  assert.equal(r.prevented_cost, 0);
  assert.deepEqual(r.reason_codes, ["WITHIN_BUDGET"]);
});

test("REFUSE: cost over limit, prevented cost and reason codes", async () => {
  // 100 * 10 * 40 * (1+9) = 400000; over 5000
  const r = await simulate({ gpu_count: 100, hours: 10, retries: 9, cost_per_hour: 40 });
  assert.equal(r.decision, "REFUSE");
  assert.equal(r.total_cost, 400000);
  assert.equal(r.allowed_cost, POLICY.allowed_cost_limit_usd);
  assert.equal(r.prevented_cost, 400000 - POLICY.allowed_cost_limit_usd);
  assert.ok(r.reason_codes.includes("COST_LIMIT_EXCEEDED"));
  assert.ok(r.reason_codes.includes("GPU_OVER_ALLOCATION"));
  assert.ok(r.reason_codes.includes("EXCESSIVE_RETRIES"));
  // reason codes are sorted for determinism
  assert.deepEqual(r.reason_codes, [...r.reason_codes].sort());
});

test("boundary: exactly at limit is ALLOW", async () => {
  // 5 * 10 * 100 * 1 = 5000 == limit
  const r = await simulate({ gpu_count: 5, hours: 10, retries: 0, cost_per_hour: 100 });
  assert.equal(r.total_cost, 5000);
  assert.equal(r.decision, "ALLOW");
  assert.equal(r.prevented_cost, 0);
});

test("validation rejects unknown fields and never returns ALLOW", async () => {
  await assert.rejects(
    () => simulate({ gpu_count: 1, hours: 1, retries: 0, cost_per_hour: 1, admin: true }),
    (e) => e instanceof ValidationError && e.code === "UNKNOWN_FIELD"
  );
});

test("validation rejects missing, non-numeric, non-integer, out-of-range", async () => {
  await assert.rejects(() => simulate({ hours: 1, retries: 0, cost_per_hour: 1 }), (e) => e.code === "MISSING_FIELD");
  await assert.rejects(
    () => simulate({ gpu_count: "8", hours: 1, retries: 0, cost_per_hour: 1 }),
    (e) => e.code === "NOT_A_NUMBER"
  );
  await assert.rejects(
    () => simulate({ gpu_count: 1.5, hours: 1, retries: 0, cost_per_hour: 1 }),
    (e) => e.code === "NOT_AN_INTEGER"
  );
  await assert.rejects(
    () => simulate({ gpu_count: -1, hours: 1, retries: 0, cost_per_hour: 1 }),
    (e) => e.code === "OUT_OF_RANGE"
  );
  await assert.rejects(
    () => simulate({ gpu_count: 999999, hours: 1, retries: 0, cost_per_hour: 1 }),
    (e) => e.code === "OUT_OF_RANGE"
  );
});

test("NaN / Infinity are rejected (fail closed)", async () => {
  await assert.rejects(
    () => simulate({ gpu_count: 1, hours: Infinity, retries: 0, cost_per_hour: 1 }),
    (e) => e instanceof ValidationError
  );
  await assert.rejects(
    () => simulate({ gpu_count: 1, hours: NaN, retries: 0, cost_per_hour: 1 }),
    (e) => e instanceof ValidationError
  );
});

test("validateInput returns only known normalized fields", () => {
  const v = validateInput({ gpu_count: 2, hours: 3, retries: 0, cost_per_hour: 10 });
  assert.deepEqual(Object.keys(v).sort(), ["cost_per_hour", "gpu_count", "hours", "retries"]);
});

test("decide is a pure function of validated input", async () => {
  const a = await decide({ gpu_count: 2, hours: 3, retries: 0, cost_per_hour: 10 });
  const b = await decide({ gpu_count: 2, hours: 3, retries: 0, cost_per_hour: 10 });
  assert.equal(a.decision_hash, b.decision_hash);
});
