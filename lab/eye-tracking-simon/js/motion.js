'use strict';

window.EyeTracking = window.EyeTracking || {};

window.EyeTracking.createMotionController = function createMotionController(renderer, options) {
  const config = window.EyeTracking.config;
  const utils = window.EyeTracking.utils;
  const reducedMotion = options.reducedMotion;
  const onFatalError = options.onFatalError;

  const state = {
    irisX: 0,
    irisY: 0,
    velocityX: 0,
    velocityY: 0,
    targetX: 0,
    targetY: 0,
    pointerTargetX: 0,
    pointerTargetY: 0,
    targetPupilScale: 1,
    pupilScale: 1,
    blinkProgress: 0,
    animationFrame: 0,
    lastFrameTime: 0,
    lastPointerTime: performance.now(),
    pointerInside: false,
    pageVisible: !document.hidden,
    idleTimer: 0,
    gazeTimer: 0,
    blinkTimer: 0,
    blinkStartTime: 0,
    blinkQueued: false,
    blinkActive: false,
    destroyed: false,
  };

  function clearTimer(name) {
    if (state[name]) {
      clearTimeout(state[name]);
      state[name] = 0;
    }
  }

  function scheduleTimer(name, callback, delay) {
    clearTimer(name);
    try {
      state[name] = window.setTimeout(() => {
        state[name] = 0;
        if (state.destroyed) return;
        try {
          callback();
        } catch (error) {
          onFatalError(error instanceof Error ? error : new Error(String(error)));
        }
      }, delay);
    } catch (error) {
      onFatalError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  function nonlinearStrength(distance) {
    return Math.tanh((distance / config.eye.trackingDistance) * 1.55);
  }

  function limitTarget(x, y) {
    const horizontal = utils.clamp(x / config.eye.maxMoveX, -1, 1);
    const verticalLimit = y < 0 ? config.eye.maxMoveUp : config.eye.maxMoveDown;
    const vertical = utils.clamp(y / verticalLimit, -1, 1);
    const magnitude = Math.hypot(horizontal, vertical);

    if (magnitude <= 1) {
      return { x, y };
    }

    return {
      x: (horizontal / magnitude) * config.eye.maxMoveX,
      y: (vertical / magnitude) * verticalLimit,
    };
  }

  function pupilScaleFromDistance(distance) {
    const normalized = utils.clamp(distance / config.eye.trackingDistance, 0, 1);
    return utils.lerp(config.eye.pupilNearScale, config.eye.pupilFarScale, normalized);
  }

  function setPointerTarget(clientX, clientY) {
    const center = renderer.getEyeCenterCanvas();
    const dx = clientX - center.x;
    const dy = clientY - center.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 0.001) {
      state.pointerTargetX = 0;
      state.pointerTargetY = 0;
    } else {
      const strength = nonlinearStrength(distance);
      const directionX = dx / distance;
      const directionY = dy / distance;
      const verticalRange = directionY < 0 ? config.eye.maxMoveUp : config.eye.maxMoveDown;
      const limited = limitTarget(
        directionX * config.eye.maxMoveX * strength,
        directionY * verticalRange * strength,
      );
      state.pointerTargetX = limited.x;
      state.pointerTargetY = limited.y;
    }

    state.targetX = state.pointerTargetX;
    state.targetY = state.pointerTargetY;
    state.targetPupilScale = pupilScaleFromDistance(distance);
    state.lastPointerTime = performance.now();
    state.pointerInside = true;
    clearTimer('gazeTimer');
    schedulePointerIdle();
    startAnimation();
  }

  function chooseIdleGaze() {
    if (state.destroyed || reducedMotion.matches || !state.pageVisible || state.pointerInside) {
      return;
    }

    const idle = config.idle;
    if (Math.random() < idle.centerReturnChance) {
      state.targetX = 0;
      state.targetY = 0;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.25 + Math.sqrt(Math.random()) * 0.75;
      const limited = limitTarget(
        Math.cos(angle) * config.eye.maxMoveX * idle.gazeRadiusX * radius,
        Math.sin(angle) * config.eye.maxMoveDown * idle.gazeRadiusY * radius,
      );
      state.targetX = limited.x;
      state.targetY = limited.y;
    }
    state.targetPupilScale = 1.012;
    startAnimation();

    const hold = utils.randomBetween(idle.gazeMinHoldMs, idle.gazeMaxHoldMs);
    scheduleTimer('gazeTimer', chooseIdleGaze, hold);
  }

  function scheduleFreeGaze() {
    clearTimer('gazeTimer');
    if (reducedMotion.matches || !state.pageVisible || state.pointerInside) {
      return;
    }
    scheduleTimer('gazeTimer', chooseIdleGaze, config.idle.freeGazeDelayMs);
  }

  function schedulePointerIdle() {
    clearTimer('idleTimer');
    if (reducedMotion.matches || !state.pointerInside || !state.pageVisible) {
      return;
    }

    scheduleTimer('idleTimer', () => {
      const age = performance.now() - state.lastPointerTime;
      if (age < config.idle.pointerStaleMs || !state.pointerInside) {
        schedulePointerIdle();
        return;
      }

      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35 + Math.random() * 0.65;
      const limited = limitTarget(
        state.pointerTargetX
          + Math.cos(angle) * config.idle.microSaccadeRadiusX * radius,
        state.pointerTargetY
          + Math.sin(angle) * config.idle.microSaccadeRadiusY * radius,
      );
      state.targetX = limited.x;
      state.targetY = limited.y;
      startAnimation();

      const delay = utils.randomBetween(
        config.idle.microSaccadeMinMs,
        config.idle.microSaccadeMaxMs,
      );
      scheduleTimer('idleTimer', schedulePointerIdle, delay);
    }, config.idle.pointerStaleMs);
  }

  function leavePointer() {
    state.pointerInside = false;
    state.pointerTargetX = 0;
    state.pointerTargetY = 0;
    state.targetX = 0;
    state.targetY = 0;
    state.targetPupilScale = 1;
    clearTimer('idleTimer');
    startAnimation();
    scheduleFreeGaze();
  }

  function blinkValue(elapsed) {
    const blink = config.blink;
    const progress = utils.clamp(elapsed / blink.durationMs, 0, 1);
    const closeEnd = blink.closeFraction;
    const holdEnd = closeEnd + blink.holdFraction;

    if (progress <= closeEnd) {
      return utils.easeInCubic(progress / closeEnd);
    }
    if (progress <= holdEnd) {
      return 1;
    }
    return 1 - utils.easeOutCubic((progress - holdEnd) / (1 - holdEnd));
  }

  function scheduleBlink() {
    clearTimer('blinkTimer');
    if (state.destroyed || reducedMotion.matches || !state.pageVisible) {
      return;
    }
    const delay = utils.randomBetween(config.blink.minIntervalMs, config.blink.maxIntervalMs);
    scheduleTimer('blinkTimer', () => triggerBlink(false), delay);
  }

  function triggerBlink(forceSingle) {
    if (state.blinkActive || reducedMotion.matches || !state.pageVisible || state.destroyed) {
      return;
    }
    state.blinkActive = true;
    state.blinkStartTime = performance.now();
    state.blinkQueued = !forceSingle && Math.random() < config.blink.doubleBlinkChance;
    startAnimation();
  }

  function finishBlink() {
    state.blinkActive = false;
    state.blinkProgress = 0;
    if (state.blinkQueued) {
      state.blinkQueued = false;
      scheduleTimer('blinkTimer', () => triggerBlink(true), config.blink.doubleBlinkGapMs);
    } else {
      scheduleBlink();
    }
  }

  function updateBlink(timestamp) {
    if (!state.blinkActive) {
      return false;
    }
    const elapsed = timestamp - state.blinkStartTime;
    state.blinkProgress = blinkValue(elapsed);
    if (elapsed >= config.blink.durationMs) {
      finishBlink();
    }
    return true;
  }

  function updateSpring(dt) {
    if (reducedMotion.matches) {
      state.irisX = state.targetX;
      state.irisY = state.targetY;
      state.velocityX = 0;
      state.velocityY = 0;
      state.pupilScale = state.targetPupilScale;
      return;
    }

    const accelerationX = (state.targetX - state.irisX) * config.eye.stiffness;
    const accelerationY = (state.targetY - state.irisY) * config.eye.stiffness;
    const dampingFactor = Math.exp(-config.eye.damping * dt);
    state.velocityX = (state.velocityX + accelerationX * dt) * dampingFactor;
    state.velocityY = (state.velocityY + accelerationY * dt) * dampingFactor;
    state.irisX += state.velocityX * dt;
    state.irisY += state.velocityY * dt;

    const pupilBlend = 1 - Math.exp(-config.eye.pupilResponse * dt);
    state.pupilScale = utils.lerp(state.pupilScale, state.targetPupilScale, pupilBlend);
  }

  function needsMoreFrames() {
    const positionError = Math.hypot(state.targetX - state.irisX, state.targetY - state.irisY);
    const speed = Math.hypot(state.velocityX, state.velocityY);
    const pupilError = Math.abs(state.targetPupilScale - state.pupilScale);
    return state.blinkActive
      || renderer.hasActiveEffects()
      || positionError > config.eye.positionThreshold
      || speed > config.eye.velocityThreshold
      || pupilError > 0.0008;
  }

  function settle() {
    state.irisX = state.targetX;
    state.irisY = state.targetY;
    state.velocityX = 0;
    state.velocityY = 0;
    state.pupilScale = state.targetPupilScale;
    state.lastFrameTime = 0;
  }

  function animate(timestamp) {
    state.animationFrame = 0;
    if (state.destroyed || !state.pageVisible) {
      state.lastFrameTime = 0;
      return;
    }

    try {
      if (!state.lastFrameTime) {
        state.lastFrameTime = timestamp;
      }
      const dt = Math.min(
        Math.max((timestamp - state.lastFrameTime) / 1000, 0),
        config.performance.maxFrameDeltaSeconds,
      );
      state.lastFrameTime = timestamp;

      updateSpring(dt);
      updateBlink(timestamp);
      renderer.updateEffects(dt);
      renderer.render(state);

      if (needsMoreFrames()) {
        state.animationFrame = requestAnimationFrame(animate);
      } else {
        settle();
        renderer.render(state);
      }
    } catch (error) {
      onFatalError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  function startAnimation() {
    if (!state.animationFrame && state.pageVisible && !state.destroyed) {
      state.lastFrameTime = 0;
      state.animationFrame = requestAnimationFrame(animate);
    }
  }

  function renderImmediately() {
    renderer.render(state);
  }

  function handleReducedMotionChange() {
    renderer.clearEffects();
    clearTimer('idleTimer');
    clearTimer('gazeTimer');
    clearTimer('blinkTimer');
    state.blinkActive = false;
    state.blinkProgress = 0;

    if (reducedMotion.matches) {
      state.targetX = state.pointerInside ? state.pointerTargetX : 0;
      state.targetY = state.pointerInside ? state.pointerTargetY : 0;
      state.targetPupilScale = 1;
      startAnimation();
      return;
    }

    if (state.pointerInside) {
      schedulePointerIdle();
    } else {
      scheduleFreeGaze();
    }
    scheduleBlink();
  }

  function setPageVisible(visible) {
    state.pageVisible = visible;
    if (!visible) {
      if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = 0;
      }
      clearTimer('idleTimer');
      clearTimer('gazeTimer');
      clearTimer('blinkTimer');
      state.lastFrameTime = 0;
      return;
    }

    renderer.render(state);
    if (renderer.hasActiveEffects()) {
      startAnimation();
    }
    if (!reducedMotion.matches) {
      triggerBlink(true);
      if (state.pointerInside) {
        schedulePointerIdle();
      } else {
        scheduleFreeGaze();
      }
    }
  }

  function destroy() {
    state.destroyed = true;
    renderer.clearEffects();
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = 0;
    }
    clearTimer('idleTimer');
    clearTimer('gazeTimer');
    clearTimer('blinkTimer');
  }

  scheduleBlink();

  return {
    releaseFaceEffect(clientX, clientY) {
      if (!state.destroyed && state.pageVisible
          && renderer.emitFaceEffect(clientX, clientY, reducedMotion.matches)) {
        startAnimation();
      }
    },
    setPointerTarget,
    leavePointer,
    startAnimation,
    renderImmediately,
    handleReducedMotionChange,
    setPageVisible,
    triggerBlink,
    destroy,
  };
};
