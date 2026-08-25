import test from "node:test";
import assert from "node:assert/strict";
import { onRequest as simulate } from "../functions/api/simulate.js";
import { onRequest as contact } from "../functions/api/contact.js";
import { _resetRateLimits } from "../functions/_lib/http.js";

function postJson(url, body, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

test("simulate: valid POST returns ALLOW decision", async () => {
  _resetRateLimits();
  const res = await simulate({ request: postJson("https://x/api/simulate", { gpu_count: 8, hours: 4, retries: 1, cost_per_hour: 30 }) });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.decision, "ALLOW");
  assert.match(body.request_hash, /^[0-9a-f]{64}$/);
  assert.match(body.decision_hash, /^[0-9a-f]{64}$/);
});

test("simulate: GET is 405 with JSON envelope", async () => {
  _resetRateLimits();
  const res = await simulate({ request: new Request("https://x/api/simulate", { method: "GET" }) });
  assert.equal(res.status, 405);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "METHOD_NOT_ALLOWED");
});

test("simulate: non-JSON content type is 415", async () => {
  _resetRateLimits();
  const res = await simulate({
    request: new Request("https://x/api/simulate", { method: "POST", headers: { "content-type": "text/plain" }, body: "x" })
  });
  assert.equal(res.status, 415);
  assert.equal((await res.json()).error.code, "UNSUPPORTED_MEDIA_TYPE");
});

test("simulate: invalid JSON is 400", async () => {
  _resetRateLimits();
  const res = await simulate({ request: postJson("https://x/api/simulate", "{bad json") });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error.code, "INVALID_JSON");
});

test("simulate: unknown field is 422 and no ALLOW", async () => {
  _resetRateLimits();
  const res = await simulate({ request: postJson("https://x/api/simulate", { gpu_count: 1, hours: 1, retries: 0, cost_per_hour: 1, x: 1 }) });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "UNKNOWN_FIELD");
  assert.equal(body.decision, undefined);
});

test("simulate: rate limiting eventually returns 429", async () => {
  _resetRateLimits();
  const headers = { "cf-connecting-ip": "203.0.113.5" };
  let got429 = false;
  for (let i = 0; i < 65; i += 1) {
    const res = await simulate({ request: postJson("https://x/api/simulate", { gpu_count: 1, hours: 1, retries: 0, cost_per_hour: 1 }, headers) });
    if (res.status === 429) {
      got429 = true;
      assert.equal((await res.json()).error.code, "RATE_LIMITED");
      break;
    }
  }
  assert.ok(got429, "should hit the rate limit within 65 requests");
});

test("contact: valid input but unconfigured mail returns 503 (never fake success)", async () => {
  _resetRateLimits();
  const res = await contact({ request: postJson("https://x/api/contact", { name: "A", company: "B", use_case: "C" }), env: {} });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "MAIL_NOT_CONFIGURED");
  assert.equal(body.request_id, undefined);
});

test("contact: validation error is 422 before mail is consulted", async () => {
  _resetRateLimits();
  const res = await contact({ request: postJson("https://x/api/contact", { company: "B", use_case: "C" }), env: {} });
  assert.equal(res.status, 422);
  assert.equal((await res.json()).error.code, "MISSING_FIELD");
});
