"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const online = fs.readFileSync(path.join(root, "online.js"), "utf8");
const css = fs.readFileSync(path.join(root, "online.css"), "utf8");

test("the original bottom Play button toggles an active internet stream", () => {
  assert.match(app, /function togglePlay\(\)\s*\{\s*\/\/ The shared bottom Play button controls the active internet stream first\.\s*if \(typeof window !== 'undefined' && window\.foxOnline\?\.isActive\?\.\(\)\) \{ window\.foxOnline\.toggleStream\(\); return; \}/);
});

test("previous and next controls navigate radio stations or online tracks", () => {
  assert.match(app, /function selectAdjacent\(direction\)\s*\{\s*if \(typeof window !== 'undefined' && window\.foxOnline\?\.isActive\?\.\(\)\) \{ window\.foxOnline\.playAdjacentStream\(direction\); return; \}/);
  assert.match(online, /function playAdjacentStream\(direction\)/);
  assert.match(online, /if \(currentStream\.type === 'radio'\) void playStation\(items\[index\]\);/);
  assert.match(online, /else void playOnlineTrack\(items\[index\]\);/);
});

test("the shared bottom volume and mute controls change internet audio", () => {
  assert.match(app, /if \(typeof window !== 'undefined' && window\.foxOnline\?\.isActive\?\.\(\)\) \{ window\.foxOnline\.setStreamVolume\(value\); return; \}/);
  assert.match(app, /if \(typeof window !== 'undefined' && window\.foxOnline\?\.isActive\?\.\(\)\) \{ window\.foxOnline\.toggleStreamMute\(\); return; \}/);
});

test("the current track favorite button becomes an internet Stop control", () => {
  assert.match(app, /if \(typeof window !== 'undefined' && window\.foxOnline\?\.isActive\?\.\(\)\) \{ window\.foxOnline\.stopStream\(\); return; \}/);
  assert.match(online, /stopButton\.innerHTML = icon\('stop'\)/);
});

test("internet player metadata is rendered into the original bottom player", () => {
  assert.match(online, /function renderBottomPlayer\(\)/);
  assert.match(online, /\$\('#nowTitle'\)/);
  assert.match(online, /\$\('#nowArtist'\)/);
  assert.match(online, /\$\('#nowCover'\)/);
  assert.match(app, /if \(typeof window !== 'undefined' && window\.foxOnline\?\.renderBottomPlayer\?\.\(\)\) return;/);
});

test("the fullscreen Now Playing overlay also shows internet stream metadata", () => {
  assert.match(app, /function updateNowPlayingOverlay\(\) \{\s*if \(typeof window !== 'undefined' && window\.foxOnline\?\.renderBottomPlayer\?\.\(\)\) return;/);
});

test("the duplicate top mini-player is hidden while preserving the bottom player", () => {
  assert.match(online, /if \(bar\) bar\.hidden = true;/);
  assert.match(css, /\.internet-player \{ display: none !important; \}/);
  assert.match(css, /body\.internet-stream-active \.player-bar \.progress-row \{ display: none !important; \}/);
});
