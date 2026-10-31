'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
assert.doesNotThrow(() => new Function(app), 'app.js must remain valid JavaScript');

const start = app.indexOf('  function trackSourceTimestamp(');
const end = app.indexOf('  function hasQualifiedListen(', start);
assert.ok(start >= 0 && end > start, 'timestamp helper block must exist');

const context = { currentLocale: 'ru' };
vm.runInNewContext(app.slice(start, end) + `
  this.api = { trackSourceTimestamp, formatTrackTimestamp, formatTrackTimestampLong };
`, context);

assert.equal(context.api.trackSourceTimestamp({ addedAt: 1700000000000, sourceDateAt: 1690000000000 }), 1690000000000,
  'source file timestamp remains distinct from the import timestamp');
assert.equal(context.api.trackSourceTimestamp({ addedAt: 1700000000000 }), 1700000000000,
  'legacy tracks fall back to the library added timestamp');

const stamp = Date.UTC(2026, 9, 31, 14, 25);
const formatted = context.api.formatTrackTimestamp(stamp, 'ru');
assert.match(formatted, /31/);
assert.match(formatted, /10/);
assert.match(formatted, /2026/);
assert.match(formatted, /14:25/);
assert.match(context.api.formatTrackTimestamp(stamp, 'en'), /10\/31\/2026/);
assert.match(context.api.formatTrackTimestamp(stamp, 'de'), /31\.10\.2026/);
assert.equal(context.api.formatTrackTimestamp(0, 'ru'), '—');
assert.equal(context.api.formatTrackTimestampLong(0, 'ru'), '');

for (const key of ['dateAdded', 'sourceFileDate']) {
  assert.ok(app.includes(`${key}:`), `translation key ${key} must exist`);
}
assert.ok(app.includes('row-added-date'), 'rendered track rows must show the timestamp');
assert.ok(app.includes('row-added-kind'), 'rendered rows must distinguish import time from original-file time');
assert.ok(app.includes('const addedAtLabel = `${tr(\'dateAdded\')}: ${formatTrackTimestamp(track.addedAt)}`;'),
  'Recently Added must also show when the track was imported into FoxsMusic');

console.log('PASS: per-track added date/time formatting, locale output, source-file date distinction and legacy fallback');
