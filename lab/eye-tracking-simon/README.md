# זיכרון בצבע — Faces Memory Game

Copyright © 2026 חגי און / Hagay Onn and ailoveu.art. All rights reserved.

A dependency-free interactive artwork built with plain HTML, CSS and JavaScript. It works directly from `file://` in modern browsers and uses explicit script paths only - no imports, modules, bundler, build step or server.

## Game rules

- The landing page shows the original full-bleed interactive artwork, eye tracking, bubbles and smoke, with only a small **לשחק!** button.
- Clicking the orange face pours a translucent blue water stream that fills the screen upward. It stays full until another landing-page click starts the drain; opening the game clears it.
- Press **לשחק!** to open the compact game panel, choose a difficulty, then press **התחל משחק**. The title, statistics, sound, controls and close button all live in this single panel. Five faces participate: natural, blue, green, yellow and orange. The additional face at the far left is decorative.
- The first sequence contains three faces. Each cue lasts 1.2 seconds, followed by a 0.3-second gap, including consecutive repeated faces.
- After playback, reproduce the sequence by clicking/tapping the faces, the matching color buttons, or keys 1–5 (natural through orange).
- Every completed stage generates a fresh random sequence one face longer. Its previous-length prefix is guaranteed to differ from the preceding stage. Repeated faces remain allowed.
- Beginners have unlimited time. Advanced players receive length × 10 seconds; champions receive length × 5 seconds. This total answer budget starts after playback and never resets per click.
- Playback gets faster with difficulty: 1.2 seconds per face for beginners, 1 second for advanced players and 0.8 seconds for champions, with a small additional reduction as stages advance.
- **אתגר יומי** uses a date-seeded sequence shared by every visitor on that local calendar day.
- The surprise-mode selector can require the sequence in reverse during input, hide visual playback cues for a sound-only challenge, or combine both modes. Playback itself always shows the generated sequence in its normal order.
- The result summary shows the current run's longest fully completed sequence (not the failed sequence), memory score from 1–10 (`longest completed sequence − 2`, capped at 10) and average reaction speed in seconds with millisecond precision. The achievements card keeps the personal best for each of these metrics.
- A wrong face plays the error sound immediately and highlights the correct face for 2.5 seconds before ending the run; an expired deadline ends it immediately. Retry starts a new run at length three. Clicks outside the five faces and clicks during playback or the correction reveal are ignored.
- Each face has a distinct synthesized note. Success and failure have separate chimes; the sound button mutes all game sounds.
- The compact achievements card stores the longest completed sequence, highest memory score and fastest average reaction speed locally. On supported phones, success and error use distinct vibration patterns; the vibration button turns them off.
- A shared daily best is reserved for a future registered-user version and is intentionally not shown in the guest card.
- Hiding the page pauses the game and stops sound. Returning replays the current sequence from its beginning, clears partial input, and restores the full answer budget after playback.
- Soap bubbles and smoke are disabled while the game panel is open. Its **×** button closes the game, hides all its controls, and restores the landing artwork and interactions.
- The artwork stays aligned right. Opening the game fits the five playable faces horizontally; the compact panel floats over the lower image, without reserving an empty side column. Orange and yellow use contour strips from forehead to the beginning of the neck, following their shared boundary.

## Implemented

- Canvas-based eye compositing over the original artwork.
- Reconstructed sclera background patch.
- Independent iris and pupil rendering.
- Perspective compression near gaze limits.
- Non-linear pointer mapping and asymmetric eye range.
- Spring/damping gaze movement with velocity.
- Pointer-distance pupil response.
- Corneal highlight decoupled from the iris.
- Upper eyelid shadow.
- Procedural blink using eyelid texture from the source artwork.
- Random natural blink timing and occasional double blinks.
- Micro-saccades while holding a gaze.
- Autonomous idle gaze after the pointer leaves.
- Mouse, pen and touch support via Pointer Events.
- Click or tap the foreground woman's face to release small iridescent soap bubbles from one or both nostrils; they float upward and fade away.
- Click or tap the blue woman's face to release soft white smoke from a randomly selected nostril or both; it rises, spreads and dissipates.
- Click or tap the orange woman's face to fill the screen with a translucent blue water stream; a later landing-page click drains it.
- `prefers-reduced-motion` support.
- HiDPI canvas rendering with capped DPR.
- Animation loop sleeps when nothing is moving.
- Rendering stops while the tab is hidden.
- Resize work is coalesced through `requestAnimationFrame`.
- User-visible fallback and error handling if images or Canvas fail.

## Files

- `index.html` - page structure and explicit script paths.
- `css/style.css` - full-screen presentation and fallback/error UI.
- `js/config.js` - tuning constants.
- `js/utils.js` - shared helpers and image loading.
- `js/bubbles.js` - foreground face hit area, nostril emitters and soap-bubble animation.
- `js/smoke.js` - blue face hit area and soft, expanding white smoke plumes.
- `js/renderer.js` - all Canvas drawing.
- `js/motion.js` - gaze, spring, pupil, blink and idle behavior.
- `js/app.js` - startup, events, lifecycle and error handling.
- `js/game-config.js` - five face outlines, notes, difficulty settings and cue durations.
- `js/game.js` - independently testable game state, fresh sequences, deadlines and pause/resume.
- `js/game-ui.js` - Hebrew/English controls, touch/keyboard interaction, progress and countdown.
- `js/audio.js` - local Web Audio notes, results and muting; no sound downloads.
- `.htaccess` - Apache directory-listing block and security headers for hosted deployments.
- `LICENSE` - copyright and usage terms for חגי און / Hagay Onn and ailoveu.art.
- `assets/original.webp` - static fallback artwork.
- `assets/background-clean.webp` - eye background without the original iris.
- `assets/iris-base.png` - reconstructed iris texture without the original fixed pupil.

