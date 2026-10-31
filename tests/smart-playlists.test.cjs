'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.doesNotThrow(() => new Function(app), 'app.js must remain valid JavaScript');

const helperStart = app.indexOf('  function sourceFileTimestamp(');
const helperEnd = app.indexOf('  function getSmartPlaylistTracks(', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'smart playlist helper block must exist');

const helperSource = app.slice(helperStart, helperEnd);
const sandbox = {};
vm.runInNewContext(
  helperSource + `
    this.api = {
      sourceFileTimestamp,
      trackSourceTimestamp,
      hasQualifiedListen,
      accumulateListenSeconds,
      sortSmartPlaylistTracks
    };
  `,
  sandbox
);
const api = sandbox.api;

assert.equal(
  api.sourceFileTimestamp({ lastModified: 777, createdAt: 888 }, null, 123),
  777,
  'source file modification time must take precedence over import time'
);
assert.equal(
  api.sourceFileTimestamp({}, { lastModified: 999 }, 123),
  999,
  'browser File.lastModified must be used when importing via drag and drop'
);
assert.equal(
  api.sourceFileTimestamp({}, null, 123),
  123,
  'fallback timestamp must be used only when source metadata is unavailable'
);
assert.equal(
  api.trackSourceTimestamp({ sourceDateAt: 500, addedAt: 900 }),
  500,
  'Recently Added must use the source file date'
);
assert.equal(
  api.trackSourceTimestamp({ addedAt: 900 }),
  900,
  'legacy tracks without source metadata must use their original library date'
);

const played = [
  { id: 'old-high', playCount: 8, lastPlayedAt: 400, sourceDateAt: 100 },
  { id: 'tie-newer-listen', playCount: 8, lastPlayedAt: 800, sourceDateAt: 200 },
  { id: 'low', playCount: 2, lastPlayedAt: 300, sourceDateAt: 900 },
  { id: 'never', playCount: 0, lastPlayedAt: 0, sourceDateAt: 1000 }
];
assert.deepEqual(
  Array.from(api.sortSmartPlaylistTracks(played, 'smart-most-played'), item => item.id),
  ['tie-newer-listen', 'old-high', 'low'],
  'Most Played must rank meaningful plays by count, then latest listen, and hide zero-play tracks'
);

const recent = [
  { id: 'imported-today-old-file', addedAt: 9000, sourceDateAt: 1000 },
  { id: 'older-import-new-file', addedAt: 2000, sourceDateAt: 8000 },
  { id: 'legacy', addedAt: 5000 }
];
assert.deepEqual(
  Array.from(api.sortSmartPlaylistTracks(recent, 'smart-recent'), item => item.id),
  ['older-import-new-file', 'legacy', 'imported-today-old-file'],
  'Recently Added must sort by original source-file date, with a legacy fallback'
);
assert.deepEqual(
  recent.map(item => item.id),
  ['imported-today-old-file', 'older-import-new-file', 'legacy'],
  'Sorting must not mutate the source library'
);

assert.equal(api.hasQualifiedListen(29, 120), false, 'a 2-minute track needs 30 seconds');
assert.equal(api.hasQualifiedListen(30, 120), true, '30 seconds qualifies for a long track');
assert.equal(api.hasQualifiedListen(9, 20), false, 'a 20-second track needs half its duration');
assert.equal(api.hasQualifiedListen(10, 20), true, 'half of a short track qualifies');
assert.equal(api.hasQualifiedListen(3, 4), true, 'very short tracks use a 3-second minimum');

const session = { listenedSeconds: 0, lastTime: 0 };
for (let t = 1; t <= 5; t++) api.accumulateListenSeconds(session, t, true);
assert.equal(session.listenedSeconds, 5, 'continuous listening time must accumulate');
api.accumulateListenSeconds(session, 45, true);
assert.equal(session.listenedSeconds, 5, 'large position jumps/seeks must not count as listening');
api.accumulateListenSeconds(session, 46, true);
assert.equal(session.listenedSeconds, 6, 'listening resumes after a seek without counting skipped time');

assert.ok(app.includes('const sourceDateAt = sourceFileTimestamp(record, null'), 'folder rescan must read source file metadata');
assert.ok(app.includes('track.sourceDateAt = sourceDateAt;'), 'folder rescan must persist the refreshed source date');
assert.ok(app.includes('sourceDateAt: sourceFileTimestamp(record, file'), 'file imports must store source date');
assert.ok(app.includes('sourceDateAt: Number.isFinite(track.sourceDateAt)'), 'source date must persist in IndexedDB');
assert.ok(app.includes('sourceDateAt: Number.isFinite(track.sourceDateAt) ? track.sourceDateAt : null'), 'source date must be included in backups');
assert.ok(app.includes('sourceDateAt = Math.max('), 'source date must be restored from backups');
assert.ok(app.includes('maybeCountQualifiedListen(activeTrack)'), 'active playback must update the qualified listen counter');
assert.ok(app.includes('track.lastPlayedAt = Date.now();'), 'last played timestamp must be updated after a qualified listen');
const recordStart = app.indexOf('  function recordPlayedTrack(track) {');
const recordEnd = app.indexOf('\n  }', recordStart) + 4;
assert.ok(recordStart >= 0 && recordEnd > recordStart, 'recordPlayedTrack must exist');
assert.ok(!app.slice(recordStart, recordEnd).includes('track.lastPlayedAt ='), 'skipped or very short plays must not count as a meaningful last listen');
assert.ok(app.includes('function hasQualifiedListen('), 'qualified listening threshold must be explicit');
assert.ok(app.includes("smartRecentlyAddedSubtitle: '50 последних файлов"), 'Russian source-date description must be present');
assert.ok(app.includes("smartRecentlyAddedSubtitle: 'The 50 newest source files"), 'English source-date description must be present');
assert.ok(app.includes("smartRecentlyAddedSubtitle: 'Die 50 neuesten Quelldateien"), 'German source-date description must be present');

assert.ok(css.includes('.now-playing-close::before'), 'Now Playing close glyph must use a centered pseudo-element');
assert.ok(css.includes('.settings-close::before'), 'settings close glyph must use a centered pseudo-element');
assert.ok(css.includes('.studio-close::before'), 'sound studio close glyph must use a centered pseudo-element');
assert.ok(css.includes('.queue-clear-btn::before'), 'queue close glyph must use a centered pseudo-element');
assert.ok(css.includes('#clearFolderSourceBtn::before'), 'source-pill close glyph must use a centered pseudo-element');
assert.ok(html.includes('translate(20 121)'), 'left spider must hang lower from the web');
assert.ok(html.includes('M0 -112V-12'), 'left spider thread must be longer');
assert.ok(html.includes('translate(1177 138)'), 'right spider must hang lower from the web');
assert.ok(html.includes('M0 -129V-14'), 'right spider thread must be longer');

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.ok(packageJson.scripts?.test?.includes('test:smart-playlists'), 'smart playlist test must be part of npm test');

console.log('PASS: source-file dates, recently added ordering, qualified Most Played counts, backup persistence, close-button centering and longer Halloween spider threads');