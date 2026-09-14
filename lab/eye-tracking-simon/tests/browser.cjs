const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(process.env.TEMP || '/tmp', 'faces-game-checks');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  let server;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const app = window.EyeTracking = {};
      window.check = { cues: [], changes: [], tones: [], attempts: [], effects: { bubbles: 0, smoke: 0, water: 0 } };
      let factory;
      let renderFactory;
      Object.defineProperty(app, 'createRenderer', {
        get: () => (...args) => {
          check.renderer=renderFactory(...args);
          const render=check.renderer.render;
          check.renderer.render=state=>{check.eye={x:state.irisX,y:state.irisY};return render(state);};
          return check.renderer;
        },
        set: value => {renderFactory=value;},
      });
      Object.defineProperty(app, 'createSimonGame', {
        get: () => options => {
          const game = factory({ ...options,
            onChange: state => { check.state = state; check.changes.push({...state}); options.onChange(state); },
            onCue: (face, ms) => { check.cues.push({face,ms}); options.onCue(face,ms); } });
          check.game = game;
          return game;
        }, set: value => { factory = value; },
      });
      for (const [name, key] of [['createBubbleSystem','bubbles'],['createSmokeSystem','smoke'],['createWaterSystem','water']]) {
        let make;
        Object.defineProperty(app, name, { get: () => () => {
          const system=make(), emit=system.emitAt;
          system.emitAt=(...args)=>{const accepted=emit(...args);check.attempts.push({key,args,accepted});if(accepted)check.effects[key]++;return accepted;};
          return system;
        },set: value=>{make=value;} });
      }
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
        if (image.naturalWidth === 1024 && args.length === 4) check.view = {x:args[0],y:args[1],scale:args[2]/1024};
        return draw.call(this,image,...args);
      };
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) {
        const oscillator = Audio.prototype.createOscillator;
        Audio.prototype.createOscillator = function() {
          const voice = oscillator.call(this), set = voice.frequency.setValueAtTime.bind(voice.frequency);
          voice.frequency.setValueAtTime=(frequency,time)=>{check.tones.push(frequency);return set(frequency,time);};
          return voice;
        };
      }
    });
    await page.clock.install();
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => !document.getElementById('playButton').disabled);
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
    await page.clock.runFor(100);
    await page.screenshot({path:path.join(output,'desktop-idle.png')});
    const point = async (x,y) => page.evaluate(([x,y])=>({x:check.view.x+x*check.view.scale,y:check.view.y+y*check.view.scale}),[x,y]);
    const clickSource = async (x,y,tap=false) => {const p=await point(x,y); if(tap)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);};
    const current = () => page.evaluate(()=>check.state);
    const openGame = async () => {
      if(await page.locator('#playButton').isVisible()) await page.locator('#playButton').click();
      await page.clock.runFor(100);
    };
    const playback = async () => {
      const before = await page.evaluate(()=>check.cues.length);
      const state = await current();
      const baseCueMs = await page.evaluate(level => window.EyeTracking.gameConfig.levels[level].cueMs || window.EyeTracking.gameConfig.cueMs, state.level);
      const cueMs = Math.max(600, baseCueMs - Math.max(0, state.round - 1) * 25);
      await page.clock.runFor(650+state.length*(cueMs+300)+(state.confusion?800:0));
      assert.equal((await current()).phase,'input');
      return page.evaluate(start=>check.cues.slice(start).map(c=>c.face),before);
    };
    assert.equal(await page.locator('#gamePanel').isVisible(),false,'Landing hides all game controls');
    assert.equal(await page.locator('#gameHud').isVisible(),false);
    const landingView=await page.evaluate(()=>check.view);
    assert.equal(landingView.scale,Math.max(1440/1024,1000/1536),'Landing restores the full-bleed image');
    assert.equal(landingView.x,0);
    await page.mouse.move(100,100);await page.clock.runFor(100);
    const eyeLeft=await page.evaluate(()=>check.eye.x);
    await page.mouse.move(1400,900);await page.clock.runFor(100);
    assert.ok(eyeLeft<0 && await page.evaluate(()=>check.eye.x>0),'Eye follows the pointer on the landing page');
    await clickSource(860,650);await clickSource(580,650);await clickSource(240,650);await clickSource(130,700);
    assert.deepEqual(await page.evaluate(()=>check.effects),{bubbles:1,smoke:1,water:1},'Landing effects work before opening game');
    await openGame();
    assert.equal(await page.locator('#gamePanel #gameHud').count(),1,'All HUD elements share the single panel');
    await page.locator('#startButton').click();
    await page.clock.runFor(700);
    assert.equal((await current()).phase,'playback','Opening starts playback');
    const cuesBeforeClose = await page.evaluate(() => check.cues.length);
    await page.locator('#exitButton').click();
    await page.clock.runFor(5000);
    assert.equal((await current()).phase,'idle','Closing during playback cancels the active sequence');
    assert.equal(await page.evaluate(() => check.cues.length), cuesBeforeClose,'Closing cancels pending playback timers');
    assert.equal(await page.locator('#gamePanel').isVisible(),false,'Closing during playback hides the panel');
    await openGame();
    await page.locator('#difficulty').selectOption('advanced');
    await page.locator('#startButton').click();
    await clickSource(580,650); // blocked during playback
    assert.equal((await current()).progress,0);
    let sequence=await playback();
    assert.equal(sequence.length,3); assert.equal((await current()).remainingMs,30000);
    for(const face of [3,4]) {
      await page.evaluate(index=>{check.renderer.setGameState(true,index);check.renderer.render({irisX:0,irisY:0,pupilScale:1,blinkProgress:0});},face);
      await page.screenshot({path:path.join(output,`contour-${face===3?'yellow':'orange'}.png`)});
    }
    await page.evaluate(()=>{check.renderer.setGameState(true,null);check.renderer.render({irisX:0,irisY:0,pupilScale:1,blinkProgress:0});});
    await page.locator('#muteButton').click(); // silence subsequent automated runs
    await clickSource(40,700);
    assert.equal((await current()).progress,0);
    await page.locator(`[data-face="${sequence[0]}"]`).click();
    await page.clock.runFor(1000);
    assert.equal((await current()).remainingMs,29000);
    for(const face of sequence.slice(1))await page.keyboard.press(String(face+1));
    assert.equal((await current()).phase,'success');
    await page.clock.runFor(1150);
    const next=await playback();
    assert.equal(next.length,4); assert.notDeepEqual(next.slice(0,3),sequence);
    assert.equal((await current()).remainingMs,40000);
    await page.locator(`[data-face="${(next[0]+1)%5}"]`).click();
    assert.equal((await current()).failure,'wrong');
    assert.equal((await current()).phase,'error');
    assert.equal((await current()).activeFace,next[0]);
    await page.clock.runFor(2500);
    assert.equal((await current()).phase,'lost');
    await page.locator('#difficulty').selectOption('champion');
    await page.locator('#startButton').click(); sequence=await playback();
    assert.equal((await current()).remainingMs,15000);
    // Trigger the real visibility handler with an instrumented visibility value.
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal((await current()).phase,'paused');
    await page.clock.runFor(120000);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
    assert.deepEqual(await playback(),sequence);
    assert.equal((await current()).remainingMs,15000);
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
    assert.equal((await current()).phase,'paused');
    await page.clock.runFor(5000);
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
    assert.deepEqual(await playback(),sequence);
    await page.clock.runFor(15000);
    assert.equal((await current()).failure,'timeout');

    const centers=[[860,650],[580,650],[390,650],[250,650],[150,650]];
    for(const size of [{width:390,height:844},{width:320,height:640},{width:844,height:390}]) {
      await page.locator('#exitButton').click();
      await page.setViewportSize(size); await page.clock.runFor(100);
      assert.equal(await page.locator('#gamePanel').isVisible(),false);
      await page.screenshot({path:path.join(output,`landing-${size.width}x${size.height}.png`)});
      await openGame();
      await page.locator('#difficulty').selectOption('beginner');
      await page.locator('#startButton').click();
      // Deliberately deterministic sequence for direct-image hit-area checks.
      await page.clock.runFor(650);
      await page.screenshot({path:path.join(output,`highlight-${size.width}x${size.height}.png`)});
      await page.clock.runFor(4500);
      const layout = await page.evaluate(()=>({panel:document.getElementById('gamePanel').getBoundingClientRect().toJSON(),hud:document.getElementById('gameHud').getBoundingClientRect().toJSON(),scroll:document.documentElement.scrollWidth}));
      assert.ok(layout.panel.x>=0 && layout.panel.right<=size.width+1);
      assert.ok(layout.hud.top>=layout.panel.top && layout.hud.bottom<=layout.panel.bottom);
      assert.ok(layout.scroll<=size.width);
      for(let i=0;i<centers.length;i++) {
        const p=await point(...centers[i]);
        assert.ok(p.x>=0&&p.x<size.width&&p.y>=0&&p.y<size.height
          && (p.y<layout.panel.top || p.x>layout.panel.right),`Face ${i} visible at ${size.width}`);
      }
      const keysFit=await page.locator('[data-face]').evaluateAll(buttons=>buttons.every(button=>{
        const b=button.getBoundingClientRect(),p=document.getElementById('gamePanel').getBoundingClientRect();
        return b.left>=p.left&&b.right<=p.right&&b.height>=44;
      }));
      assert.equal(keysFit,true,'All five touch buttons fit inside their panel');
      // Each face must route to its own cue when physically tapped, even if wrong.
      for(let i=0;i<centers.length;i++) {
        if((await current()).phase==='error') await page.clock.runFor(2500);
        if((await current()).phase!=='input') {await page.locator('#startButton').click();await playback();}
        await clickSource(...centers[i],true);
        assert.equal(await page.evaluate(()=>check.cues.at(-1).face),i);
        if((await current()).phase==='input') {await page.locator('#exitButton').click();await openGame();await page.locator('#startButton').click();await playback();}
      }
      if((await current()).phase==='input') {
        await page.clock.runFor(120000);
        assert.equal((await current()).phase,'input');
      }
    }
    assert.deepEqual(await page.evaluate(()=>check.effects),{bubbles:1,smoke:1,water:1});
    await page.locator('#exitButton').click();
    await page.setViewportSize({width:1024,height:1000});
    // Browser resize delivery uses the real display frame; let it arrive before
    // advancing the mocked requestAnimationFrame that performs the resize.
    await page.waitForTimeout(60); await page.clock.runFor(100);
    assert.equal(await page.locator('#sceneCanvas').evaluate(canvas=>canvas.getBoundingClientRect().width),1024);
    await clickSource(860,650); await clickSource(580,650); await clickSource(240,650); await clickSource(130,700);
    assert.deepEqual(await page.evaluate(()=>check.effects),{bubbles:2,smoke:2,water:2},JSON.stringify(await page.evaluate(()=>({attempts:check.attempts,view:check.view}))));
    assert.equal(await page.locator('#gamePanel').isVisible(),false,'Closing restores landing');
    assert.equal(await page.locator('#playButton').isVisible(),true);
    assert.ok((await page.evaluate(()=>check.tones.length))>0,'Web Audio oscillators created from user gesture');
    assert.deepEqual(errors,[]);

    // Check the same unchanged static folder over HTTP, as it will be hosted.
    server=http.createServer((req,res)=>{
      const file=path.resolve(root,'.'+decodeURIComponent(req.url==='/'?'/index.html':req.url));
      if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
      const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'}[path.extname(file)];
      fs.readFile(file,(error,data)=>{if(error)res.writeHead(404).end();else{res.setHeader('Content-Type',type||'application/octet-stream');res.end(data);}});
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(()=>!document.getElementById('playButton').disabled);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await openGame();
    await page.locator('#startButton').click();
    assert.equal((await current()).phase,'playback');
    await playback();
    assert.equal((await current()).phase,'input');
    assert.deepEqual(errors,[]);
    console.log('PASS: complete rounds, fresh sequences, timing, wrong/timeout/retry, visibility replay, all five image hit areas, touch/keyboard, responsive layouts, effect suppression/restoration, Web Audio, file:// and HTTP.');
    console.log(`Visual evidence: ${output}`);
  } finally {
    await browser.close();
    if(server)await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
