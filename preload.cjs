'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('foxsmusic', Object.freeze({
  selectAudioFiles: (allowMultiple = true, locale = 'ru') => ipcRenderer.invoke('foxsmusic:select-audio-files', Boolean(allowMultiple), locale),
  selectAudioFolder: (locale = 'ru') => ipcRenderer.invoke('foxsmusic:select-audio-folder', locale),
  selectSourceFolders: (locale = 'ru') => ipcRenderer.invoke('foxsmusic:select-source-folders', locale),
  scanAudioFolderPath: folderPath => ipcRenderer.invoke('foxsmusic:scan-audio-folder-path', folderPath),
  platform: process.platform,
  getPathForFile: file => webUtils.getPathForFile(file),
  getPlaybackUrl: filePath => ipcRenderer.invoke('foxsmusic:get-playback-url', filePath),
  analyzeLibraryFiles: items => ipcRenderer.invoke('foxsmusic:analyze-library-files', items),
  getTrackArtwork: filePath => ipcRenderer.invoke('foxsmusic:get-track-artwork', filePath),
  revealInFolder: filePath => ipcRenderer.invoke('foxsmusic:reveal-in-folder', filePath),
  analyzeSourceFolderDuplicates: folderPath => ipcRenderer.invoke('foxsmusic:analyze-source-folder-duplicates', folderPath),
  analyzeSourceFoldersDuplicates: request => ipcRenderer.invoke('foxsmusic:analyze-source-folders-duplicates', request),
  trashSourceDuplicates: request => ipcRenderer.invoke('foxsmusic:trash-source-duplicates', request),
  getTrackMetadata: filePath => ipcRenderer.invoke('foxsmusic:get-track-metadata', filePath),
  saveBackup: (content, locale = 'ru') => ipcRenderer.invoke('foxsmusic:save-backup', content, locale),
  loadBackup: (locale = 'ru') => ipcRenderer.invoke('foxsmusic:load-backup', locale),
  checkUpdates: () => ipcRenderer.invoke('foxsmusic:check-updates'),
  downloadUpdate: () => ipcRenderer.invoke('foxsmusic:download-update'),
  installUpdate: () => ipcRenderer.invoke('foxsmusic:install-update'),
  toggleWindowFullscreen: () => ipcRenderer.invoke('foxsmusic:toggle-window-fullscreen'),
  onUpdateStatus: callback => { const listener = (_event, payload) => callback(payload); ipcRenderer.on('foxsmusic:update-status', listener); return () => ipcRenderer.removeListener('foxsmusic:update-status', listener); }
}));
