import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  FlatList,
  Image,
  Modal,
  Platform,
  PanResponder,
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
import { File, FileMode, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import {
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  useAudioPlaylist,
  useAudioPlaylistStatus,
} from 'expo-audio';
import { createId, formatTime, formatDateTime, isSupportedAudio, parseTrackName, sortTracks, sortMostPlayed, isValidHexColor, parseId3v2Tag, normalizeFileTimestamp } from './src/core';

const STORAGE_KEY = 'foxsmusic-mobile-library-v1';
const MUSIC_FOLDER_KEY = 'foxsmusic-mobile-music-folder-v1';
const MAX_IMPORT_FILES = 250;
const METADATA_REPAIR_BATCH = 40;
const MAX_FOLDER_DEPTH = 8;
const DEFAULT_PROFILE = { name: 'MrArtyomRedDarkFox', avatarUri: null, accentColor: '#F12743', backgroundColor: '#08070A', panelStyle: 'classic', season: 'none', backgroundImageUri: null };
const ACCENT_PRESETS = ['#F12743', '#FF5A36', '#E43B7A', '#9A5BFF', '#477BFF', '#20A58A', '#E0A52B', '#E8E8EC'];
const BACKGROUND_PRESETS = ['#08070A', '#100A13', '#16080D', '#111216', '#090E17'];
const SEASON_THEMES = {
  halloween: { accent: '#F08A42', background: '#0D0809', panel: '#1B1218', panelSoft: '#28171D', atmosphere: 'rgba(114, 48, 20, 0.14)', particles: ['🦇', '✦', '🕸', '🕯', '✧'] },
  christmas: { accent: '#79C9E8', background: '#071019', panel: '#111A22', panelSoft: '#172532', atmosphere: 'rgba(38, 94, 132, 0.15)', particles: ['❄', '✧', '❅', '✨', '❆'] },
  birthday: { accent: '#D59AD6', background: '#100B14', panel: '#1D1420', panelSoft: '#291A2B', atmosphere: 'rgba(108, 60, 116, 0.15)', particles: ['🎊', '🍬', '✦', '🎂', '✧'] },
};
const SEASONS = { none: [], ...Object.fromEntries(Object.entries(SEASON_THEMES).map(([key, value]) => [key, value.particles])) };
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
    import: 'Добавить музыку', importHint: 'Выбери аудиофайлы на телефоне', importFolder: 'Подключить папку Music', folderConnected: 'Папка Music подключена · изменить', scanningFolder: 'Сканируем папку Music…', rescanFolder: 'Повторно сканировать папку', sortBy: 'СОРТИРОВКА', sortRecent: 'Недавно добавленные', sortTitle: 'По названию', sortArtist: 'По исполнителю', sources: 'ИСТОЧНИКИ МУЗЫКИ', allSources: 'Все папки', importedFiles: 'Импортированные файлы', addedOn: 'Добавлен', search: 'Поиск трека или исполнителя',
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
    supported: 'Поддерживаемые форматы', about: 'О приложении', version: 'Версия 0.3.1 · Android',
    importDone: 'Импорт завершён', imported: 'Добавлено файлов', skipped: 'Пропущено неподдерживаемых или повторных файлов',
    importError: 'Не удалось импортировать файл', permissionTitle: 'Доступ к уведомлениям',
    permissionHint: 'Разрешение нужно Android для отображения системных кнопок управления музыкой.',
    ok: 'Понятно', createFirst: 'Создай первый плейлист', playlistTracks: 'треков в плейлисте',
    smartRecent: 'НЕДАВНО ДОБАВЛЕННЫЕ', smartFrequent: 'ЧАСТО ПРОСЛУШИВАЕМЫЕ', playedTimes: 'прослушиваний', noPlayed: 'Пока нет статистики прослушиваний', sourceDate: 'Дата исходного файла',
    profile: 'ПРОФИЛЬ', profileName: 'Имя профиля', profileAvatar: 'Аватар профиля', chooseAvatar: 'Выбрать аватар', removeAvatar: 'Удалить аватар',
    appearance: 'ОФОРМЛЕНИЕ', accentColor: 'Основной цвет', backgroundColor: 'Цвет фона', panelStyle: 'Стиль карточек', styleClassic: 'Классический', styleSoft: 'Мягкий', styleGlass: 'Стекло', customColor: 'Свой HEX-цвет', applyColor: 'Применить',
    season: 'Сезонный фон', noSeason: 'Отключён', halloween: 'Хеллоуин', christmas: 'Новый год', birthday: 'День рождения', seasonPaletteHint: 'Сезон автоматически меняет акцент, оттенок панелей и фоновые эффекты. Твой основной цвет вернётся при отключении сезона.', artworkSettingsLabel: 'Обложки музыки', artworkHint: 'FoxsMusic читает встроенные обложки MP3 и ищет cover.jpg, folder.jpg и album.png в музыкальных папках. Для остальных форматов используются обложки папки.', speed: 'СКОРОСТЬ', volume: 'ГРОМКОСТЬ', back10: '−10 сек', forward10: '+10 сек',
    customBackground: 'Собственная картинка фона', chooseBackground: 'Выбрать изображение', removeBackground: 'Удалить изображение', resetProfile: 'Сбросить оформление и профиль', swipeHint: 'Листай экраны свайпом влево или вправо',
    back: 'Назад', emptyPlaylist: 'В этом плейлисте пока нет треков',
  },
  en: {
    library: 'Library', playlists: 'Playlists', player: 'Player', settings: 'Settings',
    edition: 'ANDROID EDITION', collection: 'YOUR MUSIC', localLibrary: 'Local library',
    import: 'Add music', importHint: 'Choose audio files on your phone', importFolder: 'Connect Music folder', folderConnected: 'Music folder connected · change', scanningFolder: 'Scanning Music folder…', rescanFolder: 'Rescan connected folder', sortBy: 'SORT BY', sortRecent: 'Recently added', sortTitle: 'By title', sortArtist: 'By artist', sources: 'MUSIC SOURCES', allSources: 'All folders', importedFiles: 'Imported files', addedOn: 'Added', search: 'Search tracks or artists',
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
    supported: 'Supported formats', about: 'About', version: 'Version 0.3.1 · Android',
    importDone: 'Import complete', imported: 'Files added', skipped: 'Unsupported or duplicate files skipped',
    importError: 'Could not import file', permissionTitle: 'Notification access',
    permissionHint: 'Android uses this permission to show system music controls.',
    ok: 'OK', createFirst: 'Create your first playlist', playlistTracks: 'tracks in playlist',
    smartRecent: 'RECENTLY ADDED', smartFrequent: 'MOST PLAYED', playedTimes: 'plays', noPlayed: 'No listening stats yet', sourceDate: 'Source file date',
    profile: 'PROFILE', profileName: 'Profile name', profileAvatar: 'Profile avatar', chooseAvatar: 'Choose avatar', removeAvatar: 'Remove avatar',
    appearance: 'APPEARANCE', accentColor: 'Accent color', backgroundColor: 'Background color', panelStyle: 'Card style', styleClassic: 'Classic', styleSoft: 'Soft', styleGlass: 'Glass', customColor: 'Custom HEX color', applyColor: 'Apply',
    season: 'Seasonal background', noSeason: 'Off', halloween: 'Halloween', christmas: 'Christmas', birthday: 'Birthday', seasonPaletteHint: 'The season changes the accent, panel tint and background effects. Your custom accent returns when the season is turned off.', artworkSettingsLabel: 'Music artwork', artworkHint: 'FoxsMusic reads embedded MP3 covers and looks for cover.jpg, folder.jpg and album.png in music folders. Other formats use folder artwork.', speed: 'SPEED', volume: 'VOLUME', back10: '−10 sec', forward10: '+10 sec',
    customBackground: 'Custom background image', chooseBackground: 'Choose image', removeBackground: 'Remove image', resetProfile: 'Reset profile and appearance', swipeHint: 'Swipe left or right to change screens',
    back: 'Back', emptyPlaylist: 'This playlist has no tracks yet',
  },
  de: {
    library: 'Mediathek', playlists: 'Playlists', player: 'Player', settings: 'Einstellungen',
    edition: 'ANDROID EDITION', collection: 'DEINE MUSIK', localLibrary: 'Lokale Mediathek',
    import: 'Musik hinzufügen', importHint: 'Audiodateien auf dem Smartphone auswählen', importFolder: 'Musikordner verbinden', folderConnected: 'Musikordner verbunden · ändern', scanningFolder: 'Musikordner wird durchsucht…', rescanFolder: 'Musikordner erneut durchsuchen', sortBy: 'SORTIEREN NACH', sortRecent: 'Kürzlich hinzugefügt', sortTitle: 'Nach Titel', sortArtist: 'Nach Interpret', sources: 'MUSIKQUELLEN', allSources: 'Alle Ordner', importedFiles: 'Importierte Dateien', addedOn: 'Hinzugefügt', search: 'Titel oder Interpret suchen',
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
    supported: 'Unterstützte Formate', about: 'Über die App', version: 'Version 0.3.1 · Android',
    importDone: 'Import abgeschlossen', imported: 'Dateien hinzugefügt', skipped: 'Nicht unterstützte oder doppelte Dateien übersprungen',
    importError: 'Datei konnte nicht importiert werden', permissionTitle: 'Benachrichtigungszugriff',
    permissionHint: 'Android benötigt diese Berechtigung für die System-Musiksteuerung.',
    ok: 'OK', createFirst: 'Erstelle deine erste Playlist', playlistTracks: 'Titel in der Playlist',
    smartRecent: 'KÜRZLICH HINZUGEFÜGT', smartFrequent: 'AM HÄUFIGSTEN', playedTimes: 'Wiedergaben', noPlayed: 'Noch keine Wiedergabestatistik', sourceDate: 'Dateidatum',
    profile: 'PROFIL', profileName: 'Profilname', profileAvatar: 'Profilbild', chooseAvatar: 'Profilbild auswählen', removeAvatar: 'Profilbild entfernen',
    appearance: 'DESIGN', accentColor: 'Akzentfarbe', backgroundColor: 'Hintergrundfarbe', panelStyle: 'Kartenstil', styleClassic: 'Klassisch', styleSoft: 'Sanft', styleGlass: 'Glas', customColor: 'Eigene HEX-Farbe', applyColor: 'Anwenden',
    season: 'Saisonaler Hintergrund', noSeason: 'Aus', halloween: 'Halloween', christmas: 'Weihnachten', birthday: 'Geburtstag', seasonPaletteHint: 'Die Saison ändert Akzentfarbe, Kartenfarben und Hintergrundeffekte. Deine eigene Akzentfarbe erscheint wieder, wenn die Saison ausgeschaltet wird.', artworkSettingsLabel: 'Musik-Cover', artworkHint: 'FoxsMusic liest eingebettete MP3-Cover und sucht cover.jpg, folder.jpg und album.png in Musikordnern. Andere Formate verwenden das Ordner-Cover.', speed: 'GESCHWINDIGKEIT', volume: 'LAUTSTÄRKE', back10: '−10 Sek.', forward10: '+10 Sek.',
    customBackground: 'Eigenes Hintergrundbild', chooseBackground: 'Bild auswählen', removeBackground: 'Bild entfernen', resetProfile: 'Profil und Design zurücksetzen', swipeHint: 'Wische nach links oder rechts, um den Bildschirm zu wechseln',
    back: 'Zurück', emptyPlaylist: 'Diese Playlist enthält noch keine Titel',
  },
};

