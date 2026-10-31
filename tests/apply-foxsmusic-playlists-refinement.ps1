$ErrorActionPreference = 'Stop'

# This script is stored in <project>\tests, so derive the repository root
# from the script location rather than relying on the terminal's current path.
$root = Split-Path -Parent $PSScriptRoot
$required = @('app.js', 'index.html', 'styles.css', 'package.json', 'package-lock.json')
foreach ($file in $required) {
    if (-not (Test-Path (Join-Path $root $file))) {
        throw "Не найден $file. Помести скрипт в папку tests проекта FoxsMusic-Desktop."
    }
}
$testPath = Join-Path $root 'tests\smart-playlists.test.cjs'
if (-not (Test-Path $testPath)) {
    throw "Не найден $testPath. Сначала установи предыдущий патч Smart Playlists."
}

function Replace-Once {
    param([string]$Text, [string]$Old, [string]$New, [string]$Label)
    $count = [regex]::Matches($Text, [regex]::Escape($Old)).Count
    if ($count -ne 1) {
        throw "Не удалось безопасно применить '$Label': найдено совпадений $count, ожидалось 1. Файлы проекта не изменены."
    }
    return $Text.Replace($Old, $New)
}

$appPath = Join-Path $root 'app.js'
$indexPath = Join-Path $root 'index.html'
$cssPath = Join-Path $root 'styles.css'
$packagePath = Join-Path $root 'package.json'

$utf8 = [System.Text.UTF8Encoding]::new($false)
$app = ([System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)) -replace "`r`n", "`n"
$index = ([System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)) -replace "`r`n", "`n"
$css = ([System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)) -replace "`r`n", "`n"
$package = [System.IO.File]::ReadAllText($packagePath, [System.Text.Encoding]::UTF8)
$test = @'
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.doesNotThrow(() => new Function(app), 'app.js must remain valid JavaScript');

const helperStart = app.indexOf('  function sourceFileTimestamp(');
const helperEnd = app.indexOf('  function getSmartPlaylistTracks(', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'smart playlist helper block must exist');

const helperSource = app.slice(helperStart, helperEnd);
const sandbox = {};
vm.runInNewContext(
  helperSource + `
    this.api = {
      sourceFileTimestamp,
      trackSourceTimestamp,
      hasQualifiedListen,
      accumulateListenSeconds,
      sortSmartPlaylistTracks
    };
  `,
  sandbox
);
const api = sandbox.api;

assert.equal(
  api.sourceFileTimestamp({ lastModified: 777, createdAt: 888 }, null, 123),
  777,
  'source file modification time must take precedence over import time'
);
assert.equal(
  api.sourceFileTimestamp({}, { lastModified: 999 }, 123),
  999,
  'browser File.lastModified must be used when importing via drag and drop'
);
assert.equal(
  api.sourceFileTimestamp({}, null, 123),
  123,
  'fallback timestamp must be used only when source metadata is unavailable'
);
assert.equal(
  api.trackSourceTimestamp({ sourceDateAt: 500, addedAt: 900 }),
  500,
  'Recently Added must use the source file date'
);
assert.equal(
  api.trackSourceTimestamp({ addedAt: 900 }),
  900,
  'legacy tracks without source metadata must use their original library date'
);

const played = [
  { id: 'old-high', playCount: 8, lastPlayedAt: 400, sourceDateAt: 100 },
  { id: 'tie-newer-listen', playCount: 8, lastPlayedAt: 800, sourceDateAt: 200 },
  { id: 'low', playCount: 2, lastPlayedAt: 300, sourceDateAt: 900 },
  { id: 'never', playCount: 0, lastPlayedAt: 0, sourceDateAt: 1000 }
];
assert.deepEqual(
  Array.from(api.sortSmartPlaylistTracks(played, 'smart-most-played'), item => item.id),
  ['tie-newer-listen', 'old-high', 'low'],
  'Most Played must rank meaningful plays by count, then latest listen, and hide zero-play tracks'
);

const recent = [
  { id: 'imported-today-old-file', addedAt: 9000, sourceDateAt: 1000 },
  { id: 'older-import-new-file', addedAt: 2000, sourceDateAt: 8000 },
  { id: 'legacy', addedAt: 5000 }
];
assert.deepEqual(
  Array.from(api.sortSmartPlaylistTracks(recent, 'smart-recent'), item => item.id),
  ['older-import-new-file', 'legacy', 'imported-today-old-file'],
  'Recently Added must sort by original source-file date, with a legacy fallback'
);
assert.deepEqual(
  recent.map(item => item.id),
  ['imported-today-old-file', 'older-import-new-file', 'legacy'],
  'Sorting must not mutate the source library'
);

