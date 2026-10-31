'use strict';

const {
  app, BrowserWindow, Menu, shell, dialog, ipcMain, protocol
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { autoUpdater } = require('electron-updater');

const APP_ID = 'com.artyomreddarkfox.foxsmusic';
const APP_SCHEME = 'foxsmusic';

const DIALOG_COPY = {
  ru: {
    addAudio: 'Добавить музыку в FoxsMusic', chooseOriginalAudio: 'Выбрать оригинальный аудиофайл',
    audioFiles: 'Аудиофайлы', allFiles: 'Все файлы', chooseLibraryFolder: 'Выбрать папку музыкальной библиотеки',
    addSourceFolders: 'Добавить папки-источники для умной библиотеки', saveBackup: 'Сохранить резервную копию FoxsMusic',
    backupFile: 'Резервная копия FoxsMusic', chooseBackup: 'Выбрать резервную копию FoxsMusic'
  },
  en: {
    addAudio: 'Add music to FoxsMusic', chooseOriginalAudio: 'Choose original audio file',
    audioFiles: 'Audio files', allFiles: 'All files', chooseLibraryFolder: 'Choose music library folder',
    addSourceFolders: 'Add smart library source folders', saveBackup: 'Save FoxsMusic backup',
    backupFile: 'FoxsMusic backup', chooseBackup: 'Choose FoxsMusic backup'
  },
  de: {
    addAudio: 'Musik zu FoxsMusic hinzufügen', chooseOriginalAudio: 'Originalaudiodatei auswählen',
    audioFiles: 'Audiodateien', allFiles: 'Alle Dateien', chooseLibraryFolder: 'Musikbibliotheksordner auswählen',
    addSourceFolders: 'Quellordner zur intelligenten Bibliothek hinzufügen', saveBackup: 'FoxsMusic-Sicherung speichern',
    backupFile: 'FoxsMusic-Sicherung', chooseBackup: 'FoxsMusic-Sicherung auswählen'
  }
};
function dialogCopy(locale) {
  return DIALOG_COPY[locale === 'en' || locale === 'de' ? locale : 'ru'];
}
const MAX_FOLDER_FILES = 10000;
const AUDIO_EXTENSIONS = new Set([
  'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'opus', 'wma', 'aiff', 'alac', 'webm', 'oga', 'mp4'
]);
const audioTokens = new Map();
const artworkCache = new Map();
const MAX_ARTWORK_BYTES = 15 * 1024 * 1024;
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
let musicMetadataModulePromise = null;
let mainWindow;

// A secure, streaming custom scheme serves original audio files with CORS headers so Web Audio
// can analyse them. The main UI still loads with file:// to preserve its existing IndexedDB library.
protocol.registerSchemesAsPrivileged([{
  scheme: APP_SCHEME,
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true,
    stream: true
  }
}]);

if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

function isAudioPath(filePath) {
  return AUDIO_EXTENSIONS.has(path.extname(filePath).slice(1).toLowerCase());
}
function isSafeAbsolutePath(filePath) {
  return typeof filePath === 'string' && path.isAbsolute(filePath) && !filePath.includes('\0');
}
function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.cjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac', '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg', '.opus': 'audio/ogg; codecs=opus', '.m4a': 'audio/mp4',
    '.mp4': 'audio/mp4', '.aac': 'audio/aac', '.wma': 'audio/x-ms-wma',
    '.aiff': 'audio/aiff', '.alac': 'audio/mp4', '.webm': 'audio/webm'
  };
  return types[ext] || 'application/octet-stream';
}

function fileResponse(filePath, request) {
  let stat;
  try {
    stat = fs.statSync(filePath);
    if (!stat.isFile()) return new Response('Not found', { status: 404 });
  } catch (_) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers({
    'Content-Type': contentType(filePath),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Range, Content-Length'
  });
  let start = 0;
  let end = Math.max(0, stat.size - 1);
  let status = 200;
  const range = request.headers.get('range');

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match || (!match[1] && !match[2]) || stat.size === 0) {
      headers.set('Content-Range', `bytes */${stat.size}`);
      return new Response(null, { status: 416, headers });
    }
    if (!match[1]) {
      const suffixLength = Number(match[2]);
      if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
        headers.set('Content-Range', `bytes */${stat.size}`);
        return new Response(null, { status: 416, headers });
      }
      start = Math.max(0, stat.size - suffixLength);
    } else {
      start = Number(match[1]);
      if (match[2]) end = Math.min(Number(match[2]), stat.size - 1);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stat.size) {
      headers.set('Content-Range', `bytes */${stat.size}`);
      return new Response(null, { status: 416, headers });
    }
    status = 206;
    headers.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
  }

  const length = stat.size === 0 ? 0 : end - start + 1;
  headers.set('Content-Length', String(length));
  if (request.method === 'HEAD' || length === 0) return new Response(null, { status, headers });

  const stream = fs.createReadStream(filePath, { start, end });
  stream.on('error', () => {});
  return new Response(Readable.toWeb(stream), { status, headers });
}

function assertTrustedSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error('Недоверенный источник запроса');
  }
}

async function registerAudioPath(filePath) {
  if (!isSafeAbsolutePath(filePath) || !isAudioPath(filePath)) {
    throw new Error('Это не поддерживаемый аудиофайл');
  }
  const stat = await fsp.stat(filePath);
  if (!stat.isFile()) throw new Error('Файл не найден');
  const token = crypto.randomUUID();
  audioTokens.set(token, filePath);
  return `foxsmusic://media/audio/${token}`;
}

async function createFileRecord(filePath) {
  try {
    if (!isSafeAbsolutePath(filePath) || !isAudioPath(filePath)) return null;
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return null;
    const url = await registerAudioPath(filePath);
    return {
      path: filePath,
      url,
      name: path.basename(filePath),
      size: stat.size,
      lastModified: stat.mtimeMs
    };
  } catch (_) {
    return null;
  }
}

function imageMimeType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}

function bufferToImageDataUrl(buffer, mimeType) {
  if (!buffer || !buffer.length || buffer.length > MAX_ARTWORK_BYTES) return null;
  const safeMime = /^image\/(jpeg|png|webp|gif)$/i.test(mimeType || '') ? mimeType : 'image/jpeg';
  return `data:${safeMime};base64,${Buffer.from(buffer).toString('base64')}`;
}

async function readArtworkFile(filePath) {
  try {
    if (!IMAGE_EXTENSIONS.includes(path.extname(filePath).toLowerCase())) return null;
    const stat = await fsp.stat(filePath);
    if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_ARTWORK_BYTES) return null;
    const bytes = await fsp.readFile(filePath);
    return bufferToImageDataUrl(bytes, imageMimeType(filePath));
  } catch (_) {
    return null;
  }
}

async function findSidecarArtwork(audioPath) {
  const directory = path.dirname(audioPath);
  let entries;
  try { entries = await fsp.readdir(directory, { withFileTypes: true }); }
  catch (_) { return null; }

  // Match file names without case sensitivity, including a common "song.mp3.jpg" pattern.
  const files = new Map(entries.filter(entry => entry.isFile()).map(entry => [entry.name.toLocaleLowerCase(), entry.name]));
  const ext = path.extname(audioPath);
  const base = path.basename(audioPath, ext);
  const namedCandidates = [];
  for (const imageExt of IMAGE_EXTENSIONS) {
    namedCandidates.push(`${base}${imageExt}`);
    namedCandidates.push(`${path.basename(audioPath)}${imageExt}`);
  }
  const genericStems = ['cover', 'folder', 'album', 'front', 'artwork', 'albumart', 'albumartsmall', 'album_art', 'cover art'];
  for (const stem of genericStems) {
    for (const imageExt of IMAGE_EXTENSIONS) namedCandidates.push(`${stem}${imageExt}`);
  }
  for (const candidate of namedCandidates) {
    const actualName = files.get(candidate.toLocaleLowerCase());
    if (!actualName) continue;
    const dataUrl = await readArtworkFile(path.join(directory, actualName));
    if (dataUrl) return dataUrl;
  }
  return null;
}

