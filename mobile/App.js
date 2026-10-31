import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import {
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  useAudioPlaylist,
  useAudioPlaylistStatus,
} from 'expo-audio';
import { createId, formatTime, isSupportedAudio, parseTrackName } from './src/core';

const STORAGE_KEY = 'foxsmusic-mobile-library-v1';
const C = {
  background: '#08070A',
  panel: '#141015',
  panelRaised: '#1B1218',
  panelSoft: '#21151C',
  line: '#33232B',
  red: '#F12743',
  redDark: '#9D162B',
  text: '#F7EEF1',
  muted: '#A18E97',
  subtle: '#74636C',
  green: '#6CCB9A',
};

const COPY = {
  ru: {
    library: 'Библиотека', playlists: 'Плейлисты', player: 'Плеер', settings: 'Настройки',
    edition: 'ANDROID EDITION', collection: 'ТВОЯ МУЗЫКА', localLibrary: 'Локальная библиотека',
    import: 'Добавить музыку', importHint: 'Выбери аудиофайлы на телефоне', importFolder: 'Добавить папку с музыкой', addedOn: 'Добавлен', search: 'Поиск трека или исполнителя',
    all: 'Все', favorites: 'Избранное', tracks: 'треков', noTracks: 'Библиотека пока пуста',
    noTracksHint: 'Добавь музыку с телефона — файлы останутся внутри FoxsMusic.',
    addFirst: 'Выбрать аудиофайлы', unknownArtist: 'Неизвестный исполнитель',
    nowPlaying: 'СЕЙЧАС ИГРАЕТ', nothingPlaying: 'Ничего не воспроизводится',
    chooseTrack: 'Выбери трек из библиотеки, чтобы начать воспроизведение.',
    previous: 'Предыдущий трек', next: 'Следующий трек', play: 'Воспроизвести', pause: 'Пауза',
    shuffle: 'Случайный следующий', repeatOff: 'Повтор выключен', repeatAll: 'Повтор плейлиста',
    repeatOne: 'Повтор трека', queue: 'ОЧЕРЕДЬ', noQueue: 'В очереди пока нет треков',
    createPlaylist: 'Создать плейлист', playlistName: 'Название плейлиста', create: 'Создать', cancel: 'Отмена',
    emptyPlaylists: 'Плейлистов пока нет', emptyPlaylistsHint: 'Создай плейлист и добавляй в него любимые треки.',
    addToPlaylist: 'Добавить в плейлист', choosePlaylist: 'Выбери плейлист',
    noPlaylists: 'Сначала создай плейлист.', added: 'Трек добавлен в плейлист.',
    alreadyAdded: 'Этот трек уже есть в плейлисте.', saved: 'Сохранено',
    language: 'Язык интерфейса', storage: 'Хранилище музыки', storageHint: 'Аудиофайлы копируются в приватную папку приложения. Полный доступ ко всем файлам телефона не запрашивается.',
    background: 'Фоновое воспроизведение', backgroundOn: 'Поддерживается через системное медиа-уведомление и экран блокировки.',
    supported: 'Поддерживаемые форматы', about: 'О приложении', version: 'Версия 0.1.1 · Android MVP',
    importDone: 'Импорт завершён', imported: 'Добавлено файлов', skipped: 'Пропущено неподдерживаемых или повторных файлов',
    importError: 'Не удалось импортировать файл', permissionTitle: 'Доступ к уведомлениям',
    permissionHint: 'Разрешение нужно Android для отображения системных кнопок управления музыкой.',
    ok: 'Понятно', createFirst: 'Создай первый плейлист', playlistTracks: 'треков в плейлисте',
    back: 'Назад', emptyPlaylist: 'В этом плейлисте пока нет треков',
  },
  en: {
    library: 'Library', playlists: 'Playlists', player: 'Player', settings: 'Settings',
    edition: 'ANDROID EDITION', collection: 'YOUR MUSIC', localLibrary: 'Local library',
    import: 'Add music', importHint: 'Choose audio files on your phone', importFolder: 'Import music folder', addedOn: 'Added', search: 'Search tracks or artists',
    all: 'All', favorites: 'Favorites', tracks: 'tracks', noTracks: 'Your library is empty',
    noTracksHint: 'Add music from your phone — files stay inside FoxsMusic.',
    addFirst: 'Choose audio files', unknownArtist: 'Unknown artist',
    nowPlaying: 'NOW PLAYING', nothingPlaying: 'Nothing is playing',
    chooseTrack: 'Choose a track from your library to start playback.',
    previous: 'Previous track', next: 'Next track', play: 'Play', pause: 'Pause',
    shuffle: 'Random next', repeatOff: 'Repeat off', repeatAll: 'Repeat playlist',
    repeatOne: 'Repeat track', queue: 'UP NEXT', noQueue: 'No tracks in the queue',
    createPlaylist: 'Create playlist', playlistName: 'Playlist name', create: 'Create', cancel: 'Cancel',
    emptyPlaylists: 'No playlists yet', emptyPlaylistsHint: 'Create a playlist and add your favorite tracks.',
    addToPlaylist: 'Add to playlist', choosePlaylist: 'Choose a playlist',
    noPlaylists: 'Create a playlist first.', added: 'Track added to playlist.',
    alreadyAdded: 'This track is already in the playlist.', saved: 'Saved',
    language: 'Interface language', storage: 'Music storage', storageHint: 'Audio files are copied into the app private folder. Full access to phone storage is not requested.',
    background: 'Background playback', backgroundOn: 'Supported through the system media notification and lock screen.',
    supported: 'Supported formats', about: 'About', version: 'Version 0.1.1 · Android MVP',
    importDone: 'Import complete', imported: 'Files added', skipped: 'Unsupported or duplicate files skipped',
    importError: 'Could not import file', permissionTitle: 'Notification access',
    permissionHint: 'Android uses this permission to show system music controls.',
    ok: 'OK', createFirst: 'Create your first playlist', playlistTracks: 'tracks in playlist',
    back: 'Back', emptyPlaylist: 'This playlist has no tracks yet',
  },
  de: {
    library: 'Mediathek', playlists: 'Playlists', player: 'Player', settings: 'Einstellungen',
    edition: 'ANDROID EDITION', collection: 'DEINE MUSIK', localLibrary: 'Lokale Mediathek',
    import: 'Musik hinzufügen', importHint: 'Audiodateien auf dem Smartphone auswählen', importFolder: 'Musikordner hinzufügen', addedOn: 'Hinzugefügt', search: 'Titel oder Interpret suchen',
    all: 'Alle', favorites: 'Favoriten', tracks: 'Titel', noTracks: 'Deine Mediathek ist leer',
    noTracksHint: 'Füge Musik hinzu — die Dateien bleiben in FoxsMusic gespeichert.',
    addFirst: 'Audiodateien auswählen', unknownArtist: 'Unbekannter Interpret',
    nowPlaying: 'LÄUFT GERADE', nothingPlaying: 'Keine Wiedergabe',
    chooseTrack: 'Wähle einen Titel aus deiner Mediathek.',
    previous: 'Vorheriger Titel', next: 'Nächster Titel', play: 'Wiedergabe', pause: 'Pause',
    shuffle: 'Zufälliger nächster Titel', repeatOff: 'Wiederholung aus', repeatAll: 'Playlist wiederholen',
    repeatOne: 'Titel wiederholen', queue: 'ALS NÄCHSTES', noQueue: 'Keine Titel in der Warteschlange',
    createPlaylist: 'Playlist erstellen', playlistName: 'Playlist-Name', create: 'Erstellen', cancel: 'Abbrechen',
    emptyPlaylists: 'Noch keine Playlists', emptyPlaylistsHint: 'Erstelle eine Playlist und füge deine Lieblingstitel hinzu.',
    addToPlaylist: 'Zur Playlist hinzufügen', choosePlaylist: 'Playlist auswählen',
    noPlaylists: 'Erstelle zuerst eine Playlist.', added: 'Titel zur Playlist hinzugefügt.',
    alreadyAdded: 'Dieser Titel ist bereits in der Playlist.', saved: 'Gespeichert',
    language: 'Oberflächensprache', storage: 'Musikspeicher', storageHint: 'Audiodateien werden in den privaten App-Ordner kopiert. Es wird kein vollständiger Speicherzugriff angefordert.',
    background: 'Hintergrundwiedergabe', backgroundOn: 'Über die System-Medienbenachrichtigung und den Sperrbildschirm verfügbar.',
    supported: 'Unterstützte Formate', about: 'Über die App', version: 'Version 0.1.1 · Android MVP',
    importDone: 'Import abgeschlossen', imported: 'Dateien hinzugefügt', skipped: 'Nicht unterstützte oder doppelte Dateien übersprungen',
    importError: 'Datei konnte nicht importiert werden', permissionTitle: 'Benachrichtigungszugriff',
    permissionHint: 'Android benötigt diese Berechtigung für die System-Musiksteuerung.',
    ok: 'OK', createFirst: 'Erstelle deine erste Playlist', playlistTracks: 'Titel in der Playlist',
    back: 'Zurück', emptyPlaylist: 'Diese Playlist enthält noch keine Titel',
  },
};

