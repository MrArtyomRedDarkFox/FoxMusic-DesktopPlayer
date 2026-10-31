'use strict';

const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  'mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg', 'oga', 'opus'
]);

function getExtension(fileName) {
  const name = String(fileName || '').trim();
  const match = name.match(/\.([a-z0-9]{1,8})$/i);
  return match ? match[1].toLowerCase() : '';
}

function isSupportedAudio(fileName) {
  return SUPPORTED_AUDIO_EXTENSIONS.has(getExtension(fileName));
}

function parseTrackName(fileName) {
  const cleanName = String(fileName || 'Untitled track').trim();
  const withoutExtension = cleanName.replace(/\.[^.]+$/, '').trim() || 'Untitled track';
  const parts = withoutExtension.split(/\s+-\s+/);

  if (parts.length >= 2) {
    return {
      artist: parts.shift().trim(),
      title: parts.join(' - ').trim() || withoutExtension
    };
  }

  return { artist: '', title: withoutExtension };
}

function formatTime(value) {
  const seconds = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function createId(now = Date.now(), random = Math.random()) {
  return `${now.toString(36)}-${random.toString(36).slice(2, 10)}`;
}

module.exports = {
  SUPPORTED_AUDIO_EXTENSIONS,
  getExtension,
  isSupportedAudio,
  parseTrackName,
  formatTime,
  createId
};