async function getOriginalTrackArtwork(filePath) {
  if (!isSafeAbsolutePath(filePath) || !isAudioPath(filePath)) return null;
  let stat;
  try {
    stat = await fsp.stat(filePath);
    if (!stat.isFile()) return null;
  } catch (_) { return null; }

  const cacheKey = `${path.resolve(filePath)}|${stat.size}|${stat.mtimeMs}`;
  if (artworkCache.has(cacheKey)) return artworkCache.get(cacheKey);
  const task = (async () => {
    // Prefer the artwork embedded into the audio's tags (ID3/FLAC/Vorbis/MP4).
    try {
      musicMetadataModulePromise ||= import('music-metadata');
      const musicMetadata = await musicMetadataModulePromise;
      const metadata = await musicMetadata.parseFile(filePath, {
        skipCovers: false,
        maxMemoryAllocation: MAX_ARTWORK_BYTES
      });
      const picture = musicMetadata.selectCover
        ? musicMetadata.selectCover(metadata.common?.picture)
        : metadata.common?.picture?.[0];
      if (picture?.data?.length && picture.data.length <= MAX_ARTWORK_BYTES) {
        const dataUrl = bufferToImageDataUrl(picture.data, picture.format);
        if (dataUrl) return dataUrl;
      }
    } catch (error) {
      // A malformed or unsupported tag should not prevent sidecar-cover lookup.
      const reason = String(error?.message || error || 'unknown metadata error').split(/\r?\n/, 1)[0].slice(0, 180);
      console.warn(`FoxsMusic: embedded artwork skipped for ${path.basename(filePath)} (${reason}); checking sidecar covers.`);
    }

    // If the audio has no embedded artwork, look for a matching image or common album cover
    // in the same folder, e.g. Song.jpg, cover.jpg, folder.png.
    return await findSidecarArtwork(filePath);
  })();
  artworkCache.set(cacheKey, task);
  const result = await task;
  // Cache misses too, but keep the cache bounded for very large libraries.
  if (artworkCache.size > 2000) {
    const firstKey = artworkCache.keys().next().value;
    if (firstKey !== cacheKey) artworkCache.delete(firstKey);
  }
  return result;
}

async function scanAudioFolder(rootDirectory) {
  const results = [];
  const pending = [rootDirectory];
  while (pending.length && results.length < MAX_FOLDER_FILES) {
    const directory = pending.pop();
    let entries;
    try { entries = await fsp.readdir(directory, { withFileTypes: true }); }
    catch (_) { continue; }
    for (const entry of entries) {
      if (results.length >= MAX_FOLDER_FILES) break;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        // Skip common hidden/system folders so an import cannot recurse into caches.
        if (!entry.name.startsWith('.') && entry.name !== 'System Volume Information' && entry.name !== '$RECYCLE.BIN') pending.push(fullPath);
      } else if (entry.isFile() && isAudioPath(fullPath)) {
        const record = await createFileRecord(fullPath);
        if (record) results.push(record);
      }
    }
  }
  return results.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }));
}

ipcMain.handle('foxsmusic:select-audio-files', async (event, allowMultiple = true, locale = 'ru') => {
  assertTrustedSender(event);
  const copy = dialogCopy(locale);
  const result = await dialog.showOpenDialog(mainWindow, {
    title: allowMultiple ? copy.addAudio : copy.chooseOriginalAudio,
    properties: allowMultiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: [{ name: copy.audioFiles, extensions: [...AUDIO_EXTENSIONS] }, { name: copy.allFiles, extensions: ['*'] }]
  });
  if (result.canceled) return [];
  const records = [];
  for (const filePath of result.filePaths) {
    const record = await createFileRecord(filePath);
    if (record) records.push(record);
  }
  return records;
});

ipcMain.handle('foxsmusic:select-audio-folder', async (event, locale = 'ru') => {
  assertTrustedSender(event);
  const copy = dialogCopy(locale);
  const result = await dialog.showOpenDialog(mainWindow, {
    title: copy.chooseLibraryFolder,
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true, folderPath: null, records: [] };
  const folderPath = path.resolve(result.filePaths[0]);
  const records = await scanAudioFolder(folderPath);
  if (records.length >= MAX_FOLDER_FILES) {
    // Keep the cap explicit instead of letting a folder with enormous media collections freeze the app.
    console.warn(`FoxsMusic folder import capped at ${MAX_FOLDER_FILES} audio files.`);
  }
  return { canceled: false, folderPath, records };
});

ipcMain.handle('foxsmusic:select-source-folders', async (event, locale = 'ru') => {
  assertTrustedSender(event);
  const copy = dialogCopy(locale);
  const result = await dialog.showOpenDialog(mainWindow, {
    title: copy.addSourceFolders,
    properties: ['openDirectory', 'multiSelections']
  });
  if (result.canceled) return { canceled: true, folderPaths: [] };
  const folderPaths = [];
  for (const candidate of result.filePaths.slice(0, 100)) {
    try {
      const realPath = await fsp.realpath(path.resolve(candidate));
      const stat = await fsp.stat(realPath);
      if (stat.isDirectory() && !folderPaths.some(existing => normalizedPathKey(existing) === normalizedPathKey(realPath))) folderPaths.push(realPath);
    } catch (_) { /* Skip folders that disappeared during selection. */ }
  }
  return { canceled: false, folderPaths };
});

ipcMain.handle('foxsmusic:scan-audio-folder-path', async (event, rootDirectory) => {
  assertTrustedSender(event);
  if (!isSafeAbsolutePath(rootDirectory)) throw new Error('Недопустимый путь к папке музыкальной библиотеки');
  const folderPath = path.resolve(rootDirectory);
  const stat = await fsp.stat(folderPath);
  if (!stat.isDirectory()) throw new Error('Выбранный источник не является папкой');
  const records = await scanAudioFolder(folderPath);
  if (records.length >= MAX_FOLDER_FILES) {
    console.warn(`FoxsMusic folder scan capped at ${MAX_FOLDER_FILES} audio files.`);
  }
  return { folderPath, records };
});

async function hashAudioFileSha256(filePath) {
  const hash = crypto.createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.once('error', reject);
    stream.once('end', resolve);
  });
  return hash.digest('hex');
}

