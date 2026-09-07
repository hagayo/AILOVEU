(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Mobile nav
  const toggle = $(".nav-toggle");
  const links = $(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      if (!open) {
        try { closeAllDropdowns(); } catch {}
      }
    });
  }

// Mark current page in nav
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$(".nav-links a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });

  // Copy buttons for code blocks
  $$(".code").forEach(block => {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      const pre = $("pre", block);
      const text = pre ? pre.textContent : block.textContent;
      try {
        await navigator.clipboard.writeText(text.trim());
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      } catch {
        btn.textContent = "No access";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      }
    });
    block.appendChild(btn);
  });


  // Dropdowns (click-to-toggle; uses [hidden] so menus won't appear even if CSS fails to load)
  function closeAllDropdowns(exceptLi = null) {
    $$(".dropdown").forEach(li => {
      if (exceptLi && li === exceptLi) return;
      li.classList.remove("open");
      const btn = $(".dropdown-toggle", li);
      if (btn) btn.setAttribute("aria-expanded", "false");
      const menu = $(".dropdown-menu", li);
      if (menu) menu.hidden = true;
    });
  }

  // Ensure all menus start hidden
  $$(".dropdown-menu").forEach(m => (m.hidden = true));

  $$(".dropdown-toggle").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const li = btn.closest(".dropdown");
      if (!li) return;

      const menu = $(".dropdown-menu", li);
      const willOpen = !li.classList.contains("open");

      closeAllDropdowns(li);

      li.classList.toggle("open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
      if (menu) menu.hidden = !willOpen;
    });
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target && (target.closest && target.closest(".dropdown"))) return;
    closeAllDropdowns();
  });



  // Home: copy buttons
  $$(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const sel = btn.getAttribute("data-copy");
      const el = sel ? document.querySelector(sel) : null;
      if (!el) return;

      const text = el.innerText.trim();
      try {
        await navigator.clipboard.writeText(text);
        const prev = btn.textContent;
        btn.textContent = "הועתק ✓";
        setTimeout(() => (btn.textContent = prev), 1200);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        const prev = btn.textContent;
        btn.textContent = "הועתק ✓";
        setTimeout(() => (btn.textContent = prev), 1200);
      }
    });
  });

  // Home: rotate one command/output (Terminal variant)
  if (document.body.classList.contains("home-terminal")) {
    const cmdEl = document.querySelector("[data-rotate-cmd]");
    const outEl = document.querySelector("[data-rotate-out]");
    const pairs = [
      { cmd: "curl -s http://localhost:8080/health", out: '{"status":"ok"}' },
      { cmd: "curl -s http://localhost:8080/docs", out: "OpenAPI UI (Swagger) ✓" },
      { cmd: "docker run -p 8080:8080 notes-api:local", out: "Serving on :8080 ✓" },
      { cmd: "curl -s http://localhost:8080/api/v1/rag?q=...", out: '{"answer":"...","sources":[...]}' }
    ];
    let i = 0;
    if (cmdEl && outEl) {
      setInterval(() => {
        i = (i + 1) % pairs.length;
        cmdEl.textContent = pairs[i].cmd;
        outEl.textContent = pairs[i].out;
      }, 2800);
    }
  }


  // External links open in new tab (optional)
  $$('a[href^="http"]').forEach(a => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noreferrer");
  });
})();
