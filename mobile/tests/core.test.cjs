'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getExtension,
  isSupportedAudio,
  parseTrackName,
  formatTime,
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
