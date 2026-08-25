/* Mail sending for MNDe contact requests.
 *
 * Provider: Resend (HTTP API — works natively on Cloudflare Workers/Pages).
 * Configuration comes entirely from environment variables; no secret is ever
 * committed. If the provider is not configured, sending fails closed with a
 * ConfigError so the caller returns an explicit configuration error instead of
 * a fake success.
 *
 * Required env:
 *   RESEND_API_KEY   Resend API key.
 *   CONTACT_FROM     Verified sender, e.g. "MNDe <noreply@mndesystems.com>".
 * Optional env:
 *   CONTACT_TO       Destination inbox (default: contact@mndesystems.com).
 */

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
    this.code = "MAIL_NOT_CONFIGURED";
  }
}

export class MailError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "MailError";
    this.code = "MAIL_SEND_FAILED";
    this.details = details || null;
  }
}

export function mailConfig(env) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.CONTACT_FROM;
  const to = env.CONTACT_TO || "contact@mndesystems.com";
  if (!apiKey || !from) {
    throw new ConfigError(
      "Mail provider is not configured. Set RESEND_API_KEY and CONTACT_FROM."
    );
  }
  return { apiKey, from, to };
}

// Sends one email through Resend. Throws MailError on any non-2xx response.
// `fetchImpl` is injectable so the dev server and tests can run without network.
export async function sendEmail(config, message, fetchImpl = globalThis.fetch) {
  const payload = {
    from: config.from,
    to: [message.to],
    subject: message.subject,
    text: message.text
  };
  if (message.replyTo) payload.reply_to = message.replyTo;

  let response;
  try {
    response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new MailError("Mail provider request failed.", { cause: String(error) });
  }

  if (!response.ok) {
    let detail = null;
    try {
      detail = await response.text();
    } catch (_error) {
      /* ignore */
    }
    throw new MailError(`Mail provider returned ${response.status}.`, { status: response.status, body: detail });
  }
  const data = await response.json().catch(() => ({}));
  return { id: data.id || null };
}