function normalizedAuditPath(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
}

ipcMain.handle('foxsmusic:analyze-library-files', async (event, items) => {
  assertTrustedSender(event);
  if (!Array.isArray(items)) throw new Error('Некорректный список библиотеки');
  const safeItems = items.slice(0, MAX_FOLDER_FILES).map(item => ({
    id: typeof item?.id === 'string' ? item.id.slice(0, 160) : '',
    hadPath: typeof item?.path === 'string' && item.path.length > 0,
    filePath: isSafeAbsolutePath(item?.path) && isAudioPath(item.path) ? path.resolve(item.path) : null,
    blobSize: Number.isSafeInteger(item?.blobSize) && item.blobSize > 0 ? item.blobSize : 0
  }));
  const results = safeItems.map(item => ({ id: item.id, exists: !item.hadPath, size: 0, mtimeMs: 0, hash: null }));

  // Stat a bounded number of files concurrently; don't hash the whole collection by default.
  let cursor = 0;
  const statWorker = async () => {
    while (cursor < safeItems.length) {
      const index = cursor++;
      const item = safeItems[index];
      if (!item.filePath) {
        results[index].exists = !item.hadPath; // a pathless old blob is checked in the renderer; an invalid path is unavailable
        results[index].blobSize = item.blobSize;
        continue;
      }
      try {
        const stat = await fsp.stat(item.filePath);
        if (!stat.isFile()) { results[index].exists = false; continue; }
        results[index].exists = true;
        results[index].size = stat.size;
        results[index].mtimeMs = stat.mtimeMs;
      } catch (_) {
        results[index].exists = false;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(10, Math.max(1, safeItems.length)) }, () => statWorker()));

  const sizeCounts = new Map();
  results.forEach((result, index) => {
    if (safeItems[index].filePath && result.exists && result.size > 0) {
      sizeCounts.set(result.size, (sizeCounts.get(result.size) || 0) + 1);
    } else if (!safeItems[index].hadPath && safeItems[index].blobSize > 0) {
      sizeCounts.set(safeItems[index].blobSize, (sizeCounts.get(safeItems[index].blobSize) || 0) + 1);
    }
  });
  const candidateSizes = [...sizeCounts.entries()].filter(([, count]) => count > 1).map(([size]) => size);
  const candidateSizeSet = new Set(candidateSizes);
  const uniqueCandidatePaths = new Map();
  safeItems.forEach((item, index) => {
    const result = results[index];
    if (!item.filePath || !result.exists || !candidateSizeSet.has(result.size)) return;
    const key = normalizedAuditPath(item.filePath);
    if (!uniqueCandidatePaths.has(key)) uniqueCandidatePaths.set(key, { filePath: item.filePath, size: result.size, mtimeMs: result.mtimeMs });
  });

  // Hash only files whose size is shared by at least one other library entry. This keeps
  // the normal startup path fast and makes duplicate detection exact instead of title-based.
  const candidates = [...uniqueCandidatePaths.entries()];
  const hashesByPath = new Map();
  cursor = 0;
  const hashWorker = async () => {
    while (cursor < candidates.length) {
      const [key, item] = candidates[cursor++];
      try {
        const before = await fsp.stat(item.filePath);
        if (!before.isFile() || before.size !== item.size || before.mtimeMs !== item.mtimeMs) continue;
        const hash = await hashAudioFileSha256(item.filePath);
        const after = await fsp.stat(item.filePath);
        if (after.size === before.size && after.mtimeMs === before.mtimeMs) hashesByPath.set(key, hash);
      } catch (error) {
        console.debug('FoxsMusic: could not fingerprint file during library audit', path.basename(item.filePath), error?.message || error);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, Math.max(1, candidates.length)) }, () => hashWorker()));
  safeItems.forEach((item, index) => {
    if (item.filePath) results[index].hash = hashesByPath.get(normalizedAuditPath(item.filePath)) || null;
  });

  return { results, candidateSizes };
});

