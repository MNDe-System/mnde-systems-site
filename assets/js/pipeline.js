/* MNDe "How it works" pipeline (classic script, CSP-safe).
 *
 * A clickable four-step boundary: request → validation → decision →
 * execution/refusal. Each step shows its input, transformations, checks,
 * failure conditions, and output. Not passive text — the user drives it.
 */
(function () {
  "use strict";

  var STEPS = [
    {
      name: "Request",
      summary: "An agent asks to perform a specific, consequential action.",
      input: "Raw action request: gpu_count, hours, retries, cost_per_hour.",
      transforms: "Fields are read as typed JSON. Nothing is inferred or defaulted silently.",
      checks: "Content-Type must be application/json; body size is bounded.",
      failure: "Malformed body or wrong content type is rejected (400 / 415).",
      output: "A candidate request object, not yet trusted."
    },
    {
      name: "Validation",
      summary: "The request is strictly validated and normalized.",
      input: "The candidate request object.",
      transforms: "Each field is range-checked; unknown fields are rejected; numbers must be finite.",
      checks: "gpu_count 0–4096 (int), hours 0–8760, retries 0–1000 (int), cost_per_hour 0–100000.",
      failure: "Any violation returns 422 with a stable error code and never proceeds to a decision.",
      output: "A normalized, canonicalized request and its request_hash."
    },
    {
      name: "Decision",
      summary: "A deterministic ALLOW or REFUSE is computed from policy.",
      input: "The validated request and the authoritative cost policy (limit $5000).",
      transforms: "total_cost = gpu_count × hours × cost_per_hour × (1 + retries); compared to the limit.",
      checks: "decision = ALLOW if total_cost ≤ limit, else REFUSE. Reason codes are attached.",
      failure: "Any internal error fails closed — an error is returned, never ALLOW.",
      output: "decision, total/allowed/prevented cost, reason_codes, and a decision_hash."
    },
    {
      name: "Execution / Refusal",
      summary: "The action executes only if it was allowed; otherwise it is refused.",
      input: "The signed decision.",
      transforms: "On ALLOW, execution proceeds under the exact authorized parameters; on REFUSE, it stops.",
      checks: "The executed action must match the decided action — no drift between decision and act.",
      failure: "A REFUSE prevents spend before it is incurred; the prevented cost is recorded.",
      output: "Linked authorization + execution evidence you can verify offline."
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

  function detailRow(label, value) {
    return el("div", { class: "detail-row" }, [el("dt", { text: label }), el("dd", { text: value })]);
  }

  function init() {
    var mount = document.getElementById("pipeline");
    if (!mount) return;

    var track = el("div", { class: "lifecycle-track", role: "tablist", "aria-label": "Execution pipeline" });
    var detail = el("div", { class: "lifecycle-detail", role: "tabpanel", "aria-live": "polite" });

    function show(index, focus) {
      track.querySelectorAll(".lifecycle-step").forEach(function (step, i) {
        var selected = i === index;
        step.setAttribute("aria-selected", String(selected));
        step.setAttribute("tabindex", selected ? "0" : "-1");
      });
      var s = STEPS[index];
      detail.innerHTML = "";
      detail.appendChild(el("span", { class: "mono-label", text: "Step " + (index + 1) + " of " + STEPS.length }));
      detail.appendChild(el("h3", { text: s.name }));
      detail.appendChild(el("p", { class: "muted", text: s.summary }));
      detail.appendChild(el("dl", { class: "detail-rows" }, [
        detailRow("Input", s.input),
        detailRow("Transformations", s.transforms),
        detailRow("Checks", s.checks),
        detailRow("Failure conditions", s.failure),
        detailRow("Output", s.output)
      ]));
      if (focus) track.querySelector('[aria-selected="true"]').focus();
    }

    STEPS.forEach(function (s, index) {
      var step = el("button", {
        type: "button",
        class: "lifecycle-step",
        role: "tab",
        "aria-selected": index === 0 ? "true" : "false",
        tabindex: index === 0 ? "0" : "-1"
      }, [
        el("span", { class: "lifecycle-index", text: String(index + 1).padStart(2, "0") }),
        el("strong", { text: s.name })
      ]);
      step.addEventListener("click", function () { show(index, false); });
      step.addEventListener("keydown", function (event) {
        var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        show((index + keys[event.key] + STEPS.length) % STEPS.length, true);
      });
      track.appendChild(step);
    });

    mount.appendChild(track);
    mount.appendChild(detail);
    show(0, false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
