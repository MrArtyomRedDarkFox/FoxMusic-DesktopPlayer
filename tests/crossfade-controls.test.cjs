"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

test("crossfade uses native range input with the existing settings handler", () => {
  assert.match(html, /<input type="range" id="crossfadeSlider" min="0" max="8" step="1" value="3"/);
  assert.match(app, /\$\('#crossfadeSlider'\)\.addEventListener\('input',\s*event\s*=>\s*\{[^}]*audioSettings\.crossfadeSeconds/s);
});

test("crossfade is excluded from the generic EQ handler so its value is not reset", () => {
  assert.match(app, /if \(input\.id === 'crossfadeSlider'\) return;/);
  assert.match(app, /\$\('#crossfadeSlider'\)\.addEventListener\('input'/);
});

test("crossfade does not install competing document-level pointer handlers", () => {
  assert.doesNotMatch(app, /FOXSMUSIC-CROSSFADE-145/);
  assert.doesNotMatch(app, /document\.addEventListener\('pointermove'/);
  assert.doesNotMatch(app, /slider\.addEventListener\('pointerdown'/);
});

test("crossfade inherits the same compact styling as the other studio range controls", () => {
  assert.match(css, /\.studio-control input\[type=range\]\s*\{[^}]*height:\s*4px/s);
  assert.doesNotMatch(css, /#crossfadeSlider::-(webkit|moz)-slider/);
});

console.log("PASS: Crossfade native range behavior and shared compact styling");
