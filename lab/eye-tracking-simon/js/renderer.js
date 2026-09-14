'use strict';

window.EyeTracking = window.EyeTracking || {};

window.EyeTracking.createRenderer = function createRenderer(canvas, images, onFatalError) {
  const config = window.EyeTracking.config;
  const utils = window.EyeTracking.utils;
  const bubbles = window.EyeTracking.createBubbleSystem();
  const smoke = window.EyeTracking.createSmokeSystem();
  const water = window.EyeTracking.createWaterSystem();
  let gameEnabled = false;
  let activeFace = null;
  let colorMap = [0, 1, 2, 3, 4];
  let confusion = false;
  let shuffleProgress = 1;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  // Color blending keeps the photograph's shading and facial texture. No
  // pixel reads are needed, so the effect also works with local file images.
  const faceTints = ['#e58779', '#168dbd', '#75aa54', '#f2cd26', '#e57712'];
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  if (!ctx) {
    throw new Error('This browser could not create a 2D canvas context.');
  }

  // The source cutout includes a warm lower-lid fringe. Mask that fringe once,
  // so the stationary pale-green eye background shows through as the iris moves.
  // Keep the upper part of the texture, including its existing shading, intact.
  const irisTexture = document.createElement('canvas');
  irisTexture.width = images.iris.naturalWidth;
  irisTexture.height = images.iris.naturalHeight;
  const irisCtx = irisTexture.getContext('2d');
  irisCtx.drawImage(images.iris, 0, 0);
  irisCtx.globalCompositeOperation = 'destination-in';
  irisCtx.filter = 'blur(0.6px)';
  irisCtx.beginPath();
  irisCtx.moveTo(0, 0);
  irisCtx.lineTo(68, 0);
  irisCtx.lineTo(68, 22);
  irisCtx.bezierCurveTo(59, 22, 56, 27, 54.5, 34);
  irisCtx.bezierCurveTo(52, 44, 43, 52.5, 32, 52.5);
  irisCtx.bezierCurveTo(19, 52.5, 9, 45, 8, 34);
  irisCtx.lineTo(0, 34);
  irisCtx.closePath();
  irisCtx.fill();

  const viewport = {
    width: 0,
    height: 0,
    dpr: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  };

  function viewportSize() {
    if (window.visualViewport) {
      return {
        width: Math.max(1, Math.round(window.visualViewport.width)),
        height: Math.max(1, Math.round(window.visualViewport.height)),
      };
    }
    return {
      width: Math.max(1, window.innerWidth),
      height: Math.max(1, window.innerHeight),
    };
  }

  function sourceToCanvasX(sourceX) {
    return viewport.offsetX + sourceX * viewport.scale;
  }

  function sourceToCanvasY(sourceY) {
    return viewport.offsetY + sourceY * viewport.scale;
  }

  function resize() {
    const size = viewportSize();
    const dpr = Math.min(window.devicePixelRatio || 1, config.performance.maxDevicePixelRatio);

    viewport.width = size.width;
    viewport.height = size.height;
    viewport.dpr = dpr;
    canvas.width = Math.max(1, Math.round(size.width * dpr));
    canvas.height = Math.max(1, Math.round(size.height * dpr));
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const coverScale = Math.max(
      size.width / config.image.width,
      size.height / config.image.height,
    );
    // Landing: the original full-bleed artwork, with no space reserved for UI.
    // Game: retain all five faces horizontally; the controls float over the
    // lower artwork instead of creating an empty side column.
    viewport.scale = gameEnabled
      ? Math.min(coverScale, size.width / (config.image.width - 40))
      : coverScale;
    viewport.offsetX = size.width - config.image.width * viewport.scale;
    const imageHeight = config.image.height * viewport.scale;
    if (!gameEnabled) {
      viewport.offsetY = (size.height - imageHeight) / 2;
      return;
    }
    const panelTop = document.getElementById('gamePanel')?.getBoundingClientRect().top || size.height;
    const focalOffset = Math.max(100, panelTop - 12) / 2 - 665 * viewport.scale;
    viewport.offsetY = imageHeight >= size.height
      ? utils.clamp(focalOffset, size.height - imageHeight, 0)
      : utils.clamp(focalOffset, 0, size.height - imageHeight);
  }

  function canvasToSource(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((clientX - bounds.left) * viewport.width / bounds.width - viewport.offsetX) / viewport.scale,
      y: ((clientY - bounds.top) * viewport.height / bounds.height - viewport.offsetY) / viewport.scale,
    };
  }

  function traceFace(index) {
    const points = window.EyeTracking.gameConfig.faces[index].outline;
    const last = points[points.length - 1];
    ctx.moveTo(sourceToCanvasX((last[0] + points[0][0]) / 2),
      sourceToCanvasY((last[1] + points[0][1]) / 2));
    points.forEach(([x, y], i) => {
      const next = points[(i + 1) % points.length];
      ctx.quadraticCurveTo(sourceToCanvasX(x), sourceToCanvasY(y),
        sourceToCanvasX((x + next[0]) / 2), sourceToCanvasY((y + next[1]) / 2));
    });
    ctx.closePath();
  }

  function drawGameHighlight() {
    if (!gameEnabled || activeFace === null) return;
    const face = window.EyeTracking.gameConfig.faces[colorMap[activeFace]];
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, viewport.width, viewport.height);
    traceFace(activeFace);
    ctx.fillStyle = 'rgba(2, 14, 19, 0.48)';
    ctx.fill('evenodd');
    ctx.beginPath();
    traceFace(activeFace);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = face.color;
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = face.color;
    ctx.lineWidth = Math.max(1, viewport.scale * 1.5);
    ctx.shadowColor = face.color;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  }

  function drawFaceColors() {
    if (!gameEnabled || !confusion) return;
    const blend = reducedMotion?.matches ? 1 : shuffleProgress;
    // Draw the more distant faces first; the foreground owns shared edges.
    for (let position = colorMap.length - 1; position >= 0; position--) {
      ctx.save();
      ctx.beginPath();
      traceFace(position);
      ctx.filter = `blur(${Math.max(0.5, viewport.scale * 3)}px)`;
      // Gently lift the darker blue portrait so yellow remains recognizable.
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = faceTints[position];
      ctx.fill();
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 1;
      ctx.fillStyle = faceTints[position];
      ctx.fill();
      ctx.globalAlpha = blend;
      ctx.fillStyle = faceTints[colorMap[position]];
      ctx.fill();
      ctx.restore();
    }
  }

  function buildEyeClipPath() {
    const p = config.clip;
    ctx.beginPath();
    ctx.moveTo(sourceToCanvasX(p.leftX), sourceToCanvasY(p.leftY));
    ctx.bezierCurveTo(
      sourceToCanvasX(p.topControl1X), sourceToCanvasY(p.topControl1Y),
      sourceToCanvasX(p.topControl2X), sourceToCanvasY(p.topControl2Y),
      sourceToCanvasX(p.rightX), sourceToCanvasY(p.rightY),
    );
    ctx.bezierCurveTo(
      sourceToCanvasX(p.bottomControl1X), sourceToCanvasY(p.bottomControl1Y),
      sourceToCanvasX(p.bottomControl2X), sourceToCanvasY(p.bottomControl2Y),
      sourceToCanvasX(p.leftX), sourceToCanvasY(p.leftY),
    );
    ctx.closePath();
  }

  function irisTransform(state) {
    const eye = config.eye;
    const normalizedX = utils.clamp(Math.abs(state.irisX) / eye.maxMoveX, 0, 1);
    const verticalLimit = state.irisY < 0 ? eye.maxMoveUp : eye.maxMoveDown;
    const normalizedY = utils.clamp(Math.abs(state.irisY) / verticalLimit, 0, 1);

    return {
      centerX: sourceToCanvasX(eye.centerX + state.irisX),
      centerY: sourceToCanvasY(eye.centerY + state.irisY),
      scaleX: eye.irisScale * (1 - eye.perspectiveX * normalizedX),
      scaleY: eye.irisScale * (1 - eye.perspectiveY * normalizedY),
    };
  }

  function drawIrisAndPupil(state) {
    const transform = irisTransform(state);
    const width = images.iris.naturalWidth * viewport.scale * transform.scaleX;
    const height = images.iris.naturalHeight * viewport.scale * transform.scaleY;

    ctx.save();
    buildEyeClipPath();
    ctx.clip();
    ctx.drawImage(
      irisTexture,
      transform.centerX - width / 2,
      transform.centerY - height / 2,
      width,
      height,
    );

    const pupilX = transform.centerX + config.eye.pupilCenterOffsetX * viewport.scale;
    const pupilY = transform.centerY + config.eye.pupilCenterOffsetY * viewport.scale;
    const radiusX = config.eye.pupilRadiusX * viewport.scale * transform.scaleX * state.pupilScale;
    const radiusY = config.eye.pupilRadiusY * viewport.scale * transform.scaleY * state.pupilScale;
    const pupilGradient = ctx.createRadialGradient(
      pupilX - radiusX * 0.12,
      pupilY - radiusY * 0.16,
      0,
      pupilX,
      pupilY,
      Math.max(radiusX, radiusY),
    );
    pupilGradient.addColorStop(0, 'rgba(3, 10, 5, 0.99)');
    pupilGradient.addColorStop(0.72, 'rgba(5, 14, 7, 0.98)');
    pupilGradient.addColorStop(1, 'rgba(6, 18, 8, 0.82)');
    ctx.fillStyle = pupilGradient;
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawUpperEyelidShadow() {
    const shadow = config.eyelidShadow;
    const p = config.clip;
    const left = sourceToCanvasX(p.leftX + 4);
    const right = sourceToCanvasX(p.rightX - 3);
    const top = sourceToCanvasY(shadow.topY);
    const bottom = sourceToCanvasY(shadow.bottomY);
    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    gradient.addColorStop(0, `rgba(24, 44, 18, ${shadow.opacity})`);
    gradient.addColorStop(0.62, 'rgba(24, 44, 18, 0.08)');
    gradient.addColorStop(1, 'rgba(24, 44, 18, 0)');

    ctx.save();
    buildEyeClipPath();
    ctx.clip();
    ctx.fillStyle = gradient;
    ctx.fillRect(left, top, right - left, bottom - top);
    ctx.restore();
  }

  function drawCornealHighlight(state) {
    const highlight = config.highlight;
    const x = sourceToCanvasX(highlight.x + state.irisX * highlight.movementXFactor);
    const y = sourceToCanvasY(highlight.y + state.irisY * highlight.movementYFactor);
    const radiusX = highlight.radiusX * viewport.scale;
    const radiusY = highlight.radiusY * viewport.scale;
    const glow = ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      Math.max(radiusX, radiusY) * 1.8,
    );
    glow.addColorStop(0, `rgba(242, 255, 239, ${highlight.opacity})`);
    glow.addColorStop(0.38, 'rgba(231, 247, 229, 0.46)');
    glow.addColorStop(1, 'rgba(231, 247, 229, 0)');

    ctx.save();
    buildEyeClipPath();
    ctx.clip();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX * 1.8, radiusY * 1.8, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBlinkLids(blinkProgress) {
    if (blinkProgress <= 0) {
      return;
    }

    const blink = config.blink;
    const p = config.clip;
    const left = sourceToCanvasX(p.leftX - 2);
    const right = sourceToCanvasX(p.rightX + 2);
    const top = sourceToCanvasY(575);
    const bottom = sourceToCanvasY(637);
    const fullHeight = bottom - top;
    const upperHeight = fullHeight * blink.upperContribution * blinkProgress;
    const lowerHeight = fullHeight * blink.lowerContribution * blinkProgress;

    ctx.save();
    buildEyeClipPath();
    ctx.clip();

    if (upperHeight > 0.5) {
      const s = blink.upperSource;
      ctx.drawImage(
        images.background,
        s.x, s.y, s.width, s.height,
        left, top, right - left, upperHeight,
      );
    }

    if (lowerHeight > 0.5) {
      const s = blink.lowerSource;
      ctx.drawImage(
        images.background,
        s.x, s.y, s.width, s.height,
        left,
        bottom - lowerHeight,
        right - left,
        lowerHeight,
      );
    }

    if (blinkProgress > 0.75) {
      const seamY = top + upperHeight;
      const seamOpacity = utils.clamp((blinkProgress - 0.75) / 0.25, 0, 1) * 0.34;
      const seam = ctx.createLinearGradient(left, seamY - 3, left, seamY + 3);
      seam.addColorStop(0, 'rgba(35, 73, 43, 0)');
      seam.addColorStop(0.5, `rgba(29, 61, 34, ${seamOpacity})`);
      seam.addColorStop(1, 'rgba(35, 73, 43, 0)');
      ctx.fillStyle = seam;
      ctx.fillRect(left, seamY - 3, right - left, 6);
    }

    ctx.restore();
  }

  function render(state) {
    try {
      ctx.fillStyle = '#071315';
      ctx.fillRect(0, 0, viewport.width, viewport.height);
      ctx.drawImage(
        images.background,
        viewport.offsetX,
        viewport.offsetY,
        config.image.width * viewport.scale,
        config.image.height * viewport.scale,
      );
      drawIrisAndPupil(state);
      drawUpperEyelidShadow();
      drawCornealHighlight(state);
      drawBlinkLids(state.blinkProgress);
      if (!gameEnabled) {
        smoke.draw(ctx, viewport);
        bubbles.draw(ctx, viewport);
        water.draw(ctx, viewport);
      }
      drawFaceColors();
      drawGameHighlight();
    } catch (error) {
      onFatalError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  function getEyeCenterCanvas() {
    return {
      x: sourceToCanvasX(config.eye.centerX),
      y: sourceToCanvasY(config.eye.centerY),
    };
  }

  return {
    resize,
    render,
    getEyeCenterCanvas,
    setGameState(enabled, face, colors = [0, 1, 2, 3, 4], confused = false, blend = 1) {
      if (enabled && !gameEnabled) {
        bubbles.clear(); smoke.clear(); water.clear();
      }
      gameEnabled = enabled;
      activeFace = face;
      colorMap = [...colors];
      confusion = confused;
      shuffleProgress = blend;
    },
    hitFace(clientX, clientY) {
      const point = canvasToSource(clientX, clientY);
      return window.EyeTracking.gameConfig.faces.findIndex(face =>
        utils.pointInPolygon(point.x, point.y, face.outline));
    },
    emitFaceEffect(clientX, clientY, reducedMotion) {
      if (gameEnabled) return false;
      const { x: sourceX, y: sourceY } = canvasToSource(clientX, clientY);
      // Once the water reaches the top, any additional landing-page click
      // starts the reverse drain cycle.
      if (water.requestDrain()) return true;
      // The foreground face takes precedence along the shared boundary.
      if (utils.pointInPolygon(sourceX, sourceY, window.EyeTracking.gameConfig.faces[4].outline)) {
        return water.emitAt(sourceX, sourceY, reducedMotion);
      }
      if (utils.pointInPolygon(sourceX, sourceY, config.bubbles.faceOutline)) {
        return bubbles.emitAt(sourceX, sourceY, reducedMotion);
      }
      return smoke.emitAt(sourceX, sourceY, reducedMotion);
    },
    updateEffects(dt) {
      bubbles.update(dt); smoke.update(dt); water.update(dt);
    },
    hasActiveEffects: () => bubbles.hasActive() || smoke.hasActive() || water.hasActive(),
    clearEffects() { bubbles.clear(); smoke.clear(); water.clear(); },
  };
};
