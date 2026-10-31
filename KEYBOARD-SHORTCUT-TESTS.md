# FoxsMusic 1.3.14 — Keyboard shortcut verification

## Implemented behavior

- `Space`: toggle play/pause; held key repeats are ignored.
- `Left` / `Right`: seek by 5 seconds, clamped to track bounds. If the volume range is focused, its native left/right adjustment is preserved.
- `Up` / `Down`: adjust volume by 5%, update all audio decks, persist settings, and synchronize the volume slider; this also refreshes the remembered unmute volume.
- `Ctrl+K` / `Cmd+K`: opens and focuses search, including when another input is focused.
- `Ctrl+Shift+E` / `Cmd+Shift+E`: toggles the Sound Studio; physical `KeyE` works on Russian or English layouts and repeated keydown events are ignored.
- `M`: toggle mute while retaining the last nonzero volume.
- `N` / `P`: play next / previous track.
- `S`: toggle shuffle.
- `R`: cycle repeat off → all → one → off.
- `F`: toggle app fullscreen through the same button handler as the UI.
- `Esc`: close modal, Now Playing overlay, search mode, and app settings/sound studio (the settings/studio close handling is wired separately).

Letter keys are detected by `KeyboardEvent.code` (`KeyM`, `KeyN`, etc.) so the shortcuts work regardless of whether Windows is using English or Russian input layout. Text inputs, selects, and editable content do not trigger media shortcuts.

## Manual smoke test on Windows

1. Start the app and select a track. Press Space twice: playback should start then pause without repeated toggles.
2. Press Left and Right: playback position moves by about 5 seconds in each direction and stays within track boundaries.
3. Press Up/Down: volume changes by 5 percentage points. Press M twice afterward: mute/unmute should restore the latest nonzero volume.
4. Press Ctrl+K, type in search, and verify the text is not intercepted by letter shortcuts. Repeat with the Windows input language set to Russian.
5. Press Ctrl+Shift+E to open the Sound Studio; press it again to close the panel. Hold the shortcut and verify it does not toggle repeatedly. Repeat with the Windows input language set to Russian.
5. Press N/P: next/previous track. Hold briefly: only one skip per keydown.
6. Press S twice and verify shuffle indicator changes on/off. Press R three times and verify repeat off/all/one.
7. Press F twice and verify fullscreen enters then exits.
8. Open the help dialog, settings panel, Sound Studio, and Now Playing overlay; press Esc to close the current open UI.

Static source checks and JavaScript parse checks are run before packaging. A full interactive Electron test must be completed on the Windows machine where the app is built.
