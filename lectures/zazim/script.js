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

  // prepare small blue dots mouse-trail
  // ===================================
  // const numDots = 12;
  // const dots = [];
  // const mouse = { x: 0, y: 0 };

  // for (let i = 0; i < numDots; i++) {
    // const dot = document.createElement('div');
    // dot.className = 'trail-dot';
    // document.body.appendChild(dot);
    // dots.push({ x: 0, y: 0, element: dot });
  // }

  // window.addEventListener('mousemove', (e) => {
    // mouse.x = e.clientX;  mouse.y = e.clientY;
  // });

  // function animateTrail() {
    // let currentX = mouse.x;
    // let currentY = mouse.y;

    // dots.forEach((dot, index) => {
      // dot.x += (currentX - dot.x) * 0.3;
      // dot.y += (currentY - dot.y) * 0.3;
      
      // dot.element.style.left = `${dot.x}px`;
      // dot.element.style.top = `${dot.y}px`;
      
      // // Make trailing dots smaller and more transparent
      // const scale = (numDots - index) / numDots;
      // dot.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
      
      // currentX = dot.x;
      // currentY = dot.y;
    // });

    // requestAnimationFrame(animateTrail);
  // }
  // animateTrail();

  // prepare rainbow mouse trail 2
  // =============================
  // const numDots = 25; 
  // const dots = [];
  // const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  // let hue = 0;

  // for (let i = 0; i < numDots; i++) {
    // const dot = document.createElement('div');
    // dot.className = 'trail-dot';
    // document.body.appendChild(dot);
    // dots.push({ x: mouse.x, y: mouse.y, element: dot });
  // }

  // window.addEventListener('mousemove', (e) => {
    // mouse.x = e.clientX;
    // mouse.y = e.clientY;
  // });

  // function animateTrail() {
    // let currentX = mouse.x;
    // let currentY = mouse.y;
    
    // // Cycle slowly through colors (0-360)
    // hue = (hue + 0.5) % 360; 

    // dots.forEach((dot, index) => {
      // // Lower multiplier (0.15) makes the trail lag behind much slower
      // dot.x += (currentX - dot.x) * 0.15;
      // dot.y += (currentY - dot.y) * 0.15;
      
      // dot.element.style.left = `${dot.x}px`;
      // dot.element.style.top = `${dot.y}px`;
      
      // // Each dot gets a slightly different shade for a gradient effect
      // const dotHue = (hue + index * 4) % 360;
      // dot.element.style.backgroundColor = `hsla(${dotHue}, 85%, 65%, 0.8)`;
      
      // // Higher scale multiplier holds the visual weight longer before shrinking
      // const scale = ((numDots - index) / numDots) * 0.9 + 0.1;
      // dot.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
      
      // currentX = dot.x;
      // currentY = dot.y;
    // });

    // requestAnimationFrame(animateTrail);
  // }
  
  // animateTrail();

   // ========================================================
   // 1. Dynamic Canvas Mouse Trail Particles (Desktop Only)
   // ========================================================
  const canvas = document.getElementById('mouse-trail-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let isDesktop = window.matchMedia("(pointer: fine)").matches;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 1.2;
        this.speedY = (Math.random() - 0.5) * 1.2;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.015;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        if (this.size > 0.2) this.size -= 0.04;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 77, 0, ${this.life * 0.7})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 77, 0, 0.6)';
        ctx.fill();
        ctx.restore();
    }
  }

  if (isDesktop) {
    window.addEventListener('mousemove', (e) => {
        for (let i = 0; i < 2; i++) {
            particles.push(new Particle(e.clientX, e.clientY));
        }
    });

    function animateTrail() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0) particles.splice(i, 1);
        }
        requestAnimationFrame(animateTrail);
    }
    animateTrail();
  }

  /* ========================================================
   2. Interactive 3D Card Tilt Effect
   ======================================================== */
  if (isDesktop) {
    const cards3D = document.querySelectorAll('.card-3d');
    cards3D.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -9;
            const rotateY = ((x - centerX) / centerX) * 9;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s ease';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    });
  }

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
      // Ignore when localStorage is blocked.
    }
  }

  async function sendCookieConsent(decision) {
    const payload = {
      recordType: 'cookie-consent',
      requestId: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      decision,
      policyVersion: '2026-08-11',
      pagePath: window.location.href,
      storageMethod: 'local-storage',
      source: 'zazim-cookie-banner'
    };

    try {
      const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
       });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || 'cookie_consent_submit_failed');
      }
    } catch (error) {
      console.error('Cookie consent was not saved to the sheet:', error);
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
    sendCookieConsent('accepted');
    window.enableSiteAnalytics?.();
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
    const attribution = typeof window.getSiteAttribution === 'function'
      ? await window.getSiteAttribution()
      : {};

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
      source: 'zazim-landing-page',
      attributionId: attribution.attributionId || '',
      gaClientId: attribution.gaClientId || '',
      landingPage: attribution.landingPage || '',
      referrer: attribution.referrer || '',
      utmSource: attribution.utmSource || '',
      utmMedium: attribution.utmMedium || '',
      utmCampaign: attribution.utmCampaign || '',
      utmContent: attribution.utmContent || '',
      utmTerm: attribution.utmTerm || '',
      gclid: attribution.gclid || '',
      fbclid: attribution.fbclid || ''
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

      if (typeof window.trackSiteEvent === 'function') {
        window.trackSiteEvent('zazim_lecture_lead', {
          lead_source: payload.source,
          lecture_name: payload.lectureName
        });
      }

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
