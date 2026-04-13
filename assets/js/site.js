const navItems = [
  { id: "home", label: "Home", href: "index.html" },
  { id: "product", label: "Product", href: "product.html" },
  { id: "proof", label: "Proof", href: "proof.html" },
  { id: "how-it-works", label: "How It Works", href: "how-it-works.html" },
  { id: "examples", label: "Examples", href: "examples.html" },
  { id: "pricing", label: "Pricing", href: "pricing.html" },
  { id: "blog", label: "Blog", href: "blog.html" },
  { id: "faq", label: "FAQ", href: "faq.html" },
  { id: "contact", label: "Contact", href: "contact.html" }
];

function getBasePath() {
  return window.location.pathname.includes("/blog/") ? "../" : "";
}

function detectOperatingSystem() {
  const userAgentData = navigator.userAgentData;
  const platformSource =
    (userAgentData && userAgentData.platform) ||
    navigator.platform ||
    navigator.userAgent ||
    "";
  const userAgent = navigator.userAgent || "";
  const platform = platformSource.toLowerCase();
  const ua = userAgent.toLowerCase();

  if (platform.includes("win")) {
    return {
      name: "Windows",
      shell: "Command Prompt",
      path: "C:\\Users\\operator",
      line: "C:\\Users\\operator> mnde.exe --verify --runtime preflight",
      detail: "policy receipt loaded"
    };
  }

  if (platform.includes("mac") || ua.includes("mac os x")) {
    return {
      name: "macOS",
      shell: "Terminal",
      path: "operator@system ~ %",
      line: "operator@system ~ % ./mnde --verify --runtime preflight",
      detail: "policy receipt loaded"
    };
  }

  if (platform.includes("iphone") || platform.includes("ipad") || ua.includes("iphone") || ua.includes("ipad")) {
    return {
      name: "iOS",
      shell: "Mobile Shell",
      path: "iphone:~ mobile$",
      line: "iphone:~ mobile$ mnde --verify --runtime preflight",
      detail: "policy receipt loaded"
    };
  }

  if (ua.includes("android")) {
    return {
      name: "Android",
      shell: "Termux",
      path: "u0_a201@device:~$",
      line: "u0_a201@device:~$ mnde --verify --runtime preflight",
      detail: "policy receipt loaded"
    };
  }

  if (platform.includes("linux") || ua.includes("linux") || ua.includes("x11")) {
    return {
      name: "Linux",
      shell: "Shell",
      path: "operator@host:~$",
      line: "operator@host:~$ ./mnde --verify --runtime preflight",
      detail: "policy receipt loaded"
    };
  }

  return {
    name: "System",
    shell: "Shell",
    path: "operator:~$",
    line: "operator:~$ mnde --verify --runtime preflight",
    detail: "policy receipt loaded"
  };
}

function trackEvent(eventName, props) {
  if (typeof window.plausible !== "function") return;
  if (props && Object.keys(props).length > 0) {
    window.plausible(eventName, { props });
    return;
  }

  window.plausible(eventName);
}

function setupOpeningSequence() {
  if (sessionStorage.getItem("mnde-intro-seen") === "1") {
    return;
  }

  const os = detectOperatingSystem();
  const overlay = document.createElement("div");
  overlay.className = "intro-overlay";
  overlay.innerHTML = `
    <div class="intro-terminal" role="dialog" aria-label="MNDe startup sequence" aria-modal="true">
      <div class="intro-terminal-bar">
        <span></span>
        <span></span>
        <span></span>
        <strong>${os.shell} / ${os.name}</strong>
      </div>
      <div class="intro-terminal-body">
        <p class="intro-terminal-path">${os.path}</p>
        <p class="intro-terminal-command">${os.line}<span class="intro-cursor"></span></p>
        <p class="intro-terminal-output">[mnde] deterministic boundary online</p>
        <p class="intro-terminal-output">[mnde] ${os.detail}</p>
        <p class="intro-terminal-output">[mnde] signing channel ready</p>
      </div>
    </div>
  `;

  document.body.classList.add("intro-active");
  document.body.appendChild(overlay);

  trackEvent("Opening Sequence", {
    os: os.name,
    page: document.body.dataset.page || "unknown"
  });

  const dismissIntro = () => {
    overlay.classList.add("is-hidden");
    document.body.classList.remove("intro-active");
    sessionStorage.setItem("mnde-intro-seen", "1");
    window.setTimeout(() => {
      overlay.remove();
    }, 500);
  };

  window.setTimeout(dismissIntro, 2400);
  overlay.addEventListener("click", dismissIntro, { once: true });
}

