'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'preload.cjs'), 'utf8');

// Custom background selection, persistence, restore and removal are all exposed safely.
assert.match(html, /id="chooseProfileBackgroundBtn"/, 'settings should expose a background image chooser');
assert.match(html, /id="removeProfileBackgroundBtn" hidden/, 'background removal should be hidden until a custom image is active');
assert.match(app, /profileBackgroundName/ , 'selected background filename should be persisted in app settings');
assert.match(app, /function restoreProfileBackground\(\)/, 'custom background should restore after app restart');
assert.match(app, /function chooseProfileBackground\(\)/, 'custom background should be selectable');
assert.match(app, /function removeProfileBackground\(\)/, 'custom background should be removable');
assert.match(app, /applyCustomProfileBackground\(\)/, 'removal should restore the default background');
assert.match(preload, /selectProfileBackground:/, 'preload should expose image selection');
assert.match(preload, /loadProfileBackground:/, 'preload should expose image restore');
assert.match(preload, /removeProfileBackground:/, 'preload should expose image removal');
assert.match(main, /MAX_PROFILE_BACKGROUND_BYTES = 10 \* 1024 \* 1024/, 'background images should have a file size limit');
assert.match(main, /PROFILE_BACKGROUND_EXTENSIONS = new Set\(\['\.jpg', '\.jpeg', '\.png', '\.webp'\]\)/, 'only supported raster background formats should be accepted');
assert.match(main, /profileBackgroundDirectory\(\)/, 'background files should be stored in app-owned data');
assert.match(main, /assertTrustedSender\(event\);[\s\S]*?foxsmusic:select-profile-background/, 'background selection should use trusted IPC');

// Birthday season must be a selectable, localized mode with an animated cake and falling sweets.
assert.match(html, /<option value="birthday">День рождения<\/option>/, 'birthday mode should appear in the seasonal mode selector');
assert.match(app, /new Set\(\['normal', 'halloween', 'christmas', 'birthday'\]\)/, 'birthday mode should be accepted by appearance settings');
assert.match(app, /profileModeBirthday: 'День рождения'/, 'birthday mode should be localized in Russian');
assert.match(app, /profileModeBirthday: 'Birthday'/, 'birthday mode should be localized in English');
assert.match(app, /profileModeBirthday: 'Geburtstag'/, 'birthday mode should be localized in German');
assert.match(html, /class="seasonal-art birthday-art"/, 'birthday mode should have a dedicated seasonal scene');
assert.match(html, /class="birthday-cake"/, 'birthday scene should contain a central cake');
assert.match(html, /class="birthday-flame flame-main"/, 'birthday cake should include lit candles');
assert.match(html, /class="birthday-candy candy-fall-a"/, 'birthday scene should include falling candies');
assert.match(css, /birthday-candy-fall/, 'candies should animate gently down the sides');
assert.match(css, /birthday-confetti-fall/, 'confetti should fall during birthday mode');
assert.match(html, /class=\"birthday-night-backdrop\"/, 'birthday scene should use a dark night backdrop');
assert.match(html, /class=\"birthday-candle-auras\"/, 'candle flames should cast separate soft light pools');
assert.match(html, /class=\"birthday-glint glint-a\"/, 'birthday scene should include tiny flickering candle glints');
assert.match(css, /linear-gradient\(100deg, #bd819e 0%, #aa9ac6 30%, #8eabb1 57%, #c4a879 80%/, 'birthday headline should use a subdued multicolor gradient');
assert.match(css, /birthday-candle-glow/, 'candle glow should gently pulse');
assert.match(css, /birthday-glint-twinkle/, 'small lights should twinkle');
assert.match(css, /candy-fall-h[\s\S]*?animation-duration: 24s, 7.1s, 24s/, 'falling candy should move slowly and naturally');
assert.match(css, /prefers-reduced-motion: reduce[\s\S]*?birthday-candy/, 'birthday animations should respect reduced-motion preferences');


// Birthday animation parity: flame has three distinct living animations, confetti has
// a dense set of pieces with continuous fall/sway/fade layers, and reduced-motion
// overrides preserve the seasonal loops unless the in-app Effects toggle is off.
assert.match(html, /class="birthday-fire-sparks"/, 'birthday candles should emit small rising sparks');
assert.match(html, /class="birthday-flame flame-left"/, 'left candle should have an independent flame animation');
assert.match(html, /class="birthday-flame flame-right"/, 'right candle should have an independent flame animation');
assert.match(html, /birthday-confetti-piece confetti-x/, 'birthday scene should contain a denser confetti field');
assert.match(css, /animation-name: birthday-confetti-fall, birthday-confetti-sway, birthday-confetti-fade/, 'confetti should use continuous fall, sway and fade layers');
assert.match(css, /christmas-flame-main-smooth \.86s ease-in-out infinite alternate/, 'birthday centre candle should reuse the natural Christmas flame motion');
assert.match(css, /birthday-spark-rise/, 'birthday flames should emit rising sparks');
assert.match(css, /body\[data-profile-mode="birthday"\]:not\(\.effects-off\) \.birthday-confetti-piece[\s\S]*?animation-iteration-count: infinite, infinite, infinite !important/, 'birthday confetti should keep looping under system reduced-motion settings');

console.log('Profile appearance features: custom background + birthday season checks passed.');
