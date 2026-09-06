(function () {
  'use strict';

  const MAX_PARTICLES = 24000;
  const MIN_PARTICLES = 250;
  const MIN_ALPHA = 40;
  const MAX_GLOW = 12;
  const MORPH_GRID_SIZE = 32;
  const DEFAULT_MORPH_DURATION = 1400;
  const MORPH_COLOR_STEPS = 32;
  const AUTO_MORPH_PAUSE = 2600;
  const DEFAULT_MORPH_STYLE = 'wave';
  const DEFAULT_CLICK_EFFECT = 'random';
  const RECORDING_FPS = 60;
  const DEFAULT_DENSITY = 1.00;
  const DEFAULT_PARTICLE_SIZE = 3.2;
  const DEFAULT_MOUSE_FORCE = 200;
  const DEFAULT_MOUSE_RADIUS = 220;
  const DEFAULT_SPRING = 0.010;
  const DEFAULT_DAMPING = 0.91;
  const DEFAULT_STYLE = 'cinematic';
  const DEFAULT_MOUSE_MODE = 'repel';
  const DEFAULT_EFFECT_SEQUENCE = ['sweep-wave', 'shatter', 'glitch-slices'];
  const CLICK_EFFECTS = [
    'mirror-rise', 'center-bloom', 'sweep-wave', 'letter-scramble',
    'shatter', 'vortex-line', 'glitch-slices', 'pixel-rain',
    'shockwave', 'spiral', 'explosion', 'implosion',
    'letter-spin', 'domino', 'elastic-stretch'
  ];
  const DEMO_PATHS = {
    astronaut: 'data/demos/astronaut.js',
    portrait: 'data/demos/portrait.js',
    wolf: 'data/demos/wolf.js',
    'cyberpunk-city': 'data/demos/cyberpunk-city.js',
    butterfly: 'data/demos/butterfly.js',
    galaxy: 'data/demos/galaxy.js'
  };
  const DEMO_LABELS = {
    astronaut: 'Astronaut', portrait: 'Portrait', wolf: 'Wolf',
    'cyberpunk-city': 'Cyberpunk City', butterfly: 'Butterfly', galaxy: 'Galaxy'
  };
  const DEMO_ASPECTS = {
    astronaut: 1200 / 1052, portrait: 1200 / 1055, wolf: 1200 / 1055,
    'cyberpunk-city': 1200 / 1030, butterfly: 1200 / 1030, galaxy: 1200 / 1028
  };

  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is not available.');

  const ui = {
    gallery: document.getElementById('gallery'),
    styles: document.getElementById('styleButtons'),
    mouseModes: document.getElementById('mouseModeButtons'),
    fileInput: document.getElementById('fileInput'),
    uploadButton: document.getElementById('uploadButton'),
    dropOverlay: document.getElementById('dropOverlay'),
    density: document.getElementById('density'),
    size: document.getElementById('particleSize'),
    force: document.getElementById('mouseForce'),
    radius: document.getElementById('mouseRadius'),
    spring: document.getElementById('spring'),
    damping: document.getElementById('damping'),
    densityOut: document.getElementById('densityOut'),
    sizeOut: document.getElementById('sizeOut'),
    forceOut: document.getElementById('forceOut'),
    radiusOut: document.getElementById('radiusOut'),
    springOut: document.getElementById('springOut'),
    dampingOut: document.getElementById('dampingOut'),
    morphSpeed: document.getElementById('morphSpeed'),
    morphSpeedOut: document.getElementById('morphSpeedOut'),
    morphStyles: document.getElementById('morphStyleButtons'),
    clickEffect: document.getElementById('clickEffectSelect'),
    playEffect: document.getElementById('playEffectButton'),
    particleText: document.getElementById('particleText'),
    textFont: document.getElementById('textFont'),
    textSize: document.getElementById('textSize'),
    textSizeOut: document.getElementById('textSizeOut'),
    textWeight: document.getElementById('textWeight'),
    textWeightHint: document.getElementById('textWeightHint'),
    fontWarning: document.getElementById('fontWarning'),
    textColorStart: document.getElementById('textColorStart'),
    textColorEnd: document.getElementById('textColorEnd'),
    gradientText: document.getElementById('gradientText'),
    rainbowText: document.getElementById('rainbowText'),
    createText: document.getElementById('createTextButton'),
    autoMorph: document.getElementById('autoMorphButton'),
    loopInterval: document.getElementById('loopInterval'),
    loopIntervalOut: document.getElementById('loopIntervalOut'),
    sequenceEffectSelect: document.getElementById('sequenceEffectSelect'),
    addSequenceEffect: document.getElementById('addSequenceEffectButton'),
    effectSequenceList: document.getElementById('effectSequenceList'),
    clearSequence: document.getElementById('clearSequenceButton'),
    sequenceOrder: document.getElementById('sequenceOrder'),
    automation: document.getElementById('automationButton'),
    export: document.getElementById('exportButton'),
    record: document.getElementById('recordButton'),
    reset: document.getElementById('resetButton'),
    status: document.getElementById('status'),
    hudImage: document.getElementById('hudImage'),
    hudStyle: document.getElementById('hudStyle'),
    hudParticles: document.getElementById('hudParticles'),
    hudFps: document.getElementById('hudFps')
  };

  const state = {
    width: 1, height: 1, dpr: 1,
    count: 0,
    density: DEFAULT_DENSITY,
    size: DEFAULT_PARTICLE_SIZE,
    mouseForce: DEFAULT_MOUSE_FORCE,
    mouseRadius: DEFAULT_MOUSE_RADIUS,
    spring: DEFAULT_SPRING,
    damping: DEFAULT_DAMPING,
    style: DEFAULT_STYLE,
    mouseMode: DEFAULT_MOUSE_MODE,
    currentDemo: 'astronaut',
    currentSource: null,
    currentSourceGroups: null,
    currentTextGroupCount: 0,
    currentPixelData: null,
    sampledWidth: 0, sampledHeight: 0,
    imageAspect: 1,
    mouseX: -9999, mouseY: -9999,
    prevMouseX: -9999, prevMouseY: -9999,
    mouseVX: 0, mouseVY: 0,
    pointerInside: false,
    lastTime: 0,
    fpsTime: 0,
    fpsFrames: 0,
    lazyScripts: new Map(),
    galaxyReady: false,
    galaxyX: null, galaxyY: null, galaxyA: null,
    cinematicGradient: null,
    morphing: false,
    morphStart: 0,
    morphColorStep: -1,
    morphDuration: DEFAULT_MORPH_DURATION,
    morphStyle: DEFAULT_MORPH_STYLE,
    activeMorphStyle: DEFAULT_MORPH_STYLE,
    clickEffect: DEFAULT_CLICK_EFFECT,
    effectBag: [],
    lastRandomEffect: '',
    effectAutomation: false,
    nextEffectTime: Infinity,
    sequenceIndex: 0,
    sequenceBag: [],
    sequenceSignature: '',
    lastSequenceEffect: '',
    effectSequence: DEFAULT_EFFECT_SEQUENCE.slice(),
    targetTextGroupCount: 0,
    autoMorph: false,
    nextAutoMorphTime: Infinity,
    recorder: null,
    recordingChunks: null,
    recordingStream: null
  };

  const x = new Float32Array(MAX_PARTICLES);
  const y = new Float32Array(MAX_PARTICLES);
  const vx = new Float32Array(MAX_PARTICLES);
  const vy = new Float32Array(MAX_PARTICLES);
  const tx = new Float32Array(MAX_PARTICLES);
  const ty = new Float32Array(MAX_PARTICLES);
  const txA = new Float32Array(MAX_PARTICLES);
  const tyA = new Float32Array(MAX_PARTICLES);
  const txB = new Float32Array(MAX_PARTICLES);
  const tyB = new Float32Array(MAX_PARTICLES);
  const depths = new Float32Array(MAX_PARTICLES);
  const glowValues = new Uint8Array(MAX_PARTICLES);
  const paletteIndex = new Uint16Array(MAX_PARTICLES);
  const paletteIndexA = new Uint16Array(MAX_PARTICLES);
  const paletteIndexB = new Uint16Array(MAX_PARTICLES);
  const glowA = new Uint8Array(MAX_PARTICLES);
  const glowB = new Uint8Array(MAX_PARTICLES);
  const particleGroup = new Int16Array(MAX_PARTICLES);
  const particleGroupA = new Int16Array(MAX_PARTICLES);
  const particleGroupB = new Int16Array(MAX_PARTICLES);
  const groupCenterX = new Float32Array(128);
  const groupCenterY = new Float32Array(128);
  const groupParticleCount = new Uint16Array(128);
  const morphAuxX = new Float32Array(MAX_PARTICLES);
  const morphAuxY = new Float32Array(MAX_PARTICLES);
  const morphPhase = new Float32Array(MAX_PARTICLES);
  const paletteNext = new Int32Array(MAX_PARTICLES);
  const paletteHead = new Int32Array(4096);
  const paletteCss = new Array(4096);
  particleGroup.fill(-1);
  particleGroupA.fill(-1);
  particleGroupB.fill(-1);

  function setStatus(message) { ui.status.textContent = message || ''; }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (width === state.width && height === state.height && dpr === state.dpr) return;
    state.width = width;
    state.height = height;
    state.dpr = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.cinematicGradient = ctx.createRadialGradient(width * .48, height * .42, 0, width * .48, height * .42, Math.max(width, height) * .72);
    state.cinematicGradient.addColorStop(0, 'rgba(20,31,48,.26)');
    state.cinematicGradient.addColorStop(1, 'rgba(4,6,10,.30)');
    if (state.currentSource) mapTargets(state.currentSource, false);
  }

  function mapTargets(source, animateNew) {
    const layout = createLayout(source, state.imageAspect);
    const desired = layout.count;
    const oldCount = state.count;
    state.morphing = false;
    state.count = desired;

    for (let i = 0; i < desired; i++) {
      tx[i] = layout.x[i];
      ty[i] = layout.y[i];
      paletteIndex[i] = layout.palette[i];
      glowValues[i] = layout.glow[i];
      particleGroup[i] = layout.groups[i];
      if (i >= oldCount) {
        x[i] = animateNew ? state.width * 0.5 : tx[i];
        y[i] = animateNew ? state.height * 0.5 : ty[i];
        vx[i] = animateNew ? (Math.random() - 0.5) * 8 : 0;
        vy[i] = animateNew ? (Math.random() - 0.5) * 8 : 0;
        depths[i] = ((i * 73) % 101) / 100;
      }
    }
    rebuildBuckets();
    buildPalette();
    state.currentTextGroupCount = layout.groupCount;
    ui.hudParticles.textContent = String(desired);
  }

  function createLayout(source, aspect) {
    const available = Math.min(MAX_PARTICLES, source.length >> 1);
    const densityCount = Math.floor(available * state.density);
    const count = Math.min(available, Math.max(MIN_PARTICLES, densityCount));
    const lx = new Float32Array(count);
    const ly = new Float32Array(count);
    const lp = new Uint16Array(count);
    const lg = new Uint8Array(count);
    const lgroups = new Int16Array(count);
    lgroups.fill(-1);
    const sourceGroups = source === state.currentSource ? state.currentSourceGroups : null;
    const pad = Math.min(state.width, state.height) * 0.10;
    const boxW = Math.max(10, state.width - pad * 2);
    const boxH = Math.max(10, state.height - pad * 2);
    const fitW = Math.min(boxW, boxH * aspect);
    const fitH = fitW / aspect;
    const actualH = fitH > boxH ? boxH : fitH;
    const actualW = fitH > boxH ? actualH * aspect : fitW;
    const ox = (state.width - actualW) * 0.5;
    const oy = (state.height - actualH) * 0.5;

    for (let i = 0; i < count; i++) {
      const sourceIndex = count === available
        ? i
        : Math.min(available - 1, Math.floor(i * available / count));
      const base = sourceIndex << 1;
      const packedXY = source[base];
      const packedRGB = source[base + 1];
      const r = packedRGB >>> 16;
      const g = (packedRGB >>> 8) & 255;
      const b = packedRGB & 255;
      lx[i] = ox + ((packedXY >>> 16) / 65535) * actualW;
      ly[i] = oy + ((packedXY & 0xffff) / 65535) * actualH;
      lp[i] = ((r >>> 4) << 8) | ((g >>> 4) << 4) | (b >>> 4);
      lg[i] = (MAX_GLOW * (54 * r + 183 * g + 19 * b)) >> 16;
      if (sourceGroups) lgroups[i] = sourceGroups[sourceIndex];
    }
    return { count, x: lx, y: ly, palette: lp, glow: lg, groups: lgroups, groupCount: state.currentSourceGroups ? state.targetTextGroupCount : 0 };
  }

  function copyUniformCurrentTargets(count) {
    const currentCount = state.count;
    const expanding = count > currentCount;
    const end = expanding ? -1 : count;
    const step = expanding ? -1 : 1;
    for (let i = expanding ? count - 1 : 0; i !== end; i += step) {
      const sourceIndex = count === currentCount
        ? i
        : Math.min(currentCount - 1, Math.floor(i * currentCount / count));
      txA[i] = tx[sourceIndex];
      tyA[i] = ty[sourceIndex];
      paletteIndexA[i] = paletteIndex[sourceIndex];
      glowA[i] = glowValues[sourceIndex];
      particleGroupA[i] = particleGroup[sourceIndex];
      if (sourceIndex !== i) {
        x[i] = x[sourceIndex];
        y[i] = y[sourceIndex];
        vx[i] = vx[sourceIndex];
        vy[i] = vy[sourceIndex];
        depths[i] = depths[sourceIndex];
        particleGroup[i] = particleGroup[sourceIndex];
      }
    }
  }

  function matchLayout(layout, count) {
    const heads = new Int32Array(MORPH_GRID_SIZE * MORPH_GRID_SIZE);
    const next = new Int32Array(count);
    const used = new Uint8Array(count);
    const sourceIndices = new Uint16Array(count);
    heads.fill(-1);
    for (let i = count - 1; i >= 0; i--) {
      const sourceIndex = count === layout.count
        ? i
        : Math.min(layout.count - 1, Math.floor(i * layout.count / count));
      sourceIndices[i] = sourceIndex;
      const gx = Math.min(MORPH_GRID_SIZE - 1, Math.max(0, Math.floor(layout.x[sourceIndex] / state.width * MORPH_GRID_SIZE)));
      const gy = Math.min(MORPH_GRID_SIZE - 1, Math.max(0, Math.floor(layout.y[sourceIndex] / state.height * MORPH_GRID_SIZE)));
      const cell = gy * MORPH_GRID_SIZE + gx;
      next[i] = heads[cell];
      heads[cell] = i;
    }

    for (let i = 0; i < count; i++) {
      const ax = txA[i];
      const ay = tyA[i];
      const cgx = Math.min(MORPH_GRID_SIZE - 1, Math.max(0, Math.floor(ax / state.width * MORPH_GRID_SIZE)));
      const cgy = Math.min(MORPH_GRID_SIZE - 1, Math.max(0, Math.floor(ay / state.height * MORPH_GRID_SIZE)));
      let best = -1;
      let bestDistance = Infinity;
      for (let radius = 0; radius < MORPH_GRID_SIZE && best < 0; radius++) {
        const minX = Math.max(0, cgx - radius);
        const maxX = Math.min(MORPH_GRID_SIZE - 1, cgx + radius);
        const minY = Math.max(0, cgy - radius);
        const maxY = Math.min(MORPH_GRID_SIZE - 1, cgy + radius);
        for (let gy = minY; gy <= maxY; gy++) {
          for (let gx = minX; gx <= maxX; gx++) {
            if (radius > 0 && gx > minX && gx < maxX && gy > minY && gy < maxY) continue;
            for (let candidate = heads[gy * MORPH_GRID_SIZE + gx]; candidate >= 0; candidate = next[candidate]) {
              if (used[candidate]) continue;
              const sourceIndex = sourceIndices[candidate];
              const dx = layout.x[sourceIndex] - ax;
              const dy = layout.y[sourceIndex] - ay;
              const distance = dx * dx + dy * dy;
              if (distance < bestDistance) {
                bestDistance = distance;
                best = candidate;
              }
            }
          }
        }
      }
      used[best] = 1;
      const matchedIndex = sourceIndices[best];
      txB[i] = layout.x[matchedIndex];
      tyB[i] = layout.y[matchedIndex];
      paletteIndexB[i] = layout.palette[matchedIndex];
      glowB[i] = layout.glow[matchedIndex];
      particleGroupB[i] = layout.groups[matchedIndex];
    }
  }

  function startMorph(source, aspect) {
    const layout = createLayout(source, aspect);
    if (!state.count) {
      state.imageAspect = aspect;
      mapTargets(source, false);
      return;
    }
    const count = layout.count;
    copyUniformCurrentTargets(count);
    matchLayout(layout, count);
    state.targetTextGroupCount = layout.groupCount;
    state.activeMorphStyle = state.morphStyle === 'random'
      ? ['direct', 'swirl', 'explode', 'wave', 'gravity'][(Math.random() * 5) | 0]
      : state.morphStyle;
    prepareMorphPath(count);
    state.count = count;
    state.morphStart = performance.now();
    state.morphColorStep = -1;
    state.morphing = true;
    ui.hudParticles.textContent = String(count);
  }

  function prepareMorphPath(count) {
    const cx = state.width * 0.5;
    const cy = state.height * 0.5;
    const burst = Math.max(state.width, state.height) * 0.42;
    for (let i = 0; i < count; i++) {
      const dx = txA[i] - cx;
      const dy = tyA[i] - cy;
      const distance = Math.max(1, Math.hypot(dx, dy));
      morphAuxX[i] = dx / distance * burst;
      morphAuxY[i] = dy / distance * burst;
      morphPhase[i] = txA[i] / state.width * Math.PI * 8 + tyA[i] / state.height * Math.PI * 2;
    }
  }

  function updateMorph(now) {
    if (!state.morphing) return;
    const linearT = Math.max(0, Math.min(1, (now - state.morphStart) / state.morphDuration));
    const morphT = linearT * linearT * (3 - 2 * linearT);
    const envelope = Math.sin(Math.PI * morphT);
    const style = state.activeMorphStyle;
    const cx = state.width * 0.5;
    const cy = state.height * 0.5;
    const swirlAngle = envelope * Math.PI * 1.35;
    const swirlCos = Math.cos(swirlAngle);
    const swirlSin = Math.sin(swirlAngle);
    for (let i = 0; i < state.count; i++) {
      const baseX = txA[i] + (txB[i] - txA[i]) * morphT;
      const baseY = tyA[i] + (tyB[i] - tyA[i]) * morphT;
      if (style === 'swirl') {
        const dx = baseX - cx;
        const dy = baseY - cy;
        tx[i] = cx + dx * swirlCos - dy * swirlSin;
        ty[i] = cy + dx * swirlSin + dy * swirlCos;
      } else if (style === 'explode') {
        tx[i] = baseX + morphAuxX[i] * envelope;
        ty[i] = baseY + morphAuxY[i] * envelope;
      } else if (style === 'wave') {
        const phase = morphPhase[i] + morphT * Math.PI * 4;
        tx[i] = baseX + Math.cos(phase) * state.width * 0.025 * envelope;
        ty[i] = baseY + Math.sin(phase) * state.height * 0.085 * envelope;
      } else if (style === 'gravity') {
        tx[i] = baseX + (depths[i] - 0.5) * state.width * 0.10 * envelope;
        ty[i] = baseY + state.height * (0.24 + depths[i] * 0.18) * envelope;
      } else {
        tx[i] = baseX;
        ty[i] = baseY;
      }
    }
    const colorStep = Math.min(MORPH_COLOR_STEPS - 1, Math.floor(morphT * MORPH_COLOR_STEPS));
    if (colorStep !== state.morphColorStep) {
      const colorT = colorStep / (MORPH_COLOR_STEPS - 1);
      for (let i = 0; i < state.count; i++) {
        const a = paletteIndexA[i];
        const b = paletteIndexB[i];
        const r = Math.round(((a >>> 8) & 15) + (((b >>> 8) & 15) - ((a >>> 8) & 15)) * colorT);
        const g = Math.round(((a >>> 4) & 15) + (((b >>> 4) & 15) - ((a >>> 4) & 15)) * colorT);
        const blue = Math.round((a & 15) + ((b & 15) - (a & 15)) * colorT);
        paletteIndex[i] = (r << 8) | (g << 4) | blue;
        glowValues[i] = Math.round(glowA[i] + (glowB[i] - glowA[i]) * colorT);
      }
      state.morphColorStep = colorStep;
      rebuildBuckets();
    }
    if (linearT === 1) {
      tx.set(txB.subarray(0, state.count));
      ty.set(tyB.subarray(0, state.count));
      paletteIndex.set(paletteIndexB.subarray(0, state.count));
      glowValues.set(glowB.subarray(0, state.count));
      particleGroup.set(particleGroupB.subarray(0, state.count));
      state.currentTextGroupCount = state.targetTextGroupCount;
      state.morphing = false;
      rebuildBuckets();
      scheduleAutoMorph(now);
    }
  }

  function rebuildBuckets() {
    paletteHead.fill(-1);
    for (let i = state.count - 1; i >= 0; i--) {
      const bucket = paletteIndex[i];
      paletteNext[i] = paletteHead[bucket];
      paletteHead[bucket] = i;
    }
  }

  function buildPalette() {
    for (let i = 0; i < 4096; i++) {
      let r = (((i >>> 8) & 15) << 4) + 8;
      let g = (((i >>> 4) & 15) << 4) + 8;
      let b = ((i & 15) << 4) + 8;
      if (state.style === 'neon') {
        const floor = Math.min(r, g, b) >> 1;
        r = Math.min(255, ((r - floor) << 1) + 24);
        g = Math.min(255, ((g - floor) << 1) + 24);
        b = Math.min(255, ((b - floor) << 1) + 24);
      } else if (state.style === 'cinematic') {
        r = Math.min(255, r * 1.06 + 8); g = Math.min(255, g * 1.03 + 4); b = Math.min(255, b * 1.10 + 10);
      } else if (state.style === 'galaxy') {
        r = Math.min(255, r * .66 + 55); g = Math.min(255, g * .82 + 28); b = Math.min(255, b * 1.12 + 36);
      }
      paletteCss[i] = `rgb(${r | 0},${g | 0},${b | 0})`;
    }
  }

  function useDemo(name) {
    const data = window.PARTICLE_DEMOS && window.PARTICLE_DEMOS[name];
    if (!(data instanceof Uint32Array)) throw new Error(`Demo data is unavailable: ${name}`);
    const nextAspect = DEMO_ASPECTS[name];
    state.currentPixelData = null;
    state.sampledWidth = 0;
    state.sampledHeight = 0;
    state.currentSource = data;
    state.currentSourceGroups = null;
    state.targetTextGroupCount = 0;
    state.imageAspect = nextAspect;
    state.currentDemo = name;
    startMorph(data, nextAspect);
    updateGallery(name);
    ui.hudImage.textContent = DEMO_LABELS[name];
    setStatus('');
  }

  function scheduleAutoMorph(now) {
    state.nextAutoMorphTime = state.autoMorph
      ? now + AUTO_MORPH_PAUSE
      : Infinity;
  }

  function runAutoMorph(now) {
    if (!state.autoMorph || state.morphing || state.lazyScripts.size || now < state.nextAutoMorphTime) return;
    const demoNames = Object.keys(DEMO_PATHS);
    const currentIndex = demoNames.indexOf(state.currentDemo);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % demoNames.length;
    state.nextAutoMorphTime = now + state.morphDuration + AUTO_MORPH_PAUSE;
    loadDemo(demoNames[nextIndex]);
  }

  function loadDemo(name) {
    if (window.PARTICLE_DEMOS && window.PARTICLE_DEMOS[name]) {
      useDemo(name);
      return;
    }
    if (state.lazyScripts.has(name)) return;
    const script = document.createElement('script');
    script.src = DEMO_PATHS[name];
    script.async = true;
    state.lazyScripts.set(name, script);
    setStatus(`Loading ${DEMO_LABELS[name]}…`);
    script.onload = function () {
      state.lazyScripts.delete(name);
      useDemo(name);
    };
    script.onerror = function () {
      state.lazyScripts.delete(name);
      setStatus(`Could not load ${DEMO_LABELS[name]}.`);
    };
    document.head.appendChild(script);
  }

  function updateGallery(name) {
    ui.gallery.querySelectorAll('[data-demo]').forEach(function (button) {
      const active = button.dataset.demo === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function ensureGalaxy() {
    if (state.galaxyReady) return;
    const n = 120;
    state.galaxyX = new Float32Array(n);
    state.galaxyY = new Float32Array(n);
    state.galaxyA = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      state.galaxyX[i] = Math.random();
      state.galaxyY[i] = Math.random();
      state.galaxyA[i] = 0.15 + Math.random() * 0.65;
    }
    state.galaxyReady = true;
  }

  function drawBackground(now) {
    if (state.style === 'faithful') {
      ctx.fillStyle = '#0b0e13';
      ctx.fillRect(0, 0, state.width, state.height);
      return;
    }
    if (state.style === 'neon') {
      ctx.fillStyle = 'rgba(3,7,14,.26)';
      ctx.fillRect(0, 0, state.width, state.height);
      return;
    }
    if (state.style === 'galaxy') {
      ensureGalaxy();
      ctx.fillStyle = 'rgba(3,5,12,.22)';
      ctx.fillRect(0, 0, state.width, state.height);
      const gx = state.galaxyX, gy = state.galaxyY, ga = state.galaxyA;
      ctx.fillStyle = '#dff7ff';
      for (let i = 0; i < gx.length; i++) {
        ctx.globalAlpha = ga[i] * (0.55 + Math.sin(now * 0.001 + i) * 0.35);
        ctx.fillRect(gx[i] * state.width, gy[i] * state.height, 1.2, 1.2);
      }
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = state.cinematicGradient || '#080b10';
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function simulate() {
    const radius = state.mouseRadius;
    const radiusSq = radius * radius;
    const forceScale = state.mouseForce * 0.0012;
    const spring = state.spring;
    const damping = state.damping;
    const mx = state.mouseX, my = state.mouseY;
    const mode = state.mouseMode;
    const fast = Math.min(3, Math.hypot(state.mouseVX, state.mouseVY) * 0.06);

    for (let i = 0; i < state.count; i++) {
      let ax = (tx[i] - x[i]) * spring;
      let ay = (ty[i] - y[i]) * spring;
      if (state.pointerInside) {
        const dx = x[i] - mx;
        const dy = y[i] - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < radiusSq && d2 > .01) {
          const d = Math.sqrt(d2);
          const falloff = 1 - d / radius;
          const f = falloff * forceScale * (1 + fast);
          if (mode === 'attract') {
            ax -= (dx / d) * f;
            ay -= (dy / d) * f;
          } else if (mode === 'flow') {
            ax += state.mouseVX * f * .08;
            ay += state.mouseVY * f * .08;
          } else if (mode === 'vortex') {
            ax += (-dy / d) * f;
            ay += (dx / d) * f;
          } else {
            ax += (dx / d) * f;
            ay += (dy / d) * f;
          }
        }
      }
      vx[i] = (vx[i] + ax) * damping;
      vy[i] = (vy[i] + ay) * damping;
      x[i] += vx[i];
      y[i] += vy[i];
    }
  }

  function render(now) {
    drawBackground(now);
    const size = state.size;
    const neon = state.style === 'neon';
    for (let bucket = 0; bucket < 4096; bucket++) {
      let i = paletteHead[bucket];
      if (i < 0) continue;
      ctx.fillStyle = paletteCss[bucket];
      while (i >= 0) {
        const depthScale = 0.72 + depths[i] * 0.55;
        const s = size * depthScale;
        if (neon && glowValues[i] > 0) {
          const halo = s + glowValues[i] * 0.45;
          ctx.globalAlpha = glowValues[i] / 40;
          ctx.fillRect(x[i] - halo * .5, y[i] - halo * .5, halo, halo);
          ctx.globalAlpha = 1;
        }
        ctx.fillRect(x[i] - s * .5, y[i] - s * .5, s, s);
        i = paletteNext[i];
      }
    }
  }

  function frame(now) {
    runAutoMorph(now);
    updateMorph(now);
    runEffectAutomation(now);
    simulate();
    render(now);
    state.fpsFrames++;
    if (now - state.fpsTime >= 500) {
      ui.hudFps.textContent = String(Math.round(state.fpsFrames * 1000 / (now - state.fpsTime)));
      state.fpsFrames = 0;
      state.fpsTime = now;
    }
    state.lastTime = now;
    requestAnimationFrame(frame);
  }

  function refillShuffleBag(values, lastEffect) {
    const bag = values.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const swap = bag[i];
      bag[i] = bag[j];
      bag[j] = swap;
    }
    if (bag.length > 1 && bag[bag.length - 1] === lastEffect) {
      const swap = bag[0];
      bag[0] = bag[bag.length - 1];
      bag[bag.length - 1] = swap;
    }
    return bag;
  }

  function takeRandomEffect() {
    if (!state.effectBag.length) state.effectBag = refillShuffleBag(CLICK_EFFECTS, state.lastRandomEffect);
    const effect = state.effectBag.pop();
    state.lastRandomEffect = effect;
    return effect;
  }

  function prepareGroupCenters() {
    const count = Math.min(groupCenterX.length, state.currentTextGroupCount);
    groupCenterX.fill(0, 0, count);
    groupCenterY.fill(0, 0, count);
    groupParticleCount.fill(0, 0, count);
    for (let i = 0; i < state.count; i++) {
      const group = particleGroup[i];
      if (group < 0 || group >= count) continue;
      groupCenterX[group] += x[i];
      groupCenterY[group] += y[i];
      groupParticleCount[group]++;
    }
    for (let group = 0; group < count; group++) {
      if (!groupParticleCount[group]) continue;
      groupCenterX[group] /= groupParticleCount[group];
      groupCenterY[group] /= groupParticleCount[group];
    }
    return count;
  }

  function magicMix(event, forcedEffect) {
    const rect = canvas.getBoundingClientRect();
    const cx = event ? event.clientX - rect.left : state.width * 0.5;
    const cy = event ? event.clientY - rect.top : state.height * 0.5;
    const requestedEffect = forcedEffect || state.clickEffect;
    const effect = requestedEffect === 'random' ? takeRandomEffect() : requestedEffect;
    const shockRadius = Math.min(state.width, state.height) * 0.28;
    const shockWidth = Math.max(35, shockRadius * 0.35);
    const letterEffect = ['letter-scramble', 'letter-spin', 'domino', 'pixel-rain'].includes(effect);
    const groupCount = letterEffect ? prepareGroupCenters() : 0;
    for (let i = 0; i < state.count; i++) {
      const dx = x[i] - cx;
      const dy = y[i] - cy;
      const d = Math.max(10, Math.hypot(dx, dy));
      const group = particleGroup[i];
      if (letterEffect && state.currentTextGroupCount && group < 0) continue;
      if (effect === 'mirror-rise') {
        const reflectedY = cy * 2 - y[i];
        vx[i] += (cx - x[i]) * 0.012;
        vy[i] += (reflectedY - y[i]) * 0.12;
      } else if (effect === 'center-bloom') {
        const normalizedDistance = Math.min(1, d / Math.max(1, Math.hypot(state.width, state.height) * 0.5));
        const f = 7 + normalizedDistance * 15;
        vx[i] += dx / d * f;
        vy[i] += dy / d * f;
      } else if (effect === 'explosion') {
        const f = 22 + Math.random() * 36;
        vx[i] += dx / d * f;
        vy[i] += dy / d * f;
      } else if (effect === 'implosion') {
        const f = 18 + Math.random() * 30;
        vx[i] -= dx / d * f;
        vy[i] -= dy / d * f;
      } else if (effect === 'shockwave') {
        const wave = Math.max(0, 1 - Math.abs(d - shockRadius) / shockWidth);
        const f = wave * 52;
        vx[i] += dx / d * f;
        vy[i] += dy / d * f;
      } else if (effect === 'spiral') {
        const f = 18 + Math.random() * 28;
        vx[i] += -dy / d * f;
        vy[i] += dx / d * f;
      } else if (effect === 'shatter') {
        const shardCount = 12;
        const angle = Math.atan2(dy, dx);
        const shard = Math.floor((angle + Math.PI) / (Math.PI * 2) * shardCount);
        const shardAngle = (shard + 0.5) / shardCount * Math.PI * 2 - Math.PI;
        const shardForce = 24 + (shard * 17 % 13);
        const twist = (shard & 1 ? 1 : -1) * 11;
        const shardX = Math.cos(shardAngle);
        const shardY = Math.sin(shardAngle);
        vx[i] += shardX * shardForce - shardY * twist;
        vy[i] += shardY * shardForce + shardX * twist;
      } else if (effect === 'sweep-wave') {
        const phase = x[i] / Math.max(1, state.width) * Math.PI * 3;
        vx[i] += 10;
        vy[i] += Math.sin(phase) * 42;
      } else if (effect === 'letter-scramble') {
        if (groupCount && group >= 0) {
          let targetGroup = (group * 7 + 3) % groupCount;
          for (let attempt = 0; attempt < groupCount && !groupParticleCount[targetGroup]; attempt++) {
            targetGroup = (targetGroup + 1) % groupCount;
          }
          vx[i] += (groupCenterX[targetGroup] - groupCenterX[group]) * 0.18;
          vy[i] += (groupCenterY[targetGroup] - groupCenterY[group]) * 0.18;
        } else {
          vx[i] += (state.width - x[i] * 2) * 0.12;
          vy[i] += (Math.sin(i * 0.71) * state.height * 0.12);
        }
      } else if (effect === 'glitch-slices') {
        const band = Math.floor(y[i] / Math.max(1, state.height) * 14);
        vx[i] += (band & 1 ? 1 : -1) * (24 + band % 4 * 8);
        vy[i] += ((i * 17) % 7 - 3) * 0.8;
      } else if (effect === 'letter-spin') {
        const centerX = groupCount && group >= 0 ? groupCenterX[group] : Math.floor(x[i] / 100) * 100 + 50;
        const centerY = groupCount && group >= 0 ? groupCenterY[group] : Math.floor(y[i] / 100) * 100 + 50;
        const localX = x[i] - centerX;
        const localY = y[i] - centerY;
        vx[i] += -localY * 0.34;
        vy[i] += localX * 0.34;
      } else if (effect === 'domino') {
        const order = groupCount && group >= 0 ? group / Math.max(1, groupCount - 1) : x[i] / Math.max(1, state.width);
        vx[i] += (order - 0.5) * 18;
        vy[i] += 18 + order * 44;
      } else if (effect === 'elastic-stretch') {
        vx[i] += (x[i] - cx) * 0.13;
        vy[i] -= (y[i] - cy) * 0.035;
      } else if (effect === 'pixel-rain') {
        const fall = 0.18 + ((i * 37) % 101) / 101 * 0.34;
        y[i] -= state.height * fall;
        vy[i] += 8 + fall * 20;
      } else if (effect === 'vortex-line') {
        const linePhase = x[i] / Math.max(1, state.width) * Math.PI * 6;
        vx[i] += Math.sin(linePhase) * 26;
        vy[i] += Math.cos(linePhase + y[i] * 0.025) * 34;
      }
    }
  }

  function getSelectedSequence() {
    return state.effectSequence.slice();
  }

  function resetSequenceProgress() {
    state.sequenceIndex = 0;
    state.sequenceBag = [];
    state.sequenceSignature = '';
    state.lastSequenceEffect = '';
  }

  function renderEffectSequence() {
    ui.effectSequenceList.textContent = '';
    state.effectSequence.forEach(function (effect, index) {
      const item = document.createElement('li');
      const label = document.createElement('span');
      const option = ui.sequenceEffectSelect.querySelector(`option[value="${effect}"]`);
      label.textContent = option ? option.textContent : effect;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${label.textContent} from position ${index + 1}`);
      remove.addEventListener('click', function () {
        state.effectSequence.splice(index, 1);
        resetSequenceProgress();
        renderEffectSequence();
      });
      item.append(label, remove);
      ui.effectSequenceList.appendChild(item);
    });
    ui.clearSequence.disabled = state.effectSequence.length === 0;
  }

  function populateSequenceEffectOptions() {
    ui.sequenceEffectSelect.textContent = '';
    ui.clickEffect.querySelectorAll('option').forEach(function (sourceOption) {
      if (sourceOption.value === DEFAULT_CLICK_EFFECT) return;
      const option = document.createElement('option');
      option.value = sourceOption.value;
      option.textContent = sourceOption.textContent;
      option.selected = sourceOption.value === DEFAULT_EFFECT_SEQUENCE[0];
      ui.sequenceEffectSelect.appendChild(option);
    });
  }

  function takeSequenceEffect(sequence) {
    if (ui.sequenceOrder.value === 'shuffle') {
      const signature = sequence.join('|');
      if (!state.sequenceBag.length || signature !== state.sequenceSignature) {
        state.sequenceBag = refillShuffleBag(sequence, state.lastSequenceEffect);
        state.sequenceSignature = signature;
      }
      const effect = state.sequenceBag.pop();
      state.lastSequenceEffect = effect;
      return effect;
    }
    const effect = sequence[state.sequenceIndex % sequence.length];
    state.sequenceIndex = (state.sequenceIndex + 1) % sequence.length;
    return effect;
  }

  function runEffectAutomation(now) {
    if (!state.effectAutomation || now < state.nextEffectTime) return;
    if (state.morphing) {
      state.nextEffectTime = now + 200;
      return;
    }
    const sequence = getSelectedSequence();
    if (!sequence.length) {
      stopEffectAutomation('Add at least one effect to the sequence.');
      return;
    }
    const effect = takeSequenceEffect(sequence);
    magicMix(null, effect);
    state.nextEffectTime = now + Number(ui.loopInterval.value) * 1000;
  }

  function stopEffectAutomation(message) {
    state.effectAutomation = false;
    state.nextEffectTime = Infinity;
    ui.automation.textContent = 'Start automation';
    ui.automation.classList.remove('active');
    ui.automation.setAttribute('aria-pressed', 'false');
    if (message) setStatus(message);
  }

  function toggleEffectAutomation() {
    if (state.effectAutomation) {
      stopEffectAutomation('');
      return;
    }
    if (!getSelectedSequence().length) {
      setStatus('Add at least one effect to the sequence.');
      return;
    }
    state.effectAutomation = true;
    resetSequenceProgress();
    state.nextEffectTime = performance.now();
    ui.automation.textContent = 'Stop automation';
    ui.automation.classList.add('active');
    ui.automation.setAttribute('aria-pressed', 'true');
    setStatus('');
  }

  function getRecordingMimeType() {
    const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (let i = 0; i < types.length; i++) {
      if (MediaRecorder.isTypeSupported(types[i])) return types[i];
    }
    return '';
  }

  function resetRecordingUi() {
    ui.record.textContent = 'Record WebM';
    ui.record.classList.remove('active');
    ui.record.setAttribute('aria-pressed', 'false');
  }

  function startRecording() {
    if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
      setStatus('WebM recording is not supported by this browser.');
      return;
    }
    const stream = canvas.captureStream(RECORDING_FPS);
    const mimeType = getRecordingMimeType();
    if (!mimeType) {
      stream.getTracks().forEach(function (track) { track.stop(); });
      setStatus('WebM recording is not supported by this browser.');
      return;
    }
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch (error) {
      stream.getTracks().forEach(function (track) { track.stop(); });
      console.error(error);
      setStatus('Could not start WebM recording.');
      return;
    }
    state.recorder = recorder;
    state.recordingStream = stream;
    state.recordingChunks = [];
    recorder.ondataavailable = function (event) {
      if (event.data && event.data.size) state.recordingChunks.push(event.data);
    };
    recorder.onerror = function (event) {
      console.error(event.error || event);
      setStatus('WebM recording failed.');
    };
    recorder.onstop = function () {
      const chunks = state.recordingChunks || [];
      const type = recorder.mimeType || 'video/webm';
      if (state.recordingStream) {
        state.recordingStream.getTracks().forEach(function (track) { track.stop(); });
      }
      state.recorder = null;
      state.recordingStream = null;
      state.recordingChunks = null;
      resetRecordingUi();
      if (!chunks.length) {
        setStatus('No video frames were recorded.');
        return;
      }
      const url = URL.createObjectURL(new Blob(chunks, { type }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'particle-lab-recording.webm';
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      setStatus('WebM recording saved.');
    };
    recorder.start(250);
    ui.record.textContent = 'Stop recording';
    ui.record.classList.add('active');
    ui.record.setAttribute('aria-pressed', 'true');
    setStatus('Recording WebM…');
  }

  function toggleRecording() {
    if (state.recorder && state.recorder.state !== 'inactive') {
      state.recorder.stop();
    } else {
      startRecording();
    }
  }

  async function createParticleText() {
    const text = ui.particleText.value.trim();
    if (!text) {
      setStatus('Enter text first.');
      return;
    }

    const lines = text.split(/\r?\n/).slice(0, 4);
    const sampleSize = getSamplingSize(Math.max(1, Math.round(state.width)), Math.max(1, Math.round(state.height)));
    const sw = sampleSize.width;
    const sh = sampleSize.height;
    const textCanvas = document.createElement('canvas');
    textCanvas.width = sw;
    textCanvas.height = sh;
    const textContext = textCanvas.getContext('2d', { willReadFrequently: true });
    if (!textContext) {
      setStatus('Text canvas is not available.');
      return;
    }

    const fontFamily = ui.textFont.value;
    const weight = ui.textWeight.value;
    const selectedFont = ui.textFont.selectedOptions[0];
    const usesHebrew = /[\u0590-\u05ff]/.test(text);
    const supportedScripts = (selectedFont.dataset.scripts || '').split(',');
    if (usesHebrew && !supportedScripts.includes('hebrew')) {
      const message = `${fontFamily} does not support Hebrew. Choose another font.`;
      ui.fontWarning.textContent = message;
      setStatus(message);
      return;
    }
    ui.fontWarning.textContent = '';
    if (document.fonts && typeof document.fonts.load === 'function') {
      try {
        const loadedFaces = await document.fonts.load(`${weight} 32px "${fontFamily}"`, text);
        if (!loadedFaces.length) {
          const message = `${fontFamily} could not be loaded for this text.`;
          ui.fontWarning.textContent = message;
          setStatus(message);
          return;
        }
      } catch (error) {
        const message = `${fontFamily} could not be loaded. Check your internet connection.`;
        ui.fontWarning.textContent = message;
        setStatus(message);
        console.warn(message, error);
        return;
      }
    }
    const requestedSize = Number(ui.textSize.value);
    const lineHeightRatio = 1.16;
    const pad = Math.min(state.width, state.height) * 0.10;
    const boxW = Math.max(10, state.width - pad * 2);
    const boxH = Math.max(10, state.height - pad * 2);
    const sampleAspect = sw / sh;
    const fitW = Math.min(boxW, boxH * sampleAspect);
    const fitH = fitW / sampleAspect;
    const targetHeight = fitH > boxH ? boxH : fitH;
    const sampleToTargetScale = targetHeight / sh;
    let fontSize = Math.max(4, requestedSize / sampleToTargetScale);
    const fontStack = `"${fontFamily}", sans-serif`;
    textContext.font = `${weight} ${fontSize}px ${fontStack}`;
    let widest = 0;
    for (let i = 0; i < lines.length; i++) widest = Math.max(widest, textContext.measureText(lines[i] || ' ').width);
    if (widest > sw * 0.90) {
      fontSize *= sw * 0.90 / widest;
      textContext.font = `${weight} ${fontSize}px ${fontStack}`;
    }
    const segmenter = typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      : null;
    const graphemeLines = lines.map(function (line) {
      return segmenter
        ? Array.from(segmenter.segment(line), function (part) { return part.segment; })
        : Array.from(line);
    });
    const lineWidths = lines.map(function (line) { return textContext.measureText(line || ' ').width; });
    let renderedWidth = 0;
    for (let i = 0; i < lineWidths.length; i++) renderedWidth = Math.max(renderedWidth, lineWidths[i]);
    const textLeft = (sw - renderedWidth) * 0.5;
    const textRight = (sw + renderedWidth) * 0.5;
    const groupOffsets = new Uint16Array(lines.length);
    let textGroupCount = 0;
    for (let i = 0; i < graphemeLines.length; i++) {
      groupOffsets[i] = textGroupCount;
      textGroupCount += graphemeLines[i].length;
    }

    const lineHeight = fontSize * lineHeightRatio;
    const blockHeight = lineHeight * lines.length;
    const firstBaseline = (sh - blockHeight) * 0.5 + lineHeight * 0.82;
    if (ui.rainbowText.checked) {
      const rainbow = textContext.createLinearGradient(textLeft, 0, textRight, 0);
      rainbow.addColorStop(0, '#ff304f');
      rainbow.addColorStop(0.17, '#ff8a00');
      rainbow.addColorStop(0.34, '#ffe600');
      rainbow.addColorStop(0.5, '#2ee66b');
      rainbow.addColorStop(0.67, '#20d9ff');
      rainbow.addColorStop(0.84, '#4263ff');
      rainbow.addColorStop(1, '#c33cff');
      textContext.fillStyle = rainbow;
    } else if (ui.gradientText.checked) {
      const gradient = textContext.createLinearGradient(textLeft, 0, textRight, 0);
      gradient.addColorStop(0, ui.textColorStart.value);
      gradient.addColorStop(1, ui.textColorEnd.value);
      textContext.fillStyle = gradient;
    } else {
      textContext.fillStyle = ui.textColorStart.value;
    }
    textContext.textAlign = 'center';
    textContext.textBaseline = 'alphabetic';
    textContext.direction = /[\u0590-\u05ff]/.test(text) ? 'rtl' : 'ltr';
    for (let i = 0; i < lines.length; i++) {
      textContext.fillText(lines[i], sw * 0.5, firstBaseline + i * lineHeight);
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = sw;
    maskCanvas.height = sh;
    const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskContext) {
      setStatus('Text mask canvas is not available.');
      return;
    }
    maskContext.font = textContext.font;
    maskContext.fillStyle = '#ffffff';
    maskContext.textAlign = 'center';
    maskContext.textBaseline = 'alphabetic';
    maskContext.direction = textContext.direction;
    for (let i = 0; i < lines.length; i++) {
      maskContext.fillText(lines[i], sw * 0.5, firstBaseline + i * lineHeight);
    }

    const pixels = textContext.getImageData(0, 0, sw, sh).data;
    const maskPixels = maskContext.getImageData(0, 0, sw, sh).data;
    const source = new Uint32Array(sw * sh * 2);
    const sourceGroups = new Int16Array(sw * sh);
    sourceGroups.fill(-1);
    const textTop = firstBaseline - lineHeight * 0.82;
    let count = 0;
    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const pi = (py * sw + px) * 4;
        if (pixels[pi + 3] < MIN_ALPHA) continue;
        const xn = Math.round(px / Math.max(1, sw - 1) * 65535);
        const yn = Math.round(py / Math.max(1, sh - 1) * 65535);
        source[count * 2] = ((xn & 0xffff) << 16) | (yn & 0xffff);
        source[count * 2 + 1] = (pixels[pi] << 16) | (pixels[pi + 1] << 8) | pixels[pi + 2];
        if (maskPixels[pi + 3] >= MIN_ALPHA) {
          const lineIndex = Math.min(lines.length - 1, Math.max(0, Math.floor((py - textTop) / lineHeight)));
          const graphemes = graphemeLines[lineIndex];
          if (graphemes.length) {
            const left = (sw - lineWidths[lineIndex]) * 0.5;
            const fraction = Math.min(0.999999, Math.max(0, (px - left) / Math.max(1, lineWidths[lineIndex])));
            const visualIndex = Math.floor(fraction * graphemes.length);
            const rtl = /[\u0590-\u05ff]/.test(lines[lineIndex]);
            const groupIndex = rtl ? graphemes.length - 1 - visualIndex : visualIndex;
            sourceGroups[count] = groupOffsets[lineIndex] + groupIndex;
          }
        }
        count++;
      }
    }
    if (!count) {
      setStatus('The text produced no visible particles.');
      return;
    }

    state.currentPixelData = new Uint8ClampedArray(pixels);
    state.sampledWidth = sw;
    state.sampledHeight = sh;
    state.currentSource = source.subarray(0, count * 2);
    state.currentSourceGroups = sourceGroups.subarray(0, count);
    state.targetTextGroupCount = textGroupCount;
    state.imageAspect = sw / sh;
    state.currentDemo = null;
    startMorph(state.currentSource, state.imageAspect);
    updateGallery('');
    ui.hudImage.textContent = `Text: ${text.replace(/\s+/g, ' ').slice(0, 24)}`;
    setStatus('');
    textCanvas.width = 1;
    textCanvas.height = 1;
    maskCanvas.width = 1;
    maskCanvas.height = 1;
  }

  function getSamplingSize(width, height) {
    const totalPixels = width * height;
    if (totalPixels <= MAX_PARTICLES) return { width, height };

    const scale = Math.sqrt(MAX_PARTICLES / totalPixels);
    let sampleWidth = Math.max(1, Math.round(width * scale));
    let sampleHeight = Math.max(1, Math.round(height * scale));

    while (sampleWidth * sampleHeight > MAX_PARTICLES) {
      const widthRatioError = Math.abs((sampleWidth - 1) / sampleHeight - width / height);
      const heightRatioError = Math.abs(sampleWidth / (sampleHeight - 1) - width / height);
      if (sampleWidth > 1 && (sampleHeight === 1 || widthRatioError <= heightRatioError)) {
        sampleWidth--;
      } else {
        sampleHeight--;
      }
    }
    return { width: sampleWidth, height: sampleHeight };
  }

  async function sampleUploadedFile(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setStatus('Choose a JPG, PNG or WebP image.');
      return;
    }
    setStatus('Sampling image…');
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const sampleSize = getSamplingSize(bitmap.width, bitmap.height);
      const sw = sampleSize.width;
      const sh = sampleSize.height;
      const samplingCanvas = document.createElement('canvas');
      samplingCanvas.width = sw;
      samplingCanvas.height = sh;
      const sctx = samplingCanvas.getContext('2d', { willReadFrequently: true });
      if (!sctx) throw new Error('Sampling canvas 2D is not available.');
      sctx.drawImage(bitmap, 0, 0, sw, sh);

      const pixelData = sctx.getImageData(0, 0, sw, sh).data;
      state.currentPixelData = new Uint8ClampedArray(pixelData);
      const pixels = state.currentPixelData;
      state.sampledWidth = sw;
      state.sampledHeight = sh;

      const source = new Uint32Array(sw * sh * 2);
      let count = 0;
      for (let py = 0; py < sh; py++) {
        for (let px = 0; px < sw; px++) {
          const pi = (py * sw + px) * 4;
          if (pixels[pi + 3] < MIN_ALPHA) continue;
          const xn = Math.round(px / Math.max(1, sw - 1) * 65535);
          const yn = Math.round(py / Math.max(1, sh - 1) * 65535);
          source[count * 2] = ((xn & 0xffff) << 16) | (yn & 0xffff);
          source[count * 2 + 1] = (pixels[pi] << 16) | (pixels[pi + 1] << 8) | pixels[pi + 2];
          count++;
        }
      }

      const nextAspect = bitmap.width / bitmap.height;
      state.currentSource = source.subarray(0, count * 2);
      state.currentSourceGroups = null;
      state.targetTextGroupCount = 0;
      state.imageAspect = nextAspect;
      state.currentDemo = null;
      startMorph(state.currentSource, nextAspect);
      updateGallery('');
      ui.hudImage.textContent = file.name;
      setStatus('');
      samplingCanvas.width = 1;
      samplingCanvas.height = 1;
    } catch (error) {
      console.error(error);
      setStatus('Could not read this image.');
    } finally {
      if (bitmap) bitmap.close();
    }
  }

  function syncOutputs() {
    ui.densityOut.textContent = `${Math.round(state.density * 100)}%`;
    ui.sizeOut.textContent = state.size.toFixed(1);
    ui.forceOut.textContent = String(Math.round(state.mouseForce));
    ui.radiusOut.textContent = String(Math.round(state.mouseRadius));
    ui.springOut.textContent = String(Math.round(state.spring * 1000));
    ui.dampingOut.textContent = `${Math.round(state.damping * 100)}%`;
    ui.morphSpeedOut.textContent = `${(state.morphDuration / 1000).toFixed(1)}s`;
  }

  function bindRange(input, handler) {
    input.addEventListener('input', function () { handler(Number(input.value)); syncOutputs(); });
  }

  function setActiveButton(container, selector, activeButton) {
    container.querySelectorAll(selector).forEach(function (item) {
      const active = item === activeButton;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  }

  function updateCanvasPointer(event, entering) {
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    if (entering) {
      state.prevMouseX = px;
      state.prevMouseY = py;
      state.mouseVX = state.mouseVY = 0;
    } else {
      state.mouseVX = px - state.mouseX;
      state.mouseVY = py - state.mouseY;
      state.prevMouseX = state.mouseX;
      state.prevMouseY = state.mouseY;
    }
    state.mouseX = px;
    state.mouseY = py;
    state.pointerInside = true;
  }

  ui.gallery.addEventListener('click', function (event) {
    const button = event.target.closest('[data-demo]');
    if (button) loadDemo(button.dataset.demo);
  });
  ui.styles.addEventListener('click', function (event) {
    const button = event.target.closest('[data-style]');
    if (!button) return;
    state.style = button.dataset.style;
    buildPalette();
    ui.hudStyle.textContent = button.textContent.trim();
    setActiveButton(ui.styles, '[data-style]', button);
  });
  ui.mouseModes.addEventListener('click', function (event) {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    state.mouseMode = button.dataset.mode;
    setActiveButton(ui.mouseModes, '[data-mode]', button);
  });
  ui.morphStyles.addEventListener('click', function (event) {
    const button = event.target.closest('[data-morph-style]');
    if (!button) return;
    state.morphStyle = button.dataset.morphStyle;
    setActiveButton(ui.morphStyles, '[data-morph-style]', button);
  });
  ui.clickEffect.addEventListener('change', function () {
    state.clickEffect = ui.clickEffect.value;
  });
  ui.playEffect.addEventListener('click', function () { magicMix(null); });
  ui.autoMorph.addEventListener('click', function () {
    state.autoMorph = !state.autoMorph;
    ui.autoMorph.classList.toggle('active', state.autoMorph);
    ui.autoMorph.setAttribute('aria-pressed', String(state.autoMorph));
    scheduleAutoMorph(performance.now());
  });
  let variableTextWeight = '700';
  const FONT_WEIGHT_LABELS = {
    400: '400 - Normal', 500: '500 - Medium', 600: '600 - SemiBold',
    700: '700 - Bold', 800: '800 - ExtraBold', 900: '900 - Black'
  };

  function syncTextFontControls() {
    if (!ui.textWeight.disabled && ui.textWeight.value) variableTextWeight = ui.textWeight.value;
    const weights = ui.textFont.selectedOptions[0].dataset.weights.split(',');
    const desired = weights.includes(variableTextWeight)
      ? variableTextWeight
      : weights.reduce(function (best, value) {
        return Math.abs(Number(value) - Number(variableTextWeight)) < Math.abs(Number(best) - Number(variableTextWeight)) ? value : best;
      }, weights[0]);
    ui.textWeight.textContent = '';
    weights.forEach(function (value) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = FONT_WEIGHT_LABELS[value] || value;
      ui.textWeight.appendChild(option);
    });
    ui.textWeight.value = desired;
    ui.textWeight.disabled = weights.length === 1;
    ui.textWeightHint.textContent = weights.length === 1 ? `Fixed ${weights[0]}` : '';
    ui.fontWarning.textContent = '';
  }

  function syncTextColorControls() {
    const rainbow = ui.rainbowText.checked;
    ui.gradientText.disabled = rainbow;
    ui.textColorStart.disabled = rainbow;
    ui.textColorEnd.disabled = rainbow || !ui.gradientText.checked;
  }

  ui.textSize.addEventListener('input', function () {
    ui.textSizeOut.textContent = `${ui.textSize.value} px`;
  });
  ui.textFont.addEventListener('change', syncTextFontControls);
  ui.textWeight.addEventListener('change', function () { variableTextWeight = ui.textWeight.value; });
  ui.gradientText.addEventListener('change', syncTextColorControls);
  ui.rainbowText.addEventListener('change', syncTextColorControls);
  ui.createText.addEventListener('click', createParticleText);
  ui.loopInterval.addEventListener('input', function () {
    ui.loopIntervalOut.textContent = `${Number(ui.loopInterval.value).toFixed(1)}s`;
  });
  ui.addSequenceEffect.addEventListener('click', function () {
    state.effectSequence.push(ui.sequenceEffectSelect.value);
    resetSequenceProgress();
    renderEffectSequence();
  });
  ui.clearSequence.addEventListener('click', function () {
    state.effectSequence.length = 0;
    resetSequenceProgress();
    renderEffectSequence();
  });
  ui.sequenceOrder.addEventListener('change', function () {
    resetSequenceProgress();
  });
  ui.automation.addEventListener('click', toggleEffectAutomation);

  bindRange(ui.density, function (v) { state.density = v / 100; if (state.currentSource) mapTargets(state.currentSource, false); });
  bindRange(ui.size, function (v) { state.size = v; });
  bindRange(ui.force, function (v) { state.mouseForce = v; });
  bindRange(ui.radius, function (v) { state.mouseRadius = v; });
  bindRange(ui.spring, function (v) { state.spring = v / 1000; });
  bindRange(ui.damping, function (v) { state.damping = v / 100; });
  bindRange(ui.morphSpeed, function (v) { state.morphDuration = v * 1000; });

  canvas.addEventListener('pointerenter', function (event) { updateCanvasPointer(event, true); });
  canvas.addEventListener('pointermove', function (event) { updateCanvasPointer(event, false); });
  canvas.addEventListener('pointerleave', function () { state.pointerInside = false; state.mouseVX = state.mouseVY = 0; });
  canvas.addEventListener('pointerup', function (event) { magicMix(event); });

  ui.uploadButton.addEventListener('click', function () { ui.fileInput.click(); });
  ui.fileInput.addEventListener('change', function () { sampleUploadedFile(ui.fileInput.files && ui.fileInput.files[0]); ui.fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (name) {
    window.addEventListener(name, function (event) { event.preventDefault(); ui.dropOverlay.hidden = false; });
  });
  ['dragleave', 'drop'].forEach(function (name) {
    window.addEventListener(name, function (event) { event.preventDefault(); ui.dropOverlay.hidden = true; });
  });
  window.addEventListener('drop', function (event) { const file = event.dataTransfer && event.dataTransfer.files[0]; if (file) sampleUploadedFile(file); });

  ui.export.addEventListener('click', function () {
    canvas.toBlob(function (blob) {
      if (!blob) { setStatus('PNG export failed.'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'particle-lab.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    }, 'image/png');
  });
  ui.record.addEventListener('click', toggleRecording);
  ui.reset.addEventListener('click', function () {
    state.density = DEFAULT_DENSITY;
    state.size = DEFAULT_PARTICLE_SIZE;
    state.mouseForce = DEFAULT_MOUSE_FORCE;
    state.mouseRadius = DEFAULT_MOUSE_RADIUS;
    state.spring = DEFAULT_SPRING;
    state.damping = DEFAULT_DAMPING;
    state.morphDuration = DEFAULT_MORPH_DURATION;
    state.morphStyle = DEFAULT_MORPH_STYLE;
    state.activeMorphStyle = DEFAULT_MORPH_STYLE;
    state.clickEffect = DEFAULT_CLICK_EFFECT;
    state.effectBag = [];
    state.lastRandomEffect = '';
    stopEffectAutomation('');
    state.autoMorph = false;
    state.nextAutoMorphTime = Infinity;
    ui.density.value = String(Math.round(DEFAULT_DENSITY * 100));
    ui.size.value = DEFAULT_PARTICLE_SIZE.toFixed(1);
    ui.force.value = String(DEFAULT_MOUSE_FORCE);
    ui.radius.value = String(DEFAULT_MOUSE_RADIUS);
    ui.spring.value = String(Math.round(DEFAULT_SPRING * 1000));
    ui.damping.value = String(Math.round(DEFAULT_DAMPING * 100));
    ui.morphSpeed.value = String(DEFAULT_MORPH_DURATION / 1000);
    setActiveButton(
      ui.morphStyles,
      '[data-morph-style]',
      ui.morphStyles.querySelector(`[data-morph-style="${DEFAULT_MORPH_STYLE}"]`)
    );
    ui.clickEffect.value = DEFAULT_CLICK_EFFECT;
    ui.loopInterval.value = '3';
    ui.loopIntervalOut.textContent = '3.0s';
    ui.sequenceOrder.value = 'ordered';
    state.effectSequence = DEFAULT_EFFECT_SEQUENCE.slice();
    resetSequenceProgress();
    renderEffectSequence();
    ui.autoMorph.classList.remove('active');
    ui.autoMorph.setAttribute('aria-pressed', 'false');
    syncOutputs();
    loadDemo('astronaut');
  });

  let resizeFrame = 0;
  window.addEventListener('resize', function () {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(function () {
      resizeFrame = 0;
      resizeCanvas();
    });
  }, { passive: true });

  ui.morphSpeed.value = String(DEFAULT_MORPH_DURATION / 1000);
  syncTextFontControls();
  syncTextColorControls();
  populateSequenceEffectOptions();
  renderEffectSequence();
  syncOutputs();
  resizeCanvas();
  useDemo('astronaut');
  state.fpsTime = performance.now();
  requestAnimationFrame(frame);
}());