function Artwork({ size = 54, title = 'F' }) {
  return (
    <View style={[styles.artwork, { width: size, height: size, borderRadius: Math.max(12, size * 0.2) }]}>
      <View style={styles.artworkGlow} />
      <Text style={[styles.artworkGlyph, { fontSize: size * 0.47 }]}>{title ? title.slice(0, 1).toUpperCase() : '♫'}</Text>
      <Text style={styles.artworkWord}>FOX</Text>
    </View>
  );
}

function ActionButton({ label, onPress, active = false, small = false, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.actionButton,
        small && styles.actionButtonSmall,
        active && styles.actionButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionButtonText, active && styles.actionButtonTextActive, small && styles.actionButtonTextSmall]}>{label}</Text>
    </Pressable>
  );
}

function TrackRow({ track, index, active, language, onPlay, onFavorite, onAdd }) {
  const t = COPY[language];
  return (
    <View style={[styles.trackRow, active && styles.trackRowActive]}>
      <Pressable style={styles.trackMain} onPress={onPlay} accessibilityRole="button">
        <Artwork title={track.title} />
        <View style={styles.trackCopy}>
          <Text numberOfLines={1} style={[styles.trackTitle, active && styles.trackTitleActive]}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.trackArtist}>{track.artist || t.unknownArtist}</Text>
          <Text numberOfLines={1} style={styles.trackMeta}>{track.sourceFolder ? `${track.sourceFolder} · ` : ''}{t.addedOn}: {track.addedAt ? new Date(track.addedAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'de' ? 'de-DE' : 'en-US') : '—'}</Text>
        </View>
      </Pressable>
      <Pressable onPress={onFavorite} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.favorites} style={styles.rowIconButton}>
        <Text style={[styles.rowIcon, track.favorite && styles.favoriteOn]}>{track.favorite ? '♥' : '♡'}</Text>
      </Pressable>
      <Pressable onPress={onAdd} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.addToPlaylist} style={styles.rowIconButton}>
        <Text style={styles.rowIcon}>＋</Text>
      </Pressable>
    </View>
  );
}

