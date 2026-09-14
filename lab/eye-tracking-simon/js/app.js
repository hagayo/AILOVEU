'use strict';

(function bootstrapEyeTracking() {
  const app = window.EyeTracking;
  const config = app.config;
  const utils = app.utils;
  const canvas = document.getElementById('sceneCanvas');
  const fallbackImage = document.getElementById('fallbackImage');
  const status = document.getElementById('statusMessage');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let controller = null;
  let renderer = null;
  let gameUI = null;
  let disposed = false;
  let resizeFrame = 0;

  function showStatus(message, isError) {
    if (!status) {
      return;
    }
    status.dataset.i18n = message;
    status.textContent = app.i18n.t(message);
    status.classList.toggle('status--error', Boolean(isError));
    status.hidden = false;
  }

  function hideStatus() {
    if (status) {
      status.hidden = true;
    }
  }

  function showFatalError(error) {
    try { console.error('[Eye Tracking]', error); } catch (_) { /* Console may be unavailable in embedded browsers. */ }
    try { gameUI?.destroy(); } catch (_) { /* Continue presenting the fallback state. */ }
    gameUI = null;
    document.getElementById('startButton').disabled = true;
    document.getElementById('playButton').disabled = true;
    document.getElementById('gamePanel').hidden = true;
    if (controller) {
      try { controller.destroy(); } catch (_) { /* Continue presenting the fallback state. */ }
      controller = null;
    }
    canvas?.classList.add('is-hidden');
    fallbackImage?.classList.remove('is-hidden');
    showStatus('לא ניתן להפעיל את המשחק. נסו לרענן את הדף.', true);
  }

  function scheduleResize() {
    if (!renderer || disposed || resizeFrame) {
      return;
    }
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      try {
        renderer.resize();
        controller?.renderImmediately();
      } catch (error) {
        showFatalError(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  function handlePointerMove(event) {
    try { controller?.setPointerTarget(event.clientX, event.clientY); }
    catch (error) { showFatalError(error instanceof Error ? error : new Error(String(error))); }
  }

  function handleImageClick(event) {
    try {
      if (event.button === 0 && event.target.closest('.scene')) {
        if (gameUI?.isActive()) gameUI.click(event.clientX, event.clientY);
        else controller?.releaseFaceEffect(event.clientX, event.clientY);
      }
    } catch (error) { showFatalError(error instanceof Error ? error : new Error(String(error))); }
  }

  function handlePointerLeave() {
    try { controller?.leavePointer(); }
    catch (error) { showFatalError(error instanceof Error ? error : new Error(String(error))); }
  }

  function handlePointerUp(event) {
    if (event.pointerType === 'touch') {
      try { controller?.leavePointer(); }
      catch (error) { showFatalError(error instanceof Error ? error : new Error(String(error))); }
    }
  }

  function handleVisibilityChange() {
    try {
      gameUI?.setVisible(!document.hidden);
      controller?.setPageVisible(!document.hidden);
    } catch (error) { showFatalError(error instanceof Error ? error : new Error(String(error))); }
  }

  function handleReducedMotionChange() {
    try { controller?.handleReducedMotionChange(); }
    catch (error) { showFatalError(error instanceof Error ? error : new Error(String(error))); }
  }

  function addReducedMotionListener() {
    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', handleReducedMotionChange);
    } else if (typeof reducedMotion.addListener === 'function') {
      reducedMotion.addListener(handleReducedMotionChange);
    }
  }

  function removeReducedMotionListener() {
    if (typeof reducedMotion.removeEventListener === 'function') {
      reducedMotion.removeEventListener('change', handleReducedMotionChange);
    } else if (typeof reducedMotion.removeListener === 'function') {
      reducedMotion.removeListener(handleReducedMotionChange);
    }
  }

  function addListeners() {
    const passive = utils.passiveOptions;
    window.addEventListener('resize', scheduleResize, passive);
    window.visualViewport?.addEventListener('resize', scheduleResize, passive);
    window.addEventListener('pointermove', handlePointerMove, passive);
    window.addEventListener('click', handleImageClick, passive);
    document.documentElement.addEventListener('pointerleave', handlePointerLeave, passive);
    window.addEventListener('blur', handlePointerLeave, passive);
    window.addEventListener('pointerup', handlePointerUp, passive);
    window.addEventListener('pointercancel', handlePointerUp, passive);
    document.addEventListener('visibilitychange', handleVisibilityChange, passive);
    addReducedMotionListener();
  }

  function removeListeners() {
    const passive = utils.passiveOptions;
    window.removeEventListener('resize', scheduleResize, passive);
    window.visualViewport?.removeEventListener('resize', scheduleResize, passive);
    window.removeEventListener('pointermove', handlePointerMove, passive);
    window.removeEventListener('click', handleImageClick, passive);
    document.documentElement.removeEventListener('pointerleave', handlePointerLeave, passive);
    window.removeEventListener('blur', handlePointerLeave, passive);
    window.removeEventListener('pointerup', handlePointerUp, passive);
    window.removeEventListener('pointercancel', handlePointerUp, passive);
    document.removeEventListener('visibilitychange', handleVisibilityChange, passive);
    removeReducedMotionListener();
  }

  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    removeListeners();
    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
    }
    controller?.destroy();
    gameUI?.destroy();
  }

  async function initialize() {
    if (!canvas) {
      showFatalError(new Error('Required canvas element was not found.'));
      return;
    }

    try {
      showStatus('טוען את התמונה…', false);
      const [background, iris] = await Promise.all([
        utils.loadImage(config.image.backgroundSrc),
        utils.loadImage(config.image.irisSrc),
      ]);

      if (disposed) {
        return;
      }

      renderer = app.createRenderer(canvas, { background, iris }, showFatalError);
      renderer.resize();
      controller = app.createMotionController(renderer, {
        reducedMotion,
        onFatalError: showFatalError,
      });
      controller.renderImmediately();
      gameUI = app.createGameUI(renderer, controller, showFatalError);
      addListeners();
      fallbackImage?.classList.add('is-hidden');
      canvas.classList.remove('is-hidden');
      hideStatus();
    } catch (error) {
      showFatalError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  window.addEventListener('pagehide', event => {
    if (event.persisted) {
      gameUI?.setVisible(false);
      controller?.setPageVisible(false);
    } else dispose();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted && !disposed) handleVisibilityChange();
  });
  initialize();
}());
