/* MNDe Product system explorer (classic script, CSP-safe).
 *
 * Clickable components — Preflight, Orbit, ARM, RAM0NA — each showing a real
 * request example, the validation/decision it performs, and (where meaningful)
 * a content hash computed live with Web Crypto over the canonical example.
 * The hash demonstrates canonicalization; it is illustrative, not a production
 * authorization decision.
 */
(function () {
  "use strict";

  var COMPONENTS = [
    {
      id: "preflight",
      name: "Preflight",
      role: "Validation gate",
      status: ["badge-implemented", "IMPLEMENTED / REFERENCE"],
      blurb: "Normalizes and strictly validates a request before anything downstream sees it. No execution without validation.",
      example: { action: "simulate_cost", gpu_count: 8, hours: 4, retries: 1, cost_per_hour: 30 },
      outcome: "VALID → normalized request + request_hash. Unknown field or out-of-range → REJECT."
    },
    {
      id: "orbit",
      name: "Orbit",
      role: "Deterministic decision plane",
      status: ["badge-limited", "LIMITED"],
      blurb: "Applies the authoritative policy to the validated request and returns a deterministic ALLOW/REFUSE with a decision_hash.",
      example: { policy: "mnde-cost-policy-1", allowed_cost_limit_usd: 5000, decision: "REFUSE" },
      outcome: "Same input → same decision → same decision_hash, every time."
    },
    {
      id: "arm",
      name: "ARM",
      role: "Authorized execution / refusal",
      status: ["badge-target", "TARGET"],
      blurb: "The only path allowed to perform the action. It executes exactly what was authorized, or refuses. Non-bypassability is target architecture.",
      example: { execute: "merge_pull_request", requires_grant: true, on_refuse: "no side effects" },
      outcome: "ALLOW → execute exact action. REFUSE → nothing runs; spend prevented."
    },
    {
      id: "ram0na",
      name: "RAM0NA",
      role: "Evidence & replay",
      status: ["badge-limited", "LIMITED"],
      blurb: "Emits linked, signed evidence for what was authorized and what executed, verifiable offline and replayable.",
      example: { authorization_receipt: "sha256:…", execution_receipt: "sha256:…", replayable: true },
      outcome: "Two linked receipts; replay recomputes the same decision_hash or fails."
    }
  ];

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

  function sortValue(v) {
    if (Array.isArray(v)) return v.map(sortValue);
    if (v && typeof v === "object") {
      return Object.keys(v).sort().reduce(function (a, k) { a[k] = sortValue(v[k]); return a; }, {});
    }
    return v;
  }
  function canonicalize(v) { return JSON.stringify(sortValue(v)); }

  async function sha256Hex(str) {
    if (!(window.crypto && window.crypto.subtle)) return null;
    var buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    var bytes = new Uint8Array(buf);
    var hex = "";
    for (var i = 0; i < bytes.length; i += 1) hex += bytes[i].toString(16).padStart(2, "0");
    return hex;
  }

  function init() {
    var mount = document.getElementById("product-explorer");
    if (!mount) return;

    var list = el("div", { class: "selector-list", role: "tablist", "aria-label": "System components", "aria-orientation": "vertical" });
    var detail = el("div", { class: "selector-detail", role: "tabpanel", "aria-live": "polite" });

    function show(comp, focus) {
      list.querySelectorAll(".selector-item").forEach(function (btn) {
        var sel = btn.getAttribute("data-comp") === comp.id;
        btn.setAttribute("aria-selected", String(sel));
        btn.setAttribute("tabindex", sel ? "0" : "-1");
      });
      detail.innerHTML = "";
      detail.appendChild(el("span", { class: "badge " + comp.status[0], text: comp.status[1] }));
      detail.appendChild(el("h3", { text: comp.name + " — " + comp.role }));
      detail.appendChild(el("p", { class: "muted", text: comp.blurb }));
      detail.appendChild(el("p", { class: "mono-label", text: "Request example" }));
      var pre = el("pre", { class: "code-pane", text: JSON.stringify(comp.example, null, 2) });
      detail.appendChild(pre);
      detail.appendChild(el("dl", { class: "detail-rows" }, [
        el("div", { class: "detail-row" }, [el("dt", { text: "Validation / decision" }), el("dd", { text: comp.outcome })])
      ]));
      var hashRow = el("div", { class: "sim-row" }, [
        el("span", { class: "sim-key", text: "Canonical hash" }),
        el("code", { class: "sim-hash", text: "computing…" })
      ]);
      detail.appendChild(hashRow);
      sha256Hex(canonicalize(comp.example)).then(function (h) {
        var code = hashRow.querySelector("code");
        code.textContent = h ? h : "(crypto unavailable)";
        if (h) code.setAttribute("title", h);
      });
      if (focus) list.querySelector('[aria-selected="true"]').focus();
    }

    COMPONENTS.forEach(function (comp, index) {
      var btn = el("button", {
        type: "button",
        class: "selector-item",
        role: "tab",
        "data-comp": comp.id,
        "aria-selected": index === 0 ? "true" : "false",
        tabindex: index === 0 ? "0" : "-1"
      }, [
        el("span", { text: comp.name }),
        el("span", { class: "badge " + comp.status[0], text: comp.status[1] })
      ]);
      btn.addEventListener("click", function () { show(comp, false); });
      btn.addEventListener("keydown", function (event) {
        var keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        var next = (index + keys[event.key] + COMPONENTS.length) % COMPONENTS.length;
        show(COMPONENTS[next], true);
      });
      list.appendChild(btn);
    });

    mount.appendChild(list);
    mount.appendChild(detail);
    show(COMPONENTS[0], false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
