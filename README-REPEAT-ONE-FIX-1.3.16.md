# FoxsMusic 1.3.16 — Repeat One Fix

- Repeat mode is now synchronized across both audio decks.
- Repeat One prevents automatic crossfade into another track.
- Crossfade preparation checks the active repeat mode before swapping the active deck.
- Saved repeat mode is restored for both decks at startup.

Run `npm run test:repeat` to execute the focused regression checks.
