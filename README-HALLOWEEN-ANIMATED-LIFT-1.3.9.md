# FoxsMusic 1.3.9 — Halloween Animated Lift

Changes in this revision:
- The centered pumpkin and pentagram use a fixed-aspect SVG stage (`preserveAspectRatio="xMidYMid meet"`) so they do not stretch when the app is maximized.
- Pumpkin eyes and all four side eyes blink briefly at staggered intervals.
- Five candle bodies levitate independently; each flame has its own movement and warm flicker.
- The general visual-effects toggle disables these new animations.
- Existing wind, bats, ghosts, library, playback, and Christmas scene remain in place.

Build on Windows by running `build-windows.bat` from this folder and then launch the portable build in `release`.
