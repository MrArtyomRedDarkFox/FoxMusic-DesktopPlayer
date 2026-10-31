# FoxsMusic 1.3.17 — Shuffle and Repeat Off fix

- Shuffle now creates a stable randomized order, traversed by Next/Previous without random repeats before the cycle is exhausted.
- Shuffle order is persisted and reconciled when the queue changes.
- Repeat Off stops playback at the end of the current track. It no longer automatically advances, and automatic crossfade is skipped in this mode.
- Repeat Playlist advances/wraps normally; Repeat One continues to loop the current track.

Build on Windows with `build-windows.bat`. Run smoke checks with `npm run test:shuffle-stop`, `npm run test:repeat`, `npm run test:hotkeys`, and `npm run test:now-playing`.
