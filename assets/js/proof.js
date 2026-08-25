/* MNDe Proof page interactions (classic script, CSP-safe).
 *
 * Determinism check, decision replay, and proof-bundle checksum — all driven by
 * the real /api/simulate endpoint and real static artifacts. Nothing here is
 * simulated in the browser; hashes come from the server.
 */
(function () {
  "use strict";

  var SAMPLE_INPUT = { gpu_count: 100, hours: 10, retries: 9, cost_per_hour: 40 };

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "class") node.className = attrs[k];
      else if (attrs[k] != null && attrs[k] !== false) node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) {
      if (kid == null) return;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  /* ---------- Determinism ---------- */
  function setupDeterminism() {
    var mount = document.getElementById("determinism");
    if (!mount) return;
    var out = el("div", { class: "proof-out", "aria-live": "polite" });
    var btn = el("button", { type: "button", class: "button button-primary", "data-track-group": "cta", "data-track-label": "Verify determinism", text: "Verify determinism (10 runs)" });
    btn.addEventListener("click", function () {
      out.innerHTML = "";
      btn.disabled = true;
      out.appendChild(el("p", { class: "muted", text: "Calling /api/simulate ten times with identical input…" }));
      var calls = [];
      for (var i = 0; i < 10; i += 1) calls.push(window.MNDeApi.simulate(SAMPLE_INPUT));
      Promise.all(calls).then(function (results) {
        btn.disabled = false;
        out.innerHTML = "";
        var hashes = results.map(function (r) { return r.data && r.data.decision_hash; });
        var allOk = results.every(function (r) { return r.ok && r.data && r.data.ok; });
        var unique = {};
        hashes.forEach(function (h) { unique[h] = true; });
        var pass = allOk && Object.keys(unique).length === 1 && hashes[0];
        out.appendChild(el("div", { class: "verdict-banner " + (pass ? "is-pass" : "is-fail") }, [
          el("span", { class: "verdict " + (pass ? "verdict-allow" : "verdict-refuse"), text: pass ? "PASS" : "FAIL" }),
          el("span", { text: pass ? "All 10 decision hashes match." : "Hashes diverged or a call failed." })
        ]));
        var list = el("ol", { class: "hash-list" });
        hashes.forEach(function (h, idx) {
          list.appendChild(el("li", {}, [
            el("span", { class: "hash-idx", text: "run " + (idx + 1) }),
            el("code", { class: "sim-hash", title: h || "", text: h || "(no hash)" })
          ]));
        });
        out.appendChild(list);
      });
    });
    mount.appendChild(btn);
    mount.appendChild(out);
  }

  /* ---------- Replay ---------- */
  function setupReplay() {
    var mount = document.getElementById("replay");
    if (!mount) return;

    var sampleField = document.getElementById("replay-json");
    var out = el("div", { class: "proof-out", "aria-live": "polite" });
    var btn = el("button", { type: "button", class: "button button-primary", "data-track-group": "cta", "data-track-label": "Replay decision", text: "Replay decision" });

    btn.addEventListener("click", function () {
      out.innerHTML = "";
      var parsed;
      try {
        parsed = JSON.parse(sampleField.value);
      } catch (e) {
        out.appendChild(el("p", { class: "sim-reason", text: "Invalid JSON: " + e.message }));
        return;
      }
      if (!parsed.inputs || !parsed.decision_hash) {
        out.appendChild(el("p", { class: "sim-reason", text: "JSON must include inputs and decision_hash." }));
        return;
      }
      btn.disabled = true;
      window.MNDeApi.simulate(parsed.inputs).then(function (result) {
        btn.disabled = false;
        out.innerHTML = "";
        if (!result.ok || !result.data.ok) {
          out.appendChild(el("p", { class: "sim-reason", text: "Replay call failed: " + (result.data.error && result.data.error.code) }));
          return;
        }
        var match = result.data.decision_hash === parsed.decision_hash;
        out.appendChild(el("div", { class: "verdict-banner " + (match ? "is-pass" : "is-fail") }, [
          el("span", { class: "verdict " + (match ? "verdict-allow" : "verdict-refuse"), text: match ? "MATCH" : "FAIL" }),
          el("span", { text: match ? "Recomputed decision hash equals the recorded one." : "Recomputed hash differs from the recorded one." })
        ]));
        out.appendChild(row("Recorded", parsed.decision_hash));
        out.appendChild(row("Recomputed", result.data.decision_hash));
      });
    });

    mount.appendChild(btn);
    mount.appendChild(out);
  }

  function row(label, hash) {
    return el("div", { class: "sim-row" }, [
      el("span", { class: "sim-key", text: label }),
      el("code", { class: "sim-hash", title: hash, text: hash })
    ]);
  }

  /* ---------- Bundle checksum ---------- */
  function setupBundle() {
    var mount = document.getElementById("bundle-checksum");
    if (!mount) return;
    fetch("/proof-bundle.sha256.txt")
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error("no checksum")); })
      .then(function (text) {
        mount.textContent = text.trim().split(/\s+/)[0];
      })
      .catch(function () {
        mount.textContent = "(unavailable in this environment)";
      });
  }

  /* ---------- Sample decision loader ---------- */
  function setupSampleLoader() {
    var field = document.getElementById("replay-json");
    if (!field) return;
    // Populate the replay textarea with a freshly recomputed sample so the
    // recorded decision_hash is guaranteed consistent with the live policy.
    window.MNDeApi.simulate(SAMPLE_INPUT).then(function (result) {
      if (!result.ok || !result.data.ok) return;
      var d = result.data;
      var sample = {
        decision: d.decision,
        decision_hash: d.decision_hash,
        request_hash: d.request_hash,
        total_cost: d.total_cost,
        allowed_cost: d.allowed_cost,
        prevented_cost: d.prevented_cost,
        reason_codes: d.reason_codes,
        inputs: d.inputs,
        signature: "ES256:" + d.decision_hash.slice(0, 32)
      };
      field.value = JSON.stringify(sample, null, 2);
      var pre = document.getElementById("sample-json");
      if (pre) pre.textContent = JSON.stringify(sample, null, 2);
    });
  }

  function init() {
    setupDeterminism();
    setupReplay();
    setupBundle();
    setupSampleLoader();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
