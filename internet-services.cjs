'use strict';

const RADIO_API_BASE = 'https://de1.api.radio-browser.info';
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

function cleanSearchTerm(value) {
  return typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120) : '';
}

function safeHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    return parsed.href;
  } catch (_) {
    return null;
  }
}

function buildRadioSearchUrl(query = '', field = 'name') {
  const url = new URL('/json/stations/search', RADIO_API_BASE);
  const term = cleanSearchTerm(query);
  const searchField = ['name', 'tag', 'country'].includes(field) ? field : 'name';
  if (term) url.searchParams.set(searchField, term);
  url.searchParams.set('hidebroken', 'true');
  url.searchParams.set('limit', '50');
  url.searchParams.set('order', 'clickcount');
  url.searchParams.set('reverse', 'true');
  return url.href;
}

function normalizeRadioStation(record) {
  if (!record || typeof record !== 'object') return null;
  const streamUrl = safeHttpUrl(record.url_resolved || record.url);
  const uuid = typeof record.stationuuid === 'string' ? record.stationuuid.trim() : '';
  const name = typeof record.name === 'string' ? record.name.trim().slice(0, 160) : '';
  if (!streamUrl || !name || !/^[a-f0-9-]{16,64}$/i.test(uuid)) return null;
  return {
    id: uuid,
    name,
    streamUrl,
    homepage: safeHttpUrl(record.homepage),
    favicon: safeHttpUrl(record.favicon),
    country: typeof record.country === 'string' ? record.country.slice(0, 80) : '',
    language: typeof record.language === 'string' ? record.language.slice(0, 80) : '',
    tags: typeof record.tags === 'string' ? record.tags.split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 8) : [],
    codec: typeof record.codec === 'string' ? record.codec.slice(0, 20).toUpperCase() : '',
    bitrate: Number.isFinite(Number(record.bitrate)) ? Math.max(0, Math.min(10000, Number(record.bitrate))) : 0
  };
}

function buildJamendoSearchUrl(clientId, query = '', field = 'track') {
  const id = typeof clientId === 'string' ? clientId.trim() : '';
  if (!/^[a-z0-9]{6,64}$/i.test(id)) throw new TypeError('A valid Jamendo Client ID is required.');
  const url = new URL('/v3.0/tracks/', JAMENDO_API_BASE);
  url.searchParams.set('client_id', id);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '50');
  url.searchParams.set('audioformat', 'mp32');
  url.searchParams.set('imagesize', '300');
  url.searchParams.set('include', 'licenses');
  url.searchParams.set('order', 'relevance');
  const term = cleanSearchTerm(query);
  if (term) {
    const searchParameter = field === 'artist' ? 'artist_name' : field === 'album' ? 'album_name' : 'namesearch';
    url.searchParams.set(searchParameter, term);
  }
  return url.href;
}

function normalizeJamendoTrack(record) {
  if (!record || typeof record !== 'object') return null;
  const audioUrl = safeHttpUrl(record.audio);
  const id = record.id == null ? '' : String(record.id).slice(0, 80);
  const title = typeof record.name === 'string' ? record.name.trim().slice(0, 180) : '';
  if (!audioUrl || !id || !title) return null;
  return {
    id,
    title,
    artist: typeof record.artist_name === 'string' ? record.artist_name.slice(0, 140) : '',
    album: typeof record.album_name === 'string' ? record.album_name.slice(0, 140) : '',
    duration: Number.isFinite(Number(record.duration)) ? Math.max(0, Math.min(86400, Number(record.duration))) : 0,
    image: safeHttpUrl(record.album_image || record.image),
    audioUrl,
    licenseUrl: safeHttpUrl(record.license_ccurl),
    shareUrl: safeHttpUrl(record.shareurl)
  };
}

module.exports = {
  RADIO_API_BASE,
  JAMENDO_API_BASE,
  cleanSearchTerm,
  safeHttpUrl,
  buildRadioSearchUrl,
  normalizeRadioStation,
  buildJamendoSearchUrl,
  normalizeJamendoTrack
};