function AppContent() {
  const playlist = useAudioPlaylist({ sources: [], loop: 'none', updateInterval: 500 });
  const playback = useAudioPlaylistStatus(playlist);
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [language, setLanguage] = useState('ru');
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState('library');
  const [search, setSearch] = useState('');
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [queueIds, setQueueIds] = useState([]);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [repeatMode, setRepeatMode] = useState('none');
  const [shuffle, setShuffle] = useState(false);
  const [importing, setImporting] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistModalMode, setPlaylistModalMode] = useState('create');
  const [playlistName, setPlaylistName] = useState('');
  const [pendingTrackId, setPendingTrackId] = useState(null);
  const currentQueueKey = useRef('');
  const pendingPlay = useRef(null);
  const currentTrackIdRef = useRef(null);
  const notificationAsked = useRef(false);
  const audioModeReady = useRef(null);
  const seekWidth = useRef(1);
  const t = COPY[language] || COPY.ru;

  const currentTrack = tracks.find(track => track.id === currentTrackId) || null;
  const queueTracks = queueIds.map(id => tracks.find(track => track.id === id)).filter(Boolean);
  const queueCurrentIndex = currentTrackId ? queueIds.indexOf(currentTrackId) : -1;
  const playlistDetail = playlists.find(item => item.id === selectedPlaylistId) || null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!mounted || !saved || saved.version !== 1) return;
        const savedTracks = Array.isArray(saved.tracks) ? saved.tracks.filter(item => item && typeof item.id === 'string' && typeof item.uri === 'string') : [];
        const savedPlaylists = Array.isArray(saved.playlists) ? saved.playlists.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string') : [];
        setTracks(savedTracks);
        setPlaylists(savedPlaylists.map(item => ({ ...item, trackIds: Array.isArray(item.trackIds) ? item.trackIds.filter(id => typeof id === 'string') : [] })));
        setLanguage(['ru', 'en', 'de'].includes(saved.language) ? saved.language : 'ru');
        setQueueIds(savedTracks.map(item => item.id));
        if (['none', 'all', 'single'].includes(saved.repeatMode)) setRepeatMode(saved.repeatMode);
      } catch (error) {
        console.warn('FoxsMusic mobile: could not load local library', error);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload = { version: 1, tracks, playlists, language, repeatMode };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(error => {
      console.warn('FoxsMusic mobile: could not persist library', error);
    });
  }, [ready, tracks, playlists, language, repeatMode]);

  useEffect(() => {
    audioModeReady.current = setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(error => {
      console.warn('FoxsMusic mobile: audio session setup failed', error);
    });
    return () => {
      try { playlist.clearLockScreenControls(); } catch (_) {}
    };
  }, [playlist]);

  useEffect(() => {
    if (!ready) return;
    playlist.loop = repeatMode;
  }, [playlist, repeatMode, ready]);

  useEffect(() => {
    if (!ready) return;
    const nextQueueKey = queueIds.join('\u001f');
    if (nextQueueKey === currentQueueKey.current) return;

    const wasPlaying = playback.playing;
    const previousTrackId = currentTrackIdRef.current;
    playlist.pause();
    playlist.clear();
    for (const id of queueIds) {
      const track = tracks.find(item => item.id === id);
      if (track) playlist.add({ uri: track.uri, name: `${track.title} — ${track.artist || ''}` });
    }
    currentQueueKey.current = nextQueueKey;

    const requested = pendingPlay.current;
    const targetId = requested?.trackId || (queueIds.includes(previousTrackId) ? previousTrackId : null);
    if (targetId) {
      const targetIndex = queueIds.indexOf(targetId);
      if (targetIndex >= 0) {
        playlist.skipTo(targetIndex);
        setCurrentTrackId(targetId);
        if (requested?.shouldPlay) {
          const requestedTrack = tracks.find(item => item.id === targetId);
          if (requestedTrack) activateSystemControls(requestedTrack).finally(() => playlist.play());
          else playlist.play();
        } else if (wasPlaying) {
          playlist.play();
        }
      }
    } else if (!queueIds.length) {
      setCurrentTrackId(null);
      playlist.clearLockScreenControls();
    }
    pendingPlay.current = null;
  }, [ready, queueIds, tracks, playlist]);

  useEffect(() => {
    currentTrackIdRef.current = currentTrackId;
  }, [currentTrackId]);

  useEffect(() => {
    if (!currentTrackId && !playback.playing) return;
    const currentId = queueIds[playback.currentIndex];
    if (currentId && currentId !== currentTrackId) setCurrentTrackId(currentId);
  }, [playback.currentIndex, queueIds, currentTrackId]);

  useEffect(() => {
    if (!currentTrack) return;
    try {
      playlist.updateLockScreenMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || t.unknownArtist,
        albumTitle: currentTrack.album || 'FoxsMusic',
      });
    } catch (_) {}
  }, [currentTrack, language, playlist]);

  const visibleTracks = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    return tracks.filter(track => {
      if (libraryFilter === 'favorites' && !track.favorite) return false;
      if (!normalized) return true;
      return `${track.title} ${track.artist || ''} ${track.fileName || ''}`.toLocaleLowerCase().includes(normalized);
    });
  }, [tracks, search, libraryFilter]);

  const getQueueForLibrary = () => tracks.map(track => track.id);

  async function activateSystemControls(track) {
    if (audioModeReady.current) await audioModeReady.current;
    if (Platform.OS === 'android' && !notificationAsked.current) {
      notificationAsked.current = true;
      try { await requestNotificationPermissionsAsync(); } catch (error) {
        console.warn('FoxsMusic mobile: notification permission request failed', error);
      }
    }
    try {
      playlist.setActiveForLockScreen(true, {
        title: track.title,
        artist: track.artist || t.unknownArtist,
        albumTitle: track.album || 'FoxsMusic',
      }, {
        showNextTrack: true,
        showPreviousTrack: true,
        showSeekBackward: true,
        showSeekForward: true,
      });
    } catch (error) {
      console.warn('FoxsMusic mobile: lock-screen controls could not be activated', error);
    }
  }

  async function playTrack(track, queueOverride = null) {
    if (!track) return;
    try {
      const source = new File(track.uri);
      if (!source.exists) {
        Alert.alert('FoxsMusic', language === 'en' ? 'The imported audio file is missing.' : language === 'de' ? 'Die importierte Audiodatei fehlt.' : 'Импортированный аудиофайл не найден.');
        return;
      }
    } catch (error) {
      Alert.alert('FoxsMusic', String(error?.message || error));
      return;
    }

    const targetQueue = Array.isArray(queueOverride) ? queueOverride : getQueueForLibrary();
    const targetKey = targetQueue.join('\u001f');
    if (targetKey !== currentQueueKey.current) {
      pendingPlay.current = { trackId: track.id, shouldPlay: true };
      setQueueIds(targetQueue);
    } else {
      const index = targetQueue.indexOf(track.id);
      if (index < 0) return;
      playlist.skipTo(index);
      setCurrentTrackId(track.id);
      await activateSystemControls(track);
      playlist.play();
    }
    setScreen('player');
  }

  async function togglePlayback() {
    if (!currentTrack && tracks.length) {
      await playTrack(tracks[0]);
      return;
    }
    if (!currentTrack) return;
    if (playback.playing) playlist.pause();
    else {
      await activateSystemControls(currentTrack);
      playlist.play();
    }
  }

  function nextTrack() {
    if (!queueTracks.length) return;
    if (shuffle && queueTracks.length > 1) {
      const choices = queueTracks.map((_, index) => index).filter(index => index !== playback.currentIndex);
      const nextIndex = choices[Math.floor(Math.random() * choices.length)];
      playlist.skipTo(nextIndex);
      playlist.play();
      return;
    }
    playlist.next();
  }

  function previousTrack() {
    if (playback.currentTime > 3) {
      playlist.seekTo(0);
      return;
    }
    playlist.previous();
  }

  function cycleRepeat() {
    setRepeatMode(value => value === 'none' ? 'all' : value === 'all' ? 'single' : 'none');
  }
async function importAudioFiles() {
  if (importing) return;
  setImporting(true);

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const known = new Set(
      tracks.map(track => `${track.fileName}:${track.size || 0}`)
    );

    const importedTracks = [];
    let skipped = 0;

    for (const asset of result.assets) {
      if (!asset?.uri || !asset?.name || !isSupportedAudio(asset.name)) {
        skipped++;
        continue;
      }

      const size = Number.isFinite(asset.size) ? asset.size : 0;
      const duplicateKey = size > 0 ? `${asset.name}:${size}` : null;

      if (duplicateKey && known.has(duplicateKey)) {
        skipped++;
        continue;
      }

      const id = createId();
      const extension = asset.name.split('.').pop().toLowerCase();

      const destination = new File(
        Paths.document,
        `foxsmusic-${id}.${extension}`
      );

      // DocumentPicker уже подготовил файл во внутреннем кэше.
      // Сначала пробуем сохранить его в постоянную папку.
      // Если копирование не удаётся, используем URI из кэша.
      let trackUri = asset.uri;

      try {
        const source = new File(asset.uri);
        await source.copy(destination);

        if (destination.exists) {
          trackUri = destination.uri;
        } else {
          console.warn(
            `FoxsMusic mobile: permanent copy unavailable for ${asset.name}; using cache`
          );
        }
      } catch (copyError) {
        console.warn(
          `FoxsMusic mobile: could not copy ${asset.name}; using picker cache URI`,
          copyError
        );
      }

      const parsed = parseTrackName(asset.name);

      importedTracks.push({
        id,
        title: parsed.title,
        artist: parsed.artist,
        album: '',
        fileName: asset.name,
        size,
        uri: trackUri,
        addedAt: Date.now() + importedTracks.length,
        favorite: false,
        duration: 0,
      });

      if (duplicateKey) known.add(duplicateKey);
    }

    if (importedTracks.length) {
      const nextTracks = [...tracks, ...importedTracks];

      setTracks(nextTracks);
      pendingPlay.current = null;
      setQueueIds(nextTracks.map(track => track.id));
    }

    Alert.alert(
      t.importDone,
      `${t.imported}: ${importedTracks.length}\n${t.skipped}: ${skipped}`
    );
  } catch (error) {
    console.error('FoxsMusic mobile import error', error);
    Alert.alert(t.importError, String(error?.message || error));
  } finally {
    setImporting(false);
  }
}