## Run

Open `index.html` directly in a browser.

## Upload

The canonical page URL is `https://ailoveu.art/lab/eye-track-simon/index.html`.
Static Open Graph and Twitter card tags use the homepage artwork at `https://ailoveu.art/lab/eye-track-simon/assets/original.webp`,
The `.htaccess` file disables directory listing and adds a restrictive Content-Security-Policy plus browser security headers on Apache hosting.
If the host uses Nginx or a hosting control panel, configure the same headers there instead.
There is no automatic minify or obfuscation step, backend or external CDN.
`tests/`, `package.json` and this README are optional on the live site.
Replace the full JavaScript folder, including the new game files, and refresh any hosting cache after upload.

The readable source remains in the private repository. The public deployment should contain only the files needed to run the site.
Do not upload source maps or add `sourceMappingURL` comments if a separate production minification process is introduced later.

## Tests

With Node.js installed, run `npm test` for the 42 game, audio, face-region, landing-effect, achievement and language tests. The runtime itself has no package dependencies.

The browser integration checks additionally need Playwright available to Node and an installed Chrome browser. Run `npm run test:browser`; set `BROWSER_CHANNEL` to another installed Playwright Chromium channel if needed. Browser checks cover actual image clicks, touch/keyboard, three difficulty levels, timer deadlines, retries, visibility, closing during playback, effect isolation, responsive layouts (320×640, 390×844 and 844×390), and loading both from disk and a temporary local HTTP server. Screenshots are saved under the system temporary directory in `faces-game-checks`.

## Visual tuning

The main calibration values are intentionally centralized in `js/config.js`. The first values to adjust after visual review are `eye.centerX`, `eye.centerY`, movement limits, pupil radius, clip control points and blink source rectangles.

## Performance note

The runtime uses high-quality WebP assets. The main background is roughly one order of magnitude smaller than the working PNG while preserving the original 1024×1536 resolution.

## Achievement persistence

Length and score records save immediately after success. The final whole-game speed saves after a wrong answer or timeout. Better existing records are preserved, including fractional milliseconds. Integration tests run the real game and UI with DOM/storage adapters and cover saving, reloading, timeouts and closing immediately after success.

# By Hagay Onn / ailoveu.art

## Language toggle

The English / עברית button at the top left switches the interface, accessible labels and document direction. Hebrew is the default; the preference is stored locally using eyeTrackingColorMemory.language. Switching during a game preserves the sequence, progress, deadline and records. The physical face-button order remains aligned with the artwork. The translation dictionary is in js/i18n.js; it uses classic JavaScript with no extra dependency or build step. Static social metadata remains Hebrew.


## Friend challenges and color shuffle (3.3.0)

After completing at least one stage and finishing a game, “Challenge a friend”
shares a link and result through the device share menu. If unavailable, the
message is copied; when clipboard access is blocked (including some file://
browsers), a selectable link is displayed instead. Cancelling native sharing
does not copy anything. The existing Open Graph artwork supplies the link preview;
per-player text is in the shared message, not in dynamically generated social metadata.

The `challenge` query parameter contains a versioned seed, difficulty, surprise mode, daily flag,
completed sequence length and average response time. Opening it presents the
friend's target and locks the original rules until “Play your own game” is chosen.
Every stage is reproduced from length 3, including stages beyond the friend's
result. Retry replays the same challenge. Completing a longer sequence beats the
friend; equal completed lengths are a tie. Speed is descriptive, not a tiebreaker.
The shared score is self-reported; no accounts, webhook, server or leaderboard
are included. Club of 10 is explicitly deferred.

Color shuffle is a separate surprise mode. Playback uses the initial colors.
After playback all five colors move to different faces over 800 ms; input stays
locked and the answer timer starts only after this transition. Clicks, number
keys, button labels, highlights and notes follow the colors in their new physical
positions. Reduced-motion users see the new palette without an animated blend.
Pause/resume repeats the same sequence and permutation. Closing cancels the swap
and restores the landing artwork. Rendering uses canvas color blending with no
pixel reads, new artwork assets or permanent animation loop.

`js/challenge.js` is a classic local script. Upload it along with the updated
HTML, CSS and JavaScript. Version-1 links depend on the current seeded generator,
sequence rules, cue timings and shuffle algorithm: a future change to those rules
must preserve version-1 playback or reject that version instead of changing it.

`npm test` includes deterministic replay, color-based answers, guarded transition
cancellation, malformed links, share/copy fallbacks, cancellation and Hebrew/English
labels. `npm run test:browser` additionally exercises actual artwork clicks,
responsive headers, opening a friend's link, closing during a swap, local files
and HTTP with the supplied CSP. Browser-test screenshots are written to the system
temporary directories `faces-game-checks` and `faces-challenge-checks`.