function renderHeader() {
  const header = document.querySelector('[data-include="header"]');
  if (!header) return;

  const basePath = getBasePath();
  const page = document.body.dataset.page;

  header.innerHTML = `
    <div class="container nav-shell">
      <a class="brand" href="${basePath}index.html" aria-label="MNDe home">
        <span class="brand-mark">M</span>
        <span class="brand-text">
          <strong>MNDe</strong>
          <span>Deterministic execution control</span>
        </span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Toggle navigation">
        Menu
      </button>
      <nav class="nav-links" aria-label="Primary"></nav>
    </div>
  `;

  const nav = header.querySelector(".nav-links");
  nav.innerHTML = navItems
    .map((item) => {
      const active = item.id === page ? "is-active" : "";
      return `<a class="${active}" href="${basePath}${item.href}" data-plausible-event="Nav Click" data-track-group="nav" data-track-label="${item.label}">${item.label}</a>`;
    })
    .join("");

  const toggle = header.querySelector(".nav-toggle");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function renderFooter() {
  const footer = document.querySelector('[data-include="footer"]');
  if (!footer) return;

  footer.innerHTML = `
    <div class="container footer-shell">
      <div class="footer-copy">
        <strong>MNDe</strong>
        <span>Deterministic execution control</span>
        <a href="mailto:mndesystems@gmail.com">Email: mndesystems@gmail.com</a>
      </div>
    </div>
  `;
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16
    }
  );

  items.forEach((item) => observer.observe(item));
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");

  if (!form || !note) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const subject = encodeURIComponent(`MNDe inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

    trackEvent("Contact Form Submit", {
      page: document.body.dataset.page || "unknown"
    });

    note.textContent = "Opening your email client.";
    window.location.href = `mailto:mndesystems@gmail.com?subject=${subject}&body=${body}`;
  });
}

function setupTracking() {
  const currentPage = document.body.dataset.page || "unknown";

  document.querySelectorAll(".button").forEach((button) => {
    button.setAttribute("data-track-group", "cta");
    button.setAttribute("data-track-label", button.textContent.trim());
  });

  document.querySelectorAll(".blog-card a").forEach((link) => {
    link.setAttribute("data-track-group", "blog");
    link.setAttribute("data-track-label", link.textContent.trim());
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.setAttribute("data-track-group", "contact");
    link.setAttribute("data-track-label", "Email Click");
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-track-group]");
    if (!target) return;

    const group = target.getAttribute("data-track-group");
    const label = target.getAttribute("data-track-label") || target.textContent.trim();
    const href = target.getAttribute("href") || "";

    if (group === "nav") {
      trackEvent("Nav Click", {
        label,
        from: currentPage,
        to: href
      });
      return;
    }

    if (group === "cta") {
      trackEvent("CTA Click", {
        label,
        page: currentPage
      });
      return;
    }

    if (group === "blog") {
      trackEvent("Blog Post Click", {
        label,
        page: currentPage
      });
      return;
    }

    if (group === "contact") {
      trackEvent("Email Click", {
        page: currentPage
      });
    }
  });
}

setupOpeningSequence();
renderHeader();
renderFooter();
setupReveal();
setupContactForm();
setupTracking();
