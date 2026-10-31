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


function sortTracks(tracks, mode = 'recent') {
  const items = Array.isArray(tracks) ? [...tracks] : [];
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  const titleOf = track => String(track?.title || track?.fileName || '');
  const artistOf = track => String(track?.artist || '');

  if (mode === 'title') {
    return items.sort((a, b) => collator.compare(titleOf(a), titleOf(b))
      || collator.compare(artistOf(a), artistOf(b)));
  }
  if (mode === 'artist') {
    return items.sort((a, b) => collator.compare(artistOf(a), artistOf(b))
      || collator.compare(titleOf(a), titleOf(b)));
  }
  return items.sort((a, b) => {
    const dateDifference = (Number(b?.addedAt) || 0) - (Number(a?.addedAt) || 0);
    return dateDifference || collator.compare(titleOf(a), titleOf(b));
  });
}


function formatDateTime(value, language = 'ru') {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  const locale = language === 'ru' ? 'ru-RU' : language === 'de' ? 'de-DE' : 'en-US';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function sortMostPlayed(tracks, playStats = {}) {
  const items = Array.isArray(tracks) ? [...tracks] : [];
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  return items.sort((a, b) => {
    const sa = playStats[a?.id] || {};
    const sb = playStats[b?.id] || {};
    return (Number(sb.count) || 0) - (Number(sa.count) || 0)
      || (Number(sb.lastPlayedAt) || 0) - (Number(sa.lastPlayedAt) || 0)
      || collator.compare(String(a?.title || ''), String(b?.title || ''));
  });
}


function normalizeFileTimestamp(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

function readSyncSafeInt(bytes, offset) {
  return ((bytes[offset] & 0x7f) << 21)
    | ((bytes[offset + 1] & 0x7f) << 14)
    | ((bytes[offset + 2] & 0x7f) << 7)
    | (bytes[offset + 3] & 0x7f);
}

function decodeId3Text(bytes, encoding = 0) {
  let data = bytes;
  if (encoding === 0) {
    let result = '';
    for (let i = 0; i < data.length; i += 1) result += String.fromCharCode(data[i]);
    return result.replace(/\u0000+$/g, '').trim();
  }
  if (encoding === 1 || encoding === 2) {
    let littleEndian = encoding === 1;
    if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) { littleEndian = true; data = data.subarray(2); }
    else if (data.length >= 2 && data[0] === 0xfe && data[1] === 0xff) { littleEndian = false; data = data.subarray(2); }
    let result = '';
    for (let i = 0; i + 1 < data.length; i += 2) {
      const code = littleEndian ? data[i] | (data[i + 1] << 8) : (data[i] << 8) | data[i + 1];
      if (code === 0) break;
      result += String.fromCharCode(code);
    }
    return result.trim();
  }
  if (typeof TextDecoder !== 'undefined') {
    try { return new TextDecoder('utf-8').decode(data).replace(/\u0000+$/g, '').trim(); } catch (_) {}
  }
  try {
    const escaped = Array.from(data, byte => `%${byte.toString(16).padStart(2, '0')}`).join('');
    return decodeURIComponent(escaped).replace(/\u0000+$/g, '').trim();
  } catch (_) {
    let result = '';
    for (let i = 0; i < data.length; i++) result += String.fromCharCode(data[i]);
    return result.replace(/\u0000+$/g, '').trim();
  }

}

function parseId3v2Tag(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input || []);
  const result = { title: '', artist: '', album: '', picture: null };
  if (bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return result;
  const version = bytes[3];
  if (version !== 2 && version !== 3 && version !== 4) return result;
  const declaredSize = readSyncSafeInt(bytes, 6);
  const end = Math.min(bytes.length, 10 + declaredSize);
  let offset = 10;

  function parseTextFrame(frameId, payload) {
    if (!payload.length) return;
    const value = decodeId3Text(payload.subarray(1), payload[0]);
    if (!value) return;
    if (frameId === 'TIT2' || frameId === 'TT2') result.title = value;
    else if (frameId === 'TPE1' || frameId === 'TP1') result.artist = value;
    else if (frameId === 'TALB' || frameId === 'TAL') result.album = value;
  }

  function parsePicture(payload, legacyV22 = false) {
    if (payload.length < 5) return;
    const encoding = payload[0];
    let cursor = 1;
    let mimeType = '';
    if (legacyV22) {
      const format = String.fromCharCode(payload[1], payload[2], payload[3]).toUpperCase();
      mimeType = format === 'PNG' ? 'image/png' : 'image/jpeg';
      cursor = 5; // encoding + three-byte image format + picture type
    } else {
      const mimeEnd = payload.indexOf(0, cursor);
      if (mimeEnd < 0) return;
      mimeType = decodeId3Text(payload.subarray(cursor, mimeEnd), 0).toLowerCase();
      cursor = mimeEnd + 2; // MIME terminator and picture type
    }
    if (cursor >= payload.length) return;
    if (encoding === 1 || encoding === 2) {
      while (cursor + 1 < payload.length) {
        if (payload[cursor] === 0 && payload[cursor + 1] === 0) { cursor += 2; break; }
        cursor += 2;
      }
    } else {
      const descriptionEnd = payload.indexOf(0, cursor);
      if (descriptionEnd < 0) return;
      cursor = descriptionEnd + 1;
    }
    if (cursor >= payload.length) return;
    const imageData = payload.slice(cursor);
    if (imageData.length < 64) return;
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png' || mimeType === 'image/webp') {
      result.picture = { mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType, data: imageData };
    }
  }

  // Skip ID3v2.3/2.4 extended headers when present.
  if (version >= 3 && (bytes[5] & 0x40) && offset + 4 <= end) {
    const extendedSize = version === 4 ? readSyncSafeInt(bytes, offset)
      : (((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0);
    offset += version === 4 ? extendedSize : 4 + extendedSize;
  }

  while (offset < end) {
    const headerLength = version === 2 ? 6 : 10;
    if (offset + headerLength > end) break;
    const idLength = version === 2 ? 3 : 4;
    const id = String.fromCharCode(...bytes.subarray(offset, offset + idLength));
    if (!/^[A-Z0-9]{3,4}$/.test(id)) break;
    const frameSize = version === 2
      ? ((bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5])
      : version === 4
        ? readSyncSafeInt(bytes, offset + 4)
        : (((bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7]) >>> 0);
    if (!frameSize || frameSize > end - offset - headerLength) break;
    const payload = bytes.subarray(offset + headerLength, offset + headerLength + frameSize);
    if (['TIT2', 'TPE1', 'TALB', 'TT2', 'TP1', 'TAL'].includes(id)) parseTextFrame(id, payload);
    else if ((id === 'APIC' || id === 'PIC') && !result.picture) parsePicture(payload, id === 'PIC');
    offset += headerLength + frameSize;
  }
  return result;
}

function isValidHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '').trim());
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
  sortTracks,
  sortMostPlayed,
  formatDateTime,
  normalizeFileTimestamp,
  parseId3v2Tag,
  isValidHexColor,
  createId
};
