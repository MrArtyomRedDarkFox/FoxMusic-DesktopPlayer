# FoxsMusic 1.3.15 — Now Playing button fix

- Implemented responsive full-screen “Now Playing” overlay styling (the markup and click handler existed, but its CSS was missing).
- The top-bar button now uses a disc icon rather than falling back to a music-note icon.
- The screen opens even when no track is selected and shows the app logo / prompt instead of silently doing nothing.
- Play, previous/next, seek, close button, Escape, click-outside, and ARIA pressed state are wired to the existing player.
- Added a responsive animated visualizer that moves only while playback is active and the screen is open.

Build with `build-windows.bat`. This patch was syntax/static-tested; run the packaged Electron app on Windows to confirm runtime behavior.
