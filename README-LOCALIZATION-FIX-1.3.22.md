# FoxsMusic Desktop 1.3.22 — localization fix

This update improves Russian, English, and German UI localization.

- Translates complete phrases and Russian fragments within mixed text nodes.
- Applies translations to dynamically rendered UI elements, dialogs, labels, placeholders, and accessibility attributes.
- Keeps user-provided track titles, artists, queue entries, and custom playlist/preset names unchanged.
- Uses the existing canonical RU/EN/DE language dictionary as an additional translation source.
- Adds a localization smoke test to `npm test`.

Existing audio, library, preset deletion, and Ctrl+Shift+E Sound Studio shortcut behavior is retained.