assert.equal(api.hasQualifiedListen(29, 120), false, 'a 2-minute track needs 30 seconds');
assert.equal(api.hasQualifiedListen(30, 120), true, '30 seconds qualifies for a long track');
assert.equal(api.hasQualifiedListen(9, 20), false, 'a 20-second track needs half its duration');
assert.equal(api.hasQualifiedListen(10, 20), true, 'half of a short track qualifies');
assert.equal(api.hasQualifiedListen(3, 4), true, 'very short tracks use a 3-second minimum');

const session = { listenedSeconds: 0, lastTime: 0 };
for (let t = 1; t <= 5; t++) api.accumulateListenSeconds(session, t, true);
assert.equal(session.listenedSeconds, 5, 'continuous listening time must accumulate');
api.accumulateListenSeconds(session, 45, true);
assert.equal(session.listenedSeconds, 5, 'large position jumps/seeks must not count as listening');
api.accumulateListenSeconds(session, 46, true);
assert.equal(session.listenedSeconds, 6, 'listening resumes after a seek without counting skipped time');

assert.ok(app.includes('const sourceDateAt = sourceFileTimestamp(record, null'), 'folder rescan must read source file metadata');
assert.ok(app.includes('track.sourceDateAt = sourceDateAt;'), 'folder rescan must persist the refreshed source date');
assert.ok(app.includes('sourceDateAt: sourceFileTimestamp(record, file'), 'file imports must store source date');
assert.ok(app.includes('sourceDateAt: Number.isFinite(track.sourceDateAt)'), 'source date must persist in IndexedDB');
assert.ok(app.includes('sourceDateAt: Number.isFinite(track.sourceDateAt) ? track.sourceDateAt : null'), 'source date must be included in backups');
assert.ok(app.includes('sourceDateAt = Math.max('), 'source date must be restored from backups');
assert.ok(app.includes('maybeCountQualifiedListen(activeTrack)'), 'active playback must update the qualified listen counter');
assert.ok(app.includes('track.lastPlayedAt = Date.now();'), 'last played timestamp must be updated after a qualified listen');
const recordStart = app.indexOf('  function recordPlayedTrack(track) {');
const recordEnd = app.indexOf('\n  }', recordStart) + 4;
assert.ok(recordStart >= 0 && recordEnd > recordStart, 'recordPlayedTrack must exist');
assert.ok(!app.slice(recordStart, recordEnd).includes('track.lastPlayedAt ='), 'skipped or very short plays must not count as a meaningful last listen');
assert.ok(app.includes('function hasQualifiedListen('), 'qualified listening threshold must be explicit');
assert.ok(app.includes("smartRecentlyAddedSubtitle: '50 последних файлов"), 'Russian source-date description must be present');
assert.ok(app.includes("smartRecentlyAddedSubtitle: 'The 50 newest source files"), 'English source-date description must be present');
assert.ok(app.includes("smartRecentlyAddedSubtitle: 'Die 50 neuesten Quelldateien"), 'German source-date description must be present');

assert.ok(css.includes('.now-playing-close::before'), 'Now Playing close glyph must use a centered pseudo-element');
assert.ok(css.includes('.settings-close::before'), 'settings close glyph must use a centered pseudo-element');
assert.ok(css.includes('.studio-close::before'), 'sound studio close glyph must use a centered pseudo-element');
assert.ok(css.includes('.queue-clear-btn::before'), 'queue close glyph must use a centered pseudo-element');
assert.ok(css.includes('#clearFolderSourceBtn::before'), 'source-pill close glyph must use a centered pseudo-element');
assert.ok(html.includes('translate(20 121)'), 'left spider must hang lower from the web');
assert.ok(html.includes('M0 -112V-12'), 'left spider thread must be longer');
assert.ok(html.includes('translate(1177 138)'), 'right spider must hang lower from the web');
assert.ok(html.includes('M0 -129V-14'), 'right spider thread must be longer');

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.ok(packageJson.scripts?.test?.includes('test:smart-playlists'), 'smart playlist test must be part of npm test');