async function importMusicFolder() {
  if (importing) return;
  setImporting(true);
  try {
    if (Platform.OS !== 'android' || !LegacyFileSystem.StorageAccessFramework) {
      Alert.alert('FoxsMusic', language === 'en' ? 'Folder import is supported on Android.' : 'Импорт папки доступен на Android.');
      return;
    }
    const permission = await LegacyFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted || !permission.directoryUri) return;
    const folderName = decodeURIComponent(permission.directoryUri.split('/').pop() || 'Music');
    const entries = await LegacyFileSystem.StorageAccessFramework.readDirectoryAsync(permission.directoryUri);
    const known = new Set(tracks.map(track => `${track.fileName}:${track.size || 0}`));
    const importedTracks = [];
    let skipped = 0;
    for (const uri of entries) {
      const name = decodeURIComponent(uri.split('/').pop() || '');
      if (!isSupportedAudio(name)) { skipped++; continue; }
      if (tracks.some(track => track.fileName === name && track.sourceFolder === folderName)) { skipped++; continue; }
      const id = createId();
      const extension = name.split('.').pop().toLowerCase();
      const destination = `${LegacyFileSystem.documentDirectory}foxsmusic-${id}.${extension}`;
      let size = 0;
      try { const info = await LegacyFileSystem.getInfoAsync(uri, { size: true }); size = Number(info.size) || 0; } catch (_) {}
      const key = `${name}:${size}`;
      if (size > 0 && known.has(key)) { skipped++; continue; }
      await LegacyFileSystem.copyAsync({ from: uri, to: destination });
      const parsed = parseTrackName(name);
      importedTracks.push({ id, title: parsed.title, artist: parsed.artist, album: '', fileName: name, size, uri: destination, addedAt: Date.now() + importedTracks.length, favorite: false, duration: 0, sourceFolder: folderName });
      known.add(key);
    }
    if (importedTracks.length) {
      const nextTracks = [...tracks, ...importedTracks];
      setTracks(nextTracks);
      pendingPlay.current = null;
      setQueueIds(nextTracks.map(track => track.id));
    }
    Alert.alert(t.importDone, `${t.imported}: ${importedTracks.length}\n${t.skipped}: ${skipped}`);
  } catch (error) {
    console.error('FoxsMusic mobile folder import error', error);
    Alert.alert(t.importError, String(error?.message || error));
  } finally { setImporting(false); }
}


  function toggleFavorite(trackId) {
    setTracks(current => current.map(track => track.id === trackId ? { ...track, favorite: !track.favorite } : track));
  }

  function openCreatePlaylist() {
    setPlaylistModalMode('create');
    setPlaylistName('');
    setPendingTrackId(null);
    setPlaylistModalVisible(true);
  }

  function createPlaylistFromAddFlow() {
    setPlaylistModalMode('create');
    setPlaylistName('');
    setPlaylistModalVisible(true);
  }

  function openAddToPlaylist(trackId) {
    setPlaylistModalMode('add');
    setPendingTrackId(trackId);
    setPlaylistModalVisible(true);
  }

  function savePlaylist() {
    const name = playlistName.trim();
    if (!name) return;
    const newPlaylist = { id: createId(), name, trackIds: pendingTrackId ? [pendingTrackId] : [] };
    setPlaylists(current => [...current, newPlaylist]);
    setPlaylistModalVisible(false);
    setPlaylistName('');
  }

  function addTrackToPlaylist(playlistId) {
    if (!pendingTrackId) return;
    const targetPlaylist = playlists.find(item => item.id === playlistId);
    if (!targetPlaylist) return;
    const alreadyAdded = targetPlaylist.trackIds.includes(pendingTrackId);
    if (!alreadyAdded) {
      setPlaylists(current => current.map(item => item.id === playlistId
        ? { ...item, trackIds: [...item.trackIds, pendingTrackId] }
        : item));
    }
    setPlaylistModalVisible(false);
    Alert.alert('FoxsMusic', alreadyAdded ? t.alreadyAdded : t.added);
  }

  function openPlaylist(item) {
    setSelectedPlaylistId(item.id);
  }

  function playPlaylistTrack(track) {
    if (!playlistDetail) return playTrack(track);
    const ids = playlistDetail.trackIds.filter(id => tracks.some(trackItem => trackItem.id === id));
    playTrack(track, ids);
  }

  function renderTrack({ item, index, queue = 'library' }) {
    return (
      <TrackRow
        track={item}
        index={index}
        active={currentTrackId === item.id}
        language={language}
        onPlay={() => queue === 'playlist' ? playPlaylistTrack(item) : playTrack(item)}
        onFavorite={() => toggleFavorite(item.id)}
        onAdd={() => openAddToPlaylist(item.id)}
      />
    );
  }

  function renderLibraryHeader() {
    return (
      <View>
        <View style={styles.compactHero}>
          <View style={styles.compactHeroCopy}>
            <Text style={styles.compactHeroEyebrow}>FOXSMUSIC ORIGINAL</Text>
            <Text style={styles.compactHeroTitle}>{'Feel the dark.\nHear the fire.'}</Text>
            <Text style={styles.compactHeroCaption}>YOUR MUSIC · YOUR RULES</Text>
            <View style={styles.equalizerRow}>{[8,15,11,22,13,28,17,10,23,14,30,18,9,21,13,26,16,10].map((h, i) => <View key={i} style={[styles.equalizerBar, {height: h}]} />)}</View>
          </View>
          <Image source={require('./assets/desktop-logo.png')} style={styles.compactHeroLogo} resizeMode="contain" />
        </View>
        <View style={styles.screenHeading}>
          <View>
            <Text style={styles.eyebrow}>{t.collection}</Text>
            <Text style={styles.screenTitle}>{t.library}<Text style={styles.titleDot}>.</Text></Text>
            <Text style={styles.screenSubtitle}>{tracks.length} {t.tracks}</Text>
          </View>
          <Pressable onPress={importAudioFiles} disabled={importing} style={({ pressed }) => [styles.importCircle, pressed && styles.pressed]}>
            {importing ? <ActivityIndicator color={C.text} /> : <Text style={styles.importPlus}>＋</Text>}
          </Pressable>
        </View>
        <Pressable onPress={importAudioFiles} disabled={importing} style={({ pressed }) => [styles.importBanner, pressed && styles.pressed]}>
          <View style={styles.importBannerIcon}><Text style={styles.importBannerGlyph}>♫</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.importBannerTitle}>{importing ? '…' : t.import}</Text>
            <Text style={styles.importBannerSubtitle}>{t.importHint}</Text>
          </View>
          <Text style={styles.importBannerArrow}>›</Text>
        </Pressable>
        <Pressable onPress={importMusicFolder} disabled={importing} style={({ pressed }) => [styles.folderImportButton, pressed && styles.pressed]}><Text style={styles.folderImportGlyph}>▣</Text><Text style={styles.folderImportText}>{t.importFolder}</Text><Text style={styles.folderImportArrow}>›</Text></Pressable>
        <View style={styles.searchWrap}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.search}
            placeholderTextColor={C.subtle}
            selectionColor={C.red}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && <Pressable onPress={() => setSearch('')}><Text style={styles.clearSearch}>×</Text></Pressable>}
        </View>
        <View style={styles.filterRow}>
          <Pressable onPress={() => setLibraryFilter('all')} style={[styles.filterChip, libraryFilter === 'all' && styles.filterChipActive]}><Text style={[styles.filterText, libraryFilter === 'all' && styles.filterTextActive]}>{t.all}</Text></Pressable>
          <Pressable onPress={() => setLibraryFilter('favorites')} style={[styles.filterChip, libraryFilter === 'favorites' && styles.filterChipActive]}><Text style={[styles.filterText, libraryFilter === 'favorites' && styles.filterTextActive]}>♥ {t.favorites}</Text></Pressable>
          <Text style={styles.listCount}>{visibleTracks.length} {t.tracks}</Text>
        </View>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={C.background} />
        <Image source={require('./assets/foxsmusic-logo.png')} style={styles.loadingMascot} resizeMode="contain" />
        <Text style={styles.loadingBrand}>FOXSMUSIC</Text>
        <ActivityIndicator color={C.red} style={{ marginTop: 22 }} />
      </View>
    );
  }

  const playStateLabel = playback.playing ? 'Ⅱ' : '▶';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />
      <View style={styles.appRoot}>
        <View style={styles.topBar}>
          <View style={styles.brandMark}><Image source={require('./assets/desktop-logo.png')} style={styles.brandMarkImage} resizeMode="contain" /></View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>Foxs<Text style={styles.brandNameBold}>Music</Text></Text>
            <Text style={styles.brandEdition}>{t.edition}</Text>
          </View>
          <View style={styles.topSpacer} />
          <Pressable onPress={() => setScreen('settings')} style={styles.topAction}><Text style={styles.topActionGlyph}>⚙</Text></Pressable>
        </View>

        <View style={styles.content}>
          {screen === 'library' && (
            <FlatList
              data={visibleTracks}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => renderTrack({ item, index })}
              ListHeaderComponent={renderLibraryHeader}
              ListEmptyComponent={(
                <View style={styles.emptyState}>
                  <Image source={require('./assets/foxsmusic-logo.png')} style={styles.emptyMascot} resizeMode="contain" />
                  <Text style={styles.emptyTitle}>{tracks.length ? t.noTracks : t.noTracks}</Text>
                  <Text style={styles.emptySubtitle}>{tracks.length ? t.noTracksHint : t.noTracksHint}</Text>
                  <Pressable onPress={importAudioFiles} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{t.addFirst}</Text></Pressable>
                </View>
              )}
              contentContainerStyle={styles.libraryListContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {screen === 'player' && (
            <ScrollView contentContainerStyle={styles.playerScreen} showsVerticalScrollIndicator={false}>
              <View style={styles.playerHeaderLine}>
                <Text style={styles.eyebrow}>{t.nowPlaying}</Text>
                <Text style={styles.playerHeaderDot}>●</Text>
              </View>
              {currentTrack ? (
                <>
                  <View style={styles.playerArtworkFrame}>
                    <Artwork size={248} title={currentTrack.title} />
                  </View>
                  <View style={styles.playerTrackInfo}>
                    <Text numberOfLines={2} style={styles.playerTrackTitle}>{currentTrack.title}</Text>
                    <Text numberOfLines={1} style={styles.playerTrackArtist}>{currentTrack.artist || t.unknownArtist}</Text>
                    <Pressable onPress={() => toggleFavorite(currentTrack.id)} style={styles.playerHeart}>
                      <Text style={[styles.playerHeartText, currentTrack.favorite && styles.favoriteOn]}>{currentTrack.favorite ? '♥' : '♡'}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.seekBlock}>
                    <Pressable
                      onLayout={event => { seekWidth.current = Math.max(1, event.nativeEvent.layout.width); }}
                      onPress={event => {
                        if (!playback.duration) return;
                        const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / seekWidth.current));
                        playlist.seekTo(ratio * playback.duration);
                      }}
                      style={styles.seekTrack}
                    >
                      <View style={[styles.seekProgress, { width: `${playback.duration > 0 ? Math.min(100, (playback.currentTime / playback.duration) * 100) : 0}%` }]} />
                      <View style={[styles.seekKnob, { left: `${playback.duration > 0 ? Math.min(100, (playback.currentTime / playback.duration) * 100) : 0}%` }]} />
                    </Pressable>
                    <View style={styles.seekLabels}><Text style={styles.seekTime}>{formatTime(playback.currentTime)}</Text><Text style={styles.seekTime}>{formatTime(playback.duration)}</Text></View>
                  </View>
                  <View style={styles.transportRow}>
                    <ActionButton label="⤨" active={shuffle} onPress={() => setShuffle(value => !value)} accessibilityLabel={t.shuffle} />
                    <ActionButton label="⏮" onPress={previousTrack} accessibilityLabel={t.previous} />
                    <Pressable onPress={togglePlayback} style={styles.mainPlayButton} accessibilityRole="button" accessibilityLabel={playback.playing ? t.pause : t.play}>
                      <Text style={styles.mainPlayGlyph}>{playStateLabel}</Text>
                    </Pressable>
                    <ActionButton label="⏭" onPress={nextTrack} accessibilityLabel={t.next} />
                    <ActionButton label={repeatMode === 'single' ? '↻¹' : '↻'} active={repeatMode !== 'none'} onPress={cycleRepeat} accessibilityLabel={repeatMode === 'none' ? t.repeatOff : repeatMode === 'all' ? t.repeatAll : t.repeatOne} />
                  </View>
                  <Text style={styles.repeatHint}>{repeatMode === 'none' ? t.repeatOff : repeatMode === 'all' ? t.repeatAll : t.repeatOne}</Text>
                  <View style={styles.queueHeader}><Text style={styles.eyebrow}>{t.queue}</Text><Text style={styles.queueCount}>{queueTracks.length}</Text></View>
                  {queueTracks.slice(Math.max(0, playback.currentIndex), Math.max(0, playback.currentIndex) + 5).map((track, index) => (
                    <TrackRow key={track.id} track={track} index={index} active={currentTrackId === track.id} language={language} onPlay={() => playTrack(track, queueIds)} onFavorite={() => toggleFavorite(track.id)} onAdd={() => openAddToPlaylist(track.id)} />
                  ))}
                </>
              ) : (
                <View style={styles.playerEmpty}>
                  <Artwork size={180} title="F" />
                  <Text style={styles.emptyTitle}>{t.nothingPlaying}</Text>
                  <Text style={styles.emptySubtitle}>{t.chooseTrack}</Text>
                  <Pressable style={styles.primaryButton} onPress={() => setScreen('library')}><Text style={styles.primaryButtonText}>{t.library}</Text></Pressable>
                </View>
              )}
            </ScrollView>
          )}

          {screen === 'playlists' && (
            <ScrollView contentContainerStyle={styles.simpleScreen} showsVerticalScrollIndicator={false}>
              <View style={styles.screenHeading}>
                <View>
                  <Text style={styles.eyebrow}>{t.collection}</Text>
                  <Text style={styles.screenTitle}>{t.playlists}<Text style={styles.titleDot}>.</Text></Text>
                  <Text style={styles.screenSubtitle}>{playlists.length} · {t.tracks}</Text>
                </View>
                <Pressable onPress={openCreatePlaylist} style={styles.importCircle}><Text style={styles.importPlus}>＋</Text></Pressable>
              </View>
              {playlistDetail ? (
                <>
                  <Pressable onPress={() => setSelectedPlaylistId(null)} style={styles.backButton}><Text style={styles.backButtonText}>‹  {t.back}</Text></Pressable>
                  <Text style={styles.playlistDetailTitle}>{playlistDetail.name}</Text>
                  <Text style={styles.screenSubtitle}>{playlistDetail.trackIds.length} {t.playlistTracks}</Text>
                  {playlistDetail.trackIds.map((id, index) => {
                    const track = tracks.find(item => item.id === id);
                    return track ? <TrackRow key={id} track={track} index={index} active={currentTrackId === id} language={language} onPlay={() => playPlaylistTrack(track)} onFavorite={() => toggleFavorite(id)} onAdd={() => openAddToPlaylist(id)} /> : null;
                  })}
                  {!playlistDetail.trackIds.length && <Text style={styles.emptySubtitle}>{t.emptyPlaylist}</Text>}
                </>
              ) : (
                <>
                  {playlists.map(item => (
                    <Pressable key={item.id} onPress={() => openPlaylist(item)} style={({ pressed }) => [styles.playlistCard, pressed && styles.pressed]}>
                      <View style={styles.playlistArtwork}><Text style={styles.playlistArtworkGlyph}>♫</Text></View>
                      <View style={styles.playlistCopy}><Text style={styles.playlistName}>{item.name}</Text><Text style={styles.playlistCount}>{item.trackIds.length} {t.tracks}</Text></View>
                      <Text style={styles.playlistArrow}>›</Text>
                    </Pressable>
                  ))}
                  {!playlists.length && (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyDisc}><Text style={styles.emptyDiscText}>≡</Text></View>
                      <Text style={styles.emptyTitle}>{t.emptyPlaylists}</Text>
                      <Text style={styles.emptySubtitle}>{t.emptyPlaylistsHint}</Text>
                      <Pressable onPress={openCreatePlaylist} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{t.createFirst}</Text></Pressable>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}

          {screen === 'settings' && (
            <ScrollView contentContainerStyle={styles.simpleScreen} showsVerticalScrollIndicator={false}>
              <View style={styles.screenHeading}>
                <View><Text style={styles.eyebrow}>FOXSMUSIC MOBILE</Text><Text style={styles.screenTitle}>{t.settings}<Text style={styles.titleDot}>.</Text></Text></View>
              </View>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsLabel}>{t.language}</Text>
                <View style={styles.languageRow}>
                  {['ru', 'en', 'de'].map(code => (
                    <Pressable key={code} onPress={() => setLanguage(code)} style={[styles.languageChip, language === code && styles.languageChipActive]}>
                      <Text style={[styles.languageChipText, language === code && styles.languageChipTextActive]}>{code.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsLabel}>{t.storage}</Text>
                <Text style={styles.settingsDescription}>{t.storageHint}</Text>
              </View>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsLabel}>{t.background}</Text>
                <Text style={styles.settingsDescription}>{t.backgroundOn}</Text>
              </View>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsLabel}>{t.supported}</Text>
                <Text style={styles.settingsDescription}>MP3 · M4A · AAC · WAV · FLAC · OGG · OPUS</Text>
              </View>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsLabel}>{t.about}</Text>
                <Text style={styles.settingsDescription}>{t.version}</Text>
                <Text style={styles.settingsDescription}>FoxsMusic Desktop companion · MrArtyomRedDarkFox</Text>
              </View>
            </ScrollView>
          )}
        </View>

        {currentTrack && screen !== 'player' && (
          <Pressable onPress={() => setScreen('player')} style={styles.miniPlayer}>
            <Artwork size={42} title={currentTrack.title} />
            <View style={styles.miniPlayerCopy}>
              <Text numberOfLines={1} style={styles.miniPlayerTitle}>{currentTrack.title}</Text>
              <Text numberOfLines={1} style={styles.miniPlayerArtist}>{currentTrack.artist || t.unknownArtist}</Text>
            </View>
            <Pressable onPress={togglePlayback} hitSlop={10} style={styles.miniPlayButton}><Text style={styles.miniPlayGlyph}>{playStateLabel}</Text></Pressable>
            <Pressable onPress={nextTrack} hitSlop={10} style={styles.miniNextButton}><Text style={styles.miniNextGlyph}>⏭</Text></Pressable>
          </Pressable>
        )}

        <View style={styles.bottomNav}>
          {[
            ['library', '♫', t.library],
            ['playlists', '≡', t.playlists],
            ['player', '◉', t.player],
            ['settings', '⚙', t.settings],
          ].map(([id, glyph, label]) => (
            <Pressable key={id} onPress={() => setScreen(id)} style={styles.navItem}>
              <Text style={[styles.navGlyph, screen === id && styles.navGlyphActive]}>{glyph}</Text>
              <Text style={[styles.navLabel, screen === id && styles.navLabelActive]}>{label}</Text>
              {screen === id && <View style={styles.navIndicator} />}
            </Pressable>
          ))}
        </View>
      </View>

      <Modal visible={playlistModalVisible} transparent animationType="fade" onRequestClose={() => setPlaylistModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{playlistModalMode === 'create' ? t.createPlaylist : t.choosePlaylist}</Text>
            {playlistModalMode === 'create' ? (
              <>
                <TextInput
                  value={playlistName}
                  onChangeText={setPlaylistName}
                  placeholder={t.playlistName}
                  placeholderTextColor={C.subtle}
                  selectionColor={C.red}
                  style={styles.modalInput}
                  autoFocus
                  maxLength={64}
                  returnKeyType="done"
                  onSubmitEditing={savePlaylist}
                />
                <View style={styles.modalActions}>
                  <Pressable onPress={() => setPlaylistModalVisible(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>{t.cancel}</Text></Pressable>
                  <Pressable onPress={savePlaylist} style={styles.modalCreate}><Text style={styles.modalCreateText}>{t.create}</Text></Pressable>
                </View>
              </>
            ) : (
              <>
                {playlists.map(item => (
                  <Pressable key={item.id} onPress={() => addTrackToPlaylist(item.id)} style={styles.modalPlaylistChoice}>
                    <Text style={styles.modalPlaylistChoiceText}>{item.name}</Text>
                    <Text style={styles.modalPlaylistChoiceCount}>{item.trackIds.length}</Text>
                  </Pressable>
                ))}
                {!playlists.length && <Text style={styles.settingsDescription}>{t.noPlaylists}</Text>}
                <View style={styles.modalActions}>
                  <Pressable onPress={() => setPlaylistModalVisible(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>{t.cancel}</Text></Pressable>
                  <Pressable onPress={createPlaylistFromAddFlow} style={styles.modalCreate}><Text style={styles.modalCreateText}>{t.createPlaylist}</Text></Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  appRoot: { flex: 1, backgroundColor: C.background },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
  loadingMascot: { width: 220, height: 220, marginBottom: 2 },
  loadingBrand: { marginTop: 18, color: C.text, fontSize: 19, fontWeight: '900', letterSpacing: 4 },
  topBar: { height: 70, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#281820' },
  brandMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#260A13', borderWidth: 1, borderColor: '#792033', alignItems: 'center', justifyContent: 'center', shadowColor: C.red, shadowOpacity: 0.23, shadowRadius: 13, elevation: 5 },
  brandMarkText: { color: C.red, fontSize: 25, fontWeight: '900', fontStyle: 'italic' },
  brandMarkImage: { width: 38, height: 38 },
  brandCopy: { marginLeft: 11 },
  brandName: { color: C.text, fontSize: 23, fontWeight: '400', letterSpacing: -1.2 },
  brandNameBold: { color: '#FFF4F6', fontWeight: '900' },
  brandEdition: { color: C.subtle, letterSpacing: 2.1, fontSize: 7, marginTop: 1, fontWeight: '800' },
  topSpacer: { flex: 1 },
  topAction: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  topActionGlyph: { color: C.muted, fontSize: 20 },
  content: { flex: 1 },
  libraryListContent: { paddingHorizontal: 18, paddingBottom: 24 },
  simpleScreen: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 28 },
  compactHero: { minHeight: 108, marginTop: 12, marginBottom: 4, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#702039', backgroundColor: '#10070B', flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingVertical: 10, position: 'relative' },
  compactHeroCopy: { flex: 1, zIndex: 1 },
  compactHeroEyebrow: { color: '#B87585', fontSize: 7, letterSpacing: 1.5, fontWeight: '900' },
  compactHeroTitle: { color: C.text, fontSize: 17, lineHeight: 19, fontWeight: '900', marginTop: 6, letterSpacing: -0.4 },
  compactHeroCaption: { color: C.muted, fontSize: 6, letterSpacing: 1.1, marginTop: 5 },
  compactHeroLogo: { width: 108, height: 108, marginRight: -2, opacity: 0.98 },
  equalizerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 31, marginTop: 4 },
  equalizerBar: { width: 3, borderRadius: 2, backgroundColor: C.red, opacity: 0.8 },
  folderImportButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#48202B', backgroundColor: '#110B10', paddingHorizontal: 12, marginTop: -5, marginBottom: 13 },
  folderImportGlyph: { color: C.red, fontSize: 16, marginRight: 9 },
  folderImportText: { color: C.muted, fontSize: 10, fontWeight: '800', flex: 1 },
  folderImportArrow: { color: C.red, fontSize: 22 },
  screenHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, paddingBottom: 18 },
  eyebrow: { color: '#8E5361', fontWeight: '900', fontSize: 9, letterSpacing: 2.4 },
  screenTitle: { color: C.text, fontWeight: '900', fontSize: 31, letterSpacing: -1.1, marginTop: 3 },
  titleDot: { color: C.red },
  screenSubtitle: { color: C.muted, fontSize: 11, marginTop: 4 },
  importCircle: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#3A0D1A', borderWidth: 1, borderColor: '#8F2036', alignItems: 'center', justifyContent: 'center' },
  importPlus: { color: '#FFF1F4', fontSize: 30, lineHeight: 34, marginTop: -2 },
  importBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#1A0D13', borderRadius: 16, borderWidth: 1, borderColor: '#5A1B2B', marginBottom: 14 },
  importBannerIcon: { width: 45, height: 45, borderRadius: 13, backgroundColor: '#3A0C19', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  importBannerGlyph: { color: C.red, fontSize: 25, fontWeight: '800' },
  importBannerTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  importBannerSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  importBannerArrow: { color: C.red, fontSize: 29, marginHorizontal: 5 },
  searchWrap: { height: 47, borderRadius: 13, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  searchGlyph: { color: C.red, fontSize: 24, marginRight: 8 },
  searchInput: { color: C.text, flex: 1, height: 45, fontSize: 12 },
  clearSearch: { color: C.muted, fontSize: 23, paddingHorizontal: 3 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 8, gap: 8 },
  filterChip: { borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  filterChipActive: { backgroundColor: '#45101D', borderColor: '#9C263C' },
  filterText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#FFF0F3' },
  listCount: { color: C.subtle, marginLeft: 'auto', fontSize: 10 },
  trackRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 8, marginBottom: 5, borderRadius: 13, backgroundColor: '#100D12', borderWidth: 1, borderColor: '#211820' },
  trackRowActive: { backgroundColor: '#1E0D15', borderColor: '#6C2031' },
  trackMain: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  artwork: { backgroundColor: '#1B0C14', borderWidth: 1, borderColor: '#672034', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  artworkGlow: { position: 'absolute', width: '90%', height: '90%', borderRadius: 100, backgroundColor: '#8C172F', opacity: 0.12, transform: [{ scaleX: 1.2 }, { scaleY: 0.75 }] },
  artworkGlyph: { color: '#F53A55', fontWeight: '900', fontStyle: 'italic', textShadowColor: '#A80D2C', textShadowRadius: 12 },
  artworkWord: { color: '#94727C', fontSize: 6, letterSpacing: 2, fontWeight: '900', position: 'absolute', bottom: 6 },
  trackCopy: { flex: 1, marginLeft: 11, minWidth: 0 },
  trackTitle: { color: '#EEE4E8', fontSize: 12, fontWeight: '800' },
  trackTitleActive: { color: '#FF6B80' },
  trackArtist: { color: C.muted, fontSize: 10, marginTop: 5 },
  trackMeta: { color: C.subtle, fontSize: 8, marginTop: 4 },
  rowIconButton: { width: 33, height: 40, alignItems: 'center', justifyContent: 'center' },
  rowIcon: { color: '#9E8992', fontSize: 19 },
  favoriteOn: { color: C.red },
  actionButton: { width: 38, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  actionButtonSmall: { width: 31, height: 35 },
  actionButtonActive: { borderColor: '#8B2035', backgroundColor: '#3A101D' },
  actionButtonText: { color: C.muted, fontSize: 17, fontWeight: '800' },
  actionButtonTextSmall: { fontSize: 14 },
  actionButtonTextActive: { color: C.red },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  emptyState: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 26 },
  emptyMascot: { width: 218, height: 218, marginBottom: 14 },
  emptyDiscText: { color: C.red, fontSize: 42, fontWeight: '300' },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  primaryButton: { backgroundColor: C.redDark, borderWidth: 1, borderColor: '#E32A45', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  primaryButtonText: { color: '#FFF5F7', fontSize: 11, fontWeight: '900' },
  playerScreen: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 30 },
  playerHeaderLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  playerHeaderDot: { color: C.green, fontSize: 10 },
  playerArtworkFrame: { alignItems: 'center', paddingVertical: 5, marginBottom: 23 },
  playerTrackInfo: { alignItems: 'center', paddingHorizontal: 12, position: 'relative' },
  playerTrackTitle: { color: C.text, fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.4 },
  playerTrackArtist: { color: C.muted, fontSize: 12, marginTop: 7 },
  playerHeart: { position: 'absolute', right: 0, top: 3, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  playerHeartText: { color: C.muted, fontSize: 24 },
  seekBlock: { marginTop: 31, marginBottom: 21 },
  seekTrack: { height: 8, borderRadius: 10, backgroundColor: '#38242D', justifyContent: 'center' },
  seekProgress: { height: 8, borderRadius: 10, backgroundColor: C.red },
  seekKnob: { position: 'absolute', marginLeft: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF0F4', borderWidth: 2, borderColor: C.red },
  seekLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  seekTime: { color: C.subtle, fontSize: 9, fontVariant: ['tabular-nums'] },
  transportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  mainPlayButton: { width: 68, height: 68, borderRadius: 24, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', shadowColor: C.red, shadowRadius: 16, shadowOpacity: 0.3, elevation: 8 },
  mainPlayGlyph: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  repeatHint: { color: C.subtle, fontSize: 9, textAlign: 'center', marginTop: 11, marginBottom: 27 },
  queueHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 17, marginBottom: 9 },
  queueCount: { color: C.subtle, fontSize: 10 },
  playerEmpty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 20 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingRight: 20 },
  backButtonText: { color: C.red, fontWeight: '800', fontSize: 12 },
  playlistDetailTitle: { color: C.text, fontSize: 23, fontWeight: '900', marginTop: 5 },
  playlistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 15, padding: 12, marginBottom: 9 },
  playlistArtwork: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#370D1A', borderWidth: 1, borderColor: '#79223A' },
  playlistArtworkGlyph: { color: C.red, fontSize: 27 },
  playlistCopy: { flex: 1, marginLeft: 12 },
  playlistName: { color: C.text, fontWeight: '800', fontSize: 12 },
  playlistCount: { color: C.muted, marginTop: 5, fontSize: 10 },
  playlistArrow: { color: C.red, fontSize: 27, paddingHorizontal: 8 },
  settingsCard: { padding: 16, borderRadius: 15, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, marginBottom: 11 },
  settingsLabel: { color: C.text, fontSize: 12, fontWeight: '900', marginBottom: 9 },
  settingsDescription: { color: C.muted, fontSize: 10, lineHeight: 17 },
  languageRow: { flexDirection: 'row', gap: 8 },
  languageChip: { minWidth: 53, paddingVertical: 8, borderRadius: 9, alignItems: 'center', backgroundColor: '#0E0B10', borderWidth: 1, borderColor: C.line },
  languageChipActive: { backgroundColor: '#48101F', borderColor: C.redDark },
  languageChipText: { color: C.muted, fontWeight: '900', fontSize: 10 },
  languageChipTextActive: { color: '#FFF' },
  miniPlayer: { minHeight: 61, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#1A0D14', borderTopWidth: 1, borderTopColor: '#6A1A30' },
  miniPlayerCopy: { flex: 1, marginLeft: 10, minWidth: 0 },
  miniPlayerTitle: { color: C.text, fontSize: 11, fontWeight: '900' },
  miniPlayerArtist: { color: C.muted, fontSize: 9, marginTop: 3 },
  miniPlayButton: { width: 37, height: 37, alignItems: 'center', justifyContent: 'center' },
  miniPlayGlyph: { color: C.red, fontSize: 21, fontWeight: '900' },
  miniNextButton: { width: 34, height: 37, alignItems: 'center', justifyContent: 'center' },
  miniNextGlyph: { color: C.muted, fontSize: 17 },
  bottomNav: { height: 66, flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#0C090D', borderTopWidth: 1, borderTopColor: '#2A1B23', paddingHorizontal: 4 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', gap: 2 },
  navGlyph: { fontSize: 20, color: C.subtle, height: 23 },
  navGlyphActive: { color: C.red },
  navLabel: { color: C.subtle, fontSize: 8, fontWeight: '700' },
  navLabelActive: { color: '#F7CFD7' },
  navIndicator: { position: 'absolute', bottom: 0, width: 25, height: 2, backgroundColor: C.red, borderRadius: 2 },
  modalBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.78)' },
  modalCard: { backgroundColor: '#1A1016', borderRadius: 20, borderWidth: 1, borderColor: '#702039', padding: 19 },
  modalTitle: { color: C.text, fontSize: 17, fontWeight: '900', marginBottom: 16 },
  modalInput: { height: 47, borderRadius: 11, paddingHorizontal: 13, color: C.text, backgroundColor: '#0B080C', borderWidth: 1, borderColor: C.line, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  modalCancel: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: C.line },
  modalCancelText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  modalCreate: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 10, backgroundColor: C.redDark, borderWidth: 1, borderColor: C.red },
  modalCreateText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  modalPlaylistChoice: { paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#100C11', borderWidth: 1, borderColor: C.line, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  modalPlaylistChoiceText: { color: C.text, fontSize: 11, fontWeight: '800' },
  modalPlaylistChoiceCount: { color: C.subtle, fontSize: 10 },
});
