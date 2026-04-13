(function loadAnalytics() {
  const hostname = window.location.hostname;
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "";

  window.plausible =
    window.plausible ||
    function plausibleProxy() {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };

  if (isLocalHost) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = hostname;
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);
})();
