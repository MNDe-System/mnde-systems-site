/* MNDe execution-cost simulator widget (classic script, CSP-safe).
 *
 * Mounts on any element with [data-sim] and prefilled data-* values, builds an
 * accessible input form + live output, and calls POST /api/simulate. The final
 * ALLOW/REFUSE decision is always computed server-side and rendered here — the
 * browser never decides. Exposes window.MNDeSimulator.mountAll().
 */
(function () {
  "use strict";

  var FIELDS = [
    { key: "gpu_count", label: "GPU count", step: "1", min: "0", max: "4096" },
    { key: "hours", label: "Runtime hours", step: "0.5", min: "0", max: "8760" },
    { key: "retries", label: "Retries", step: "1", min: "0", max: "1000" },
    { key: "cost_per_hour", label: "Cost per hour (USD)", step: "0.5", min: "0", max: "100000" }
  ];

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "class") node.className = attrs[k];
        else if (attrs[k] != null && attrs[k] !== false) node.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid == null) return;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function money(n) {
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function shortHash(h) {
    return h ? h.slice(0, 12) + "…" + h.slice(-6) : "—";
  }

  function readInputs(form) {
    var out = {};
    FIELDS.forEach(function (f) {
      var input = form.querySelector('[name="' + f.key + '"]');
      out[f.key] = input && input.value !== "" ? Number(input.value) : NaN;
    });
    return out;
  }

  function buildForm(mount, prefill) {
    var idBase = "sim-" + Math.random().toString(36).slice(2, 8);
    var form = el("form", { class: "sim-form", "data-sim-form": "", novalidate: "" });
    FIELDS.forEach(function (f) {
      var id = idBase + "-" + f.key;
      var field = el("div", { class: "sim-field" }, [
        el("label", { for: id, text: f.label }),
        el("input", {
          id: id,
          name: f.key,
          type: "number",
          inputmode: "decimal",
          step: f.step,
          min: f.min,
          max: f.max,
          value: String(prefill[f.key]),
          autocomplete: "off"
        })
      ]);
      form.appendChild(field);
    });
    var actions = el("div", { class: "sim-actions" }, [
      el("button", { type: "submit", class: "button button-primary", "data-track-group": "cta", "data-track-label": "Run simulation", text: "Run simulation" })
    ]);
    form.appendChild(actions);
    return form;
  }

  function renderOutput(out, result, variant) {
    out.innerHTML = "";
    if (!result.ok || !result.data || result.data.ok !== true) {
      var err = (result.data && result.data.error) || { code: "ERROR", message: "Simulation failed." };
      out.appendChild(el("div", { class: "sim-verdict is-error", role: "status" }, [
        el("span", { class: "sim-decision verdict verdict-refuse", text: "ERROR" }),
        el("span", { class: "sim-reason", text: err.code + ": " + err.message })
      ]));
      return;
    }

    var d = result.data;
    var allow = d.decision === "ALLOW";
    var verdict = el("div", { class: "sim-verdict " + (allow ? "is-allow" : "is-refuse") }, [
      el("span", {
        class: "sim-decision verdict " + (allow ? "verdict-allow" : "verdict-refuse"),
        text: d.decision
      })
    ]);
    out.appendChild(verdict);

    var stats = el("dl", { class: "sim-stats" }, [
      stat("Total cost", money(d.total_cost)),
      stat("Allowed cost", money(d.allowed_cost)),
      stat("Prevented cost", money(d.prevented_cost), allow ? null : "prevented")
    ]);
    out.appendChild(stats);

    var codes = el("div", { class: "sim-codes" }, d.reason_codes.map(function (c) {
      return el("span", { class: "chip", text: c });
    }));
    out.appendChild(el("div", { class: "sim-row" }, [el("span", { class: "sim-key", text: "Reason codes" }), codes]));

    if (variant !== "compact") {
      out.appendChild(hashRow("Request hash", d.request_hash));
      out.appendChild(hashRow("Decision hash", d.decision_hash));
    }

    // Short decision pulse, then settle.
    verdict.classList.add("pulse");
    window.setTimeout(function () {
      verdict.classList.remove("pulse");
    }, 650);
  }

  function stat(label, value, mod) {
    return el("div", { class: "sim-stat" + (mod ? " sim-stat-" + mod : "") }, [
      el("dt", { text: label }),
      el("dd", { text: value })
    ]);
  }

  function hashRow(label, value) {
    return el("div", { class: "sim-row" }, [
      el("span", { class: "sim-key", text: label }),
      el("code", { class: "sim-hash", title: value, text: shortHash(value) })
    ]);
  }

  function mount(node) {
    if (node.getAttribute("data-sim-ready") === "1") return;
    node.setAttribute("data-sim-ready", "1");

    var prefill = {
      gpu_count: Number(node.getAttribute("data-gpu") || 8),
      hours: Number(node.getAttribute("data-hours") || 4),
      retries: Number(node.getAttribute("data-retries") || 1),
      cost_per_hour: Number(node.getAttribute("data-cost") || 30)
    };
    var variant = node.getAttribute("data-variant") || "full";

    var form = buildForm(node, prefill);
    var out = el("div", { class: "sim-out", "data-sim-out": "", "aria-live": "polite" });
    node.appendChild(form);
    node.appendChild(out);

    var pending = null;
    function run() {
      var input = readInputs(form);
      out.classList.add("is-loading");
      var mine = {};
      pending = mine;
      window.MNDeApi.simulate(input).then(function (result) {
        if (pending !== mine) return; // a newer run superseded this one
        out.classList.remove("is-loading");
        renderOutput(out, result, variant);
        node.dispatchEvent(new CustomEvent("mnde:sim", { detail: result }));
      });
    }

    // Programmatic control for pages that drive the simulator (e.g. Examples).
    node.mndeSim = {
      setValues: function (values) {
        FIELDS.forEach(function (f) {
          if (values[f.key] != null) {
            var input = form.querySelector('[name="' + f.key + '"]');
            if (input) input.value = String(values[f.key]);
          }
        });
        run();
      }
    };

    var debounce = null;
    form.addEventListener("input", function () {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(run, 250);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      window.clearTimeout(debounce);
      run();
    });

    run(); // immediately visible result on load
  }

  function mountAll() {
    var nodes = document.querySelectorAll("[data-sim]");
    for (var i = 0; i < nodes.length; i += 1) mount(nodes[i]);
  }

  window.MNDeSimulator = { mountAll: mountAll };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }
})();
