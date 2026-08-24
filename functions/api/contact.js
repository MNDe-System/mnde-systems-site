/* POST /api/contact
 *
 * Validates and sanitizes a contact request, then sends an inbound notification
 * (and an auto-reply if an email was provided) via the configured mail
 * provider. Never fakes success: if mail is unconfigured or sending fails, it
 * returns an explicit error and no request_id.
 */
import { processContact, ContactValidationError, ConfigError, MailError } from "../_lib/contact.js";
import { json, errorResponse, methodNotAllowed, readJson, rateLimit } from "../_lib/http.js";

async function handlePost(request, env) {
  const limited = rateLimit(request, { limit: 5, windowMs: 60_000, key: "contact" });
  if (!limited.ok) return limited.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  try {
    const meta = await processContact(parsed.value, env);
    return json({
      ok: true,
      status: "queued",
      request_id: meta.request_id,
      timestamp: meta.timestamp,
      lifecycle: ["validated", "queued", "review"]
    });
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return errorResponse(422, error.code, error.message, error.details);
    }
    if (error instanceof ConfigError) {
      return errorResponse(503, error.code, error.message);
    }
    if (error instanceof MailError) {
      return errorResponse(502, error.code, error.message);
    }
    return errorResponse(500, "INTERNAL_ERROR", "Contact request could not be processed.");
  }
}

export function onRequest({ request, env }) {
  if (request.method === "POST") return handlePost(request, env || {});
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
  }
  return methodNotAllowed("POST");
}
