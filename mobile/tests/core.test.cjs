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
