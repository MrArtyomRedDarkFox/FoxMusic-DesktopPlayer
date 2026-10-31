'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const app = fs.readFileSync(
  path.join(__dirname, '..', 'app.js'),
  'utf8'
);

const declarationMatch = /^[ \t]*function validateLibraryBackup\(backup\) \{/m.exec(app);
const restoreStart = app.indexOf('async function restoreLibraryBackup()');

assert.ok(
  declarationMatch && restoreStart > declarationMatch.index,
  'validateLibraryBackup must be defined before restoreLibraryBackup'
);

const implementation = app.slice(declarationMatch.index, restoreStart).trim();
const context = {};

vm.runInNewContext(
  `${implementation}\nthis.validateLibraryBackup = validateLibraryBackup;`,
  context
);

const validate = context.validateLibraryBackup;

function validBackup() {
  return {
    format: 'foxsmusic-backup',
    schemaVersion: 1,
    createdAt: '2026-10-30T12:00:00.000Z',
    source: 'FoxsMusic Desktop',
    settings: {
      language: 'ru',
      effectsEnabled: true,
      playbackQueueIds: ['track-1']
    },
    playlists: [
      { id: 'playlist-1', name: 'Dark Fox', createdAt: 1760000000000 }
    ],
    tracks: [
      {
        id: 'track-1',
        title: 'Example track',
        artist: 'Example artist',
        album: 'Example album',
        genre: 'Electronic',
        year: '2026',
        fileName: 'example.mp3',
        addedAt: 1760000000000,
        duration: 215.5,
        favorite: true,
        playlists: ['playlist-1'],
        audioPath: 'C:\\Music\\example.mp3',
        sourceUnavailable: false,
        hasEmbeddedAudio: false,
        coverBase64: null
      }
    ]
  };
}

function expectInvalid(value, message) {
  const result = validate(value);
  assert.equal(result.valid, false, message || 'backup should be rejected');
  assert.equal(typeof result.message, 'string');
  assert.ok(result.message.length > 0);
}

function expectValid(value, message) {
  const result = validate(value);
  assert.equal(result.valid, true, message || result.message);
  assert.equal(result.message, '');
}

// 1. The exact shape produced by exportLibraryBackup() must be accepted.
expectValid(validBackup(), 'a normal FoxsMusic v1 export must be accepted');

// 2. Optional legacy fields remain optional because restore generates missing IDs.
{
  const backup = validBackup();
  delete backup.createdAt;
  delete backup.source;
  delete backup.settings;
  delete backup.playlists[0].id;
  delete backup.tracks[0].id;
  delete backup.tracks[0].addedAt;
  delete backup.tracks[0].duration;
  expectValid(backup, 'optional legacy fields must remain compatible');
}

// 3. Top-level shape and version checks.
expectInvalid(null, 'null backup must be rejected');
expectInvalid([], 'array backup must be rejected');
expectInvalid({ ...validBackup(), format: 'other-format' }, 'unknown format must be rejected');
expectInvalid({ ...validBackup(), schemaVersion: 2 }, 'unknown schema version must be rejected');

{
  const backup = validBackup();
  delete backup.tracks;
  expectInvalid(backup, 'missing tracks must be rejected');
}
{
  const backup = validBackup();
  delete backup.playlists;
  expectInvalid(backup, 'missing playlists must be rejected');
}
expectInvalid(
  { ...validBackup(), settings: [] },
  'array settings must be rejected'
);
expectInvalid(
  { ...validBackup(), createdAt: 'not-a-date' },
  'invalid backup timestamp must be rejected'
);

// 4. Collection limits prevent silently truncated or excessive restores.
{
  const backup = validBackup();
  backup.tracks = new Array(10001).fill({ title: 'Track' });
  expectInvalid(backup, 'more than 10000 tracks must be rejected');
}
{
  const backup = validBackup();
  backup.playlists = new Array(1001).fill({ name: 'Playlist' });
  expectInvalid(backup, 'more than 1000 playlists must be rejected');
}

// 5. Playlist validation, including IDs that would otherwise collide in restore.
{
  const backup = validBackup();
  backup.playlists[0] = null;
  expectInvalid(backup, 'null playlist must be rejected');
}
{
  const backup = validBackup();
  backup.playlists[0].name = '  ';
  expectInvalid(backup, 'empty playlist name must be rejected');
}
{
  const backup = validBackup();
  backup.playlists.push({ id: 'playlist-1', name: 'Duplicate ID' });
  expectInvalid(backup, 'duplicate playlist IDs must be rejected');
}
{
  const backup = validBackup();
  backup.playlists[0].id = 123;
  expectInvalid(backup, 'non-string playlist IDs must be rejected');
}
{
  const backup = validBackup();
  backup.playlists[0].createdAt = -1;
  expectInvalid(backup, 'negative playlist timestamps must be rejected');
}

// 6. Track validation.
{
  const backup = validBackup();
  backup.tracks[0] = null;
  expectInvalid(backup, 'null track must be rejected');
}
{
  const backup = validBackup();
  backup.tracks[0].title = '';
  expectInvalid(backup, 'empty track title must be rejected');
}
{
  const backup = validBackup();
  backup.tracks.push({ ...backup.tracks[0] });
  expectInvalid(backup, 'duplicate track IDs must be rejected');
}
{
  const backup = validBackup();
  backup.tracks[0].artist = 42;
  expectInvalid(backup, 'non-string metadata must be rejected');
}
{
  const backup = validBackup();
  backup.tracks[0].audioPath = {};
  expectInvalid(backup, 'non-string audio paths must be rejected');
}
{
  const backup = validBackup();
  backup.tracks[0].duration = Infinity;
  expectInvalid(backup, 'non-finite duration must be rejected');
}
{
  const backup = validBackup();
  backup.tracks[0].addedAt = -1;
  expectInvalid(backup, 'negative addedAt must be rejected');
}
{
  const backup = validBackup();
  backup.tracks[0].favorite = 'yes';
  expectInvalid(backup, 'non-boolean favorite must be rejected');
}
{
  const backup = validBackup();
  backup.tracks[0].playlists = ['playlist-1', 7];
  expectInvalid(backup, 'invalid playlist references must be rejected');
}

// 7. The restore path must call validation before displaying its confirmation modal.
{
  const restoreBody = app.slice(restoreStart);
  const validationCall = restoreBody.indexOf('const validation = validateLibraryBackup(backup);');
  const confirmation = restoreBody.indexOf('openModal(');
  assert.ok(
    validationCall >= 0 && confirmation > validationCall,
    'restore must validate the parsed backup before showing the confirmation modal'
  );
}

console.log('PASS: FoxsMusic backup validation tests');
