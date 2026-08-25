/* MNDe Examples page (classic script, CSP-safe).
 *
 * Selectable scenarios drive the shared simulator. Selecting a scenario fills
 * the inputs and triggers a real /api/simulate call; changing the inputs
 * afterwards produces a new real decision. The scenario card reflects the live
 * decision and prevented outcome returned by the server.
 */
(function () {
  "use strict";

  var SCENARIOS = {
    "ci-runaway": {
      title: "CI runaway",
      input: { gpu_count: 4, hours: 96, retries: 20, cost_per_hour: 12 },
      risk: "A stuck CI job retries for days, quietly multiplying spend on idle runners."
    },
    "gpu-over-allocation": {
      title: "GPU over-allocation",
      input: { gpu_count: 512, hours: 6, retries: 1, cost_per_hour: 45 },
      risk: "A training run requests far more accelerators than the budget authorizes."
    },
    "invalid-transaction": {
      title: "Invalid transaction",
      input: { gpu_count: 1, hours: 1, retries: 0, cost_per_hour: 3 },
      risk: "A small, well-formed request that stays within budget — the control must ALLOW it, not block everything."
    }
  };

  function money(n) {
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function init() {
    var tabs = document.getElementById("scenario-tabs");
    var meta = document.getElementById("scenario-meta");
    var simNode = document.querySelector("#examples-sim [data-sim]") || document.querySelector("#examples-sim");
    if (!tabs || !meta || !simNode) return;

    function renderMeta(key, liveDecision) {
      var s = SCENARIOS[key];
      meta.innerHTML = "";
      var dl = document.createElement("dl");
      dl.className = "scenario-facts";
      function row(label, value, cls) {
        var wrap = document.createElement("div");
        if (cls) wrap.className = cls;
        var dt = document.createElement("dt");
        dt.textContent = label;
        var dd = document.createElement("dd");
        if (value instanceof Node) dd.appendChild(value);
        else dd.textContent = value;
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        dl.appendChild(wrap);
      }
      var inp = s.input;
      row("Input", inp.gpu_count + " GPU × " + inp.hours + "h × " + money(inp.cost_per_hour) + "/h, " + inp.retries + " retries");
      row("Risk", s.risk);
      if (liveDecision && liveDecision.ok) {
        var chip = document.createElement("span");
        chip.className = "verdict " + (liveDecision.decision === "ALLOW" ? "verdict-allow" : "verdict-refuse");
        chip.textContent = liveDecision.decision;
        row("Decision", chip);
        row(
          "Prevented outcome",
          liveDecision.decision === "REFUSE"
            ? money(liveDecision.prevented_cost) + " of spend refused before execution"
            : "Within budget — allowed to execute"
        );
      } else {
        row("Decision", "running…");
        row("Prevented outcome", "—");
      }
      meta.appendChild(dl);
    }

    function select(key) {
      tabs.querySelectorAll("[data-scenario]").forEach(function (b) {
        var on = b.getAttribute("data-scenario") === key;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      renderMeta(key, null);
      if (simNode.mndeSim) simNode.mndeSim.setValues(SCENARIOS[key].input);
    }

    // Reflect every live result (scenario load or manual edit) in the card.
    simNode.addEventListener("mnde:sim", function (event) {
      var active = tabs.querySelector("[data-scenario].is-active");
      var key = active ? active.getAttribute("data-scenario") : "ci-runaway";
      renderMeta(key, event.detail && event.detail.data);
    });

    Object.keys(SCENARIOS).forEach(function (key) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scenario-tab";
      btn.setAttribute("data-scenario", key);
      btn.setAttribute("role", "tab");
      btn.textContent = SCENARIOS[key].title;
      btn.addEventListener("click", function () {
        select(key);
      });
      tabs.appendChild(btn);
    });

    // Wait until the simulator has mounted (it exposes node.mndeSim), then
    // select the first scenario.
    function start() {
      if (simNode.mndeSim) {
        select("ci-runaway");
      } else {
        window.setTimeout(start, 30);
      }
    }
    start();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
