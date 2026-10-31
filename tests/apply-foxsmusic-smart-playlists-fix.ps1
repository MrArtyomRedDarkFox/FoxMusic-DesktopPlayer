$ErrorActionPreference = 'Stop'

$root = (Get-Location).Path
$required = @('app.js', 'styles.css', 'package.json')
foreach ($file in $required) {
    if (-not (Test-Path (Join-Path $root $file))) {
        throw "Не найден $file. Запусти скрипт из корневой папки FoxsMusic-Desktop."
    }
}
$package = Get-Content (Join-Path $root 'package.json') -Raw
if ($package -notmatch '"name"\s*:\s*"foxsmusic-desktop"') {
    throw 'Текущая папка не похожа на корень FoxsMusic-Desktop.'
}

function Replace-Once {
    param(
        [string]$Text,
        [string]$Old,
        [string]$New,
        [string]$Label
    )
    $count = [regex]::Matches($Text, [regex]::Escape($Old)).Count
    if ($count -ne 1) {
        throw "Не удалось безопасно применить '$Label': найдено совпадений $count, ожидалось 1. Файлы проекта пока не изменены."
    }
    return $Text.Replace($Old, $New)
}

$appPath = Join-Path $root 'app.js'
$cssPath = Join-Path $root 'styles.css'
$packagePath = Join-Path $root 'package.json'
$app = (Get-Content $appPath -Raw -Encoding UTF8) -replace "`r`n", "`n"
$css = (Get-Content $cssPath -Raw -Encoding UTF8) -replace "`r`n", "`n"
$package = (Get-Content $packagePath -Raw -Encoding UTF8) -replace "`r`n", "`n"

