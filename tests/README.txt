FoxsMusic — Smart Playlists & Source Button Fix

This patcher targets the current FoxsMusic-Desktop repository source.

Changes:
- Fixes the active library source remove (X) control using a fixed grid column.
- Adds the same alignment fix to source-folder rows in Settings.
- Adds two automatic smart playlists:
  * Most Played — top 50 tracks ranked by saved play count, then last played date.
  * Recently Added — 50 newest tracks sorted by their addedAt timestamp.
- Persists playCount / lastPlayedAt in IndexedDB and includes them in JSON backups.
- Adds RU / EN / DE translations for the new playlist names, subtitles and empty state.
- Adds tests/smart-playlists.test.cjs to npm test.

Usage (Windows):
1. Copy this ZIP's .ps1 file into the root of your FoxsMusic-Desktop checkout
   (the folder containing package.json).
2. Open PowerShell in that folder.
3. Run:
   powershell -ExecutionPolicy Bypass -File .\apply-foxsmusic-smart-playlists-fix.ps1
4. Run:
   npm test
5. Run build-windows.bat.

The script checks every source-code anchor before writing anything and creates a
backup-smart-playlists-YYYYMMDD-HHMMSS folder with the original app.js, styles.css
and package.json before applying changes.

Smart play counts start collecting after this update is installed; old tracks have
no historical play-count data, so the Most Played list fills as tracks are played.
