import test from "node:test";
import assert from "node:assert/strict";
import {
  validateContact,
  processContact,
  ContactValidationError,
  ConfigError,
  MailError
} from "../functions/_lib/contact.js";

const ENV = { RESEND_API_KEY: "test_key", CONTACT_FROM: "MNDe <noreply@mndesystems.com>", CONTACT_TO: "contact@mndesystems.com" };

function stubDeps() {
  const sent = [];
  return {
    sent,
    deps: {
      sendEmail: async (config, message) => {
        sent.push({ to: message.to, subject: message.subject, text: message.text });
        return { id: `stub_${sent.length}` };
      },
      newId: () => "req_fixed",
      now: () => "2026-01-01T00:00:00.000Z"
    }
  };
}

test("validateContact accepts a well-formed submission", () => {
  const v = validateContact({ name: "Ada", company: "MNDe", use_case: "CI cost control" });
  assert.equal(v.name, "Ada");
  assert.equal(v.email, undefined);
});

test("validateContact rejects missing required fields", () => {
  assert.throws(() => validateContact({ company: "X", use_case: "Y" }), (e) => e.code === "MISSING_FIELD");
});

test("validateContact rejects unknown fields", () => {
  assert.throws(
    () => validateContact({ name: "A", company: "B", use_case: "C", is_admin: true }),
    (e) => e.code === "UNKNOWN_FIELD"
  );
});

test("validateContact rejects invalid email and oversized fields", () => {
  assert.throws(
    () => validateContact({ name: "A", company: "B", use_case: "C", email: "not-an-email" }),
    (e) => e.code === "INVALID_EMAIL"
  );
  assert.throws(
    () => validateContact({ name: "A".repeat(201), company: "B", use_case: "C" }),
    (e) => e.code === "TOO_LONG"
  );
});

test("validateContact strips control characters", () => {
  const v = validateContact({ name: "A\u0001d\u0007a", company: "B", use_case: "C" });
  assert.equal(v.name, "Ada");
});

test("processContact sends inbound only when no email is supplied", async () => {
  const { sent, deps } = stubDeps();
  const meta = await processContact({ name: "Ada", company: "MNDe", use_case: "CI" }, ENV, deps);
  assert.equal(meta.request_id, "req_fixed");
  assert.equal(meta.timestamp, "2026-01-01T00:00:00.000Z");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "contact@mndesystems.com");
  assert.equal(sent[0].subject, "MNDe inbound request");
});

test("processContact sends inbound + auto-reply when email supplied", async () => {
  const { sent, deps } = stubDeps();
  await processContact({ name: "Ada", company: "MNDe", use_case: "CI", email: "ada@example.com" }, ENV, deps);
  assert.equal(sent.length, 2);
  const reply = sent.find((m) => m.subject === "MNDe request received");
  assert.ok(reply, "auto-reply sent");
  assert.equal(reply.to, "ada@example.com");
  assert.match(reply.text, /We received your request\./);
});

test("processContact fails closed when mail is not configured (ConfigError)", async () => {
  const { deps } = stubDeps();
  await assert.rejects(
    () => processContact({ name: "A", company: "B", use_case: "C" }, {}, deps),
    (e) => e instanceof ConfigError && e.code === "MAIL_NOT_CONFIGURED"
  );
});

test("processContact surfaces send failure (no fake success)", async () => {
  const deps = {
    sendEmail: async () => {
      throw new MailError("provider down");
    }
  };
  await assert.rejects(
    () => processContact({ name: "A", company: "B", use_case: "C" }, ENV, deps),
    (e) => e instanceof MailError
  );
});

test("validation happens before mail configuration is required", async () => {
  // Invalid input with NO mail env should still throw the validation error,
  // not a config error — validation is first.
  await assert.rejects(
    () => processContact({ company: "B", use_case: "C" }, {}, {}),
    (e) => e instanceof ContactValidationError
  );
});