# 1) Smart playlist sorting. Most Played uses a persistent play counter;
# Recently Added uses the real addedAt timestamp stored in IndexedDB.
$old = @'
  function setAllTracksView() {
'@
$new = @'
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

  function setAllTracksView() {
'@
$app = Replace-Once $app $old $new 'smart playlist sorter'

$old = @'
  function getViewTracks() {
    const term = ui.search.value.trim().toLocaleLowerCase();
    let result;
    if (activeView === 'history') {
      const seen = new Set();
      result = playbackHistory.map(item => getTrack(item.id)).filter(track => {
        if (!track || seen.has(track.id) || !isTrackInActiveFolder(track)) return false;
        seen.add(track.id); return true;
      });
    } else {
      result = getSourceTracks().filter(track => {
        if (activeView === 'favorites' && !track.favorite) return false;
        if (activeView === 'playlists') {
          if (activePlaylistId) { if (!track.playlists.includes(activePlaylistId)) return false; }
          else if (!track.playlists.length) return false;
        }
        return true;
      });
    }
    if (term) result = result.filter(track => `${track.title} ${track.artist} ${track.album || ''} ${track.genre || ''} ${track.fileName}`.toLocaleLowerCase().includes(term));
    if (activeView !== 'history') {
      if (sortMode === 'title') result = result.sort((a,b) => a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' }));
      else result = result.sort((a,b) => b.addedAt - a.addedAt);
    }
    return result;
  }
'@
$new = @'
  function getViewTracks() {
    const term = ui.search.value.trim().toLocaleLowerCase();
    let result;
    if (activeView === 'history') {
      const seen = new Set();
      result = playbackHistory.map(item => getTrack(item.id)).filter(track => {
        if (!track || seen.has(track.id) || !isTrackInActiveFolder(track)) return false;
        seen.add(track.id); return true;
      });
    } else if (activeView === 'smart-most-played' || activeView === 'smart-recent') {
      result = getSmartPlaylistTracks(activeView);
    } else {
      result = getSourceTracks().filter(track => {
        if (activeView === 'favorites' && !track.favorite) return false;
        if (activeView === 'playlists') {
          if (activePlaylistId) { if (!track.playlists.includes(activePlaylistId)) return false; }
          else if (!track.playlists.length) return false;
        }
        return true;
      });
    }
    if (term) result = result.filter(track => `${track.title} ${track.artist} ${track.album || ''} ${track.genre || ''} ${track.fileName}`.toLocaleLowerCase().includes(term));
    if (activeView !== 'history' && !activeView.startsWith('smart-')) {
      if (sortMode === 'title') result = result.sort((a,b) => a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' }));
      else result = result.sort((a,b) => b.addedAt - a.addedAt);
    }
    return result;
  }
'@
$app = Replace-Once $app $old $new 'smart playlist view filtering'

# 2) Count a play only when a track actually starts (this function is called after play()).
$old = @'
  function recordPlayedTrack(track) {
    if (!track) return;
    playbackHistory = [{ id: track.id, playedAt: Date.now() }, ...playbackHistory.filter(item => item.id !== track.id)].slice(0, 100);
    track.lastPlayedAt = Date.now();
    persistSettings();
    const historyCount = $('#historyCount'); if (historyCount) historyCount.textContent = String(playbackHistory.length);
    if (activeView === 'history') renderAll();
  }
'@
$new = @'
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
$app = Replace-Once $app $old $new 'persistent play counter'

# 3) Persist statistics in IndexedDB and normalize older library records.
$old = @'
      addedAt: track.addedAt, duration: Number.isFinite(track.duration) ? track.duration : 0,
      favorite: !!track.favorite, playlists: Array.isArray(track.playlists) ? track.playlists : [],
'@
$new = @'
      addedAt: track.addedAt, duration: Number.isFinite(track.duration) ? track.duration : 0,
      playCount: Number.isSafeInteger(track.playCount) ? Math.max(0, Math.min(1000000, track.playCount)) : 0,
      lastPlayedAt: Number.isFinite(track.lastPlayedAt) && track.lastPlayedAt >= 0 ? track.lastPlayedAt : null,
      favorite: !!track.favorite, playlists: Array.isArray(track.playlists) ? track.playlists : [],
'@
$app = Replace-Once $app $old $new 'persist smart playlist statistics'

$old = @'
    track.duration = Number(track.duration) || 0;
    track.album = typeof track.album === 'string' ? track.album : '';
'@
$new = @'
    track.duration = Number(track.duration) || 0;
    track.playCount = Number.isSafeInteger(track.playCount) && track.playCount > 0 ? Math.min(1000000, track.playCount) : 0;
    track.lastPlayedAt = Number.isFinite(track.lastPlayedAt) && track.lastPlayedAt >= 0 ? track.lastPlayedAt : 0;
    track.album = typeof track.album === 'string' ? track.album : '';
'@
$app = Replace-Once $app $old $new 'normalize old track statistics'

# 4) Show auto-generated playlists before user-created playlists.
$old = @'
  function renderPlaylists() {
    ui.playlistNav.innerHTML = '';
    if (!playlists.length) {
      const message = document.createElement('div'); message.className = 'no-playlists'; message.textContent = tr('noPlaylists'); ui.playlistNav.appendChild(message); return;
    }
    playlists.forEach(playlist => {
      const count = getSourceTracks().filter(track => track.playlists.includes(playlist.id)).length;
      const button = document.createElement('button');
      button.className = `playlist-link${activeView === 'playlists' && activePlaylistId === playlist.id ? ' active' : ''}`;
      button.innerHTML = `<span>${svgIcon('playlist')}</span><span>${escapeHTML(localizedPlaylistName(playlist.name))}</span><span class="playlist-length">${count}</span>`;
      button.addEventListener('click', () => {
        activeView = 'playlists'; activePlaylistId = playlist.id;
        $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'playlists'));
        renderAll();
      });
      ui.playlistNav.appendChild(button);
    });
  }
'@
$new = @'
  function renderPlaylists() {
    ui.playlistNav.innerHTML = '';
    const smartItems = [
      { view: 'smart-most-played', title: tr('smartMostPlayed'), icon: 'flame' },
      { view: 'smart-recent', title: tr('smartRecentlyAdded'), icon: 'clock' }
    ];
    smartItems.forEach(item => {
      const button = document.createElement('button');
      button.className = `playlist-link smart-playlist-link${activeView === item.view ? ' active' : ''}`;
      button.innerHTML = `<span>${svgIcon(item.icon)}</span><span>${escapeHTML(item.title)}</span><span class="playlist-length">${getSmartPlaylistTracks(item.view).length}</span>`;
      button.addEventListener('click', () => {
        activeView = item.view; activePlaylistId = null;
        $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'playlists'));
        renderAll();
      });
      ui.playlistNav.appendChild(button);
    });
    if (playlists.length) {
      const divider = document.createElement('div');
      divider.className = 'smart-playlist-divider';
      divider.setAttribute('aria-hidden', 'true');
      ui.playlistNav.appendChild(divider);
    } else {
      const message = document.createElement('div');
      message.className = 'no-playlists';
      message.textContent = tr('noPlaylists');
      ui.playlistNav.appendChild(message);
      return;
    }
    playlists.forEach(playlist => {
      const count = getSourceTracks().filter(track => track.playlists.includes(playlist.id)).length;
      const button = document.createElement('button');
      button.className = `playlist-link${activeView === 'playlists' && activePlaylistId === playlist.id ? ' active' : ''}`;
      button.innerHTML = `<span>${svgIcon('playlist')}</span><span>${escapeHTML(localizedPlaylistName(playlist.name))}</span><span class="playlist-length">${count}</span>`;
      button.addEventListener('click', () => {
        activeView = 'playlists'; activePlaylistId = playlist.id;
        $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'playlists'));
        renderAll();
      });
      ui.playlistNav.appendChild(button);
    });
  }
