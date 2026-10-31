const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const appPath = path.join(__dirname, '..', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');
function extract(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `could locate ${startMarker}`);
  return source.slice(start, end);
}
const tracks = ['a','b','c','d'].map(id => ({ id }));
const byId = new Map(tracks.map(t => [t.id,t]));
const baseContext = {
  Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
  shuffleEnabled: true,
  shuffleOrderIds: [],
  currentTrackId: 'b',
  repeatMode: 'off',
  getPlaybackQueue: () => tracks.slice(),
  getTrack: id => byId.get(id) || null,
};
const shuffleSource = extract('  function shuffleArray(items) {', '  function recordPlayedTrack(track) {');
vm.runInNewContext(`${shuffleSource}; this.shuffleArray = shuffleArray; this.resetShuffleOrder = resetShuffleOrder; this.getPlaybackOrder = getPlaybackOrder;`, baseContext);
const order = baseContext.resetShuffleOrder('b').map(t => t.id);
assert.equal(order[0], 'b', 'turning shuffle on keeps current song as the current position');
assert.equal(new Set(order).size, 4, 'shuffle order contains each track once');
assert.deepEqual([...order].sort(), ['a','b','c','d'], 'shuffle order contains the full queue');
assert.deepEqual(baseContext.getPlaybackOrder().map(t => t.id), order, 'the shuffled order remains stable across reads');

const navigationSource = extract('  function selectAdjacent(direction) {', '  function cycleRepeat() {');
const navCalls = [];
const navCtx = {
  getPlaybackOrder: () => order.map(id => byId.get(id)),
  currentTrackId: 'b',
  ui: { audio: { currentTime: 20, paused: false } },
  playTrack: id => navCalls.push(id),
  togglePlay: () => navCalls.push('toggle'),
  toast: () => {},
};
vm.runInNewContext(`${navigationSource}; this.selectAdjacent = selectAdjacent;`, navCtx);
navCtx.selectAdjacent(1);
assert.equal(navCalls[0], order[1], 'Next follows the next item in the shuffled order');
navCalls.length = 0;
navCtx.selectAdjacent(-1);
assert.equal(navCalls[0], order[order.indexOf('b') - 1] || order[order.length - 1], 'Previous follows the shuffled order backward and wraps at the start');

const endSource = extract('  function handleTrackEnded() {', '  // Bind both audio decks.');
function makeEndContext(mode) {
  const calls = { played: 0, selected: 0, paused: 0, synced: 0 };
  const deck1 = { currentTime: 99, pause() { calls.paused++; }, play() { calls.played++; return Promise.resolve(); } };
  const deck2 = { pause() { calls.paused++; } };
  const ctx = { repeatMode: mode, crossfadeGeneration: 0, ui: { audio: deck1 }, audioDecks: [deck1,deck2],
    selectAdjacent: () => calls.selected++, syncPlaybackUI: () => calls.synced++, updateAudioEngineStatus: () => {}, updateMediaSession: () => {}, updateNowPlayingOverlay: () => {}, calls };
  vm.runInNewContext(`${endSource}; this.handleTrackEnded = handleTrackEnded;`, ctx);
  return ctx;
}
const off = makeEndContext('off'); off.handleTrackEnded();
assert.equal(off.calls.selected, 0, 'Repeat Off does not auto-advance at natural end');
assert.equal(off.calls.paused, 2, 'Repeat Off stops both decks');
assert.equal(off.ui.audio.currentTime, 0, 'Repeat Off resets current time after stopping');
assert.equal(off.calls.synced, 1, 'Repeat Off refreshes playback UI');
const all = makeEndContext('all'); all.handleTrackEnded();
assert.equal(all.calls.selected, 1, 'Repeat Playlist advances to the next track');
const one = makeEndContext('one'); one.handleTrackEnded();
assert.equal(one.calls.played, 1, 'Repeat One restarts the current track');
assert.equal(one.calls.selected, 0, 'Repeat One does not advance the queue');

assert.match(source, /if \(repeatMode !== 'all' \|\| autoCrossfadeRunning/,
  'automatic crossfade only runs when Repeat Playlist is enabled');
console.log('PASS: shuffle order, previous/next traversal, and Repeat Off stop-at-end tests');
