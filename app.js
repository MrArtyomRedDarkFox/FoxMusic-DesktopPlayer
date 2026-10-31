'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const LOGO = 'assets/foxsmusic-logo.png';
  const DB_NAME = 'foxsmusic-local-library';
  const DB_VERSION = 1;
  const STORE_NAME = 'tracks';
  const PLAYLISTS_KEY = 'foxsmusic-playlists-v1';
  const SETTINGS_KEY = 'foxsmusic-settings-v1';
  const AUDIO_EXTENSIONS = new Set(['mp3','wav','flac','ogg','m4a','aac','opus','wma','aiff','alac','webm','oga','mp4']);

  const ICONS = {
    sliders: '<path d="M4 7h8M16 7h4M4 17h3M11 17h9"/><circle cx="14" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    expand: '<path d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="0.7"/><path d="M12 3a9 9 0 0 1 9 9M3 12a9 9 0 0 0 9 9"/>',
    heart: '<path d="M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.4 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r=".8"/><circle cx="4" cy="12" r=".8"/><circle cx="4" cy="18" r=".8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    folder: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z"/><path d="M3.5 10h17"/>',
    sort: '<path d="M4 7h16M7 12h10m-7 5h4"/>',
    shuffle: '<path d="m16 3 4 4-4 4M4 7h3c5 0 5 10 10 10h3M16 13l4 4-4 4M4 17h3c1.4 0 2.4-.9 3.2-2"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    audio: '<path d="M4 10v4M8 6v12m4-16v20m4-15v10m4-13v16m4-12v8"/>',
    headphones: '<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="2" y="13" width="5" height="8" rx="2"/><rect x="17" y="13" width="5" height="8" rx="2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    play: '<path d="m8 5 12 7-12 7Z"/>',
    pause: '<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',
    previous: '<path d="M6 5v14M19 5l-10 7 10 7Z"/>',
    next: '<path d="M18 5v14M5 5l10 7-10 7Z"/>',
    repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    muted: '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="m16 9 5 6m0-6-5 6"/>',
    queue: '<path d="M4 6h15M4 12h15M4 18h9"/><path d="M20 16v5m-2.5-2.5h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a7.5 7.5 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a7.5 7.5 0 0 1-1.8-1l-1.7.6-1.4-2.4 1.4-1.1A7.1 7.1 0 0 1 7 13l-1.8-.3V9.9L7 9.6a7.5 7.5 0 0 1 1-1.8l-.6-1.7 2.4-1.4 1.1 1.4a7.1 7.1 0 0 1 2-.1l.3-1.8H16l.3 1.8a7.5 7.5 0 0 1 1.8 1l1.7-.6 1.4 2.4-1.4 1.1a7.1 7.1 0 0 1 .1 2Z" transform="translate(-1 -1) scale(1.05)"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m-10 0 1 14h10l1-14M10 10v6m4-6v6"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    playlist: '<path d="M4 6h11M4 11h11M4 16h8"/><path d="M18 5v13a2 2 0 1 1-2-2h2"/>',
    arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M5 18v3h14v-3"/>',
    gamepad: '<path d="M6 11h4m-2-2v4m7-1h.01M18 10h.01"/><path d="M6 7h12a4 4 0 0 1 3.8 5.2l-1.1 3.7a2 2 0 0 1-3.3.9l-2-1.8H8.6l-2 1.8a2 2 0 0 1-3.3-.9l-1.1-3.7A4 4 0 0 1 6 7Z"/>',
    flame: '<path d="M12 22c4.4 0 7-3.2 7-7 0-2.9-1.6-5.2-4.5-8-.2 3-1.4 4.2-2.1 4.7C12.9 7.2 11.7 4.7 8.4 2 8.7 6.6 5 9.2 5 14.4 5 18.5 7.8 22 12 22Z"/><path d="M12 19c1.7 0 2.8-1.3 2.8-2.8 0-1.2-.7-2.2-1.9-3.4-.1 1.2-.6 1.6-.9 1.8-.2-1.1-.7-1.8-1.9-2.8.1 1.9-1 2.7-1 4.5A2.7 2.7 0 0 0 12 19Z"/>',
    moon: '<path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.7 8.7 0 1 0 20.5 14.3Z"/>',
    fox: '<path d="m4 8 1-5 5 3a11 11 0 0 1 4 0l5-3 1 5a10 10 0 0 1-1 10l-6 4-6-4A10 10 0 0 1 4 8Z"/><path d="m8 13 4 2 4-2M10 11h.01M14 11h.01"/>'
  };

  function svgIcon(name, extraClass = '') {
    const shape = ICONS[name] || ICONS.music;
    return `<svg class="${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${shape}</svg>`;
  }
  $$('[data-icon]').forEach(node => { node.innerHTML = svgIcon(node.dataset.icon); });
  const nowPlayingBars = $('#nowPlayingBars');
  if (nowPlayingBars && !nowPlayingBars.children.length) {
    const barsFragment = document.createDocumentFragment();
    for (let i = 0; i < 36; i++) { const bar = document.createElement('i'); bar.style.setProperty('--bar-index', String(i)); bar.style.setProperty('--bar-height', `${12 + ((i * 17) % 77)}%`); barsFragment.appendChild(bar); }
    nowPlayingBars.appendChild(barsFragment);
  }

  const ui = {
    audio: $('#audioElement'),
    audioInput: $('#audioInput'), folderInput: $('#folderInput'), coverInput: $('#coverInput'),
    trackList: $('#trackList'), emptyState: $('#emptyState'), queueList: $('#queueList'), queueEmpty: $('#queueEmpty'),
    search: $('#searchInput'), viewTitle: $('#viewTitle'), viewSubtitle: $('#viewSubtitle'),
    listHeading: $('#listHeading'), listSubheading: $('#listSubheading'), trackTotal: $('#trackTotal'),
    libraryCount: $('#libraryCount'), queueCount: $('#queueCount'), queueContextLabel: $('#queueContextLabel'),
    queueDuration: $('#queueDuration'), nowCover: $('#nowCover'), nowTitle: $('#nowTitle'), nowArtist: $('#nowArtist'),
    nowStatus: $('#nowStatus'), nowFavoriteBtn: $('#nowFavoriteBtn'), playBtn: $('#playBtn'), seekBar: $('#seekBar'),
    currentTime: $('#currentTime'), durationText: $('#durationText'), volumeBar: $('#volumeBar'), muteBtn: $('#muteBtn'),
    shuffleBtn: $('#shuffleBtn'), repeatBtn: $('#repeatBtn'), sortBtn: $('#sortBtn'), playlistNav: $('#playlistNav'),
    modalRoot: $('#modalRoot'), toastRegion: $('#toastRegion'), heroEqualizer: $('#heroEqualizer'), storageText: $('#storageText'),
    soundStudio: $('#soundStudio'), soundSpectrum: $('#soundSpectrum')
  };
  // Local originals are streamed through a CORS-enabled custom protocol so Web Audio can analyse them.
  ui.audio.crossOrigin = 'anonymous';
  const primaryAudioDeck = ui.audio;
  const secondaryAudioDeck = new Audio();
  secondaryAudioDeck.preload = 'auto'; secondaryAudioDeck.crossOrigin = 'anonymous';
  const audioDecks = [primaryAudioDeck, secondaryAudioDeck];
  const deckGainNodes = new WeakMap();
  const deckSourceNodes = new WeakMap();

  const savedSettings = loadSettings();
  let dbPromise;
  let tracks = [];
  let playlists = loadPlaylists();
  let currentTrackId = null;
  let activeView = 'all';
  let activePlaylistId = null;
  let playbackQueueIds = Array.isArray(savedSettings.playbackQueueIds) ? savedSettings.playbackQueueIds.filter(id => typeof id === 'string').slice(0, 10000) : [];
  let queueExplicit = savedSettings.queueExplicit === true;
  let playbackHistory = Array.isArray(savedSettings.playbackHistory) ? savedSettings.playbackHistory.filter(item => item && typeof item.id === 'string').slice(0, 100) : [];
  let customEqPresets = savedSettings.customEqPresets && typeof savedSettings.customEqPresets === 'object' ? savedSettings.customEqPresets : {};
  let shuffleEnabled = false;
  let shuffleOrderIds = Array.isArray(savedSettings.shuffleOrderIds) ? savedSettings.shuffleOrderIds.filter(id => typeof id === 'string').slice(0, 10000) : [];
  let repeatMode = 'off';
  let sortMode = 'recent';
  const DEFAULT_PROFILE_APPEARANCE = Object.freeze({ style: 'classic', mode: 'normal', accentColor: '#ff1f35', gradient: 'crimson' });
  const PROFILE_STYLES = new Set(['classic', 'neon', 'glass']);
  const PROFILE_MODES = new Set(['normal', 'halloween', 'christmas']);
  const PROFILE_GRADIENTS = {
    crimson: { a: '#10090c', b: '#260710', c: '#090607' },
    ember: { a: '#110905', b: '#351306', c: '#090607' },
    violet: { a: '#0d0812', b: '#281039', c: '#080609' },
    ocean: { a: '#050c10', b: '#0a2934', c: '#07090b' },
    mono: { a: '#090909', b: '#202020', c: '#080808' }
  };
  const profileAppearance = {
    style: PROFILE_STYLES.has(savedSettings.profileStyle) ? savedSettings.profileStyle : DEFAULT_PROFILE_APPEARANCE.style,
    mode: PROFILE_MODES.has(savedSettings.profileMode) ? savedSettings.profileMode : DEFAULT_PROFILE_APPEARANCE.mode,
    accentColor: /^#[0-9a-fA-F]{6}$/.test(savedSettings.profileAccentColor || '') ? savedSettings.profileAccentColor : DEFAULT_PROFILE_APPEARANCE.accentColor,
    gradient: Object.prototype.hasOwnProperty.call(PROFILE_GRADIENTS, savedSettings.profileGradient) ? savedSettings.profileGradient : DEFAULT_PROFILE_APPEARANCE.gradient
  };
  let currentLocale = ['ru', 'en', 'de'].includes(savedSettings.language) ? savedSettings.language : 'ru';
  let effectsEnabled = savedSettings.effectsEnabled !== false;
  let activeLibraryFolderPath = typeof savedSettings.libraryFolderPath === 'string' && savedSettings.libraryFolderPath ? savedSettings.libraryFolderPath : null;
  let librarySourcePaths = Array.isArray(savedSettings.librarySourcePaths) ? savedSettings.librarySourcePaths.filter(item => typeof item === 'string' && item.trim()).slice(0, 100) : [];
  if (activeLibraryFolderPath && !librarySourcePaths.some(item => normalizeFilePath(item) === normalizeFilePath(activeLibraryFolderPath))) librarySourcePaths.unshift(activeLibraryFolderPath);
  let activeFolderTrackPaths = null;
  let previousVolume = 0.76;
  const audioSettings = {
    playbackRate: Number.isFinite(savedSettings.playbackRate) ? clamp(savedSettings.playbackRate, 0.5, 1.5) : 1,
    bass: Number.isFinite(savedSettings.bass) ? clamp(savedSettings.bass, -12, 12) : 0,
    mid: Number.isFinite(savedSettings.mid) ? clamp(savedSettings.mid, -12, 12) : 0,
    treble: Number.isFinite(savedSettings.treble) ? clamp(savedSettings.treble, -12, 12) : 0,
    gain: Number.isFinite(savedSettings.gain) ? clamp(savedSettings.gain, 50, 150) : 100,
    crossfadeSeconds: Number.isFinite(savedSettings.crossfadeSeconds) ? clamp(savedSettings.crossfadeSeconds, 0, 8) : 3,
    normalizeEnabled: savedSettings.normalizeEnabled !== false
  };
  let audioContext = null;
  let mediaSourceNode = null;
  let bassFilterNode = null;
  let midFilterNode = null;
  let trebleFilterNode = null;
  let masterGainNode = null;
  let normalizationGainNode = null;
  let normalizationAnalyserNode = null;
  let normalizationGainEstimate = 1;
  let compressorNode = null;
  let crossfadeGeneration = 0;
  let autoCrossfadeRunning = false;
  let analyserNode = null;
  let visualizerFrame = 0;
  let currentObjectUrl = null;
  let toastTimerIds = new Set();
  let importInProgress = false;

  function loadPlaylists() {
    try {
      const stored = JSON.parse(localStorage.getItem(PLAYLISTS_KEY));
      if (Array.isArray(stored)) return stored;
    } catch (_) {}
    return [
      { id: newId(), name: 'Для игр', createdAt: Date.now() - 3000 },
      { id: newId(), name: 'Атмосфера', createdAt: Date.now() - 2000 },
      { id: newId(), name: 'Dark Fox', createdAt: Date.now() - 1000 }
    ];
  }
  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (_) { return {}; }
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function persistSettings() {
    const settings = { effectsEnabled, language: currentLocale, libraryFolderPath: activeLibraryFolderPath, librarySourcePaths: [...librarySourcePaths].slice(0, 100), profileStyle: profileAppearance.style, profileMode: profileAppearance.mode, profileAccentColor: profileAppearance.accentColor, profileGradient: profileAppearance.gradient, volume: ui.audio.volume, muted: ui.audio.muted, shuffleEnabled, shuffleOrderIds, repeatMode, playbackQueueIds, queueExplicit, playbackHistory, customEqPresets, ...audioSettings };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
  }
  function persistPlaylists() {
    try { localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists)); } catch (_) {}
  }
  const LANGUAGES = {
    ru: {
      settings: 'Настройки', close: 'Закрыть', author: 'Автор:', language: 'Язык интерфейса', languageDescription: 'Выбери язык приложения.', profileAppearance: 'Оформление профиля', profileAppearanceDescription: 'Настрой стиль, сезонный режим, основной цвет и градиент.', profileMode: 'Сезонный режим', profileModeNormal: 'Обычный', profileModeHalloween: 'Хэллоуинский', profileModeChristmas: 'Новогодний', profileStyle: 'Вид профиля', profileStyleClassic: 'Классический', profileStyleNeon: 'Неоновый', profileStyleGlass: 'Стеклянный', profileColor: 'Основной цвет', profileGradient: 'Градиент', gradientCrimson: 'Багровый', gradientEmber: 'Тлеющий огонь', gradientViolet: 'Фиолетовый', gradientOcean: 'Океан', gradientMono: 'Монохром', profilePreview: 'ПРОФИЛЬ FOXSMUSIC', resetProfileAppearance: 'Сбросить оформление профиля и цвет', profileAppearanceResetDone: 'Оформление профиля и цвет сброшены.',
      effects: 'Визуальные эффекты', effectsDescription: 'Свечение, движение фона и анимации.', effectsDefault: 'Эффекты включены по умолчанию.', effectsOn: 'Визуальные эффекты включены', effectsOff: 'Визуальные эффекты выключены', clearImportedTitle: 'Очистить импортированные треки', clearImportedDescription: 'Уберёт треки из FoxsMusic, но оставит оригинальные файлы на компьютере.', clearImportedButton: 'Очистить', clearImportedConfirmTitle: 'Удалить все треки из библиотеки?', clearImportedConfirmMessage: 'Из FoxsMusic будут удалены записи всех {count} треков. Оригинальные аудиофайлы на компьютере останутся нетронутыми. Продолжить?', clearImportedConfirmButton: 'Удалить все треки', clearImportedDone: 'Импортированные треки удалены. Оригинальные файлы сохранены.', clearImportedNothing: 'Библиотека уже пуста.', clearImportedFailed: 'Не удалось очистить библиотеку. Попробуй ещё раз.', libraryHealth: 'Умная библиотека', libraryHealthDescription: 'Найди точные дубликаты и проверь доступность оригинальных файлов.', manageLibrarySources: 'Добавить папки-источники', scanAllSourceDuplicates: 'Найти дубликаты во всех источниках', sourceFoldersNote: 'Проверяются все зарегистрированные папки-источники, включая вложенные папки. После подтверждения лишние точные копии перемещаются в системную корзину; один оригинал каждой группы остаётся.', sourceFoldersEmpty: 'Папки-источники не добавлены. Выбери папки для проверки файловых дубликатов.', sourceFolderActive: 'Текущий источник отображается в библиотеке', sourceFolderRemove: 'Убрать папку из проверки', sourcesAdded: 'Добавлено папок-источников: {count}.', analyzeLibrary: 'Проверить библиотеку', analyzingLibrary: 'Проверяю…', auditTitle: 'Проверка библиотеки', auditSummary: 'Проверено записей: {total}. Оригиналы недоступны: {missing}. Групп точных дубликатов: {groups}. Лишних записей: {extras}.', auditMissing: 'Оригинальные файлы не найдены', auditDuplicates: 'Точные дубликаты', auditNoMissing: 'Недоступные оригиналы не найдены.', auditNoDuplicates: 'Точных дубликатов не найдено.', auditRemoveDuplicates: 'Удалить лишние записи', auditConfirmTitle: 'Удалить дублирующие записи?', auditConfirmMessage: 'Будут удалены только повторные записи в библиотеке FoxsMusic. Оригинальные музыкальные файлы на диске останутся нетронутыми.', auditRemoved: 'Дублирующие записи удалены. Оригинальные файлы сохранены.', auditFailed: 'Не удалось проверить библиотеку. Попробуй ещё раз.', missingFile: 'ОРИГИНАЛ НЕ НАЙДЕН', auditNoFilePath: 'У записи нет доступного оригинального файла.', auditMissingHelp: 'В меню трека выбери «Найти оригинальный файл», чтобы восстановить ссылку.', auditBlobTooLarge: 'Некоторые старые записи слишком велики для безопасной проверки содержимого; они не использовались для поиска дубликатов.', duplicateImportSkipped: 'Пропущено уже добавленных файлов: {count}.' ,
      originalPath: 'Оригинальный путь к файлу', openInFolder: 'Показать исходный файл в папке', locateOriginal: 'Найти оригинальный файл', originalPathNotSaved: 'У этой старой записи нет сохранённого исходного пути. Найди оригинал, чтобы использовать файл напрямую.', openFolderFailed: 'Не удалось открыть расположение файла. Возможно, файл был перемещён или удалён.', linkedOriginal: 'Оригинальный файл подключён',
      library: 'БИБЛИОТЕКА', myMusic: 'Моя музыка', favorites: 'Избранное', playlists: 'Плейлисты', addMusic: 'Добавить музыку', importFolder: 'Папка библиотеки', folderSourceLabel: 'ИСТОЧНИК БИБЛИОТЕКИ', clearFolderSource: 'Показать всю библиотеку', folderSourceCleared: 'Показаны все треки библиотеки.', folderSourceSelected: 'Папка подключена как источник библиотеки.', folderSourceEmpty: 'В выбранной папке аудиофайлы не найдены.', folderSourceUnavailable: 'Не удалось прочитать папку-источник. Выбери папку заново.', yourPlaylists: 'ТВОИ ПЛЕЙЛИСТЫ', smartMostPlayed: 'ЧАСТО ПРОСЛУШИВАЕМЫЕ', smartRecentlyAdded: 'НЕДАВНО ДОБАВЛЕННЫЕ', smartMostPlayedSubtitle: 'Топ-50 по реальным прослушиваниям: не менее половины трека или 30 секунд.', smartRecentlyAddedSubtitle: '50 последних файлов по дате изменения в исходной папке.', smartMostPlayedEmptyTitle: 'Пока нет часто прослушиваемых треков', smartMostPlayedEmptyText: 'Включи несколько песен — список будет автоматически сортироваться по числу прослушиваний.', openMyMusic: 'Открыть мою музыку', playCountColumn: 'ПРОСЛУШИВАНИЙ',
      storage: 'Библиотека хранится на устройстве', slogan: 'ТВОЯ МУЗЫКА. ТВОИ ПРАВИЛА.', viewTitle: 'Моя музыка', viewSubtitle: 'Тёмный звук для твоего мира.', heroLine1: 'Твоя коллекция. Твой ритм.', heroLine2: 'Ни одного лишнего звука.', uploadMusic: 'Загрузить музыку',
      recentlyAdded: 'Недавно добавленные', sortByTitle: 'По названию', tracks: 'Треки библиотеки', tracksSub: 'Музыка, которая хранится у тебя', favoritesTracks: 'Любимые треки', favoritesSub: 'Твоя личная подборка', playlistTracks: 'Треки плейлиста', playlistsMusic: 'Музыка в плейлистах', playlistSub: 'Твои подборки на этом устройстве', searchResults: 'Результаты', searchFor: 'Поиск по запросу', foundTracks: 'Найденные треки', matches: 'Совпадений',
      columnName: 'НАЗВАНИЕ', added: 'ДОБАВЛЕН', dateAdded: 'Добавлен', sourceFileDate: 'Файл изменён', emptyTitle: 'Твоя музыка начинается здесь', emptyNoResults: 'Ничего не найдено', emptyText: 'Добавь MP3, WAV, FLAC, OGG или другой аудиофайл.<br>Треки останутся в библиотеке на этом устройстве.', emptySearchText: 'В этом разделе пока нет подходящих треков.<br>Смени поиск или добавь музыку в избранное / плейлист.', chooseAudio: 'Выбрать аудиофайлы', clearSearch: 'Очистить поиск', dropHint: 'или перетащи файлы в окно', trackActions: 'Действия с треком', clearQueue: 'Очистить очередь',
      queueTitle: 'Текущий плейлист', queueEmpty: 'Здесь появятся треки<br>из твоей библиотеки', queueAdd: 'Добавить музыку', localLibrary: 'Локальная библиотека', unknownArtist: 'Неизвестный исполнитель',
      studioTitle: 'Звуковая студия', studioIntro: 'Настрой звучание под своё настроение. Эффекты применяются сразу.', speed: 'Скорость воспроизведения', gain: 'Усиление звука', bass: 'Басы', mid: 'Средние частоты', treble: 'Высокие частоты', resetSound: 'Сбросить настройки', ready: 'ГОТОВ К ЗВУКУ', live: 'LIVE · АНАЛИЗ',
      playerChoose: 'Выбери трек и погружайся в звук', readyStatus: 'ГОТОВ К ВОСПРОИЗВЕДЕНИЮ', playingStatus: 'СЕЙЧАС ИГРАЕТ', pausedStatus: 'ПАУЗА', play: 'Воспроизвести', pause: 'Пауза', favoriteAdd: 'В избранное', favoriteRemove: 'Убрать из избранного', mute: 'Без звука', unmute: 'Включить звук', shuffleOn: 'Выключить перемешивание', shuffleOff: 'Включить перемешивание', repeatOff: 'Повтор выключен', repeatAll: 'Повтор всего плейлиста', repeatOne: 'Повтор одного трека', fullscreen: 'Полноэкранный режим', help: 'Подсказка', searchPlaceholder: 'Поиск музыки, исполнителя...',
      noPlaylists: 'Нажми +, чтобы создать свою подборку.', effectEnabledToast: 'Анимации включены', effectDisabledToast: 'Анимации выключены', helpTitle: 'FoxsMusic · Быстрые клавиши', helpIntro: 'Управляй музыкой с клавиатуры. На мобильных устройствах используй кнопки плеера.', space: 'Воспроизведение / пауза', seek: 'Перемотка на 5 секунд', searchShortcut: 'Поиск музыки', volumeShortcut: 'Громкость ±5%', muteShortcut: 'Включить / выключить звук', navigationShortcut: 'Следующий / предыдущий трек', shuffleShortcut: 'Перемешивание вкл. / выкл.', repeatShortcut: 'Переключить режим повтора', fullscreenShortcut: 'Включить / выключить полный экран', studioShortcut: 'Открыть / закрыть звуковую студию', closeWindow: 'Закрыть открытое окно или панель', understood: 'Понятно',
      trackSuffixOne: 'трек', trackSuffixFew: 'трека', trackSuffixMany: 'треков'
    },
    en: {
      settings: 'Settings', close: 'Close', author: 'Author:', language: 'Interface language', languageDescription: 'Choose the app language.', profileAppearance: 'Profile appearance', profileAppearanceDescription: 'Customize style, seasonal mode, accent color and gradient.', profileMode: 'Seasonal mode', profileModeNormal: 'Normal', profileModeHalloween: 'Halloween', profileModeChristmas: 'Christmas', profileStyle: 'Profile style', profileStyleClassic: 'Classic', profileStyleNeon: 'Neon', profileStyleGlass: 'Glass', profileColor: 'Accent color', profileGradient: 'Gradient', gradientCrimson: 'Crimson', gradientEmber: 'Ember', gradientViolet: 'Violet', gradientOcean: 'Ocean', gradientMono: 'Monochrome', profilePreview: 'FOXSMUSIC PROFILE', resetProfileAppearance: 'Reset profile style and color', profileAppearanceResetDone: 'Profile appearance and color reset.', effects: 'Visual effects', effectsDescription: 'Glow, background motion and animations.', effectsDefault: 'Effects are enabled by default.', effectsOn: 'Visual effects enabled', effectsOff: 'Visual effects disabled', clearImportedTitle: 'Clear imported tracks', clearImportedDescription: 'Remove tracks from FoxsMusic while keeping the original files on your computer.', clearImportedButton: 'Clear', clearImportedConfirmTitle: 'Remove all tracks from the library?', clearImportedConfirmMessage: 'All {count} track entries will be removed from FoxsMusic. The original audio files on your computer will not be touched. Continue?', clearImportedConfirmButton: 'Remove all tracks', clearImportedDone: 'Imported tracks removed. Original files were kept.', clearImportedNothing: 'The library is already empty.', clearImportedFailed: 'Could not clear the library. Please try again.', libraryHealth: 'Smart library', libraryHealthDescription: 'Find exact duplicates and check whether original files are available.', manageLibrarySources: 'Add source folders', scanAllSourceDuplicates: 'Find duplicates across all sources', sourceFoldersNote: 'All registered source folders, including subfolders, are checked. After confirmation, extra exact copies go to the system Recycle Bin; one original per group is kept.', sourceFoldersEmpty: 'No source folders added. Choose folders to scan for duplicate files.', sourceFolderActive: 'Currently displayed library source', sourceFolderRemove: 'Remove folder from duplicate checks', sourcesAdded: 'Source folders added: {count}.', analyzeLibrary: 'Check library', analyzingLibrary: 'Checking…', auditTitle: 'Library check', auditSummary: 'Entries checked: {total}. Originals unavailable: {missing}. Exact duplicate groups: {groups}. Extra entries: {extras}.', auditMissing: 'Original files not found', auditDuplicates: 'Exact duplicates', auditNoMissing: 'No unavailable originals found.', auditNoDuplicates: 'No exact duplicates found.', auditRemoveDuplicates: 'Remove duplicate entries', auditConfirmTitle: 'Remove duplicate entries?', auditConfirmMessage: 'Only redundant entries in FoxsMusic will be removed. Original music files on disk will not be touched.', auditRemoved: 'Duplicate entries removed. Original files were kept.', auditFailed: 'Could not check the library. Please try again.', missingFile: 'ORIGINAL MISSING', auditNoFilePath: 'This entry has no available original audio file.', auditMissingHelp: 'Open the track menu and choose “Locate original file” to relink it.', auditBlobTooLarge: 'Some old entries are too large to safely fingerprint; they were skipped for duplicate detection.', duplicateImportSkipped: 'Skipped files already in the library: {count}.',
      originalPath: 'Original file path', openInFolder: 'Show original file in folder', locateOriginal: 'Locate original file', originalPathNotSaved: 'This older library entry has no saved source path. Locate the original to use the file directly.', openFolderFailed: 'Could not open the file location. The file may have been moved or deleted.', linkedOriginal: 'Original file linked',
      library: 'LIBRARY', myMusic: 'My music', favorites: 'Favorites', playlists: 'Playlists', addMusic: 'Add music', importFolder: 'Library folder', folderSourceLabel: 'LIBRARY SOURCE', clearFolderSource: 'Show full library', folderSourceCleared: 'Showing all library tracks.', folderSourceSelected: 'Folder connected as the library source.', folderSourceEmpty: 'No audio files were found in that folder.', folderSourceUnavailable: 'Could not read the source folder. Choose it again.', yourPlaylists: 'YOUR PLAYLISTS', smartMostPlayed: 'MOST PLAYED', smartRecentlyAdded: 'RECENTLY ADDED', smartMostPlayedSubtitle: 'Your 50 most-played tracks, counted after half a track or 30 seconds of listening.', smartRecentlyAddedSubtitle: 'The 50 newest source files, sorted by their original file date.', smartMostPlayedEmptyTitle: 'No frequently played tracks yet', smartMostPlayedEmptyText: 'Play a few tracks and this list will automatically rank them by play count.', openMyMusic: 'Open my music', playCountColumn: 'PLAYS',
      storage: 'Library is stored on this device', slogan: 'YOUR MUSIC. YOUR RULES.', viewTitle: 'My music', viewSubtitle: 'Dark sound for your world.', heroLine1: 'Your collection. Your rhythm.', heroLine2: 'Nothing but sound.', uploadMusic: 'Upload music',
      recentlyAdded: 'Recently added', sortByTitle: 'Sort by title', tracks: 'Library tracks', tracksSub: 'Music stored on your device', favoritesTracks: 'Favorite tracks', favoritesSub: 'Your personal collection', playlistTracks: 'Playlist tracks', playlistsMusic: 'Music in playlists', playlistSub: 'Your collections on this device', searchResults: 'Results', searchFor: 'Search results for', foundTracks: 'Tracks found', matches: 'Matches',
      columnName: 'TITLE', added: 'ADDED', dateAdded: 'Added', sourceFileDate: 'File modified', emptyTitle: 'Your music starts here', emptyNoResults: 'Nothing found', emptyText: 'Add MP3, WAV, FLAC, OGG or another audio file.<br>Tracks stay in the library on this device.', emptySearchText: 'There are no matching tracks in this view yet.<br>Change the search or add music to favorites / a playlist.', chooseAudio: 'Choose audio files', clearSearch: 'Clear search', dropHint: 'or drag files into the window', trackActions: 'Track actions', clearQueue: 'Clear queue',
      queueTitle: 'Current playlist', queueEmpty: 'Tracks from your library<br>will appear here', queueAdd: 'Add music', localLibrary: 'Local library', unknownArtist: 'Unknown artist',
      studioTitle: 'Sound studio', studioIntro: 'Tune the sound to your mood. Effects apply instantly.', speed: 'Playback speed', gain: 'Output gain', bass: 'Bass', mid: 'Midrange', treble: 'Treble', resetSound: 'Reset settings', ready: 'READY FOR AUDIO', live: 'LIVE · ANALYSIS',
      playerChoose: 'Choose a track and dive into sound', readyStatus: 'READY TO PLAY', playingStatus: 'NOW PLAYING', pausedStatus: 'PAUSED', play: 'Play', pause: 'Pause', favoriteAdd: 'Add to favorites', favoriteRemove: 'Remove from favorites', mute: 'Mute', unmute: 'Unmute', shuffleOn: 'Turn shuffle off', shuffleOff: 'Turn shuffle on', repeatOff: 'Repeat off', repeatAll: 'Repeat playlist', repeatOne: 'Repeat one track', fullscreen: 'Fullscreen', help: 'Help', searchPlaceholder: 'Search music, artist...',
      noPlaylists: 'Press + to create your own playlist.', effectEnabledToast: 'Animations enabled', effectDisabledToast: 'Animations disabled', helpTitle: 'FoxsMusic · Keyboard shortcuts', helpIntro: 'Control music with your keyboard. On mobile, use the player buttons.', space: 'Play / pause', seek: 'Seek ±5 seconds', searchShortcut: 'Search music', volumeShortcut: 'Volume ±5%', muteShortcut: 'Toggle mute', navigationShortcut: 'Next / previous track', shuffleShortcut: 'Toggle shuffle', repeatShortcut: 'Cycle repeat mode', fullscreenShortcut: 'Toggle fullscreen', studioShortcut: 'Open / close Sound Studio', closeWindow: 'Close the open dialog or panel', understood: 'Got it',
      trackSuffixOne: 'track', trackSuffixFew: 'tracks', trackSuffixMany: 'tracks'
    },
    de: {
      settings: 'Einstellungen', close: 'Schließen', author: 'Autor:', language: 'Anzeigesprache', languageDescription: 'Wähle die Sprache der App.', profileAppearance: 'Profilgestaltung', profileAppearanceDescription: 'Stil, Saisonmodus, Akzentfarbe und Farbverlauf anpassen.', profileMode: 'Saisonmodus', profileModeNormal: 'Normal', profileModeHalloween: 'Halloween', profileModeChristmas: 'Weihnachten', profileStyle: 'Profilstil', profileStyleClassic: 'Klassisch', profileStyleNeon: 'Neon', profileStyleGlass: 'Glas', profileColor: 'Akzentfarbe', profileGradient: 'Farbverlauf', gradientCrimson: 'Purpurrot', gradientEmber: 'Glut', gradientViolet: 'Violett', gradientOcean: 'Ozean', gradientMono: 'Monochrom', profilePreview: 'FOXSMUSIC-PROFIL', resetProfileAppearance: 'Profilstil und Farbe zurücksetzen', profileAppearanceResetDone: 'Profilgestaltung und Farbe zurückgesetzt.', effects: 'Visuelle Effekte', effectsDescription: 'Leuchten, Hintergrundbewegung und Animationen.', effectsDefault: 'Effekte sind standardmäßig aktiviert.', effectsOn: 'Visuelle Effekte aktiviert', effectsOff: 'Visuelle Effekte deaktiviert', clearImportedTitle: 'Importierte Titel entfernen', clearImportedDescription: 'Entfernt Titel aus FoxsMusic, lässt Originaldateien auf dem Computer aber bestehen.', clearImportedButton: 'Leeren', clearImportedConfirmTitle: 'Alle Titel aus der Bibliothek entfernen?', clearImportedConfirmMessage: 'Alle {count} Titeleinträge werden aus FoxsMusic entfernt. Die Original-Audiodateien auf dem Computer bleiben unverändert. Fortfahren?', clearImportedConfirmButton: 'Alle Titel entfernen', clearImportedDone: 'Importierte Titel entfernt. Originaldateien bleiben erhalten.', clearImportedNothing: 'Die Bibliothek ist bereits leer.', clearImportedFailed: 'Die Bibliothek konnte nicht geleert werden. Bitte erneut versuchen.', libraryHealth: 'Intelligente Bibliothek', libraryHealthDescription: 'Exakte Duplikate finden und Verfügbarkeit der Originaldateien prüfen.', manageLibrarySources: 'Quellordner hinzufügen', scanAllSourceDuplicates: 'Duplikate in allen Quellen finden', sourceFoldersNote: 'Alle registrierten Quellordner einschließlich Unterordner werden geprüft. Nach Bestätigung kommen zusätzliche identische Kopien in den Papierkorb; eine Originaldatei pro Gruppe bleibt erhalten.', sourceFoldersEmpty: 'Keine Quellordner hinzugefügt. Wähle Ordner zur Duplikatprüfung.', sourceFolderActive: 'Aktuell in der Bibliothek angezeigte Quelle', sourceFolderRemove: 'Ordner aus der Duplikatprüfung entfernen', sourcesAdded: 'Quellordner hinzugefügt: {count}.', analyzeLibrary: 'Bibliothek prüfen', analyzingLibrary: 'Prüfe…', auditTitle: 'Bibliotheksprüfung', auditSummary: 'Geprüfte Einträge: {total}. Originale nicht verfügbar: {missing}. Gruppen exakter Duplikate: {groups}. Zusätzliche Einträge: {extras}.', auditMissing: 'Originaldateien nicht gefunden', auditDuplicates: 'Exakte Duplikate', auditNoMissing: 'Keine fehlenden Originaldateien gefunden.', auditNoDuplicates: 'Keine exakten Duplikate gefunden.', auditRemoveDuplicates: 'Doppelte Einträge entfernen', auditConfirmTitle: 'Doppelte Einträge entfernen?', auditConfirmMessage: 'Nur doppelte Einträge in FoxsMusic werden entfernt. Originale Musikdateien auf dem Laufwerk bleiben unverändert.', auditRemoved: 'Doppelte Einträge entfernt. Originaldateien bleiben erhalten.', auditFailed: 'Die Bibliothek konnte nicht geprüft werden. Bitte erneut versuchen.', missingFile: 'ORIGINAL FEHLT', auditNoFilePath: 'Für diesen Eintrag ist keine verfügbare Originaldatei vorhanden.', auditMissingHelp: 'Öffne das Trackmenü und wähle „Originaldatei suchen“, um sie erneut zu verknüpfen.', auditBlobTooLarge: 'Einige alte Einträge sind zu groß für eine sichere Fingerabdruckprüfung und wurden bei der Duplikatsuche übersprungen.', duplicateImportSkipped: 'Bereits vorhandene Dateien übersprungen: {count}.',
      originalPath: 'Originaler Dateipfad', openInFolder: 'Originaldatei im Ordner anzeigen', locateOriginal: 'Originaldatei suchen', originalPathNotSaved: 'Für diesen älteren Eintrag ist kein Quellpfad gespeichert. Wähle die Originaldatei, um sie direkt zu verwenden.', openFolderFailed: 'Der Dateispeicherort konnte nicht geöffnet werden. Die Datei wurde möglicherweise verschoben oder gelöscht.', linkedOriginal: 'Originaldatei verknüpft',
      library: 'BIBLIOTHEK', myMusic: 'Meine Musik', favorites: 'Favoriten', playlists: 'Wiedergabelisten', addMusic: 'Musik hinzufügen', importFolder: 'Musikordner', folderSourceLabel: 'BIBLIOTHEKSQUELLE', clearFolderSource: 'Gesamte Bibliothek zeigen', folderSourceCleared: 'Alle Bibliothekstitel werden angezeigt.', folderSourceSelected: 'Ordner als Bibliotheksquelle verbunden.', folderSourceEmpty: 'In diesem Ordner wurden keine Audiodateien gefunden.', folderSourceUnavailable: 'Der Quellordner konnte nicht gelesen werden. Wähle ihn erneut aus.', yourPlaylists: 'DEINE PLAYLISTS', smartMostPlayed: 'MEISTGEHÖRT', smartRecentlyAdded: 'KÜRZLICH HINZUGEFÜGT', smartMostPlayedSubtitle: 'Deine 50 meistgehörten Titel, gezählt ab einer halben Wiedergabe oder 30 Sekunden.', smartRecentlyAddedSubtitle: 'Die 50 neuesten Quelldateien, sortiert nach dem ursprünglichen Dateidatum.', smartMostPlayedEmptyTitle: 'Noch keine häufig gespielten Titel', smartMostPlayedEmptyText: 'Spiele ein paar Titel ab. Diese Liste wird automatisch nach Wiedergaben sortiert.', openMyMusic: 'Meine Musik öffnen', playCountColumn: 'WIEDERGABEN',
      storage: 'Bibliothek wird auf diesem Gerät gespeichert', slogan: 'DEINE MUSIK. DEINE REGELN.', viewTitle: 'Meine Musik', viewSubtitle: 'Dunkler Sound für deine Welt.', heroLine1: 'Deine Sammlung. Dein Rhythmus.', heroLine2: 'Nur der Klang zählt.', uploadMusic: 'Musik laden',
      recentlyAdded: 'Kürzlich hinzugefügt', sortByTitle: 'Nach Titel sortieren', tracks: 'Bibliothekstitel', tracksSub: 'Musik auf deinem Gerät', favoritesTracks: 'Lieblingstitel', favoritesSub: 'Deine persönliche Sammlung', playlistTracks: 'Playlist-Titel', playlistsMusic: 'Musik in Playlists', playlistSub: 'Deine Sammlungen auf diesem Gerät', searchResults: 'Ergebnisse', searchFor: 'Suchergebnisse für', foundTracks: 'Gefundene Titel', matches: 'Treffer',
      columnName: 'TITEL', added: 'HINZUGEFÜGT', dateAdded: 'Hinzugefügt', sourceFileDate: 'Datei geändert', emptyTitle: 'Deine Musik beginnt hier', emptyNoResults: 'Nichts gefunden', emptyText: 'Füge MP3, WAV, FLAC, OGG oder eine andere Audiodatei hinzu.<br>Titel bleiben in der Bibliothek auf diesem Gerät.', emptySearchText: 'In diesem Bereich gibt es keine passenden Titel.<br>Ändere die Suche oder füge Musik zu Favoriten / Playlist hinzu.', chooseAudio: 'Audiodateien auswählen', clearSearch: 'Suche löschen', dropHint: 'oder Dateien ins Fenster ziehen', trackActions: 'Titelaktionen', clearQueue: 'Warteschlange leeren',
      queueTitle: 'Aktuelle Wiedergabeliste', queueEmpty: 'Titel aus deiner Bibliothek<br>erscheinen hier', queueAdd: 'Musik hinzufügen', localLibrary: 'Lokale Bibliothek', unknownArtist: 'Unbekannter Interpret',
      studioTitle: 'Soundstudio', studioIntro: 'Passe den Klang deiner Stimmung an. Effekte werden sofort angewendet.', speed: 'Wiedergabegeschwindigkeit', gain: 'Ausgangsverstärkung', bass: 'Bass', mid: 'Mitten', treble: 'Höhen', resetSound: 'Einstellungen zurücksetzen', ready: 'BEREIT FÜR AUDIO', live: 'LIVE · ANALYSE',
      playerChoose: 'Wähle einen Titel und tauche in den Klang ein', readyStatus: 'BEREIT ZUM ABSPIELEN', playingStatus: 'LÄUFT GERADE', pausedStatus: 'PAUSE', play: 'Abspielen', pause: 'Pause', favoriteAdd: 'Zu Favoriten', favoriteRemove: 'Aus Favoriten entfernen', mute: 'Stummschalten', unmute: 'Ton einschalten', shuffleOn: 'Zufallswiedergabe ausschalten', shuffleOff: 'Zufallswiedergabe einschalten', repeatOff: 'Wiederholung aus', repeatAll: 'Playlist wiederholen', repeatOne: 'Titel wiederholen', fullscreen: 'Vollbildmodus', help: 'Hilfe', searchPlaceholder: 'Musik, Interpret suchen...',
      noPlaylists: 'Drücke +, um eine Playlist zu erstellen.', effectEnabledToast: 'Animationen aktiviert', effectDisabledToast: 'Animationen deaktiviert', helpTitle: 'FoxsMusic · Tastenkürzel', helpIntro: 'Steuere die Musik mit der Tastatur. Mobil kannst du die Player-Tasten nutzen.', space: 'Wiedergabe / Pause', seek: '±5 Sekunden springen', searchShortcut: 'Musik suchen', volumeShortcut: 'Lautstärke ±5%', muteShortcut: 'Stummschaltung umschalten', navigationShortcut: 'Nächster / vorheriger Titel', shuffleShortcut: 'Zufallswiedergabe umschalten', repeatShortcut: 'Wiederholmodus wechseln', fullscreenShortcut: 'Vollbild umschalten', studioShortcut: 'Soundstudio öffnen / schließen', closeWindow: 'Dialog oder geöffnetes Bedienfeld schließen', understood: 'Verstanden',
      trackSuffixOne: 'Titel', trackSuffixFew: 'Titel', trackSuffixMany: 'Titel'
    }
  };
  function tr(key) { return (LANGUAGES[currentLocale] || LANGUAGES.ru)[key] ?? LANGUAGES.ru[key] ?? key; }

  // Additional UI copy that used to remain hard-coded in Russian outside LANGUAGES.
  // Keys are the original Russian phrases; values are [English, German].
  const INLINE_TRANSLATIONS = new Map(Object.entries({
  "Настройки": [
    "Settings",
    "Einstellungen"
  ],
  "Язык интерфейса": [
    "Interface language",
    "Anzeigesprache"
  ],
  "Выбери язык приложения.": [
    "Choose the app language.",
    "Wähle die Sprache der App."
  ],
  "Русский": [
    "Russian",
    "Russisch"
  ],
  "Визуальные эффекты": [
    "Visual effects",
    "Visuelle Effekte"
  ],
  "Свечение, движение фона и анимации.": [
    "Glow, background motion and animations.",
    "Leuchten, Hintergrundbewegung und Animationen."
  ],
  "Эффекты включены по умолчанию.": [
    "Effects are enabled by default.",
    "Effekte sind standardmäßig aktiviert."
  ],
  "Оформление профиля": [
    "Profile appearance",
    "Profilgestaltung"
  ],
  "Настрой стиль, основной цвет и градиент.": [
    "Customize the style, accent color and gradient.",
    "Passe Stil, Akzentfarbe und Farbverlauf an."
  ],
  "ПРОФИЛЬ FOXSMUSIC": [
    "FOXSMUSIC PROFILE",
    "FOXSMUSIC-PROFIL"
  ],
  "Вид профиля": [
    "Profile style",
    "Profilstil"
  ],
  "Классический": [
    "Classic",
    "Klassisch"
  ],
  "Неоновый": [
    "Neon",
    "Neon"
  ],
  "Стеклянный": [
    "Glass",
    "Glas"
  ],
  "Сезонный режим": [
    "Seasonal mode",
    "Saisonmodus"
  ],
  "Обычный": [
    "Normal",
    "Normal"
  ],
  "Хэллоуинский": [
    "Halloween",
    "Halloween"
  ],
  "Новогодний": [
    "Christmas",
    "Weihnachten"
  ],
  "Основной цвет": [
    "Accent color",
    "Akzentfarbe"
  ],
  "Градиент": [
    "Gradient",
    "Farbverlauf"
  ],
  "Багровый": [
    "Crimson",
    "Karmesinrot"
  ],
  "Тлеющий огонь": [
    "Ember",
    "Glut"
  ],
  "Фиолетовый": [
    "Violet",
    "Violett"
  ],
  "Океан": [
    "Ocean",
    "Ozean"
  ],
  "Монохром": [
    "Monochrome",
    "Monochrom"
  ],
  "Сбросить оформление профиля и цвет": [
    "Reset profile appearance and color",
    "Profilgestaltung und Farbe zurücksetzen"
  ],
  "Автор:": [
    "Author:",
    "Autor:"
  ],
  "Умная библиотека": [
    "Smart library",
    "Intelligente Bibliothek"
  ],
  "Найди точные дубликаты и проверь доступность оригинальных файлов.": [
    "Find exact duplicates and check whether the original files are available.",
    "Finde exakte Duplikate und prüfe, ob die Originaldateien verfügbar sind."
  ],
  "Проверить библиотеку": [
    "Check library",
    "Bibliothek prüfen"
  ],
  "Проверка записей в библиотеке. Оригинальные файлы не изменяются.": [
    "Library entries will be checked. Original files will not be changed.",
    "Bibliothekseinträge werden geprüft. Originaldateien bleiben unverändert."
  ],
  "Добавить папки-источники": [
    "Add source folders",
    "Quellordner hinzufügen"
  ],
  "Найти дубликаты во всех источниках": [
    "Find duplicates in all sources",
    "Duplikate in allen Quellen finden"
  ],
  "Проверяются все зарегистрированные папки-источники, включая вложенные папки. После подтверждения лишние точные копии перемещаются в системную корзину; один оригинал каждой группы остаётся.": [
    "All registered source folders, including subfolders, are checked. After confirmation, extra exact copies are moved to the system recycle bin; one original from each group is kept.",
    "Alle registrierten Quellordner einschließlich Unterordner werden geprüft. Nach der Bestätigung werden zusätzliche identische Kopien in den Papierkorb verschoben; eine Originaldatei pro Gruppe bleibt erhalten."
  ],
  "Резервная копия": [
    "Backup",
    "Sicherung"
  ],
  "Сохрани плейлисты, настройки, метаданные и ссылки на оригинальные файлы.": [
    "Save playlists, settings, metadata and links to the original files.",
    "Sichere Wiedergabelisten, Einstellungen, Metadaten und Verknüpfungen zu den Originaldateien."
  ],
  "Создать копию": [
    "Create backup",
    "Sicherung erstellen"
  ],
  "Восстановить": [
    "Restore",
    "Wiederherstellen"
  ],
  "Оригинальные аудиофайлы в копию не включаются; сохраняются пути к ним.": [
    "Original audio files are not included; their file paths are saved.",
    "Originale Audiodateien werden nicht gesichert; ihre Dateipfade werden gespeichert."
  ],
  "Обновления FoxsMusic": [
    "FoxsMusic updates",
    "FoxsMusic-Updates"
  ],
  "Проверяй новые версии из GitHub Releases.": [
    "Check for new versions in GitHub Releases.",
    "Suche nach neuen Versionen in GitHub Releases."
  ],
  "Проверить обновления": [
    "Check for updates",
    "Nach Updates suchen"
  ],
  "Скачать": [
    "Download",
    "Herunterladen"
  ],
  "Перезапустить": [
    "Restart",
    "Neu starten"
  ],
  "Автообновление заработает после публикации релизов в настроенном GitHub-репозитории.": [
    "Automatic updates will work after releases are published in the configured GitHub repository.",
    "Automatische Updates funktionieren, sobald Releases im konfigurierten GitHub-Repository veröffentlicht werden."
  ],
  "Очистить импортированные треки": [
    "Clear imported tracks",
    "Importierte Titel entfernen"
  ],
  "Уберёт треки из FoxsMusic, но оставит оригинальные файлы на компьютере.": [
    "This removes tracks from FoxsMusic but keeps the original files on your computer.",
    "Dadurch werden Titel aus FoxsMusic entfernt, die Originaldateien auf deinem Computer bleiben erhalten."
  ],
  "Очистить": [
    "Clear",
    "Leeren"
  ],
  "БИБЛИОТЕКА": [
    "LIBRARY",
    "BIBLIOTHEK"
  ],
  "Моя музыка": [
    "My music",
    "Meine Musik"
  ],
  "Избранное": [
    "Favorites",
    "Favoriten"
  ],
  "Плейлисты": [
    "Playlists",
    "Wiedergabelisten"
  ],
  "История": [
    "History",
    "Verlauf"
  ],
  "Добавить музыку": [
    "Add music",
    "Musik hinzufügen"
  ],
  "Импортировать папку": [
    "Import folder",
    "Ordner importieren"
  ],
  "ИСТОЧНИК БИБЛИОТЕКИ": [
    "LIBRARY SOURCE",
    "BIBLIOTHEKSQUELLE"
  ],
  "ТВОИ ПЛЕЙЛИСТЫ": [
    "YOUR PLAYLISTS",
    "DEINE WIEDERGABELISTEN"
  ],
  "Библиотека хранится на устройстве": [
    "Library is stored on this device",
    "Bibliothek wird auf diesem Gerät gespeichert"
  ],
  "ТВОЯ МУЗЫКА. ТВОИ ПРАВИЛА.": [
    "YOUR MUSIC. YOUR RULES.",
    "DEINE MUSIK. DEINE REGELN."
  ],
  "Тёмный звук для твоего мира.": [
    "Dark sound for your world.",
    "Dunkler Sound für deine Welt."
  ],
  "Недавно добавленные": [
    "Recently added",
    "Kürzlich hinzugefügt"
  ],
  "Твоя коллекция. Твой ритм.": [
    "Your collection. Your rhythm.",
    "Deine Sammlung. Dein Rhythmus."
  ],
  "Ни одного лишнего звука.": [
    "Nothing but sound.",
    "Kein überflüssiger Klang."
  ],
  "Загрузить музыку": [
    "Upload music",
    "Musik laden"
  ],
  "Треки библиотеки": [
    "Library tracks",
    "Bibliothekstitel"
  ],
  "Музыка, которая хранится у тебя": [
    "Music stored on your device",
    "Musik auf deinem Gerät"
  ],
  "НАЗВАНИЕ": [
    "TITLE",
    "TITEL"
  ],
  "ДОБАВЛЕН": [
    "ADDED",
    "HINZUGEFÜGT"
  ],
  "Твоя музыка начинается здесь": [
    "Your music starts here",
    "Deine Musik beginnt hier"
  ],
  "Добавь MP3, WAV, FLAC, OGG или другой аудиофайл.": [
    "Add an MP3, WAV, FLAC, OGG or another audio file.",
    "Füge eine MP3-, WAV-, FLAC-, OGG- oder andere Audiodatei hinzu."
  ],
  "Треки останутся в библиотеке на этом устройстве.": [
    "Tracks will stay in the library on this device.",
    "Die Titel bleiben in der Bibliothek auf diesem Gerät."
  ],
  "Выбрать аудиофайлы": [
    "Choose audio files",
    "Audiodateien auswählen"
  ],
  "или перетащи файлы в окно": [
    "or drag files into the window",
    "oder ziehe Dateien in das Fenster"
  ],
  "Текущий плейлист": [
    "Current playlist",
    "Aktuelle Wiedergabeliste"
  ],
  "Здесь появятся треки": [
    "Tracks will appear here",
    "Hier erscheinen Titel"
  ],
  "из твоей библиотеки": [
    "from your library",
    "aus deiner Bibliothek"
  ],
  "ЛОКАЛЬНАЯ БИБЛИОТЕКА": [
    "LOCAL LIBRARY",
    "LOKALE BIBLIOTHEK"
  ],
  "Обложка": [
    "Cover art",
    "Coverbild"
  ],
  "Звуковая студия": [
    "Sound studio",
    "Soundstudio"
  ],
  "Настрой звучание под своё настроение. Эффекты применяются сразу.": [
    "Tune the sound to your mood. Effects apply instantly.",
    "Passe den Klang an deine Stimmung an. Effekte werden sofort angewendet."
  ],
  "ГОТОВ К ЗВУКУ": [
    "READY FOR AUDIO",
    "BEREIT FÜR AUDIO"
  ],
  "Скорость воспроизведения": [
    "Playback speed",
    "Wiedergabegeschwindigkeit"
  ],
  "0.5× медленнее": [
    "0.5× slower",
    "0,5× langsamer"
  ],
  "1.5× быстрее": [
    "1.5× faster",
    "1,5× schneller"
  ],
  "Усиление звука": [
    "Output gain",
    "Ausgangsverstärkung"
  ],
  "Басы": [
    "Bass",
    "Bass"
  ],
  "Средние частоты": [
    "Midrange",
    "Mitten"
  ],
  "Высокие частоты": [
    "Treble",
    "Höhen"
  ],
  "Плавный переход между треками": [
    "Crossfade between tracks",
    "Überblendung zwischen Titeln"
  ],
  "Выкл.": [
    "Off",
    "Aus"
  ],
  "Выравнивание громкости": [
    "Volume normalization",
    "Lautstärkeausgleich"
  ],
  "Мягко компенсирует слишком тихие и громкие участки.": [
    "Gently balances sections that are too quiet or too loud.",
    "Gleicht zu leise und zu laute Abschnitte sanft aus."
  ],
  "Сохранить свой пресет": [
    "Save custom preset",
    "Eigenes Preset speichern"
  ],
  "Сбросить настройки": [
    "Reset settings",
    "Einstellungen zurücksetzen"
  ],
  "Выбери трек и погружайся в звук": [
    "Choose a track and dive into sound",
    "Wähle einen Titel und tauche in den Klang ein"
  ],
  "ГОТОВ К ВОСПРОИЗВЕДЕНИЮ": [
    "READY TO PLAY",
    "BEREIT ZUM ABSPIELEN"
  ],
  "Выбери трек, чтобы начать": [
    "Choose a track to get started",
    "Wähle einen Titel, um zu beginnen"
  ],
  "Звук ВКЛ": [
    "SOUND ON",
    "TON AN"
  ],
  "В выбранной папке пока нет музыки": [
    "There is no music in the selected folder yet",
    "Im ausgewählten Ordner befinden sich noch keine Musikdateien"
  ],
  "Добавь аудиофайлы в выбранную папку или выбери другой музыкальный каталог.": [
    "Add audio files to the selected folder or choose another music folder.",
    "Füge Audiodateien zum ausgewählten Ordner hinzu oder wähle einen anderen Musikordner."
  ],
  "В этом разделе пока нет подходящих треков.": [
    "There are no matching tracks in this section yet.",
    "In diesem Bereich gibt es noch keine passenden Titel."
  ],
  "Смени поиск или добавь музыку в избранное / плейлист.": [
    "Change the search or add music to favorites / a playlist.",
    "Ändere die Suche oder füge Musik zu Favoriten / einer Wiedergabeliste hinzu."
  ],
  "Выбрать другую папку": [
    "Choose another folder",
    "Anderen Ordner auswählen"
  ],
  "Убрать из очереди": [
    "Remove from queue",
    "Aus Warteschlange entfernen"
  ],
  "Неизвестный исполнитель": [
    "Unknown artist",
    "Unbekannter Interpret"
  ],
  "Локальная библиотека": [
    "Local library",
    "Lokale Bibliothek"
  ],
  "Воспроизвести": [
    "Play",
    "Abspielen"
  ],
  "Добавить в очередь": [
    "Add to queue",
    "Zur Warteschlange hinzufügen"
  ],
  "Редактировать сведения": [
    "Edit details",
    "Details bearbeiten"
  ],
  "Изменить обложку": [
    "Change cover",
    "Cover ändern"
  ],
  "Удалить из библиотеки": [
    "Remove from library",
    "Aus Bibliothek entfernen"
  ],
  "Закрыть": [
    "Close",
    "Schließen"
  ],
  "Отмена": [
    "Cancel",
    "Abbrechen"
  ],
  "Удалить": [
    "Delete",
    "Löschen"
  ],
  "Сохранить": [
    "Save",
    "Speichern"
  ],
  "Сохранить сведения": [
    "Save details",
    "Details speichern"
  ],
  "Название": [
    "Title",
    "Titel"
  ],
  "Исполнитель": [
    "Artist",
    "Interpret"
  ],
  "Альбом": [
    "Album",
    "Album"
  ],
  "Жанр": [
    "Genre",
    "Genre"
  ],
  "Год": [
    "Year",
    "Jahr"
  ],
  "Очистить поиск": [
    "Clear search",
    "Suche löschen"
  ],
  "Случайный трек": [
    "Shuffle a track",
    "Zufälligen Titel wählen"
  ],
  "Перемешать": [
    "Shuffle",
    "Zufällige Wiedergabe"
  ],
  "Очистить очередь": [
    "Clear queue",
    "Warteschlange leeren"
  ],
  "Показать текущий плейлист": [
    "Show current playlist",
    "Aktuelle Wiedergabeliste anzeigen"
  ],
  "Изменить сортировку": [
    "Change sorting",
    "Sortierung ändern"
  ],
  "Предыдущий трек": [
    "Previous track",
    "Vorheriger Titel"
  ],
  "Следующий трек": [
    "Next track",
    "Nächster Titel"
  ],
  "Изменить обложку текущего трека": [
    "Change current track cover",
    "Cover des aktuellen Titels ändern"
  ],
  "SOUND ON": [
    "SOUND ON",
    "TON AN"
  ],
  "Удалить пресет?": [
    "Delete preset?",
    "Preset löschen?"
  ],
  "Пресет «": [
    "Preset “",
    "Preset „"
  ],
  "» будет удалён. Это действие нельзя отменить.": [
    "” will be deleted. This action cannot be undone.",
    "“ wird gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden."
  ],
  "Применить пресет «": [
    "Apply preset “",
    "Preset „ anwenden: „"
  ],
  "» применён": [
    "” applied",
    "“ angewendet"
  ],
  "» сохранён": [
    "” saved",
    "“ gespeichert"
  ],
  "» удалён": [
    "” deleted",
    "“ gelöscht"
  ],
  "Сохранить пресет эквалайзера": [
    "Save equalizer preset",
    "Equalizer-Preset speichern"
  ],
  "Сохраняются басы, средние частоты, высокие частоты и усиление звука.": [
    "Bass, midrange, treble and output gain will be saved.",
    "Bass, Mitten, Höhen und Ausgangsverstärkung werden gespeichert."
  ],
  "Название пресета": [
    "Preset name",
    "Presetname"
  ],
  "Например, My Bass": [
    "For example, My Bass",
    "Zum Beispiel My Bass"
  ],
  "Введи название пресета.": [
    "Enter a preset name.",
    "Gib einen Presetnamen ein."
  ],
  "Неизвестная ошибка": [
    "Unknown error",
    "Unbekannter Fehler"
  ],
  "Сначала добавь музыку в библиотеку.": [
    "Add music to your library first.",
    "Füge zuerst Musik zu deiner Bibliothek hinzu."
  ],
  "Нажми Play ещё раз, чтобы разрешить воспроизведение.": [
    "Press Play again to allow playback.",
    "Drücke erneut auf Wiedergabe, um die Wiedergabe zu erlauben."
  ],
  "Не удалось воспроизвести этот файл. Попробуй MP3, WAV или другой аудиофайл.": [
    "Could not play this file. Try an MP3, WAV or another audio file.",
    "Diese Datei konnte nicht abgespielt werden. Versuche es mit MP3, WAV oder einem anderen Audioformat."
  ],
  "Не удалось запустить воспроизведение. Проверь аудиофайл и попробуй ещё раз.": [
    "Playback could not be started. Check the audio file and try again.",
    "Die Wiedergabe konnte nicht gestartet werden. Prüfe die Audiodatei und versuche es erneut."
  ],
  "Добавь музыку, чтобы начать воспроизведение.": [
    "Add music to start playback.",
    "Füge Musik hinzu, um die Wiedergabe zu starten."
  ],
  "Трек добавлен в очередь": [
    "Track added to queue",
    "Titel zur Warteschlange hinzugefügt"
  ],
  "Очередь очищена. Текущий трек продолжает играть.": [
    "Queue cleared. The current track keeps playing.",
    "Warteschlange geleert. Der aktuelle Titel wird weiter abgespielt."
  ],
  "Сначала выбери трек.": [
    "Choose a track first.",
    "Wähle zuerst einen Titel."
  ],
  "Сначала выбери трек, чтобы сменить обложку.": [
    "Choose a track before changing its cover.",
    "Wähle zuerst einen Titel, um das Cover zu ändern."
  ],
  "Панель плейлиста скрыта": [
    "Playlist panel hidden",
    "Playlistleiste ausgeblendet"
  ],
  "Панель плейлиста включена": [
    "Playlist panel shown",
    "Playlistleiste eingeblendet"
  ],
  "Загрузка обновления началась.": [
    "Update download started.",
    "Der Update-Download wurde gestartet."
  ],
  "Выравнивание громкости включено": [
    "Volume normalization enabled",
    "Lautstärkeausgleich aktiviert"
  ],
  "Выравнивание громкости выключено": [
    "Volume normalization disabled",
    "Lautstärkeausgleich deaktiviert"
  ],
  "Настройки звука сброшены": [
    "Audio settings reset",
    "Audioeinstellungen zurückgesetzt"
  ],
  "Полноэкранный режим недоступен в этом окне.": [
    "Fullscreen mode is not available in this window.",
    "Der Vollbildmodus ist in diesem Fenster nicht verfügbar."
  ],
  "Звуковые эффекты недоступны в этом окружении.": [
    "Audio effects are not available in this environment.",
    "Audioeffekte sind in dieser Umgebung nicht verfügbar."
  ],
  "Не удалось включить аудиоэффекты. Попробуй перезапустить трек.": [
    "Could not enable audio effects. Try restarting the track.",
    "Audioeffekte konnten nicht aktiviert werden. Starte den Titel erneut."
  ],
  "Аудиофайл не удалось подготовить к плавному переходу.": [
    "The audio file could not be prepared for crossfade.",
    "Die Audiodatei konnte nicht für die Überblendung vorbereitet werden."
  ],
  "Истекло время ожидания аудиофайла.": [
    "Timed out while waiting for the audio file.",
    "Zeitüberschreitung beim Warten auf die Audiodatei."
  ],
  "Не удалось подготовить переход.": [
    "Could not prepare the crossfade.",
    "Die Überblendung konnte nicht vorbereitet werden."
  ],
  "Не удалось открыть выбор аудиофайлов.": [
    "Could not open the audio file picker.",
    "Der Audiodateiauswahldialog konnte nicht geöffnet werden."
  ],
  "Не нашёл аудиофайлы. Попробуй MP3, WAV, FLAC или OGG.": [
    "No audio files found. Try MP3, WAV, FLAC or OGG.",
    "Keine Audiodateien gefunden. Versuche MP3, WAV, FLAC oder OGG."
  ],
  "Импорт уже выполняется — подожди окончания.": [
    "An import is already running — wait for it to finish.",
    "Ein Import läuft bereits — warte, bis er abgeschlossen ist."
  ],
  "Не удалось очистить библиотеку": [
    "Could not clear the library",
    "Die Bibliothek konnte nicht geleert werden"
  ],
  "Удаление дубликатов отменено": [
    "Duplicate removal canceled",
    "Das Entfernen von Duplikaten wurde abgebrochen"
  ],
  "Не удалось очистить библиотеку. Попробуй ещё раз.": [
    "Could not clear the library. Try again.",
    "Die Bibliothek konnte nicht geleert werden. Versuche es erneut."
  ],
  "Не удалось сохранить библиотеку": [
    "Could not save the library",
    "Die Bibliothek konnte nicht gespeichert werden"
  ],
  "Не удалось сохранить трек в браузере. Проверь свободное место.": [
    "Could not save the track in the browser. Check available storage.",
    "Der Titel konnte nicht im Browser gespeichert werden. Prüfe den verfügbaren Speicherplatz."
  ],
  "Локальное сохранение недоступно": [
    "Local storage is unavailable",
    "Lokale Speicherung ist nicht verfügbar"
  ],
  "Не удалось сохранить сведения о треке.": [
    "Could not save track details.",
    "Titeldetails konnten nicht gespeichert werden."
  ],
  "Название трека не может быть пустым.": [
    "Track title cannot be empty.",
    "Der Titel darf nicht leer sein."
  ],
  "Сведения о треке сохранены в FoxsMusic": [
    "Track details saved in FoxsMusic",
    "Titeldetails in FoxsMusic gespeichert"
  ],
  "Обложка обновлена": [
    "Cover updated",
    "Cover aktualisiert"
  ],
  "Выбери изображение для обложки.": [
    "Choose an image for the cover.",
    "Wähle ein Bild für das Cover aus."
  ],
  "Недавно воспроизведённые треки.": [
    "Recently played tracks.",
    "Zuletzt abgespielte Titel."
  ],
  "Недавно прослушано": [
    "Recently played",
    "Zuletzt abgespielt"
  ],
  "Последние 100 треков": [
    "Your last 100 tracks",
    "Deine letzten 100 Titel"
  ],
  "Временная библиотека — сохранение с ошибкой": [
    "Temporary library — save error",
    "Temporäre Bibliothek — Speicherfehler"
  ],
  "Папка исключена из проверки дубликатов.": [
    "Folder excluded from duplicate checks.",
    "Ordner von der Duplikatprüfung ausgeschlossen."
  ],
  "Сначала добавь хотя бы одну папку-источник.": [
    "Add at least one source folder first.",
    "Füge zuerst mindestens einen Quellordner hinzu."
  ],
  "Этот механизм недоступен в текущей сборке. Пересобери проект из обновлённого архива.": [
    "This feature is unavailable in this build. Rebuild the project from the updated archive.",
    "Diese Funktion ist in diesem Build nicht verfügbar. Erstelle den Build erneut aus dem aktualisierten Archiv."
  ],
  "Сканирую…": [
    "Scanning…",
    "Wird gescannt…"
  ],
  "Не удалось проверить папки-источники.": [
    "Could not check source folders.",
    "Quellordner konnten nicht geprüft werden."
  ],
  "Точных дубликатов аудиофайлов в папках-источниках не найдено.": [
    "No exact audio file duplicates were found in the source folders.",
    "In den Quellordnern wurden keine identischen Audiodateien gefunden."
  ],
  "Сканирование достигло лимита 10 000 аудиофайлов. Для полного результата проверь меньшие папки отдельно.": [
    "The scan reached the 10,000-audio-file limit. Check smaller folders separately for a complete result.",
    "Der Scan hat das Limit von 10.000 Audiodateien erreicht. Prüfe kleinere Ordner separat, um ein vollständiges Ergebnis zu erhalten."
  ],
  "Недоступные папки-источники (пропущены):": [
    "Unavailable source folders (skipped):",
    "Nicht verfügbare Quellordner (übersprungen):"
  ],
  "Дубликаты в папках-источниках": [
    "Duplicates in source folders",
    "Duplikate in Quellordnern"
  ],
  "Переместить дубликаты в корзину": [
    "Move duplicates to trash",
    "Duplikate in den Papierkorb verschieben"
  ],
  "Переместить дубликаты в корзину?": [
    "Move duplicates to the recycle bin?",
    "Duplikate in den Papierkorb verschieben?"
  ],
  "После подтверждения лишние побайтно одинаковые файлы из всех источников будут перемещены в системную корзину. В каждой группе останется один экземпляр. Файлы не удаляются безвозвратно.": [
    "After confirmation, extra byte-identical files from all sources will be moved to the system recycle bin. One copy in each group will remain. Files are not permanently deleted.",
    "Nach der Bestätigung werden zusätzliche byte-identische Dateien aus allen Quellen in den Papierkorb verschoben. Eine Kopie pro Gruppe bleibt erhalten. Die Dateien werden nicht endgültig gelöscht."
  ],
  "Файлы можно восстановить из системной корзины.": [
    "Files can be restored from the system recycle bin.",
    "Dateien können aus dem Papierkorb wiederhergestellt werden."
  ],
  "Создаю…": [
    "Creating…",
    "Wird erstellt…"
  ],
  "Резервная копия сохранена. Оригинальные аудиофайлы остались в своих папках.": [
    "Backup saved. Original audio files remain in their folders.",
    "Sicherung gespeichert. Die Originalaudiodateien bleiben in ihren Ordnern."
  ],
  "Не удалось создать резервную копию.": [
    "Could not create the backup.",
    "Die Sicherung konnte nicht erstellt werden."
  ],
  "Файл не является резервной копией FoxsMusic v1.": [
    "This file is not a FoxsMusic v1 backup.",
    "Diese Datei ist keine FoxsMusic-Sicherung Version 1."
  ],
  "Восстанавливаю…": [
    "Restoring…",
    "Wird wiederhergestellt…"
  ],
  "Восстановленный плейлист": [
    "Restored playlist",
    "Wiederhergestellte Wiedergabeliste"
  ],
  "Установлена последняя доступная версия.": [
    "You have the latest available version.",
    "Die neueste verfügbare Version ist installiert."
  ],
  "неизвестная ошибка": [
    "unknown error",
    "unbekannter Fehler"
  ],
  "Проверяю…": [
    "Checking…",
    "Wird geprüft…"
  ],
  "Не удалось проверить обновления.": [
    "Could not check for updates.",
    "Updates konnten nicht gesucht werden."
  ],
  "Доступна версия ": [
    "Version available: ",
    "Version verfügbar: "
  ],
  "Загрузка обновления: ": [
    "Downloading update: ",
    "Update wird heruntergeladen: "
  ],
  " готова к установке.": [
    " is ready to install.",
    " ist zur Installation bereit."
  ],
  "Ошибка обновления: ": [
    "Update error: ",
    "Updatefehler: "
  ],
  "Восстановлено записей: ": [
    "Restored entries: ",
    "Wiederhergestellte Einträge: "
  ],
  "Плейлистов ещё нет. Создай первый — и добавь сюда трек.": [
    "There are no playlists yet. Create your first one and add this track.",
    "Es gibt noch keine Wiedergabelisten. Erstelle deine erste und füge diesen Titel hinzu."
  ],
  "Добавлено": [
    "Added",
    "Hinzugefügt"
  ],
  "Добавить +": [
    "Add +",
    "Hinzufügen +"
  ],
  "Добавить в плейлист": [
    "Add to playlist",
    "Zur Wiedergabeliste hinzufügen"
  ],
  "Выбери подборку для «": [
    "Choose a playlist for “",
    "Wähle eine Wiedergabeliste für „"
  ],
  "».": [
    "”.",
    "“."
  ],
  "Новый плейлист": [
    "New playlist",
    "Neue Wiedergabeliste"
  ],
  "Дай подборке имя, которое подходит твоему настроению.": [
    "Give this playlist a name that matches your mood.",
    "Gib dieser Wiedergabeliste einen Namen, der zu deiner Stimmung passt."
  ],
  "Например, Midnight Drive": [
    "For example, Midnight Drive",
    "Zum Beispiel Midnight Drive"
  ],
  "Создать плейлист": [
    "Create playlist",
    "Wiedergabeliste erstellen"
  ],
  "Введи название плейлиста.": [
    "Enter a playlist name.",
    "Gib einen Namen für die Wiedergabeliste ein."
  ],
  "Плейлист с таким названием уже существует.": [
    "A playlist with this name already exists.",
    "Eine Wiedergabeliste mit diesem Namen existiert bereits."
  ],
  "Создан плейлист «": [
    "Playlist created: “",
    "Wiedergabeliste erstellt: „"
  ],
  "Удалить трек?": [
    "Delete track?",
    "Titel löschen?"
  ],
  "» будет удалён из локальной библиотеки приложения. Исходный файл на компьютере не удаляется.": [
    "” will be removed from the app library. The original file on your computer will not be deleted.",
    "“ wird aus der App-Bibliothek entfernt. Die Originaldatei auf deinem Computer bleibt erhalten."
  ],
  "Удалить трек": [
    "Delete track",
    "Titel löschen"
  ],
  "Сведения о треке": [
    "Track details",
    "Titeldetails"
  ],
  "Изменения сохраняются в FoxsMusic. Оригинальный аудиофайл и его теги на диске не изменяются.": [
    "Changes are saved in FoxsMusic. The original audio file and its on-disk tags are not changed.",
    "Änderungen werden in FoxsMusic gespeichert. Die Originalaudiodatei und ihre Tags auf dem Datenträger bleiben unverändert."
  ],
  "Название трека": [
    "Track title",
    "Titelname"
  ],
  "Настрой стиль, сезонный режим, основной цвет и градиент.": [
    "Customize the style, seasonal mode, accent color and gradient.",
    "Passe Stil, Saisonmodus, Akzentfarbe und Farbverlauf an."
  ],
  "Оформление профиля и цвет сброшены.": [
    "Profile appearance and color have been reset.",
    "Profilgestaltung und Farbe wurden zurückgesetzt."
  ],
  "Визуальные эффекты включены": [
    "Visual effects enabled",
    "Visuelle Effekte aktiviert"
  ],
  "Визуальные эффекты выключены": [
    "Visual effects disabled",
    "Visuelle Effekte deaktiviert"
  ],
  "0 треков": [
    "0 tracks",
    "0 Titel"
  ],
  "3 с": [
    "3 s",
    "3 Sek."
  ],
  "4 с": [
    "4 s",
    "4 Sek."
  ],
  "8 с": [
    "8 s",
    "8 Sek."
  ],
  "FoxsMusic — главная": [
    "FoxsMusic — Home",
    "FoxsMusic — Startseite"
  ],
  "Логотип DP — Desktop Player": [
    "DP logo — Desktop Player",
    "DP-Logo — Desktop Player"
  ],
  "Поиск музыки": [
    "Search music",
    "Musik suchen"
  ],
  "Поиск музыки, исполнителя...": [
    "Search music, artist...",
    "Musik, Interpret suchen..."
  ],
  "Сейчас играет": [
    "Now playing",
    "Läuft gerade"
  ],
  "Открыть экран Сейчас играет": [
    "Open the Now Playing screen",
    "Ansicht „Läuft gerade“ öffnen"
  ],
  "Полноэкранный режим": [
    "Fullscreen mode",
    "Vollbildmodus"
  ],
  "Подсказка": [
    "Help",
    "Hilfe"
  ],
  "Закрыть настройки": [
    "Close settings",
    "Einstellungen schließen"
  ],
  "Включить или выключить визуальные эффекты": [
    "Toggle visual effects",
    "Visuelle Effekte ein- oder ausschalten"
  ],
  "Разделы": [
    "Sections",
    "Bereiche"
  ],
  "Показать всю библиотеку": [
    "Show the full library",
    "Gesamte Bibliothek anzeigen"
  ],
  "Мои плейлисты": [
    "My playlists",
    "Meine Playlists"
  ],
  "Красно-чёрный логотип лиса FoxsMusic": [
    "Red-and-black FoxsMusic fox logo",
    "Rot-schwarzes FoxsMusic-Fuchslogo"
  ],
  "Открыть настройки звука": [
    "Open audio settings",
    "Audioeinstellungen öffnen"
  ],
  "Открыть звуковую студию": [
    "Open Sound Studio",
    "Soundstudio öffnen"
  ],
  "Закрыть звуковую студию": [
    "Close Sound Studio",
    "Soundstudio schließen"
  ],
  "Предустановки эквалайзера": [
    "Equalizer presets",
    "Equalizer-Voreinstellungen"
  ],
  "Уровень басов": [
    "Bass level",
    "Basspegel"
  ],
  "Уровень средних частот": [
    "Midrange level",
    "Mittenpegel"
  ],
  "Уровень высоких частот": [
    "Treble level",
    "Höhenpegel"
  ],
  "Длительность плавного перехода": [
    "Crossfade duration",
    "Überblenddauer"
  ],
  "В избранное": [
    "Add to favorites",
    "Zu Favoriten hinzufügen"
  ],
  "Перемешивание": [
    "Shuffle",
    "Zufallswiedergabe"
  ],
  "Повтор выключен": [
    "Repeat off",
    "Wiederholung aus"
  ],
  "Повтор": [
    "Repeat",
    "Wiederholen"
  ],
  "Позиция воспроизведения": [
    "Playback position",
    "Wiedergabeposition"
  ],
  "Без звука": [
    "Mute",
    "Stumm"
  ],
  "Громкость": [
    "Volume",
    "Lautstärke"
  ],
  "Настройки эффектов": [
    "Effect settings",
    "Effekteinstellungen"
  ],
  "Закрыть полноэкранный режим": [
    "Exit fullscreen",
    "Vollbildmodus beenden"
  ],
  "Обложка альбома": [
    "Album artwork",
    "Albumcover"
  ],
  "Удалить все треки из библиотеки?": [
    "Remove all tracks from the library?",
    "Alle Titel aus der Bibliothek entfernen?"
  ],
  "Из FoxsMusic будут удалены записи всех {count} треков. Оригинальные аудиофайлы на компьютере останутся нетронутыми. Продолжить?": [
    "All {count} track entries will be removed from FoxsMusic. The original audio files on your computer will remain untouched. Continue?",
    "Alle {count} Titeleinträge werden aus FoxsMusic entfernt. Die Originalaudiodateien auf deinem Computer bleiben unverändert. Fortfahren?"
  ],
  "Удалить все треки": [
    "Remove all tracks",
    "Alle Titel entfernen"
  ],
  "Импортированные треки удалены. Оригинальные файлы сохранены.": [
    "Imported tracks removed. Original files were kept.",
    "Importierte Titel entfernt. Originaldateien bleiben erhalten."
  ],
  "Библиотека уже пуста.": [
    "The library is already empty.",
    "Die Bibliothek ist bereits leer."
  ],
  "Папки-источники не добавлены. Выбери папки для проверки файловых дубликатов.": [
    "No source folders have been added. Choose folders to check for duplicate files.",
    "Es wurden keine Quellordner hinzugefügt. Wähle Ordner aus, um Dateiduplikate zu prüfen."
  ],
  "Текущий источник отображается в библиотеке": [
    "Currently displayed library source",
    "Aktuell angezeigte Bibliotheksquelle"
  ],
  "Убрать папку из проверки": [
    "Remove folder from scan",
    "Ordner aus der Prüfung entfernen"
  ],
  "Добавлено папок-источников: {count}.": [
    "Source folders added: {count}.",
    "Hinzugefügte Quellordner: {count}."
  ],
  "Проверка библиотеки": [
    "Library audit",
    "Bibliotheksprüfung"
  ],
  "Проверено записей: {total}. Оригиналы недоступны: {missing}. Групп точных дубликатов: {groups}. Лишних записей: {extras}.": [
    "Entries checked: {total}. Originals unavailable: {missing}. Exact duplicate groups: {groups}. Extra entries: {extras}.",
    "Geprüfte Einträge: {total}. Originale nicht verfügbar: {missing}. Gruppen exakter Duplikate: {groups}. Zusätzliche Einträge: {extras}."
  ],
  "Оригинальные файлы не найдены": [
    "Original files not found",
    "Originaldateien nicht gefunden"
  ],
  "Точные дубликаты": [
    "Exact duplicates",
    "Exakte Duplikate"
  ],
  "Недоступные оригиналы не найдены.": [
    "No unavailable original files were found.",
    "Keine fehlenden Originaldateien gefunden."
  ],
  "Точных дубликатов не найдено.": [
    "No exact duplicates were found.",
    "Keine exakten Duplikate gefunden."
  ],
  "Удалить лишние записи": [
    "Remove extra entries",
    "Zusätzliche Einträge entfernen"
  ],
  "Удалить дублирующие записи?": [
    "Remove duplicate entries?",
    "Doppelte Einträge entfernen?"
  ],
  "Будут удалены только повторные записи в библиотеке FoxsMusic. Оригинальные музыкальные файлы на диске останутся нетронутыми.": [
    "Only duplicate entries in the FoxsMusic library will be removed. Original music files on disk will remain untouched.",
    "Nur doppelte Einträge in der FoxsMusic-Bibliothek werden entfernt. Die Originalmusikdateien auf dem Laufwerk bleiben unverändert."
  ],
  "Дублирующие записи удалены. Оригинальные файлы сохранены.": [
    "Duplicate entries removed. Original files were kept.",
    "Doppelte Einträge entfernt. Originaldateien bleiben erhalten."
  ],
  "Не удалось проверить библиотеку. Попробуй ещё раз.": [
    "Could not audit the library. Please try again.",
    "Die Bibliothek konnte nicht geprüft werden. Bitte versuche es erneut."
  ],
  "ОРИГИНАЛ НЕ НАЙДЕН": [
    "ORIGINAL NOT FOUND",
    "ORIGINAL NICHT GEFUNDEN"
  ],
  "У записи нет доступного оригинального файла.": [
    "No original file is available for this entry.",
    "Für diesen Eintrag ist keine Originaldatei verfügbar."
  ],
  "В меню трека выбери «Найти оригинальный файл», чтобы восстановить ссылку.": [
    "Open the track menu and choose “Locate original file” to restore the link.",
    "Öffne das Titelmenü und wähle „Originaldatei suchen“, um die Verknüpfung wiederherzustellen."
  ],
  "Некоторые старые записи слишком велики для безопасной проверки содержимого; они не использовались для поиска дубликатов.": [
    "Some older entries are too large for safe content checks and were skipped during duplicate detection.",
    "Einige ältere Einträge sind für eine sichere Inhaltsprüfung zu groß und wurden bei der Duplikatsuche übersprungen."
  ],
  "Пропущено уже добавленных файлов: {count}.": [
    "Already imported files skipped: {count}.",
    "Bereits importierte Dateien übersprungen: {count}."
  ],
  "Оригинальный путь к файлу": [
    "Original file path",
    "Originaler Dateipfad"
  ],
  "Показать исходный файл в папке": [
    "Show original file in folder",
    "Originaldatei im Ordner anzeigen"
  ],
  "Найти оригинальный файл": [
    "Locate original file",
    "Originaldatei suchen"
  ],
  "У этой старой записи нет сохранённого исходного пути. Найди оригинал, чтобы использовать файл напрямую.": [
    "This older entry has no saved source path. Locate the original file to use it directly.",
    "Für diesen älteren Eintrag ist kein Quellpfad gespeichert. Suche die Originaldatei, um sie direkt zu verwenden."
  ],
  "Не удалось открыть расположение файла. Возможно, файл был перемещён или удалён.": [
    "Could not open the file location. The file may have been moved or deleted.",
    "Der Dateispeicherort konnte nicht geöffnet werden. Möglicherweise wurde die Datei verschoben oder gelöscht."
  ],
  "Оригинальный файл подключён": [
    "Original file linked",
    "Originaldatei verknüpft"
  ],
  "Папка библиотеки": [
    "Library folder",
    "Bibliotheksordner"
  ],
  "Показаны все треки библиотеки.": [
    "All library tracks are displayed.",
    "Alle Bibliothekstitel werden angezeigt."
  ],
  "Папка подключена как источник библиотеки.": [
    "Folder connected as a library source.",
    "Ordner als Bibliotheksquelle verbunden."
  ],
  "В выбранной папке аудиофайлы не найдены.": [
    "No audio files were found in the selected folder.",
    "Im ausgewählten Ordner wurden keine Audiodateien gefunden."
  ],
  "Не удалось прочитать папку-источник. Выбери папку заново.": [
    "Could not read the source folder. Select the folder again.",
    "Der Quellordner konnte nicht gelesen werden. Bitte wähle ihn erneut aus."
  ],
  "По названию": [
    "By title",
    "Nach Titel"
  ],
  "Любимые треки": [
    "Favorite tracks",
    "Lieblingstitel"
  ],
  "Твоя личная подборка": [
    "Your personal collection",
    "Deine persönliche Sammlung"
  ],
  "Треки плейлиста": [
    "Playlist tracks",
    "Playlist-Titel"
  ],
  "Музыка в плейлистах": [
    "Music in playlists",
    "Musik in Playlists"
  ],
  "Твои подборки на этом устройстве": [
    "Your collections on this device",
    "Deine Sammlungen auf diesem Gerät"
  ],
  "Результаты": [
    "Results",
    "Ergebnisse"
  ],
  "Поиск по запросу": [
    "Search results for",
    "Suchergebnisse für"
  ],
  "Найденные треки": [
    "Matching tracks",
    "Gefundene Titel"
  ],
  "Совпадений": [
    "Matches",
    "Treffer"
  ],
  "Ничего не найдено": [
    "Nothing found",
    "Nichts gefunden"
  ],
  "Действия с треком": [
    "Track actions",
    "Titelaktionen"
  ],
  "»": [
    "”",
    "“"
  ],
  " применён": [
    " applied",
    " angewendet"
  ],
  " удалён": [
    " deleted",
    " gelöscht"
  ],
  " сохранён": [
    " saved",
    " gespeichert"
  ],
  "Доступна версия": [
    "Version available",
    "Version verfügbar"
  ],
  "Загрузка обновления:": [
    "Downloading update:",
    "Update wird heruntergeladen:"
  ],
  "готова к установке.": [
    "is ready to install.",
    "ist zur Installation bereit."
  ],
  "Ошибка обновления:": [
    "Update error:",
    "Update-Fehler:"
  ],
  "Восстановлено записей:": [
    "Entries restored:",
    "Wiederhergestellte Einträge:"
  ],
  "Не удалось восстановить копию:": [
    "Could not restore the backup:",
    "Sicherung konnte nicht wiederhergestellt werden:"
  ],
  "Файл резервной копии не удалось прочитать:": [
    "Could not read the backup file:",
    "Sicherungsdatei konnte nicht gelesen werden:"
  ],
  "Перезапусти плеер, чтобы применить все сохранённые настройки.": [
    "Restart the player to apply all restored settings.",
    "Starte den Player neu, um alle wiederhergestellten Einstellungen anzuwenden."
  ],
  "Не удалось воспроизвести этот трек.": [
    "Could not play this track.",
    "Dieser Titel konnte nicht abgespielt werden."
  ],
  "LIVE · АНАЛИЗ": [
    "LIVE · ANALYSIS",
    "LIVE · ANALYSE"
  ],
  "СЕЙЧАС ИГРАЕТ": [
    "NOW PLAYING",
    "LÄUFT GERADE"
  ],
  "ПАУЗА": [
    "PAUSED",
    "PAUSE"
  ],
  "Пауза": [
    "Pause",
    "Pause"
  ],
  "Удалить из избранного": [
    "Remove from favorites",
    "Aus Favoriten entfernen"
  ],
  "Включить звук": [
    "Unmute",
    "Ton einschalten"
  ],
  "Выключить перемешивание": [
    "Turn shuffle off",
    "Zufallswiedergabe ausschalten"
  ],
  "Включить перемешивание": [
    "Turn shuffle on",
    "Zufallswiedergabe einschalten"
  ],
  "Повтор всего плейлиста": [
    "Repeat entire playlist",
    "Ganze Playlist wiederholen"
  ],
  "Повтор одного трека": [
    "Repeat one track",
    "Einen Titel wiederholen"
  ],
  "Нажми +, чтобы создать свою подборку.": [
    "Press + to create your own playlist.",
    "Drücke +, um deine eigene Playlist zu erstellen."
  ],
  "Анимации включены": [
    "Animations enabled",
    "Animationen aktiviert"
  ],
  "Анимации выключены": [
    "Animations disabled",
    "Animationen deaktiviert"
  ],
  "FoxsMusic · Быстрые клавиши": [
    "FoxsMusic · Keyboard shortcuts",
    "FoxsMusic · Tastenkürzel"
  ],
  "Управляй музыкой с клавиатуры. На мобильных устройствах используй кнопки плеера.": [
    "Control music with your keyboard. On mobile devices, use the player buttons.",
    "Steuere die Musik mit der Tastatur. Auf Mobilgeräten kannst du die Player-Tasten verwenden."
  ],
  "Воспроизведение / пауза": [
    "Play / pause",
    "Wiedergabe / Pause"
  ],
  "Перемотка на 5 секунд": [
    "Seek by 5 seconds",
    "Um 5 Sekunden springen"
  ],
  "Громкость ±5%": [
    "Volume ±5%",
    "Lautstärke ±5 %"
  ],
  "Включить / выключить звук": [
    "Toggle sound",
    "Ton ein- oder ausschalten"
  ],
  "Следующий / предыдущий трек": [
    "Next / previous track",
    "Nächster / vorheriger Titel"
  ],
  "Перемешивание вкл. / выкл.": [
    "Toggle shuffle",
    "Zufallswiedergabe umschalten"
  ],
  "Переключить режим повтора": [
    "Cycle repeat mode",
    "Wiederholmodus wechseln"
  ],
  "Включить / выключить полный экран": [
    "Toggle fullscreen",
    "Vollbild umschalten"
  ],
  "Открыть / закрыть звуковую студию": [
    "Open / close Sound Studio",
    "Soundstudio öffnen / schließen"
  ],
  "Закрыть открытое окно или панель": [
    "Close the open dialog or panel",
    "Den geöffneten Dialog oder Bereich schließen"
  ],
  "Понятно": [
    "Got it",
    "Verstanden"
  ],
  "Все плейлисты": [
    "All playlists",
    "Alle Playlists"
  ],
  "Плейлист": [
    "Playlist",
    "Playlist"
  ],
  "Это не поддерживаемый аудиофайл": [
    "This audio file type is not supported.",
    "Dieser Audiodateityp wird nicht unterstützt."
  ],
  "Файл не найден": [
    "File not found.",
    "Datei nicht gefunden."
  ],
  "Недопустимый путь к папке музыкальной библиотеки": [
    "Invalid music library folder path.",
    "Ungültiger Pfad zum Musikbibliotheksordner."
  ],
  "Выбранный источник не является папкой": [
    "The selected source is not a folder.",
    "Die ausgewählte Quelle ist kein Ordner."
  ],
  "Некорректный список библиотеки": [
    "Invalid library file list.",
    "Ungültige Dateiliste der Bibliothek."
  ],
  "Нужно указать от одной до 100 папок-источников": [
    "Specify between one and 100 source folders.",
    "Gib zwischen einem und 100 Quellordner an."
  ],
  "Недопустимый путь к папке-источнику": [
    "Invalid source folder path.",
    "Ungültiger Pfad zum Quellordner."
  ],
  "Некорректный список папок-источников": [
    "Invalid source folder list.",
    "Ungültige Liste der Quellordner."
  ],
  "Некорректный запрос удаления дубликатов": [
    "Invalid duplicate-removal request.",
    "Ungültige Anfrage zum Entfernen von Duplikaten."
  ],
  "Ни одна папка-источник сейчас недоступна": [
    "None of the source folders is currently available.",
    "Keiner der Quellordner ist derzeit verfügbar."
  ],
  "Резервная копия слишком большая или некорректная": [
    "The backup is too large or invalid.",
    "Die Sicherung ist zu groß oder ungültig."
  ],
  "Файл резервной копии превышает 60 МБ": [
    "The backup file exceeds 60 MB.",
    "Die Sicherungsdatei ist größer als 60 MB."
  ],
  "Проверка обновлений доступна в собранном приложении.": [
    "Update checks are available in the packaged app.",
    "Die Updateprüfung ist in der installierten App verfügbar."
  ],
  "Сначала собери приложение.": [
    "Build the app first.",
    "Erstelle zuerst die App."
  ],
  "Отпусти, чтобы добавить музыку": [
    "Release to add music",
    "Loslassen, um Musik hinzuzufügen"
  ]
}).map(([source, values]) => [
    source.replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru-RU'),
    { source, en: values[0], de: values[1] }
  ]));
  // Reuse the canonical translations too, so dynamic text can be translated even when
  // it was originally rendered through a direct textContent assignment.
  for (const key of Object.keys(LANGUAGES.ru || {})) {
    const source = LANGUAGES.ru[key];
    const en = LANGUAGES.en?.[key];
    const de = LANGUAGES.de?.[key];
    if (typeof source === 'string' && /[\u0400-\u04FF]/.test(source) && typeof en === 'string' && typeof de === 'string') {
      INLINE_TRANSLATIONS.set(normalizedInlineKey(source), { source, en, de });
    }
  }
  const LOCALE_ATTRIBUTES = ['title', 'aria-label', 'placeholder', 'alt'];
  const STATIC_LOCALE_TEXT_NODES = [];
  const STATIC_LOCALE_ATTRIBUTES = [];
  const STATIC_LOCALE_TEXT_INDEX = new WeakMap();
  const STATIC_LOCALE_ATTRIBUTE_INDEX = new WeakMap();
  const INLINE_TRANSLATION_ENTRIES = [...INLINE_TRANSLATIONS.values()].sort((a, b) => b.source.length - a.source.length);
  const LOCALE_USER_CONTENT_SELECTOR = [
    'script', 'style', 'svg', 'code', 'pre', 'input', 'textarea', 'select', '[data-no-i18n]',
    '.track-row', '.queue-row', '.playlist-link', '.custom-studio-preset',
    '#nowTitle', '#nowArtist', '#nowPlayingTitle', '#nowPlayingArtist', '#viewTitle', '#viewSubtitle', '#queueContextLabel'
  ].join(',');

  function normalizedInlineKey(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru-RU');
  }
  function translationCase(match, translated) {
    const localeTag = currentLocale === 'de' ? 'de-DE' : 'en-US';
    if (/[А-ЯЁ]/.test(match) && match === match.toLocaleUpperCase('ru-RU')) return translated.toLocaleUpperCase(localeTag);
    if (/[А-ЯЁ]/.test(match[0] || '') && match[0] === match[0].toLocaleUpperCase('ru-RU')) {
      return translated ? translated[0].toLocaleUpperCase(localeTag) + translated.slice(1) : translated;
    }
    return translated;
  }
  function translateInlineText(value) {
    if (typeof value !== 'string' || currentLocale === 'ru' || !value) return value;
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    const core = value.slice(leading.length, value.length - trailing.length || undefined);
    const translated = INLINE_TRANSLATIONS.get(normalizedInlineKey(core))?.[currentLocale];
    if (!translated) return value;
    return leading + translationCase(core, translated) + trailing;
  }
  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function translateInlineSegments(value) {
    if (typeof value !== 'string' || currentLocale === 'ru' || !value) return value;
    const exact = translateInlineText(value);
    if (exact !== value) return exact;
    let output = value;
    for (const entry of INLINE_TRANSLATION_ENTRIES) {
      const translated = entry[currentLocale];
      if (!translated || entry.source.length < 3) continue;
      const pattern = new RegExp(escapeRegExp(entry.source), 'giu');
      output = output.replace(pattern, match => translationCase(match, translated));
    }
    return output;
  }
  function shouldSkipLocaleText(node) {
    return !node?.parentElement || Boolean(node.parentElement.closest(LOCALE_USER_CONTENT_SELECTOR));
  }
  function rememberLocaleTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkipLocaleText(node)) return null;
    const original = node.nodeValue || '';
    if (!/[\u0400-\u04FF]/.test(original)) return null;
    let item = STATIC_LOCALE_TEXT_INDEX.get(node);
    if (!item) {
      item = { node, original };
      STATIC_LOCALE_TEXT_INDEX.set(node, item);
      STATIC_LOCALE_TEXT_NODES.push(item);
    } else if (item.original !== original) {
      // App-generated Russian UI text may replace a previously translated node.
      item.original = original;
    }
    return item;
  }
  function shouldSkipLocaleAttribute(element, attribute) {
    if (!element || element.closest('script, style, svg, code, pre, [data-no-i18n]')) return true;
    if (attribute === 'title' && element.matches('.row-title, .queue-title')) return true;
    return false;
  }
  function rememberLocaleAttribute(element, attribute) {
    if (shouldSkipLocaleAttribute(element, attribute)) return null;
    const original = element.getAttribute(attribute);
    if (!original || !/[\u0400-\u04FF]/.test(original)) return null;
    let perElement = STATIC_LOCALE_ATTRIBUTE_INDEX.get(element);
    if (!perElement) {
      perElement = new Map();
      STATIC_LOCALE_ATTRIBUTE_INDEX.set(element, perElement);
    }
    let item = perElement.get(attribute);
    if (!item) {
      item = { element, attribute, original };
      perElement.set(attribute, item);
      STATIC_LOCALE_ATTRIBUTES.push(item);
    } else if (item.original !== original) {
      item.original = original;
    }
    return item;
  }
  function applyLocaleTextItem(item) {
    if (!item?.node?.isConnected) return;
    const value = currentLocale === 'ru' ? item.original : translateInlineSegments(item.original);
    if (item.node.nodeValue !== value) item.node.nodeValue = value;
  }
  function applyLocaleAttributeItem(item) {
    if (!item?.element?.isConnected) return;
    const value = currentLocale === 'ru' ? item.original : translateInlineSegments(item.original);
    if (item.element.getAttribute(item.attribute) !== value) item.element.setAttribute(item.attribute, value);
  }
  function captureStaticLocaleSubtree(root) {
    if (!root) return;
    const textItems = [];
    const attributeItems = [];
    if (root.nodeType === Node.TEXT_NODE) {
      const item = rememberLocaleTextNode(root);
      if (item) textItems.push(item);
    } else if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_FRAGMENT_NODE || root.nodeType === Node.DOCUMENT_NODE) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const item = rememberLocaleTextNode(node);
        if (item) textItems.push(item);
      }
      const elements = [];
      if (root.nodeType === Node.ELEMENT_NODE) elements.push(root);
      if (typeof root.querySelectorAll === 'function') elements.push(...root.querySelectorAll('*'));
      for (const element of elements) {
        for (const attribute of LOCALE_ATTRIBUTES) {
          const item = rememberLocaleAttribute(element, attribute);
          if (item) attributeItems.push(item);
        }
      }
    }
    for (const item of textItems) applyLocaleTextItem(item);
    for (const item of attributeItems) applyLocaleAttributeItem(item);
  }
  function captureStaticLocaleContent() {
    if (document.body) captureStaticLocaleSubtree(document.body);
  }
  function applyStaticLocale() {
    for (const item of STATIC_LOCALE_TEXT_NODES) applyLocaleTextItem(item);
    for (const item of STATIC_LOCALE_ATTRIBUTES) applyLocaleAttributeItem(item);
  }
  function observeDynamicLocaleContent() {
    if (!document.body || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') {
          record.addedNodes.forEach(node => captureStaticLocaleSubtree(node));
        } else if (record.type === 'characterData') {
          const item = rememberLocaleTextNode(record.target);
          if (item) applyLocaleTextItem(item);
        } else if (record.type === 'attributes' && LOCALE_ATTRIBUTES.includes(record.attributeName)) {
          const item = rememberLocaleAttribute(record.target, record.attributeName);
          if (item) applyLocaleAttributeItem(item);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: LOCALE_ATTRIBUTES });
  }
  function crossfadeSecondsLabel(value) {
    const number = Number(value);
    const formatted = currentLocale === 'de' ? String(number).replace('.', ',') : String(number);
    const unit = currentLocale === 'ru' ? 'с' : currentLocale === 'de' ? 'Sek.' : 's';
    return `${formatted} ${unit}`;
  }
  captureStaticLocaleContent();
  observeDynamicLocaleContent();
  function translateArtist(artist) {
    if (artist === 'Локальная библиотека') return tr('localLibrary');
    if (artist === 'Неизвестный исполнитель') return tr('unknownArtist');
    return artist;
  }
  function localizedPlaylistName(name) {
    const defaults = { 'Моя музыка': 'myMusic', 'Избранное': 'favorites', 'Все плейлисты': 'playlists', 'Плейлист': 'playlists', 'Для игр': null, 'Атмосфера': null, 'Dark Fox': null };
    if (defaults[name]) return tr(defaults[name]);
    if (currentLocale !== 'ru') {
      if (name === 'Для игр') return currentLocale === 'en' ? 'For gaming' : 'Für Spiele';
      if (name === 'Атмосфера') return currentLocale === 'en' ? 'Atmosphere' : 'Atmosphäre';
    }
    return name;
  }
  function wordTracks(count) {
    if (currentLocale === 'en') return `${count} ${count === 1 ? 'track' : 'tracks'}`;
    if (currentLocale === 'de') return `${count} ${tr('trackSuffixMany')}`;
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return `${count} треков`;
    if (n1 > 1 && n1 < 5) return `${count} трека`;
    if (n1 === 1) return `${count} трек`;
    return `${count} треков`;
  }
  function setText(selector, value) { const element = $(selector); if (element) element.textContent = value; }
  function applyLocale(locale = currentLocale) {
    currentLocale = ['ru', 'en', 'de'].includes(locale) ? locale : 'ru';
    captureStaticLocaleContent();
    applyStaticLocale();
    document.documentElement.lang = currentLocale;
    document.body.dataset.dropHint = translateInlineText('Отпусти, чтобы добавить музыку');
    const settingsSelect = $('#languageSelect'); if (settingsSelect && settingsSelect.value !== currentLocale) settingsSelect.value = currentLocale;
    setText('.sidebar-label', tr('library'));
    setText('.nav-item[data-view="all"] span:nth-child(2)', tr('myMusic'));
    setText('.nav-item[data-view="favorites"] span:nth-child(2)', tr('favorites'));
    setText('.nav-item[data-view="playlists"] span:nth-child(2)', tr('playlists'));
    setText('.nav-item[data-view="history"] span:nth-child(2)', currentLocale === 'en' ? 'History' : currentLocale === 'de' ? 'Verlauf' : 'История');
    setText('#addMusicBtn span:last-child', tr('addMusic'));
    setText('#importFolderText', tr('importFolder'));
    setText('.sidebar-section-heading > span', tr('yourPlaylists'));
    setText('#storageText', tr('storage'));
    setText('#clearImportedTracksLabel', tr('clearImportedTitle'));
    setText('#clearImportedTracksDescription', tr('clearImportedDescription'));
    setText('#clearImportedTracksBtn', tr('clearImportedButton'));
    setText('#libraryHealthLabel', tr('libraryHealth'));
    setText('#libraryHealthDescription', tr('libraryHealthDescription'));
    setText('#analyzeLibraryBtn', tr('analyzeLibrary'));
    setText('#manageLibrarySourcesBtn', tr('manageLibrarySources'));
    setText('#scanSourceDuplicatesBtn', tr('scanAllSourceDuplicates'));
    setText('#sourceDuplicatesNote', tr('sourceFoldersNote'));
    renderLibrarySourcesList();
    setText('#sloganText', tr('slogan'));
    setText('#heroAddText', tr('uploadMusic'));
    const heroSound = $('#heroSoundBtn'); if (heroSound) heroSound.innerHTML = `<span class="chip-dot"></span> ${{ru:'ЗВУК ВКЛ',en:'SOUND ON',de:'TON AN'}[currentLocale]} <span class="chip-eq-mini" aria-hidden="true"><i></i><i></i><i></i></span>`;
    if (ui.search) { ui.search.placeholder = tr('searchPlaceholder'); ui.search.setAttribute('aria-label', tr('searchPlaceholder')); }
    setText('.table-head .col-title', tr('columnName'));
    setText('.table-head .col-album', activeView === 'smart-most-played' ? tr('playCountColumn') : activeView === 'smart-recent' ? tr('sourceFileDate') : tr('added'));
    const queueFooterLabel = $('.queue-footer > span:first-child');
    if (queueFooterLabel) queueFooterLabel.innerHTML = `<span class="queue-footer-dot"></span> ${tr('localLibrary').toLocaleUpperCase(({ru:'ru-RU',en:'en-US',de:'de-DE'})[currentLocale])}`;
    const queueShuffle = $('#queueShuffleBtn'); if (queueShuffle) { queueShuffle.title = currentLocale === 'ru' ? 'Перемешать' : currentLocale === 'en' ? 'Shuffle' : 'Zufällige Wiedergabe'; queueShuffle.setAttribute('aria-label', queueShuffle.title); }
    const clearQueue = $('#clearQueueBtn'); if (clearQueue) { clearQueue.title = currentLocale === 'ru' ? 'Очистить очередь' : currentLocale === 'en' ? 'Clear queue' : 'Warteschlange leeren'; clearQueue.setAttribute('aria-label', clearQueue.title); }
    const folderButton = $('#addFolderBtn'); if (folderButton) { folderButton.title = tr('importFolder'); folderButton.setAttribute('aria-label', tr('importFolder')); }
    const folderSourceLabel = $('#folderSourceLabel'); if (folderSourceLabel) folderSourceLabel.textContent = tr('folderSourceLabel');
    const clearFolderButton = $('#clearFolderSourceBtn'); if (clearFolderButton) { clearFolderButton.title = tr('clearFolderSource'); clearFolderButton.setAttribute('aria-label', tr('clearFolderSource')); }
    updateFolderSourceUI();
    const addButton = $('#addMusicBtn'); if (addButton) { addButton.title = tr('addMusic'); addButton.setAttribute('aria-label', tr('addMusic')); }
    const studioClose = $('#closeSoundStudio'); if (studioClose) { studioClose.title = tr('close'); studioClose.setAttribute('aria-label', tr('close')); }
    const settingsStudio = $('#settingsToggle'); if (settingsStudio) { settingsStudio.title = tr('studioTitle'); settingsStudio.setAttribute('aria-label', tr('studioTitle')); }
    const muteButton = $('#muteBtn'); if (muteButton) { const muteText = ui.audio && (ui.audio.muted || ui.audio.volume === 0) ? tr('unmute') : tr('mute'); muteButton.title = muteText; muteButton.setAttribute('aria-label', muteText); }
    const coverButton = $('#changeCoverBtn'); if (coverButton) { const coverLabel = currentLocale === 'ru' ? 'Изменить обложку текущего трека' : currentLocale === 'en' ? 'Change current track cover' : 'Cover des aktuellen Titels ändern'; coverButton.title = coverLabel; coverButton.setAttribute('aria-label', coverLabel); }
    const shuffleButton = $('#shuffleBtn'); if (shuffleButton) shuffleButton.setAttribute('aria-label', tr(shuffleEnabled ? 'shuffleOn' : 'shuffleOff'));
    const previousButton = $('#previousBtn'); if (previousButton) previousButton.setAttribute('aria-label', currentLocale === 'ru' ? 'Предыдущий трек' : currentLocale === 'en' ? 'Previous track' : 'Vorheriger Titel');
    const nextButton = $('#nextBtn'); if (nextButton) nextButton.setAttribute('aria-label', currentLocale === 'ru' ? 'Следующий трек' : currentLocale === 'en' ? 'Next track' : 'Nächster Titel');
    const playLabel = ui.audio && !ui.audio.paused ? tr('pause') : tr('play');
    const playButton = $('#playBtn'); if (playButton) { playButton.title = playLabel; playButton.setAttribute('aria-label', playLabel); }
    const queueToggle = $('#toggleQueueBtn'); if (queueToggle) { const label = currentLocale === 'ru' ? 'Показать текущий плейлист' : currentLocale === 'en' ? 'Show current playlist' : 'Aktuelle Wiedergabeliste anzeigen'; queueToggle.title = label; queueToggle.setAttribute('aria-label', label); }
    const sortButton = $('#sortBtn'); if (sortButton) sortButton.title = currentLocale === 'ru' ? 'Изменить сортировку' : currentLocale === 'en' ? 'Change sorting' : 'Sortierung ändern';
    const clearSearch = $('#clearSearchBtn'); if (clearSearch) { const label = tr('clearSearch'); clearSearch.title = label; clearSearch.setAttribute('aria-label', label); }
    const shuffleAll = $('#shuffleAllBtn'); if (shuffleAll) { const label = currentLocale === 'ru' ? 'Случайный трек' : currentLocale === 'en' ? 'Shuffle a track' : 'Zufälligen Titel wählen'; shuffleAll.title = label; shuffleAll.setAttribute('aria-label', label); }
    const emptyDescription = $('.empty-state .drop-hint'); if (emptyDescription) emptyDescription.textContent = tr('dropHint');
    const heroParagraph = $('.hero-copy p'); if (heroParagraph) heroParagraph.innerHTML = `${tr('heroLine1')}<br>${tr('heroLine2')}`;
    setText('#queueHeadingText', tr('queueTitle'));
    const queueAddText = $('#queueAddText'); if (queueAddText) queueAddText.textContent = tr('queueAdd');
    const queueEmpty = $('#queueEmpty p'); if (queueEmpty) queueEmpty.innerHTML = tr('queueEmpty');
    setText('#settingsLanguageLabel', tr('language'));
    setText('#settingsLanguageDescription', tr('languageDescription'));
    setText('#settingsEffectsLabel', tr('effects'));
    setText('#settingsEffectsDescription', tr('effectsDescription'));
    setText('#settingsDefaultNote', tr('effectsDefault'));
    const profileHeading = $('#profileAppearanceHeading'); if (profileHeading) profileHeading.innerHTML = `${tr('profileAppearance')}<span>.</span>`;
    setText('#profileAppearanceDescription', tr('profileAppearanceDescription'));
    setText('#profilePreviewSubtitle', tr('profilePreview'));
    setText('#profileStyleLabel', tr('profileStyle'));
    setText('#profileModeLabel', tr('profileMode'));
    const profileModeSelect = $('#profileModeSelect');
    if (profileModeSelect) {
      profileModeSelect.setAttribute('aria-label', tr('profileMode'));
      const modeLabels = { normal: 'profileModeNormal', halloween: 'profileModeHalloween', christmas: 'profileModeChristmas' };
      [...profileModeSelect.options].forEach(option => option.textContent = tr(modeLabels[option.value] || 'profileModeNormal'));
    }
    setText('#profileColorLabel', tr('profileColor'));
    setText('#profileGradientLabel', tr('profileGradient'));
    setText('#resetProfileAppearanceBtn', tr('resetProfileAppearance'));
    const profileStyleSelect = $('#profileStyleSelect');
    if (profileStyleSelect) {
      profileStyleSelect.setAttribute('aria-label', tr('profileStyle'));
      const styleLabels = { classic: 'profileStyleClassic', neon: 'profileStyleNeon', glass: 'profileStyleGlass' };
      [...profileStyleSelect.options].forEach(option => option.textContent = tr(styleLabels[option.value] || 'profileStyleClassic'));
    }
    const profileGradientSelect = $('#profileGradientSelect');
    if (profileGradientSelect) {
      profileGradientSelect.setAttribute('aria-label', tr('profileGradient'));
      const gradientLabels = { crimson: 'gradientCrimson', ember: 'gradientEmber', violet: 'gradientViolet', ocean: 'gradientOcean', mono: 'gradientMono' };
      [...profileGradientSelect.options].forEach(option => option.textContent = tr(gradientLabels[option.value] || 'gradientCrimson'));
    }
    setText('#settingsAuthorLabel', tr('author'));
    const panelTitle = $('#appSettingsHeading'); if (panelTitle) panelTitle.innerHTML = `${tr('settings')}<span>.</span>`;
    const closeSettings = $('#closeAppSettings'); if (closeSettings) { closeSettings.title = tr('close'); closeSettings.setAttribute('aria-label', tr('close')); }
    const select = $('#languageSelect'); if (select) select.setAttribute('aria-label', tr('language'));
    const effectsSwitch = $('#effectsToggleBtn'); if (effectsSwitch) effectsSwitch.setAttribute('aria-label', tr('effects'));
    const soundStudio = $('#soundStudio'); if (soundStudio) soundStudio.setAttribute('aria-label', tr('studioTitle'));
    const studioTitle = $('#soundStudio .studio-header h2'); if (studioTitle) studioTitle.innerHTML = `${tr('studioTitle')}<span>.</span>`;
    setText('.studio-intro', tr('studioIntro'));
    setText('#resetSoundBtn', tr('resetSound'));
    const speedLabel = $('#speedSlider')?.closest('.studio-control')?.querySelector('label span');
    const gainLabel = $('#gainSlider')?.closest('.studio-control')?.querySelector('label span');
    const bassLabel = $('#bassSlider')?.closest('.studio-control')?.querySelector('label span');
    const midLabel = $('#midSlider')?.closest('.studio-control')?.querySelector('label span');
    const trebleLabel = $('#trebleSlider')?.closest('.studio-control')?.querySelector('label span');
    [[speedLabel, tr('speed')], [gainLabel, tr('gain')], [bassLabel, tr('bass')], [midLabel, tr('mid')], [trebleLabel, tr('treble')]].forEach(([node, text]) => {
      if (!node) return; const textNode = [...node.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()); if (textNode) textNode.textContent = ` ${text}`;
    });
    const speedEnds = $('#speedSlider')?.closest('.studio-control')?.querySelector('.range-ends');
    if (speedEnds) speedEnds.innerHTML = currentLocale === 'ru' ? '<span>0.5× медленнее</span><span>1×</span><span>1.5× быстрее</span>' : currentLocale === 'en' ? '<span>0.5× slower</span><span>1×</span><span>1.5× faster</span>' : '<span>0,5× langsamer</span><span>1×</span><span>1,5× schneller</span>';
    const speedInput = $('#speedSlider'); if (speedInput) speedInput.setAttribute('aria-label', tr('speed'));
    const gainInput = $('#gainSlider'); if (gainInput) gainInput.setAttribute('aria-label', tr('gain'));
    const bassInput = $('#bassSlider'); if (bassInput) bassInput.setAttribute('aria-label', tr('bass'));
    const midInput = $('#midSlider'); if (midInput) midInput.setAttribute('aria-label', tr('mid'));
    const trebleInput = $('#trebleSlider'); if (trebleInput) trebleInput.setAttribute('aria-label', tr('treble'));
    const settingsButton = $('#appSettingsBtn'); if (settingsButton) { settingsButton.title = tr('settings'); settingsButton.setAttribute('aria-label', tr('settings')); }
    const fullscreen = $('#fullscreenBtn'); if (fullscreen) { fullscreen.title = tr('fullscreen'); fullscreen.setAttribute('aria-label', tr('fullscreen')); }
    const helpButton = $('#helpBtn'); if (helpButton) { helpButton.title = tr('help'); helpButton.setAttribute('aria-label', tr('help')); }
    const repeatLabel = repeatMode === 'one' ? tr('repeatOne') : repeatMode === 'all' ? tr('repeatAll') : tr('repeatOff');
    if (ui.repeatBtn) { ui.repeatBtn.title = repeatLabel; ui.repeatBtn.setAttribute('aria-label', repeatLabel); }
    setText('#audioEngineStatus', ui.audio && !ui.audio.paused && analyserNode ? tr('live') : tr('ready'));
    const emptyHeading = $('.empty-state h3');
    const hasSourceTracks = getSourceTracks().length > 0;
    const emptySelectedFolder = !!activeLibraryFolderPath && !hasSourceTracks;
    if (emptyHeading && ui.emptyState?.classList.contains('show')) emptyHeading.textContent = emptySelectedFolder ? translateInlineText('В выбранной папке пока нет музыки') : hasSourceTracks ? tr('emptyNoResults') : tr('emptyTitle');
    const emptyP = $('.empty-state p');
    if (emptyP && ui.emptyState?.classList.contains('show')) emptyP.innerHTML = emptySelectedFolder ? translateInlineText('Добавь аудиофайлы в выбранную папку или выбери другой музыкальный каталог.') : hasSourceTracks ? tr('emptySearchText') : tr('emptyText');
    const emptyBtn = $('#emptyAddBtn');
    if (emptyBtn && ui.emptyState?.classList.contains('show')) {
      const hasTracks = getSourceTracks().length > 0;
      const emptySelectedFolder = !!activeLibraryFolderPath && !hasTracks;
      emptyBtn.innerHTML = emptySelectedFolder ? `${svgIcon('folder')} ${translateInlineText('Выбрать другую папку')}` : hasTracks ? `${svgIcon('x')} ${tr('clearSearch')}` : `${svgIcon('plus')} ${tr('chooseAudio')}`;
      emptyBtn.dataset.mode = emptySelectedFolder ? 'folder' : hasTracks ? 'clear' : 'add';
    }
    // Rebuild saved preset controls so their tooltips and accessible labels follow the selected language.
    renderCustomEqPresets();
  }
  function newId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  }
  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return hours ? `${hours}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}` : `${minutes}:${String(secs).padStart(2,'0')}`;
  }
  function wordTracks(count) {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return `${count} треков`;
    if (n1 > 1 && n1 < 5) return `${count} трека`;
    if (n1 === 1) return `${count} трек`;
    return `${count} треков`;
  }
  function parseFilename(fileName) {
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    const parts = withoutExt.split(/\s+[–—-]\s+/);
    if (parts.length > 1) return { title: parts.slice(1).join(' - ').trim() || withoutExt, artist: parts[0].trim() || 'Неизвестный исполнитель' };
    return { title: withoutExt || fileName, artist: 'Локальная библиотека' };
  }
  function getExtension(name) { const parts = String(name).split('.'); return parts.length > 1 ? parts.pop().toLowerCase() : ''; }
  function isAudioFile(file) { return (file.type && file.type.startsWith('audio/')) || AUDIO_EXTENSIONS.has(getExtension(file.name)); }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('IndexedDB недоступен')); return; }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Не удалось открыть базу библиотеки'));
      request.onblocked = () => reject(new Error('База заблокирована другой вкладкой'));
    });
    return dbPromise;
  }

  async function storeRequest(mode, action) {
    const database = await openDB();

    return new Promise((resolve, reject) => {
      let transaction;
      let request;
      let result;
      let settled = false;

      const fail = error => {
        if (settled) return;
        settled = true;
        reject(error || new Error(
          'Операция с базой библиотеки не выполнена'
        ));
      };

      try {
        transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        request = action(store);
      } catch (error) {
        fail(error);
        return;
      }

      request.onsuccess = () => {
        result = request.result;
      };

      request.onerror = () => {
        fail(request.error || new Error('Ошибка базы данных'));
      };

      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      transaction.onerror = () => {
        fail(transaction.error || new Error(
          'Не удалось сохранить библиотеку'
        ));
      };

      transaction.onabort = () => {
        fail(transaction.error || new Error(
          'Операция с базой библиотеки отменена'
        ));
      };
    });
  }

  function serializableTrack(track) {
    return {
      id: track.id, title: track.title, artist: track.artist, album: track.album || '', genre: track.genre || '', year: track.year || '', fileName: track.fileName,
      addedAt: track.addedAt, duration: Number.isFinite(track.duration) ? track.duration : 0,
      playCount: Number.isSafeInteger(track.playCount) ? Math.max(0, Math.min(1000000, track.playCount)) : 0,
      lastPlayedAt: Number.isFinite(track.lastPlayedAt) && track.lastPlayedAt >= 0 ? track.lastPlayedAt : null,
      sourceDateAt: Number.isFinite(track.sourceDateAt) && track.sourceDateAt > 0 ? track.sourceDateAt : null,
      favorite: !!track.favorite, playlists: Array.isArray(track.playlists) ? track.playlists : [],
      // New imports store only the original path, not a duplicate of the audio data.
      audioPath: track.audioPath || null,
      audioBlob: track.audioPath ? null : (track.audioBlob || null),
      coverBlob: track.coverBlob || null
    };
  }
  async function saveTrack(track) {
    try {
      await storeRequest('readwrite', store => store.put(serializableTrack(track)));
      ui.storageText.textContent = 'Библиотека хранится на устройстве';
      return true;
    } catch (error) {
      ui.storageText.textContent = 'Не удалось сохранить библиотеку';
      console.error('FoxsMusic: save error', error);
      toast('Не удалось сохранить трек в браузере. Проверь свободное место.', 'error');
      return false;
    }
  }
  async function deleteStoredTrack(id) {
    return storeRequest('readwrite', store => store.delete(id));
  }
  async function deleteStoredTracks(ids) {
    const uniqueIds = [...new Set(ids)].filter(Boolean);
    if (!uniqueIds.length) return;
    const database = await openDB();
    return new Promise((resolve, reject) => {
      let transaction;
      try {
        transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        uniqueIds.forEach(id => store.delete(id));
      } catch (error) { reject(error); return; }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Не удалось удалить дублирующие записи'));
      transaction.onabort = () => reject(transaction.error || new Error('Удаление дубликатов отменено'));
    });
  }
  async function clearStoredTracks() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      let transaction;
      try {
        transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).clear();
      } catch (error) { reject(error); return; }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Не удалось очистить библиотеку'));
      transaction.onabort = () => reject(transaction.error || new Error('Очистка библиотеки отменена'));
    });
  }
  async function hydrateTrack(raw) {
    const track = { ...raw };
    if (track.audioPath && window.foxsmusic?.getPlaybackUrl) {
      try { track.audioUrl = await window.foxsmusic.getPlaybackUrl(track.audioPath); }
      catch (error) { track.audioUrl = null; track.sourceUnavailable = true; console.warn('FoxsMusic original file unavailable:', track.audioPath, error); }
    } else {
      track.audioUrl = track.audioBlob ? URL.createObjectURL(track.audioBlob) : null;
    }
    track.coverUrl = track.coverBlob ? URL.createObjectURL(track.coverBlob) : LOGO;
    track.playlists = Array.isArray(track.playlists) ? track.playlists : [];
    track.favorite = !!track.favorite;
    track.duration = Number(track.duration) || 0;
    track.playCount = Number.isSafeInteger(track.playCount) && track.playCount > 0 ? Math.min(1000000, track.playCount) : 0;
    track.lastPlayedAt = Number.isFinite(track.lastPlayedAt) && track.lastPlayedAt >= 0 ? track.lastPlayedAt : 0;
    track.sourceDateAt = Number.isFinite(track.sourceDateAt) && track.sourceDateAt > 0 ? track.sourceDateAt : 0;
    track.album = typeof track.album === 'string' ? track.album : '';
    track.genre = typeof track.genre === 'string' ? track.genre : '';
    track.year = track.year == null ? '' : String(track.year);
    return track;
  }
  async function loadStoredTracks() {
    try {
      const stored = await storeRequest('readonly', store => store.getAll());
      tracks = (await Promise.all(stored.map(hydrateTrack))).sort((a,b) => b.addedAt - a.addedAt);
      for (const track of tracks) if (!track.duration && track.audioUrl) readDuration(track);
      ui.storageText.textContent = 'Библиотека хранится на устройстве';
    } catch (error) {
      console.error('FoxsMusic: load error', error);
      ui.storageText.textContent = 'Локальное сохранение недоступно';
      toast('Браузер не открыл локальную библиотеку. Можно продолжить, но сохранение может быть недоступно.', 'error');
    }
  }
  function readDuration(track) {
    if (!track.audioUrl) return;
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.crossOrigin = 'anonymous';
    const usesBlobUrl = !!track.audioBlob;
    const tmpUrl = usesBlobUrl ? URL.createObjectURL(track.audioBlob) : track.audioUrl;
    probe.src = tmpUrl;
    const finish = () => {
      if (usesBlobUrl) URL.revokeObjectURL(tmpUrl);
      probe.removeAttribute('src'); probe.load();
    };
    probe.addEventListener('loadedmetadata', async () => {
      if (Number.isFinite(probe.duration)) {
        track.duration = probe.duration;
        await saveTrack(track);
        // Update duration cells in place rather than rebuilding the whole library.
        const row = $(`.track-row[data-track-id="${CSS.escape(track.id)}"]`);
        if (row) $('.row-duration', row).textContent = formatTime(track.duration);
        const queued = $(`.queue-row[data-track-id="${CSS.escape(track.id)}"]`);
        if (queued) $('.queue-duration', queued).textContent = formatTime(track.duration);
        const viewTracks = getViewTracks();
        ui.queueDuration.textContent = formatTime(viewTracks.reduce((sum, item) => sum + (item.duration || 0), 0));
        if (currentTrackId === track.id) ui.durationText.textContent = formatTime(track.duration);
      }
      finish();
    }, { once: true });
    probe.addEventListener('error', finish, { once: true });
  }

  function toast(message, type = '') {
    message = translateInlineSegments(String(message ?? ''));
    const node = document.createElement('div');
    node.className = `toast ${type}`.trim();
    node.textContent = message;
    ui.toastRegion.appendChild(node);
    const timer = setTimeout(() => {
      node.style.opacity = '0'; node.style.transform = 'translateY(6px)';
      setTimeout(() => node.remove(), 220);
      toastTimerIds.delete(timer);
    }, 3300);
    toastTimerIds.add(timer);
  }
  function openModal(markup, focusSelector = null) {
    ui.modalRoot.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><section class="modal-card" role="dialog" aria-modal="true">${markup}</section></div>`;
    captureStaticLocaleSubtree(ui.modalRoot);
    const backdrop = $('[data-modal-backdrop]', ui.modalRoot);
    backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(); });
    $$('[data-close-modal]', ui.modalRoot).forEach(button => button.addEventListener('click', closeModal));
    if (focusSelector) setTimeout(() => $(focusSelector, ui.modalRoot)?.focus(), 30);
  }
  function closeModal() { ui.modalRoot.innerHTML = ''; }

  function getTrack(id) { return tracks.find(track => track.id === id) || null; }
  function getCurrentTrack() { return getTrack(currentTrackId); }
  function normalizeFilePath(filePath) {
    let value = String(filePath || '').replace(/\\/g, '/').replace(/\/+/g, '/');
    if (value.length > 1) value = value.replace(/\/+$/, '');
    if (window.foxsmusic?.platform === 'win32') value = value.toLocaleLowerCase();
    return value;
  }
  function pathIsWithinFolder(filePath, folderPath) {
    const file = normalizeFilePath(filePath);
    const root = normalizeFilePath(folderPath);
    if (!file || !root) return false;
    if (file === root) return true;
    const prefix = root.endsWith('/') ? root : `${root}/`;
    return file.startsWith(prefix);
  }
  function getConfiguredSourcePaths() {
    const unique = new Map();
    for (const candidate of [...librarySourcePaths, ...(activeLibraryFolderPath ? [activeLibraryFolderPath] : [])]) {
      if (typeof candidate !== 'string' || !candidate.trim()) continue;
      const key = normalizeFilePath(candidate);
      if (key && !unique.has(key)) unique.set(key, candidate);
    }
    return [...unique.values()].slice(0, 100);
  }
  function addConfiguredSourcePaths(paths) {
    const existing = new Set(librarySourcePaths.map(normalizeFilePath));
    let added = 0;
    for (const candidate of (Array.isArray(paths) ? paths : [paths])) {
      if (typeof candidate !== 'string' || !candidate.trim()) continue;
      const key = normalizeFilePath(candidate);
      if (!key || existing.has(key) || librarySourcePaths.length >= 100) continue;
      librarySourcePaths.push(candidate); existing.add(key); added++;
    }
    return added;
  }
  function renderLibrarySourcesList() {
    const container = $('#librarySourcesList');
    if (!container) return;
    const sources = getConfiguredSourcePaths();
    if (!sources.length) {
      container.innerHTML = `<div class="library-source-empty">${escapeHTML(tr('sourceFoldersEmpty'))}</div>`;
      return;
    }
    container.innerHTML = sources.map((sourcePath, index) => {
      const isActive = !!activeLibraryFolderPath && normalizeFilePath(sourcePath) === normalizeFilePath(activeLibraryFolderPath);
      return `<div class="library-source-entry"><span title="${escapeHTML(sourcePath)}">${escapeHTML(sourcePath)}${isActive ? `<small>${escapeHTML(tr('sourceFolderActive'))}</small>` : ''}</span><button type="button" data-remove-library-source="${index}" title="${escapeHTML(tr('sourceFolderRemove'))}" aria-label="${escapeHTML(tr('sourceFolderRemove'))}" ${isActive ? 'disabled' : ''}>×</button></div>`;
    }).join('');
    $$('[data-remove-library-source]', container).forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.removeLibrarySource);
      const sourcePath = getConfiguredSourcePaths()[index];
      if (!sourcePath || (activeLibraryFolderPath && normalizeFilePath(sourcePath) === normalizeFilePath(activeLibraryFolderPath))) return;
      librarySourcePaths = librarySourcePaths.filter(item => normalizeFilePath(item) !== normalizeFilePath(sourcePath));
      persistSettings(); renderLibrarySourcesList();
      toast(currentLocale === 'en' ? 'Source removed from duplicate checks.' : currentLocale === 'de' ? 'Quelle aus der Duplikatprüfung entfernt.' : 'Папка исключена из проверки дубликатов.', 'success');
    }));
  }
  async function addLibrarySourceFolders() {
    if (!window.foxsmusic?.selectSourceFolders) { toast(tr('folderSourceUnavailable'), 'error'); return; }
    const button = $('#manageLibrarySourcesBtn');
    if (button) button.disabled = true;
    try {
      const result = await window.foxsmusic.selectSourceFolders(currentLocale);
      if (!result || result.canceled) return;
      const added = addConfiguredSourcePaths(result.folderPaths || []);
      persistSettings(); renderLibrarySourcesList();
      const message = tr('sourcesAdded').replace('{count}', String(added));
      toast(message, 'success');
    } catch (error) {
      console.error('FoxsMusic source folder selection failed', error);
      toast(tr('folderSourceUnavailable'), 'error');
    } finally { if (button) button.disabled = false; }
  }
  function isTrackInActiveFolder(track) {
    if (!activeLibraryFolderPath) return true;
    if (!track?.audioPath || !pathIsWithinFolder(track.audioPath, activeLibraryFolderPath)) return false;
    if (activeFolderTrackPaths instanceof Set) return activeFolderTrackPaths.has(normalizeFilePath(track.audioPath));
    return true;
  }
  function getSourceTracks() { return tracks.filter(isTrackInActiveFolder); }
  function folderDisplayName(folderPath) {
    const clean = String(folderPath || '').replace(/[\\/]+$/, '');
    return clean.split(/[\\/]/).pop() || folderPath || '';
  }
  function updateFolderSourceUI() {
    const panel = $('#folderSourceStatus');
    const pathLabel = $('#folderSourcePath');
    const folderButton = $('#addFolderBtn');
    if (panel) panel.hidden = !activeLibraryFolderPath;
    if (pathLabel) {
      pathLabel.textContent = activeLibraryFolderPath ? folderDisplayName(activeLibraryFolderPath) : '';
      pathLabel.title = activeLibraryFolderPath || '';
    }
    if (folderButton) {
      folderButton.classList.toggle('has-folder-source', !!activeLibraryFolderPath);
      folderButton.title = activeLibraryFolderPath ? `${tr('importFolder')}: ${activeLibraryFolderPath}` : tr('importFolder');
      folderButton.setAttribute('aria-label', folderButton.title);
    }
  }
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
  function formatTrackTimestamp(value, locale = currentLocale) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return '—';
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return '—';
    const localeTag = ({ ru: 'ru-RU', en: 'en-US', de: 'de-DE' })[locale] || 'ru-RU';
    return new Intl.DateTimeFormat(localeTag, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(date);
  }
  function formatTrackTimestampLong(value, locale = currentLocale) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return '';
    const localeTag = ({ ru: 'ru-RU', en: 'en-US', de: 'de-DE' })[locale] || 'ru-RU';
    return new Intl.DateTimeFormat(localeTag, {
      dateStyle: 'full', timeStyle: 'short'
    }).format(date);
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

  function setAllTracksView() {
    activeView = 'all'; activePlaylistId = null;
    $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'all'));
  }
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
  function getPlaybackQueue() {
    const savedQueue = playbackQueueIds.map(getTrack).filter(track => track && isTrackInActiveFolder(track));
    if (queueExplicit) return savedQueue;
    if (savedQueue.length) return savedQueue;
    const visible = getViewTracks();
    if (visible.length) return visible;
    return getSourceTracks().slice().sort((a,b) => b.addedAt - a.addedAt);
  }
  function setPlaybackQueue(ids, shouldPersist = true) {
    playbackQueueIds = [...new Set((ids || []).filter(id => !!getTrack(id)))].slice(0, 10000);
    queueExplicit = true;
    // Reconcile the shuffled order lazily so editing the queue never loses its order.
    if (shuffleEnabled) getPlaybackOrder();
    if (shouldPersist) persistSettings();
  }
  function shuffleArray(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function resetShuffleOrder(currentId = null) {
    const ids = getPlaybackQueue().map(track => track.id);
    if (currentId && ids.includes(currentId)) {
      shuffleOrderIds = [currentId, ...shuffleArray(ids.filter(id => id !== currentId))];
    } else {
      shuffleOrderIds = shuffleArray(ids);
    }
    return shuffleOrderIds.map(getTrack).filter(Boolean);
  }
  function getPlaybackOrder() {
    const queue = getPlaybackQueue();
    if (!shuffleEnabled) return queue;
    const availableIds = queue.map(track => track.id);
    const available = new Set(availableIds);
    let order = shuffleOrderIds.filter(id => available.has(id));
    if (!order.length && availableIds.length) {
      const currentId = available.has(currentTrackId) ? currentTrackId : null;
      return resetShuffleOrder(currentId);
    }
    const present = new Set(order);
    const missing = availableIds.filter(id => !present.has(id));
    if (missing.length) order.push(...shuffleArray(missing));
    shuffleOrderIds = order;
    return order.map(getTrack).filter(Boolean);
  }
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
  async function playFromCurrentView(trackId) {
    const visible = getViewTracks();
    setPlaybackQueue(visible.map(track => track.id));
    await playTrack(trackId);
  }
  function currentPlaylistName() {
    if (activeView === 'smart-most-played') return tr('smartMostPlayed');
    if (activeView === 'smart-recent') return tr('smartRecentlyAdded');
    if (activeView === 'favorites') return 'Избранное';
    if (activeView === 'playlists') {
      if (activePlaylistId) return playlists.find(p => p.id === activePlaylistId)?.name || 'Плейлист';
      return 'Все плейлисты';
    }
    if (activeView === 'history') return 'История';
    return 'Моя музыка';
  }
  function updateHeadings(viewTracks) {
    const query = ui.search.value.trim();
    const playlistName = localizedPlaylistName(currentPlaylistName());
    if (query) {
      ui.viewTitle.innerHTML = `${tr('searchResults')}<span class="title-period">.</span>`;
      ui.viewSubtitle.textContent = `${tr('searchFor')} «${query}»`;
      ui.listHeading.textContent = tr('foundTracks');
      ui.listSubheading.textContent = `${tr('matches')}: ${viewTracks.length}`;
    } else if (activeView === 'favorites') {
      ui.viewTitle.innerHTML = `${tr('favorites')}<span class="title-period">.</span>`;
      ui.viewSubtitle.textContent = tr('favoritesSub');
      ui.listHeading.textContent = tr('favoritesTracks');
      ui.listSubheading.textContent = tr('favoritesSub');
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
      ui.viewSubtitle.textContent = tr('playlistSub');
      ui.listHeading.textContent = activePlaylistId ? tr('playlistTracks') : tr('playlistsMusic');
      ui.listSubheading.textContent = tr('playlistSub');
    } else if (activeView === 'history') {
      ui.viewTitle.innerHTML = `${translateInlineText('История')}<span class="title-period">.</span>`;
      ui.viewSubtitle.textContent = translateInlineText('Недавно воспроизведённые треки.');
      ui.listHeading.textContent = translateInlineText('Недавно прослушано');
      ui.listSubheading.textContent = translateInlineText('Последние 100 треков');
    } else {
      ui.viewTitle.innerHTML = `${tr('viewTitle')}<span class="title-period">.</span>`;
      ui.viewSubtitle.textContent = tr('viewSubtitle');
      ui.listHeading.textContent = tr('tracks');
      ui.listSubheading.textContent = tr('tracksSub');
    }
    if (ui.sortBtn) ui.sortBtn.hidden = activeView.startsWith('smart-');
    ui.trackTotal.textContent = wordTracks(viewTracks.length);
    ui.libraryCount.textContent = String(getSourceTracks().length);
    const historyCount = $('#historyCount'); if (historyCount) historyCount.textContent = String(playbackHistory.length);
    ui.queueCount.textContent = wordTracks(getPlaybackQueue().length);
    ui.queueContextLabel.textContent = activeView === 'history' ? translateInlineText('История') : playlistName;
    const sortLabel = $('#sortBtn span:last-child'); if (sortLabel) sortLabel.textContent = sortMode === 'recent' ? tr('recentlyAdded') : tr('sortByTitle');
    const queueHeading = $('#queueHeadingText'); if (queueHeading) queueHeading.textContent = tr('queueTitle');
  }
  function coverFor(track) {
    if (track?.coverBlob && track.coverUrl) return track.coverUrl; // user-selected artwork always wins
    return track?.artworkUrl || track?.coverUrl || LOGO;
  }

  let originalArtworkObserver = null;
  async function loadOriginalArtwork(track) {
    if (!track || !track.audioPath || track.coverBlob || track.artworkUrl || track.artworkChecked || !window.foxsmusic?.getTrackArtwork) return null;
    if (track.artworkPromise) return track.artworkPromise;
    track.artworkPromise = (async () => {
      try {
        const artwork = await window.foxsmusic.getTrackArtwork(track.audioPath);
        track.artworkChecked = true;
        if (typeof artwork === 'string' && artwork.startsWith('data:image/')) {
          track.artworkUrl = artwork;
          const selector = `img[data-track-artwork="${CSS.escape(track.id)}"]`;
          $$(selector).forEach(image => { image.src = artwork; });
          if (currentTrackId === track.id && !track.coverBlob) ui.nowCover.src = artwork;
          return artwork;
        }
      } catch (error) {
        track.artworkChecked = true;
        console.debug('FoxsMusic: no original cover for', track.fileName || track.title, error?.message || error);
      } finally {
        track.artworkPromise = null;
      }
      return null;
    })();
    return track.artworkPromise;
  }

  function observeOriginalArtwork(root) {
    if (!root || !window.foxsmusic?.getTrackArtwork) return;
    if (!originalArtworkObserver && 'IntersectionObserver' in window) {
      originalArtworkObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          originalArtworkObserver.unobserve(entry.target);
          const track = getTrack(entry.target.dataset.trackArtwork);
          if (track) void loadOriginalArtwork(track);
        }
      }, { root: null, rootMargin: '100px 0px' });
    }
    $$('img[data-track-artwork]', root).forEach(image => {
      const track = getTrack(image.dataset.trackArtwork);
      if (!track || track.coverBlob || !track.audioPath) return;
      if (track.artworkUrl) { image.src = track.artworkUrl; return; }
      if (track.artworkChecked) return;
      if (originalArtworkObserver) originalArtworkObserver.observe(image);
      else void loadOriginalArtwork(track);
    });
  }
  function miniEqualizerMarkup() {
    return '<span class="mini-playing" aria-hidden="true"><i></i><i></i><i></i></span>';
  }
  function renderTrackList(viewTracks) {
    ui.trackList.innerHTML = '';
    ui.emptyState.classList.remove('show');
    if (!viewTracks.length) {
      ui.emptyState.classList.add('show');
      const hasTracks = getSourceTracks().length > 0;
      const emptySelectedFolder = !!activeLibraryFolderPath && !hasTracks;
      if (activeView === 'smart-most-played' && hasTracks && !ui.search.value.trim()) {
        $('.empty-state h3').textContent = tr('smartMostPlayedEmptyTitle');
        $('.empty-state p').textContent = tr('smartMostPlayedEmptyText');
        $('#emptyAddBtn').innerHTML = `${svgIcon('music')} ${tr('openMyMusic')}`;
        $('#emptyAddBtn').dataset.mode = 'library';
        return;
      }
      $('.empty-state h3').textContent = emptySelectedFolder ? translateInlineText('В выбранной папке пока нет музыки') : hasTracks ? tr('emptyNoResults') : tr('emptyTitle');
      $('.empty-state p').innerHTML = emptySelectedFolder
        ? translateInlineText('Добавь аудиофайлы в выбранную папку или выбери другой музыкальный каталог.')
        : hasTracks ? tr('emptySearchText') : tr('emptyText');
      $('#emptyAddBtn').innerHTML = emptySelectedFolder ? `${svgIcon('folder')} ${translateInlineText('Выбрать другую папку')}` : hasTracks ? `${svgIcon('x')} ${tr('clearSearch')}` : `${svgIcon('plus')} ${tr('chooseAudio')}`;
      $('#emptyAddBtn').dataset.mode = emptySelectedFolder ? 'folder' : hasTracks ? 'clear' : 'add';
      return;
    }
    const rowFragment = document.createDocumentFragment();
    viewTracks.forEach((track, index) => {
      const current = track.id === currentTrackId;
      const row = document.createElement('div');
      row.className = `track-row${current ? ' current' : ''}${track.sourceUnavailable ? ' is-unavailable' : ''}`;
      row.dataset.trackId = track.id;
      row.style.animationDelay = `${Math.min(index, 12) * 18}ms`;
      const isRecentSmartView = activeView === 'smart-recent';
      // Keep the source file timestamp distinct from the time FoxsMusic imported the track.
      const sourceTimestamp = trackSourceTimestamp(track);
      const displayDate = activeView === 'smart-most-played' ? track.addedAt : sourceTimestamp;
      const addedCell = activeView === 'smart-most-played'
        ? String(track.playCount || 0)
        : formatTrackTimestamp(displayDate);
      const dateKind = activeView === 'smart-most-played' ? tr('dateAdded') : tr('sourceFileDate');
      const fullDate = formatTrackTimestampLong(displayDate);
      const addedAtLabel = `${tr('dateAdded')}: ${formatTrackTimestamp(track.addedAt)}`;
      const secondaryDate = (isRecentSmartView || activeView === 'all' || activeView === 'favorites' || activeView === 'playlist')
        ? addedAtLabel
        : activeView === 'smart-most-played' ? formatTrackTimestamp(track.addedAt) : '';
      const dateTooltip = activeView === 'smart-most-played'
        ? `${tr('dateAdded')}: ${fullDate}`
        : `${tr('sourceFileDate')}: ${fullDate}\n${addedAtLabel}`;
      row.innerHTML = `
        <span class="row-number" data-number="${String(index + 1).padStart(2, '0')}" data-mode="${current && !ui.audio.paused ? 'playing' : 'number'}">${current && !ui.audio.paused ? miniEqualizerMarkup() : String(index + 1).padStart(2, '0')}</span>
        <div class="row-title-wrap"><img class="row-cover" data-track-artwork="${escapeHTML(track.id)}" src="${escapeHTML(coverFor(track))}" alt="${escapeHTML(translateInlineText('Обложка'))}" loading="lazy"><div class="row-title-stack"><span class="row-title" title="${escapeHTML(track.title)}">${escapeHTML(track.title)}</span><span class="row-artist">${escapeHTML(translateArtist(track.artist || 'Неизвестный исполнитель'))}${track.album ? ` · ${escapeHTML(track.album)}` : ''}${track.favorite ? ' · ♥' : ''}${track.sourceUnavailable ? ` · ${escapeHTML(tr('missingFile'))}` : ''}</span></div></div>
        <span class="row-added" title="${escapeHTML(dateTooltip || dateKind)}"><span class="row-added-date">${escapeHTML(addedCell)}</span>${secondaryDate ? `<span class="row-added-secondary">${escapeHTML(secondaryDate)}</span>` : ''}<span class="row-added-kind">${escapeHTML(activeView === 'smart-most-played' ? tr('dateAdded') : dateKind)}</span></span>
        <span class="row-duration">${track.duration ? formatTime(track.duration) : '—:—'}</span>
        <button class="row-action" data-action="menu" aria-label="${tr('trackActions')}" title="${tr('trackActions')}">${svgIcon('dots')}</button>`;
      row.addEventListener('click', event => {
        if (event.target.closest('[data-action="menu"]')) { event.stopPropagation(); openTrackMenu(track.id); return; }
        if (event.target.closest('button')) return;
        playFromCurrentView(track.id);
      });
      rowFragment.appendChild(row);
    });
    ui.trackList.appendChild(rowFragment);
    observeOriginalArtwork(ui.trackList);
  }
  function renderQueue(_viewTracks) {
    const queueTracks = getPlaybackQueue();
    ui.queueList.innerHTML = '';
    ui.queueEmpty.style.display = queueTracks.length ? 'none' : 'flex';
    ui.queueList.style.display = queueTracks.length ? 'block' : 'none';
    const queueFragment = document.createDocumentFragment();
    queueTracks.forEach((track, index) => {
      const row = document.createElement('div');
      row.className = `queue-row${track.id === currentTrackId ? ' current' : ''}`;
      row.dataset.trackId = track.id; row.draggable = true;
      row.style.animationDelay = `${Math.min(index, 10) * 18}ms`;
      const queueNumber = track.id === currentTrackId && !ui.audio.paused ? miniEqualizerMarkup() : String(index + 1);
      const removeQueueLabel = translateInlineText('Убрать из очереди');
      row.innerHTML = `<span class="queue-number" data-number="${index + 1}" data-mode="${track.id === currentTrackId && !ui.audio.paused ? 'playing' : 'number'}">${queueNumber}</span><img class="queue-cover" data-track-artwork="${escapeHTML(track.id)}" src="${escapeHTML(coverFor(track))}" alt="${escapeHTML(translateInlineText('Обложка'))}" loading="lazy"><span class="queue-text"><span class="queue-title" title="${escapeHTML(track.title)}">${escapeHTML(track.title)}</span><span class="queue-artist">${escapeHTML(translateArtist(track.artist || 'Неизвестный исполнитель'))}</span></span><span class="queue-duration">${track.duration ? formatTime(track.duration) : '—:—'}</span><button class="queue-remove" type="button" data-remove-queue="${escapeHTML(track.id)}" title="${escapeHTML(removeQueueLabel)}" aria-label="${escapeHTML(removeQueueLabel)}"><span aria-hidden="true">×</span></button>`;
      row.addEventListener('click', event => { if (event.target.closest('[data-remove-queue]')) return; if (event.dataTransfer) return; playTrack(track.id); });
      row.addEventListener('dragstart', event => { queueDragTrackId = track.id; event.dataTransfer?.setData('text/plain', track.id); event.dataTransfer.effectAllowed = 'move'; row.classList.add('queue-dragging'); });
      row.addEventListener('dragend', () => { queueDragTrackId = null; row.classList.remove('queue-dragging'); });
      row.addEventListener('dragover', event => { event.preventDefault(); row.classList.add('queue-drop-target'); });
      row.addEventListener('dragleave', () => row.classList.remove('queue-drop-target'));
      row.addEventListener('drop', event => { event.preventDefault(); row.classList.remove('queue-drop-target'); const draggedId = event.dataTransfer?.getData('text/plain') || queueDragTrackId; if (!draggedId || draggedId === track.id) return; const ids = queueTracks.map(item => item.id); const from = ids.indexOf(draggedId), to = ids.indexOf(track.id); if (from < 0 || to < 0) return; const [moved] = ids.splice(from, 1); ids.splice(to, 0, moved); setPlaybackQueue(ids); renderQueue(getViewTracks()); });
      queueFragment.appendChild(row);
    });
    ui.queueList.appendChild(queueFragment);
    observeOriginalArtwork(ui.queueList);
    const clearQueueButton = $('#clearQueueBtn');
    if (clearQueueButton) clearQueueButton.disabled = queueTracks.length === 0;
    const durationTotal = queueTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    ui.queueDuration.textContent = formatTime(durationTotal);
  }
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
  function updateMediaSession(track = getCurrentTrack()) {
    if (!('mediaSession' in navigator) || !track) return;
    try {
      if ('MediaMetadata' in window) navigator.mediaSession.metadata = new MediaMetadata({ title: track.title || 'FoxsMusic', artist: track.artist || 'FoxsMusic', album: track.album || 'FoxsMusic', artwork: [{ src: coverFor(track), sizes: '512x512' }] });
      navigator.mediaSession.playbackState = ui.audio.paused ? 'paused' : 'playing';
    } catch (_) {}
  }
  function updateNowPlayingOverlay() {
    const overlay = $('#nowPlayingOverlay'); if (!overlay || overlay.hidden) return;
    const track = getCurrentTrack();
    const cover = track ? coverFor(track) : LOGO;
    const playing = Boolean(track) && !ui.audio.paused;
    $('#nowPlayingCover').src = cover;
    $('#nowPlayingBackdrop').style.backgroundImage = `linear-gradient(120deg,rgba(8,4,7,.84),rgba(22,4,10,.72)),url("${cover}")`;
    $('#nowPlayingTitle').textContent = track?.title || 'FoxsMusic';
    $('#nowPlayingArtist').textContent = track ? (track.artist || tr('localLibrary')) : tr('playerChoose');
    $('#npPlayBtn').innerHTML = svgIcon(playing ? 'pause' : 'play');
    $('#npPlayBtn').setAttribute('aria-label', playing ? tr('pause') : tr('play'));
    $('#npCurrentTime').textContent = formatTime(track ? (ui.audio.currentTime || 0) : 0);
    const duration = track ? (Number.isFinite(ui.audio.duration) && ui.audio.duration > 0 ? ui.audio.duration : (track.duration || 0)) : 0;
    $('#npDuration').textContent = formatTime(duration);
    const progress = track && Number.isFinite(ui.audio.duration) && ui.audio.duration > 0 ? (ui.audio.currentTime / ui.audio.duration) * 1000 : 0;
    $('#npSeekBar').value = String(progress); setRangeFill($('#npSeekBar'));
    $('#nowPlayingBtn').classList.toggle('active', true);
    $('#nowPlayingBtn').setAttribute('aria-pressed', 'true');
  }
  function openNowPlaying() {
    const overlay = $('#nowPlayingOverlay'); if (!overlay) return;
    overlay.hidden = false; overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('now-playing-open');
    updateNowPlayingOverlay();
    $('#closeNowPlaying').focus({ preventScroll: true });
  }
  function closeNowPlaying() {
    const overlay = $('#nowPlayingOverlay'); if (!overlay || overlay.hidden) return;
    overlay.hidden = true; overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('now-playing-open');
    $('#nowPlayingBtn').classList.remove('active');
    $('#nowPlayingBtn').setAttribute('aria-pressed', 'false');
  }

  function renderNowPlaying() {
    const track = getCurrentTrack();
    if (!track) {
      ui.nowCover.removeAttribute('data-track-artwork'); ui.nowCover.src = LOGO; ui.nowTitle.textContent = 'FoxsMusic'; ui.nowArtist.textContent = tr('playerChoose');
      ui.nowStatus.textContent = tr('readyStatus'); ui.nowFavoriteBtn.classList.remove('active');
      ui.nowFavoriteBtn.title = tr('favoriteAdd'); ui.playBtn.innerHTML = svgIcon('play'); ui.playBtn.setAttribute('aria-label', tr('play'));
      ui.durationText.textContent = '0:00'; ui.currentTime.textContent = '0:00'; ui.seekBar.value = 0; setRangeFill(ui.seekBar);
      document.body.classList.remove('is-playing'); $('#heroEqualizer').classList.add('paused');
      return;
    }
    ui.nowCover.dataset.trackArtwork = track.id;
    ui.nowCover.src = coverFor(track);
    if (!track.coverBlob && !track.artworkUrl && track.audioPath) void loadOriginalArtwork(track);
    ui.nowTitle.textContent = track.title; ui.nowArtist.textContent = translateArtist(track.artist || 'Неизвестный исполнитель');
    ui.nowFavoriteBtn.classList.toggle('active', track.favorite); ui.nowFavoriteBtn.title = track.favorite ? tr('favoriteRemove') : tr('favoriteAdd');
    const playing = !ui.audio.paused;
    ui.playBtn.innerHTML = svgIcon(playing ? 'pause' : 'play'); ui.playBtn.setAttribute('aria-label', playing ? tr('pause') : tr('play'));
    ui.nowStatus.textContent = playing ? tr('playingStatus') : tr('pausedStatus');
    document.body.classList.toggle('is-playing', playing);
    $('#heroEqualizer').classList.toggle('paused', !playing);
    ui.durationText.textContent = formatTime(track.duration || ui.audio.duration || 0);
    ui.currentTime.textContent = formatTime(ui.audio.currentTime || 0);
    updateSeekRange();
    updateNowPlayingOverlay();
    updateMediaSession(track);
  }
  function renderControls() {
    ui.shuffleBtn.classList.toggle('active', shuffleEnabled);
    ui.repeatBtn.classList.toggle('active', repeatMode !== 'off');
    ui.repeatBtn.classList.toggle('repeat-one', repeatMode === 'one');
    ui.repeatBtn.classList.toggle('repeat-all', repeatMode === 'all');
    const repeatLabel = repeatMode === 'one' ? tr('repeatOne') : repeatMode === 'all' ? tr('repeatAll') : tr('repeatOff');
    ui.repeatBtn.title = repeatLabel;
    ui.repeatBtn.setAttribute('aria-label', repeatLabel);
    ui.repeatBtn.setAttribute('aria-pressed', String(repeatMode !== 'off'));
    const repeatBadge = $('.repeat-state', ui.repeatBtn);
    if (repeatBadge) {
      repeatBadge.textContent = repeatMode === 'one' ? '1' : repeatMode === 'all' ? '∞' : '';
      repeatBadge.setAttribute('aria-hidden', 'true');
    }
    ui.shuffleBtn.title = shuffleEnabled ? tr('shuffleOn') : tr('shuffleOff');
    const settings = loadSettings();
    ui.volumeBar.value = Math.round((Number.isFinite(ui.audio.volume) ? ui.audio.volume : .76) * 100);
    ui.muteBtn.innerHTML = svgIcon(ui.audio.muted || ui.audio.volume === 0 ? 'muted' : 'volume');
    ui.muteBtn.classList.toggle('active', ui.audio.muted || ui.audio.volume === 0);
    setRangeFill(ui.volumeBar);
    setRangeFill(ui.seekBar);
  }
  function renderAll() {
    const viewTracks = getViewTracks();
    updateHeadings(viewTracks);
    renderPlaylists();
    renderTrackList(viewTracks);
    renderQueue(viewTracks);
    renderNowPlaying();
    renderControls();
    applyLocale(currentLocale);
  }

  // Playback state changes should update only the affected controls/indicators.
  // Rebuilding hundreds of list rows on play/pause caused visible flicker and reset scroll position.
  function syncPlaybackUI() {
    renderNowPlaying();
    const isPlaying = !ui.audio.paused && !ui.audio.ended;

    $$('.track-row', ui.trackList).forEach(row => {
      const isCurrent = row.dataset.trackId === currentTrackId;
      row.classList.toggle('current', isCurrent);
      const number = $('.row-number', row);
      if (!number) return;
      const mode = isCurrent && isPlaying ? 'playing' : 'number';
      if (number.dataset.mode !== mode) {
        number.innerHTML = mode === 'playing' ? miniEqualizerMarkup() : escapeHTML(number.dataset.number || '');
        number.dataset.mode = mode;
      }
    });

    $$('.queue-row', ui.queueList).forEach(row => {
      const isCurrent = row.dataset.trackId === currentTrackId;
      row.classList.toggle('current', isCurrent);
      const number = $('.queue-number', row);
      if (!number) return;
      const mode = isCurrent && isPlaying ? 'playing' : 'number';
      if (number.dataset.mode !== mode) {
        number.innerHTML = mode === 'playing' ? miniEqualizerMarkup() : escapeHTML(number.dataset.number || '');
        number.dataset.mode = mode;
      }
    });
  }

  function updateTrackDurationDisplays(track) {
    const formatted = track.duration ? formatTime(track.duration) : '—:—';
    $$('.track-row', ui.trackList).forEach(row => {
      if (row.dataset.trackId === track.id) {
        const cell = $('.row-duration', row);
        if (cell) cell.textContent = formatted;
      }
    });
    $$('.queue-row', ui.queueList).forEach(row => {
      if (row.dataset.trackId === track.id) {
        const cell = $('.queue-duration', row);
        if (cell) cell.textContent = formatted;
      }
    });
    const viewTracks = getViewTracks();
    ui.queueDuration.textContent = formatTime(viewTracks.reduce((sum, item) => sum + (item.duration || 0), 0));
  }
  function setRangeFill(input) {
    const min = Number(input.min || 0), max = Number(input.max || 100), value = Number(input.value || 0);
    const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty('--range-fill', `${Math.max(0, Math.min(100, percent))}%`);
  }
  function updateSeekRange() {
    const duration = Number.isFinite(ui.audio.duration) ? ui.audio.duration : 0;
    ui.seekBar.value = duration > 0 ? String(Math.round((ui.audio.currentTime / duration) * 1000)) : '0';
    setRangeFill(ui.seekBar);
  }

  async function importAudioRecords(records) {
    const validRecords = [...records].filter(record => record && isAudioFile({ name: record.name, type: record.type || '' }));
    if (!validRecords.length) { if (records?.length) toast('Не нашёл аудиофайлы. Попробуй MP3, WAV, FLAC или OGG.', 'error'); return; }
    if (importInProgress) { toast('Импорт уже выполняется — подожди окончания.'); return; }
    importInProgress = true;
    let imported = 0;
    let skippedDuplicates = 0;
    const knownPathKeys = new Set(tracks.filter(track => track.audioPath).map(track => normalizeFilePath(track.audioPath)));
    toast(`Добавляю файлов: ${validRecords.length}…`);
    for (const record of validRecords) {
      try {
        const directPath = record.path && record.url ? record.path : null;
        const file = record.file || null;
        const pathKey = directPath ? normalizeFilePath(directPath) : null;
        if (pathKey && knownPathKeys.has(pathKey)) { skippedDuplicates++; continue; }
        if (pathKey) knownPathKeys.add(pathKey);
        if (!directPath && !file) continue;
        const fileName = record.name || file.name;
        const parsed = parseFilename(fileName);
        const track = {
          id: newId(), title: parsed.title, artist: parsed.artist, album: '', genre: '', year: '', fileName,
          audioPath: directPath,
          addedAt: Date.now() + imported,
          sourceDateAt: sourceFileTimestamp(record, file, Date.now() + imported),
          duration: 0, favorite: false, playlists: [],
          audioBlob: directPath ? null : file,
          coverBlob: null,
          audioUrl: directPath ? record.url : URL.createObjectURL(file),
          coverUrl: LOGO
        };
        tracks.push(track);
        const saved = await saveTrack(track);
        imported++;
        readDuration(track);
        if (!currentTrackId && isTrackInActiveFolder(track)) currentTrackId = track.id;
        if (!saved) ui.storageText.textContent = 'Временная библиотека — сохранение с ошибкой';
      } catch (error) {
        console.warn('FoxsMusic import error', record?.path || record?.name, error);
      }
    }
    tracks.sort((a,b) => b.addedAt - a.addedAt);
    importInProgress = false;
    activeView = 'all'; activePlaylistId = null;
    $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'all'));
    renderAll();
    if (imported) {
      const directCount = validRecords.filter(record => record.path && record.url).length;
      const message = activeLibraryFolderPath
        ? `${imported} добавлено в хранилище. Сейчас показывается только папка «${folderDisplayName(activeLibraryFolderPath)}».`
        : directCount
          ? `Добавлено: ${imported}. Оригинальные файлы не копируются в базу; сохранены пути к ним.`
          : `Добавлено: ${imported} ${imported === 1 ? 'трек' : imported < 5 ? 'трека' : 'треков'}.`;
      toast(message, 'success');
      if (skippedDuplicates) toast(tr('duplicateImportSkipped').replace('{count}', String(skippedDuplicates)));
    } else if (skippedDuplicates) {
      toast(tr('duplicateImportSkipped').replace('{count}', String(skippedDuplicates)), 'success');
    }
    if (!ui.audio.src && currentTrackId) updateNowTrackOnly();
  }

  async function importFiles(fileList) {
    const files = [...fileList].filter(isAudioFile);
    if (!files.length) { if (fileList.length) toast('Не нашёл аудиофайлы. Попробуй MP3, WAV, FLAC или OGG.', 'error'); return; }
    const records = [];
    for (const file of files) {
      try {
        const filePath = window.foxsmusic?.getPathForFile ? window.foxsmusic.getPathForFile(file) : '';
        if (filePath && window.foxsmusic?.getPlaybackUrl) {
          const url = await window.foxsmusic.getPlaybackUrl(filePath);
          records.push({ path: filePath, url, name: file.name, size: file.size, lastModified: file.lastModified });
        } else records.push({ file, name: file.name, size: file.size });
      } catch (_) { records.push({ file, name: file.name, size: file.size }); }
    }
    await importAudioRecords(records);
  }

  async function chooseAudioFiles(allowMultiple = true) {
    if (!window.foxsmusic?.selectAudioFiles) { ui.audioInput.click(); return; }
    try {
      const records = await window.foxsmusic.selectAudioFiles(allowMultiple, currentLocale);
      if (records.length) await importAudioRecords(records);
    } catch (error) {
      console.error('FoxsMusic file dialog error', error);
      toast('Не удалось открыть выбор аудиофайлов.', 'error');
    }
  }

  async function syncFolderRecords(records) {
    const validRecords = [...(records || [])].filter(record => record?.path && record?.url && isAudioFile({ name: record.name || record.path, type: '' }));
    const existingByPath = new Map();
    for (const track of tracks) {
      if (track.audioPath) existingByPath.set(normalizeFilePath(track.audioPath), track);
    }
    let added = 0;
    for (const record of validRecords) {
      const key = normalizeFilePath(record.path);
      let track = existingByPath.get(key);
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
      const fileName = record.name || record.path.split(/[\\/]/).pop();
      const parsed = parseFilename(fileName);
      track = {
        id: newId(), title: parsed.title, artist: parsed.artist, fileName,
        audioPath: record.path, addedAt: Date.now() + added,
        sourceDateAt: sourceFileTimestamp(record, null, Date.now() + added), duration: 0,
        favorite: false, playlists: [], audioBlob: null, coverBlob: null,
        audioUrl: record.url, coverUrl: LOGO
      };
      tracks.push(track);
      existingByPath.set(key, track);
      const saved = await saveTrack(track);
      if (!saved) ui.storageText.textContent = 'Временная библиотека — сохранение с ошибкой';
      readDuration(track);
      added++;
    }
    tracks.sort((a, b) => b.addedAt - a.addedAt);

    const currentTrack = getCurrentTrack();
    if (currentTrack && !isTrackInActiveFolder(currentTrack)) {
      ui.audio.pause();
      ui.audio.removeAttribute('src');
      ui.audio.load();
      currentTrackId = null;
    }
    const sourceTracks = getSourceTracks();
    if (!currentTrackId && sourceTracks.length) currentTrackId = sourceTracks[0].id;
    renderAll();
    if (currentTrackId && !ui.audio.getAttribute('src')) updateNowTrackOnly();
    return { total: validRecords.length, added };
  }

  async function activateLibraryFolder(folderPath, records, { notify = true } = {}) {
    activeLibraryFolderPath = folderPath || null;
    if (activeLibraryFolderPath) addConfiguredSourcePaths([activeLibraryFolderPath]);
    activeFolderTrackPaths = activeLibraryFolderPath
      ? new Set((records || []).map(record => normalizeFilePath(record.path)).filter(Boolean))
      : null;
    persistSettings();
    updateFolderSourceUI();
    renderLibrarySourcesList();
    setAllTracksView();
    ui.search.value = '';
    await syncFolderRecords(records || []);
    if (notify) {
      if (!activeLibraryFolderPath) toast(tr('folderSourceCleared'), 'success');
      else if (!records?.length) toast(tr('folderSourceEmpty'));
      else toast(`${tr('folderSourceSelected')} ${records.length}`, 'success');
    }
  }

  async function refreshSelectedLibraryFolder({ notify = false } = {}) {
    if (!activeLibraryFolderPath || !window.foxsmusic?.scanAudioFolderPath) return;
    try {
      const result = await window.foxsmusic.scanAudioFolderPath(activeLibraryFolderPath);
      if (result?.folderPath) activeLibraryFolderPath = result.folderPath;
      if (activeLibraryFolderPath) addConfiguredSourcePaths([activeLibraryFolderPath]);
      const records = Array.isArray(result?.records) ? result.records : [];
      activeFolderTrackPaths = new Set(records.map(record => normalizeFilePath(record.path)).filter(Boolean));
      persistSettings();
      updateFolderSourceUI();
      renderLibrarySourcesList();
      await syncFolderRecords(records);
      if (!records.length && notify) toast(tr('folderSourceEmpty'));
    } catch (error) {
      console.warn('FoxsMusic selected library folder scan failed', error);
      activeFolderTrackPaths = new Set();
      const currentTrack = getCurrentTrack();
      if (currentTrack && !isTrackInActiveFolder(currentTrack)) {
        ui.audio.pause(); ui.audio.removeAttribute('src'); ui.audio.load(); currentTrackId = null;
      }
      renderAll();
      if (notify) toast(tr('folderSourceUnavailable'), 'error');
    }
  }

  async function chooseAudioFolder() {
    if (!window.foxsmusic?.selectAudioFolder) { ui.folderInput.click(); return; }
    try {
      const result = await window.foxsmusic.selectAudioFolder(currentLocale);
      if (!result || result.canceled || !result.folderPath) return;
      await activateLibraryFolder(result.folderPath, result.records || [], { notify: true });
    } catch (error) {
      console.error('FoxsMusic folder dialog error', error);
      toast(tr('folderSourceUnavailable'), 'error');
    }
  }

  function clearLibraryFolderSource() {
    if (!activeLibraryFolderPath) return;
    activeLibraryFolderPath = null;
    activeFolderTrackPaths = null;
    persistSettings();
    updateFolderSourceUI();
    renderLibrarySourcesList();
    setAllTracksView();
    ui.search.value = '';
    renderAll();
    toast(tr('folderSourceCleared'), 'success');
  }

  async function relinkOriginalFile(trackId) {
    const track = getTrack(trackId);
    if (!track || !window.foxsmusic?.selectAudioFiles) return;
    try {
      const records = await window.foxsmusic.selectAudioFiles(false, currentLocale);
      const record = records[0];
      if (!record) return;
      const wasCurrent = currentTrackId === trackId;
      const wasPlaying = wasCurrent && !ui.audio.paused;
      const oldTime = wasCurrent ? ui.audio.currentTime : 0;
      if (wasCurrent) ui.audio.pause();
      if (track.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(track.audioUrl);
      track.audioPath = record.path;
      track.audioUrl = record.url;
      track.audioBlob = null;
      track.fileName = record.name;
      track.duration = 0;
      track.sourceUnavailable = false;
      if (wasCurrent) {
        const restorePosition = () => {
          if (Number.isFinite(oldTime) && oldTime > 0) ui.audio.currentTime = Math.min(oldTime, ui.audio.duration || oldTime);
          if (wasPlaying) ui.audio.play().catch(error => console.warn('Resume after relink failed', error));
        };
        ui.audio.addEventListener('loadedmetadata', restorePosition, { once: true });
        ui.audio.src = record.url;
        ui.audio.load();
      }
      await saveTrack(track);
      renderAll();
      readDuration(track);
      toast(tr('linkedOriginal'), 'success');
    } catch (error) {
      console.error('FoxsMusic relink error', error);
      toast(tr('openFolderFailed'), 'error');
    }
  }
  function updateNowTrackOnly() { renderNowPlaying(); }

  async function playTrack(id) {
    const track = getTrack(id);
    if (!track) { toast('Сначала добавь музыку в библиотеку.'); chooseAudioFiles(true); return; }
    if (!isTrackInActiveFolder(track)) { toast(tr('folderSourceUnavailable'), 'error'); return; }
    const source = await resolveTrackSource(track);
    if (!source) {
      track.sourceUnavailable = true;
      const row = $(`.track-row[data-track-id="${CSS.escape(track.id)}"]`);
      if (row) { row.classList.add('is-unavailable'); const artist = $('.row-artist', row); if (artist && !artist.textContent.includes(tr('missingFile'))) artist.textContent = `${artist.textContent} · ${tr('missingFile')}`; }
      toast(track.audioPath ? tr('openFolderFailed') : tr('auditNoFilePath'), 'error'); return;
    }

    const selectionChanged = currentTrackId !== track.id;
    const attachedSource = ui.audio.getAttribute('src') || '';
    const sourceChanged = attachedSource !== source;
    const needsLoad = selectionChanged || sourceChanged;
    // Manual track changes are immediate: do not fade the old song out or ramp
    // the newly selected song in. Crossfade remains available only for natural
    // end-of-track transitions handled by maybeStartAutoCrossfade().

    if (needsLoad) {
      crossfadeGeneration++;
      const inactive = audioDecks.find(deck => deck !== ui.audio);
      if (inactive) {
        inactive.pause();
        try { inactive.removeAttribute('src'); inactive.load(); } catch (_) {}
        if (audioContext) setDeckGain(inactive, 0);
      }
      ui.audio.pause();
      currentTrackId = track.id;
      ui.audio.src = source;
      ui.audio.load();
      try { ui.audio.currentTime = 0; } catch (_) {}
      // A manually selected track starts at full deck gain, regardless of the
      // automatic end-of-track crossfade setting.
      if (audioContext) setDeckGain(ui.audio, 1);
      syncPlaybackUI();
    }

    try {
      await ensureAudioEngine();
      applyAudioSettings(false);
      // Intentionally no gain ramp on manual selection: start at the user's
      // requested volume immediately. The crossfade slider applies to automatic
      // transitions near the natural end of a track.
      await ui.audio.play();
      if (selectionChanged || !attachedSource || !qualifiedPlaySession || qualifiedPlaySession.trackId !== track.id) recordPlayedTrack(track);
      updateMediaSession(track);
      updateAudioEngineStatus();
      syncPlaybackUI();
    } catch (error) {
      console.warn('FoxsMusic playback error', error);
      if (error?.name === 'NotAllowedError') toast('Нажми Play ещё раз, чтобы разрешить воспроизведение.', 'error');
      else toast('Не удалось воспроизвести этот файл. Попробуй MP3, WAV или другой аудиофайл.', 'error');
      syncPlaybackUI();
    }
  }
  async function togglePlay() {
    if (!tracks.length) { chooseAudioFiles(true); return; }
    const selectedTrack = getTrack(currentTrackId);
    if (!selectedTrack) {
      const first = getPlaybackQueue()[0] || tracks[0];
      if (first) return playTrack(first.id);
      return;
    }

    // During import currentTrackId is preselected before audio.src is set.
    // Route that first Play press through playTrack so the audio source is loaded.
    const expectedSource = selectedTrack.audioUrl;
    if (!ui.audio.getAttribute('src') || (expectedSource && ui.audio.getAttribute('src') !== expectedSource)) {
      return playTrack(selectedTrack.id);
    }

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
    syncPlaybackUI();
  }
  function selectAdjacent(direction) {
    // Shuffle uses one stable randomized order. Next/Previous then move through
    // that order without repeating a random pick before other tracks are played.
    const queue = getPlaybackOrder();
    if (!queue.length) { toast('Добавь музыку, чтобы начать воспроизведение.'); return; }
    const currentIndex = queue.findIndex(track => track.id === currentTrackId);
    let nextIndex = currentIndex < 0 ? (direction > 0 ? 0 : queue.length - 1) : currentIndex + direction;
    // Manual Previous/Next wraps around; Repeat Off only stops on natural end.
    if (nextIndex >= queue.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = queue.length - 1;
    if (currentIndex === nextIndex && queue.length === 1) {
      try { ui.audio.currentTime = 0; } catch (_) {}
      if (ui.audio.paused) togglePlay();
      return;
    }
    playTrack(queue[nextIndex].id);
  }
  function toggleShuffle() {
    shuffleEnabled = !shuffleEnabled;
    if (shuffleEnabled) resetShuffleOrder(currentTrackId);
    else shuffleOrderIds = [];
    persistSettings(); renderControls();
    toast(shuffleEnabled ? 'Перемешивание включено' : 'Перемешивание выключено', 'success');
  }
  function cycleRepeat() {
    repeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    // Both audio decks are alternated during crossfade. Keep the repeat flag in
    // sync on every deck so Repeat One survives deck swaps instead of silently
    // stopping to repeat when the secondary deck becomes active.
    audioDecks.forEach(deck => { deck.loop = repeatMode === 'one'; });
    persistSettings(); renderControls();
    toast(repeatMode === 'off' ? 'Повтор выключен' : repeatMode === 'all' ? 'Повтор всего плейлиста' : 'Повтор одного трека', 'success');
  }
  async function toggleFavorite(trackId) {
    const track = getTrack(trackId);
    if (!track) return;
    track.favorite = !track.favorite;
    await saveTrack(track);
    renderAll();
    toast(track.favorite ? 'Добавлено в избранное' : 'Убрано из избранного', 'success');
  }
  const MAX_BLOB_FINGERPRINT_BYTES = 128 * 1024 * 1024;
  let lastLibraryAudit = null;
  async function sha256StoredBlob(blob) {
    if (!blob || !Number.isFinite(blob.size) || blob.size <= 0 || blob.size > MAX_BLOB_FINGERPRINT_BYTES || !window.crypto?.subtle) return null;
    const bytes = await blob.arrayBuffer();
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }
  function buildDuplicateGroups(hashById) {
    const parent = new Map(tracks.map(track => [track.id, track.id]));
    function find(id) {
      let root = id;
      while (parent.get(root) !== root) root = parent.get(root);
      let node = id;
      while (parent.get(node) !== node) { const next = parent.get(node); parent.set(node, root); node = next; }
      return root;
    }
    function unite(a, b) { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(rb, ra); }
    const pathGroups = new Map();
    for (const track of tracks) {
      if (!track.audioPath) continue;
      const key = normalizeFilePath(track.audioPath);
      if (pathGroups.has(key)) unite(track.id, pathGroups.get(key)); else pathGroups.set(key, track.id);
    }
    const hashGroups = new Map();
    for (const [id, hash] of hashById.entries()) {
      if (!hash) continue;
      if (hashGroups.has(hash)) unite(id, hashGroups.get(hash)); else hashGroups.set(hash, id);
    }
    const groups = new Map();
    for (const track of tracks) {
      const root = find(track.id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(track);
    }
    return [...groups.values()].filter(group => group.length > 1);
  }
  function auditTrackLabel(track) {
    const name = track.title || track.fileName || track.id;
    const location = track.audioPath || track.fileName || tr('auditNoFilePath');
    return `<div class="library-audit-item${track.sourceUnavailable ? ' is-warning' : ''}"><strong>${escapeHTML(name)}</strong><small>${escapeHTML(location)}</small></div>`;
  }
  function openLibraryAuditReport(report) {
    const duplicateExtras = report.duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);
    const summary = tr('auditSummary')
      .replace('{total}', String(tracks.length))
      .replace('{missing}', String(report.missingTracks.length))
      .replace('{groups}', String(report.duplicateGroups.length))
      .replace('{extras}', String(duplicateExtras));
    const duplicateMarkup = report.duplicateGroups.length
      ? `<div class="library-audit-list">${report.duplicateGroups.slice(0, 16).map((group, index) => `<div class="library-audit-item"><strong>${index + 1}. ${escapeHTML(group[0].title || group[0].fileName)} · ${group.length} ${currentLocale === 'en' ? 'copies' : currentLocale === 'de' ? 'Einträge' : 'записи'}</strong><small>${escapeHTML(group.slice(0, 3).map(track => track.audioPath || track.fileName || track.title).join('\n'))}${group.length > 3 ? '\n…' : ''}</small></div>`).join('')}</div>`
      : `<p>${escapeHTML(tr('auditNoDuplicates'))}</p>`;
    const missingMarkup = report.missingTracks.length
      ? `<div class="library-audit-list">${report.missingTracks.slice(0, 12).map(auditTrackLabel).join('')}${report.missingTracks.length > 12 ? `<small>+ ${report.missingTracks.length - 12}</small>` : ''}</div><p>${escapeHTML(tr('originalPathNotSaved'))}</p>`
      : `<p>${escapeHTML(tr('auditNoMissing'))}</p>`;
    const blobNote = report.blobsSkipped ? `<p>${escapeHTML(tr('auditBlobTooLarge'))}</p>` : '';
    openModal(`<h2>${escapeHTML(tr('auditTitle'))}</h2><div class="library-audit-report"><div class="library-audit-summary">${escapeHTML(summary)}</div><section class="library-audit-section"><strong>${escapeHTML(tr('auditDuplicates'))}</strong>${duplicateMarkup}</section><section class="library-audit-section"><strong>${escapeHTML(tr('auditMissing'))}</strong>${missingMarkup}${blobNote}</section></div><div class="library-audit-actions">${duplicateExtras ? `<button type="button" class="modal-submit" id="removeDetectedDuplicatesBtn">${escapeHTML(tr('auditRemoveDuplicates'))} (${duplicateExtras})</button>` : ''}${getConfiguredSourcePaths().length ? `<button type="button" class="settings-library-audit-btn" id="scanSourceDuplicatesFromAuditBtn">${currentLocale === 'en' ? 'Check duplicate files across sources…' : currentLocale === 'de' ? 'Duplikate in allen Quellen prüfen…' : 'Проверить дубликаты во всех источниках…'}</button>` : ''}<button type="button" class="modal-cancel" data-close-modal>${escapeHTML(tr('close'))}</button></div>`);
    const removeButton = $('#removeDetectedDuplicatesBtn', ui.modalRoot);
    if (removeButton) removeButton.addEventListener('click', () => confirmRemoveDuplicateEntries(report.duplicateGroups));
    const sourceDuplicateButton = $('#scanSourceDuplicatesFromAuditBtn', ui.modalRoot);
    if (sourceDuplicateButton) sourceDuplicateButton.addEventListener('click', () => { closeModal(); analyzeSourceFolderDuplicates(); });
  }
  async function analyzeLibrary() {
    const button = $('#analyzeLibraryBtn');
    if (button?.disabled) return;
    if (!tracks.length) { toast(tr('clearImportedNothing')); return; }
    if (!window.foxsmusic?.analyzeLibraryFiles) { toast(tr('auditFailed'), 'error'); return; }
    const oldText = button.textContent;
    if (button) { button.disabled = true; button.textContent = tr('analyzingLibrary'); }
    toast(tr('analyzingLibrary'));
    try {
      if (activeLibraryFolderPath && window.foxsmusic?.scanAudioFolderPath) {
        try {
          const folderResult = await window.foxsmusic.scanAudioFolderPath(activeLibraryFolderPath);
          if (folderResult?.records) {
            activeLibraryFolderPath = folderResult.folderPath || activeLibraryFolderPath;
            activeFolderTrackPaths = new Set(folderResult.records.map(record => normalizeFilePath(record.path)).filter(Boolean));
            persistSettings();
            updateFolderSourceUI();
            const syncResult = await syncFolderRecords(folderResult.records);
            if (syncResult.added) toast(`${syncResult.added} ${currentLocale === 'en' ? 'new tracks added from the selected folder' : currentLocale === 'de' ? 'neue Titel aus dem ausgewählten Ordner hinzugefügt' : 'новых треков добавлено из выбранной папки'}.`, 'success');
          }
        } catch (folderError) {
          console.warn('FoxsMusic audit folder rescan failed', folderError);
        }
      }
      const requestItems = tracks.map(track => ({ id: track.id, path: track.audioPath || null, blobSize: !track.audioPath ? Number(track.audioBlob?.size) || 0 : 0 }));
      const result = await window.foxsmusic.analyzeLibraryFiles(requestItems);
      const fileResults = new Map((result?.results || []).map(item => [item.id, item]));
      const candidateSizes = new Set((result?.candidateSizes || []).map(Number));
      const hashById = new Map();
      const sizeCounts = new Map();
      for (const track of tracks) {
        if (track.audioPath) {
          const fileResult = fileResults.get(track.id);
          track.sourceUnavailable = !fileResult?.exists;
          if (fileResult?.exists && fileResult.size > 0) sizeCounts.set(fileResult.size, (sizeCounts.get(fileResult.size) || 0) + 1);
          if (fileResult?.hash) hashById.set(track.id, fileResult.hash);
        } else if (track.audioBlob?.size > 0) {
          track.sourceUnavailable = false;
          sizeCounts.set(track.audioBlob.size, (sizeCounts.get(track.audioBlob.size) || 0) + 1);
        } else {
          track.sourceUnavailable = true;
        }
      }
      let blobsSkipped = 0;
      // Hash only old blob-backed entries whose size is shared by another entry.
      for (const track of tracks) {
        if (track.audioPath || !track.audioBlob?.size || !candidateSizes.has(track.audioBlob.size)) continue;
        if (track.audioBlob.size > MAX_BLOB_FINGERPRINT_BYTES || !window.crypto?.subtle) { blobsSkipped++; continue; }
        try { const hash = await sha256StoredBlob(track.audioBlob); if (hash) hashById.set(track.id, hash); else blobsSkipped++; }
        catch (error) { blobsSkipped++; console.debug('FoxsMusic: legacy blob fingerprint skipped', error?.message || error); }
      }
      const duplicateGroups = buildDuplicateGroups(hashById);
      const missingTracks = tracks.filter(track => track.sourceUnavailable);
      // Mark unavailable files in the mounted rows without remounting the whole library.
      for (const track of tracks) {
        const row = $(`.track-row[data-track-id="${CSS.escape(track.id)}"]`);
        if (!row) continue;
        row.classList.toggle('is-unavailable', !!track.sourceUnavailable);
        const artist = $('.row-artist', row);
        if (artist) {
          const missingSuffix = ` · ${tr('missingFile')}`;
          const clean = artist.textContent.endsWith(missingSuffix) ? artist.textContent.slice(0, -missingSuffix.length) : artist.textContent;
          artist.textContent = track.sourceUnavailable ? `${clean} · ${tr('missingFile')}` : clean;
        }
      }
      lastLibraryAudit = { duplicateGroups, missingTracks, blobsSkipped, checkedAt: Date.now() };
      openLibraryAuditReport(lastLibraryAudit);
    } catch (error) {
      console.error('FoxsMusic library audit failed', error);
      toast(tr('auditFailed'), 'error');
    } finally {
      if (button) { button.disabled = false; button.textContent = oldText || tr('analyzeLibrary'); }
    }
  }
  async function analyzeSourceFolderDuplicates() {
    const button = $('#scanSourceDuplicatesBtn');
    const sourcePaths = getConfiguredSourcePaths();
    if (!sourcePaths.length) {
      toast(currentLocale === 'en' ? 'Add at least one source folder first.' : currentLocale === 'de' ? 'Füge zuerst mindestens einen Quellordner hinzu.' : 'Сначала добавь хотя бы одну папку-источник.', 'error');
      return;
    }
    if (!window.foxsmusic?.analyzeSourceFoldersDuplicates) {
      toast('Этот механизм недоступен в текущей сборке. Пересобери проект из обновлённого архива.', 'error'); return;
    }
    const previousText = button?.textContent;
    if (button) { button.disabled = true; button.textContent = currentLocale === 'en' ? 'Scanning…' : currentLocale === 'de' ? 'Prüfe…' : 'Сканирую…'; }
    try {
      const report = await window.foxsmusic.analyzeSourceFoldersDuplicates({ rootPaths: sourcePaths, preferredRootPath: activeLibraryFolderPath });
      openSourceFolderDuplicateReport(report);
    } catch (error) {
      console.error('FoxsMusic source duplicate scan failed', error);
      toast(currentLocale === 'en' ? 'Could not scan the source folders.' : currentLocale === 'de' ? 'Die Quellordner konnten nicht geprüft werden.' : 'Не удалось проверить папки-источники.', 'error');
    } finally { if (button) { button.disabled = false; button.textContent = previousText || tr('scanAllSourceDuplicates'); } }
  }
  function openSourceFolderDuplicateReport(report) {
    const groups = Array.isArray(report?.groups) ? report.groups : [];
    const duplicates = Number(report?.duplicateCount) || 0;
    const roots = Array.isArray(report?.rootPaths) ? report.rootPaths : (report?.rootPath ? [report.rootPath] : []);
    const groupMarkup = groups.length ? groups.slice(0, 30).map((group, index) => `
      <div class="library-audit-item source-duplicate-group"><strong>${index + 1}. ${escapeHTML(group.files?.[0]?.name || group.keepPath)} · ${group.files?.length || 0} ${currentLocale === 'en' ? 'copies' : currentLocale === 'de' ? 'Kopien' : 'копии'}</strong>
      <small>${currentLocale === 'en' ? 'Keep:' : currentLocale === 'de' ? 'Behalten:' : 'Оставить:'} ${escapeHTML(group.keepPath)}
${currentLocale === 'en' ? 'Move to Recycle Bin:' : currentLocale === 'de' ? 'In Papierkorb verschieben:' : 'Переместить в корзину:'}
${(group.duplicatePaths || []).slice(0, 5).map(escapeHTML).join('\n')}${(group.duplicatePaths || []).length > 5 ? '\n…' : ''}</small></div>`).join('') : `<p>${currentLocale === 'en' ? 'No byte-identical audio duplicates were found in the configured source folders.' : currentLocale === 'de' ? 'Keine inhaltsgleichen Audioduplikate in den Quellordnern gefunden.' : 'Точных дубликатов аудиофайлов в папках-источниках не найдено.'}</p>`;
    const capNotice = report?.capped ? `<p class="library-audit-warning">${currentLocale === 'en' ? 'The scan reached the safety limit of 10,000 audio files. Scan smaller folders for a complete result.' : currentLocale === 'de' ? 'Der Scan erreichte das Limit von 10.000 Audiodateien. Prüfe kleinere Ordner separat.' : 'Сканирование достигло лимита 10 000 аудиофайлов. Для полного результата проверь меньшие папки отдельно.'}</p>` : '';
    const unavailable = Array.isArray(report?.unavailableRoots) ? report.unavailableRoots : [];
    const unavailableMarkup = unavailable.length ? `<p class="library-audit-warning">${currentLocale === 'en' ? 'Unavailable source folders (skipped):' : currentLocale === 'de' ? 'Nicht verfügbare Quellordner (übersprungen):' : 'Недоступные папки-источники (пропущены):'}<br>${unavailable.map(escapeHTML).join('<br>')}</p>` : '';
    const wording = currentLocale === 'en' ? `${duplicates} duplicate file(s) found in ${report.filesChecked} scanned files across ${roots.length} source folder(s).` : currentLocale === 'de' ? `${duplicates} doppelte Datei(en) unter ${report.filesChecked} geprüften Dateien in ${roots.length} Quellordner(n) gefunden.` : `Найдено лишних файлов: ${duplicates}. Проверено: ${report.filesChecked}. Папок-источников: ${roots.length}.`;
    openModal(`<h2>${currentLocale === 'en' ? 'Duplicates in source folders' : currentLocale === 'de' ? 'Duplikate in Quellordnern' : 'Дубликаты в папках-источниках'}</h2>
      <p>${roots.map(escapeHTML).join('<br>')}</p><div class="library-audit-summary">${escapeHTML(wording)}</div>
      <p class="library-audit-warning">${currentLocale === 'en' ? 'After confirmation, extra byte-identical files across all configured sources will be moved to the system Recycle Bin/Trash. Exactly one copy per content group will remain. Files are not permanently deleted.' : currentLocale === 'de' ? 'Nach Bestätigung werden zusätzliche inhaltsgleiche Dateien aus allen konfigurierten Quellen in den Papierkorb verschoben. Pro Inhaltsgruppe bleibt eine Kopie erhalten. Dateien werden nicht endgültig gelöscht.' : 'После подтверждения лишние побайтно одинаковые файлы из всех источников будут перемещены в системную корзину. В каждой группе останется один экземпляр. Файлы не удаляются безвозвратно.'}</p>
      ${unavailableMarkup}<div class="library-audit-list">${groupMarkup}</div>${capNotice}
      <div class="library-audit-actions">${duplicates ? `<button type="button" class="modal-submit" id="trashSourceDuplicatesBtn">${currentLocale === 'en' ? 'Move duplicates to Recycle Bin' : currentLocale === 'de' ? 'Duplikate in Papierkorb verschieben' : 'Переместить дубликаты в корзину'} (${duplicates})</button>` : ''}<button type="button" class="modal-cancel" data-close-modal>${escapeHTML(tr('close'))}</button></div>`);
    const action = $('#trashSourceDuplicatesBtn', ui.modalRoot);
    if (action) action.addEventListener('click', () => confirmTrashSourceDuplicates(report));
  }
  function confirmTrashSourceDuplicates(report) {
    const duplicateCount = Number(report?.duplicateCount) || 0;
    const sourcePaths = Array.isArray(report?.rootPaths) ? report.rootPaths : getConfiguredSourcePaths();
    if (!duplicateCount || !sourcePaths.length) { closeModal(); return; }
    openModal(`<h2>${currentLocale === 'en' ? 'Move duplicate files to Recycle Bin?' : currentLocale === 'de' ? 'Duplikate in den Papierkorb verschieben?' : 'Переместить дубликаты в корзину?'}</h2>
      <p>${currentLocale === 'en' ? `FoxsMusic will move ${duplicateCount} actual audio file(s) from ${sourcePaths.length} configured source folder(s) to the operating system Recycle Bin/Trash. It will keep one file per exact-content group and remove library entries for moved copies. This changes real files on disk, but they remain recoverable from the Recycle Bin.` : currentLocale === 'de' ? `FoxsMusic verschiebt ${duplicateCount} echte Audiodatei(en) aus ${sourcePaths.length} konfigurierten Quellordner(n) in den Papierkorb. Pro identischem Inhalt bleibt eine Datei erhalten. Bibliothekseinträge für verschobene Kopien werden entfernt. Dateien bleiben über den Papierkorb wiederherstellbar.` : `FoxsMusic переместит ${duplicateCount} настоящих аудиофайлов из ${sourcePaths.length} настроенных папок-источников в системную корзину. В каждой группе точных копий останется один файл, записи перемещённых копий будут убраны из библиотеки. Файлы можно восстановить из корзины.`}</p>
      <div class="library-audit-summary">${escapeHTML(sourcePaths.join('\n'))}</div>
      <div class="modal-actions"><button class="modal-cancel" data-close-modal>${escapeHTML(tr('close'))}</button><button class="modal-submit" id="confirmTrashSourceDuplicates">${currentLocale === 'en' ? 'Move files to Recycle Bin' : currentLocale === 'de' ? 'Dateien verschieben' : 'Переместить файлы'}</button></div>`);
    $('#confirmTrashSourceDuplicates', ui.modalRoot).addEventListener('click', async () => {
      const button = $('#confirmTrashSourceDuplicates', ui.modalRoot); button.disabled = true;
      try {
        const result = await window.foxsmusic.trashSourceDuplicates({
          rootPaths: sourcePaths,
          preferredRootPath: activeLibraryFolderPath,
          groups: (report.groups || []).map(group => ({ hash: group.hash, keepPath: group.keepPath, duplicatePaths: group.duplicatePaths }))
        });
        const removedKeys = new Set((result.trashedPaths || []).map(normalizeFilePath));
        const removedIds = [];
        let currentWasRemoved = false;
        for (const track of tracks) {
          if (track.audioPath && removedKeys.has(normalizeFilePath(track.audioPath))) {
            removedIds.push(track.id); if (track.id === currentTrackId) currentWasRemoved = true;
          }
        }
        if (currentWasRemoved) { ui.audio.pause(); ui.audio.removeAttribute('src'); ui.audio.load(); currentTrackId = null; }
        if (removedIds.length) await deleteStoredTracks(removedIds);
        const removedSet = new Set(removedIds);
        tracks = tracks.filter(track => !removedSet.has(track.id));
        playbackQueueIds = playbackQueueIds.filter(id => !removedSet.has(id));
        playbackHistory = playbackHistory.filter(item => !removedSet.has(item.id));
        persistSettings();
        if (activeFolderTrackPaths instanceof Set) for (const key of removedKeys) activeFolderTrackPaths.delete(key);
        // Also collapse accidental duplicate records pointing at the same kept path.
        const byPath = new Map(); const idsForSamePath = [];
        for (const track of tracks) {
          if (!track.audioPath) continue;
          const key = normalizeFilePath(track.audioPath);
          const keeper = byPath.get(key);
          if (!keeper) { byPath.set(key, track); continue; }
          keeper.favorite = keeper.favorite || track.favorite;
          keeper.playlists = [...new Set([...(keeper.playlists || []), ...(track.playlists || [])])];
          if (!keeper.coverBlob && track.coverBlob) { keeper.coverBlob = track.coverBlob; keeper.coverUrl = track.coverUrl; }
          await saveTrack(keeper); idsForSamePath.push(track.id);
          if (track.id === currentTrackId) currentTrackId = keeper.id;
        }
        if (idsForSamePath.length) { await deleteStoredTracks(idsForSamePath); const samePathSet = new Set(idsForSamePath); tracks = tracks.filter(track => !samePathSet.has(track.id)); }
        playbackQueueIds = playbackQueueIds.filter(id => !removedSet.has(id) && !new Set(idsForSamePath).has(id));
        playbackHistory = playbackHistory.filter(item => !removedSet.has(item.id) && !new Set(idsForSamePath).has(item.id));
        persistSettings();
        closeModal(); renderAll();
        const failed = result.failed?.length || 0;
        toast(currentLocale === 'en' ? `Moved ${result.trashedPaths?.length || 0} duplicate file(s) to Recycle Bin${failed ? `; ${failed} failed` : ''}.` : currentLocale === 'de' ? `${result.trashedPaths?.length || 0} Duplikatdatei(en) in den Papierkorb verschoben${failed ? `; ${failed} fehlgeschlagen` : ''}.` : `В корзину перемещено файлов: ${result.trashedPaths?.length || 0}${failed ? `; не удалось переместить: ${failed}` : ''}.`, failed ? '' : 'success');
        if (activeLibraryFolderPath) await refreshSelectedLibraryFolder({ notify: false });
      } catch (error) {
        console.error('FoxsMusic duplicate file deletion failed', error);
        closeModal(); toast(currentLocale === 'en' ? 'Could not safely remove source duplicates.' : currentLocale === 'de' ? 'Quellordner-Duplikate konnten nicht sicher entfernt werden.' : 'Не удалось безопасно удалить дубликаты папки-источника.', 'error');
      }
    });
  }

  function confirmRemoveDuplicateEntries(groups) {
    const extras = groups.reduce((sum, group) => sum + group.length - 1, 0);
    if (!extras) { closeModal(); return; }
    const sourcePaths = getConfiguredSourcePaths();
    const canCleanSourceFiles = sourcePaths.length > 0
      && typeof window.foxsmusic?.analyzeSourceFoldersDuplicates === 'function'
      && typeof window.foxsmusic?.trashSourceDuplicates === 'function';
    const sourceOption = `<label class="dedup-source-option${canCleanSourceFiles ? '' : ' is-disabled'}" for="deleteSourceDuplicateFiles">
      <input type="checkbox" id="deleteSourceDuplicateFiles" ${canCleanSourceFiles ? '' : 'disabled'}>
      <span><strong>${currentLocale === 'en' ? 'Also remove duplicate files from source folders on disk' : currentLocale === 'de' ? 'Duplikatdateien auch aus Quellordnern auf dem Datenträger entfernen' : 'Также удалить файлы-дубликаты из папок-источников на диске'}</strong>
      <small>${currentLocale === 'en' ? 'Extra byte-identical files are moved to the system Recycle Bin. One copy stays. This is off by default.' : currentLocale === 'de' ? 'Zusätzliche identische Dateien werden in den Papierkorb verschoben. Eine Kopie bleibt erhalten. Standardmäßig deaktiviert.' : 'Лишние побайтно одинаковые файлы будут перемещены в системную корзину. Одна копия останется. По умолчанию выключено.'}</small></span>
    </label>${canCleanSourceFiles ? '' : `<small class="dedup-source-unavailable">${currentLocale === 'en' ? 'Add at least one source folder in Smart Library to enable disk cleanup.' : currentLocale === 'de' ? 'Füge mindestens einen Quellordner in der Smart-Bibliothek hinzu.' : 'Добавь хотя бы одну папку-источник в умной библиотеке, чтобы включить очистку диска.'}</small>`}`;
    const modalIntro = currentLocale === 'en'
      ? 'By default, only duplicate entries inside FoxsMusic are removed. Enable the option below if you also want exact duplicate files moved from source folders into the system Recycle Bin.'
      : currentLocale === 'de'
        ? 'Standardmäßig werden nur doppelte Einträge in FoxsMusic entfernt. Aktiviere die Option unten, um identische Dateien aus Quellordnern zusätzlich in den Papierkorb zu verschieben.'
        : 'По умолчанию удаляются только повторные записи в FoxsMusic. Отметь пункт ниже, если нужно также переместить точные копии аудиофайлов из папок-источников в системную корзину.';
    openModal(`<h2>${escapeHTML(tr('auditConfirmTitle'))}</h2><p>${escapeHTML(modalIntro)}</p>
      <div class="library-audit-summary">${extras} ${currentLocale === 'en' ? 'duplicate entries will be removed' : currentLocale === 'de' ? 'doppelte Einträge werden entfernt' : 'лишних записей будет удалено'}.</div>
      ${sourceOption}
      <div class="modal-actions"><button class="modal-cancel" data-close-modal>${escapeHTML(tr('close'))}</button><button class="modal-submit" id="confirmRemoveDuplicateEntries">${escapeHTML(tr('auditRemoveDuplicates'))}</button></div>`);
    $('#confirmRemoveDuplicateEntries', ui.modalRoot).addEventListener('click', async () => {
      const button = $('#confirmRemoveDuplicateEntries', ui.modalRoot);
      const alsoCleanDisk = !!$('#deleteSourceDuplicateFiles', ui.modalRoot)?.checked;
      button.disabled = true;
      if (alsoCleanDisk) {
        button.textContent = currentLocale === 'en' ? 'Scanning source folders…' : currentLocale === 'de' ? 'Quellordner werden geprüft…' : 'Проверяю папки-источники…';
        await scanAndConfirmSourceDuplicateRemoval(groups, sourcePaths);
      } else {
        await removeDuplicateLibraryEntries(groups, null);
      }
    });
  }

  async function scanAndConfirmSourceDuplicateRemoval(libraryDuplicateGroups, sourcePaths) {
    try {
      // Prefer the currently playing file as the keeper when it is part of a duplicate group.
      const currentTrack = getCurrentTrack();
      const preferredPath = currentTrack?.audioPath || activeLibraryFolderPath || null;
      const report = await window.foxsmusic.analyzeSourceFoldersDuplicates({ rootPaths: sourcePaths, preferredRootPath: preferredPath });
      const duplicates = Number(report?.duplicateCount) || 0;
      if (!duplicates) {
        toast(currentLocale === 'en' ? 'No exact duplicate files were found in source folders; removing only duplicate library entries.' : currentLocale === 'de' ? 'Keine identischen Dateien in Quellordnern gefunden; es werden nur Bibliothekseinträge bereinigt.' : 'В папках-источниках точные дубликаты файлов не найдены; удаляю только повторные записи библиотеки.');
        await removeDuplicateLibraryEntries(libraryDuplicateGroups, null);
        return;
      }
      const roots = Array.isArray(report.rootPaths) ? report.rootPaths : sourcePaths;
      const sample = (report.groups || []).slice(0, 12).map((group, index) => `<div class="library-audit-item"><strong>${index + 1}. ${escapeHTML(group.files?.[0]?.name || group.keepPath)}</strong><small>${currentLocale === 'en' ? 'Keep: ' : currentLocale === 'de' ? 'Behalten: ' : 'Оставить: '}${escapeHTML(group.keepPath)}\n${(group.duplicatePaths || []).slice(0, 3).map(escapeHTML).join('\n')}${(group.duplicatePaths || []).length > 3 ? '\n…' : ''}</small></div>`).join('');
      openModal(`<h2>${currentLocale === 'en' ? 'Also remove duplicate files from disk?' : currentLocale === 'de' ? 'Duplikatdateien auch vom Datenträger entfernen?' : 'Также удалить дубликаты файлов с диска?'}</h2>
        <p>${currentLocale === 'en' ? `${duplicates} byte-identical audio file(s) were found across the configured source folders. If you continue, extra copies will be moved to the system Recycle Bin/Trash; one copy per group will remain. This affects real files on disk, but they remain recoverable from the Recycle Bin.` : currentLocale === 'de' ? `${duplicates} identische Audiodatei(en) wurden in den konfigurierten Quellordnern gefunden. Zusätzliche Kopien werden in den Papierkorb verschoben; eine Kopie pro Gruppe bleibt erhalten. Die Dateien können aus dem Papierkorb wiederhergestellt werden.` : `В папках-источниках найдено точных дубликатов файлов: ${duplicates}. При продолжении лишние копии будут перемещены в системную корзину, в каждой группе останется один файл. Это изменяет файлы на диске, но их можно восстановить из корзины.`}</p>
        <div class="library-audit-summary">${escapeHTML(roots.join('\n'))}</div>
        <div class="library-audit-list">${sample}</div>
        ${(report.groups || []).length > 12 ? `<small class="dedup-source-unavailable">${currentLocale === 'en' ? `Showing 12 of ${report.groups.length} groups.` : currentLocale === 'de' ? `12 von ${report.groups.length} Gruppen werden angezeigt.` : `Показано 12 из ${report.groups.length} групп.`}</small>` : ''}
        <p class="library-audit-warning">${currentLocale === 'en' ? 'This cannot be undone from FoxsMusic. You can restore files from the OS Recycle Bin. Files that change after the scan will be skipped.' : currentLocale === 'de' ? 'Dieser Vorgang kann in FoxsMusic nicht rückgängig gemacht werden. Dateien können aus dem Papierkorb wiederhergestellt werden. Nach dem Scan geänderte Dateien werden übersprungen.' : 'FoxsMusic не может отменить это действие. Файлы можно восстановить из системной корзины. Файлы, изменившиеся после проверки, будут пропущены.'}</p>
        <div class="modal-actions"><button class="modal-cancel" data-close-modal>${currentLocale === 'en' ? 'Cancel all' : currentLocale === 'de' ? 'Alles abbrechen' : 'Отменить всё'}</button><button class="modal-submit" id="confirmTrashSourceBeforeLibraryDuplicates">${currentLocale === 'en' ? 'Move files to Recycle Bin and continue' : currentLocale === 'de' ? 'Dateien verschieben und fortfahren' : 'Переместить файлы и продолжить'}</button></div>`);
      $('#confirmTrashSourceBeforeLibraryDuplicates', ui.modalRoot).addEventListener('click', async () => {
        const button = $('#confirmTrashSourceBeforeLibraryDuplicates', ui.modalRoot);
        button.disabled = true;
        button.textContent = currentLocale === 'en' ? 'Moving files…' : currentLocale === 'de' ? 'Dateien werden verschoben…' : 'Перемещаю файлы…';
        try {
          const result = await window.foxsmusic.trashSourceDuplicates({
            rootPaths: roots,
            preferredRootPath: preferredPath,
            groups: (report.groups || []).map(group => ({ hash: group.hash, keepPath: group.keepPath, duplicatePaths: group.duplicatePaths }))
          });
          const movedKeys = new Set((result.trashedPaths || []).map(normalizeFilePath));
          const pathToKeeper = new Map();
          for (const group of report.groups || []) {
            for (const duplicatePath of group.duplicatePaths || []) {
              const key = normalizeFilePath(duplicatePath);
              if (movedKeys.has(key)) pathToKeeper.set(key, group.keepPath);
            }
          }
          // Any library record that referenced a moved file is rebound to the surviving identical original.
          for (const track of tracks) {
            if (!track.audioPath) continue;
            const keeperPath = pathToKeeper.get(normalizeFilePath(track.audioPath));
            if (!keeperPath) continue;
            track.audioPath = keeperPath;
            track.fileName = keeperPath.split(/[\\/]/).pop() || track.fileName;
            try {
              track.audioUrl = await window.foxsmusic.getPlaybackUrl(keeperPath);
              track.sourceUnavailable = false;
            } catch (_) {
              track.audioUrl = null;
              track.sourceUnavailable = true;
            }
            const saved = await saveTrack(track);
            if (!saved) throw new Error('Could not persist the surviving source path for a duplicate track.');
          }
          await removeDuplicateLibraryEntries(libraryDuplicateGroups, {
            trashedCount: (result.trashedPaths || []).length,
            failedCount: (result.failed || []).length
          });
        } catch (error) {
          console.error('FoxsMusic combined duplicate cleanup failed', error);
          closeModal();
          toast(currentLocale === 'en' ? 'Source files could not be safely cleaned; duplicate library entries were not removed.' : currentLocale === 'de' ? 'Quellordner konnten nicht sicher bereinigt werden; Bibliothekseinträge wurden nicht entfernt.' : 'Не удалось безопасно очистить файлы-источники; повторные записи библиотеки не удалены.', 'error');
        }
      });
    } catch (error) {
      console.error('FoxsMusic source duplicate pre-scan failed', error);
      closeModal();
      toast(currentLocale === 'en' ? 'Could not scan source folders. No duplicate records were removed.' : currentLocale === 'de' ? 'Quellordner konnten nicht geprüft werden. Es wurden keine doppelten Einträge entfernt.' : 'Не удалось проверить папки-источники. Повторные записи не удалены.', 'error');
    }
  }

  async function removeDuplicateLibraryEntries(groups, sourceCleanupResult = null) {
    try {
      const idsToRemove = [];
      const toRevoke = [];
      const currentId = currentTrackId;
      const keeperByRemovedId = new Map();
      const keepers = [];
      for (const group of groups) {
        const ordered = group.slice().sort((a, b) => {
          const score = track => (track.id === currentId ? 1000 : 0) + (!track.sourceUnavailable && track.audioPath ? 100 : track.audioPath ? 50 : track.audioBlob ? 10 : 0) + (track.coverBlob ? 8 : 0) + (track.favorite ? 4 : 0) + (track.playlists?.length || 0);
          return score(b) - score(a) || (b.addedAt || 0) - (a.addedAt || 0);
        });
        const keeper = ordered[0];
        keeper.favorite = group.some(track => track.favorite);
        keeper.playlists = [...new Set(group.flatMap(track => Array.isArray(track.playlists) ? track.playlists : []))];
        if (!keeper.coverBlob) {
          const artworkSource = group.find(track => track.coverBlob);
          if (artworkSource) { keeper.coverBlob = artworkSource.coverBlob; keeper.coverUrl = artworkSource.coverUrl; }
        }
        for (const duplicate of group) {
          if (duplicate.id === keeper.id) continue;
          idsToRemove.push(duplicate.id);
          keeperByRemovedId.set(duplicate.id, keeper.id);
          if (duplicate.audioUrl?.startsWith('blob:') && duplicate.audioUrl !== keeper.audioUrl) toRevoke.push(duplicate.audioUrl);
          if (duplicate.coverUrl?.startsWith('blob:') && duplicate.coverUrl !== keeper.coverUrl) toRevoke.push(duplicate.coverUrl);
        }
        keepers.push(keeper);
      }
      for (const keeper of keepers) {
        const saved = await saveTrack(keeper);
        if (!saved) throw new Error('Could not save merged metadata; duplicate deletion aborted to protect the library.');
      }
      await deleteStoredTracks(idsToRemove);
      if (keeperByRemovedId.has(currentTrackId)) currentTrackId = keeperByRemovedId.get(currentTrackId);
      const removedSet = new Set(idsToRemove);
      tracks = tracks.filter(track => !removedSet.has(track.id));
      toRevoke.forEach(url => { try { URL.revokeObjectURL(url); } catch (_) {} });
      closeModal();
      renderAll();
      if (sourceCleanupResult) {
        const moved = Number(sourceCleanupResult.trashedCount) || 0;
        const failed = Number(sourceCleanupResult.failedCount) || 0;
        const message = currentLocale === 'en'
          ? `Removed ${idsToRemove.length} duplicate library entr${idsToRemove.length === 1 ? 'y' : 'ies'}; moved ${moved} source file(s) to Recycle Bin${failed ? `; ${failed} file(s) skipped/failed` : ''}.`
          : currentLocale === 'de'
            ? `${idsToRemove.length} doppelte Bibliothekseinträge entfernt; ${moved} Quelldatei(en) in den Papierkorb verschoben${failed ? `; ${failed} fehlgeschlagen/übersprungen` : ''}.`
            : `Удалено повторных записей: ${idsToRemove.length}; файлов-оригиналов перемещено в корзину: ${moved}${failed ? `; не удалось переместить: ${failed}` : ''}.`;
        toast(message, failed ? '' : 'success');
      } else {
        toast(tr('auditRemoved'), 'success');
      }
    } catch (error) {
      console.error('FoxsMusic duplicate cleanup failed', error);
      closeModal();
      toast(tr('auditFailed'), 'error');
    }
  }

  async function exportLibraryBackup() {
    const button = $('#exportBackupBtn'); if (button?.disabled) return;
    if (button) { button.disabled = true; button.textContent = 'Создаю…'; }
    try {
      const backup = {
        format: 'foxsmusic-backup', schemaVersion: 1, createdAt: new Date().toISOString(),
        source: 'FoxsMusic Desktop', settings: { ...loadSettings(), ...audioSettings, effectsEnabled, language: currentLocale, libraryFolderPath: activeLibraryFolderPath, librarySourcePaths: getConfiguredSourcePaths(), profileStyle: profileAppearance.style, profileMode: profileAppearance.mode, profileAccentColor: profileAppearance.accentColor, profileGradient: profileAppearance.gradient, shuffleEnabled, repeatMode, playbackQueueIds, queueExplicit, playbackHistory, customEqPresets },
        playlists, tracks: tracks.map(track => ({ id: track.id, title: track.title, artist: track.artist, album: track.album || '', genre: track.genre || '', year: track.year || '', fileName: track.fileName, addedAt: track.addedAt, duration: track.duration, playCount: Number.isSafeInteger(track.playCount) ? track.playCount : 0, lastPlayedAt: Number.isFinite(track.lastPlayedAt) ? track.lastPlayedAt : null, sourceDateAt: Number.isFinite(track.sourceDateAt) ? track.sourceDateAt : null, favorite: !!track.favorite, playlists: track.playlists || [], audioPath: track.audioPath || null, sourceUnavailable: !!track.sourceUnavailable, hasEmbeddedAudio: !!track.audioBlob && !track.audioPath, coverBase64: null }))
      };
      const content = JSON.stringify(backup, null, 2);
      const result = await window.foxsmusic?.saveBackup?.(content, currentLocale);
      if (!result || result.canceled) return;
      toast(currentLocale === 'en' ? 'Backup saved. Original audio files remain in their folders.' : currentLocale === 'de' ? 'Sicherung gespeichert. Originaldateien bleiben in ihren Ordnern.' : 'Резервная копия сохранена. Оригинальные аудиофайлы остались в своих папках.', 'success');
    } catch (error) { console.error(error); toast('Не удалось создать резервную копию.', 'error'); }
    finally { if (button) { button.disabled = false; button.textContent = 'Создать копию'; } }
  }
   function validateLibraryBackup(backup) {
     const invalid = message => ({ valid: false, message });
     const MAX_TRACKS = 10000;
     const MAX_PLAYLISTS = 1000;
     const MAX_PLAYLIST_MEMBERSHIPS = 1000;

     if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
       return invalid('Некорректная структура резервной копии.');
     }

     if (backup.format !== 'foxsmusic-backup' || backup.schemaVersion !== 1) {
       return invalid('Неподдерживаемый формат резервной копии.');
     }

     if (!Array.isArray(backup.tracks) || !Array.isArray(backup.playlists)) {
       return invalid('Отсутствует список треков или плейлистов.');
     }

     if (backup.tracks.length > MAX_TRACKS) {
       return invalid(`Слишком много треков: максимум ${MAX_TRACKS}.`);
     }

     if (backup.playlists.length > MAX_PLAYLISTS) {
       return invalid(`Слишком много плейлистов: максимум ${MAX_PLAYLISTS}.`);
     }

     if (
       backup.createdAt !== undefined &&
       (typeof backup.createdAt !== 'string' ||
         !Number.isFinite(Date.parse(backup.createdAt)))
     ) {
       return invalid('Некорректная дата создания резервной копии.');
     }

     if (
       backup.source !== undefined &&
       (typeof backup.source !== 'string' || backup.source.length > 128)
     ) {
       return invalid('Некорректный источник резервной копии.');
     }

     if (
       backup.settings !== undefined &&
       (!backup.settings ||
         typeof backup.settings !== 'object' ||
         Array.isArray(backup.settings))
     ) {
       return invalid('Настройки резервной копии повреждены.');
     }

     const playlistIds = new Set();

     for (const playlist of backup.playlists) {
       if (
         !playlist ||
         typeof playlist !== 'object' ||
         Array.isArray(playlist) ||
         typeof playlist.name !== 'string' ||
         !playlist.name.trim() ||
         playlist.name.length > 256
       ) {
         return invalid('Обнаружен повреждённый плейлист.');
       }

       if (
         playlist.id !== undefined &&
         playlist.id !== null &&
         (typeof playlist.id !== 'string' ||
           !playlist.id.trim() ||
           playlist.id.length > 160)
       ) {
         return invalid('Некорректный идентификатор плейлиста.');
       }

       if (typeof playlist.id === 'string') {
         if (playlistIds.has(playlist.id)) {
           return invalid('Обнаружены повторяющиеся ID плейлистов.');
         }
         playlistIds.add(playlist.id);
       }

       if (
         playlist.createdAt !== undefined &&
         playlist.createdAt !== null &&
         (!Number.isFinite(playlist.createdAt) || playlist.createdAt < 0)
       ) {
         return invalid('Некорректная дата создания плейлиста.');
       }
     }

     const trackIds = new Set();
     const stringLimits = {
       title: 1000,
       artist: 1000,
       album: 1000,
       genre: 1000,
       year: 64,
       fileName: 1024,
       audioPath: 32768
     };

     for (const track of backup.tracks) {
       if (
         !track ||
         typeof track !== 'object' ||
         Array.isArray(track) ||
         typeof track.title !== 'string' ||
         !track.title.trim() ||
         track.title.length > stringLimits.title
       ) {
         return invalid('Обнаружена повреждённая запись трека.');
       }

       if (
         track.id !== undefined &&
         track.id !== null &&
         (typeof track.id !== 'string' ||
           !track.id.trim() ||
           track.id.length > 160)
       ) {
         return invalid('Некорректный идентификатор трека.');
       }

       if (typeof track.id === 'string') {
         if (trackIds.has(track.id)) {
           return invalid('Обнаружены повторяющиеся ID треков.');
         }
         trackIds.add(track.id);
       }

       for (const [field, maxLength] of Object.entries(stringLimits)) {
         const value = track[field];
         if (
           value !== undefined &&
           value !== null &&
           (typeof value !== 'string' || value.length > maxLength)
         ) {
           return invalid(`Некорректное поле трека: ${field}.`);
         }
       }

       for (const field of ['addedAt', 'duration', 'lastPlayedAt', 'sourceDateAt']) {
         const value = track[field];
         if (
           value !== undefined &&
           value !== null &&
           (!Number.isFinite(value) || value < 0)
         ) {
           return invalid(`Некорректное поле трека: ${field}.`);
         }
       }

       if (track.playCount !== undefined && (!Number.isSafeInteger(track.playCount) || track.playCount < 0 || track.playCount > 1000000)) {
         return invalid('Некорректное число воспроизведений трека.');
       }

       for (const field of ['favorite', 'sourceUnavailable', 'hasEmbeddedAudio']) {
         if (
           track[field] !== undefined &&
           typeof track[field] !== 'boolean'
         ) {
           return invalid(`Некорректное поле трека: ${field}.`);
         }
       }

       if (
         track.playlists !== undefined &&
         (!Array.isArray(track.playlists) ||
           track.playlists.length > MAX_PLAYLIST_MEMBERSHIPS ||
           !track.playlists.every(
             id => typeof id === 'string' && id.length > 0 && id.length <= 160
           ))
       ) {
         return invalid('Повреждён список плейлистов трека.');
       }
     }

     return { valid: true, message: '' };
   }

 async function restoreLibraryBackup() {
  try {
    const selected = await window.foxsmusic?.loadBackup?.(currentLocale);
    if (!selected || selected.canceled) return;

    const backup = JSON.parse(selected.content);

    const validation = validateLibraryBackup(backup);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    openModal(`<h2>Восстановить резервную копию?</h2><p>Будут объединены ${backup.tracks.length} записей, плейлисты и настройки. Текущая библиотека не будет полностью очищена. Пути к оригинальным аудиофайлам должны быть доступны на этом компьютере.</p><div class="modal-actions"><button class="modal-cancel" data-close-modal>Отмена</button><button class="modal-submit" id="confirmRestoreBackup">Восстановить</button></div>`);
      $('#confirmRestoreBackup', ui.modalRoot).addEventListener('click', async () => {
        const button = $('#confirmRestoreBackup', ui.modalRoot); button.disabled = true; button.textContent = 'Восстанавливаю…';
        try {
          const playlistIdMap = new Map();
          for (const backupPlaylist of backup.playlists) {
            const existing = playlists.find(item => String(item.name).toLocaleLowerCase() === String(backupPlaylist.name).toLocaleLowerCase());
            if (existing) playlistIdMap.set(backupPlaylist.id, existing.id);
            else { const restoredPlaylist = { id: backupPlaylist.id || newId(), name: String(backupPlaylist.name || 'Восстановленный плейлист').slice(0, 80), createdAt: Number(backupPlaylist.createdAt) || Date.now() }; playlists.push(restoredPlaylist); playlistIdMap.set(backupPlaylist.id, restoredPlaylist.id); }
          }
          const existingPaths = new Map(tracks.filter(item => item.audioPath).map(item => [normalizeFilePath(item.audioPath), item]));
          let restored = 0, skippedEmbedded = 0;
          for (const raw of backup.tracks.slice(0, 10000)) {
            if (!raw || typeof raw.title !== 'string') continue;
            let target = raw.audioPath ? existingPaths.get(normalizeFilePath(raw.audioPath)) : null;
            if (!target && raw.id) target = getTrack(raw.id);
            if (!target && !raw.audioPath) { skippedEmbedded++; continue; }
            const isNew = !target;
            if (!target) target = { id: typeof raw.id === 'string' && !getTrack(raw.id) ? raw.id : newId(), audioPath: raw.audioPath || null, audioBlob: null, coverBlob: null, coverUrl: LOGO, audioUrl: null, artworkUrl: null, artworkChecked: false };
            target.title = String(raw.title || raw.fileName || 'Unknown track').slice(0, 240);
            target.artist = String(raw.artist || 'Неизвестный исполнитель').slice(0, 240);
            target.album = String(raw.album || '').slice(0, 240); target.genre = String(raw.genre || '').slice(0, 160); target.year = String(raw.year || '').slice(0, 4);
            target.fileName = String(raw.fileName || raw.title).slice(0, 260); target.addedAt = Number(raw.addedAt) || target.addedAt || Date.now(); target.duration = Number(raw.duration) || target.duration || 0;
            target.playCount = Math.max(Number.isSafeInteger(target.playCount) ? target.playCount : 0, Number.isSafeInteger(raw.playCount) ? Math.min(1000000, raw.playCount) : 0);
            target.lastPlayedAt = Math.max(Number.isFinite(target.lastPlayedAt) ? target.lastPlayedAt : 0, Number.isFinite(raw.lastPlayedAt) ? raw.lastPlayedAt : 0);
            target.sourceDateAt = Math.max(Number.isFinite(target.sourceDateAt) ? target.sourceDateAt : 0, Number.isFinite(raw.sourceDateAt) ? raw.sourceDateAt : Number.isFinite(raw.addedAt) ? raw.addedAt : 0);
            target.favorite = !!raw.favorite; target.playlists = [...new Set((raw.playlists || []).map(id => playlistIdMap.get(id) || id).filter(id => playlists.some(playlist => playlist.id === id)))];
            if (raw.audioPath && window.foxsmusic?.getPlaybackUrl) {
              target.audioPath = raw.audioPath;
              try { target.audioUrl = await window.foxsmusic.getPlaybackUrl(raw.audioPath); target.sourceUnavailable = false; }
              catch (_) { target.audioUrl = null; target.sourceUnavailable = true; }
              target.audioBlob = null;
            }
            const ok = await saveTrack(target); if (!ok) throw new Error('Could not save restored track.');
            if (isNew) tracks.push(await hydrateTrack(target));
            else Object.assign(target, await hydrateTrack(serializableTrack(target)));
            if (target.audioPath) existingPaths.set(normalizeFilePath(target.audioPath), target);
            restored++;
          }
          persistPlaylists();
          const mergedSettings = { ...loadSettings(), ...(backup.settings || {}) };
          try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings)); } catch (_) {}
          playbackQueueIds = Array.isArray(mergedSettings.playbackQueueIds) ? mergedSettings.playbackQueueIds : playbackQueueIds;
          shuffleOrderIds = Array.isArray(mergedSettings.shuffleOrderIds) ? mergedSettings.shuffleOrderIds.filter(id => typeof id === 'string').slice(0, 10000) : shuffleOrderIds;
          queueExplicit = mergedSettings.queueExplicit === true;
          playbackHistory = Array.isArray(mergedSettings.playbackHistory) ? mergedSettings.playbackHistory : playbackHistory;
          customEqPresets = mergedSettings.customEqPresets || customEqPresets;
          closeModal(); tracks.sort((a, b) => b.addedAt - a.addedAt); renderAll();
          toast(`Восстановлено записей: ${restored}${skippedEmbedded ? `; без оригинального пути пропущено: ${skippedEmbedded}` : ''}. Перезапусти плеер, чтобы применить все сохранённые настройки.`, 'success');
        } catch (error) { console.error(error); toast(`Не удалось восстановить копию: ${error.message || error}`, 'error'); button.disabled = false; button.textContent = 'Восстановить'; }
      });
    } catch (error) { console.error(error); toast(`Файл резервной копии не удалось прочитать: ${error.message || error}`, 'error'); }
  }
  function updateUpdaterStatus(payload) {
    const label = $('#updateStatusText'); if (!label) return;
    const download = $('#downloadUpdateBtn'), install = $('#installUpdateBtn');
    download.hidden = true; install.hidden = true;
    if (!payload) return;
    if (payload.status === 'available') { label.textContent = translateInlineSegments(`Доступна версия ${payload.version || ''}.`); download.hidden = false; }
    else if (payload.status === 'not-available') label.textContent = translateInlineSegments('Установлена последняя доступная версия.');
    else if (payload.status === 'progress') { label.textContent = translateInlineSegments(`Загрузка обновления: ${payload.percent || 0}%.`); download.hidden = true; }
    else if (payload.status === 'downloaded') { label.textContent = translateInlineSegments(`Версия ${payload.version || ''} готова к установке.`); install.hidden = false; }
    else if (payload.status === 'error') label.textContent = translateInlineSegments(`Ошибка обновления: ${String(payload.message || 'неизвестная ошибка').slice(0, 180)}`);
  }
  async function checkForUpdates() {
    const button = $('#checkUpdatesBtn'); if (button) { button.disabled = true; button.textContent = 'Проверяю…'; }
    try {
      const result = await window.foxsmusic?.checkUpdates?.();
      if (result?.ok && result.updateAvailable) updateUpdaterStatus({ status: 'available', version: result.version });
      else if (result?.ok) updateUpdaterStatus({ status: 'not-available', version: result.version });
      else if (result?.packaged === false) updateUpdaterStatus({ status: 'error', message: result.message });
      else updateUpdaterStatus({ status: 'error', message: result?.message || 'Не удалось проверить обновления.' });
    } catch (error) { updateUpdaterStatus({ status: 'error', message: error.message }); }
    finally { if (button) { button.disabled = false; button.textContent = 'Проверить обновления'; } }
  }
  function renderCustomEqPresets() {
    const container = $('#customPresetList'); if (!container) return;
    container.innerHTML = '';
    Object.entries(customEqPresets).slice(0, 12).forEach(([name, preset]) => {
      const item = document.createElement('div');
      item.className = 'custom-preset-item';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'studio-preset custom-studio-preset';
      button.textContent = name;
      button.title = translateInlineSegments(`Применить пресет «${name}»`);
      button.addEventListener('click', () => {
        Object.assign(audioSettings, preset);
        applyAudioSettings();
        toast(translateInlineSegments(`Пресет «${name}» применён`), 'success');
      });

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'custom-preset-delete';
      deleteButton.textContent = '×';
      deleteButton.title = translateInlineSegments(`Удалить пресет «${name}»`);
      deleteButton.setAttribute('aria-label', translateInlineSegments(`Удалить пресет «${name}»`));
      deleteButton.addEventListener('click', () => confirmDeleteCustomEqPreset(name));

      item.append(button, deleteButton);
      container.appendChild(item);
    });
  }

  function confirmDeleteCustomEqPreset(name) {
    if (!Object.prototype.hasOwnProperty.call(customEqPresets, name)) return;
    openModal(
      `<h2>Удалить пресет?</h2><p>Пресет «${escapeHTML(name)}» будет удалён. Это действие нельзя отменить.</p><div class="modal-actions"><button class="modal-cancel" data-close-modal>Отмена</button><button class="modal-submit danger-submit" id="confirmDeleteCustomEq">Удалить</button></div>`
    );
    $('#confirmDeleteCustomEq', ui.modalRoot).addEventListener('click', () => {
      if (!Object.prototype.hasOwnProperty.call(customEqPresets, name)) {
        closeModal();
        return;
      }
      delete customEqPresets[name];
      persistSettings();
      renderCustomEqPresets();
      closeModal();
      toast(translateInlineSegments(`Пресет «${name}» удалён`), 'success');
    });
  }
  function saveCustomEqPreset() {
    openModal(`<h2>Сохранить пресет эквалайзера</h2><p>Сохраняются басы, средние частоты, высокие частоты и усиление звука.</p><label class="metadata-field">Название пресета<input id="customEqPresetName" maxlength="28" placeholder="Например, My Bass"></label><div class="modal-actions"><button class="modal-cancel" data-close-modal>Отмена</button><button class="modal-submit" id="confirmSaveCustomEq">Сохранить</button></div>`, '#customEqPresetName');
    $('#confirmSaveCustomEq', ui.modalRoot).addEventListener('click', () => {
      const name = $('#customEqPresetName', ui.modalRoot).value.trim(); if (!name) { toast('Введи название пресета.'); return; }
      customEqPresets[name] = { bass: audioSettings.bass, mid: audioSettings.mid, treble: audioSettings.treble, gain: audioSettings.gain };
      const entries = Object.entries(customEqPresets); if (entries.length > 12) customEqPresets = Object.fromEntries(entries.slice(-12));
      persistSettings(); renderCustomEqPresets(); closeModal(); toast(translateInlineSegments(`Пресет «${name}» сохранён`), 'success');
    });
  }

  function confirmClearImportedTracks() {
    const count = tracks.length;
    if (!count) { toast(tr('clearImportedNothing')); return; }
    const message = tr('clearImportedConfirmMessage').replace('{count}', String(count));
    openModal(`<h2>${escapeHTML(tr('clearImportedConfirmTitle'))}</h2><p>${escapeHTML(message)}</p><div class="modal-actions"><button class="modal-cancel" data-close-modal>${escapeHTML(tr('close'))}</button><button class="modal-submit" id="confirmClearImportedTracks">${escapeHTML(tr('clearImportedConfirmButton'))}</button></div>`);
    $('#confirmClearImportedTracks', ui.modalRoot).addEventListener('click', async () => {
      const confirmButton = $('#confirmClearImportedTracks', ui.modalRoot);
      if (confirmButton) { confirmButton.disabled = true; confirmButton.textContent = currentLocale === 'en' ? 'Clearing…' : currentLocale === 'de' ? 'Wird geleert…' : 'Очищаю…'; }
      try {
        // Clear only FoxsMusic's metadata/database. Never delete original audio files from disk.
        ui.audio.pause();
        ui.audio.removeAttribute('src');
        ui.audio.load();
        await clearStoredTracks();
        for (const track of tracks) {
          if (track.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(track.audioUrl);
          if (track.coverUrl?.startsWith('blob:')) URL.revokeObjectURL(track.coverUrl);
        }
        tracks = [];
        playbackQueueIds = []; queueExplicit = false; playbackHistory = [];
        currentTrackId = null;
        // Clear the folder source too, otherwise the next start would re-import its contents.
        activeLibraryFolderPath = null;
        activeFolderTrackPaths = null;
        activeView = 'all';
        activePlaylistId = null;
        ui.search.value = '';
        $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'all'));
        persistSettings();
        updateFolderSourceUI();
        closeModal();
        renderAll();
        toast(tr('clearImportedDone'), 'success');
      } catch (error) {
        console.error('FoxsMusic clear library error', error);
        closeModal();
        renderAll();
        toast(tr('clearImportedFailed'), 'error');
      }
    });
  }

  async function removeTrack(id) {
    const track = getTrack(id);
    if (!track) return;
    const name = track.title;
    if (currentTrackId === id) {
      ui.audio.pause(); ui.audio.removeAttribute('src'); ui.audio.load(); currentTrackId = null;
    }
    try { await deleteStoredTrack(id); } catch (error) { console.warn(error); }
    if (track.audioUrl) URL.revokeObjectURL(track.audioUrl);
    if (track.coverUrl && track.coverUrl !== LOGO) URL.revokeObjectURL(track.coverUrl);
    tracks = tracks.filter(item => item.id !== id);
    playbackQueueIds = playbackQueueIds.filter(trackId => trackId !== id);
    playbackHistory = playbackHistory.filter(item => item.id !== id);
    persistSettings();
    renderAll();
    toast(`«${name}» удалён из библиотеки`, 'success');
  }
  async function openMetadataEditor(id) {
    const track = getTrack(id); if (!track) return;
    let embedded = null;
    if (track.audioPath && window.foxsmusic?.getTrackMetadata) {
      try { embedded = await window.foxsmusic.getTrackMetadata(track.audioPath); } catch (_) {}
    }
    openModal(`<h2>Сведения о треке</h2><p>Изменения сохраняются в FoxsMusic. Оригинальный аудиофайл и его теги на диске не изменяются.</p>
      <label class="metadata-field">Название<input id="metadataTitle" maxlength="240" value="${escapeHTML(track.title || embedded?.title || '')}"></label>
      <label class="metadata-field">Исполнитель<input id="metadataArtist" maxlength="240" value="${escapeHTML(track.artist || embedded?.artist || '')}"></label>
      <label class="metadata-field">Альбом<input id="metadataAlbum" maxlength="240" value="${escapeHTML(track.album || embedded?.album || '')}"></label>
      <div class="metadata-grid"><label class="metadata-field">Жанр<input id="metadataGenre" maxlength="160" value="${escapeHTML(track.genre || embedded?.genre || '')}"></label><label class="metadata-field">Год<input id="metadataYear" maxlength="4" inputmode="numeric" value="${escapeHTML(track.year || embedded?.year || '')}"></label></div>
      <div class="modal-actions"><button class="modal-cancel" data-close-modal>Отмена</button><button class="modal-submit" id="saveMetadataBtn">Сохранить сведения</button></div>`, '#metadataTitle');
    $('#saveMetadataBtn', ui.modalRoot).addEventListener('click', async () => {
      const saveButton = $('#saveMetadataBtn', ui.modalRoot); saveButton.disabled = true;
      try {
        const title = $('#metadataTitle', ui.modalRoot).value.trim();
        const artist = $('#metadataArtist', ui.modalRoot).value.trim();
        const album = $('#metadataAlbum', ui.modalRoot).value.trim();
        const genre = $('#metadataGenre', ui.modalRoot).value.trim();
        const year = $('#metadataYear', ui.modalRoot).value.trim();
        if (!title) { toast('Название трека не может быть пустым.', 'error'); saveButton.disabled = false; return; }
        track.title = title; track.artist = artist || 'Неизвестный исполнитель'; track.album = album; track.genre = genre; track.year = /^\d{4}$/.test(year) ? year : '';
        if (!await saveTrack(track)) throw new Error('save-failed');
        closeModal(); renderAll();
        toast('Сведения о треке сохранены в FoxsMusic', 'success');
      } catch (error) { console.error(error); toast('Не удалось сохранить сведения о треке.', 'error'); saveButton.disabled = false; }
    });
  }

  function openTrackMenu(id) {
    const track = getTrack(id); if (!track) return;
    const locationBlock = track.audioPath
      ? `<div class="track-path-panel"><span>${tr('originalPath')}</span><code title="${escapeHTML(track.audioPath)}">${escapeHTML(track.audioPath)}</code></div>
         <button class="playlist-choice" data-menu-action="reveal">${svgIcon('folder')}<span>${tr('openInFolder')}</span><span>↗</span></button>
         <button class="playlist-choice" data-menu-action="locate">${svgIcon('folder')}<span>${tr('locateOriginal')}</span><span>↻</span></button>`
      : `<div class="track-path-panel is-missing"><span>${tr('originalPath')}</span><p>${tr('originalPathNotSaved')}</p></div>
         <button class="playlist-choice" data-menu-action="locate">${svgIcon('folder')}<span>${tr('locateOriginal')}</span><span>↗</span></button>`;
    openModal(`<div class="modal-head"><h2>${escapeHTML(track.title)}</h2><p>${escapeHTML(track.artist)}</p></div>
      ${locationBlock}
      <button class="playlist-choice" data-menu-action="favorite">${svgIcon('heart')}<span>${track.favorite ? tr('favoriteRemove') : tr('favoriteAdd')}</span><span>♥</span></button>
      <button class="playlist-choice" data-menu-action="queue">${svgIcon('queue')}<span>Добавить в очередь</span><span>＋</span></button>
      <button class="playlist-choice" data-menu-action="metadata">${svgIcon('sliders')}<span>Редактировать сведения</span><span>✎</span></button>
      <button class="playlist-choice" data-menu-action="playlist">${svgIcon('playlist')}<span>Добавить в плейлист</span><span>＋</span></button>
      <button class="playlist-choice" data-menu-action="cover">${svgIcon('image')}<span>Изменить обложку</span><span>▧</span></button>
      <button class="playlist-choice" data-menu-action="remove">${svgIcon('trash')}<span>Удалить из библиотеки</span><span>⌫</span></button>
      <div class="modal-actions" style="margin-top:17px"><button class="modal-cancel" data-close-modal>Закрыть</button></div>`);
    $('[data-menu-action="favorite"]', ui.modalRoot).addEventListener('click', () => { closeModal(); toggleFavorite(id); });
    $('[data-menu-action="queue"]', ui.modalRoot).addEventListener('click', () => { const queue = playbackQueueIds.length ? playbackQueueIds.slice() : getPlaybackQueue().map(item => item.id); if (!queue.includes(id)) queue.push(id); setPlaybackQueue(queue); closeModal(); renderAll(); toast('Трек добавлен в очередь', 'success'); });
    $('[data-menu-action="metadata"]', ui.modalRoot).addEventListener('click', () => { closeModal(); openMetadataEditor(id); });
    $('[data-menu-action="playlist"]', ui.modalRoot).addEventListener('click', () => { closeModal(); openPlaylistPicker(id); });
    $('[data-menu-action="cover"]', ui.modalRoot).addEventListener('click', () => { closeModal(); currentTrackId = id; ui.coverInput.click(); });
    const revealButton = $('[data-menu-action="reveal"]', ui.modalRoot);
    if (revealButton) revealButton.addEventListener('click', async () => {
      try {
        const result = await window.foxsmusic?.revealInFolder?.(track.audioPath);
        if (!result?.ok) toast(tr('openFolderFailed'), 'error'); else closeModal();
      } catch (error) { console.warn(error); toast(tr('openFolderFailed'), 'error'); }
    });
    const locateButton = $('[data-menu-action="locate"]', ui.modalRoot);
    if (locateButton) locateButton.addEventListener('click', () => { closeModal(); relinkOriginalFile(id); });
    $('[data-menu-action="remove"]', ui.modalRoot).addEventListener('click', () => {
      closeModal(); openModal(`<h2>Удалить трек?</h2><p>«${escapeHTML(track.title)}» будет удалён из локальной библиотеки приложения. Исходный файл на компьютере не удаляется.</p><div class="modal-actions"><button class="modal-cancel" data-close-modal>Отмена</button><button class="modal-submit" id="confirmRemove">Удалить</button></div>`);
      $('#confirmRemove', ui.modalRoot).addEventListener('click', () => { closeModal(); removeTrack(id); });
    });
  }
  function openPlaylistPicker(trackId) {
    const track = getTrack(trackId); if (!track) return;
    const choices = playlists.map(playlist => {
      const has = track.playlists.includes(playlist.id);
      return `<button class="playlist-choice" data-pick-playlist="${escapeHTML(playlist.id)}">${svgIcon(has ? 'check' : 'playlist')}<span>${escapeHTML(playlist.name)}</span><span>${has ? 'Добавлено' : 'Добавить +'}</span></button>`;
    }).join('');
    openModal(`<h2>Добавить в плейлист</h2><p>Выбери подборку для «${escapeHTML(track.title)}».</p><div class="playlist-choice-list">${choices || '<p>Плейлистов ещё нет. Создай первый — и добавь сюда трек.</p>'}</div><div class="modal-actions"><button class="modal-cancel" data-close-modal>Закрыть</button><button class="modal-submit" id="createFromPicker">+ Новый плейлист</button></div>`);
    $$('[data-pick-playlist]', ui.modalRoot).forEach(button => button.addEventListener('click', async () => {
      const id = button.dataset.pickPlaylist;
      if (track.playlists.includes(id)) track.playlists = track.playlists.filter(item => item !== id); else track.playlists.push(id);
      await saveTrack(track); openPlaylistPicker(trackId); renderAll();
    }));
    $('#createFromPicker', ui.modalRoot).addEventListener('click', () => { closeModal(); openCreatePlaylist(trackId); });
  }
  function openCreatePlaylist(trackIdToAdd = null) {
    openModal(`<h2>Новый плейлист</h2><p>Дай подборке имя, которое подходит твоему настроению.</p><label for="playlistNameInput">Название</label><input id="playlistNameInput" type="text" maxlength="42" placeholder="Например, Midnight Drive"><div class="modal-actions"><button class="modal-cancel" data-close-modal>Отмена</button><button class="modal-submit" id="savePlaylistBtn">Создать плейлист</button></div>`, '#playlistNameInput');
    const submit = async () => {
      const input = $('#playlistNameInput', ui.modalRoot);
      const name = input.value.trim();
      if (!name) { input.focus(); toast('Введи название плейлиста.'); return; }
      if (playlists.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { toast('Плейлист с таким названием уже существует.', 'error'); input.focus(); return; }
      const playlist = { id: newId(), name, createdAt: Date.now() };
      playlists.push(playlist); persistPlaylists();
      if (trackIdToAdd) {
        const track = getTrack(trackIdToAdd);
        if (track && !track.playlists.includes(playlist.id)) { track.playlists.push(playlist.id); await saveTrack(track); }
      }
      closeModal(); activeView = 'playlists'; activePlaylistId = playlist.id;
      $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'playlists'));
      renderAll(); toast(`Создан плейлист «${name}»`, 'success');
    };
    $('#savePlaylistBtn', ui.modalRoot).addEventListener('click', submit);
    $('#playlistNameInput', ui.modalRoot).addEventListener('keydown', event => { if (event.key === 'Enter') submit(); });
  }
  function openHelp() {
    openModal(`<h2>${tr('helpTitle')}</h2><p>${tr('helpIntro')}</p><div class="help-keys"><kbd>Space</kbd><span>${tr('space')}</span><kbd>← / →</kbd><span>${tr('seek')}</span><kbd>Ctrl + K</kbd><span>${tr('searchShortcut')}</span><kbd>Ctrl + Shift + E</kbd><span>${tr('studioShortcut')}</span><kbd>↑ / ↓</kbd><span>${tr('volumeShortcut')}</span><kbd>M</kbd><span>${tr('muteShortcut')}</span><kbd>N / P</kbd><span>${tr('navigationShortcut')}</span><kbd>S</kbd><span>${tr('shuffleShortcut')}</span><kbd>R</kbd><span>${tr('repeatShortcut')}</span><kbd>F / F11</kbd><span>${tr('fullscreenShortcut')}</span><kbd>Esc</kbd><span>${tr('closeWindow')}</span></div><div class="modal-actions" style="margin-top:20px"><button class="modal-submit" data-close-modal>${tr('understood')}</button></div>`);
  }

  async function changeCurrentCover(file) {
    const track = getCurrentTrack(); if (!track || !file) return;
    if (!file.type.startsWith('image/')) { toast('Выбери изображение для обложки.', 'error'); return; }
    if (track.coverUrl && track.coverUrl !== LOGO) URL.revokeObjectURL(track.coverUrl);
    track.coverBlob = file;
    track.coverUrl = URL.createObjectURL(file);
    await saveTrack(track); renderAll(); toast('Обложка обновлена', 'success');
  }
  function normalizeHexColor(value, fallback = DEFAULT_PROFILE_APPEARANCE.accentColor) {
    const color = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
  }
  function hexToRgb(hex) {
    const normalized = normalizeHexColor(hex);
    return [parseInt(normalized.slice(1, 3), 16), parseInt(normalized.slice(3, 5), 16), parseInt(normalized.slice(5, 7), 16)];
  }
  function mixHex(base, target, amount) {
    const a = hexToRgb(base), b = hexToRgb(target);
    return '#' + a.map((value, index) => Math.round(value * (1 - amount) + b[index] * amount).toString(16).padStart(2, '0')).join('');
  }
  function applyProfileAppearance(syncControls = true) {
    profileAppearance.style = PROFILE_STYLES.has(profileAppearance.style) ? profileAppearance.style : DEFAULT_PROFILE_APPEARANCE.style;
    profileAppearance.mode = PROFILE_MODES.has(profileAppearance.mode) ? profileAppearance.mode : DEFAULT_PROFILE_APPEARANCE.mode;
    profileAppearance.accentColor = normalizeHexColor(profileAppearance.accentColor);
    profileAppearance.gradient = Object.prototype.hasOwnProperty.call(PROFILE_GRADIENTS, profileAppearance.gradient) ? profileAppearance.gradient : DEFAULT_PROFILE_APPEARANCE.gradient;
    const root = document.documentElement;
    const accent = profileAppearance.accentColor;
    const [r, g, b] = hexToRgb(accent);
    const gradient = PROFILE_GRADIENTS[profileAppearance.gradient];
    root.style.setProperty('--red', accent);
    root.style.setProperty('--red-bright', mixHex(accent, '#ffffff', .13));
    root.style.setProperty('--red-soft', mixHex(accent, '#000000', .36));
    root.style.setProperty('--red-glow', `rgba(${r}, ${g}, ${b}, .24)`);
    root.style.setProperty('--line', `rgba(${r}, ${g}, ${b}, .16)`);
    root.style.setProperty('--line-strong', `rgba(${r}, ${g}, ${b}, .42)`);
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--profile-gradient', `radial-gradient(ellipse at 18% 0%, rgba(${r}, ${g}, ${b}, .16), transparent 58%), linear-gradient(125deg, ${gradient.a}, ${gradient.b} 52%, ${gradient.c})`);
    document.body.classList.toggle('profile-style-neon', profileAppearance.style === 'neon');
    document.body.classList.toggle('profile-style-glass', profileAppearance.style === 'glass');
    document.body.classList.toggle('profile-style-classic', profileAppearance.style === 'classic');
    document.body.dataset.profileStyle = profileAppearance.style;
    document.body.dataset.profileGradient = profileAppearance.gradient;
    document.body.dataset.profileMode = profileAppearance.mode;
    document.body.classList.toggle('profile-mode-halloween', profileAppearance.mode === 'halloween');
    document.body.classList.toggle('profile-mode-christmas', profileAppearance.mode === 'christmas');
    const metaTheme = $('meta[name="theme-color"]'); if (metaTheme) metaTheme.content = mixHex(accent, '#090607', .82);
    const preview = $('#profileAppearancePreview'); if (preview) { preview.dataset.style = profileAppearance.style; preview.dataset.gradient = profileAppearance.gradient; preview.dataset.mode = profileAppearance.mode; }
    if (syncControls) {
      const styleInput = $('#profileStyleSelect'); if (styleInput) styleInput.value = profileAppearance.style;
      const modeInput = $('#profileModeSelect'); if (modeInput) modeInput.value = profileAppearance.mode;
      const colorInput = $('#profileAccentColor'); if (colorInput) colorInput.value = accent;
      const colorHex = $('#profileAccentHex'); if (colorHex) colorHex.textContent = accent.toUpperCase();
      const gradientInput = $('#profileGradientSelect'); if (gradientInput) gradientInput.value = profileAppearance.gradient;
    } else {
      const colorHex = $('#profileAccentHex'); if (colorHex) colorHex.textContent = accent.toUpperCase();
    }
  }
  function resetProfileAppearance() {
    profileAppearance.style = DEFAULT_PROFILE_APPEARANCE.style;
    profileAppearance.mode = DEFAULT_PROFILE_APPEARANCE.mode;
    profileAppearance.accentColor = DEFAULT_PROFILE_APPEARANCE.accentColor;
    profileAppearance.gradient = DEFAULT_PROFILE_APPEARANCE.gradient;
    applyProfileAppearance();
    persistSettings();
    toast(tr('profileAppearanceResetDone'), 'success');
  }
  function applySettings() {
    const settings = loadSettings();
    ui.audio.volume = typeof settings.volume === 'number' ? Math.max(0, Math.min(1, settings.volume)) : .76;
    previousVolume = ui.audio.volume || .76;
    ui.audio.muted = !!settings.muted;
    shuffleEnabled = !!settings.shuffleEnabled;
    shuffleOrderIds = Array.isArray(settings.shuffleOrderIds) ? settings.shuffleOrderIds.filter(id => typeof id === 'string').slice(0, 10000) : [];
    repeatMode = ['off','all','one'].includes(settings.repeatMode) ? settings.repeatMode : 'off';
    // Restore repeat mode on both the primary and secondary deck.
    audioDecks.forEach(deck => { deck.loop = repeatMode === 'one'; });
    document.body.classList.toggle('effects-off', !effectsEnabled);
    syncEffectsSwitch();
    applyProfileAppearance();
    applyLocale(currentLocale);
    createHeroEqualizer(); renderControls(); updateSoundControls();
  }
  function createHeroEqualizer() {
    ui.heroEqualizer.innerHTML = '';
    for (let i = 0; i < 44; i++) {
      const bar = document.createElement('i'); bar.className = 'eq-bar';
      bar.style.setProperty('--bar-height', `${12 + Math.abs(Math.sin(i * .47)) * 83}%`);
      bar.style.setProperty('--speed', `${.45 + ((i * 7) % 13) / 10}s`);
      bar.style.setProperty('--delay', `${-((i * 19) % 30) / 10}s`);
      ui.heroEqualizer.appendChild(bar);
    }
    if (ui.soundSpectrum) {
      ui.soundSpectrum.innerHTML = '';
      for (let i = 0; i < 36; i++) {
        const bar = document.createElement('i');
        bar.className = 'studio-spectrum-bar';
        bar.style.setProperty('--seed-height', `${10 + Math.abs(Math.sin(i * .63)) * 62}%`);
        bar.style.setProperty('--bar-delay', `${-((i * 11) % 23) / 10}s`);
        bar.style.setProperty('--bar-speed', `${.42 + ((i * 5) % 9) / 10}s`);
        ui.soundSpectrum.appendChild(bar);
      }
    }
  }

  function ensureAudioEngine() {
    if (audioContext) return audioContext.state === 'suspended' ? audioContext.resume() : Promise.resolve(audioContext);
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      if (!ensureAudioEngine.warned) { toast('Звуковые эффекты недоступны в этом окружении.', 'error'); ensureAudioEngine.warned = true; }
      return Promise.resolve(null);
    }
    try {
      audioContext = new AudioContextConstructor();
      bassFilterNode = audioContext.createBiquadFilter();
      bassFilterNode.type = 'lowshelf'; bassFilterNode.frequency.value = 120;
      midFilterNode = audioContext.createBiquadFilter();
      midFilterNode.type = 'peaking'; midFilterNode.frequency.value = 1000; midFilterNode.Q.value = 0.85;
      trebleFilterNode = audioContext.createBiquadFilter();
      trebleFilterNode.type = 'highshelf'; trebleFilterNode.frequency.value = 5200;
      normalizationGainNode = audioContext.createGain(); normalizationGainNode.gain.value = audioSettings.normalizeEnabled ? 1 : 1;
      normalizationAnalyserNode = audioContext.createAnalyser(); normalizationAnalyserNode.fftSize = 1024; normalizationAnalyserNode.smoothingTimeConstant = 0.9;
      compressorNode = audioContext.createDynamicsCompressor();
      compressorNode.threshold.value = -8; compressorNode.knee.value = 10; compressorNode.ratio.value = 3.2;
      compressorNode.attack.value = 0.004; compressorNode.release.value = 0.22;
      masterGainNode = audioContext.createGain();
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256; analyserNode.smoothingTimeConstant = 0.78;
      for (const deck of audioDecks) {
        deck.crossOrigin = 'anonymous';
        const source = audioContext.createMediaElementSource(deck);
        const deckGain = audioContext.createGain();
        deckGain.gain.value = deck === ui.audio ? 1 : 0;
        source.connect(deckGain); deckGain.connect(bassFilterNode);
        deckSourceNodes.set(deck, source); deckGainNodes.set(deck, deckGain);
      }
      bassFilterNode.connect(midFilterNode);
      midFilterNode.connect(trebleFilterNode);
      trebleFilterNode.connect(normalizationGainNode);
      trebleFilterNode.connect(normalizationAnalyserNode); // side-chain meter; intentionally not connected to output
      normalizationGainNode.connect(masterGainNode);
      masterGainNode.connect(compressorNode);
      compressorNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
      applyAudioSettings(false);
      startVisualizerLoop();
      updateSoundControls();
      updateAudioEngineStatus();
      return audioContext.resume().then(() => audioContext).catch(() => audioContext);
    } catch (error) {
      console.warn('FoxsMusic audio engine init failed', error);
      toast('Не удалось включить аудиоэффекты. Попробуй перезапустить трек.', 'error');
      return Promise.resolve(null);
    }
  }

  function cancelDeckAutomation(param) {
    if (!param || !audioContext) return;
    try { param.cancelScheduledValues(audioContext.currentTime); } catch (_) {}
  }
  function setDeckGain(deck, value) {
    const gain = deckGainNodes.get(deck); if (!gain || !audioContext) return;
    cancelDeckAutomation(gain.gain);
    gain.gain.setValueAtTime(clamp(value, 0, 1), audioContext.currentTime);
  }
  function rampDeckGain(deck, from, to, duration) {
    const gain = deckGainNodes.get(deck); if (!gain || !audioContext) return;
    const now = audioContext.currentTime;
    cancelDeckAutomation(gain.gain);
    gain.gain.setValueAtTime(clamp(from, 0, 1), now);
    gain.gain.linearRampToValueAtTime(clamp(to, 0, 1), now + Math.max(0.05, duration));
  }
  function waitForDeckReady(deck, timeoutMs = 10000) {
    if (deck.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error) => {
        if (settled) return; settled = true; clearTimeout(timer);
        deck.removeEventListener('canplay', onReady); deck.removeEventListener('loadeddata', onReady); deck.removeEventListener('error', onError);
        error ? reject(error) : resolve();
      };
      const onReady = () => finish();
      const onError = () => finish(new Error('Аудиофайл не удалось подготовить к плавному переходу.'));
      const timer = setTimeout(() => finish(new Error('Истекло время ожидания аудиофайла.')), timeoutMs);
      deck.addEventListener('canplay', onReady, { once: true }); deck.addEventListener('loadeddata', onReady, { once: true }); deck.addEventListener('error', onError, { once: true });
    });
  }
  async function resolveTrackSource(track) {
    let source = track.audioUrl;
    if (!source && track.audioPath && window.foxsmusic?.getPlaybackUrl) {
      try { source = await window.foxsmusic.getPlaybackUrl(track.audioPath); track.audioUrl = source; track.sourceUnavailable = false; }
      catch (error) { track.sourceUnavailable = true; console.warn('FoxsMusic original path unavailable', track.audioPath, error); }
    }
    if (!source && track.audioBlob) { source = URL.createObjectURL(track.audioBlob); track.audioUrl = source; }
    return source || null;
  }
  async function crossfadeToTrack(track, source, requestedDuration = audioSettings.crossfadeSeconds) {
    const context = await ensureAudioEngine();
    if (!context || !source || audioSettings.crossfadeSeconds <= 0 || !deckGainNodes.get(ui.audio)) return false;
    const generation = ++crossfadeGeneration;
    const oldDeck = ui.audio;
    const nextDeck = audioDecks.find(deck => deck !== oldDeck);
    if (!nextDeck) return false;
    // Reuse the inactive deck; if an earlier crossfade was interrupted, silence it first.
    nextDeck.pause(); setDeckGain(nextDeck, 0);
    try { nextDeck.removeAttribute('src'); nextDeck.load(); } catch (_) {}
    const oldGain = deckGainNodes.get(oldDeck)?.gain;
    const newGain = deckGainNodes.get(nextDeck)?.gain;
    if (!oldGain || !newGain) return false;
    const oldId = currentTrackId;
    nextDeck.volume = oldDeck.volume; nextDeck.muted = oldDeck.muted; nextDeck.playbackRate = audioSettings.playbackRate;
    nextDeck.loop = repeatMode === 'one';
    nextDeck.src = source; nextDeck.load();
    try { await waitForDeckReady(nextDeck); }
    catch (error) { if (generation === crossfadeGeneration) toast(error.message || 'Не удалось подготовить переход.', 'error'); return false; }
    if (generation !== crossfadeGeneration) return false;
    // If Repeat One was enabled while the incoming file was loading, don't
    // replace the current song with the next queue item.
    if (repeatMode === 'one') {
      nextDeck.pause();
      try { nextDeck.removeAttribute('src'); nextDeck.load(); } catch (_) {}
      setDeckGain(nextDeck, 0);
      return false;
    }

    const duration = clamp(Number(requestedDuration) || audioSettings.crossfadeSeconds, 0.5, 8);
    const now = context.currentTime;
    const oldStart = clamp(oldGain.value, 0, 1);
    cancelDeckAutomation(oldGain); cancelDeckAutomation(newGain);
    oldGain.setValueAtTime(oldStart, now); newGain.setValueAtTime(0, now);
    nextDeck.loop = repeatMode === 'one';
    ui.audio = nextDeck;
    currentTrackId = track.id;
    syncPlaybackUI();
    try {
      await nextDeck.play();
    } catch (error) {
      ui.audio = oldDeck; currentTrackId = oldId; setDeckGain(oldDeck, 1); setDeckGain(nextDeck, 0); nextDeck.pause(); syncPlaybackUI();
      throw error;
    }
    // True two-deck crossfade: both sources overlap, with equal-duration gain ramps.
    oldGain.linearRampToValueAtTime(0, now + duration);
    newGain.linearRampToValueAtTime(1, now + duration);
    if (oldId !== track.id) recordPlayedTrack(track);
    updateMediaSession(track); renderNowPlaying(); syncPlaybackUI();
    await new Promise(resolve => setTimeout(resolve, duration * 1000 + 35));
    if (generation !== crossfadeGeneration) return true;
    oldDeck.pause();
    try { oldDeck.removeAttribute('src'); oldDeck.load(); } catch (_) {}
    setDeckGain(oldDeck, 0); setDeckGain(nextDeck, 1);
    renderNowPlaying(); syncPlaybackUI();
    return true;
  }

  function maybeStartAutoCrossfade() {
    // Repeat Off means stop at the end of the current track; Repeat One loops
    // the current deck. Automatic crossfade to another track is only valid in
    // Repeat Playlist mode, where the transition will not violate the selected mode.
    if (repeatMode !== 'all' || autoCrossfadeRunning || !audioSettings.crossfadeSeconds || ui.audio.paused || ui.audio.ended || !Number.isFinite(ui.audio.duration) || !currentTrackId) return;
    const totalDuration = ui.audio.duration;
    const fadeDuration = Math.min(audioSettings.crossfadeSeconds, Math.max(0.5, totalDuration * 0.35));
    const remaining = totalDuration - ui.audio.currentTime;
    if (totalDuration <= 0.75 || remaining > fadeDuration) return;
    const queue = getPlaybackOrder();
    const index = queue.findIndex(track => track.id === currentTrackId);
    if (index < 0 || !queue.length) return;
    let nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode !== 'all') return;
      nextIndex = 0;
    }
    const nextTrack = queue[nextIndex]; if (!nextTrack || nextTrack.id === currentTrackId) return;
    autoCrossfadeRunning = true;
    void resolveTrackSource(nextTrack).then(source => {
      if (!source || ui.audio.paused) return;
      return crossfadeToTrack(nextTrack, source, fadeDuration);
    }).catch(error => { console.warn('FoxsMusic auto crossfade failed', error); }).finally(() => { autoCrossfadeRunning = false; });
  }

  function applyAudioSettings(shouldPersist = true) {
    for (const deck of audioDecks) deck.playbackRate = audioSettings.playbackRate;
    if (bassFilterNode) bassFilterNode.gain.setTargetAtTime(audioSettings.bass, audioContext.currentTime, 0.035);
    if (midFilterNode) midFilterNode.gain.setTargetAtTime(audioSettings.mid, audioContext.currentTime, 0.035);
    if (trebleFilterNode) trebleFilterNode.gain.setTargetAtTime(audioSettings.treble, audioContext.currentTime, 0.035);
    if (masterGainNode) masterGainNode.gain.setTargetAtTime(audioSettings.gain / 100, audioContext.currentTime, 0.035);
    if (normalizationGainNode && !audioSettings.normalizeEnabled) { normalizationGainEstimate = 1; normalizationGainNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.25); }
    updateSoundControls();
    if (shouldPersist) persistSettings();
  }

  function updateSoundControls() {
    const values = {
      speedSlider: audioSettings.playbackRate,
      gainSlider: audioSettings.gain,
      bassSlider: audioSettings.bass,
      midSlider: audioSettings.mid,
      trebleSlider: audioSettings.treble
    };
    Object.entries(values).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.value = String(value);
      setRangeFill(input);
    });
    const labels = {
      speedValue: `${audioSettings.playbackRate.toFixed(2)}×`,
      gainValue: `${Math.round(audioSettings.gain)}%`,
      bassValue: `${audioSettings.bass > 0 ? '+' : ''}${audioSettings.bass} dB`,
      midValue: `${audioSettings.mid > 0 ? '+' : ''}${audioSettings.mid} dB`,
      trebleValue: `${audioSettings.treble > 0 ? '+' : ''}${audioSettings.treble} dB`,
      crossfadeValue: crossfadeSecondsLabel(audioSettings.crossfadeSeconds)
    };
    Object.entries(labels).forEach(([id, value]) => { const output = document.getElementById(id); if (output) output.textContent = value; });
    const crossfadeSlider = $('#crossfadeSlider'); if (crossfadeSlider) { crossfadeSlider.value = String(audioSettings.crossfadeSeconds); setRangeFill(crossfadeSlider); }
    const normalizeToggle = $('#normalizeToggle'); if (normalizeToggle) normalizeToggle.checked = !!audioSettings.normalizeEnabled;
    if (typeof EQ_PRESETS !== 'undefined') {
      const matchedPreset = Object.entries(EQ_PRESETS).find(([, preset]) => ['bass', 'mid', 'treble', 'gain'].every(key => audioSettings[key] === preset[key]));
      $$('.studio-preset').forEach(button => button.classList.toggle('active', !!matchedPreset && button.dataset.preset === matchedPreset[0]));
    }
  }

  function updateAudioEngineStatus() {
    const status = $('#audioEngineStatus');
    if (!status) return;
    status.textContent = ui.audio.paused ? tr('ready') : tr('live');
    status.classList.toggle('live', !ui.audio.paused && !!analyserNode);
  }

  function startVisualizerLoop() {
    if (visualizerFrame) return;
    const heroBars = $$('.eq-bar', ui.heroEqualizer);
    const studioBars = $$('.studio-spectrum-bar', ui.soundSpectrum || document);
    let boundAnalyser = null;
    let bins = null;
    let waveform = null;
    let normalizationWave = null;
    const startedAt = performance.now();

    const clearAudioDriven = bars => bars.forEach(bar => {
      bar.classList.remove('audio-driven');
      bar.style.removeProperty('height');
      bar.style.removeProperty('opacity');
    });

    const loop = now => {
      visualizerFrame = requestAnimationFrame(loop);
      const playing = !ui.audio.paused && !ui.audio.ended;

      // Rebind arrays if the audio engine is created/recreated after the loop starts.
      if (analyserNode !== boundAnalyser) {
        boundAnalyser = analyserNode;
        bins = boundAnalyser ? new Uint8Array(boundAnalyser.frequencyBinCount) : null;
        waveform = boundAnalyser ? new Uint8Array(boundAnalyser.fftSize) : null;
        normalizationWave = normalizationAnalyserNode ? new Uint8Array(normalizationAnalyserNode.fftSize) : null;
      }

      if (!playing || !effectsEnabled) {
        clearAudioDriven(heroBars);
        clearAudioDriven(studioBars);
        document.body.classList.remove('visualizer-live');
        return;
      }

      // Even when an analyser is unavailable or reports near-silence, keep a
      // gentle time-based motion so the playback indicator never appears frozen.
      let rms = 0;
      if (boundAnalyser && bins && waveform) {
        boundAnalyser.getByteFrequencyData(bins);
        boundAnalyser.getByteTimeDomainData(waveform);
        let squareSum = 0;
        for (let i = 0; i < waveform.length; i++) {
          const sample = (waveform[i] - 128) / 128;
          squareSum += sample * sample;
        }
        rms = Math.sqrt(squareSum / Math.max(1, waveform.length));
      }
      if (audioSettings.normalizeEnabled && normalizationAnalyserNode && normalizationWave && playing && audioContext && normalizationGainNode) {
        normalizationAnalyserNode.getByteTimeDomainData(normalizationWave);
        let normSquares = 0; for (let i = 0; i < normalizationWave.length; i++) { const sample = (normalizationWave[i] - 128) / 128; normSquares += sample * sample; }
        const normRms = Math.sqrt(normSquares / Math.max(1, normalizationWave.length));
        const target = normRms > 0.012 ? clamp(0.12 / normRms, 0.78, 1.22) : 1;
        normalizationGainEstimate += (target - normalizationGainEstimate) * 0.018;
        normalizationGainNode.gain.setTargetAtTime(normalizationGainEstimate, audioContext.currentTime, 0.6);
      } else if (normalizationGainNode && audioContext) {
        normalizationGainEstimate += (1 - normalizationGainEstimate) * 0.04;
        normalizationGainNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.8);
      }
      const elapsed = (now - startedAt) / 1000;

      const updateBars = (bars, offset, stride, phaseOffset = 0) => bars.forEach((bar, index) => {
        const phase = elapsed * (4.8 + (index % 5) * .23) + index * .71 + phaseOffset;
        const pulse = .5 + .5 * Math.sin(phase);
        let spectral = 0;
        if (bins && bins.length) {
          const binIndex = Math.min(bins.length - 1, Math.floor(offset + index * stride));
          const nextBin = Math.min(bins.length - 1, binIndex + 1);
          spectral = ((bins[binIndex] * .72) + (bins[nextBin] * .28)) / 255;
        }
        const strength = Math.max(spectral, rms * .9);
        const livelyFloor = 10 + pulse * (17 + rms * 22);
        const height = Math.max(8, Math.min(100, livelyFloor + strength * 72 + spectral * pulse * 28));
        bar.classList.add('audio-driven');
        bar.style.height = `${height}%`;
        bar.style.opacity = String(Math.max(.5, Math.min(1, .52 + strength * .65 + pulse * .18)));
      });
      updateBars(heroBars, 1, 1.45, 0);
      updateBars(studioBars, 2, 1.2, 1.4);
      document.body.classList.add('visualizer-live');
    };
    visualizerFrame = requestAnimationFrame(loop);
  }

  function openSoundStudio() {
    ui.soundStudio.hidden = false;
    ui.soundStudio.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => ui.soundStudio.classList.add('is-open'));
    $('#settingsToggle').classList.add('active');
    updateSoundControls();
    renderCustomEqPresets();
    updateAudioEngineStatus();
  }
  function closeSoundStudio() {
    ui.soundStudio.classList.remove('is-open');
    ui.soundStudio.setAttribute('aria-hidden', 'true');
    $('#settingsToggle').classList.remove('active');
    window.setTimeout(() => { if (ui.soundStudio.getAttribute('aria-hidden') === 'true') ui.soundStudio.hidden = true; }, 170);
  }
  function toggleSoundStudio() {
    if (ui.soundStudio.hidden || ui.soundStudio.getAttribute('aria-hidden') === 'true') openSoundStudio();
    else closeSoundStudio();
  }

  const EQ_PRESETS = {
    flat: { bass: 0, mid: 0, treble: 0, gain: 100 },
    bass: { bass: 7, mid: -1, treble: 2, gain: 100 },
    vocal: { bass: -2, mid: 5, treble: 3, gain: 100 },
    night: { bass: 3, mid: 2, treble: -4, gain: 90 }
  };
  function applyPreset(name) {
    const preset = EQ_PRESETS[name];
    if (!preset) return;
    Object.assign(audioSettings, preset);
    $$('.studio-preset').forEach(button => button.classList.toggle('active', button.dataset.preset === name));
    applyAudioSettings();
    toast(`Эквалайзер: ${buttonPresetName(name)}`, 'success');
  }
  function buttonPresetName(name) { return ({ flat: 'Flat', bass: 'Bass+', vocal: 'Vocal', night: 'Night' })[name] || name; }

  function syncEffectsSwitch() {
    const toggle = $('#effectsToggleBtn');
    if (!toggle) return;
    toggle.classList.toggle('is-on', effectsEnabled);
    toggle.setAttribute('aria-checked', String(effectsEnabled));
    toggle.title = effectsEnabled ? tr('effectsOn') : tr('effectsOff');
  }
  function openAppSettings() {
    const panel = $('#appSettingsPanel');
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => panel.classList.add('is-open'));
    applyLocale(currentLocale);
    syncEffectsSwitch();
    $('#appSettingsBtn').classList.add('active');
    $('#languageSelect').focus({ preventScroll: true });
  }
  function closeAppSettings() {
    const panel = $('#appSettingsPanel');
    if (!panel || panel.hidden) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    $('#appSettingsBtn').classList.remove('active');
    window.setTimeout(() => { if (panel.getAttribute('aria-hidden') === 'true') panel.hidden = true; }, 150);
  }
  function toggleAppSettings() {
    const panel = $('#appSettingsPanel');
    if (panel.hidden || panel.getAttribute('aria-hidden') === 'true') openAppSettings();
    else closeAppSettings();
  }
  function toggleEffects() {
    effectsEnabled = !effectsEnabled;
    document.body.classList.toggle('effects-off', !effectsEnabled);
    syncEffectsSwitch();
    persistSettings();
    toast(effectsEnabled ? tr('effectEnabledToast') : tr('effectDisabledToast'), 'success');
  }

  // Main navigation
  $$('.nav-item').forEach(button => button.addEventListener('click', () => {
    activeView = button.dataset.view; activePlaylistId = null;
    $$('.nav-item').forEach(node => node.classList.toggle('active', node === button));
    renderAll();
  }));
  $('#brandHome').addEventListener('click', () => { activeView = 'all'; activePlaylistId = null; ui.search.value = ''; $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'all')); renderAll(); });
  $('#addMusicBtn').addEventListener('click', () => chooseAudioFiles(true));
  $('#heroAddBtn').addEventListener('click', () => chooseAudioFiles(true));
  $('#emptyAddBtn').addEventListener('click', () => { const mode = $('#emptyAddBtn').dataset.mode; if (mode === 'clear') { ui.search.value = ''; renderAll(); } else if (mode === 'folder') chooseAudioFolder(); else if (mode === 'library') { activeView = 'all'; activePlaylistId = null; $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === 'all')); renderAll(); } else chooseAudioFiles(true); });
  $('#queueAddBtn').addEventListener('click', () => chooseAudioFiles(true));
  $('#addFolderBtn').addEventListener('click', () => chooseAudioFolder());
  $('#clearFolderSourceBtn').addEventListener('click', () => clearLibraryFolderSource());
  $('#addMusicBtn').title = 'Добавить оригинальные аудиофайлы без копирования в библиотеку';
  $('#addFolderBtn').title = 'Импортировать аудио из папки с сохранением исходных путей';
  $('#createPlaylistBtn').addEventListener('click', () => openCreatePlaylist());
  ui.audioInput.addEventListener('change', async event => { await importFiles(event.target.files); event.target.value = ''; });
  ui.folderInput.addEventListener('change', async event => { await importFiles(event.target.files); event.target.value = ''; });
  ui.coverInput.addEventListener('change', async event => { await changeCurrentCover(event.target.files?.[0]); event.target.value = ''; });
  ui.search.addEventListener('input', renderAll);
  ui.search.addEventListener('focus', () => document.body.classList.add('search-open'));
  ui.search.addEventListener('blur', () => { if (!ui.search.value) document.body.classList.remove('search-open'); });
  $('#clearSearchBtn').addEventListener('click', () => { ui.search.value = ''; renderAll(); ui.search.focus(); });
  $('#sortBtn').addEventListener('click', () => {
    sortMode = sortMode === 'recent' ? 'title' : 'recent';
    $('#sortBtn span:last-child').textContent = sortMode === 'recent' ? tr('recentlyAdded') : tr('sortByTitle');
    renderAll();
  });
  $('#shuffleAllBtn').addEventListener('click', () => {
    const queue = getPlaybackQueue(); if (!queue.length) { chooseAudioFiles(true); return; }
    shuffleEnabled = true;
    resetShuffleOrder(null);
    const order = getPlaybackOrder();
    renderControls(); persistSettings();
    if (order[0]) playTrack(order[0].id);
  });
  $('#queueShuffleBtn').addEventListener('click', toggleShuffle);
  $('#clearQueueBtn')?.addEventListener('click', () => {
    const count = getPlaybackQueue().length;
    if (!count) return;
    setPlaybackQueue([]);
    renderAll();
    toast(currentLocale === 'en' ? 'Queue cleared. Current playback continues.' : currentLocale === 'de' ? 'Warteschlange geleert. Die Wiedergabe läuft weiter.' : 'Очередь очищена. Текущий трек продолжает играть.', 'success');
  });
  ui.queueList.addEventListener('click', event => { const button = event.target.closest('[data-remove-queue]'); if (!button) return; event.stopPropagation(); const id = button.dataset.removeQueue; const base = playbackQueueIds.length || queueExplicit ? playbackQueueIds.slice() : getPlaybackQueue().map(track => track.id); setPlaybackQueue(base.filter(item => item !== id)); renderAll(); });

  // Playback controls
  ui.playBtn.addEventListener('click', togglePlay);
  $('#previousBtn').addEventListener('click', () => {
    if (ui.audio.currentTime > 3) { ui.audio.currentTime = 0; return; }
    selectAdjacent(-1);
  });
  $('#nextBtn').addEventListener('click', () => selectAdjacent(1));
  ui.shuffleBtn.addEventListener('click', toggleShuffle);
  ui.repeatBtn.addEventListener('click', cycleRepeat);
  ui.seekBar.addEventListener('input', () => {
    const duration = Number.isFinite(ui.audio.duration) ? ui.audio.duration : 0;
    if (duration > 0) {
      ui.audio.currentTime = (Number(ui.seekBar.value) / 1000) * duration;
      ui.currentTime.textContent = formatTime(ui.audio.currentTime);
      setRangeFill(ui.seekBar);
    }
  });
  ui.volumeBar.addEventListener('input', () => {
    const value = Number(ui.volumeBar.value) / 100;
    audioDecks.forEach(deck => { deck.volume = value; deck.muted = value === 0; });
    if (value > 0) previousVolume = value;
    persistSettings(); renderControls();
  });
  ui.muteBtn.addEventListener('click', () => {
    if (ui.audio.muted || ui.audio.volume === 0) { audioDecks.forEach(deck => { deck.muted = false; deck.volume = previousVolume || .76; }); }
    else { previousVolume = ui.audio.volume; audioDecks.forEach(deck => { deck.muted = true; }); }
    persistSettings(); renderControls();
  });
  ui.nowFavoriteBtn.addEventListener('click', () => { if (currentTrackId) toggleFavorite(currentTrackId); else toast('Сначала выбери трек.'); });
  $('#changeCoverBtn').addEventListener('click', () => { if (!currentTrackId) { toast('Сначала выбери трек, чтобы сменить обложку.'); return; } ui.coverInput.click(); });
  $('#toggleQueueBtn').addEventListener('click', () => {
    document.body.classList.toggle('queue-hidden');
    toast(document.body.classList.contains('queue-hidden') ? 'Панель плейлиста скрыта' : 'Панель плейлиста включена');
  });
  $('#appSettingsBtn').addEventListener('click', toggleAppSettings);
  $('#closeAppSettings').addEventListener('click', closeAppSettings);
  $('#effectsToggleBtn').addEventListener('click', toggleEffects);
  $('#clearImportedTracksBtn').addEventListener('click', confirmClearImportedTracks);
  $('#analyzeLibraryBtn').addEventListener('click', analyzeLibrary);
  $('#manageLibrarySourcesBtn').addEventListener('click', addLibrarySourceFolders);
  $('#scanSourceDuplicatesBtn').addEventListener('click', analyzeSourceFolderDuplicates);
  $('#exportBackupBtn').addEventListener('click', exportLibraryBackup);
  $('#importBackupBtn').addEventListener('click', restoreLibraryBackup);
  $('#checkUpdatesBtn').addEventListener('click', checkForUpdates);
  $('#downloadUpdateBtn').addEventListener('click', async () => { try { await window.foxsmusic?.downloadUpdate?.(); toast('Загрузка обновления началась.', 'success'); } catch (error) { updateUpdaterStatus({ status: 'error', message: error.message }); } });
  $('#installUpdateBtn').addEventListener('click', () => window.foxsmusic?.installUpdate?.());
  window.foxsmusic?.onUpdateStatus?.(updateUpdaterStatus);
  $('#languageSelect').addEventListener('change', event => { currentLocale = event.target.value; persistSettings(); applyLocale(currentLocale); renderAll(); updateAudioEngineStatus(); });
  $('#profileStyleSelect').addEventListener('change', event => {
    profileAppearance.style = PROFILE_STYLES.has(event.target.value) ? event.target.value : DEFAULT_PROFILE_APPEARANCE.style;
    applyProfileAppearance(false); persistSettings();
  });
  $('#profileModeSelect').addEventListener('change', event => {
    profileAppearance.mode = PROFILE_MODES.has(event.target.value) ? event.target.value : DEFAULT_PROFILE_APPEARANCE.mode;
    applyProfileAppearance(false); persistSettings();
  });
  $('#profileAccentColor').addEventListener('input', event => {
    profileAppearance.accentColor = normalizeHexColor(event.target.value);
    applyProfileAppearance(false); persistSettings();
  });
  $('#profileGradientSelect').addEventListener('change', event => {
    profileAppearance.gradient = Object.prototype.hasOwnProperty.call(PROFILE_GRADIENTS, event.target.value) ? event.target.value : DEFAULT_PROFILE_APPEARANCE.gradient;
    applyProfileAppearance(false); persistSettings();
  });
  $('#resetProfileAppearanceBtn').addEventListener('click', resetProfileAppearance);
  document.addEventListener('pointerdown', event => { const panel = $('#appSettingsPanel'); if (!panel.hidden && !panel.contains(event.target) && !$('#appSettingsBtn').contains(event.target)) closeAppSettings(); });
  $('#settingsToggle').addEventListener('click', toggleSoundStudio);
  $('#heroSoundBtn').addEventListener('click', toggleSoundStudio);
  $('#closeSoundStudio').addEventListener('click', closeSoundStudio);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeAppSettings(); if (!ui.soundStudio.hidden) closeSoundStudio(); } });
  $$('.studio-control input[type="range"]').forEach(input => input.addEventListener('input', () => {
    if (input.id === 'speedSlider') audioSettings.playbackRate = Number(input.value);
    else if (input.id === 'gainSlider') audioSettings.gain = Number(input.value);
    else if (input.id === 'bassSlider') audioSettings.bass = Number(input.value);
    else if (input.id === 'midSlider') audioSettings.mid = Number(input.value);
    else if (input.id === 'trebleSlider') audioSettings.treble = Number(input.value);
    $$('.studio-preset').forEach(button => button.classList.remove('active'));
    applyAudioSettings();
    if (!audioContext && !ui.audio.paused) ensureAudioEngine();
  }));
  $$('.studio-preset').forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  $('#crossfadeSlider').addEventListener('input', event => { audioSettings.crossfadeSeconds = clamp(Number(event.target.value) || 0, 0, 8); const output = $('#crossfadeValue'); if (output) output.textContent = crossfadeSecondsLabel(audioSettings.crossfadeSeconds); setRangeFill(event.target); persistSettings(); });
  $('#normalizeToggle').addEventListener('change', event => { audioSettings.normalizeEnabled = !!event.target.checked; applyAudioSettings(); toast(audioSettings.normalizeEnabled ? 'Выравнивание громкости включено' : 'Выравнивание громкости выключено', 'success'); });
  $('#saveEqPresetBtn').addEventListener('click', saveCustomEqPreset);
  renderCustomEqPresets();
  $('#resetSoundBtn').addEventListener('click', () => {
    audioSettings.playbackRate = 1; audioSettings.crossfadeSeconds = 3; audioSettings.normalizeEnabled = true;
    Object.assign(audioSettings, EQ_PRESETS.flat);
    $$('.studio-preset').forEach(button => button.classList.toggle('active', button.dataset.preset === 'flat'));
    applyAudioSettings();
    $('#crossfadeSlider').value = String(audioSettings.crossfadeSeconds); $('#normalizeToggle').checked = audioSettings.normalizeEnabled;
    const fadeOutput = $('#crossfadeValue'); if (fadeOutput) fadeOutput.textContent = crossfadeSecondsLabel(audioSettings.crossfadeSeconds); setRangeFill($('#crossfadeSlider'));
    toast('Настройки звука сброшены', 'success');
  });
  const heroCard = $('.hero-card');
  let heroPointerFrame = 0;
  heroCard.addEventListener('pointermove', event => {
    if (heroPointerFrame) return;
    heroPointerFrame = requestAnimationFrame(() => {
      heroPointerFrame = 0;
      const rect = heroCard.getBoundingClientRect();
      const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
      heroCard.style.setProperty('--pointer-x', `${x}%`);
      heroCard.style.setProperty('--pointer-y', `${y}%`);
    });
  });
  heroCard.addEventListener('pointerleave', () => {
    heroCard.style.setProperty('--pointer-x', '68%');
    heroCard.style.setProperty('--pointer-y', '45%');
  });

  $('#fullscreenBtn').addEventListener('click', async () => {
    try {
      const result = await window.foxsmusic.toggleWindowFullscreen();
      if (!result || result.ok === false) throw new Error('Fullscreen toggle failed');
    } catch (_) {
      toast('Полноэкранный режим недоступен в этом окне.', 'error');
    }
  });
  $('#helpBtn').addEventListener('click', openHelp);
  $('#nowPlayingBtn').setAttribute('aria-pressed', 'false');
  $('#nowPlayingBtn').addEventListener('click', openNowPlaying);
  $('#closeNowPlaying').addEventListener('click', closeNowPlaying);
  $('#nowPlayingOverlay').addEventListener('click', event => { if (event.target === $('#nowPlayingOverlay') || event.target === $('#nowPlayingBackdrop')) closeNowPlaying(); });
  $('#npPlayBtn').addEventListener('click', togglePlay);
  $('#npPreviousBtn').addEventListener('click', () => selectAdjacent(-1));
  $('#npNextBtn').addEventListener('click', () => selectAdjacent(1));
  $('#npSeekBar').addEventListener('input', event => { const duration = Number.isFinite(ui.audio.duration) ? ui.audio.duration : 0; if (duration > 0) ui.audio.currentTime = (Number(event.target.value) / 1000) * duration; setRangeFill(event.target); });

  function handleTrackEnded() {
    if (repeatMode === 'one') {
      try { ui.audio.currentTime = 0; } catch (_) {}
      ui.audio.play().catch(() => {});
      return;
    }
    if (repeatMode === 'all') {
      selectAdjacent(1);
      return;
    }
    // Repeat Off: stop at the end of this track. Do not advance the playlist,
    // even if there are more tracks or Crossfade is configured.
    crossfadeGeneration++;
    audioDecks.forEach(deck => { try { deck.pause(); } catch (_) {} });
    try { ui.audio.currentTime = 0; } catch (_) {}
    qualifiedPlaySession = null;
    syncPlaybackUI();
    updateAudioEngineStatus();
    updateMediaSession();
    updateNowPlayingOverlay();
  }

  // Bind both audio decks. During a crossfade the incoming deck becomes the active UI source;
  // events from the outgoing deck are ignored so the interface does not flicker.
  function bindAudioDeckEvents(deck) {
    const isActive = event => event.currentTarget === ui.audio;
    deck.addEventListener('play', event => { if (!isActive(event)) return; syncPlaybackUI(); updateAudioEngineStatus(); updateMediaSession(); updateNowPlayingOverlay(); });
    deck.addEventListener('pause', event => { if (!isActive(event)) return; syncPlaybackUI(); updateAudioEngineStatus(); updateMediaSession(); updateNowPlayingOverlay(); });
    deck.addEventListener('timeupdate', event => {
      if (!isActive(event)) return;
      ui.currentTime.textContent = formatTime(ui.audio.currentTime);
      const activeTrack = getCurrentTrack();
      if (activeTrack) maybeCountQualifiedListen(activeTrack);
      updateSeekRange(); updateNowPlayingOverlay(); maybeStartAutoCrossfade();
    });
    deck.addEventListener('loadedmetadata', async event => {
      if (!isActive(event)) return;
      const track = getCurrentTrack();
      if (track && Number.isFinite(ui.audio.duration)) {
        track.duration = ui.audio.duration; await saveTrack(track);
        ui.durationText.textContent = formatTime(track.duration);
        updateTrackDurationDisplays(track); updateNowPlayingOverlay();
      }
    });
    deck.addEventListener('ended', event => {
      if (!isActive(event)) return;
      handleTrackEnded();
    });
    deck.addEventListener('error', event => {
      if (!isActive(event)) return;
      const mediaError = ui.audio.error;
      console.warn('FoxsMusic audio element error', { code: mediaError?.code, message: mediaError?.message, source: ui.audio.currentSrc || ui.audio.getAttribute('src') || '(пустой источник)' });
    });
    deck.addEventListener('volumechange', event => { if (isActive(event)) renderControls(); });
  }
  audioDecks.forEach(bindAudioDeckEvents);

  if ('mediaSession' in navigator && navigator.mediaSession.setActionHandler) {
    try {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => ui.audio.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => selectAdjacent(1));
      navigator.mediaSession.setActionHandler('previoustrack', () => selectAdjacent(-1));
      navigator.mediaSession.setActionHandler('seekbackward', details => { ui.audio.currentTime = Math.max(0, ui.audio.currentTime - (details.seekOffset || 10)); });
      navigator.mediaSession.setActionHandler('seekforward', details => { ui.audio.currentTime = Math.min(ui.audio.duration || Infinity, ui.audio.currentTime + (details.seekOffset || 10)); });
      navigator.mediaSession.setActionHandler('seekto', details => { if (Number.isFinite(details.seekTime)) ui.audio.currentTime = details.seekTime; });
    } catch (_) {}
  }

  // Drag and drop
  const dropZone = $('#dropZone');
  let dragDepth = 0;
  document.addEventListener('dragenter', event => {
    if ([...event.dataTransfer.types].includes('Files')) { dragDepth++; dropZone.classList.add('drag-over'); }
  });
  document.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (dragDepth === 0) dropZone.classList.remove('drag-over'); });
  document.addEventListener('dragover', event => { if ([...event.dataTransfer.types].includes('Files')) event.preventDefault(); });
  document.addEventListener('drop', async event => {
    if (![...event.dataTransfer.types].includes('Files')) return;
    event.preventDefault(); dragDepth = 0; dropZone.classList.remove('drag-over');
    await importFiles(event.dataTransfer.files);
  });

  // Keyboard shortcuts use physical key codes (KeyM, KeyN, etc.) so they also
  // work when the keyboard is currently using a Cyrillic/Russian layout.
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape' || event.key === 'Escape') {
      event.preventDefault();
      closeModal(); closeNowPlaying(); document.body.classList.remove('search-open');
      return;
    }

    // Ctrl/Cmd+K is available even while the search field itself is focused.
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyK') {
      event.preventDefault(); document.body.classList.add('search-open'); ui.search.focus(); return;
    }

    // Ctrl+Shift+E (Cmd+Shift+E on macOS) toggles the Sound Studio from anywhere in the app.
    // Match the physical key so the shortcut also works with Russian keyboard layouts.
    if (!event.repeat && (event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey && event.code === 'KeyE') {
      event.preventDefault(); toggleSoundStudio(); return;
    }

    // F11 is also handled by Electron's main process; this renderer fallback
    // keeps the shortcut working in environments where before-input-event is not used.
    if (event.code === 'F11' || event.key === 'F11') {
      event.preventDefault(); $('#fullscreenBtn').click(); return;
    }

    const active = document.activeElement;
    const activeTag = active?.tagName;
    const isEditable = Boolean(active?.isContentEditable)
      || ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) && active?.type !== 'range';
    if (isEditable || event.ctrlKey || event.metaKey || event.altKey) return;

    // Holding discrete hotkeys should not rapidly skip tracks or toggle modes.
    const discreteShortcut = ['Space', 'KeyM', 'KeyN', 'KeyP', 'KeyS', 'KeyR', 'KeyF', 'F11'].includes(event.code);
    if (event.repeat && discreteShortcut) return;

    if (event.code === 'Space') { event.preventDefault(); togglePlay(); return; }
    if (event.code === 'ArrowLeft' && getCurrentTrack()) {
      // Let horizontal arrows operate a focused volume slider normally; otherwise seek.
      if (active?.id === 'volumeBar') return;
      event.preventDefault(); ui.audio.currentTime = Math.max(0, ui.audio.currentTime - 5); return;
    }
    if (event.code === 'ArrowRight' && getCurrentTrack()) {
      if (active?.id === 'volumeBar') return;
      event.preventDefault(); const duration = Number.isFinite(ui.audio.duration) && ui.audio.duration > 0 ? ui.audio.duration : Infinity; ui.audio.currentTime = Math.min(duration, ui.audio.currentTime + 5); return;
    }
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      event.preventDefault();
      const delta = event.code === 'ArrowUp' ? .05 : -.05;
      const volumeBase = ui.audio.muted ? (previousVolume || .76) : ui.audio.volume;
      const volume = clamp(volumeBase + delta, 0, 1);
      audioDecks.forEach(deck => { deck.volume = volume; deck.muted = volume === 0; });
      if (volume > 0) previousVolume = volume;
      persistSettings(); renderControls(); return;
    }
    if (event.code === 'KeyM') { event.preventDefault(); $('#muteBtn').click(); return; }
    if (event.code === 'KeyN') { event.preventDefault(); selectAdjacent(1); return; }
    if (event.code === 'KeyP') { event.preventDefault(); selectAdjacent(-1); return; }
    if (event.code === 'KeyS') { event.preventDefault(); toggleShuffle(); return; }
    if (event.code === 'KeyR') { event.preventDefault(); cycleRepeat(); return; }
    if (event.code === 'KeyF') { event.preventDefault(); $('#fullscreenBtn').click(); return; }
  });

  // Boot
  (async function init() {
    applySettings();
    try { await loadStoredTracks(); }
    catch (error) { console.error(error); }
    updateFolderSourceUI();
    if (activeLibraryFolderPath) await refreshSelectedLibraryFolder({ notify: false });
    renderAll();
    if (!getSourceTracks().length) ui.nowStatus.textContent = tr('readyStatus');
  })();
})();