function Artwork({ size = 54, title = 'F', imageUri = null }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [imageUri]);
  const hasArtwork = Boolean(imageUri) && !imageFailed;
  return (
    <View style={[styles.artwork, { width: size, height: size, borderRadius: Math.max(12, size * 0.2) }]}>
      {hasArtwork ? (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" onError={() => setImageFailed(true)} />
      ) : (
        <>
          <View style={styles.artworkGlow} />
          <Image source={require('./assets/foxsmusic-logo.png')} style={{ width: '84%', height: '84%' }} resizeMode="contain" />
        </>
      )}
    </View>
  );
}

function SeasonalEffects({ season, theme }) {
  const symbols = SEASONS[season] || [];
  const valuesRef = useRef(null);
  if (!valuesRef.current) valuesRef.current = Array.from({ length: 18 }, () => new Animated.Value(0));
  const values = valuesRef.current;
  useEffect(() => {
    const loops = values.map((value, index) => {
      value.setValue(0);
      if (!symbols.length) return null;
      const loop = Animated.loop(Animated.sequence([
        Animated.delay(index * 260),
        Animated.timing(value, { toValue: 1, duration: 8200 + (index % 6) * 780, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 1, useNativeDriver: true }),
      ]));
      loop.start();
      return loop;
    });
    return () => loops.forEach(loop => loop?.stop());
  }, [season]);
  if (!symbols.length) return null;
  return (
    <View pointerEvents="none" style={styles.seasonLayer}>
      {values.map((value, index) => {
        const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [-50, 1100] });
        const translateX = value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (index % 2 ? 1 : -1) * (12 + index * 1.8), (index % 2 ? -1 : 1) * 8] });
        const opacity = value.interpolate({ inputRange: [0, 0.12, 0.82, 1], outputRange: [0, 0.72, 0.58, 0] });
        const symbol = symbols[index % symbols.length];
        return <Animated.Text key={`${season}-${index}`} style={[styles.seasonParticle, { left: `${4 + ((index * 29) % 93)}%`, color: theme?.accent || '#F7D7E1', opacity, transform: [{ translateX }, { translateY }, { rotate: `${(index % 2 ? 1 : -1) * (index * 13 + 8)}deg` }] }]}>{symbol}</Animated.Text>;
      })}
    </View>
  );
}

function ActionButton({ label, onPress, active = false, small = false, accessibilityLabel, accentColor = C.red }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.actionButton,
        small && styles.actionButtonSmall,
        active && [styles.actionButtonActive, { borderColor: accentColor, backgroundColor: `${accentColor}26` }],
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionButtonText, active && [styles.actionButtonTextActive, { color: accentColor }], small && styles.actionButtonTextSmall]}>{label}</Text>
    </Pressable>
  );
}