'@
$app = Replace-Once $app $old $new 'render smart playlist buttons'

$old = @'
  function currentPlaylistName() {
    if (activeView === 'favorites') return 'Избранное';
'@
$new = @'
  function currentPlaylistName() {
    if (activeView === 'smart-most-played') return tr('smartMostPlayed');
    if (activeView === 'smart-recent') return tr('smartRecentlyAdded');
    if (activeView === 'favorites') return 'Избранное';
'@
$app = Replace-Once $app $old $new 'smart playlist title'

# 5) Headings, count column and the no-history empty state.
$old = @'
    } else if (activeView === 'playlists') {
      ui.viewTitle.innerHTML = `${escapeHTML(playlistName)}<span class="title-period">.</span>`;
'@
$new = @'
    } else if (activeView === 'smart-most-played') {
      ui.viewTitle.innerHTML = `${tr('smartMostPlayed')}<span class="title-period">.</span>`;
      ui.viewSubtitle.textContent = tr('smartMostPlayedSubtitle');
      ui.listHeading.textContent = tr('smartMostPlayed');
      ui.listSubheading.textContent = tr('smartMostPlayedSubtitle');
    } else if (activeView === 'smart-recent') {
      ui.viewTitle.innerHTML = `${tr('smartRecentlyAdded')}<span class="title-period">.</span>`;
      ui.viewSubtitle.textContent = tr('smartRecentlyAddedSubtitle');
      ui.listHeading.textContent = tr('smartRecentlyAdded');
      ui.listSubheading.textContent = tr('smartRecentlyAddedSubtitle');
    } else if (activeView === 'playlists') {
      ui.viewTitle.innerHTML = `${escapeHTML(playlistName)}<span class="title-period">.</span>`;
'@
$app = Replace-Once $app $old $new 'smart playlist headings'

$old = @'
    ui.trackTotal.textContent = wordTracks(viewTracks.length);
'@
$new = @'
    if (ui.sortBtn) ui.sortBtn.hidden = activeView.startsWith('smart-');
    ui.trackTotal.textContent = wordTracks(viewTracks.length);
'@
$app = Replace-Once $app $old $new 'fixed smart playlist sorting'

$old = @'
    setText('.table-head .col-album', tr('added'));
'@
$new = @'
    setText('.table-head .col-album', activeView === 'smart-most-played' ? tr('playCountColumn') : tr('added'));
'@
$app = Replace-Once $app $old $new 'translate smart plays column'

$old = @'
      const emptySelectedFolder = !!activeLibraryFolderPath && !hasTracks;
      $('.empty-state h3').textContent = emptySelectedFolder ? translateInlineText('В выбранной папке пока нет музыки') : hasTracks ? tr('emptyNoResults') : tr('emptyTitle');
'@
$new = @'
      const emptySelectedFolder = !!activeLibraryFolderPath && !hasTracks;
      if (activeView === 'smart-most-played' && hasTracks && !ui.search.value.trim()) {
        $('.empty-state h3').textContent = tr('smartMostPlayedEmptyTitle');
        $('.empty-state p').textContent = tr('smartMostPlayedEmptyText');
        $('#emptyAddBtn').innerHTML = `${svgIcon('music')} ${tr('openMyMusic')}`;
        $('#emptyAddBtn').dataset.mode = 'library';
        return;
      }
      $('.empty-state h3').textContent = emptySelectedFolder ? translateInlineText('В выбранной папке пока нет музыки') : hasTracks ? tr('emptyNoResults') : tr('emptyTitle');
'@
$app = Replace-Once $app $old $new 'smart playlist empty state'

$old = @'
      row.style.animationDelay = `${Math.min(index, 12) * 18}ms`;
      row.innerHTML = `
'@
$new = @'
      row.style.animationDelay = `${Math.min(index, 12) * 18}ms`;
      const addedCell = activeView === 'smart-most-played' ? String(track.playCount || 0) : new Date(track.addedAt).toLocaleDateString(({ru:'ru-RU', en:'en-US', de:'de-DE'})[currentLocale], {day:'2-digit', month:'short'});
      row.innerHTML = `
'@
$app = Replace-Once $app $old $new 'smart playlist row value'

$old = @'
        <span class="row-added">${new Date(track.addedAt).toLocaleDateString(({ru:'ru-RU', en:'en-US', de:'de-DE'})[currentLocale], {day:'2-digit', month:'short'})}</span>
'@
$new = @'
        <span class="row-added">${addedCell}</span>
'@
$app = Replace-Once $app $old $new 'show play count in table'

$old = @'
  $('#emptyAddBtn').addEventListener('click', () => { const mode = $('#emptyAddBtn').dataset.mode; if (mode === 'clear') { ui.search.value = ''; renderAll(); } else if (mode === 'folder') chooseAudioFolder(); else chooseAudioFiles(true); });
'@
$new = @'
  $('#emptyAddBtn').addEventListener('click', () => { const mode = $('#emptyAddBtn').dataset.mode; if (mode === 'clear') { ui.search.value = ''; renderAll(); } else if (mode === 'folder') chooseAudioFolder(); else if (mode === 'library') { activeView = 'all'; activePlaylistId = null; $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'all')); renderAll(); } else chooseAudioFiles(true); });
