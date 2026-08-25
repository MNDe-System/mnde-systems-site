/* MNDe API client (classic script, CSP-safe).
 *
 * Thin wrapper over the real backend endpoints. Every consequential decision is
 * computed server-side; the browser only sends input and renders the response.
 * Exposes window.MNDeApi.
 */
(function () {
  "use strict";

  async function postJson(path, body) {
    let response;
    try {
      response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (networkError) {
      return {
        ok: false,
        status: 0,
        data: { ok: false, error: { code: "NETWORK_ERROR", message: "Could not reach the server." } }
      };
    }
    let data = null;
    try {
      data = await response.json();
    } catch (_error) {
      data = { ok: false, error: { code: "BAD_RESPONSE", message: "Malformed server response." } };
    }
    return { ok: response.ok, status: response.status, data };
  }

  function track(name, props) {
    try {
      if (typeof window.plausible === "function") window.plausible(name, props ? { props } : undefined);
    } catch (_error) {
      /* analytics is best-effort */
    }
  }

  window.MNDeApi = {
    async simulate(input) {
      const result = await postJson("/api/simulate", input);
      track("Simulation Run", { decision: result.data && result.data.decision ? result.data.decision : "ERROR" });
      return result;
    },
    async contact(data) {
      const result = await postJson("/api/contact", data);
      track("Contact Submit", { status: result.ok ? "ok" : "error" });
      return result;
    },
    track
  };
})();
