'use strict';
// Lightweight behavioral smoke test for the renderer's actual keydown handler.
// Uses Node's built-in vm/assert modules; it does not need Electron or third-party packages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = source.indexOf("  // Keyboard shortcuts use physical key codes");
const end = source.indexOf('  // Boot', start);
assert.ok(start >= 0 && end > start, 'keyboard shortcut handler should exist');
const handlerSource = source.slice(start, end);

const calls = { togglePlay: 0, next: 0, previous: 0, shuffle: 0, repeat: 0, muteClick: 0, fullscreenClick: 0, searchFocus: 0, studioToggle: 0, closeModal: 0, closeNowPlaying: 0, renderControls: 0, persist: 0 };
let keydownHandler;
const audio = { currentTime: 10, duration: 100, volume: .5, muted: false };
const decks = [audio, { volume: .5, muted: false }];
const bodyClasses = new Set(['search-open']);
const context = {
  console,
  document: {
    activeElement: { tagName: 'BODY', type: undefined, isContentEditable: false },
    body: { classList: {
      add: c => bodyClasses.add(c),
      remove: c => bodyClasses.delete(c),
      contains: c => bodyClasses.has(c)
    } },
    addEventListener: (name, fn) => { assert.equal(name, 'keydown'); keydownHandler = fn; }
  },
  ui: { audio, search: { focus: () => calls.searchFocus++ } },
  audioDecks: decks,
  previousVolume: .76,
  togglePlay: () => calls.togglePlay++,
  toggleSoundStudio: () => calls.studioToggle++,
  getCurrentTrack: () => ({ id: 'track-1' }),
  clamp: (n, lo, hi) => Math.min(hi, Math.max(lo, n)),
  renderControls: () => calls.renderControls++,
  persistSettings: () => calls.persist++,
  closeModal: () => calls.closeModal++,
  closeNowPlaying: () => calls.closeNowPlaying++,
  selectAdjacent: direction => { if (direction > 0) calls.next++; else calls.previous++; },
  toggleShuffle: () => calls.shuffle++,
  cycleRepeat: () => calls.repeat++,
  $: selector => ({ click: () => {
    if (selector === '#muteBtn') calls.muteClick++;
    if (selector === '#fullscreenBtn') calls.fullscreenClick++;
  } })
};
vm.runInNewContext(handlerSource, context, { filename: 'app.js keyboard handler' });
assert.equal(typeof keydownHandler, 'function', 'keydown callback should be registered');
function key(code, extra = {}) {
  const event = { code, key: code === 'Escape' ? 'Escape' : code, ctrlKey: false, metaKey: false, altKey: false, repeat: false, prevented: false, preventDefault() { this.prevented = true; }, ...extra };
  keydownHandler(event);
  return event;
}

key('Space'); assert.equal(calls.togglePlay, 1, 'Space toggles playback');
key('Space', { repeat: true }); assert.equal(calls.togglePlay, 1, 'holding Space must not toggle repeatedly');
key('ArrowLeft'); assert.equal(audio.currentTime, 5, 'Left seeks backward 5 seconds');
key('ArrowRight'); assert.equal(audio.currentTime, 10, 'Right seeks forward 5 seconds');
audio.currentTime = 2; key('ArrowLeft'); assert.equal(audio.currentTime, 0, 'Left clamps at start');
audio.currentTime = 99; key('ArrowRight'); assert.equal(audio.currentTime, 100, 'Right clamps at duration');
audio.currentTime = 10;
key('ArrowUp'); assert.equal(audio.volume, .55, 'Up increases volume by 5%'); assert.equal(context.previousVolume, .55, 'volume hotkey updates remembered unmute volume');
key('ArrowDown'); assert.equal(audio.volume, .5, 'Down decreases volume by 5%');
audio.muted = true; audio.volume = .5; key('ArrowUp'); assert.equal(audio.volume, .55, 'volume keys restore from remembered level while muted'); assert.equal(audio.muted, false, 'changing volume unmutes playback');
assert.ok(decks.every(d => d.volume === .55 && d.muted === false), 'volume hotkey updates all decks');
key('KeyM'); assert.equal(calls.muteClick, 1, 'M clicks mute control');
key('KeyN'); assert.equal(calls.next, 1, 'N advances track');
key('KeyN', { repeat: true }); assert.equal(calls.next, 1, 'holding N must not skip repeatedly');
key('KeyP'); assert.equal(calls.previous, 1, 'P selects previous track');
key('KeyS'); assert.equal(calls.shuffle, 1, 'S toggles shuffle');
key('KeyR'); assert.equal(calls.repeat, 1, 'R cycles repeat mode');
key('KeyF'); assert.equal(calls.fullscreenClick, 1, 'F clicks fullscreen control');
key('F11'); assert.equal(calls.fullscreenClick, 2, 'F11 toggles fullscreen control');
context.document.activeElement = { tagName: 'INPUT', type: 'search', isContentEditable: false };
key('KeyS'); assert.equal(calls.shuffle, 1, 'letter shortcuts do not intercept search typing');
key('F11'); assert.equal(calls.fullscreenClick, 3, 'F11 works while search input is focused');
key('KeyK', { ctrlKey: true }); assert.equal(calls.searchFocus, 1, 'Ctrl+K focuses search even from an input');
key('KeyE', { ctrlKey: true, shiftKey: true }); assert.equal(calls.studioToggle, 1, 'Ctrl+Shift+E toggles Sound Studio even while an input is focused');
key('KeyE', { ctrlKey: true, shiftKey: true, repeat: true }); assert.equal(calls.studioToggle, 1, 'holding Ctrl+Shift+E must not toggle repeatedly');
key('KeyE', { metaKey: true, shiftKey: true }); assert.equal(calls.studioToggle, 2, 'Cmd+Shift+E toggles Sound Studio on macOS');
key('KeyE', { ctrlKey: true, shiftKey: true, altKey: true }); assert.equal(calls.studioToggle, 2, 'Alt-modified combination does not trigger Sound Studio');
context.document.activeElement = { tagName: 'BODY', type: undefined, isContentEditable: false };
key('Escape'); assert.equal(calls.closeModal, 1, 'Escape closes modal'); assert.equal(calls.closeNowPlaying, 1, 'Escape closes Now Playing'); assert.equal(bodyClasses.has('search-open'), false, 'Escape closes search mode');
context.document.activeElement = { tagName: 'INPUT', type: 'range', id: 'volumeBar', isContentEditable: false };
audio.currentTime = 20; key('ArrowLeft'); assert.equal(audio.currentTime, 20, 'Left preserves native volume slider behavior when focused');

console.log('PASS: keyboard shortcut behavior assertions including Sound Studio toggle');
