/* Contact request validation + orchestration (framework-agnostic).
 *
 * Validates and sanitizes the submission, then sends the inbound notification
 * and (if an email was supplied) an auto-reply. Fails closed: if the mailer is
 * not configured or the send fails, it throws and the caller must NOT report
 * success.
 */
import { mailConfig, sendEmail, ConfigError, MailError } from "./mail.js";

export class ContactValidationError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "ContactValidationError";
    this.code = code;
    this.details = details || null;
  }
}

const SPECS = {
  name: { required: true, max: 200 },
  company: { required: true, max: 200 },
  use_case: { required: true, max: 4000 },
  email: { required: false, max: 254 }
};
const FIELDS = Object.keys(SPECS);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Remove control characters (except tab/newline) that have no place in a
// contact message; collapse trailing whitespace.
function sanitize(value) {
  // Strip control characters (keep tab \x09 and newline \x0A), then trim.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export function validateContact(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ContactValidationError("MALFORMED_BODY", "Request body must be a JSON object.");
  }
  const unknown = Object.keys(raw).filter((k) => !FIELDS.includes(k));
  if (unknown.length > 0) {
    throw new ContactValidationError("UNKNOWN_FIELD", `Unknown field(s): ${unknown.join(", ")}.`, {
      unknown_fields: unknown
    });
  }

  const clean = {};
  for (const field of FIELDS) {
    const spec = SPECS[field];
    let value = raw[field];
    if (value === undefined || value === null || value === "") {
      if (spec.required) {
        throw new ContactValidationError("MISSING_FIELD", `Missing required field: ${field}.`, { field });
      }
      continue;
    }
    if (typeof value !== "string") {
      throw new ContactValidationError("NOT_A_STRING", `Field ${field} must be a string.`, { field });
    }
    value = sanitize(value);
    if (spec.required && value.length === 0) {
      throw new ContactValidationError("EMPTY_FIELD", `Field ${field} must not be empty.`, { field });
    }
    if (value.length > spec.max) {
      throw new ContactValidationError("TOO_LONG", `Field ${field} exceeds ${spec.max} characters.`, {
        field,
        max: spec.max
      });
    }
    clean[field] = value;
  }

  if (clean.email && !EMAIL_RE.test(clean.email)) {
    throw new ContactValidationError("INVALID_EMAIL", "Email address is not valid.", { field: "email" });
  }
  return clean;
}

function inboundMessage(config, data, meta) {
  const lines = [
    "New MNDe inbound request.",
    "",
    `Request ID: ${meta.request_id}`,
    `Received:   ${meta.timestamp}`,
    "",
    `Name:     ${data.name}`,
    `Company:  ${data.company}`,
    `Email:    ${data.email || "(not provided)"}`,
    "",
    "Use case:",
    data.use_case
  ];
  return {
    to: config.to,
    subject: "MNDe inbound request",
    text: lines.join("\n"),
    replyTo: data.email || undefined
  };
}

function autoReplyMessage(data) {
  return {
    to: data.email,
    subject: "MNDe request received",
    text: [
      "We received your request.",
      "We will review your execution risk.",
      "Expect follow up."
    ].join("\n")
  };
}

// Validate → send inbound → send auto-reply. Returns { request_id, timestamp }.
// Throws ContactValidationError / ConfigError / MailError; callers fail closed.
export async function processContact(raw, env, deps = {}) {
  const data = validateContact(raw);
  const config = mailConfig(env); // throws ConfigError if unconfigured

  const meta = {
    request_id: (deps.newId || (() => `req_${crypto.randomUUID()}`))(),
    timestamp: (deps.now || (() => new Date().toISOString()))()
  };

  const send = deps.sendEmail || sendEmail;
  const fetchImpl = deps.fetch; // undefined → sendEmail uses global fetch

  // Inbound notification must succeed for the request to count as processed.
  await send(config, inboundMessage(config, data, meta), fetchImpl);

  // Auto-reply is best-effort but its failure is still surfaced (no silent
  // success): if it throws, the whole request reports failure.
  if (data.email) {
    await send(config, autoReplyMessage(data), fetchImpl);
  }

  return meta;
}

export { ConfigError, MailError };