console.log('PASS: source-file dates, recently added ordering, qualified Most Played counts, backup persistence, close-button centering and longer Halloween spider threads');
'@

if (-not $package.Contains('"test:smart-playlists"')) {
    throw 'В package.json не найден предыдущий test:smart-playlists. Установка предыдущего патча не обнаружена.'
}

# 1) Replace smart playlist helpers with source-date sorting and qualified listen tracking.
$old = @'
  function sortSmartPlaylistTracks(sourceTracks, view, limit = 50) {
    const items = Array.isArray(sourceTracks) ? sourceTracks.slice() : [];
    const timestamp = value => Number.isFinite(value) && value >= 0 ? value : 0;
    if (view === 'smart-most-played') {
      return items
        .filter(track => Number.isSafeInteger(track?.playCount) && track.playCount > 0)
        .sort((left, right) =>
          right.playCount - left.playCount ||
          timestamp(right.lastPlayedAt) - timestamp(left.lastPlayedAt) ||
          timestamp(right.addedAt) - timestamp(left.addedAt)
        )
        .slice(0, limit);
    }
    if (view === 'smart-recent') {
      return items
        .sort((left, right) => timestamp(right.addedAt) - timestamp(left.addedAt))
        .slice(0, limit);
    }
    return items;
  }
  function getSmartPlaylistTracks(view) {
    return sortSmartPlaylistTracks(getSourceTracks(), view, 50);
  }
'@
$new = @'
  function sourceFileTimestamp(record, file = null, fallback = Date.now()) {
    const candidates = [record?.lastModified, record?.createdAt, file?.lastModified, record?.file?.lastModified];
    for (const candidate of candidates) {
      const timestamp = Number(candidate);
      if (Number.isFinite(timestamp) && timestamp > 0) return timestamp;
    }
    const safeFallback = Number(fallback);
    return Number.isFinite(safeFallback) && safeFallback > 0 ? safeFallback : Date.now();
  }
  function trackSourceTimestamp(track) {
    const sourceDate = Number(track?.sourceDateAt);
    if (Number.isFinite(sourceDate) && sourceDate > 0) return sourceDate;
    const addedDate = Number(track?.addedAt);
    return Number.isFinite(addedDate) && addedDate > 0 ? addedDate : 0;
  }
  function hasQualifiedListen(listenedSeconds, duration) {
    const listened = Number(listenedSeconds) || 0;
    const total = Number(duration) || 0;
    const threshold = total > 0 ? Math.min(30, Math.max(3, total * 0.5)) : 30;
    return listened >= threshold;
  }
  function accumulateListenSeconds(session, currentTime, isPlaying = true) {
    const current = Number(currentTime);
    if (!session || !Number.isFinite(current) || current < 0) return 0;
    const previous = Number(session.lastTime);
    if (isPlaying && Number.isFinite(previous)) {
      const delta = current - previous;
      // Ignore seeks and large clock jumps; only elapsed playback contributes.
      if (delta > 0 && delta <= 4) session.listenedSeconds += delta;
    }
    session.lastTime = current;
    return session.listenedSeconds;
  }
  let qualifiedPlaySession = null;
  function beginQualifiedPlaySession(track) {
    if (!track) { qualifiedPlaySession = null; return; }
    qualifiedPlaySession = {
      trackId: track.id,
      listenedSeconds: 0,
      lastTime: Number(ui.audio.currentTime) || 0,
      counted: false
    };
  }
  function maybeCountQualifiedListen(track) {
    const session = qualifiedPlaySession;
    if (!track || !session || session.trackId !== track.id || session.counted || ui.audio.paused || ui.audio.ended) return;
    const listened = accumulateListenSeconds(session, ui.audio.currentTime, true);
    if (!hasQualifiedListen(listened, Number(ui.audio.duration) || Number(track.duration) || 0)) return;
    session.counted = true;
    track.playCount = Math.min(1000000, (Number.isSafeInteger(track.playCount) && track.playCount > 0 ? track.playCount : 0) + 1);
    track.lastPlayedAt = Date.now();
    void saveTrack(track);
    persistSettings();
    if (activeView === 'smart-most-played') renderAll();
    else renderPlaylists();
  }
  function sortSmartPlaylistTracks(sourceTracks, view, limit = 50) {
    const items = Array.isArray(sourceTracks) ? sourceTracks.slice() : [];
    const timestamp = value => Number.isFinite(value) && value >= 0 ? value : 0;
    if (view === 'smart-most-played') {
      return items
        .filter(track => Number.isSafeInteger(track?.playCount) && track.playCount > 0)
        .sort((left, right) =>
          right.playCount - left.playCount ||
          timestamp(right.lastPlayedAt) - timestamp(left.lastPlayedAt) ||
          trackSourceTimestamp(right) - trackSourceTimestamp(left) ||
          String(left.title || '').localeCompare(String(right.title || ''), undefined, { sensitivity: 'base' })
        )
        .slice(0, limit);
    }
    if (view === 'smart-recent') {
      return items
        .sort((left, right) => trackSourceTimestamp(right) - trackSourceTimestamp(left))
        .slice(0, limit);
    }
    return items;
  }
  function getSmartPlaylistTracks(view) {
    return sortSmartPlaylistTracks(getSourceTracks(), view, 50);
  }
