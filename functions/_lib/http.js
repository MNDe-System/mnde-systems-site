/* Shared HTTP helpers for MNDe API routes.
 *
 * These are deliberately framework-light: each helper takes/returns standard
 * Web `Request`/`Response` objects, so the exact same code runs on Cloudflare
 * Pages Functions, the local dev server, and the Node test suite.
 */

const MAX_BODY_BYTES = 8 * 1024; // 8 KB — API payloads are tiny by design.

const SECURITY_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer"
};

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, ...extraHeaders }
  });
}

// Stable error envelope: { ok:false, error:{ code, message, details } }.
export function errorResponse(status, code, message, details = null, extraHeaders = {}) {
  return json({ ok: false, error: { code, message, details } }, status, extraHeaders);
}

export function methodNotAllowed(allow) {
  return errorResponse(405, "METHOD_NOT_ALLOWED", `Method not allowed. Use ${allow}.`, null, {
    allow
  });
}

// Enforce JSON content type + size limit, then parse. Returns { ok, value } or
// { ok:false, response } so callers stay flat.
export async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: errorResponse(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Content-Type must be application/json."
      )
    };
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: errorResponse(413, "PAYLOAD_TOO_LARGE", "Request body is too large.")
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_error) {
    return {
      ok: false,
      response: errorResponse(400, "INVALID_JSON", "Request body is not valid JSON.")
    };
  }
  return { ok: true, value: parsed };
}

/* ---------- best-effort rate limiting ----------
 * Fixed-window counter kept in module scope. On Cloudflare this is per-isolate
 * (not globally consistent), so it is a first line of defense, not a hard
 * guarantee — production should also enable Cloudflare's edge rate-limiting
 * rules. It is fully deterministic and testable here.
 */
const buckets = new Map();

export function rateLimit(request, { limit = 30, windowMs = 60_000, key = "default" } = {}) {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "local";
  const now = Date.now();
  const bucketKey = `${key}:${ip}`;
  const entry = buckets.get(bucketKey);

  if (!entry || now >= entry.reset) {
    buckets.set(bucketKey, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.reset - now) / 1000);
    return {
      ok: false,
      response: errorResponse(
        429,
        "RATE_LIMITED",
        "Too many requests. Slow down and try again shortly.",
        { retry_after_seconds: retryAfter },
        { "retry-after": String(retryAfter) }
      )
    };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

// Test/hygiene helper: clear rate-limit state.
export function _resetRateLimits() {
  buckets.clear();
}
