const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function extract(startMarker, endMarker) {
  const start = app.indexOf(startMarker);
  const end = app.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `could locate ${startMarker}`);
  return app.slice(start, end);
}

// Run the real cycleRepeat() logic with lightweight fake UI and both decks.
const cycleSource = extract('  function cycleRepeat() {', '  async function toggleFavorite(');
const calls = { persist: 0, render: 0, toast: [] };
const audioDecks = [{ loop: false }, { loop: false }];
const context = {
  repeatMode: 'off', audioDecks,
  ui: { audio: audioDecks[0], repeatBtn: { classList: { toggle() {} }, setAttribute() {}, setAttribute() {}, title: '' }, shuffleBtn: { classList: { toggle() {} }, title: '' }, volumeBar: { value: 76 }, muteBtn: { classList: { toggle() {} }, innerHTML: '' } },
  persistSettings: () => calls.persist++, renderControls: () => calls.render++,
  toast: message => calls.toast.push(message), tr: key => key,
  $: () => ({})
};
vm.runInNewContext(`${cycleSource}; this.cycleRepeat = cycleRepeat;`, context);
context.cycleRepeat();
assert.equal(context.repeatMode, 'all', 'first click enables repeat playlist');
assert.ok(audioDecks.every(deck => deck.loop === false), 'repeat playlist does not enable native one-track looping');
context.cycleRepeat();
assert.equal(context.repeatMode, 'one', 'second click enables repeat one');
assert.ok(audioDecks.every(deck => deck.loop === true), 'Repeat One enables native loop on both decks');
context.cycleRepeat();
assert.equal(context.repeatMode, 'off', 'third click disables repeat');
assert.ok(audioDecks.every(deck => deck.loop === false), 'turning repeat off disables loop on both decks');
assert.equal(calls.persist, 3, 'each mode change is persisted');
assert.equal(calls.render, 3, 'each mode change updates visible button state');

assert.match(app, /function maybeStartAutoCrossfade\(\)\s*\{[\s\S]*?if \(repeatMode !== 'all' \|\| autoCrossfadeRunning/);
const fadeSource = extract('  function maybeStartAutoCrossfade() {', '  function applyAudioSettings(');
const fadeContext = { repeatMode: 'one' };
vm.runInNewContext(`${fadeSource}; this.maybeStartAutoCrossfade = maybeStartAutoCrossfade;`, fadeContext);
assert.doesNotThrow(() => fadeContext.maybeStartAutoCrossfade(), 'Repeat One exits auto-crossfade logic before looking up the queue');
const repeatOffFadeContext = { repeatMode: 'off' };
vm.runInNewContext(`${fadeSource}; this.maybeStartAutoCrossfade = maybeStartAutoCrossfade;`, repeatOffFadeContext);
assert.doesNotThrow(() => repeatOffFadeContext.maybeStartAutoCrossfade(), 'Repeat Off also skips automatic crossfade so the track can stop at its natural end');
assert.match(app, /nextDeck\.loop = repeatMode === 'one';[\s\S]*?nextDeck\.src = source/);
assert.match(app, /audioDecks\.forEach\(deck => \{ deck\.loop = repeatMode === 'one'; \}\);/);
console.log('PASS: Repeat One, Repeat Off stop-at-end, and crossfade regression checks');