'@
$app = Replace-Once $app $old $new 'smart playlist date and qualified-listen helpers'

# 2) A play is counted only after meaningful playback, not on a Play click.
$old = @'
  function recordPlayedTrack(track) {
    if (!track) return;
    const playedAt = Date.now();
    playbackHistory = [{ id: track.id, playedAt }, ...playbackHistory.filter(item => item.id !== track.id)].slice(0, 100);
    track.lastPlayedAt = playedAt;
    track.playCount = Math.min(1000000, (Number.isSafeInteger(track.playCount) && track.playCount > 0 ? track.playCount : 0) + 1);
    void saveTrack(track);
    persistSettings();
    const historyCount = $('#historyCount'); if (historyCount) historyCount.textContent = String(playbackHistory.length);
    if (activeView === 'history' || activeView === 'smart-most-played') renderAll();
  }
'@
$new = @'
  function recordPlayedTrack(track) {
    if (!track) return;
    const playedAt = Date.now();
    playbackHistory = [{ id: track.id, playedAt }, ...playbackHistory.filter(item => item.id !== track.id)].slice(0, 100);
    beginQualifiedPlaySession(track);
    void saveTrack(track);
    persistSettings();
    const historyCount = $('#historyCount'); if (historyCount) historyCount.textContent = String(playbackHistory.length);
    if (activeView === 'history') renderAll();
  }
'@
$app = Replace-Once $app $old $new 'count qualified listens only'

$old = "if (selectionChanged || !attachedSource) recordPlayedTrack(track);"
$new = "if (selectionChanged || !attachedSource || !qualifiedPlaySession || qualifiedPlaySession.trackId !== track.id) recordPlayedTrack(track);"
$app = Replace-Once $app $old $new 'start a new listen session when the track is replayed'

$old = @'
    if (ui.audio.paused) {
      try { await ensureAudioEngine(); applyAudioSettings(false); await ui.audio.play(); updateAudioEngineStatus(); }
      catch (error) {
        console.warn('FoxsMusic playback error', error);
        if (error?.name === 'NotAllowedError') toast('Нажми Play ещё раз, чтобы разрешить воспроизведение.', 'error');
        else toast('Не удалось запустить воспроизведение. Проверь аудиофайл и попробуй ещё раз.', 'error');
      }
    } else ui.audio.pause();
'@
$new = @'
    if (ui.audio.paused) {
      try {
        await ensureAudioEngine();
        applyAudioSettings(false);
        await ui.audio.play();
        if (!qualifiedPlaySession || qualifiedPlaySession.trackId !== selectedTrack.id) recordPlayedTrack(selectedTrack);
        updateAudioEngineStatus();
      }
      catch (error) {
        console.warn('FoxsMusic playback error', error);
        if (error?.name === 'NotAllowedError') toast('Нажми Play ещё раз, чтобы разрешить воспроизведение.', 'error');
        else toast('Не удалось запустить воспроизведение. Проверь аудиофайл и попробуй ещё раз.', 'error');
      }
    } else ui.audio.pause();
'@
$app = Replace-Once $app $old $new 'restart qualified listen session on replay'

$old = @'
    try { ui.audio.currentTime = 0; } catch (_) {}
    syncPlaybackUI();
    updateAudioEngineStatus();
    updateMediaSession();
    updateNowPlayingOverlay();
