# FoxsMusic Desktop + Android — Fox Headphones Logo Update

This archive combines the desktop player and the Android project in `mobile/`.

## Changes in this update
- Android startup/loading screen now uses the FoxsMusic fox-with-headphones mascot and the FoxsMusic wordmark.
- The empty-library panel uses the same mascot instead of the music-note placeholder.
- Existing desktop source and music-player behavior are preserved.
- Android app icon remains the existing DP logo; only the splash and in-app mascot panel were changed.

## Run desktop
Use the desktop project's existing instructions and scripts (`package.json`, `build-windows.bat`, `build-linux.sh`).

## Run Android project
```powershell
cd mobile
npm install
npx expo start
```

## Build Android APK via EAS
```powershell
cd mobile
npx eas-cli login
npm run build:apk
```
The EAS build needs a configured Expo account and network access.
