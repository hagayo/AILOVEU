(() => {
  'use strict';

  const CONSENT_KEY = 'dailyMovingCookieConsent';
  const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const LEAD_ENDPOINT = "https://lecture-registrations.hagayo.workers.dev";
  
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navLinks = document.querySelector('[data-nav-links]');
  const header = document.querySelector('[data-header]');
  const form = document.querySelector('[data-lead-form]');
  const statusEl = document.querySelector('[data-form-status]');
  const banner = document.getElementById('cookie-banner');
  const acceptButtons = document.querySelectorAll('[data-accept-cookies], .video-consent-button');
  const rejectButtons = document.querySelectorAll('[data-reject-cookies]');
  const settingsButtons = document.querySelectorAll('[data-open-cookie-settings]');
  let returnFocusTo = null;

  function closeNav() {
    if (!navToggle || !navLinks) return;
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
        closeNav();
        navToggle.focus();
      }
    });
  }

  window.addEventListener('scroll', () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }, { passive: true });

  function readConsent() {
    try {
      const consent = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (!consent || typeof consent.externalMedia !== 'boolean' || !consent.savedAt) return null;

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
      // Keep the current-page behavior even when localStorage is blocked.
    }
  }

  function loadExternalMedia() {
    document.querySelectorAll('iframe[data-src]').forEach((frame) => {
      frame.src = frame.dataset.src;
      frame.hidden = false;
    });

    document.querySelectorAll('[data-video-consent]').forEach((placeholder) => {
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
    banner.querySelector('button')?.focus();
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

  acceptButtons.forEach((button) => button.addEventListener('click', acceptExternalMedia));
  rejectButtons.forEach((button) => button.addEventListener('click', rejectExternalMedia));
  settingsButtons.forEach((button) => button.addEventListener('click', () => showBanner(true)));

  const consent = readConsent();
  if (consent?.externalMedia) {
    loadExternalMedia();
  } else if (!consent) {
    showBanner();
  }


  function loadLazyVideo(video) {
    if (!video || video.dataset.loaded === 'true') return;

    video.querySelectorAll('source[data-src]').forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
    });

    video.load();
    video.dataset.loaded = 'true';
  }

  function initLazyVideos() {
    const lazyVideos = document.querySelectorAll('video[data-lazy-video]');
    if (!lazyVideos.length) return;

    if (!('IntersectionObserver' in window)) {
      lazyVideos.forEach(loadLazyVideo);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadLazyVideo(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '600px 0px',
      threshold: 0.01
    });

    lazyVideos.forEach((video) => observer.observe(video));
  }

  initLazyVideos();
  if (form && statusEl) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.className = 'form-status';

    if (!form.checkValidity()) {
      statusEl.textContent = 'חסרים כמה פרטים. נא למלא שם, אימייל, טלפון ואישור מדיניות הפרטיות.';
      statusEl.classList.add('error');
      form.reportValidity();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const payload = {
      requestId: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      requestedDate: String(formData.get('requestedDate') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      participantCount: String(formData.get('participants') || '').trim(),
      privacyConsent: formData.get('consent') === 'on',
      message: String(formData.get('message') || '').trim(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      lectureName: 'זזים בעבודה',
      source: 'zazim-landing-page'
    };

    try {
      if (submitButton) submitButton.disabled = true;
      statusEl.textContent = 'שולח...';

      const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || 'form_submit_failed');
      }

      statusEl.textContent = 'תודה! הפרטים נקלטו - נחזור אליך בתוך 48 שעות.';
      statusEl.classList.add('success');
      form.reset();
    } catch (error) {
      console.error(error);
      statusEl.textContent = 'משהו השתבש בשליחה. אפשר לנסות שוב או לשלוח ווטסאפ.';
      statusEl.classList.add('error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
  }
})();