'@
$new = @'
    try { ui.audio.currentTime = 0; } catch (_) {}
    qualifiedPlaySession = null;
    syncPlaybackUI();
    updateAudioEngineStatus();
    updateMediaSession();
    updateNowPlayingOverlay();
'@
$app = Replace-Once $app $old $new 'allow a later replay to start a fresh listen session'

$old = @'
      ui.currentTime.textContent = formatTime(ui.audio.currentTime);
      updateSeekRange(); updateNowPlayingOverlay(); maybeStartAutoCrossfade();
'@
$new = @'
      ui.currentTime.textContent = formatTime(ui.audio.currentTime);
      const activeTrack = getCurrentTrack();
      if (activeTrack) maybeCountQualifiedListen(activeTrack);
      updateSeekRange(); updateNowPlayingOverlay(); maybeStartAutoCrossfade();
'@
$app = Replace-Once $app $old $new 'accumulate genuine playback time'

# 3) Use the filesystem timestamp supplied by Electron / File.lastModified.
$old = @'
          audioPath: directPath,
          addedAt: Date.now() + imported, duration: 0, favorite: false, playlists: [],
'@
$new = @'
          audioPath: directPath,
          addedAt: Date.now() + imported,
          sourceDateAt: sourceFileTimestamp(record, file, Date.now() + imported),
          duration: 0, favorite: false, playlists: [],
'@
$app = Replace-Once $app $old $new 'save original file date on import'

$old = @'
      if (track) {
        track.audioPath = record.path;
        track.audioUrl = record.url;
        track.fileName = record.name || track.fileName;
        track.sourceUnavailable = false;
        continue;
      }
'@
$new = @'
      if (track) {
        track.audioPath = record.path;
        track.audioUrl = record.url;
        track.fileName = record.name || track.fileName;
        const sourceDateAt = sourceFileTimestamp(record, null, track.sourceDateAt || track.addedAt);
        if (track.sourceDateAt !== sourceDateAt) {
          track.sourceDateAt = sourceDateAt;
          await saveTrack(track);
        }
        track.sourceUnavailable = false;
        continue;
      }
'@
$app = Replace-Once $app $old $new 'refresh original date when source folders are rescanned'

$old = @'
        audioPath: record.path, addedAt: Date.now() + added, duration: 0,
        favorite: false, playlists: [], audioBlob: null, coverBlob: null,
'@
$new = @'
        audioPath: record.path, addedAt: Date.now() + added,
        sourceDateAt: sourceFileTimestamp(record, null, Date.now() + added), duration: 0,
        favorite: false, playlists: [], audioBlob: null, coverBlob: null,
'@
$app = Replace-Once $app $old $new 'save source date for folder imports'

# 4) Display the original source date in Recently Added, and keep it through backups.
$old = @'
      playCount: Number.isSafeInteger(track.playCount) ? Math.max(0, Math.min(1000000, track.playCount)) : 0,
      lastPlayedAt: Number.isFinite(track.lastPlayedAt) && track.lastPlayedAt >= 0 ? track.lastPlayedAt : null,
      favorite: !!track.favorite, playlists: Array.isArray(track.playlists) ? track.playlists : [],
'@
$new = @'
      playCount: Number.isSafeInteger(track.playCount) ? Math.max(0, Math.min(1000000, track.playCount)) : 0,
      lastPlayedAt: Number.isFinite(track.lastPlayedAt) && track.lastPlayedAt >= 0 ? track.lastPlayedAt : null,
      sourceDateAt: Number.isFinite(track.sourceDateAt) && track.sourceDateAt > 0 ? track.sourceDateAt : null,
      favorite: !!track.favorite, playlists: Array.isArray(track.playlists) ? track.playlists : [],
'@
$app = Replace-Once $app $old $new 'persist original source date in IndexedDB'

$old = @'
    track.playCount = Number.isSafeInteger(track.playCount) && track.playCount > 0 ? Math.min(1000000, track.playCount) : 0;
    track.lastPlayedAt = Number.isFinite(track.lastPlayedAt) && track.lastPlayedAt >= 0 ? track.lastPlayedAt : 0;
    track.album = typeof track.album === 'string' ? track.album : '';
