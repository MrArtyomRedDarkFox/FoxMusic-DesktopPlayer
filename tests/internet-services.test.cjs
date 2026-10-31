'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  cleanSearchTerm,
  safeHttpUrl,
  buildRadioSearchUrl,
  normalizeRadioStation,
  buildJamendoSearchUrl,
  normalizeJamendoTrack
} = require('../internet-services.cjs');

test('search terms are trimmed, bounded and stripped of control characters', () => {
  assert.equal(cleanSearchTerm('  jazz\nrock  '), 'jazzrock');
  assert.equal(cleanSearchTerm('x'.repeat(200)).length, 120);
  assert.equal(cleanSearchTerm(null), '');
});

test('only credential-free HTTP(S) URLs are accepted', () => {
  assert.equal(safeHttpUrl('https://radio.example/stream'), 'https://radio.example/stream');
  assert.equal(safeHttpUrl('http://user:pass@example.com/stream'), null);
  assert.equal(safeHttpUrl('javascript:alert(1)'), null);
  assert.equal(safeHttpUrl('file:///etc/passwd'), null);
  assert.equal(safeHttpUrl('not a url'), null);
});

test('Radio Browser URL is constrained to the public station search endpoint', () => {
  const url = new URL(buildRadioSearchUrl('  jazz  '));
  assert.equal(url.origin, 'https://de1.api.radio-browser.info');
  assert.equal(url.pathname, '/json/stations/search');
  assert.equal(url.searchParams.get('name'), 'jazz');
  const tagUrl = new URL(buildRadioSearchUrl('ambient', 'tag'));
  assert.equal(tagUrl.searchParams.get('tag'), 'ambient');
  assert.equal(url.searchParams.get('hidebroken'), 'true');
  assert.equal(url.searchParams.get('limit'), '50');
});

test('Radio Browser station records are normalized and unsafe stream URLs are rejected', () => {
  const item = normalizeRadioStation({
    stationuuid: '12345678-1234-1234-1234-123456789abc',
    name: '  Example FM  ',
    url_resolved: 'https://stream.example/radio.mp3',
    homepage: 'https://example.org',
    favicon: 'https://example.org/icon.png',
    country: 'Germany', language: 'German', tags: 'rock,pop,live', codec: 'mp3', bitrate: '192'
  });
  assert.equal(item.name, 'Example FM');
  assert.equal(item.streamUrl, 'https://stream.example/radio.mp3');
  assert.deepEqual(item.tags, ['rock', 'pop', 'live']);
  assert.equal(item.bitrate, 192);
  assert.equal(normalizeRadioStation({ stationuuid: 'bad', name: 'Bad', url: 'javascript:alert(1)' }), null);
});

test('Jamendo search requires a valid application Client ID', () => {
  assert.throws(() => buildJamendoSearchUrl('', 'ambient'), /Client ID/);
  assert.throws(() => buildJamendoSearchUrl('not valid!', 'ambient'), /Client ID/);
  const url = new URL(buildJamendoSearchUrl('abc123XYZ', 'ambient'));
  assert.equal(url.origin, 'https://api.jamendo.com');
  assert.equal(url.pathname, '/v3.0/tracks/');
  assert.equal(url.searchParams.get('client_id'), 'abc123XYZ');
  assert.equal(url.searchParams.get('namesearch'), 'ambient');
  assert.equal(url.searchParams.get('audioformat'), 'mp32');
  assert.equal(url.searchParams.get('include'), 'licenses');
  const artistUrl = new URL(buildJamendoSearchUrl('abc123XYZ', 'Example Artist', 'artist'));
  assert.equal(artistUrl.searchParams.get('artist_name'), 'Example Artist');
  assert.equal(artistUrl.searchParams.has('namesearch'), false);
});

test('Jamendo records keep track and license links only when URLs are safe', () => {
  const track = normalizeJamendoTrack({
    id: 42, name: 'Night Drive', artist_name: 'Example Artist', album_name: 'After Dark',
    duration: '215', audio: 'https://cdn.example/audio.mp3', image: 'https://cdn.example/cover.jpg',
    license_ccurl: 'https://creativecommons.org/licenses/by/4.0/', shareurl: 'https://www.jamendo.com/track/42'
  });
  assert.equal(track.id, '42');
  assert.equal(track.title, 'Night Drive');
  assert.equal(track.duration, 215);
  assert.equal(track.audioUrl, 'https://cdn.example/audio.mp3');
  assert.equal(track.licenseUrl, 'https://creativecommons.org/licenses/by/4.0/');
  assert.equal(normalizeJamendoTrack({ id: 1, name: 'Unsafe', audio: 'file:///tmp/song.mp3' }), null);
});
