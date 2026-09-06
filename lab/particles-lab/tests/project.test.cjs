const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const app = read('js/app.js');
const html = read('index.html');

test('startup uses classic defer scripts, not modules', () => {
  assert.match(html, /<script defer src="data\/demos\/astronaut\.js"><\/script>\s*<script defer src="js\/app\.js"><\/script>/);
  assert.equal((html.match(/<script\b/g) || []).length, 3);
  assert.doesNotMatch(html, /type=["']module["']/i);
  assert.doesNotMatch(app, /^\s*(?:import|export)\s/m);
});

test('only astronaut dataset is loaded at startup', () => {
  const startupDemoScripts = [...html.matchAll(/<script defer src="data\/demos\/([^"/]+)\.js"><\/script>/g)].map(m => m[1]);
  assert.deepEqual(startupDemoScripts, ['astronaut']);
  for (const name of ['portrait', 'wolf', 'cyberpunk-city', 'butterfly', 'galaxy']) {
    assert.doesNotMatch(html, new RegExp(`data/demos/${name}\\.js`));
  }
});

test('startup consumes preloaded astronaut directly and starts animation afterwards', () => {
  assert.match(app, /resizeCanvas\(\);\s*useDemo\('astronaut'\);\s*state\.fpsTime = performance\.now\(\);\s*requestAnimationFrame\(frame\);/);
  const frameStart = app.indexOf('function frame(now)');
  const frameEnd = app.indexOf('function magicMix(event, forcedEffect)', frameStart);
  const frame = app.slice(frameStart, frameEnd);
  assert.doesNotMatch(frame, /resizeCanvas\s*\(/);
});

test('other demo datasets are lazy classic scripts only after selection', () => {
  assert.match(app, /document\.createElement\('script'\)/);
  assert.match(app, /script\.src = DEMO_PATHS\[name\]/);
  assert.match(app, /script\.onload/);
  assert.match(app, /script\.onerror/);
});

test('resize work is event-driven and coalesced', () => {
  assert.match(app, /window\.addEventListener\('resize'/);
  assert.match(app, /resizeFrame = requestAnimationFrame/);
  const frameStart = app.indexOf('function frame(now)');
  const frameEnd = app.indexOf('function magicMix(event, forcedEffect)', frameStart);
  assert.doesNotMatch(app.slice(frameStart, frameEnd), /getBoundingClientRect|resizeCanvas/);
});

test('no base64, data URLs, fetch, XHR or Object.freeze in runtime', () => {
  const runtime = html + '\n' + app + '\n' + fs.readdirSync(path.join(root, 'data/demos')).map(f => read(`data/demos/${f}`)).join('\n');
  assert.doesNotMatch(runtime, /base64/i);
  assert.doesNotMatch(runtime, /data:image/i);
  assert.doesNotMatch(runtime, /\bfetch\s*\(/);
  assert.doesNotMatch(runtime, /XMLHttpRequest/);
  assert.doesNotMatch(runtime, /Object\.freeze/);
});

test('built-in demos are pre-sampled Uint32Array data only', () => {
  for (const file of fs.readdirSync(path.join(root, 'data/demos'))) {
    const source = read(`data/demos/${file}`);
    assert.match(source, /new Uint32Array\(\[/);
    assert.doesNotMatch(source, /Image\s*\(|drawImage|getImageData|assets\/demos|assets\/thumbs/);
  }
});

test('getImageData exists only in user upload and particle text sampling paths', () => {
  assert.equal((app.match(/getImageData\s*\(/g) || []).length, 3);
  const uploadStart = app.indexOf('async function sampleUploadedFile');
  const getPixels = app.indexOf('getImageData(', uploadStart);
  assert.ok(uploadStart >= 0 && getPixels > uploadStart);
  const textStart = app.indexOf('function createParticleText');
  const samplingStart = app.indexOf('function getSamplingSize', textStart);
  const textPixels = [...app.slice(textStart, samplingStart).matchAll(/getImageData\(/g)].map(match => textStart + match.index);
  assert.equal(textPixels.length, 2);
  assert.ok(textStart >= 0 && textPixels.every(position => position > textStart && position < samplingStart));
});

test('particle engine uses typed buffers and no Particle objects', () => {
  for (const type of ['Float32Array', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int32Array']) {
    assert.match(app, new RegExp(`new ${type}`));
  }
  assert.doesNotMatch(app, /new Particle\s*\(/);
  assert.doesNotMatch(app, /class\s+Particle\b/);
});

test('render loop does not allocate gradients or color strings per particle', () => {
  const start = app.indexOf('function render(now)');
  const end = app.indexOf('function frame(now)', start);
  const render = app.slice(start, end);
  assert.doesNotMatch(render, /createRadialGradient|createLinearGradient|`rgb\(|new\s+/);
  assert.match(render, /paletteHead/);
});

test('all six source images and small thumbnails exist', () => {
  for (const name of ['astronaut','portrait','wolf','cyberpunk-city','butterfly','galaxy']) {
    const original = path.join(root, `assets/demos/${name}.jpg`);
    const thumb = path.join(root, `assets/thumbs/${name}.jpg`);
    assert.ok(fs.existsSync(original));
    assert.ok(fs.existsSync(thumb));
    assert.ok(fs.statSync(thumb).size < 40000, `${name} thumbnail is unexpectedly large`);
  }
});

test('each demo dataset stays compact and within particle cap', () => {
  for (const file of fs.readdirSync(path.join(root, 'data/demos'))) {
    const full = path.join(root, 'data/demos', file);
    assert.ok(fs.statSync(full).size < 500000, `${file} is too large`);
    const source = read(`data/demos/${file}`);
    const start = source.indexOf('new Uint32Array([') + 'new Uint32Array(['.length;
    const end = source.indexOf(']);', start);
    const body = source.slice(start, end);
    const count = body.match(/\d+/g)?.length || 0;
    assert.ok(count <= 48000, `${file} exceeds 24000 packed samples`);
    assert.ok(count >= 47500, `${file} is not using the new near-24000 sampling budget`);
  }
});


test('particle sampling constants preserve the selected centralized limits', () => {
  assert.match(app, /const MAX_PARTICLES = 24000;/);
  assert.match(app, /const DEFAULT_DENSITY = 1\.00;/);
  assert.match(app, /const MIN_PARTICLES = 250;/);
  assert.match(app, /const MIN_ALPHA = 40;/);
  assert.match(app, /const MAX_GLOW = 12;/);
  assert.match(html, /id="densityOut">100%<\/output><input id="density"[^>]*value="100"/);
  assert.match(html, /id="sizeOut">3\.2<\/output><input id="particleSize"[^>]*value="3\.2"/);
  assert.match(html, /id="forceOut">200<\/output><input id="mouseForce"[^>]*max="300"[^>]*value="200"/);
});

test('legacy max-side and stride sampling are completely removed', () => {
  assert.doesNotMatch(app, /maxSide/);
  assert.doesNotMatch(app, /\bstride\b/);
  const uploadStart = app.indexOf('async function sampleUploadedFile');
  const uploadEnd = app.indexOf('function syncOutputs', uploadStart);
  const upload = app.slice(uploadStart, uploadEnd);
  assert.doesNotMatch(upload, /px\s*\+=|py\s*\+=/);
});

test('uploaded images are downsampled against the configured particle area budget', () => {
  const start = app.indexOf('function getSamplingSize');
  const end = app.indexOf('async function sampleUploadedFile', start);
  const fn = app.slice(start, end);
  assert.match(fn, /width \* height/);
  assert.match(fn, /Math\.sqrt\(MAX_PARTICLES \/ totalPixels\)/);
  assert.match(fn, /sampleWidth \* sampleHeight > MAX_PARTICLES/);
  assert.doesNotMatch(fn, /620/);
});

test('upload keeps sampled Uint8ClampedArray and creates particles directly from sampled pixels', () => {
  const start = app.indexOf('async function sampleUploadedFile');
  const end = app.indexOf('function syncOutputs', start);
  const upload = app.slice(start, end);
  assert.match(app, /currentPixelData: null/);
  assert.match(upload, /state\.currentPixelData = new Uint8ClampedArray\(pixelData\)/);
  assert.match(upload, /const source = new Uint32Array\(sw \* sh \* 2\)/);
  assert.match(upload, /for \(let py = 0; py < sh; py\+\+\)/);
  assert.match(upload, /for \(let px = 0; px < sw; px\+\+\)/);
  assert.match(upload, /pixels\[pi \+ 3\] < MIN_ALPHA/);
});

test('density is independent of capacity and selects uniformly across the full source', () => {
  const start = app.indexOf('function createLayout');
  const end = app.indexOf('function copyUniformCurrentTargets', start);
  const map = app.slice(start, end);
  assert.match(map, /const densityCount = Math\.floor\(available \* state\.density\)/);
  assert.match(map, /Math\.min\(available, Math\.max\(MIN_PARTICLES, densityCount\)\)/);
  assert.match(map, /Math\.floor\(i \* available \/ count\)/);
  assert.match(map, /const base = sourceIndex << 1/);
  assert.doesNotMatch(map, /const base = i << 1/);
});

test('all styles now use 4096 palette buckets and neon uses per-particle glow without shadowBlur', () => {
  assert.match(app, /const glowValues = new Uint8Array\(MAX_PARTICLES\);/);
  assert.match(app, /const paletteIndex = new Uint16Array\(MAX_PARTICLES\);/);
  assert.match(app, /const paletteHead = new Int32Array\(4096\);/);
  assert.match(app, /const paletteCss = new Array\(4096\);/);
  assert.doesNotMatch(app, /shadowBlur|shadowColor/);

  const mapStart = app.indexOf('function createLayout');
  const mapEnd = app.indexOf('function copyUniformCurrentTargets', mapStart);
  const map = app.slice(mapStart, mapEnd);
  assert.match(map, /lg\[i\] = \(MAX_GLOW \* \(54 \* r \+ 183 \* g \+ 19 \* b\)\) >> 16;/);
  assert.match(map, /lp\[i\] = \(\(r >>> 4\) << 8\) \| \(\(g >>> 4\) << 4\) \| \(b >>> 4\);/);

  const paletteStart = app.indexOf('function buildPalette');
  const paletteEnd = app.indexOf('function useDemo', paletteStart);
  const palette = app.slice(paletteStart, paletteEnd);
  assert.match(palette, /for \(let i = 0; i < 4096; i\+\+\)/);
  assert.match(palette, /\(\(i >>> 8\) & 15\) << 4\) \+ 8/);
  assert.match(palette, /\(\(i >>> 4\) & 15\) << 4\) \+ 8/);
  assert.match(palette, /\(\(i & 15\) << 4\) \+ 8/);
  assert.match(palette, /const floor = Math\.min\(r, g, b\) >> 1;/);
  assert.match(palette, /r = Math\.min\(255, \(\(r - floor\) << 1\) \+ 24\);/);
  assert.match(palette, /g = Math\.min\(255, \(\(g - floor\) << 1\) \+ 24\);/);
  assert.match(palette, /b = Math\.min\(255, \(\(b - floor\) << 1\) \+ 24\);/);
  assert.doesNotMatch(palette, /const lum = \(r \+ g \+ b\) \/ 765/);

  const renderStart = app.indexOf('function render(now)');
  const renderEnd = app.indexOf('function frame(now)', renderStart);
  const render = app.slice(renderStart, renderEnd);
  assert.match(render, /for \(let bucket = 0; bucket < 4096; bucket\+\+\)/);
  assert.match(render, /if \(neon && glowValues\[i\] > 0\) \{/);
  assert.match(render, /const halo = s \+ glowValues\[i\] \* 0\.45;/);
  assert.match(render, /ctx\.globalAlpha = glowValues\[i\] \/ 40;/);
  assert.match(render, /ctx\.fillRect\(x\[i\] - halo \* \.5, y\[i\] - halo \* \.5, halo, halo\);/);
  assert.match(render, /ctx\.globalAlpha = 1;/);
});

test('image changes use spatial morphing without a second particle engine', () => {
  assert.match(app, /const MORPH_GRID_SIZE = 32;/);
  assert.match(app, /const MORPH_COLOR_STEPS = 32;/);
  for (const name of ['txA', 'tyA', 'txB', 'tyB']) {
    assert.match(app, new RegExp(`const ${name} = new Float32Array\\(MAX_PARTICLES\\);`));
  }
  assert.match(app, /const count = layout\.count;/);
  assert.match(app, /const expanding = count > currentCount;/);
  assert.match(app, /Math\.floor\(i \* layout\.count \/ count\)/);
  assert.match(app, /const heads = new Int32Array\(MORPH_GRID_SIZE \* MORPH_GRID_SIZE\);/);
  assert.match(app, /const distance = dx \* dx \+ dy \* dy;/);
  assert.match(app, /const morphT = linearT \* linearT \* \(3 - 2 \* linearT\);/);
  assert.match(app, /const baseX = txA\[i\] \+ \(txB\[i\] - txA\[i\]\) \* morphT;/);
  assert.match(app, /const colorStep = Math\.min\(MORPH_COLOR_STEPS - 1, Math\.floor\(morphT \* MORPH_COLOR_STEPS\)\);/);
  assert.match(app, /startMorph\(data, nextAspect\);/);
  assert.match(app, /startMorph\(state\.currentSource, nextAspect\);/);
});

test('morph controls expose only the requested styles and auto morph toggle', () => {
  const styles = [...html.matchAll(/data-morph-style="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(styles, ['direct', 'swirl', 'explode', 'wave', 'gravity', 'random']);
  assert.match(html, /id="morphSpeed"[^>]*min="0\.4"[^>]*max="5"[^>]*step="0\.1"/);
  assert.match(html, /id="autoMorphButton"[^>]*aria-pressed="false"/);
});

test('morph speed and auto morph are wired to runtime state', () => {
  assert.match(app, /state\.morphDuration = v \* 1000;/);
  assert.match(app, /Math\.max\(0, Math\.min\(1, \(now - state\.morphStart\) \/ state\.morphDuration\)\)/);
  assert.match(app, /state\.autoMorph = !state\.autoMorph;/);
  assert.match(app, /loadDemo\(demoNames\[nextIndex\]\);/);
  assert.match(app, /scheduleAutoMorph\(now\);/);
});

test('sections 02 through 08 are collapsed native disclosure controls', () => {
  const collapsedSections = [...html.matchAll(/<details class="panel-section collapsible-section"[^>]*>\s*<summary class="section-heading"><span>(0[2-8])<\/span>/g)].map(match => match[1]);
  assert.deepEqual(collapsedSections, ['02', '03', '04', '05', '06', '07', '08']);
});

test('requested defaults and original V5.73 background rendering are restored', () => {
  assert.match(app, /const DEFAULT_MORPH_STYLE = 'wave';/);
  assert.match(app, /const DEFAULT_CLICK_EFFECT = 'random';/);
  assert.doesNotMatch(app, /\btrails\b|trailsButton/);
  assert.match(app, /ctx\.fillStyle = 'rgba\(3,7,14,\.26\)';/);
  assert.match(app, /ctx\.fillStyle = 'rgba\(3,5,12,\.22\)';/);
});

test('all morph paths preserve the shared start and destination endpoints', () => {
  assert.match(app, /const envelope = Math\.sin\(Math\.PI \* morphT\);/);
  for (const style of ['swirl', 'explode', 'wave', 'gravity']) {
    assert.match(app, new RegExp(`style === '${style}'`));
  }
  assert.match(app, /\['direct', 'swirl', 'explode', 'wave', 'gravity'\]\[\(Math\.random\(\) \* 5\) \| 0\]/);
  assert.match(app, /tx\.set\(txB\.subarray\(0, state\.count\)\);/);
  assert.match(app, /ty\.set\(tyB\.subarray\(0, state\.count\)\);/);
});

test('interaction effect dropdown exposes exactly the requested choices', () => {
  const start = html.indexOf('<select id="clickEffectSelect"');
  const end = html.indexOf('</select>', start);
  const effects = [...html.slice(start, end).matchAll(/<option value="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(effects, ['random', 'mirror-rise', 'center-bloom', 'sweep-wave', 'letter-scramble', 'shatter', 'vortex-line', 'glitch-slices', 'pixel-rain', 'shockwave', 'spiral', 'explosion', 'implosion', 'letter-spin', 'domino', 'elastic-stretch']);
  assert.match(html, /id="playEffectButton"/);
  assert.match(html, /id="recordButton"[^>]*aria-pressed="false"/);
});

test('interaction effects include all distinct paths and shuffle-bag random', () => {
  for (const effect of ['mirror-rise', 'center-bloom', 'sweep-wave', 'letter-scramble', 'shatter', 'vortex-line', 'glitch-slices', 'pixel-rain', 'shockwave', 'spiral', 'explosion', 'implosion', 'letter-spin', 'domino', 'elastic-stretch']) {
    assert.match(app, new RegExp(`effect === '${effect}'`));
  }
  assert.match(app, /const CLICK_EFFECTS = \[/);
  assert.match(app, /function refillShuffleBag/);
  assert.match(app, /function takeRandomEffect/);
  assert.match(app, /const shardCount = 12;/);
  assert.doesNotMatch(app, /FREEZE_DURATION|freezeUntil|effect === 'freeze'/);
});

test('interaction effects support pointer click, touch and explicit play', () => {
  assert.match(app, /canvas\.addEventListener\('pointerup', function \(event\) \{ magicMix\(event\); \}\)/);
  assert.match(app, /ui\.playEffect\.addEventListener\('click'/);
  assert.match(app, /ui\.playEffect\.addEventListener\('click', function \(\) \{ magicMix\(null\); \}\)/);
});

test('text particles carry character groups through layout and morph', () => {
  assert.match(app, /const particleGroup = new Int16Array\(MAX_PARTICLES\);/);
  assert.match(app, /const particleGroupA = new Int16Array\(MAX_PARTICLES\);/);
  assert.match(app, /const particleGroupB = new Int16Array\(MAX_PARTICLES\);/);
  assert.match(app, /Intl\.Segmenter/);
  assert.match(app, /currentSourceGroups/);
  assert.match(app, /particleGroup\.set\(particleGroupB\.subarray\(0, state\.count\)\)/);
});

test('effect automation exposes an ordered sequence builder and always pauses during morph', () => {
  for (const id of ['loopInterval', 'sequenceEffectSelect', 'addSequenceEffectButton', 'effectSequenceList', 'clearSequenceButton', 'sequenceOrder', 'automationButton']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(html, /id="pauseDuringMorph"/);
  assert.doesNotMatch(html, /Repeat selected effect|Uncheck “Repeat selected effect”/);
  assert.match(app, /function runEffectAutomation/);
  assert.match(app, /function toggleEffectAutomation/);
  assert.match(app, /function renderEffectSequence/);
  assert.match(app, /state\.effectSequence\.push\(ui\.sequenceEffectSelect\.value\)/);
  assert.match(app, /state\.effectSequence\.splice\(index, 1\)/);
  assert.match(app, /if \(state\.morphing\) \{/);
  assert.match(app, /function takeSequenceEffect/);
  assert.match(app, /refillShuffleBag\(sequence, state\.lastSequenceEffect\)/);
});

test('WebM recording uses canvas captureStream and MediaRecorder', () => {
  assert.match(app, /canvas\.captureStream\(RECORDING_FPS\)/);
  assert.match(app, /if \(!mimeType\)/);
  assert.match(app, /new MediaRecorder\(stream, \{ mimeType \}\)/);
  assert.match(app, /new Blob\(chunks, \{ type \}\)/);
  assert.match(app, /link\.download = 'particle-lab-recording\.webm';/);
  assert.match(app, /state\.recorder\.stop\(\);/);
});

test('particle text exposes text controls and reuses the morph target pipeline', () => {
  assert.match(html, /id="particleText"[^>]*maxlength="120"[^>]*dir="auto"/);
  assert.match(html, /id="textFont"/);
  for (const font of ['Rubik', 'Assistant', 'Heebo', 'Frank Ruhl Libre', 'Noto Sans Hebrew', 'Noto Serif Hebrew', 'Alef', 'Secular One', 'Suez One', 'Varela Round', 'Miriam Libre', 'Playpen Sans Hebrew']) {
    assert.match(html, new RegExp(`<option value="${font}"`));
  }
  for (const removedFont of ['Inter', 'Poppins', 'Georgia', 'Rubik Bubbles', 'Rubik Glitch', 'Rubik Moonrocks', 'Rubik Pixels']) {
    assert.doesNotMatch(html, new RegExp(`<option value="${removedFont}"`));
  }
  assert.match(html, /id="textSize"[^>]*min="24"[^>]*max="360"[^>]*value="96"/);
  assert.match(html, /id="textWeight"/);
  assert.match(html, /id="textColorStart"[^>]*type="color"/);
  assert.match(html, /id="textColorEnd"[^>]*type="color"/);
  assert.doesNotMatch(html, /id="textBackground"/);
  assert.match(html, /id="gradientText"[^>]*type="checkbox"/);
  assert.match(html, /id="rainbowText"[^>]*type="checkbox"/);
  assert.match(html, /id="createTextButton"/);
  assert.match(app, /async function createParticleText\(\)/);
  assert.match(app, /textContext\.direction = \/\[\\u0590-\\u05ff\]\//);
  assert.match(app, /startMorph\(state\.currentSource, state\.imageAspect\);/);
});

test('rainbow text spans the full text canvas and overrides the solid color', () => {
  assert.match(app, /if \(ui\.rainbowText\.checked\)/);
  assert.match(app, /createLinearGradient\(textLeft, 0, textRight, 0\)/);
  assert.equal((app.match(/rainbow\.addColorStop\(/g) || []).length, 7);
  assert.match(app, /ui\.gradientText\.disabled = rainbow;/);
  assert.match(app, /ui\.textColorStart\.disabled = rainbow;/);
});

test('particle typography uses pixel sizing, font families and explicit weight behavior', () => {
  assert.match(app, /const requestedSize = Number\(ui\.textSize\.value\);/);
  assert.match(app, /const fontFamily = ui\.textFont\.value;/);
  assert.match(app, /await document\.fonts\.load\(`\$\{weight\} 32px "\$\{fontFamily\}"`, text\)/);
  assert.match(app, /textContext\.font = `\$\{weight\} \$\{fontSize\}px \$\{fontStack\}`;/);
  assert.match(app, /const weights = ui\.textFont\.selectedOptions\[0\]\.dataset\.weights\.split\(','\);/);
  assert.match(app, /ui\.textWeight\.disabled = weights\.length === 1;/);
  assert.match(app, /ui\.textSizeOut\.textContent = `\$\{ui\.textSize\.value\} px`;/);
});

test('font loading validates the selected family against the user text without Rubik fallback', () => {
  assert.match(html, /id="fontWarning"[^>]*aria-live="polite"/);
  assert.match(app, /const usesHebrew = \/\[\\u0590-\\u05ff\]\//);
  assert.match(app, /if \(usesHebrew && !supportedScripts\.includes\('hebrew'\)\)/);
  assert.match(app, /if \(!loadedFaces\.length\)/);
  assert.match(app, /const fontStack = `"\$\{fontFamily\}", sans-serif`;/);
  assert.doesNotMatch(app, /const fontStack = `"\$\{fontFamily\}", "Rubik"/);
});

test('two-color text gradient uses both user-selected colors', () => {
  assert.match(app, /else if \(ui\.gradientText\.checked\)/);
  assert.match(app, /gradient\.addColorStop\(0, ui\.textColorStart\.value\);/);
  assert.match(app, /gradient\.addColorStop\(1, ui\.textColorEnd\.value\);/);
});

test('particle text samples only visible glyph pixels without background particles', () => {
  const start = app.indexOf('async function createParticleText');
  const end = app.indexOf('function getSamplingSize', start);
  const textPath = app.slice(start, end);
  assert.doesNotMatch(textPath, /textBackground|fillRect\(0, 0, sw, sh\)/);
  assert.match(textPath, /if \(pixels\[pi \+ 3\] < MIN_ALPHA\) continue;/);
});