'@
$new = @'
    track.playCount = Number.isSafeInteger(track.playCount) && track.playCount > 0 ? Math.min(1000000, track.playCount) : 0;
    track.lastPlayedAt = Number.isFinite(track.lastPlayedAt) && track.lastPlayedAt >= 0 ? track.lastPlayedAt : 0;
    track.sourceDateAt = Number.isFinite(track.sourceDateAt) && track.sourceDateAt > 0 ? track.sourceDateAt : 0;
    track.album = typeof track.album === 'string' ? track.album : '';
'@
$app = Replace-Once $app $old $new 'hydrate original source date'

$old = "const addedCell = activeView === 'smart-most-played' ? String(track.playCount || 0) : new Date(track.addedAt).toLocaleDateString(({ru:'ru-RU', en:'en-US', de:'de-DE'})[currentLocale], {day:'2-digit', month:'short'});"
$new = "const displayDate = activeView === 'smart-recent' ? trackSourceTimestamp(track) : track.addedAt;`n      const addedCell = activeView === 'smart-most-played' ? String(track.playCount || 0) : new Date(displayDate).toLocaleDateString(({ru:'ru-RU', en:'en-US', de:'de-DE'})[currentLocale], {day:'2-digit', month:'short'});"
$app = Replace-Once $app $old $new 'display source date in Recently Added'

$old = "fileName: track.fileName, addedAt: track.addedAt, duration: track.duration, playCount: Number.isSafeInteger(track.playCount) ? track.playCount : 0, lastPlayedAt: Number.isFinite(track.lastPlayedAt) ? track.lastPlayedAt : null, favorite: !!track.favorite,"
$new = "fileName: track.fileName, addedAt: track.addedAt, duration: track.duration, playCount: Number.isSafeInteger(track.playCount) ? track.playCount : 0, lastPlayedAt: Number.isFinite(track.lastPlayedAt) ? track.lastPlayedAt : null, sourceDateAt: Number.isFinite(track.sourceDateAt) ? track.sourceDateAt : null, favorite: !!track.favorite,"
$app = Replace-Once $app $old $new 'export source date in backups'

$old = "for (const field of ['addedAt', 'duration', 'lastPlayedAt']) {"
$new = "for (const field of ['addedAt', 'duration', 'lastPlayedAt', 'sourceDateAt']) {"
$app = Replace-Once $app $old $new 'validate source date in backups'

$old = @'
            target.playCount = Math.max(Number.isSafeInteger(target.playCount) ? target.playCount : 0, Number.isSafeInteger(raw.playCount) ? Math.min(1000000, raw.playCount) : 0);
            target.lastPlayedAt = Math.max(Number.isFinite(target.lastPlayedAt) ? target.lastPlayedAt : 0, Number.isFinite(raw.lastPlayedAt) ? raw.lastPlayedAt : 0);
            target.favorite =
'@
$new = @'
            target.playCount = Math.max(Number.isSafeInteger(target.playCount) ? target.playCount : 0, Number.isSafeInteger(raw.playCount) ? Math.min(1000000, raw.playCount) : 0);
            target.lastPlayedAt = Math.max(Number.isFinite(target.lastPlayedAt) ? target.lastPlayedAt : 0, Number.isFinite(raw.lastPlayedAt) ? raw.lastPlayedAt : 0);
            target.sourceDateAt = Math.max(Number.isFinite(target.sourceDateAt) ? target.sourceDateAt : 0, Number.isFinite(raw.sourceDateAt) ? raw.sourceDateAt : Number.isFinite(raw.addedAt) ? raw.addedAt : 0);
            target.favorite =
'@
$app = Replace-Once $app $old $new 'restore source date from backups'

