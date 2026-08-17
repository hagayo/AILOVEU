(() => {
  'use strict';

  const GA_MEASUREMENT_ID = 'G-W66TTCB8BH';
  const CONSENT_KEY = 'dailyMovingCookieConsent';
  const ATTRIBUTION_ID_KEY = 'zazimAttributionId';
  const FIRST_TOUCH_KEY = 'zazimFirstTouch';
  let analyticsLoaded = false;

  function hasAnalyticsConsent() {
    try {
      const consent = JSON.parse(localStorage.getItem(CONSENT_KEY));
      return consent?.externalMedia === true;
    } catch (error) {
      return false;
    }
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `zazim-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function getAttributionId() {
    try {
      let value = localStorage.getItem(ATTRIBUTION_ID_KEY);
      if (!value) {
        value = createId();
        localStorage.setItem(ATTRIBUTION_ID_KEY, value);
      }
      return value;
    } catch (error) {
      return createId();
    }
  }

  function getFirstTouch() {
    const params = new URLSearchParams(window.location.search);
    try {
      const existing = JSON.parse(localStorage.getItem(FIRST_TOUCH_KEY));
      if (existing?.landingPage) return existing;
    } catch (error) {
      // Re-create attribution data below if stored JSON is invalid.
    }

    const firstTouch = {
      landingPage: window.location.href,
      referrer: document.referrer || '',
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmContent: params.get('utm_content') || '',
      utmTerm: params.get('utm_term') || '',
      gclid: params.get('gclid') || '',
      fbclid: params.get('fbclid') || ''
    };

    try {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(firstTouch));
    } catch (error) {
      // Attribution still works for the current page if storage is unavailable.
    }
    return firstTouch;
  }

  function getGoogleAnalyticsClientId(timeoutMs = 800) {
    return new Promise((resolve) => {
      if (!analyticsLoaded || typeof window.gtag !== 'function') {
        resolve('');
        return;
      }

      let settled = false;
      const finish = (value = '') => {
        if (settled) return;
        settled = true;
        resolve(value || '');
      };

      window.setTimeout(() => finish(''), timeoutMs);
      try {
        window.gtag('get', GA_MEASUREMENT_ID, 'client_id', finish);
      } catch (error) {
        finish('');
      }
    });
  }

  async function getSiteAttribution() {
    const firstTouch = getFirstTouch();
    const gaClientId = await getGoogleAnalyticsClientId();
    return {
      attributionId: getAttributionId(),
      gaClientId,
      ...firstTouch
    };
  }

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  function trackEvent(eventName, params = {}) {
    if (!analyticsLoaded || typeof window.gtag !== 'function') return false;

    window.gtag('event', eventName, {
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search,
      ...params
    });
    return true;
  }

  window.enableSiteAnalytics = loadAnalytics;
  window.trackSiteEvent = trackEvent;
  window.getSiteAttribution = getSiteAttribution;

  getFirstTouch();

  if (hasAnalyticsConsent()) {
    loadAnalytics();
  }
})();