// Scan one or more explicitly configured source folders for byte-identical audio files.
// Only audio files inside these roots are candidates; scanning is user-triggered and bounded.
function pathIsInside(rootPath, filePath) {
  const relative = path.relative(rootPath, filePath);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}
function normalizedPathKey(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
}
function pathIsInsideAny(rootPaths, filePath) {
  return rootPaths.some(rootPath => pathIsInside(rootPath, filePath));
}
async function collectSourceAudioPaths(rootPath, remainingLimit) {
  const paths = [];
  const pending = [rootPath];
  let capped = false;
  while (pending.length && paths.length < remainingLimit) {
    const directory = pending.pop();
    let entries;
    try { entries = await fsp.readdir(directory, { withFileTypes: true }); }
    catch (_) { continue; }
    entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    for (const entry of entries) {
      if (paths.length >= remainingLimit) { capped = true; break; }
      const fullPath = path.join(directory, entry.name);
      // Ignore symlinks and common hidden/system directories to keep the scan bounded and safe.
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'System Volume Information' && entry.name !== '$RECYCLE.BIN' && entry.name !== 'node_modules') pending.push(fullPath);
      } else if (entry.isFile() && isAudioPath(fullPath)) {
        paths.push(fullPath);
      }
    }
  }
  if (pending.length) capped = true;
  return { paths, capped };
}
async function resolveSourceRoots(rootDirectories) {
  if (!Array.isArray(rootDirectories) || rootDirectories.length === 0 || rootDirectories.length > 100) {
    throw new Error('Нужно указать от одной до 100 папок-источников');
  }
  const roots = [];
  const unavailableRoots = [];
  for (const candidate of rootDirectories) {
    if (!isSafeAbsolutePath(candidate)) throw new Error('Недопустимый путь к папке-источнику');
    try {
      const realPath = await fsp.realpath(path.resolve(candidate));
      const stat = await fsp.stat(realPath);
      if (!stat.isDirectory()) { unavailableRoots.push(candidate); continue; }
      if (!roots.some(item => normalizedPathKey(item) === normalizedPathKey(realPath))) roots.push(realPath);
    } catch (_) {
      unavailableRoots.push(candidate);
    }
  }
  // Remove nested source roots when a parent source already covers them.
  roots.sort((a, b) => a.length - b.length || a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const minimalRoots = [];
  for (const candidate of roots) {
    if (!minimalRoots.some(parent => pathIsInside(parent, candidate))) minimalRoots.push(candidate);
  }
  return { rootPaths: minimalRoots, unavailableRoots };
}
async function analyzeSourceFoldersDuplicates(rootDirectories, preferredRootDirectory = null) {
  const resolved = await resolveSourceRoots(rootDirectories);
  const rootPaths = resolved.rootPaths;
  if (!rootPaths.length) {
    return { rootPaths: [], unavailableRoots: resolved.unavailableRoots, groups: [], duplicateCount: 0, filesChecked: 0, capped: false };
  }
  let capped = false;
  const unique = new Map();
  for (const rootPath of rootPaths) {
    const remaining = MAX_FOLDER_FILES - unique.size;
    if (remaining <= 0) { capped = true; break; }
    const scanned = await collectSourceAudioPaths(rootPath, remaining);
    capped ||= scanned.capped;
    for (const candidatePath of scanned.paths) {
      if (unique.size >= MAX_FOLDER_FILES) { capped = true; break; }
      try {
        const realPath = await fsp.realpath(candidatePath);
        if (!pathIsInsideAny(rootPaths, realPath) || !isAudioPath(realPath)) continue;
        const key = normalizedPathKey(realPath);
        if (unique.has(key)) continue;
        const stat = await fsp.stat(realPath);
        if (!stat.isFile() || stat.size <= 0) continue;
        unique.set(key, { path: realPath, name: path.basename(realPath), size: stat.size, mtimeMs: stat.mtimeMs });
      } catch (_) { /* Skip files unavailable during the scan. */ }
    }
  }
  const bySize = new Map();
  for (const item of unique.values()) {
    const list = bySize.get(item.size) || [];
    list.push(item); bySize.set(item.size, list);
  }
  // Hash only files whose size occurs more than once.
  const candidates = [...bySize.values()].filter(list => list.length > 1).flat();
  const hashCache = new Map();
  let cursor = 0;
  const worker = async () => {
    while (cursor < candidates.length) {
      const item = candidates[cursor++];
      try {
        const before = await fsp.stat(item.path);
        if (!before.isFile() || before.size !== item.size || before.mtimeMs !== item.mtimeMs) continue;
        const hash = await hashAudioFileSha256(item.path);
        const after = await fsp.stat(item.path);
        if (after.isFile() && after.size === before.size && after.mtimeMs === before.mtimeMs) hashCache.set(normalizedPathKey(item.path), hash);
      } catch (_) { /* A file that changes while hashing is ignored for safety. */ }
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, Math.max(1, candidates.length)) }, () => worker()));
  let preferredRootPath = null;
  if (isSafeAbsolutePath(preferredRootDirectory)) {
    try {
      const resolvedPreferred = await fsp.realpath(path.resolve(preferredRootDirectory));
      if (rootPaths.some(rootPath => pathIsInside(rootPath, resolvedPreferred) || pathIsInside(resolvedPreferred, rootPath))) preferredRootPath = resolvedPreferred;
    } catch (_) {}
  }
  const groups = new Map();
  for (const item of candidates) {
    const hash = hashCache.get(normalizedPathKey(item.path));
    if (!hash) continue;
    const group = groups.get(hash) || [];
    if (!group.some(entry => normalizedPathKey(entry.path) === normalizedPathKey(item.path))) group.push({ ...item, hash });
    groups.set(hash, group);
  }
  const duplicateGroups = [...groups.entries()].filter(([, files]) => files.length > 1).map(([hash, files]) => {
    files.sort((a, b) => {
      const aPreferred = preferredRootPath && pathIsInside(preferredRootPath, a.path) ? 1 : 0;
      const bPreferred = preferredRootPath && pathIsInside(preferredRootPath, b.path) ? 1 : 0;
      return bPreferred - aPreferred || a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' });
    });
    return { hash, size: files[0].size, keepPath: files[0].path, files, duplicatePaths: files.slice(1).map(file => file.path) };
  }).sort((a, b) => a.keepPath.localeCompare(b.keepPath, undefined, { numeric: true, sensitivity: 'base' }));
  return {
    rootPaths,
    unavailableRoots: resolved.unavailableRoots,
    groups: duplicateGroups,
    duplicateCount: duplicateGroups.reduce((sum, group) => sum + group.duplicatePaths.length, 0),
    filesChecked: unique.size,
    capped
  };
}
async function analyzeSourceFolderDuplicates(rootDirectory) {
  return analyzeSourceFoldersDuplicates([rootDirectory]);
}

