import test from "node:test";
import assert from "node:assert/strict";
import { buildBundle } from "../scripts/make-bundle.mjs";

// The bundle is a store-method ZIP, so each JSON member appears verbatim in
// the buffer. Pull one out by its name and parse it.
function member(buffer, name) {
  const text = buffer.toString("utf8");
  // The local file header ends with the member name; its content follows.
  const at = text.indexOf(name + "{");
  assert.notEqual(at, -1, `${name} present`);
  const start = at + name.length;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}" && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error(`${name} not parseable`);
}

test("proof bundle is byte-for-byte deterministic", async () => {
  const a = await buildBundle();
  const b = await buildBundle();
  assert.equal(a.sha256, b.sha256);
});

test("drift report is measured, not asserted", async () => {
  const { buffer } = await buildBundle();
  const drift = member(buffer, "drift_report.json");
  assert.equal(drift.runs, 1000);
  assert.equal(drift.unique_decision_hashes, 1);
  assert.equal(drift.drift_detected, 0);
});

test("bundle never presents a hash as a signature", async () => {
  const { buffer } = await buildBundle();
  const sample = member(buffer, "sample_decision.json");
  assert.equal(sample.signature, null);
  assert.match(sample.signature_note, /does not sign/);
  assert.ok(!buffer.toString("utf8").includes("ES256:"), "no fabricated ES256 signature");
});

test("parity report does not claim a cross-runtime measurement it did not make", async () => {
  const { buffer } = await buildBundle();
  const parity = member(buffer, "parity_report.json");
  assert.notEqual(parity.parity, "verified");
  assert.deepEqual(parity.measured_in, ["node"]);
});
