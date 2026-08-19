(() => {
  "use strict";

  const CONSENT_KEY = "dailyMovingCookieConsent";
  const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const banner = document.getElementById("cookie-banner");
  const acceptButtons = document.querySelectorAll("[data-accept-cookies], .video-consent-button");
  const rejectButtons = document.querySelectorAll("[data-reject-cookies]");
  const settingsButtons = document.querySelectorAll("[data-open-cookie-settings]");
  const topbar = document.querySelector(".topbar");
  const navToggle = document.querySelector(".nav-toggle");
  const primaryNav = document.getElementById("primary-nav");
  let returnFocusTo = null;

  if (topbar && navToggle && primaryNav) {
    topbar.classList.add("nav-enhanced");
    primaryNav.dataset.open = "false";

    function setNav(open) {
      primaryNav.dataset.open = String(open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.querySelector(".sr-only").textContent = open ? "סגירת תפריט ניווט" : "פתיחת תפריט ניווט";
    }

    navToggle.addEventListener("click", () => {
      setNav(primaryNav.dataset.open !== "true");
    });

    primaryNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setNav(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && primaryNav.dataset.open === "true") {
        setNav(false);
        navToggle.focus();
      }
    });
  }

  function readConsent() {
    try {
      const consent = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (!consent || typeof consent.externalMedia !== "boolean" || !consent.savedAt) {
        return null;
      }

      if (Date.now() - consent.savedAt > CONSENT_MAX_AGE) {
        localStorage.removeItem(CONSENT_KEY);
        return null;
      }

      return consent;
    } catch (error) {
      return null;
    }
  }

  function saveConsent(externalMedia) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ externalMedia, savedAt: Date.now() }));
    } catch (error) {
      // The choice still applies for the current page when storage is unavailable.
    }
  }

  function loadExternalMedia() {
    document.querySelectorAll("iframe[data-src]").forEach((frame) => {
      frame.src = frame.dataset.src;
      frame.hidden = false;
    });

    document.querySelectorAll("[data-video-consent]").forEach((placeholder) => {
      placeholder.hidden = true;
    });
  }

  function closeBanner() {
    if (!banner) return;
    banner.hidden = true;

    if (returnFocusTo) {
      returnFocusTo.focus();
      returnFocusTo = null;
    }
  }

  function showBanner(restoreFocus = false) {
    if (!banner) return;
    if (restoreFocus) returnFocusTo = document.activeElement;
    banner.hidden = false;
    banner.querySelector("button")?.focus();
  }

  function acceptExternalMedia() {
    saveConsent(true);
    loadExternalMedia();
    closeBanner();
  }

  function rejectExternalMedia() {
    saveConsent(false);
    closeBanner();
  }

  acceptButtons.forEach((button) => button.addEventListener("click", acceptExternalMedia));
  rejectButtons.forEach((button) => button.addEventListener("click", rejectExternalMedia));
  settingsButtons.forEach((button) => button.addEventListener("click", () => showBanner(true)));

  const consent = readConsent();
  if (consent?.externalMedia) {
    loadExternalMedia();
  } else if (!consent) {
    showBanner();
  }

  document.querySelectorAll(".count-strip").forEach((strip) => strip.classList.add("filled"));

  document.querySelectorAll("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      if (status) {
        status.textContent = "תודה! הפנייה נקלטה - נחזור אליך בתוך 48 שעות.";
        status.focus?.();
      }
      form.reset();
    });
  });
})();