ipcMain.handle('foxsmusic:analyze-source-folder-duplicates', async (event, rootDirectory) => {
  assertTrustedSender(event);
  return analyzeSourceFolderDuplicates(rootDirectory);
});
ipcMain.handle('foxsmusic:analyze-source-folders-duplicates', async (event, request) => {
  assertTrustedSender(event);
  if (!request || !Array.isArray(request.rootPaths)) throw new Error('Некорректный список папок-источников');
  return analyzeSourceFoldersDuplicates(request.rootPaths, request.preferredRootPath || null);
});

// Only confirmed byte-identical duplicates inside one of the configured source roots
// are moved to the OS Recycle Bin/Trash. The handler rescans and rehashes before acting.
ipcMain.handle('foxsmusic:trash-source-duplicates', async (event, request) => {
  assertTrustedSender(event);
  const requestedRoots = Array.isArray(request?.rootPaths) ? request.rootPaths : (isSafeAbsolutePath(request?.folderPath) ? [request.folderPath] : []);
  if (!request || requestedRoots.length === 0 || !Array.isArray(request.groups)) {
    throw new Error('Некорректный запрос удаления дубликатов');
  }
  const fresh = await analyzeSourceFoldersDuplicates(requestedRoots, request.preferredRootPath || null);
  const rootPaths = fresh.rootPaths;
  if (!rootPaths.length) throw new Error('Ни одна папка-источник сейчас недоступна');
  const trashedPaths = [];
  const failed = [];
  const chosenGroups = request.groups.slice(0, 1000);
  for (const selected of chosenGroups) {
    if (!selected || !/^[a-f0-9]{64}$/i.test(String(selected.hash || '')) || !isSafeAbsolutePath(selected.keepPath) || !Array.isArray(selected.duplicatePaths)) continue;
    const group = fresh.groups.find(item => item.hash === selected.hash && normalizedPathKey(item.keepPath) === normalizedPathKey(selected.keepPath));
    if (!group || !pathIsInsideAny(rootPaths, group.keepPath)) continue;
    // Never remove the only retained copy; its contents must still match the scan hash.
    try {
      const keeperReal = await fsp.realpath(group.keepPath);
      if (!pathIsInsideAny(rootPaths, keeperReal) || await hashAudioFileSha256(keeperReal) !== group.hash) continue;
    } catch (_) { continue; }
    const allowed = new Set(group.duplicatePaths.map(normalizedPathKey));
    for (const requestedPath of selected.duplicatePaths.slice(0, 10000)) {
      if (typeof requestedPath !== 'string' || !isSafeAbsolutePath(requestedPath)) continue;
      const key = normalizedPathKey(requestedPath);
      if (!allowed.has(key) || key === normalizedPathKey(group.keepPath)) continue;
      const current = group.files.find(file => normalizedPathKey(file.path) === key);
      if (!current) continue;
      try {
        const realPath = await fsp.realpath(current.path);
        if (!pathIsInsideAny(rootPaths, realPath) || !isAudioPath(realPath)) { failed.push({ path: current.path, reason: 'outside-source' }); continue; }
        const stat = await fsp.stat(realPath);
        if (!stat.isFile() || stat.size !== group.size || await hashAudioFileSha256(realPath) !== group.hash) {
          failed.push({ path: realPath, reason: 'changed-after-scan' }); continue;
        }
        await shell.trashItem(realPath);
        trashedPaths.push(realPath);
      } catch (error) {
        failed.push({ path: current.path, reason: error?.message || 'trash-failed' });
      }
    }
  }
  return { trashedPaths, failed, duplicateCount: trashedPaths.length, rootPaths };
});