'@
$app = Replace-Once $app $old $new 'smart playlist empty action'

# 6) Full RU / EN / DE copy.
$localePairs = @(
    @("yourPlaylists: 'ТВОИ ПЛЕЙЛИСТЫ',", "yourPlaylists: 'ТВОИ ПЛЕЙЛИСТЫ', smartMostPlayed: 'ЧАСТО ПРОСЛУШИВАЕМЫЕ', smartRecentlyAdded: 'НЕДАВНО ДОБАВЛЕННЫЕ', smartMostPlayedSubtitle: 'Топ-50 треков по числу запусков.', smartRecentlyAddedSubtitle: '50 последних треков по дате добавления.', smartMostPlayedEmptyTitle: 'Пока нет часто прослушиваемых треков', smartMostPlayedEmptyText: 'Включи несколько песен — список будет автоматически сортироваться по числу прослушиваний.', openMyMusic: 'Открыть мою музыку', playCountColumn: 'ПРОСЛУШИВАНИЙ',"),
    @("yourPlaylists: 'YOUR PLAYLISTS',", "yourPlaylists: 'YOUR PLAYLISTS', smartMostPlayed: 'MOST PLAYED', smartRecentlyAdded: 'RECENTLY ADDED', smartMostPlayedSubtitle: 'Your 50 most played tracks, ranked by play count.', smartRecentlyAddedSubtitle: 'The 50 newest tracks, sorted by their added date.', smartMostPlayedEmptyTitle: 'No frequently played tracks yet', smartMostPlayedEmptyText: 'Play a few tracks and this list will automatically rank them by play count.', openMyMusic: 'Open my music', playCountColumn: 'PLAYS',"),
    @("yourPlaylists: 'DEINE PLAYLISTS',", "yourPlaylists: 'DEINE PLAYLISTS', smartMostPlayed: 'MEISTGEHÖRT', smartRecentlyAdded: 'KÜRZLICH HINZUGEFÜGT', smartMostPlayedSubtitle: 'Deine 50 meistgespielten Titel, sortiert nach Wiedergaben.', smartRecentlyAddedSubtitle: 'Die 50 zuletzt hinzugefügten Titel, nach Hinzufügedatum sortiert.', smartMostPlayedEmptyTitle: 'Noch keine häufig gespielten Titel', smartMostPlayedEmptyText: 'Spiele ein paar Titel ab. Diese Liste wird automatisch nach Wiedergaben sortiert.', openMyMusic: 'Meine Musik öffnen', playCountColumn: 'WIEDERGABEN',")
)
foreach ($pair in $localePairs) {
    $app = Replace-Once $app $pair[0] $pair[1] 'RU / EN / DE translation key'
}

# 7) Add play statistics to portable JSON backups and validate them on restore.
$old = @'
fileName: track.fileName, addedAt: track.addedAt, duration: track.duration, favorite: !!track.favorite,
'@
$new = @'
fileName: track.fileName, addedAt: track.addedAt, duration: track.duration, playCount: Number.isSafeInteger(track.playCount) ? track.playCount : 0, lastPlayedAt: Number.isFinite(track.lastPlayedAt) ? track.lastPlayedAt : null, favorite: !!track.favorite,
'@
$app = Replace-Once $app $old $new 'backup export play statistics'

