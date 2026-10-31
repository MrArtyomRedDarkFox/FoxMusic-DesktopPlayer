FoxsMusic — UI, Halloween web and Smart Playlist refinement

This is a source patch for the FoxsMusic-Desktop project after the previous
"Smart Playlists + Source Button Fix" patch has been installed.

Changes:
1. Centers the × glyph optically in all close buttons: library source, settings,
   Sound Studio, queue clear and full-screen Now Playing.
2. Lengthens the two dangling Halloween spider threads from the top web edge.
3. Stores the original file's filesystem last-modified timestamp separately
   from the time the track was imported into FoxsMusic. This uses Electron's
   existing `lastModified` file metadata (and File.lastModified for drag/drop).
4. Makes "Recently Added" sort and display the original file's last-modified date
   from the source folder (Windows filesystem mtime), with the library import date
   as a fallback for legacy/blob tracks without source metadata.
5. Improves "Most Played": a play counts only after real listening time reaches
   at least half the track, capped at 30 seconds (minimum 3 seconds for short
   tracks). Seeking over a section does not count as listened time. A single
   repeat-one session is counted only once; the last-listened timestamp changes
   only after this meaningful-listen threshold has been reached.
6. Persists source file dates and qualified play counts in IndexedDB and JSON
   backups; adds RU / EN / DE descriptions.
7. Replaces tests/smart-playlists.test.cjs with focused regression tests.
   The previous patch already added this test to `npm test`.

Install on Windows:
1. Close FoxsMusic if it is running.
2. Extract the ZIP into the root of your FoxsMusic-Desktop project. It contains
   tests/apply-foxsmusic-playlists-refinement.ps1.
3. In VS Code terminal at the project root run:
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\apply-foxsmusic-playlists-refinement.ps1
4. Run:
   npm test
5. If all tests pass, run:
   npm start

The script derives the project root from its own location, verifies every
expected source-code anchor before writing, and creates a timestamped backup
folder containing the original app.js, index.html, styles.css and the test.

Existing historical play counts are preserved. From this update onward, new
counts are added only after the meaningful-listening threshold is reached.
Legacy tracks get their source file date when the original source folder is
rescanned; if no source timestamp is available, Recently Added falls back to
the previous library date.
