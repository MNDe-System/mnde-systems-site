/* POST /api/simulate
 *
 * Validates a cost request, computes a deterministic ALLOW/REFUSE decision, and
 * returns the decision with request/decision hashes. Fails closed: any invalid
 * input or internal error returns an explicit error and never ALLOW.
 */
import { simulate, ValidationError } from "../_lib/decision.js";
import { json, errorResponse, methodNotAllowed, readJson, rateLimit } from "../_lib/http.js";

async function handlePost(request) {
  const limited = rateLimit(request, { limit: 60, windowMs: 60_000, key: "simulate" });
  if (!limited.ok) return limited.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await simulate(parsed.value);
    return json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(422, error.code, error.message, error.details);
    }
    // Unknown internal failure — fail closed, never ALLOW.
    return errorResponse(500, "INTERNAL_ERROR", "Simulation failed. No decision produced.");
  }
}

// Single catch-all so the 405 response uses our JSON envelope too.
export function onRequest({ request }) {
  if (request.method === "POST") return handlePost(request);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
  }
  return methodNotAllowed("POST");
}