$old = @'
     for (const field of ['addedAt', 'duration']) {
'@
$new = @'
     for (const field of ['addedAt', 'duration', 'lastPlayedAt']) {
'@
$app = Replace-Once $app $old $new 'backup timestamp validation'

$old = @'
       for (const field of ['favorite', 'sourceUnavailable', 'hasEmbeddedAudio']) {
'@
$new = @'
       if (track.playCount !== undefined && (!Number.isSafeInteger(track.playCount) || track.playCount < 0 || track.playCount > 1000000)) {
         return invalid('Некорректное число воспроизведений трека.');
       }

       for (const field of ['favorite', 'sourceUnavailable', 'hasEmbeddedAudio']) {
'@
$app = Replace-Once $app $old $new 'backup play count validation'

$old = @'
target.fileName = String(raw.fileName || raw.title).slice(0, 260); target.addedAt = Number(raw.addedAt) || target.addedAt || Date.now(); target.duration = Number(raw.duration) || target.duration || 0;
            target.favorite =
'@
$new = @'
target.fileName = String(raw.fileName || raw.title).slice(0, 260); target.addedAt = Number(raw.addedAt) || target.addedAt || Date.now(); target.duration = Number(raw.duration) || target.duration || 0;
            target.playCount = Math.max(Number.isSafeInteger(target.playCount) ? target.playCount : 0, Number.isSafeInteger(raw.playCount) ? Math.min(1000000, raw.playCount) : 0);
            target.lastPlayedAt = Math.max(Number.isFinite(target.lastPlayedAt) ? target.lastPlayedAt : 0, Number.isFinite(raw.lastPlayedAt) ? raw.lastPlayedAt : 0);
            target.favorite =
'@
$app = Replace-Once $app $old $new 'restore play statistics'

# CSS overrides are appended so they take precedence without disturbing theme styles.
$css += @'

/* Smart playlists and fixed source-pill controls. */
.folder-source-status{display:grid;grid-template-columns:5px minmax(0,1fr) 22px;align-items:center;column-gap:8px;margin:-18px 4px 20px 8px;padding:8px 7px;border:1px solid rgba(var(--accent-rgb),.18);border-radius:7px;background:rgba(var(--accent-rgb),.045);min-width:0;max-width:100%;box-sizing:border-box}
.folder-source-copy{grid-column:2;min-width:0}
#clearFolderSourceBtn{grid-column:3;justify-self:end;align-self:center;display:grid;place-items:center;flex:none;width:22px;height:22px;min-width:22px;min-height:22px;margin:0;padding:0;box-sizing:border-box;border:1px solid rgba(var(--accent-rgb),.25);border-radius:5px;background:rgba(var(--accent-rgb),.05);color:#b5a0a7;font-family:Arial,sans-serif;font-size:15px;font-weight:400;line-height:1;text-align:center}
.library-source-entry{display:grid;grid-template-columns:minmax(0,1fr) 24px;align-items:center;gap:8px}
.library-source-entry>span{min-width:0;overflow-wrap:anywhere}
.library-source-entry>button{display:grid;place-items:center;justify-self:end;align-self:center;flex:none;width:24px;height:24px;min-width:24px;margin:0;padding:0;box-sizing:border-box;line-height:1;text-align:center}
.smart-playlist-divider{height:1px;flex:none;margin:6px 8px;background:rgba(var(--accent-rgb),.16)}
.playlist-link.smart-playlist-link{background:rgba(var(--accent-rgb),.025);border-color:rgba(var(--accent-rgb),.08)}
.playlist-link.smart-playlist-link>span:first-child{color:var(--red)}
.playlist-link.smart-playlist-link.active>span:first-child{color:var(--red-bright)}
'@

# Register a focused regression test for smart sorting and locale coverage.
$test = @'
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

const start = app.indexOf('  function sortSmartPlaylistTracks(');
const end = app.indexOf('  function getSmartPlaylistTracks(', start);
assert.ok(start >= 0 && end > start, 'smart playlist sorter must exist');
const source = app.slice(start, end).trim();
const sandbox = {};
vm.runInNewContext(source + '\nthis.sortSmartPlaylistTracks = sortSmartPlaylistTracks;', sandbox);
const sortSmartPlaylistTracks = sandbox.sortSmartPlaylistTracks;

const sample = [
  { id: 'new-low', playCount: 1, lastPlayedAt: 100, addedAt: 900 },
  { id: 'old-high', playCount: 8, lastPlayedAt: 400, addedAt: 100 },
  { id: 'tie-newer-play', playCount: 8, lastPlayedAt: 800, addedAt: 200 },
  { id: 'never', playCount: 0, lastPlayedAt: 0, addedAt: 1000 },
  { id: 'recent', playCount: 2, lastPlayedAt: 300, addedAt: 1200 }
];

assert.deepEqual(
  Array.from(sortSmartPlaylistTracks(sample, 'smart-most-played'), track => track.id),
  ['tie-newer-play', 'old-high', 'recent', 'new-low'],
  'Most Played must rank by playCount, then lastPlayedAt, and omit never-played tracks'
);
assert.deepEqual(
  Array.from(sortSmartPlaylistTracks(sample, 'smart-recent'), track => track.id),
  ['recent', 'never', 'new-low', 'tie-newer-play', 'old-high'],
  'Recently Added must sort by the saved addedAt timestamp, newest first'
);
assert.deepEqual(
  Array.from(sortSmartPlaylistTracks(sample, 'smart-recent', 2), track => track.id),
  ['recent', 'never'],
  'Smart lists must respect their visible track limit'
);
assert.deepEqual(
  sample.map(track => track.id),
  ['new-low', 'old-high', 'tie-newer-play', 'never', 'recent'],
  'Sorting must not mutate the source library order'
);

assert.ok(app.includes('track.playCount = Math.min(1000000'), 'play starts must increment playCount');
assert.ok(app.includes('playCount: Number.isSafeInteger(track.playCount)'), 'playCount must persist in IndexedDB');
assert.ok(app.includes('playCount: Number.isSafeInteger(track.playCount) ? track.playCount : 0'), 'playCount must be exported in backups');
assert.ok(app.includes('track.playCount !== undefined && (!Number.isSafeInteger(track.playCount)'), 'backup restore must validate playCount');
assert.ok(app.includes("activeView === 'smart-most-played' || activeView === 'smart-recent'"), 'smart playlists must be wired into the main view');
assert.equal((app.match(/smartMostPlayed:/g) || []).length, 3, 'RU/EN/DE titles must be available');
assert.ok(css.includes('grid-template-columns:5px minmax(0,1fr) 22px'), 'active folder remove button must have a fixed grid column');
assert.ok(css.includes('.smart-playlist-divider'), 'smart playlist group divider must be styled');

console.log('PASS: FoxsMusic smart playlists, play-count persistence, backup stats, localization and source-pill layout');
'@

$testPath = Join-Path $root 'tests\smart-playlists.test.cjs'
if (-not (Test-Path (Join-Path $root 'tests'))) {
    New-Item -ItemType Directory -Path (Join-Path $root 'tests') | Out-Null
}

$old = @'
"test": "npm run test:shuffle-stop && npm run test:repeat && npm run test:hotkeys && npm run test:now-playing && npm run test:localization && npm run test:fullscreen && npm run test:storage && npm run test:backup-validation",
'@
$new = @'
"test": "npm run test:shuffle-stop && npm run test:repeat && npm run test:hotkeys && npm run test:now-playing && npm run test:localization && npm run test:fullscreen && npm run test:storage && npm run test:backup-validation && npm run test:smart-playlists",
    "test:smart-playlists": "node tests/smart-playlists.test.cjs",
'@
$package = Replace-Once $package $old $new 'register smart playlist tests'
# Ensure edited package is valid JSON before touching the working files.
$null = $package | ConvertFrom-Json

# All anchors were checked first. Only now create backups and write the changes.
$backupDir = Join-Path $root ("backup-smart-playlists-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupDir | Out-Null
Copy-Item $appPath (Join-Path $backupDir 'app.js')
Copy-Item $cssPath (Join-Path $backupDir 'styles.css')
Copy-Item $packagePath (Join-Path $backupDir 'package.json')

$utf8 = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($appPath, $app, $utf8)
[System.IO.File]::WriteAllText($cssPath, $css, $utf8)
[System.IO.File]::WriteAllText($packagePath, $package, $utf8)
[System.IO.File]::WriteAllText($testPath, $test, $utf8)

Write-Host ''
Write-Host 'FoxsMusic smart playlists + source button layout applied.' -ForegroundColor Green
Write-Host "Backup of original files: $backupDir"
Write-Host 'Next: npm test'
Write-Host 'Then run build-windows.bat to create the Windows build.'
