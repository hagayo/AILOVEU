(function () {
  'use strict';

  const STORAGE_KEY = 'particlesLabTutorialCompleted';
  const steps = [
    {
      title: 'Start with an image or text',
      desktop: 'Choose a demo, upload your own image, or create particle text.',
      mobile: 'Choose a demo, upload your own image, or create particle text.',
      targets: ['[data-tutorial-target="source"]']
    },
    {
      title: 'Bring the particles to life',
      desktop: 'Move the pointer across the canvas, then click to trigger an effect.',
      mobile: 'Drag across the canvas, then tap to trigger an effect.',
      targets: ['.stage']
    },
    {
      title: 'Create continuous motion',
      desktop: 'Choose another image to Morph, or use Effect Automation to create a repeating sequence.',
      mobile: 'Choose another image to Morph, or use Effect Automation to create a repeating sequence.',
      targets: ['[data-tutorial-target="morph"]', '[data-tutorial-target="automation"]'],
      open: '[data-tutorial-target="morph"]'
    }
  ];

  const launchButton = document.getElementById('tutorialButton');
  let card = null;
  let spotlights = [];
  let stepIndex = 0;
  let previousFocus = null;
  let disclosureState = new Map();

  function storageCompleted() {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch (error) { return false; }
  }

  function rememberCompletion() {
    try { localStorage.setItem(STORAGE_KEY, 'true'); }
    catch (error) { /* The tutorial remains usable when storage is unavailable. */ }
  }

  function isMobileInput() {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }

  function createCard() {
    card = document.createElement('section');
    card.className = 'tutorial-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'tutorialTitle');
    card.innerHTML = '<div class="tutorial-progress"></div>' +
      '<h2 id="tutorialTitle"></h2><p class="tutorial-copy"></p>' +
      '<div class="tutorial-actions"><button class="tutorial-skip" type="button">Skip</button>' +
      '<button class="tutorial-back" type="button">Back</button>' +
      '<button class="tutorial-next" type="button">Next</button></div>';
    card.querySelector('.tutorial-skip').addEventListener('click', function () { closeTutorial(true); });
    card.querySelector('.tutorial-back').addEventListener('click', function () { showStep(stepIndex - 1); });
    card.querySelector('.tutorial-next').addEventListener('click', function () {
      if (stepIndex === steps.length - 1) closeTutorial(true);
      else showStep(stepIndex + 1);
    });
    document.body.appendChild(card);
  }

  function getTargets(step) {
    return step.targets.map(function (selector) { return document.querySelector(selector); }).filter(Boolean);
  }

  function createSpotlights(count) {
    while (spotlights.length < count) {
      const spotlight = document.createElement('div');
      spotlight.className = 'tutorial-spotlight' + (spotlights.length ? ' secondary' : '');
      spotlight.setAttribute('aria-hidden', 'true');
      document.body.appendChild(spotlight);
      spotlights.push(spotlight);
    }
    spotlights.forEach(function (spotlight, index) { spotlight.hidden = index >= count; });
  }

  function targetRect(target) {
    const rect = target.getBoundingClientRect();
    const gap = 7;
    return {
      top: Math.max(5, rect.top - gap),
      left: Math.max(5, rect.left - gap),
      width: Math.min(window.innerWidth - Math.max(5, rect.left - gap) - 5, rect.width + gap * 2),
      height: Math.min(window.innerHeight - Math.max(5, rect.top - gap) - 5, rect.height + gap * 2)
    };
  }

  function positionCard(rect) {
    if (window.innerWidth <= 560) return;
    const gap = 18;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const candidates = [
      { left: rect.left - width - gap, top: rect.top },
      { left: rect.left + rect.width + gap, top: rect.top },
      { left: rect.left, top: rect.top + rect.height + gap },
      { left: rect.left, top: rect.top - height - gap }
    ];
    const fit = candidates.find(function (item) {
      return item.left >= 12 && item.top >= 12 && item.left + width <= window.innerWidth - 12 && item.top + height <= window.innerHeight - 12;
    }) || {
      left: Math.max(12, Math.min(window.innerWidth - width - 12, window.innerWidth * 0.5 - width * 0.5)),
      top: Math.max(12, Math.min(window.innerHeight - height - 12, window.innerHeight * 0.5 - height * 0.5))
    };
    card.style.left = fit.left + 'px';
    card.style.top = fit.top + 'px';
  }

  function positionTutorial() {
    if (!card) return;
    const targets = getTargets(steps[stepIndex]).filter(function (target) {
      const rect = target.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    });
    createSpotlights(targets.length);
    targets.forEach(function (target, index) {
      const rect = targetRect(target);
      const spotlight = spotlights[index];
      spotlight.style.top = rect.top + 'px';
      spotlight.style.left = rect.left + 'px';
      spotlight.style.width = rect.width + 'px';
      spotlight.style.height = rect.height + 'px';
    });
    if (targets.length) positionCard(targetRect(targets[0]));
  }

  function showStep(index) {
    stepIndex = Math.max(0, Math.min(steps.length - 1, index));
    const step = steps[stepIndex];
    if (step.open) {
      const disclosure = document.querySelector(step.open);
      if (disclosure) disclosure.open = true;
    }
    const targets = getTargets(step);
    if (targets[0] && stepIndex !== 1) targets[0].scrollIntoView({ block: 'nearest' });
    card.querySelector('.tutorial-progress').textContent = (stepIndex + 1) + ' of ' + steps.length;
    card.querySelector('h2').textContent = step.title;
    card.querySelector('.tutorial-copy').textContent = isMobileInput() ? step.mobile : step.desktop;
    card.querySelector('.tutorial-back').hidden = stepIndex === 0;
    card.querySelector('.tutorial-next').textContent = stepIndex === steps.length - 1 ? 'Start creating' : 'Next';
    requestAnimationFrame(positionTutorial);
    card.querySelector('.tutorial-next').focus();
  }

  function startTutorial() {
    if (card) return;
    previousFocus = document.activeElement;
    disclosureState = new Map();
    document.querySelectorAll('details').forEach(function (details) { disclosureState.set(details, details.open); });
    document.body.classList.add('tutorial-open');
    createCard();
    showStep(0);
  }

  function closeTutorial(completed) {
    if (!card) return;
    if (completed) rememberCompletion();
    disclosureState.forEach(function (open, details) { details.open = open; });
    spotlights.forEach(function (spotlight) { spotlight.remove(); });
    spotlights = [];
    card.remove();
    card = null;
    document.body.classList.remove('tutorial-open');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  function handleKeydown(event) {
    if (!card) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeTutorial(true);
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(card.querySelectorAll('button:not([hidden])'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  launchButton.addEventListener('click', startTutorial);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', positionTutorial);
  window.addEventListener('orientationchange', positionTutorial);
  if (!storageCompleted()) requestAnimationFrame(startTutorial);
})();