# 5) RU / EN / DE copy explains source-file dates and qualified listening.
$localePairs = @(
    @("smartMostPlayedSubtitle: 'Топ-50 треков по числу запусков.'", "smartMostPlayedSubtitle: 'Топ-50 по реальным прослушиваниям: не менее половины трека или 30 секунд.'"),
    @("smartRecentlyAddedSubtitle: '50 последних треков по дате добавления.'", "smartRecentlyAddedSubtitle: '50 последних файлов по дате изменения в исходной папке.'"),
    @("smartMostPlayedSubtitle: 'Your 50 most played tracks, ranked by play count.'", "smartMostPlayedSubtitle: 'Your 50 most-played tracks, counted after half a track or 30 seconds of listening.'"),
    @("smartRecentlyAddedSubtitle: 'The 50 newest tracks, sorted by their added date.'", "smartRecentlyAddedSubtitle: 'The 50 newest source files, sorted by their original file date.'"),
    @("smartMostPlayedSubtitle: 'Deine 50 meistgespielten Titel, sortiert nach Wiedergaben.'", "smartMostPlayedSubtitle: 'Deine 50 meistgehörten Titel, gezählt ab einer halben Wiedergabe oder 30 Sekunden.'"),
    @("smartRecentlyAddedSubtitle: 'Die 50 zuletzt hinzugefügten Titel, nach Hinzufügedatum sortiert.'", "smartRecentlyAddedSubtitle: 'Die 50 neuesten Quelldateien, sortiert nach dem ursprünglichen Dateidatum.'")
)
foreach ($pair in $localePairs) {
    $app = Replace-Once $app $pair[0] $pair[1] 'update RU / EN / DE smart playlist descriptions'
}

# 6) Center the close glyph itself, not just the button box.
$css += @'

/* Optical centering for the × glyph in the source chip and Now Playing overlay. */
#clearFolderSourceBtn,
.now-playing-close,
.settings-close,
.studio-close,
.queue-clear-btn {
  display: grid !important;
  place-items: center !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  font-size: 0 !important;
  line-height: 0 !important;
  text-align: center !important;
}
#clearFolderSourceBtn::before,
.now-playing-close::before,
.settings-close::before,
.studio-close::before,
.queue-clear-btn::before {
  content: "×";
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 400;
  line-height: 1;
  transform: translateY(-1px);
  pointer-events: none;
}
#clearFolderSourceBtn::before { font-size: 16px; }
.now-playing-close::before { font-size: 26px; }
.settings-close::before,
.studio-close::before,
.queue-clear-btn::before { font-size: 18px; }

/* Longer, more visible suspension threads for the Halloween spiders. */
body[data-profile-mode="halloween"] .halloween-spider > path:first-child {
  stroke-width: 1.45;
  stroke-opacity: .92;
  filter: drop-shadow(0 0 2px rgba(210,190,245,.5));
}
'@

# 7) Lengthen each SVG thread by lowering the spider while keeping its top anchored.
$old = '<g class="halloween-spider spider-left" transform="translate(20 93)"><path d="M0 -84V-12" stroke="#b7a1d0" stroke-opacity=".7"/>'
$new = '<g class="halloween-spider spider-left" transform="translate(20 121)"><path d="M0 -112V-12" stroke="#b7a1d0" stroke-opacity=".7" stroke-width="1.45" stroke-linecap="round"/>'
$index = Replace-Once $index $old $new 'lengthen left spider thread'

$old = '<g class="halloween-spider spider-right" transform="translate(1177 109)"><path d="M0 -100V-14" stroke="#b7a1d0" stroke-opacity=".65"/>'
$new = '<g class="halloween-spider spider-right" transform="translate(1177 138)"><path d="M0 -129V-14" stroke="#b7a1d0" stroke-opacity=".65" stroke-width="1.45" stroke-linecap="round"/>'
$index = Replace-Once $index $old $new 'lengthen right spider thread'

# The previous patch already registered this test in npm test. Replace its content
# with regression coverage for the new source-date and playback-threshold behavior.
# Validate final in-memory JavaScript / JSON before changing any project file.
$null = $package | ConvertFrom-Json
# Node will execute the test after the patch is applied.

$backupDir = Join-Path $root ("backup-smart-playlists-refinement-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupDir | Out-Null
Copy-Item $appPath (Join-Path $backupDir 'app.js')
Copy-Item $indexPath (Join-Path $backupDir 'index.html')
Copy-Item $cssPath (Join-Path $backupDir 'styles.css')
Copy-Item $testPath (Join-Path $backupDir 'smart-playlists.test.cjs')

[System.IO.File]::WriteAllText($appPath, $app, $utf8)
[System.IO.File]::WriteAllText($indexPath, $index, $utf8)
[System.IO.File]::WriteAllText($cssPath, $css, $utf8)
[System.IO.File]::WriteAllText($testPath, $test, $utf8)

Write-Host ''
Write-Host 'FoxsMusic refinement applied successfully.' -ForegroundColor Green
Write-Host "Original files backed up to: $backupDir"
Write-Host 'Run npm test, then npm start.'
