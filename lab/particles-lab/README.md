# Particle Lab — Startup Optimized

Vanilla HTML/CSS/JavaScript. No build step, no modules, no Base64, no server dependency.

## Startup path

1. `index.html` and `style.css`
2. `data/demos/astronaut.js` — the only demo dataset loaded at startup
3. `js/app.js`
4. one initial canvas resize
5. Astronaut targets are mapped
6. animation loop starts

The other five demo datasets are loaded lazily only after the user selects them.
Canvas resize is event-driven and coalesced; it is not checked from the render loop.

## Run

Open `index.html` directly in a browser.

## Tests

```bash
npm test
npm run check
```

## Sampling model

- Particle capacity: `MAX_PARTICLES = 24000`
- Default density: `DEFAULT_DENSITY = 1.00`
- Minimum target count: `MIN_PARTICLES = 250` when the source contains enough samples
- Alpha cutoff: `MIN_ALPHA = 40`
- User images are downscaled only for sampling so sampled `width × height <= 24000` while preserving the source aspect as closely as integer canvas dimensions allow.
- The sampled `Uint8ClampedArray` is retained in `state.currentPixelData`.
- Every eligible sampled pixel becomes one source particle. There is no stride or pixel skipping in the sampling pass.
- Density is applied later and chooses deterministic, evenly distributed indices across the complete source rather than taking the beginning of the array.
- Built-in demo datasets use the pre-sampled data included in this version.

## Image morphing

Selecting another demo or uploading an image morphs the current particle field into the next image. The transition always uses the destination's correct particle count: when the destination has more points, existing source points are duplicated uniformly as starting positions. Targets are paired through a 32 × 32 spatial grid, positions use smoothstep interpolation, and palette colors update in 32 discrete steps while the existing spring and damping physics continue to drive movement.

Morph speed is adjustable from 0.4 to 5 seconds. Direct, Swirl, Explode, Wave, Gravity drop and per-transition Random paths are available. Wave is the default path, while Auto Morph cycles through the built-in demos with a short pause between transitions.

## Interaction effects and recording

Canvas clicks, touch gestures and the Play button can trigger Mirror Rise, Center Bloom, Sweep Wave, Letter Scramble, Shatter, Vortex Line, Glitch Slices, Pixel Rain, Shockwave, Spiral, Explosion, Implosion, Letter Spin, Domino or Elastic Stretch. Mirror Rise sends the particle field toward a vertical reflection before the spring restores it, while Center Bloom expands gradually from the image center and settles back. Text particles retain their letter group so letter-aware effects move glyphs coherently; images use spatial equivalents. Random uses a Shuffle Bag, so every effect appears once before any effect repeats and the same effect cannot bridge two bags consecutively.

Section 08 builds one numbered Effects Sequence by adding effects in the intended order. A one-item sequence repeats that effect, while longer sequences loop in insertion order or through a Shuffle Bag. Items can be removed individually or the sequence can be cleared, the interval is adjustable, and automation always pauses while an image Morph is active.

Record WebM captures the canvas at 60 FPS until the same button is pressed again, then downloads the recording locally when the browser supports `canvas.captureStream()` and `MediaRecorder`.

## Tutorial

A separate three-step first-visit tutorial introduces image or text sources, live canvas interaction, Morph and effect automation. It adapts its instructions for mouse or touch, preserves canvas interaction during the demonstration, supports keyboard navigation and reduced-motion preferences, and can be opened again with the `Tutorial` button. Completion is stored locally when browser storage is available.

## Particle text

Section 07 converts up to four lines of user text into a transparent particle target containing only visible glyph pixels, using the same Morph engine. It provides twelve Hebrew-and-Latin Google Fonts, pixel size up to 360 px, and only the weights actually available for the selected family. Font loading is checked against the user's text and reports a visible error instead of silently falling back. Solid color, a configurable two-color gradient and a full rainbow gradient are available, with gradients spanning the actual text bounds. Hebrew text is rendered with RTL direction automatically. Morphing from sparse text to an image still expands to the image's correct particle count.