ipcMain.handle('foxsmusic:get-track-metadata', async (event, filePath) => {
  assertTrustedSender(event);
  if (!isSafeAbsolutePath(filePath) || !isAudioPath(filePath)) return null;
  try {
    musicMetadataModulePromise ||= import('music-metadata');
    const musicMetadata = await musicMetadataModulePromise;
    const metadata = await musicMetadata.parseFile(filePath, { skipCovers: true, duration: true });
    return {
      title: metadata.common?.title || '',
      artist: metadata.common?.artist || metadata.common?.albumartist || '',
      album: metadata.common?.album || '',
      genre: Array.isArray(metadata.common?.genre) ? metadata.common.genre.join(', ') : '',
      year: metadata.common?.year || ''
    };
  } catch (_) { return null; }
});

ipcMain.handle('foxsmusic:save-backup', async (event, content, locale = 'ru') => {
  assertTrustedSender(event);
  if (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > 60 * 1024 * 1024) throw new Error('Резервная копия слишком большая или некорректная');
  const copy = dialogCopy(locale);
  const result = await dialog.showSaveDialog(mainWindow, {
    title: copy.saveBackup,
    defaultPath: `FoxsMusic-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: copy.backupFile, extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  await fsp.writeFile(result.filePath, content, { encoding: 'utf8', flag: 'w' });
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('foxsmusic:load-backup', async (event, locale = 'ru') => {
  assertTrustedSender(event);
  const copy = dialogCopy(locale);
  const result = await dialog.showOpenDialog(mainWindow, {
    title: copy.chooseBackup, properties: ['openFile'],
    filters: [{ name: copy.backupFile, extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const stat = await fsp.stat(result.filePaths[0]);
  if (stat.size > 60 * 1024 * 1024) throw new Error('Файл резервной копии превышает 60 МБ');
  const content = await fsp.readFile(result.filePaths[0], 'utf8');
  return { canceled: false, content };
});

// Manual update controls. Publishing releases is configured in package.json and the release workflow.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on('update-available', info => mainWindow?.webContents.send('foxsmusic:update-status', { status: 'available', version: info?.version || '' }));
autoUpdater.on('update-not-available', info => mainWindow?.webContents.send('foxsmusic:update-status', { status: 'not-available', version: info?.version || '' }));
autoUpdater.on('download-progress', progress => mainWindow?.webContents.send('foxsmusic:update-status', { status: 'progress', percent: Math.round(progress?.percent || 0) }));
autoUpdater.on('update-downloaded', info => mainWindow?.webContents.send('foxsmusic:update-status', { status: 'downloaded', version: info?.version || '' }));
autoUpdater.on('error', error => mainWindow?.webContents.send('foxsmusic:update-status', { status: 'error', message: error?.message || 'Update failed' }));
ipcMain.handle('foxsmusic:check-updates', async event => {
  assertTrustedSender(event);
  if (!app.isPackaged) return { ok: false, packaged: false, message: 'Проверка обновлений доступна в собранном приложении.' };
  try {
    const result = await autoUpdater.checkForUpdates();
    return { ok: true, updateAvailable: !!result?.isUpdateAvailable, version: result?.updateInfo?.version || '' };
  } catch (error) { return { ok: false, message: error?.message || 'Не удалось проверить обновления.' }; }
});
ipcMain.handle('foxsmusic:download-update', async event => {
  assertTrustedSender(event);
  if (!app.isPackaged) throw new Error('Сначала собери приложение.');
  await autoUpdater.downloadUpdate();
  return { ok: true };
});
ipcMain.handle('foxsmusic:install-update', async event => {
  assertTrustedSender(event);
  if (!app.isPackaged) throw new Error('Сначала собери приложение.');
  setImmediate(() => autoUpdater.quitAndInstall());
  return { ok: true };
});

ipcMain.handle('foxsmusic:toggle-window-fullscreen', event => {
  assertTrustedSender(event);
  const targetWindow = BrowserWindow.fromWebContents(event.sender);
  if (!targetWindow || targetWindow.isDestroyed()) return { ok: false, fullscreen: false };
  targetWindow.setFullScreen(!targetWindow.isFullScreen());
  return { ok: true, fullscreen: targetWindow.isFullScreen() };
});

ipcMain.handle('foxsmusic:get-playback-url', async (event, filePath) => {
  assertTrustedSender(event);
  return registerAudioPath(filePath);
});

ipcMain.handle('foxsmusic:get-track-artwork', async (event, filePath) => {
  assertTrustedSender(event);
  return getOriginalTrackArtwork(filePath);
});

ipcMain.handle('foxsmusic:reveal-in-folder', async (event, filePath) => {
  assertTrustedSender(event);
  if (!isSafeAbsolutePath(filePath)) return { ok: false, reason: 'invalid-path' };
  try {
    await fsp.access(filePath);
    shell.showItemInFolder(filePath);
    return { ok: true };
  } catch (_) {
    return { ok: false, reason: 'not-found' };
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 900,
    minHeight: 650,
    title: 'FoxsMusic Desktop',
    backgroundColor: '#090607',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  // F11 is handled in the main process because Chromium/Electron may consume it
  // before the renderer's keydown listener receives the event.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11' && !input.alt && !input.control && !input.meta) {
      event.preventDefault();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return;
    event.preventDefault();
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url).catch(() => {});
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    protocol.handle(APP_SCHEME, request => {
      let url;
      try { url = new URL(request.url); }
      catch (_) { return new Response('Bad request', { status: 400 }); }
      // The app itself continues to load from file:// so an existing IndexedDB library
      // remains available. Only external audio files use this CORS-enabled streaming URL.
      if (url.hostname !== 'media') return new Response('Not found', { status: 404 });
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type',
          'Access-Control-Max-Age': '600'
        }});
      }
      const pathname = decodeURIComponent(url.pathname || '/');
      const audioMatch = /^\/audio\/([0-9a-f-]+)$/i.exec(pathname);
      if (!audioMatch) return new Response('Not found', { status: 404 });
      const audioPath = audioTokens.get(audioMatch[1]);
      if (!audioPath) return new Response('Audio source expired. Reopen the track.', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
      return fileResponse(audioPath, request);
    });

    Menu.setApplicationMenu(null);
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
