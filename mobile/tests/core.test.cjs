'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getExtension,
  isSupportedAudio,
  parseTrackName,
  formatTime,
  sortTracks,
  sortMostPlayed,
  formatDateTime,
  normalizeFileTimestamp,
  parseId3v2Tag,
  isValidHexColor,
  createId
} = require('../src/core');

test('accepts common Android audio extensions case-insensitively', () => {
  for (const file of ['song.mp3', 'song.M4A', 'song.aac', 'song.wav', 'song.flac', 'song.ogg', 'song.oga', 'song.opus']) {
    assert.equal(isSupportedAudio(file), true, `${file} should be accepted`);
  }
  assert.equal(isSupportedAudio('cover.jpg'), false);
  assert.equal(isSupportedAudio('archive.zip'), false);
  assert.equal(isSupportedAudio('track'), false);
});

test('extracts an extension safely', () => {
  assert.equal(getExtension('  Artist - Song.MP3  '), 'mp3');
  assert.equal(getExtension('song'), '');
  assert.equal(getExtension('song.'), '');
});

test('parses the Desktop-style Artist - Title filename convention', () => {
  assert.deepEqual(parseTrackName('Queen - Bohemian Rhapsody.mp3'), {
    artist: 'Queen',
    title: 'Bohemian Rhapsody'
  });
  assert.deepEqual(parseTrackName('Artist - Part One - Part Two.flac'), {
    artist: 'Artist',
    title: 'Part One - Part Two'
  });
});

test('keeps filenames without artist metadata intact', () => {
  assert.deepEqual(parseTrackName('Night Drive.m4a'), {
    artist: '',
    title: 'Night Drive'
  });
  assert.deepEqual(parseTrackName(''), {
    artist: '',
    title: 'Untitled track'
  });
});

test('formats elapsed time safely', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(83), '1:23');
  assert.equal(formatTime(3600), '60:00');
  assert.equal(formatTime(-5), '0:00');
  assert.equal(formatTime(Number.NaN), '0:00');
});

test('creates distinct non-empty local identifiers', () => {
  assert.equal(createId(1000, 0.5), 'rs-i');
  assert.notEqual(createId(1000, 0.1), createId(1000, 0.2));
});


test('sorts recently added tracks newest-first and puts undated tracks last', () => {
  const tracks = [
    { id: 'old', title: 'Old', addedAt: 100 },
    { id: 'new', title: 'New', addedAt: 300 },
    { id: 'unknown', title: 'Unknown' },
  ];
  assert.deepEqual(sortTracks(tracks, 'recent').map(track => track.id), ['new', 'old', 'unknown']);
});

test('sorts titles and artists naturally without mutating the original list', () => {
  const tracks = [
    { id: '10', title: 'Track 10', artist: 'Artist 10' },
    { id: '2', title: 'Track 2', artist: 'Artist 2' },
    { id: '1', title: 'Track 1', artist: 'Artist 1' },
  ];
  assert.deepEqual(sortTracks(tracks, 'title').map(track => track.id), ['1', '2', '10']);
  assert.deepEqual(sortTracks(tracks, 'artist').map(track => track.id), ['1', '2', '10']);
  assert.deepEqual(tracks.map(track => track.id), ['10', '2', '1']);
});


test('most played sorting prioritizes play count then latest play', () => {
  const tracks = [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }, { id: 'c', title: 'Gamma' }];
  const stats = { a: { count: 3, lastPlayedAt: 100 }, b: { count: 8, lastPlayedAt: 80 }, c: { count: 8, lastPlayedAt: 120 } };
  assert.deepEqual(sortMostPlayed(tracks, stats).map(item => item.id), ['c', 'b', 'a']);
});

test('date-time formatting handles valid and invalid source timestamps', () => {
  assert.notEqual(formatDateTime(Date.UTC(2026, 0, 2, 3, 4), 'en'), '—');
  assert.equal(formatDateTime(0, 'ru'), '—');
  assert.equal(formatDateTime('bad', 'ru'), '—');
});

test('validates six-digit HEX colors', () => {
  assert.equal(isValidHexColor('#F12743'), true);
  assert.equal(isValidHexColor('#aabbcc'), true);
  assert.equal(isValidHexColor('F12743'), false);
  assert.equal(isValidHexColor('#FFF'), false);
  assert.equal(isValidHexColor('#GGGGGG'), false);
});


test('normalizes source file timestamps expressed in seconds or milliseconds', () => {
  assert.equal(normalizeFileTimestamp(1760000000), 1760000000000);
  assert.equal(normalizeFileTimestamp(1760000000123), 1760000000123);
  assert.equal(normalizeFileTimestamp(0), null);
  assert.equal(normalizeFileTimestamp('invalid'), null);
});

test('reads ID3v2.3 title, artist, album and embedded APIC artwork', () => {
  const frame = (id, payload) => {
    const size = payload.length;
    return [
      ...Buffer.from(id, 'ascii'),
      (size >>> 24) & 0xff, (size >>> 16) & 0xff, (size >>> 8) & 0xff, size & 0xff,
      0, 0,
      ...payload,
    ];
  };
  const textFrame = (id, value) => frame(id, [0, ...Buffer.from(value, 'latin1')]);
  const imageBytes = [0xff, 0xd8, 0xff, ...Array.from({ length: 96 }, (_, i) => i & 0xff)];
  const apic = frame('APIC', [0, ...Buffer.from('image/jpeg', 'ascii'), 0, 3, 0, ...imageBytes]);
  const frames = [
    ...textFrame('TIT2', 'Night Drive'),
    ...textFrame('TPE1', 'Fox Artist'),
    ...textFrame('TALB', 'Midnight Album'),
    ...apic,
  ];
  const tagSize = frames.length;
  const syncSafe = [
    (tagSize >> 21) & 0x7f,
    (tagSize >> 14) & 0x7f,
    (tagSize >> 7) & 0x7f,
    tagSize & 0x7f,
  ];
  const tag = new Uint8Array([...Buffer.from('ID3', 'ascii'), 3, 0, 0, ...syncSafe, ...frames]);
  const result = parseId3v2Tag(tag);
  assert.equal(result.title, 'Night Drive');
  assert.equal(result.artist, 'Fox Artist');
  assert.equal(result.album, 'Midnight Album');
  assert.equal(result.picture.mimeType, 'image/jpeg');
  assert.deepEqual(Array.from(result.picture.data.slice(0, 3)), [0xff, 0xd8, 0xff]);
});

test('returns empty metadata for files without an ID3 header', () => {
  assert.deepEqual(parseId3v2Tag(new Uint8Array([1, 2, 3, 4])), {
    title: '', artist: '', album: '', picture: null,
  });
});


test('reads ID3v2.2 title and artist frames', () => {
  const frame = (id, payload) => [
    ...Buffer.from(id, 'ascii'),
    (payload.length >>> 16) & 0xff, (payload.length >>> 8) & 0xff, payload.length & 0xff,
    ...payload,
  ];
  const title = frame('TT2', [0, ...Buffer.from('Old song', 'latin1')]);
  const artist = frame('TP1', [0, ...Buffer.from('Old artist', 'latin1')]);
  const frames = [...title, ...artist];
  const size = frames.length;
  const syncSafe = [(size >> 21) & 0x7f, (size >> 14) & 0x7f, (size >> 7) & 0x7f, size & 0x7f];
  const tag = new Uint8Array([...Buffer.from('ID3', 'ascii'), 2, 0, 0, ...syncSafe, ...frames]);
  const result = parseId3v2Tag(tag);
  assert.equal(result.title, 'Old song');
  assert.equal(result.artist, 'Old artist');
});
