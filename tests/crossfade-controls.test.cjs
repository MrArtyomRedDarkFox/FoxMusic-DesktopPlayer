"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const startMarker = "  // FOXSMUSIC-CROSSFADE-145: robust document-level pointer tracking.";
const endMarker = "  $('#normalizeToggle').addEventListener('change'";
const start = app.indexOf(startMarker);
const end = app.indexOf(endMarker, start);
assert.ok(start >= 0 && end > start, "crossfade pointer-control block exists");
const pointerBlock = app.slice(start, end);

function createSliderHarness() {
  const sliderListeners = new Map();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const dispatched = [];
  const slider = {
    min: "0", max: "8", step: "1", value: "3", dataset: {},
    getBoundingClientRect: () => ({ left: 0, width: 200 }),
    addEventListener: (name, fn) => sliderListeners.set(name, fn),
    dispatchEvent: event => { dispatched.push(event.type); return true; },
    focus: () => {},
  };
  class FakeEvent { constructor(type, options = {}) { this.type = type; this.bubbles = !!options.bubbles; } }
  const context = {
    $: selector => selector === "#crossfadeSlider" ? slider : null,
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    Event: FakeEvent,
    document: { addEventListener: (name, fn, capture) => documentListeners.set(name, { fn, capture }) },
    window: { addEventListener: (name, fn) => windowListeners.set(name, fn) },
  };
  vm.runInNewContext(pointerBlock, context);
  return { slider, sliderListeners, documentListeners, windowListeners, dispatched };
}

test("click and drag update the range even when pointer leaves the input", () => {
  const h = createSliderHarness();
  assert.equal(h.sliderListeners.has("pointerdown"), true);
  assert.equal(h.documentListeners.get("pointermove")?.capture, true, "movement is captured at document level");
  h.sliderListeners.get("pointerdown")({ pointerId: 7, pointerType: "mouse", button: 0, isPrimary: true, clientX: 100 });
  assert.equal(Number(h.slider.value), 4, "clicking the middle selects the middle value");
  h.documentListeners.get("pointermove").fn({ pointerId: 7, clientX: 190, cancelable: true, preventDefault() {} });
  assert.equal(Number(h.slider.value), 8, "dragging beyond the input bounds updates the value");
  h.documentListeners.get("pointerup").fn({ pointerId: 7 });
  assert.equal(h.dispatched.includes("input"), true, "updates dispatch input for the existing save/label handler");
  assert.equal(h.dispatched.includes("change"), true, "release dispatches change");
});

test("pointer cancellation releases drag state", () => {
  const h = createSliderHarness();
  h.sliderListeners.get("pointerdown")({ pointerId: 2, pointerType: "touch", button: 0, isPrimary: true, clientX: 20 });
  h.documentListeners.get("pointercancel").fn({ pointerId: 2 });
  const count = h.dispatched.filter(type => type === "change").length;
  h.documentListeners.get("pointermove").fn({ pointerId: 2, clientX: 180, cancelable: true, preventDefault() {} });
  assert.equal(h.dispatched.filter(type => type === "change").length, count);
  assert.equal(Number(h.slider.value), 0, "cancelled drag no longer changes the slider");
});

console.log("PASS: Crossfade click/drag controls and document-level pointer tracking");