function TrackRow({ track, index, active, language, onPlay, onFavorite, onAdd, playCount = 0, accentColor = C.red, panelBackground = '#100D12' }) {
  const t = COPY[language];
  return (
    <View style={[styles.trackRow, active && styles.trackRowActive, { backgroundColor: active ? `${accentColor}20` : panelBackground, borderColor: active ? accentColor : C.line }]}>
      <Pressable style={styles.trackMain} onPress={onPlay} accessibilityRole="button">
        <Artwork title={track.title} imageUri={track.artworkUri} />
        <View style={styles.trackCopy}>
          <Text numberOfLines={1} style={[styles.trackTitle, active && [styles.trackTitleActive, { color: accentColor }]]}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.trackArtist}>{track.artist || t.unknownArtist}{track.album ? ` · ${track.album}` : ''}</Text>
          <Text numberOfLines={1} style={styles.trackMeta}>{track.sourceFolder ? `${track.sourceFolder} · ` : ''}{t.sourceDate}: {formatDateTime(track.originalModifiedAt || track.addedAt, language)}{playCount > 0 ? ` · ${playCount} ${t.playedTimes}` : ''}</Text>
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

function decodeSafPart(value) {
  try { return decodeURIComponent(String(value || '')); }
  catch (_) { return String(value || ''); }
}

function getSafEntryName(uri) {
  const last = String(uri || '').split('/').filter(Boolean).pop() || '';
  const decoded = decodeSafPart(last);
  return decoded.split('/').filter(Boolean).pop() || decoded.split(':').pop() || '';
}

function getSafFolderName(uri) {
  const last = String(uri || '').split('/').filter(Boolean).pop() || 'Music';
  const decoded = decodeSafPart(last);
  const pathPart = decoded.split('/').filter(Boolean).pop() || decoded;
  return pathPart.includes(':') ? (pathPart.split(':').pop() || 'Music') : pathPart;
}

async function extractMp3Metadata(fileUri, trackId) {
  let handle = null;
  try {
    const source = new File(fileUri);
    handle = source.open(FileMode.ReadOnly);
    const header = await handle.readBytes(10);
    if (header.length < 10 || header[0] !== 0x49 || header[1] !== 0x44 || header[2] !== 0x33) return {};
    const syncSafeSize = (header[6] << 21) | (header[7] << 14) | (header[8] << 7) | header[9];
    if (!syncSafeSize || syncSafeSize > 8 * 1024 * 1024) return {};
    const body = await handle.readBytes(syncSafeSize);
    if (body.length < syncSafeSize) return {};
    const tagBytes = new Uint8Array(10 + body.length);
    tagBytes.set(header, 0);
    tagBytes.set(body, 10);
    const metadata = parseId3v2Tag(tagBytes);
    let artworkUri = null;
    if (metadata.picture?.data?.length) {
      const mime = String(metadata.picture.mimeType || '').toLowerCase();
      const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
      const coverFile = new File(Paths.document, `foxsmusic-cover-${trackId}.${extension}`);
      if (coverFile.exists) coverFile.delete();
      coverFile.create({ intermediates: true, overwrite: true });
      const writer = coverFile.open(FileMode.WriteOnly);
      try { await writer.writeBytes(metadata.picture.data); }
      finally { writer.close(); }
      if (coverFile.exists && coverFile.size > 0) artworkUri = coverFile.uri;
    }
    return {
      title: metadata.title || '',
      artist: metadata.artist || '',
      album: metadata.album || '',
      artworkUri,
    };
  } catch (error) {
    console.warn('FoxsMusic: embedded MP3 tags could not be read', error);
    return {};
  } finally {
    try { handle?.close(); } catch (_) {}
  }
}

async function copyFolderArtwork(sourceUri, destinationUri) {
  try {
    const source = new File(sourceUri);
    const destination = new File(destinationUri);
    if (destination.exists) destination.delete();
    await source.copy(destination);
    if (destination.exists && destination.size > 0) return destination.uri;
  } catch (error) {
    console.warn('FoxsMusic: modern file copy for folder artwork failed; trying legacy copy', error);
  }
  try {
    const previous = await LegacyFileSystem.getInfoAsync(destinationUri);
    if (previous.exists) await LegacyFileSystem.deleteAsync(destinationUri, { idempotent: true });
    await LegacyFileSystem.copyAsync({ from: sourceUri, to: destinationUri });
    const copied = await LegacyFileSystem.getInfoAsync(destinationUri);
    return copied.exists ? destinationUri : null;
  } catch (error) {
    console.warn('FoxsMusic: could not copy folder artwork', error);
    return null;
  }
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
  const [sortMode, setSortMode] = useState('recent');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedSmartPlaylist, setSelectedSmartPlaylist] = useState(null);
  const [playStats, setPlayStats] = useState({});
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [colorInput, setColorInput] = useState(DEFAULT_PROFILE.accentColor);
  const [profileNameInput, setProfileNameInput] = useState(DEFAULT_PROFILE.name);
  const screenAnim = useRef(new Animated.Value(1)).current;
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [queueIds, setQueueIds] = useState([]);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [repeatMode, setRepeatMode] = useState('none');
  const [shuffle, setShuffle] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volumePercent, setVolumePercent] = useState(100);
  const [importing, setImporting] = useState(false);
  const [musicFolderUri, setMusicFolderUri] = useState(null);
  const [folderSyncing, setFolderSyncing] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistModalMode, setPlaylistModalMode] = useState('create');
  const [playlistName, setPlaylistName] = useState('');
  const [pendingTrackId, setPendingTrackId] = useState(null);
  const currentQueueKey = useRef('');
  const pendingPlay = useRef(null);
  const currentTrackIdRef = useRef(null);
  const lastCountedTrackId = useRef(null);
  const notificationAsked = useRef(false);
  const audioModeReady = useRef(null);
  const seekWidth = useRef(1);
  const seekTrackRef = useRef(null);
  const seekOriginX = useRef(0);
  const seekDuration = useRef(0);
  const seekPlaylist = useRef(playlist);
  const volumeWidth = useRef(1);
  const volumeOriginX = useRef(0);
  const volumeTrackRef = useRef(null);
  seekDuration.current = playback.duration;
  seekPlaylist.current = playlist;

  const seekToPageX = pageX => {
    const duration = seekDuration.current;
    if (!duration || !Number.isFinite(pageX)) return;
    const width = Math.max(1, seekWidth.current);
    const ratio = Math.max(0, Math.min(1, (pageX - seekOriginX.current) / width));
    seekPlaylist.current.seekTo(ratio * duration);
  };
  const seekResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: event => seekToPageX(event.nativeEvent.pageX),
    onPanResponderMove: event => seekToPageX(event.nativeEvent.pageX),
    onPanResponderRelease: event => seekToPageX(event.nativeEvent.pageX),
    onPanResponderTerminationRequest: () => false,
  }), []);

  const volumeToPageX = pageX => {
    if (!Number.isFinite(pageX)) return;
    const ratio = Math.max(0, Math.min(1, (pageX - volumeOriginX.current) / Math.max(1, volumeWidth.current)));
    setVolumePercent(Math.round(ratio * 100));
  };
  const volumeResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: event => volumeToPageX(event.nativeEvent.pageX),
    onPanResponderMove: event => volumeToPageX(event.nativeEvent.pageX),
    onPanResponderRelease: event => volumeToPageX(event.nativeEvent.pageX),
    onPanResponderTerminationRequest: () => false,
  }), []);
  const t = COPY[language] || COPY.ru;

  const currentTrack = tracks.find(track => track.id === currentTrackId) || null;
  const queueTracks = queueIds.map(id => tracks.find(track => track.id === id)).filter(Boolean);
  const queueCurrentIndex = currentTrackId ? queueIds.indexOf(currentTrackId) : -1;
  const playlistDetail = playlists.find(item => item.id === selectedPlaylistId) || null;
  const seasonTheme = SEASON_THEMES[profile.season] || null;
  const accentColor = seasonTheme?.accent || profile.accentColor || C.red;
  const panelBackground = profile.panelStyle === 'glass'
    ? (seasonTheme ? `${seasonTheme.panel}E6` : 'rgba(25, 13, 20, 0.82)')
    : profile.panelStyle === 'soft'
      ? (seasonTheme?.panelSoft || '#21151D')
      : (seasonTheme?.panel || '#141015');
  const appBackgroundColor = seasonTheme && profile.backgroundColor === DEFAULT_PROFILE.backgroundColor
    ? seasonTheme.background
    : (profile.backgroundColor || C.background);
  const recentSmartTracks = useMemo(() => sortTracks(tracks, 'recent').slice(0, 50), [tracks]);
  const frequentSmartTracks = useMemo(() => sortMostPlayed(tracks.filter(track => (Number(playStats[track.id]?.count) || 0) > 0), playStats).slice(0, 50), [tracks, playStats]);
  const smartTracks = selectedSmartPlaylist === 'recent' ? recentSmartTracks : selectedSmartPlaylist === 'frequent' ? frequentSmartTracks : [];
  const smartTitle = selectedSmartPlaylist === 'recent' ? t.smartRecent : t.smartFrequent;

  function recordTrackPlay(trackId) {
    if (!trackId || lastCountedTrackId.current === trackId) return;
    lastCountedTrackId.current = trackId;
    setPlayStats(current => ({ ...current, [trackId]: { count: (Number(current[trackId]?.count) || 0) + 1, lastPlayedAt: Date.now() } }));
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      let savedTracks = [];
      let savedFolderUri = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && saved.version === 1) {
            savedTracks = Array.isArray(saved.tracks)
              ? saved.tracks.filter(item => item && typeof item.id === 'string' && typeof item.uri === 'string')
              : [];
            const savedPlaylists = Array.isArray(saved.playlists)
              ? saved.playlists.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string')
              : [];
            if (mounted) {
              setTracks(savedTracks);
              setPlaylists(savedPlaylists.map(item => ({
                ...item,
                trackIds: Array.isArray(item.trackIds) ? item.trackIds.filter(id => typeof id === 'string') : [],
              })));
              setLanguage(['ru', 'en', 'de'].includes(saved.language) ? saved.language : 'ru');
              if (saved.playStats && typeof saved.playStats === 'object') setPlayStats(saved.playStats);
              if (Number.isFinite(Number(saved.playbackRate)) && Number(saved.playbackRate) >= 0.5 && Number(saved.playbackRate) <= 2) setPlaybackRate(Number(saved.playbackRate));
              if (Number.isFinite(Number(saved.volumePercent))) setVolumePercent(Math.max(0, Math.min(100, Math.round(Number(saved.volumePercent)))));
              if (saved.profile && typeof saved.profile === 'object') {
                const safeProfile = { ...DEFAULT_PROFILE, ...saved.profile };
                if (!isValidHexColor(safeProfile.accentColor)) safeProfile.accentColor = DEFAULT_PROFILE.accentColor;
                if (!isValidHexColor(safeProfile.backgroundColor)) safeProfile.backgroundColor = DEFAULT_PROFILE.backgroundColor;
                if (!['classic', 'soft', 'glass'].includes(safeProfile.panelStyle)) safeProfile.panelStyle = 'classic';
                if (!['none', 'halloween', 'christmas', 'birthday'].includes(safeProfile.season)) safeProfile.season = 'none';
                setProfile(safeProfile); setColorInput(safeProfile.accentColor); setProfileNameInput(safeProfile.name || DEFAULT_PROFILE.name);
              }
              setQueueIds(savedTracks.map(item => item.id));
              if (['none', 'all', 'single'].includes(saved.repeatMode)) setRepeatMode(saved.repeatMode);
            }
          }
        }
        savedFolderUri = await AsyncStorage.getItem(MUSIC_FOLDER_KEY);
        if (mounted && savedFolderUri) setMusicFolderUri(savedFolderUri);
      } catch (error) {
        console.warn('FoxsMusic mobile: could not load local library or Music folder', error);
      } finally {
        if (mounted) setReady(true);
      }

      // If the user previously connected the Android Music folder, rescan it
      // after launch. SAF grants access only to the folder the user selected.
      if (mounted && savedFolderUri) {
        setFolderSyncing(true);
        try {
          const result = await scanMusicFolderContents(savedFolderUri, savedTracks);
          if (mounted && result.metadataUpdates?.length) {
            const updates = new Map(result.metadataUpdates.map(item => [item.id, item]));
            setTracks(current => current.map(track => updates.has(track.id) ? { ...track, ...updates.get(track.id) } : track));
          }
          if (mounted && result.importedTracks.length) {
            setTracks(current => {
              const existingIds = new Set(current.map(track => track.id));
              return [...current, ...result.importedTracks.filter(track => !existingIds.has(track.id))];
            });
            setQueueIds(current => [...new Set([...current, ...result.importedTracks.map(track => track.id)])]);
          }
          if (result.importedTracks.length) {
            console.info(`FoxsMusic: automatically added ${result.importedTracks.length} new track(s) from ${result.folderName}`);
          }
        } catch (error) {
          // Do not block startup if the user revoked the SAF folder permission.
          console.warn('FoxsMusic mobile: saved Music folder could not be rescanned; reconnect it from the library screen', error);
        } finally {
          if (mounted) setFolderSyncing(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const candidates = tracks.filter(track => String(track.fileName || track.uri || '').toLowerCase().endsWith('.mp3') && !track.embeddedMetadataChecked).slice(0, METADATA_REPAIR_BATCH);
      if (!candidates.length) return;
      const updates = new Map();
      for (const track of candidates) {
        if (cancelled) break;
        const metadata = await extractMp3Metadata(track.uri, track.id);
        updates.set(track.id, {
          title: metadata.title || track.title,
          artist: metadata.artist || track.artist,
          album: metadata.album || track.album,
          artworkUri: track.artworkUri || metadata.artworkUri || null,
          embeddedMetadataChecked: true,
        });
      }
      if (!cancelled && updates.size) {
        setTracks(current => current.map(item => updates.has(item.id) ? { ...item, ...updates.get(item.id) } : item));
      }
    })();
    return () => { cancelled = true; };
  }, [ready, tracks]);

  useEffect(() => {
    if (!ready) return;
    const payload = { version: 1, tracks, playlists, language, repeatMode, playStats, profile, playbackRate, volumePercent };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(error => {
      console.warn('FoxsMusic mobile: could not persist library', error);
    });
  }, [ready, tracks, playlists, language, repeatMode, playStats, profile, playbackRate, volumePercent]);

  useEffect(() => {
    screenAnim.setValue(0);
    Animated.timing(screenAnim, { toValue: 1, duration: 190, useNativeDriver: true }).start();
  }, [screen]);

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
    try { playlist.playbackRate = playbackRate; } catch (error) { console.warn('FoxsMusic: playback rate could not be applied', error); }
  }, [playlist, playbackRate, ready]);

  useEffect(() => {
    if (!ready) return;
    try { playlist.volume = Math.max(0, Math.min(1, volumePercent / 100)); } catch (error) { console.warn('FoxsMusic: volume could not be applied', error); }
  }, [playlist, volumePercent, ready]);

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
    if (currentTrackId) recordTrackPlay(currentTrackId);
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
        artworkUrl: currentTrack.artworkUri || undefined,
      });
    } catch (_) {}
  }, [currentTrack, language, playlist]);

  const sourceFolders = useMemo(() => [...new Set(
    tracks.map(track => String(track.sourceFolder || '').trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })), [tracks]);

  const visibleTracks = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    const filtered = tracks.filter(track => {
      if (libraryFilter === 'favorites' && !track.favorite) return false;
      const sourceFolder = String(track.sourceFolder || '').trim();
      if (sourceFilter === 'imported' && sourceFolder) return false;
      if (sourceFilter.startsWith('folder:') && sourceFolder !== sourceFilter.slice(7)) return false;
      if (!normalized) return true;
      return `${track.title} ${track.artist || ''} ${track.fileName || ''} ${sourceFolder}`.toLocaleLowerCase().includes(normalized);
    });
    return sortTracks(filtered, sortMode);
  }, [tracks, search, libraryFilter, sourceFilter, sortMode]);

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
        artworkUrl: track.artworkUri || undefined,
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

    recordTrackPlay(track.id);
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
  if (importing || folderSyncing) return;
  setImporting(true);

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: true,
      // Expo copies selected content:// files to cache so FileSystem can read them.
      // We move each selected file into the app's private Documents folder below.
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const known = new Set(
      tracks.map(track => `${String(track.fileName || '').toLowerCase()}:${Number(track.size) || 0}`)
    );
    const importedTracks = [];
    let skipped = 0;
    const selectedAssets = result.assets.slice(0, MAX_IMPORT_FILES);
    skipped += Math.max(0, result.assets.length - selectedAssets.length);

    // Copy files one by one. This avoids a large burst of storage I/O when
    // several high-bitrate/large audio files are selected at once.
    for (const asset of selectedAssets) {
      if (!asset?.uri || !asset?.name || !isSupportedAudio(asset.name)) {
        skipped++;
        continue;
      }

      const size = Number.isFinite(Number(asset.size)) ? Number(asset.size) : 0;
      const duplicateKey = `${asset.name.toLowerCase()}:${size}`;
      if (known.has(duplicateKey)) {
        skipped++;
        continue;
      }

      const id = createId();
      const extension = asset.name.split('.').pop().toLowerCase();
      const destination = `${LegacyFileSystem.documentDirectory}foxsmusic-${id}.${extension}`;

      try {
        await LegacyFileSystem.copyAsync({ from: asset.uri, to: destination });
        const copiedInfo = await LegacyFileSystem.getInfoAsync(destination, { size: true });
        if (!copiedInfo.exists) throw new Error('Файл не сохранился в хранилище FoxsMusic.');

        const parsed = parseTrackName(asset.name);
        const metadata = extension === 'mp3' ? await extractMp3Metadata(destination, id) : {};
        importedTracks.push({
          id,
          title: metadata.title || parsed.title,
          artist: metadata.artist || parsed.artist,
          album: metadata.album || '',
          artworkUri: metadata.artworkUri || null,
          embeddedMetadataChecked: extension === 'mp3',
          fileName: asset.name,
          size: Number(copiedInfo.size) || size,
          uri: destination,
          addedAt: Date.now() + importedTracks.length,
          favorite: false,
          duration: 0,
          originalModifiedAt: normalizeFileTimestamp(asset.creationTime || asset.lastModified || asset.modificationTime) || Date.now(),
        });
        known.add(duplicateKey);

        // The permanent private copy is now safe; remove the temporary picker cache copy.
        if (asset.uri !== destination && asset.uri.includes('/cache/')) {
          LegacyFileSystem.deleteAsync(asset.uri, { idempotent: true }).catch(() => {});
        }
      } catch (copyError) {
        skipped++;
        console.warn(`FoxsMusic mobile: failed to copy ${asset.name} into app storage`, copyError);
      }
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

async function scanMusicFolderContents(folderUri, existingTracks = []) {
  const saf = LegacyFileSystem.StorageAccessFramework;
  if (Platform.OS !== 'android' || !saf) throw new Error('Выбор папки Music доступен в Android-версии FoxsMusic.');
  if (!LegacyFileSystem.documentDirectory) throw new Error('Не удалось открыть внутреннее хранилище FoxsMusic.');

  const folderName = getSafFolderName(folderUri);
  const known = new Set(existingTracks.map(track => `${String(track.fileName || '').toLowerCase()}:${Number(track.size) || 0}`));
  const existingByKey = new Map(existingTracks.map(track => [`${String(track.fileName || '').toLowerCase()}:${Number(track.size) || 0}`, track]));
  const importedTracks = [];
  const metadataUpdates = [];
  const visitedDirectories = new Set();
  let skipped = 0;

  function stableFolderKey(value) {
    let hash = 2166136261;
    for (const char of String(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16);
  }

  async function findAndCopyFolderArtwork(entries, folderKey) {
    const names = ['cover.jpg', 'cover.jpeg', 'cover.png', 'folder.jpg', 'folder.png', 'album.jpg', 'album.png', 'front.jpg', 'front.png'];
    for (const uri of entries) {
      const name = getSafEntryName(uri).toLowerCase();
      if (!names.includes(name)) continue;
      const extension = name.split('.').pop();
      const destination = `${LegacyFileSystem.documentDirectory}foxsmusic-art-${stableFolderKey(folderKey)}.${extension}`;
      const copiedUri = await copyFolderArtwork(uri, destination);
      if (copiedUri) return copiedUri;
    }
    return null;
  }

  async function visitDirectory(directoryUri, relativeFolder, depth) {
    if (depth > MAX_FOLDER_DEPTH || visitedDirectories.has(directoryUri)) return;
    visitedDirectories.add(directoryUri);
    const entries = await saf.readDirectoryAsync(directoryUri);
    const folderArtwork = await findAndCopyFolderArtwork(entries, directoryUri);

    for (const entryUri of entries) {
      let info = null;
      try { info = await LegacyFileSystem.getInfoAsync(entryUri, { size: true }); }
      catch (error) { console.warn('FoxsMusic: cannot inspect Music entry', error); }
      const name = getSafEntryName(entryUri);
      if (info?.isDirectory) {
        try { await visitDirectory(entryUri, relativeFolder ? `${relativeFolder}/${name}` : name, depth + 1); }
        catch (folderError) { skipped++; console.warn(`FoxsMusic mobile: cannot scan subfolder ${name}`, folderError); }
        continue;
      }
      if (!isSupportedAudio(name)) continue;
      if (importedTracks.length >= MAX_IMPORT_FILES) { skipped++; continue; }
      const size = Number(info?.size) || 0;
      const duplicateKey = `${name.toLowerCase()}:${size}`;
      if (known.has(duplicateKey)) {
        const existing = existingByKey.get(duplicateKey);
        if (existing && (!existing.sourceFolder || !existing.artworkUri || !existing.originalModifiedAt || !existing.album || (name.toLowerCase().endsWith('.mp3') && !existing.artist))) {
          const embedded = name.toLowerCase().endsWith('.mp3') && (!existing.artworkUri || !existing.album || !existing.artist)
            ? await extractMp3Metadata(existing.uri, existing.id)
            : {};
          metadataUpdates.push({
            id: existing.id,
            title: embedded.title || existing.title,
            artist: embedded.artist || existing.artist,
            sourceFolder: existing.sourceFolder || relativeFolder || folderName,
            album: existing.album || embedded.album || relativeFolder.split('/').pop() || folderName,
            artworkUri: existing.artworkUri || folderArtwork || embedded.artworkUri || null,
            embeddedMetadataChecked: existing.embeddedMetadataChecked || name.toLowerCase().endsWith('.mp3'),
            originalModifiedAt: existing.originalModifiedAt || normalizeFileTimestamp(info?.creationTime || info?.modificationTime) || null,
          });
        }
        skipped++; continue;
      }
      const id = createId();
      const extension = name.split('.').pop().toLowerCase();
      const destination = `${LegacyFileSystem.documentDirectory}foxsmusic-${id}.${extension}`;
      try {
        await LegacyFileSystem.copyAsync({ from: entryUri, to: destination });
        const copiedInfo = await LegacyFileSystem.getInfoAsync(destination, { size: true });
        if (!copiedInfo.exists) throw new Error('Файл не сохранился в хранилище FoxsMusic.');
        const parsed = parseTrackName(name);
        const embedded = extension === 'mp3' ? await extractMp3Metadata(destination, id) : {};
        importedTracks.push({
          id, title: embedded.title || parsed.title, artist: embedded.artist || parsed.artist, album: embedded.album || relativeFolder.split('/').pop() || folderName,
          fileName: name, size: Number(copiedInfo.size) || size, uri: destination,
          artworkUri: folderArtwork || embedded.artworkUri || null,
          embeddedMetadataChecked: extension === 'mp3',
          addedAt: Date.now() + importedTracks.length, originalModifiedAt: normalizeFileTimestamp(info?.creationTime || info?.modificationTime) || Date.now(),
          favorite: false, duration: 0, sourceFolder: relativeFolder || folderName,
        });
        known.add(duplicateKey);
      } catch (copyError) { skipped++; console.warn(`FoxsMusic mobile: failed to import ${name} from Music folder`, copyError); }
    }
  }

  await visitDirectory(folderUri, folderName, 0);
  return { folderName, importedTracks, metadataUpdates, skipped };
}

async function rescanConnectedMusicFolder() {
  if (!musicFolderUri || importing || folderSyncing) return;
  setFolderSyncing(true);
  try {
    const result = await scanMusicFolderContents(musicFolderUri, tracks);
    if (result.metadataUpdates?.length) {
      const updates = new Map(result.metadataUpdates.map(item => [item.id, item]));
      setTracks(current => current.map(track => updates.has(track.id) ? { ...track, ...updates.get(track.id) } : track));
    }
    if (result.importedTracks.length) {
      setTracks(current => {
        const existing = new Set(current.map(track => `${String(track.fileName || '').toLowerCase()}:${Number(track.size) || 0}`));
        const fresh = result.importedTracks.filter(track => !existing.has(`${String(track.fileName || '').toLowerCase()}:${Number(track.size) || 0}`));
        return [...current, ...fresh];
      });
      setQueueIds(current => [...new Set([...current, ...result.importedTracks.map(track => track.id)])]);
    }
    Alert.alert(t.importDone, `${t.imported}: ${result.importedTracks.length}\n${t.skipped}: ${result.skipped}`);
  } catch (error) {
    console.error('FoxsMusic mobile folder rescan error', error);
    Alert.alert(t.importError, String(error?.message || error));
  } finally {
    setFolderSyncing(false);
  }
}

async function importMusicFolder() {
  if (importing || folderSyncing) return;
  setImporting(true);
  setFolderSyncing(true);
  try {
    const saf = LegacyFileSystem.StorageAccessFramework;
    if (Platform.OS !== 'android' || !saf) {
      Alert.alert('FoxsMusic', language === 'en' ? 'Music folder connection is available on Android.' : 'Подключение папки Music доступно на Android.');
      return;
    }

    // Open the Android system folder picker at the standard Music location when available.
    let initialMusicUri = null;
    try { initialMusicUri = saf.getUriForDirectoryInRoot('Music'); } catch (_) {}
    const permission = await saf.requestDirectoryPermissionsAsync(initialMusicUri || undefined);
    if (!permission.granted || !permission.directoryUri) return;

    await AsyncStorage.setItem(MUSIC_FOLDER_KEY, permission.directoryUri);
    setMusicFolderUri(permission.directoryUri);

    const result = await scanMusicFolderContents(permission.directoryUri, tracks);
    const metadataMap = new Map((result.metadataUpdates || []).map(item => [item.id, item]));
    if (result.metadataUpdates?.length || result.importedTracks.length) {
      const enriched = tracks.map(track => metadataMap.has(track.id) ? { ...track, ...metadataMap.get(track.id) } : track);
      const existingIds = new Set(enriched.map(track => track.id));
      const nextTracks = [...enriched, ...result.importedTracks.filter(track => !existingIds.has(track.id))];
      setTracks(nextTracks);
      setQueueIds(nextTracks.map(track => track.id));
      pendingPlay.current = null;
    }
    Alert.alert(
      t.importDone,
      `${t.imported}: ${result.importedTracks.length}\n${t.skipped}: ${result.skipped}\n\n${language === 'en' ? 'This folder will be scanned automatically when FoxsMusic starts.' : language === 'de' ? 'Dieser Ordner wird beim Start von FoxsMusic automatisch durchsucht.' : 'Эта папка будет автоматически проверяться при запуске FoxsMusic.'}`
    );
  } catch (error) {
    console.error('FoxsMusic mobile folder import error', error);
    Alert.alert(t.importError, String(error?.message || error));
  } finally {
    setFolderSyncing(false);
    setImporting(false);
  }
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
    setSelectedSmartPlaylist(null);
    setSelectedPlaylistId(item.id);
  }

  function openSmartPlaylist(id) {
    setSelectedPlaylistId(null);
    setSelectedSmartPlaylist(id);
  }

  function resetProfile() {
    Alert.alert('FoxsMusic', language === 'en' ? 'Reset profile appearance? Your music and playlists will stay.' : language === 'de' ? 'Profildesign zurücksetzen? Musik und Playlists bleiben erhalten.' : 'Сбросить оформление профиля? Музыка и плейлисты останутся.', [
      { text: t.cancel, style: 'cancel' },
      { text: language === 'en' ? 'Reset' : language === 'de' ? 'Zurücksetzen' : 'Сбросить', style: 'destructive', onPress: () => {
        const oldBackground = profile.backgroundImageUri;
        const oldAvatar = profile.avatarUri;
        setProfile(DEFAULT_PROFILE); setColorInput(DEFAULT_PROFILE.accentColor); setProfileNameInput(DEFAULT_PROFILE.name);
        [oldBackground, oldAvatar].filter(Boolean).forEach(uri => LegacyFileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}));
      } },
    ]);
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
        playCount={Number(playStats[item.id]?.count) || 0}
        accentColor={accentColor}
        panelBackground={panelBackground}
      />
    );
  }

  async function pickProfileImage(target) {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: false, copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const extension = String(asset.name || 'image.jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const destination = `${LegacyFileSystem.documentDirectory}foxsmusic-${target}-${createId()}.${extension}`;
      await LegacyFileSystem.copyAsync({ from: asset.uri, to: destination });
      const info = await LegacyFileSystem.getInfoAsync(destination);
      if (!info.exists) throw new Error('Не удалось сохранить изображение в FoxsMusic.');
      const imageKey = target === 'background' ? 'backgroundImageUri' : 'avatarUri';
      const previousImage = profile[imageKey];
      setProfile(current => ({ ...current, [imageKey]: destination }));
      if (previousImage) LegacyFileSystem.deleteAsync(previousImage, { idempotent: true }).catch(() => {});
    } catch (error) {
      Alert.alert('FoxsMusic', `Не удалось загрузить изображение: ${String(error?.message || error)}`);
    }
  }

  function removeProfileImage(target) {
    const key = target === 'background' ? 'backgroundImageUri' : 'avatarUri';
    const uri = profile[key];
    setProfile(current => ({ ...current, [key]: null }));
    if (uri) LegacyFileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  }

  function applyCustomColor() {
    const normalized = colorInput.trim().startsWith('#') ? colorInput.trim() : `#${colorInput.trim()}`;
    if (!isValidHexColor(normalized)) {
      Alert.alert('FoxsMusic', language === 'en' ? 'Enter a valid HEX color, for example #F12743.' : language === 'de' ? 'Gib eine gültige HEX-Farbe ein, z. B. #F12743.' : 'Введи корректный HEX-цвет, например #F12743.');
      return;
    }
    setProfile(current => ({ ...current, accentColor: normalized.toUpperCase() }));
    setColorInput(normalized.toUpperCase());
  }

  function navigateSwipe(dx) {
    if (Math.abs(dx) < 76 || playlistModalVisible) return;
    const tabs = ['library', 'playlists', 'player', 'settings'];
    const index = tabs.indexOf(screen);
    const nextIndex = Math.max(0, Math.min(tabs.length - 1, index + (dx < 0 ? 1 : -1)));
    if (nextIndex !== index) setScreen(tabs[nextIndex]);
  }

  const screenSwipeResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => !playlistModalVisible
      && Math.abs(gesture.dx) > 76
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.6,
    onPanResponderRelease: (_, gesture) => navigateSwipe(gesture.dx),
    onPanResponderTerminationRequest: () => true,
  }), [playlistModalVisible, screen]);

  function seekBy(seconds) {
    if (!playback.duration) return;
    playlist.seekTo(Math.max(0, Math.min(playback.duration, playback.currentTime + seconds)));
  }

  function renderLibraryHeader() {
    return (
      <View>
        <View style={[styles.compactHero, { borderColor: `${accentColor}88`, backgroundColor: panelBackground }]}>
          <View style={styles.compactHeroCopy}>
            <Text style={styles.compactHeroEyebrow}>FOXSMUSIC ORIGINAL</Text>
            <Text style={styles.compactHeroTitle}>{'Feel the dark.\nHear the fire.'}</Text>
            <Text style={styles.compactHeroCaption}>YOUR MUSIC · YOUR RULES</Text>
            <View style={styles.equalizerRow}>{[8,15,11,22,13,28,17,10,23,14,30,18,9,21,13,26,16,10].map((h, i) => <View key={i} style={[styles.equalizerBar, { height: h, backgroundColor: accentColor }]} />)}</View>
          </View>
          <Image source={require('./assets/foxsmusic-logo.png')} style={styles.compactHeroLogo} resizeMode="contain" />
        </View>
        <View style={styles.screenHeading}>
          <View>
            <Text style={styles.eyebrow}>{t.collection}</Text>
            <Text style={styles.screenTitle}>{t.library}<Text style={[styles.titleDot, { color: accentColor }]}>.</Text></Text>
            <Text style={styles.screenSubtitle}>{tracks.length} {t.tracks}</Text>
          </View>
          <Pressable onPress={importAudioFiles} disabled={importing} style={({ pressed }) => [styles.importCircle, pressed && styles.pressed]}>
            {importing ? <ActivityIndicator color={C.text} /> : <Text style={styles.importPlus}>＋</Text>}
          </Pressable>
        </View>
        <Pressable onPress={importAudioFiles} disabled={importing} style={({ pressed }) => [styles.importBanner, { borderColor: `${accentColor}88`, backgroundColor: panelBackground }, pressed && styles.pressed]}>
          <View style={[styles.importBannerIcon, { backgroundColor: `${accentColor}22` }]}><Text style={[styles.importBannerGlyph, { color: accentColor }]}>♫</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.importBannerTitle}>{importing ? '…' : t.import}</Text>
            <Text style={styles.importBannerSubtitle}>{t.importHint}</Text>
          </View>
          <Text style={[styles.importBannerArrow, { color: accentColor }]}>›</Text>
        </Pressable>
        <View style={styles.folderActionsRow}>
          <Pressable onPress={importMusicFolder} disabled={importing || folderSyncing} style={({ pressed }) => [styles.folderImportButton, musicFolderUri && styles.folderImportButtonConnected, pressed && styles.pressed]}>
            <Text style={[styles.folderImportGlyph, { color: accentColor }]}>▣</Text>
            <Text numberOfLines={1} style={styles.folderImportText}>{folderSyncing ? t.scanningFolder : musicFolderUri ? t.folderConnected : t.importFolder}</Text>
            <Text style={[styles.folderImportArrow, { color: accentColor }]}>›</Text>
          </Pressable>
          {musicFolderUri && (
            <Pressable onPress={rescanConnectedMusicFolder} disabled={importing || folderSyncing} accessibilityRole="button" accessibilityLabel={t.rescanFolder} style={({ pressed }) => [styles.folderRescanButton, { width: 52, height: 52, borderColor: accentColor }, pressed && styles.pressed]}>
              {folderSyncing ? <ActivityIndicator size="small" color={C.red} /> : <Text style={[styles.folderRescanGlyph, { color: accentColor }]}>↻</Text>}
            </Pressable>
          )}
        </View>
        <View style={[styles.searchWrap, { borderColor: `${accentColor}66` }]}>
          <Text style={[styles.searchGlyph, { color: accentColor }]}>⌕</Text>
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
          <Pressable onPress={() => setLibraryFilter('all')} style={[styles.filterChip, { minHeight: 48, justifyContent: 'center' }, libraryFilter === 'all' && [styles.filterChipActive, { borderColor: accentColor, backgroundColor: `${accentColor}30` }]]}><Text style={[styles.filterText, libraryFilter === 'all' && styles.filterTextActive]}>{t.all}</Text></Pressable>
          <Pressable onPress={() => setLibraryFilter('favorites')} style={[styles.filterChip, { minHeight: 48, justifyContent: 'center' }, libraryFilter === 'favorites' && [styles.filterChipActive, { borderColor: accentColor, backgroundColor: `${accentColor}30` }]]}><Text style={[styles.filterText, libraryFilter === 'favorites' && styles.filterChipActive && styles.filterTextActive]}>♥ {t.favorites}</Text></Pressable>
          <Text style={styles.listCount}>{visibleTracks.length} {t.tracks}</Text>
        </View>
        {tracks.length > 0 && (
          <View style={styles.libraryToolsSection}>
            <Text style={styles.libraryToolsLabel}>{t.sortBy}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolChips}>
              {[
                ['recent', t.sortRecent],
                ['title', t.sortTitle],
                ['artist', t.sortArtist],
              ].map(([id, label]) => (
                <Pressable key={id} onPress={() => setSortMode(id)} style={[styles.toolChip, sortMode === id && [styles.toolChipActive, { borderColor: accentColor, backgroundColor: `${accentColor}28` }]]}>
                  <Text style={[styles.toolChipText, sortMode === id && styles.toolChipTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {(sourceFolders.length > 0 || tracks.some(track => !track.sourceFolder)) && (
              <>
                <Text style={styles.libraryToolsLabel}>{t.sources}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolChips}>
                  <Pressable onPress={() => setSourceFilter('all')} style={[styles.toolChip, sourceFilter === 'all' && [styles.toolChipActive, { borderColor: accentColor, backgroundColor: `${accentColor}28` }]]}>
                    <Text style={[styles.toolChipText, sourceFilter === 'all' && styles.toolChipTextActive]}>{t.allSources}</Text>
                  </Pressable>
                  {sourceFolders.map(folder => {
                    const id = `folder:${folder}`;
                    return (
                      <Pressable key={id} onPress={() => setSourceFilter(id)} style={[styles.toolChip, sourceFilter === id && [styles.toolChipActive, { borderColor: accentColor, backgroundColor: `${accentColor}28` }]]}>
                        <Text numberOfLines={1} style={[styles.toolChipText, sourceFilter === id && styles.toolChipTextActive]}>{folder}</Text>
                      </Pressable>
                    );
                  })}
                  {tracks.some(track => !track.sourceFolder) && (
                    <Pressable onPress={() => setSourceFilter('imported')} style={[styles.toolChip, sourceFilter === 'imported' && [styles.toolChipActive, { borderColor: accentColor, backgroundColor: `${accentColor}28` }]]}>
                      <Text style={[styles.toolChipText, sourceFilter === 'imported' && styles.toolChipTextActive]}>{t.importedFiles}</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        )}
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: appBackgroundColor }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={appBackgroundColor} />
      <ImageBackground source={profile.backgroundImageUri ? { uri: profile.backgroundImageUri } : undefined} imageStyle={{ opacity: profile.backgroundImageUri ? 0.62 : 0 }} style={[styles.appRoot, { backgroundColor: appBackgroundColor }]} resizeMode="cover">
        <View pointerEvents="none" style={[styles.backgroundShade, { backgroundColor: profile.backgroundImageUri ? 'rgba(5,4,8,0.38)' : 'transparent' }]} />
        {seasonTheme && <View pointerEvents="none" style={[styles.seasonAtmosphere, { backgroundColor: seasonTheme.atmosphere }]} />}
        <SeasonalEffects season={profile.season} theme={seasonTheme} />
        <View style={styles.foreground}>
        <View style={[styles.topBar, { borderBottomColor: `${accentColor}44` }]}>
          <View style={styles.brandMark}><Image source={require('./assets/desktop-logo.png')} style={styles.brandMarkImage} resizeMode="contain" /></View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>Foxs<Text style={styles.brandNameBold}>Music</Text></Text>
            <Text style={styles.brandEdition}>{t.edition}</Text>
          </View>
          <View style={styles.topSpacer} />
          <Pressable onPress={() => setScreen('settings')} style={[styles.topAction, { borderColor: `${accentColor}66` }]}><Text style={[styles.topActionGlyph, { color: accentColor }]}>⚙</Text></Pressable>
        </View>

        <Animated.View {...screenSwipeResponder.panHandlers} style={[styles.content, { opacity: screenAnim, transform: [{ translateX: screenAnim.interpolate({ inputRange: [0, 1], outputRange: [screen === 'library' ? -12 : 12, 0] }) }] }]}>
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
              initialNumToRender={12}
              maxToRenderPerBatch={8}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              keyboardShouldPersistTaps="handled"
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
                    <Artwork size={248} title={currentTrack.title} imageUri={currentTrack.artworkUri} />
                  </View>
                  <View style={styles.playerTrackInfo}>
                    <Text numberOfLines={2} style={styles.playerTrackTitle}>{currentTrack.title}</Text>
                    <Text numberOfLines={1} style={styles.playerTrackArtist}>{currentTrack.artist || t.unknownArtist}</Text>
                    <Pressable onPress={() => toggleFavorite(currentTrack.id)} style={styles.playerHeart}>
                      <Text style={[styles.playerHeartText, currentTrack.favorite && styles.favoriteOn]}>{currentTrack.favorite ? '♥' : '♡'}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.seekBlock}>
                    <View
                      ref={seekTrackRef}
                      {...seekResponder.panHandlers}
                      onLayout={() => {
                        seekTrackRef.current?.measureInWindow((x, _y, width) => {
                          seekOriginX.current = x;
                          seekWidth.current = Math.max(1, width);
                        });
                      }}
                      style={styles.seekTouchArea}
                      accessible
                      accessibilityRole="adjustable"
                      accessibilityLabel="Playback timeline"
                      accessibilityValue={{ min: 0, max: playback.duration || 0, now: Math.min(playback.currentTime || 0, playback.duration || 0), text: `${formatTime(playback.currentTime)} / ${formatTime(playback.duration)}` }}
                      accessibilityActions={[{ name: 'increment', label: 'Forward 5 seconds' }, { name: 'decrement', label: 'Back 5 seconds' }]}
                      onAccessibilityAction={event => {
                        if (!playback.duration) return;
                        const step = Math.max(5, playback.duration * 0.02);
                        const delta = event.nativeEvent.actionName === 'increment' ? step : -step;
                        playlist.seekTo(Math.max(0, Math.min(playback.duration, playback.currentTime + delta)));
                      }}
                    >
                      <View style={styles.seekTrack}>
                        <View style={[styles.seekProgress, { backgroundColor: accentColor, width: `${playback.duration > 0 ? Math.min(100, (playback.currentTime / playback.duration) * 100) : 0}%` }]} />
                        <View style={[styles.seekKnob, { borderColor: accentColor, left: `${playback.duration > 0 ? Math.min(100, (playback.currentTime / playback.duration) * 100) : 0}%` }]} />
                      </View>
                    </View>
                    <View style={styles.seekLabels}><Text style={styles.seekTime}>{formatTime(playback.currentTime)}</Text><Text style={styles.seekTime}>{formatTime(playback.duration)}</Text></View>
                  </View>
                  <View style={styles.quickSeekRow}>
                    <Pressable onPress={() => seekBy(-10)} style={[styles.quickSeekButton, { borderColor: `${accentColor}66` }]}><Text style={[styles.quickSeekText, { color: accentColor }]}>↶ {t.back10}</Text></Pressable>
                    <Pressable onPress={() => seekBy(10)} style={[styles.quickSeekButton, { borderColor: `${accentColor}66` }]}><Text style={[styles.quickSeekText, { color: accentColor }]}>{t.forward10} ↷</Text></Pressable>
                  </View>
                  <View style={styles.transportRow}>
                    <ActionButton label="⤨" active={shuffle} onPress={() => setShuffle(value => !value)} accessibilityLabel={t.shuffle} accentColor={accentColor} />
                    <ActionButton label="⏮" onPress={previousTrack} accessibilityLabel={t.previous} accentColor={accentColor} />
                    <Pressable onPress={togglePlayback} style={[styles.mainPlayButton, { backgroundColor: accentColor, width: 78, height: 78, borderRadius: 27 }]} accessibilityRole="button" accessibilityLabel={playback.playing ? t.pause : t.play}>
                      <Text style={styles.mainPlayGlyph}>{playStateLabel}</Text>
                    </Pressable>
                    <ActionButton label="⏭" onPress={nextTrack} accessibilityLabel={t.next} accentColor={accentColor} />
                    <ActionButton label={repeatMode === 'single' ? '↻¹' : '↻'} active={repeatMode !== 'none'} onPress={cycleRepeat} accessibilityLabel={repeatMode === 'none' ? t.repeatOff : repeatMode === 'all' ? t.repeatAll : t.repeatOne} accentColor={accentColor} />
                  </View>
                  <Text style={styles.repeatHint}>{repeatMode === 'none' ? t.repeatOff : repeatMode === 'all' ? t.repeatAll : t.repeatOne}</Text>
                  <View style={[styles.playerExtraCard, { backgroundColor: panelBackground, borderColor: `${accentColor}55` }]}>
                    <Text style={styles.playerExtraLabel}>{t.speed}</Text>
                    <View style={styles.speedOptions}>
                      {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                        <Pressable key={rate} onPress={() => setPlaybackRate(rate)} style={[styles.speedOption, playbackRate === rate && { backgroundColor: `${accentColor}28`, borderColor: accentColor }]}>
                          <Text style={[styles.speedOptionText, playbackRate === rate && { color: accentColor }]}>{rate}×</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.volumeHeader}><Text style={styles.playerExtraLabel}>{t.volume}</Text><Text style={[styles.volumeValue, { color: accentColor }]}>{volumePercent}%</Text></View>
                    <View style={styles.volumeControl}>
                      <Pressable accessibilityRole="button" accessibilityLabel="Volume down" onPress={() => setVolumePercent(value => Math.max(0, value - 5))} style={[styles.volumeStep, { borderColor: `${accentColor}66` }]}><Text style={[styles.volumeStepText, { color: accentColor }]}>−</Text></Pressable>
                      <View ref={volumeTrackRef} {...volumeResponder.panHandlers} onLayout={() => volumeTrackRef.current?.measureInWindow((x, _y, width) => { volumeOriginX.current = x; volumeWidth.current = Math.max(1, width); })} style={styles.volumeTrackTouch} accessible accessibilityRole="adjustable" accessibilityLabel={t.volume} accessibilityValue={{ min: 0, max: 100, now: volumePercent }} onAccessibilityAction={event => setVolumePercent(value => Math.max(0, Math.min(100, value + (event.nativeEvent.actionName === 'increment' ? 5 : -5))))} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}>
                        <View style={styles.volumeTrack}><View style={[styles.volumeProgress, { width: `${volumePercent}%`, backgroundColor: accentColor }]} /></View>
                      </View>
                      <Pressable accessibilityRole="button" accessibilityLabel="Volume up" onPress={() => setVolumePercent(value => Math.min(100, value + 5))} style={[styles.volumeStep, { borderColor: `${accentColor}66` }]}><Text style={[styles.volumeStepText, { color: accentColor }]}>＋</Text></Pressable>
                    </View>
                  </View>
                  <View style={styles.queueHeader}><Text style={styles.eyebrow}>{t.queue}</Text><Text style={styles.queueCount}>{queueTracks.length}</Text></View>
                  {queueTracks.slice(Math.max(0, playback.currentIndex), Math.max(0, playback.currentIndex) + 5).map((track, index) => (
                    <TrackRow key={track.id} track={track} index={index} active={currentTrackId === track.id} language={language} playCount={Number(playStats[track.id]?.count) || 0} accentColor={accentColor} panelBackground={panelBackground} onPlay={() => playTrack(track, queueIds)} onFavorite={() => toggleFavorite(track.id)} onAdd={() => openAddToPlaylist(track.id)} />
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
                  <Text style={styles.screenTitle}>{t.playlists}<Text style={[styles.titleDot, { color: accentColor }]}>.</Text></Text>
                  <Text style={styles.screenSubtitle}>{playlists.length} · {t.tracks}</Text>
                </View>
                <Pressable onPress={openCreatePlaylist} style={styles.importCircle}><Text style={styles.importPlus}>＋</Text></Pressable>
              </View>
              {selectedSmartPlaylist ? (
                <>
                  <Pressable onPress={() => setSelectedSmartPlaylist(null)} style={styles.backButton}><Text style={styles.backButtonText}>‹  {t.back}</Text></Pressable>
                  <Text style={styles.playlistDetailTitle}>{smartTitle}</Text>
                  <Text style={styles.screenSubtitle}>{smartTracks.length} {t.tracks}</Text>
                  {smartTracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} active={currentTrackId === track.id} language={language} playCount={Number(playStats[track.id]?.count) || 0} accentColor={accentColor} panelBackground={panelBackground} onPlay={() => playTrack(track, smartTracks.map(item => item.id))} onFavorite={() => toggleFavorite(track.id)} onAdd={() => openAddToPlaylist(track.id)} />)}
                  {selectedSmartPlaylist === 'frequent' && !smartTracks.length && <Text style={styles.emptySubtitle}>{t.noPlayed}</Text>}
                </>
              ) : playlistDetail ? (
                <>
                  <Pressable onPress={() => setSelectedPlaylistId(null)} style={styles.backButton}><Text style={styles.backButtonText}>‹  {t.back}</Text></Pressable>
                  <Text style={styles.playlistDetailTitle}>{playlistDetail.name}</Text>
                  <Text style={styles.screenSubtitle}>{playlistDetail.trackIds.length} {t.playlistTracks}</Text>
                  {playlistDetail.trackIds.map((id, index) => {
                    const track = tracks.find(item => item.id === id);
                    return track ? <TrackRow key={id} track={track} index={index} active={currentTrackId === id} language={language} playCount={Number(playStats[id]?.count) || 0} accentColor={accentColor} panelBackground={panelBackground} onPlay={() => playPlaylistTrack(track)} onFavorite={() => toggleFavorite(id)} onAdd={() => openAddToPlaylist(id)} /> : null;
                  })}
                  {!playlistDetail.trackIds.length && <Text style={styles.emptySubtitle}>{t.emptyPlaylist}</Text>}
                </>
              ) : (
                <>
                  <Pressable onPress={() => openSmartPlaylist('recent')} style={[styles.playlistCard, { borderColor: `${accentColor}70`, backgroundColor: panelBackground }]}>
                    <View style={[styles.playlistArtwork, { borderColor: accentColor }]}><Text style={[styles.playlistArtworkGlyph, { color: accentColor }]}>◷</Text></View>
                    <View style={styles.playlistCopy}><Text style={styles.playlistName}>{t.smartRecent}</Text><Text style={styles.playlistCount}>{recentSmartTracks.length} {t.tracks}</Text></View><Text style={[styles.playlistArrow, { color: accentColor }]}>›</Text>
                  </Pressable>
                  <Pressable onPress={() => openSmartPlaylist('frequent')} style={[styles.playlistCard, { borderColor: `${accentColor}70`, backgroundColor: panelBackground }]}>
                    <View style={[styles.playlistArtwork, { borderColor: accentColor }]}><Text style={[styles.playlistArtworkGlyph, { color: accentColor }]}>♨</Text></View>
                    <View style={styles.playlistCopy}><Text style={styles.playlistName}>{t.smartFrequent}</Text><Text style={styles.playlistCount}>{frequentSmartTracks.length} {t.tracks}</Text></View><Text style={[styles.playlistArrow, { color: accentColor }]}>›</Text>
                  </Pressable>
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
                <View><Text style={styles.eyebrow}>{t.profile}</Text><Text style={styles.screenTitle}>{t.settings}<Text style={[styles.titleDot, { color: accentColor }]}>.</Text></Text></View>
              </View>
              <View style={[styles.settingsCard, { backgroundColor: panelBackground, borderColor: `${accentColor}66` }]}>
                <Text style={styles.settingsLabel}>{t.profile}</Text>
                <View style={styles.profileRow}>
                  <View style={[styles.profileAvatar, { borderColor: accentColor }]}>
                    {profile.avatarUri ? <Image source={{ uri: profile.avatarUri }} style={styles.profileAvatarImage} /> : <Image source={require('./assets/foxsmusic-logo.png')} style={styles.profileAvatarImage} resizeMode="contain" />}
                  </View>
                  <View style={styles.profileNameWrap}>
                    <TextInput value={profileNameInput} onChangeText={value => { setProfileNameInput(value); setProfile(current => ({ ...current, name: value })); }} onEndEditing={() => setProfile(current => ({ ...current, name: profileNameInput.trim() || DEFAULT_PROFILE.name }))} placeholder={t.profileName} placeholderTextColor={C.subtle} selectionColor={accentColor} style={styles.profileNameInput} maxLength={32} />
                    <Text style={styles.settingsDescription}>FoxsMusic · Android Edition</Text>
                  </View>
                </View>
                <View style={styles.settingsButtonRow}>
                  <Pressable onPress={() => pickProfileImage('avatar')} style={[styles.settingsActionButton, { borderColor: accentColor }]}><Text style={[styles.settingsActionText, { color: accentColor }]}>{t.chooseAvatar}</Text></Pressable>
                  {profile.avatarUri && <Pressable onPress={() => removeProfileImage('avatar')} style={styles.settingsActionButton}><Text style={styles.settingsActionText}>{t.removeAvatar}</Text></Pressable>}
                </View>
              </View>

              <View style={[styles.settingsCard, { backgroundColor: panelBackground }]}>
                <Text style={styles.settingsLabel}>{t.language}</Text>
                <View style={styles.languageRow}>
                  {['ru', 'en', 'de'].map(code => (
                    <Pressable key={code} onPress={() => setLanguage(code)} style={[styles.languageChip, { minHeight: 46, minWidth: 58, justifyContent: 'center' }, language === code && [styles.languageChipActive, { borderColor: accentColor, backgroundColor: `${accentColor}30` }]]}>
                      <Text style={[styles.languageChipText, language === code && styles.languageChipTextActive]}>{code.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.settingsCard, { backgroundColor: panelBackground, borderColor: `${accentColor}66` }]}>
                <Text style={styles.settingsLabel}>{t.appearance}</Text>
                <Text style={styles.settingsSubLabel}>{t.accentColor}</Text>
                <View style={styles.colorSwatches}>
                  {ACCENT_PRESETS.map(color => <Pressable key={color} accessibilityRole="button" accessibilityLabel={color} onPress={() => { setProfile(current => ({ ...current, accentColor: color })); setColorInput(color); }} style={[styles.colorSwatch, { backgroundColor: color }, !seasonTheme && profile.accentColor === color && styles.colorSwatchActive]} />)}
                </View>
                <Text style={styles.settingsSubLabel}>{t.customColor}</Text>
                <View style={styles.customColorRow}>
                  <TextInput value={colorInput} onChangeText={setColorInput} autoCapitalize="characters" maxLength={7} placeholder="#F12743" placeholderTextColor={C.subtle} style={[styles.colorInput, { borderColor: accentColor }]} />
                  <Pressable onPress={applyCustomColor} style={[styles.settingsActionButton, { borderColor: accentColor, backgroundColor: `${accentColor}22` }]}><Text style={[styles.settingsActionText, { color: accentColor }]}>{t.applyColor}</Text></Pressable>
                </View>
                <Text style={styles.settingsSubLabel}>{t.backgroundColor}</Text>
                <View style={styles.colorSwatches}>
                  {BACKGROUND_PRESETS.map(color => <Pressable key={color} accessibilityRole="button" accessibilityLabel={color} onPress={() => setProfile(current => ({ ...current, backgroundColor: color }))} style={[styles.colorSwatch, { backgroundColor: color }, profile.backgroundColor === color && [styles.colorSwatchActive, { borderColor: accentColor }]]} />)}
                </View>
                <Text style={styles.settingsSubLabel}>{t.panelStyle}</Text>
                <View style={styles.languageRow}>
                  {['classic', 'soft', 'glass'].map((styleId, index) => {
                    const label = [t.styleClassic, t.styleSoft, t.styleGlass][index];
                    return <Pressable key={styleId} onPress={() => setProfile(current => ({ ...current, panelStyle: styleId }))} style={[styles.languageChip, { minHeight: 46, flex: 1, justifyContent: 'center' }, profile.panelStyle === styleId && [styles.languageChipActive, { borderColor: accentColor, backgroundColor: `${accentColor}30` }]]}><Text style={[styles.languageChipText, profile.panelStyle === styleId && styles.languageChipTextActive]}>{label}</Text></Pressable>;
                  })}
                </View>
              </View>

              <View style={[styles.settingsCard, { backgroundColor: panelBackground }]}>
                <Text style={styles.settingsLabel}>{t.season}</Text>
                <View style={styles.seasonGrid}>
                  {[['none', t.noSeason, '◌'], ['halloween', t.halloween, '🎃'], ['christmas', t.christmas, '❄'], ['birthday', t.birthday, '🎂']].map(([id, label, glyph]) => (
                    <Pressable key={id} onPress={() => setProfile(current => ({ ...current, season: id }))} style={[styles.seasonChoice, { backgroundColor: profile.season === id ? `${accentColor}20` : panelBackground }, profile.season === id && [styles.seasonChoiceActive, { borderColor: accentColor, backgroundColor: `${accentColor}28`, borderWidth: 2 }]]}>
                      <Text style={styles.seasonGlyph}>{glyph}</Text><Text style={styles.seasonLabel}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.settingsDescription}>{t.seasonPaletteHint}</Text>
                <Text style={styles.settingsDescription}>{t.swipeHint}</Text>
              </View>

              <View style={[styles.settingsCard, { backgroundColor: panelBackground }]}>
                <Text style={styles.settingsLabel}>{t.customBackground}</Text>
                <Text style={styles.settingsDescription}>{t.customBackground}</Text>
                <View style={styles.settingsButtonRow}>
                  <Pressable onPress={() => pickProfileImage('background')} style={[styles.settingsActionButton, { borderColor: accentColor }]}><Text style={[styles.settingsActionText, { color: accentColor }]}>{t.chooseBackground}</Text></Pressable>
                  {profile.backgroundImageUri && <Pressable onPress={() => removeProfileImage('background')} style={styles.settingsActionButton}><Text style={styles.settingsActionText}>{t.removeBackground}</Text></Pressable>}
                </View>
                {profile.backgroundImageUri && <Image source={{ uri: profile.backgroundImageUri }} style={styles.backgroundPreview} resizeMode="cover" />}
              </View>

              <View style={[styles.settingsCard, { backgroundColor: panelBackground }]}>
                <Text style={styles.settingsLabel}>{t.artworkSettingsLabel}</Text>
                <Text style={styles.settingsDescription}>{t.artworkHint}</Text>
              </View>
              <View style={[styles.settingsCard, { backgroundColor: panelBackground }]}>
                <Text style={styles.settingsLabel}>{t.storage}</Text>
                <Text style={styles.settingsDescription}>{t.storageHint}</Text>
              </View>
              <View style={[styles.settingsCard, { backgroundColor: panelBackground }]}>
                <Text style={styles.settingsLabel}>{t.background}</Text>
                <Text style={styles.settingsDescription}>{t.backgroundOn}</Text>
              </View>
              <View style={[styles.settingsCard, { backgroundColor: panelBackground }]}>
                <Text style={styles.settingsLabel}>{t.supported}</Text>
                <Text style={styles.settingsDescription}>MP3 · M4A · AAC · WAV · FLAC · OGG · OPUS</Text>
              </View>
              <View style={[styles.settingsCard, { backgroundColor: panelBackground }]}>
                <Text style={styles.settingsLabel}>{t.about}</Text>
                <Text style={styles.settingsDescription}>{t.version} · {profile.name || DEFAULT_PROFILE.name}</Text>
                <Text style={styles.settingsDescription}>FoxsMusic Desktop companion · MrArtyomRedDarkFox</Text>
              </View>
              <Pressable onPress={resetProfile} style={[styles.resetProfileButton, { borderColor: accentColor }]}><Text style={[styles.resetProfileText, { color: accentColor }]}>{t.resetProfile}</Text></Pressable>
            </ScrollView>
          )}
        </Animated.View>

        {currentTrack && screen !== 'player' && (
          <Pressable onPress={() => setScreen('player')} style={[styles.miniPlayer, { backgroundColor: panelBackground, borderTopColor: `${accentColor}66` }]}>
            <Artwork size={48} title={currentTrack.title} imageUri={currentTrack.artworkUri} />
            <View style={styles.miniPlayerCopy}>
              <Text numberOfLines={1} style={styles.miniPlayerTitle}>{currentTrack.title}</Text>
              <Text numberOfLines={1} style={styles.miniPlayerArtist}>{currentTrack.artist || t.unknownArtist}</Text>
            </View>
            <Pressable onPress={togglePlayback} hitSlop={10} style={[styles.miniPlayButton, { borderRadius: 12, borderWidth: 1, borderColor: `${accentColor}55` }]}><Text style={[styles.miniPlayGlyph, { color: accentColor }]}>{playStateLabel}</Text></Pressable>
            <Pressable onPress={nextTrack} hitSlop={10} style={styles.miniNextButton}><Text style={styles.miniNextGlyph}>⏭</Text></Pressable>
          </Pressable>
        )}

        <View style={[styles.bottomNav, { backgroundColor: profile.panelStyle === 'glass' ? 'rgba(12,9,13,0.78)' : panelBackground, borderTopColor: `${accentColor}55` }]}>
          {[
            ['library', '♫', t.library],
            ['playlists', '≡', t.playlists],
            ['player', '◉', t.player],
            ['settings', '⚙', t.settings],
          ].map(([id, glyph, label]) => (
            <Pressable key={id} onPress={() => setScreen(id)} style={styles.navItem}>
              <Text style={[styles.navGlyph, screen === id && styles.navGlyphActive, screen === id && { color: accentColor }]}>{glyph}</Text>
              <Text style={[styles.navLabel, screen === id && styles.navLabelActive]}>{label}</Text>
              {screen === id && <View style={[styles.navIndicator, { backgroundColor: accentColor }]} />}
            </Pressable>
          ))}
        </View>
        </View>
      </ImageBackground>

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
  topBar: { height: 76, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#281820' },
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
  foreground: { flex: 1 },
  backgroundShade: { ...StyleSheet.absoluteFillObject },
  seasonAtmosphere: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  seasonLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0, overflow: 'hidden' },
  seasonParticle: { position: 'absolute', top: 0, fontSize: 20, color: '#F7D7E1', textShadowColor: 'rgba(255,255,255,0.24)', textShadowRadius: 8 },
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
  folderActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -5, marginBottom: 13 },
  folderImportButton: { minHeight: 40, flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#48202B', backgroundColor: '#110B10', paddingHorizontal: 12 },
  folderImportButtonConnected: { borderColor: '#663044' },
  folderRescanButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#1A1017', borderWidth: 1, borderColor: '#48202B' },
  folderRescanGlyph: { color: C.red, fontSize: 23, fontWeight: '800' },
  folderImportGlyph: { color: C.red, fontSize: 16, marginRight: 9 },
  folderImportText: { color: C.muted, fontSize: 10, fontWeight: '800', flex: 1 },
  folderImportArrow: { color: C.red, fontSize: 22 },
  screenHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, paddingBottom: 18 },
  eyebrow: { color: '#8E5361', fontWeight: '900', fontSize: 9, letterSpacing: 2.4 },
  screenTitle: { color: C.text, fontWeight: '900', fontSize: 31, letterSpacing: -1.1, marginTop: 3 },
  titleDot: { color: C.red },
  screenSubtitle: { color: C.muted, fontSize: 11, marginTop: 4 },
  importCircle: { width: 58, height: 58, borderRadius: 17, backgroundColor: '#3A0D1A', borderWidth: 1, borderColor: '#8F2036', alignItems: 'center', justifyContent: 'center' },
  importPlus: { color: '#FFF1F4', fontSize: 30, lineHeight: 34, marginTop: -2 },
  importBanner: { minHeight: 82, flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1A0D13', borderRadius: 16, borderWidth: 1, borderColor: '#5A1B2B', marginBottom: 14 },
  importBannerIcon: { width: 54, height: 54, borderRadius: 13, backgroundColor: '#3A0C19', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  importBannerGlyph: { color: C.red, fontSize: 25, fontWeight: '800' },
  importBannerTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  importBannerSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  importBannerArrow: { color: C.red, fontSize: 29, marginHorizontal: 5 },
  searchWrap: { height: 47, borderRadius: 13, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  searchGlyph: { color: C.red, fontSize: 24, marginRight: 8 },
  searchInput: { color: C.text, flex: 1, height: 45, fontSize: 12 },
  clearSearch: { color: C.muted, fontSize: 23, paddingHorizontal: 3 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 8, gap: 8 },
  libraryToolsSection: { marginTop: 6, marginBottom: 10 },
  libraryToolsLabel: { color: '#8E5361', fontSize: 8, fontWeight: '900', letterSpacing: 1.7, marginTop: 7, marginBottom: 7 },
  toolChips: { flexDirection: 'row', gap: 7, paddingRight: 12 },
  toolChip: { maxWidth: 190, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  toolChipActive: { backgroundColor: '#45101D', borderColor: '#9C263C' },
  toolChipText: { color: C.muted, fontSize: 9, fontWeight: '700' },
  toolChipTextActive: { color: '#FFF0F3' },
  filterChip: { borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  filterChipActive: { backgroundColor: '#45101D', borderColor: '#9C263C' },
  filterText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#FFF0F3' },
  listCount: { color: C.subtle, marginLeft: 'auto', fontSize: 10 },
  trackRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 8, marginBottom: 5, borderRadius: 13, backgroundColor: '#100D12', borderWidth: 1, borderColor: '#211820' },
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
  rowIconButton: { width: 46, height: 48, alignItems: 'center', justifyContent: 'center' },
  rowIcon: { color: '#9E8992', fontSize: 19 },
  favoriteOn: { color: C.red },
  actionButton: { width: 50, height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
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
  seekBlock: { marginTop: 25, marginBottom: 17 },
  seekTouchArea: { height: 68, justifyContent: 'center', overflow: 'visible' },
  seekTrack: { height: 14, borderRadius: 10, backgroundColor: '#38242D', justifyContent: 'center', overflow: 'visible' },
  seekProgress: { height: 14, borderRadius: 10, backgroundColor: C.red },
  seekKnob: { position: 'absolute', marginLeft: -13, width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF0F4', borderWidth: 3, borderColor: C.red, elevation: 3 },
  seekLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  quickSeekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: -3, marginBottom: 12 },
  quickSeekButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, backgroundColor: '#100B11', alignItems: 'center', justifyContent: 'center' },
  quickSeekText: { fontSize: 11, fontWeight: '800' },
  playerExtraCard: { borderRadius: 16, borderWidth: 1, padding: 13, marginTop: 6, marginBottom: 18 },
  playerExtraLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  speedOptions: { flexDirection: 'row', gap: 6, marginTop: 10 },
  speedOption: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#100C12', borderWidth: 1, borderColor: C.line },
  speedOptionText: { color: C.muted, fontSize: 11, fontWeight: '900' },
  volumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  volumeValue: { fontSize: 11, fontWeight: '900' },
  volumeControl: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  volumeStep: { width: 42, height: 42, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#100C12' },
  volumeStepText: { fontSize: 21, fontWeight: '900' },
  volumeTrackTouch: { flex: 1, height: 44, justifyContent: 'center', paddingVertical: 8 },
  volumeTrack: { height: 9, borderRadius: 9, overflow: 'hidden', backgroundColor: '#38242D' },
  volumeProgress: { height: '100%', borderRadius: 9 },
  seekTime: { color: C.subtle, fontSize: 11, fontVariant: ['tabular-nums'] },
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
  miniPlayButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  miniPlayGlyph: { color: C.red, fontSize: 21, fontWeight: '900' },
  miniNextButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  miniNextGlyph: { color: C.muted, fontSize: 17 },
  bottomNav: { height: 76, flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#0C090D', borderTopWidth: 1, borderTopColor: '#2A1B23', paddingHorizontal: 4 },
  navItem: { flex: 1, minHeight: 68, alignItems: 'center', justifyContent: 'center', position: 'relative', gap: 2 },
  navGlyph: { fontSize: 20, color: C.subtle, height: 23 },
  navGlyphActive: { color: C.red },
  navLabel: { color: C.subtle, fontSize: 8, fontWeight: '700' },
  navLabelActive: { color: '#F7CFD7' },
  navIndicator: { position: 'absolute', bottom: 0, width: 25, height: 2, backgroundColor: C.red, borderRadius: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  profileAvatar: { width: 64, height: 64, borderRadius: 21, borderWidth: 1, backgroundColor: '#160A11', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  profileAvatarImage: { width: '100%', height: '100%' },
  profileNameWrap: { flex: 1, minWidth: 0 },
  profileNameInput: { height: 44, color: C.text, fontSize: 14, fontWeight: '900', borderBottomWidth: 1, borderBottomColor: C.line },
  settingsSubLabel: { color: C.muted, fontSize: 10, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  colorSwatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  colorSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)' },
  colorSwatchActive: { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.12 }] },
  customColorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorInput: { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, backgroundColor: '#0B080C', color: C.text, paddingHorizontal: 12, fontSize: 13 },
  settingsButtonRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  settingsActionButton: { minHeight: 46, paddingHorizontal: 13, borderRadius: 11, borderWidth: 1, borderColor: C.line, justifyContent: 'center', alignItems: 'center', backgroundColor: '#100B10' },
  settingsActionText: { color: C.muted, fontSize: 10, fontWeight: '900' },
  seasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  seasonChoice: { width: '48%', minHeight: 75, borderRadius: 13, borderWidth: 1, borderColor: C.line, backgroundColor: '#100B10', alignItems: 'center', justifyContent: 'center', gap: 5 },
  seasonChoiceActive: { borderWidth: 2, backgroundColor: '#33121E' },
  seasonGlyph: { fontSize: 22 },
  seasonLabel: { color: C.text, fontSize: 10, fontWeight: '800' },
  backgroundPreview: { width: '100%', height: 120, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: C.line },
  resetProfileButton: { minHeight: 52, borderRadius: 13, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#160A10' },
  resetProfileText: { fontSize: 11, fontWeight: '900' },
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
