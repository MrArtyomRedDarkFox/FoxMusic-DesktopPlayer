'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const isWebUrl = value => {
    try { const url = new URL(String(value)); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; }
    catch (_) { return ''; }
  };
  const readArray = key => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch (_) { return []; } };
  const writeArray = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value.slice(0, 300))); } catch (_) {} };

  const COPY = {
    ru: {
      radio: 'Радио', online: 'Онлайн', radioTitle: 'Интернет-радио', radioSubtitle: 'Слушай станции со всего мира — без скачивания и без локальной библиотеки.',
      radioSearch: 'Найти радиостанцию', searchByStation: 'Станция', searchByGenre: 'Жанр', searchByCountry: 'Страна', radioPlaceholder: 'Название станции, жанр или страна…', search: 'Поиск', popular: 'Популярное', rock: 'Рок', electronic: 'Электроника', jazz: 'Джаз', news: 'Новости', favorites: 'Избранное', allStations: 'Все станции', savedStations: 'Сохранённые станции', customStation: 'Добавить свою станцию', stationName: 'Название станции', streamUrl: 'Прямая ссылка на поток (https:// или http://)', addStation: 'Добавить', play: 'Слушать', stop: 'Остановить', save: 'Сохранить', remove: 'Убрать', radioReady: 'Выбери станцию, чтобы начать прослушивание.', radioLoading: 'Ищем станции…', radioEmptyTitle: 'Станции не найдены', radioEmptyText: 'Попробуй другое название или жанр. Также можно добавить прямую ссылку на свою радиостанцию.', radioError: 'Не удалось получить каталог радиостанций. Проверь подключение к интернету и попробуй ещё раз.', invalidStream: 'Нужна прямая ссылка на аудиопоток HTTP или HTTPS.', stationAdded: 'Станция сохранена.', stationSaved: 'Добавлено в избранное.', stationRemoved: 'Удалено из избранного.', playingNow: 'СЕЙЧАС В ЭФИРЕ', streamError: 'Поток недоступен или станция временно не работает.',
      searchByTrack: 'Трек', searchByArtist: 'Исполнитель', searchByAlbum: 'Альбом', onlineTitle: 'Музыка онлайн', onlineSubtitle: 'Ищи и слушай независимую музыку из каталога Jamendo. Треки воспроизводятся потоком, а избранное сохраняется на этом компьютере.', clientIdTitle: 'Подключение каталога Jamendo', clientIdText: 'Для поиска и воспроизведения нужен бесплатный Client ID приложения Jamendo. Получи его в Developer Portal и сохрани здесь. Каталог содержит музыку независимых авторов; доступность треков зависит от лицензии и региона.', clientIdPlaceholder: 'Jamendo Client ID', saveClientId: 'Сохранить ID', clientIdSaved: 'Client ID сохранён.', clientIdRequired: 'Сначала укажи свой Jamendo Client ID.', getClientId: 'Получить Client ID', onlinePlaceholder: 'Название трека, исполнитель или альбом…', searchMusic: 'Найти музыку', catalog: 'Каталог', savedTracks: 'Избранные треки', onlineLoading: 'Ищем музыку…', onlineEmptyTitle: 'Ничего не найдено', onlineEmptyText: 'Попробуй другой запрос или проверь Client ID Jamendo.', onlineError: 'Не удалось получить каталог Jamendo. Проверь Client ID и интернет-соединение.', noSavedTracks: 'Здесь появятся сохранённые онлайн-треки.', licensedMusic: 'Независимая музыка · Jamendo', streamOnly: 'Онлайн-поток — файл не скачивается', license: 'Лицензия', currentStream: 'ОНЛАЙН-ПЛЕЕР', streamIdle: 'Ничего не воспроизводится', volume: 'Громкость',
      navNote: 'Интернет-функции требуют подключения к сети.', attributionRadio: 'Каталог станций предоставляется Radio Browser. Список и работоспособность потоков зависят от сообщества и самих станций.', attributionJamendo: 'Музыкальный каталог и потоки предоставляются Jamendo. Соблюдай условия лицензии каждой композиции.',
      missingBridge: 'Перезапусти FoxsMusic после установки обновления, чтобы включить интернет-каталоги.'
    },
    en: {
      radio: 'Radio', online: 'Online', radioTitle: 'Internet radio', radioSubtitle: 'Listen to stations around the world — no downloads and no local library required.',
      radioSearch: 'Find a radio station', searchByStation: 'Station', searchByGenre: 'Genre', searchByCountry: 'Country', radioPlaceholder: 'Station name, genre or country…', search: 'Search', popular: 'Popular', rock: 'Rock', electronic: 'Electronic', jazz: 'Jazz', news: 'News', favorites: 'Favorites', allStations: 'All stations', savedStations: 'Saved stations', customStation: 'Add your own station', stationName: 'Station name', streamUrl: 'Direct stream URL (https:// or http://)', addStation: 'Add station', play: 'Listen', stop: 'Stop', save: 'Save', remove: 'Remove', radioReady: 'Choose a station to start listening.', radioLoading: 'Searching stations…', radioEmptyTitle: 'No stations found', radioEmptyText: 'Try another name or genre. You can also add a direct link to your own station.', radioError: 'Could not load the radio directory. Check your connection and try again.', invalidStream: 'Enter a direct HTTP or HTTPS audio stream URL.', stationAdded: 'Station saved.', stationSaved: 'Added to favorites.', stationRemoved: 'Removed from favorites.', playingNow: 'NOW ON AIR', streamError: 'The stream is unavailable or the station is temporarily offline.',
      searchByTrack: 'Track', searchByArtist: 'Artist', searchByAlbum: 'Album', onlineTitle: 'Online music', onlineSubtitle: 'Search and stream independent music from Jamendo. Tracks play over the internet; favorites are saved on this computer.', clientIdTitle: 'Connect the Jamendo catalogue', clientIdText: 'A free Jamendo application Client ID is required to search and play music. Get one in the Developer Portal and save it here. The catalogue features independent artists; track availability depends on its license and region.', clientIdPlaceholder: 'Jamendo Client ID', saveClientId: 'Save ID', clientIdSaved: 'Client ID saved.', clientIdRequired: 'Enter your Jamendo Client ID first.', getClientId: 'Get a Client ID', onlinePlaceholder: 'Track, artist or album…', searchMusic: 'Search music', catalog: 'Catalogue', savedTracks: 'Saved tracks', onlineLoading: 'Searching music…', onlineEmptyTitle: 'No matches found', onlineEmptyText: 'Try another search or check your Jamendo Client ID.', onlineError: 'Could not load Jamendo. Check the Client ID and internet connection.', noSavedTracks: 'Your saved online tracks will appear here.', licensedMusic: 'Independent music · Jamendo', streamOnly: 'Online stream — no file is downloaded', license: 'License', currentStream: 'ONLINE PLAYER', streamIdle: 'Nothing is playing', volume: 'Volume',
      navNote: 'Internet features require a network connection.', attributionRadio: 'Station directory provided by Radio Browser. Station listings and stream availability are maintained by the community and broadcasters.', attributionJamendo: 'Music catalogue and streams are provided by Jamendo. Follow each track’s license terms.',
      missingBridge: 'Restart FoxsMusic after installing the update to enable online catalogues.'
    },
    de: {
      radio: 'Radio', online: 'Online', radioTitle: 'Internetradio', radioSubtitle: 'Höre Sender aus aller Welt — ohne Downloads und ohne lokale Musikbibliothek.',
      radioSearch: 'Radiosender finden', searchByStation: 'Sender', searchByGenre: 'Genre', searchByCountry: 'Land', radioPlaceholder: 'Sendername, Genre oder Land…', search: 'Suchen', popular: 'Beliebt', rock: 'Rock', electronic: 'Elektronik', jazz: 'Jazz', news: 'Nachrichten', favorites: 'Favoriten', allStations: 'Alle Sender', savedStations: 'Gespeicherte Sender', customStation: 'Eigenen Sender hinzufügen', stationName: 'Sendername', streamUrl: 'Direkte Stream-URL (https:// oder http://)', addStation: 'Hinzufügen', play: 'Anhören', stop: 'Stopp', save: 'Speichern', remove: 'Entfernen', radioReady: 'Wähle einen Sender, um die Wiedergabe zu starten.', radioLoading: 'Sender werden gesucht…', radioEmptyTitle: 'Keine Sender gefunden', radioEmptyText: 'Versuche einen anderen Namen oder ein anderes Genre. Du kannst auch einen direkten Stream-Link hinzufügen.', radioError: 'Das Radioverzeichnis konnte nicht geladen werden. Prüfe die Internetverbindung.', invalidStream: 'Gib eine direkte HTTP- oder HTTPS-Audiostream-URL ein.', stationAdded: 'Sender gespeichert.', stationSaved: 'Zu Favoriten hinzugefügt.', stationRemoved: 'Aus Favoriten entfernt.', playingNow: 'JETZT LIVE', streamError: 'Der Stream ist nicht verfügbar oder der Sender ist vorübergehend offline.',
      searchByTrack: 'Titel', searchByArtist: 'Interpret', searchByAlbum: 'Album', onlineTitle: 'Musik online', onlineSubtitle: 'Suche und streame unabhängige Musik aus dem Jamendo-Katalog. Favoriten werden auf diesem Computer gespeichert.', clientIdTitle: 'Jamendo-Katalog verbinden', clientIdText: 'Zum Suchen und Abspielen wird eine kostenlose Jamendo-App-Client-ID benötigt. Erstelle sie im Developer Portal und speichere sie hier. Der Katalog enthält unabhängige Künstler; Verfügbarkeit hängt von Lizenz und Region ab.', clientIdPlaceholder: 'Jamendo Client ID', saveClientId: 'ID speichern', clientIdSaved: 'Client ID gespeichert.', clientIdRequired: 'Gib zuerst deine Jamendo Client ID ein.', getClientId: 'Client ID erhalten', onlinePlaceholder: 'Titel, Interpret oder Album…', searchMusic: 'Musik suchen', catalog: 'Katalog', savedTracks: 'Gespeicherte Titel', onlineLoading: 'Musik wird gesucht…', onlineEmptyTitle: 'Keine Treffer', onlineEmptyText: 'Versuche eine andere Suche oder prüfe die Jamendo Client ID.', onlineError: 'Jamendo konnte nicht geladen werden. Prüfe Client ID und Internetverbindung.', noSavedTracks: 'Hier erscheinen deine gespeicherten Online-Titel.', licensedMusic: 'Unabhängige Musik · Jamendo', streamOnly: 'Online-Stream — keine Datei wird heruntergeladen', license: 'Lizenz', currentStream: 'ONLINE-PLAYER', streamIdle: 'Es läuft nichts', volume: 'Lautstärke',
      navNote: 'Internetfunktionen benötigen eine Netzwerkverbindung.', attributionRadio: 'Das Senderverzeichnis wird von Radio Browser bereitgestellt. Sender und Stream-Verfügbarkeit werden von Community und Sendern gepflegt.', attributionJamendo: 'Musikkatalog und Streams werden von Jamendo bereitgestellt. Beachte die Lizenzbedingungen jedes Titels.',
      missingBridge: 'Starte FoxsMusic nach dem Update neu, um die Online-Kataloge zu aktivieren.'
    }
  };

  const keys = {
    radioStations: 'foxsmusic-radio-favorites-v1',
    onlineTracks: 'foxsmusic-online-favorites-v1',
    jamendoClient: 'foxsmusic-jamendo-client-id-v1'
  };
  let locale = ['ru', 'en', 'de'].includes($('#languageSelect')?.value) ? $('#languageSelect').value : 'ru';
  let radioResults = [];
  let onlineResults = [];
  let radioFilter = 'all';
  let onlineFilter = 'catalog';
  let currentPage = null;
  let currentStream = null;
  let radioFavorites = readArray(keys.radioStations);
  let onlineFavorites = readArray(keys.onlineTracks);
  let jamendoClientId = localStorage.getItem(keys.jamendoClient) || '';
  const streamAudio = new Audio();
  streamAudio.preload = 'none';
  streamAudio.volume = 0.76;

  const t = key => (COPY[locale] || COPY.ru)[key] || COPY.ru[key] || key;

  function icon(name) {
    const paths = {
      radio: '<circle cx="12" cy="12" r="2"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8M2.8 2.8a13 13 0 0 0 0 18.4M21.2 2.8a13 13 0 0 1 0 18.4"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
      play: '<path d="m8 5 12 7-12 7Z"/>', pause: '<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',
      volume: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
      muted: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6m0-6-5 6"/>',
      heart: '<path d="M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.4 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z"/>', stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>', search: '<circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.4 4.4"/>', music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.music}</svg>`;
  }

  function createWorkspace() {
    const nav = $('.primary-nav');
    const main = $('.main-content');
    if (!nav || !main || $('#internetWorkspace')) return;

    const radioNav = document.createElement('button');
    radioNav.type = 'button'; radioNav.className = 'nav-item internet-nav-item'; radioNav.dataset.internetView = 'radio';
    radioNav.innerHTML = `<span class="internet-nav-symbol">${icon('radio')}</span><span data-nav-label="radio">${t('radio')}</span>`;
    const onlineNav = document.createElement('button');
    onlineNav.type = 'button'; onlineNav.className = 'nav-item internet-nav-item'; onlineNav.dataset.internetView = 'online';
    onlineNav.innerHTML = `<span class="internet-nav-symbol">${icon('globe')}</span><span data-nav-label="online">${t('online')}</span>`;
    const historyNav = $('[data-view="history"]', nav);
    if (historyNav) { historyNav.after(radioNav, onlineNav); } else nav.append(radioNav, onlineNav);

    const workspace = document.createElement('section');
    workspace.id = 'internetWorkspace';
    workspace.className = 'internet-workspace';
    workspace.hidden = true;
    workspace.innerHTML = `
      <div class="internet-player" id="internetPlayerBar" hidden>
        <div class="internet-player-copy"><span class="internet-kicker" id="internetPlayerKicker">${t('currentStream')}</span><strong id="internetPlayerTitle"></strong><small id="internetPlayerSubtitle"></small></div>
        <div class="internet-player-actions"><button class="internet-action" id="internetPlayerToggle" type="button">${t('play')}</button><button class="internet-action secondary" id="internetPlayerStop" type="button">${t('stop')}</button></div>
        <label class="internet-player-volume"><span data-copy="volume">${t('volume')}</span><input id="internetPlayerVolume" type="range" min="0" max="100" value="76"></label>
      </div>
      <section class="internet-page" id="radioPage">
        <div class="internet-hero">
          <span class="internet-kicker">${icon('radio')} FOXSMUSIC · LIVE RADIO</span>
          <h2 data-copy="radioTitle">${t('radioTitle')}</h2>
          <p data-copy="radioSubtitle">${t('radioSubtitle')}</p>
          <form class="internet-search-row" id="radioSearchForm"><select class="internet-select" id="radioSearchField" aria-label="${t('searchByStation')}"><option value="name">${t('searchByStation')}</option><option value="tag">${t('searchByGenre')}</option><option value="country">${t('searchByCountry')}</option></select><input id="radioSearchInput" type="search" maxlength="120" autocomplete="off" placeholder="${t('radioPlaceholder')}" aria-label="${t('radioPlaceholder')}"><button class="internet-action" type="submit" data-copy="search">${t('search')}</button></form>
          <div class="internet-quick-tags"><button class="internet-chip" type="button" data-radio-tag="rock" data-copy="rock">${t('rock')}</button><button class="internet-chip" type="button" data-radio-tag="electronic" data-copy="electronic">${t('electronic')}</button><button class="internet-chip" type="button" data-radio-tag="jazz" data-copy="jazz">${t('jazz')}</button><button class="internet-chip" type="button" data-radio-tag="news" data-copy="news">${t('news')}</button></div>
        </div>
        <div class="internet-toolbar"><h3 data-copy="popular">${t('popular')}</h3><div class="internet-filter-row"><button class="internet-chip is-active" type="button" data-radio-filter="all" data-copy="allStations">${t('allStations')}</button><button class="internet-chip" type="button" data-radio-filter="favorites" data-copy="savedStations">${t('savedStations')}</button></div></div>
        <div class="internet-status" id="radioStatus" role="status">${t('radioReady')}</div>
        <div class="internet-results" id="radioResults"></div>
        <div class="internet-setup-card">
          <strong data-copy="customStation">${t('customStation')}</strong>
          <form class="internet-custom-station" id="customStationForm"><input class="internet-field" id="customStationName" maxlength="120" placeholder="${t('stationName')}" aria-label="${t('stationName')}"><input class="internet-field" id="customStationUrl" maxlength="2048" placeholder="${t('streamUrl')}" aria-label="${t('streamUrl')}"><button class="internet-action secondary" type="submit" data-copy="addStation">${t('addStation')}</button></form>
        </div>
        <p class="internet-attribution" data-copy="attributionRadio">${t('attributionRadio')}</p>
      </section>
      <section class="internet-page" id="onlinePage">
        <div class="internet-hero">
          <span class="internet-kicker">${icon('globe')} FOXSMUSIC · ONLINE</span>
          <h2 data-copy="onlineTitle">${t('onlineTitle')}</h2>
          <p data-copy="onlineSubtitle">${t('onlineSubtitle')}</p>
        </div>
        <div class="internet-setup-card" style="margin-top:16px">
          <strong data-copy="clientIdTitle">${t('clientIdTitle')}</strong>
          <p data-copy="clientIdText">${t('clientIdText')}</p>
          <div class="internet-setup-row"><input class="internet-field" id="jamendoClientInput" maxlength="64" placeholder="${t('clientIdPlaceholder')}" value="${escapeHTML(jamendoClientId)}" aria-label="${t('clientIdPlaceholder')}"><button class="internet-action secondary" id="saveJamendoClient" type="button" data-copy="saveClientId">${t('saveClientId')}</button></div>
          <p><a class="internet-link" href="https://developer.jamendo.com/v3.0/authentication" target="_blank" rel="noreferrer" data-copy="getClientId">${t('getClientId')}</a></p>
        </div>
        <form class="internet-search-row" id="onlineSearchForm"><select class="internet-select" id="onlineSearchField" aria-label="${t('searchByTrack')}"><option value="track">${t('searchByTrack')}</option><option value="artist">${t('searchByArtist')}</option><option value="album">${t('searchByAlbum')}</option></select><input id="onlineSearchInput" type="search" maxlength="120" autocomplete="off" placeholder="${t('onlinePlaceholder')}" aria-label="${t('onlinePlaceholder')}"><button class="internet-action" type="submit" data-copy="searchMusic">${t('searchMusic')}</button></form>
        <div class="internet-toolbar"><h3 data-copy="catalog">${t('catalog')}</h3><div class="internet-filter-row"><button class="internet-chip is-active" type="button" data-online-filter="catalog" data-copy="catalog">${t('catalog')}</button><button class="internet-chip" type="button" data-online-filter="favorites" data-copy="savedTracks">${t('savedTracks')}</button></div></div>
        <div class="internet-status" id="onlineStatus" role="status">${t('clientIdRequired')}</div>
        <div class="internet-results" id="onlineResults"></div>
        <p class="internet-attribution" data-copy="attributionJamendo">${t('attributionJamendo')}</p>
      </section>`;
    main.appendChild(workspace);

    radioNav.addEventListener('click', () => showPage('radio'));
    onlineNav.addEventListener('click', () => showPage('online'));
    // Let normal local navigation continue through the original app.js handlers.
    nav.addEventListener('click', event => {
      const localButton = event.target.closest('.nav-item[data-view]');
      if (localButton) showLocal();
    }, true);
    $('#brandHome')?.addEventListener('click', showLocal, true);
    $('#languageSelect')?.addEventListener('change', event => setLocale(event.target.value));

    $('#radioSearchForm').addEventListener('submit', event => { event.preventDefault(); searchRadio($('#radioSearchInput').value, $('#radioSearchField').value); });
    $('#radioResults').addEventListener('click', handleRadioAction);
    $('#onlineSearchForm').addEventListener('submit', event => { event.preventDefault(); searchOnline($('#onlineSearchInput').value, $('#onlineSearchField').value); });
    $('#onlineResults').addEventListener('click', handleOnlineAction);
    $('#saveJamendoClient').addEventListener('click', saveJamendoClient);
    $('#jamendoClientInput').addEventListener('keydown', event => { if (event.key === 'Enter') saveJamendoClient(); });
    $('#customStationForm').addEventListener('submit', addCustomStation);
    $('.internet-quick-tags').addEventListener('click', event => {
      const button = event.target.closest('[data-radio-tag]'); if (!button) return;
      const tag = button.dataset.radioTag; $('#radioSearchInput').value = tag; $('#radioSearchField').value = 'tag'; searchRadio(tag, 'tag');
    });
    $('.internet-filter-row', $('#radioPage')).addEventListener('click', event => {
      const button = event.target.closest('[data-radio-filter]'); if (!button) return;
      radioFilter = button.dataset.radioFilter; renderRadioResults(); syncFilterButtons();
    });
    $('.internet-filter-row', $('#onlinePage')).addEventListener('click', event => {
      const button = event.target.closest('[data-online-filter]'); if (!button) return;
      onlineFilter = button.dataset.onlineFilter;
      if (onlineFilter === 'favorites') renderOnlineFavorites();
      else renderOnlineResults();
      syncFilterButtons();
    });

    $('#internetPlayerToggle').addEventListener('click', toggleStream);
    $('#internetPlayerStop').addEventListener('click', stopStream);
    $('#internetPlayerVolume').addEventListener('input', event => { streamAudio.volume = Number(event.target.value) / 100; });
    streamAudio.addEventListener('playing', updatePlayerBar);
    streamAudio.addEventListener('pause', updatePlayerBar);
    streamAudio.addEventListener('volumechange', updatePlayerBar);
    streamAudio.addEventListener('error', () => setCurrentStatus(t('streamError'), true));
    renderRadioResults();
    renderOnlineResults();
    setLocale(locale);
  }

  function setLocale(nextLocale) {
    locale = ['ru', 'en', 'de'].includes(nextLocale) ? nextLocale : 'ru';
    document.querySelectorAll('[data-nav-label]').forEach(node => node.textContent = t(node.dataset.navLabel));
    document.querySelectorAll('#internetWorkspace [data-copy]').forEach(node => {
      const key = node.dataset.copy;
      if (key === 'getClientId') return; // Keep the external link and its URL intact.
      node.textContent = t(key);
    });
    const radioInput = $('#radioSearchInput'); if (radioInput) { radioInput.placeholder = t('radioPlaceholder'); radioInput.setAttribute('aria-label', t('radioPlaceholder')); }
    const radioField = $('#radioSearchField'); if (radioField) { radioField.setAttribute('aria-label', t('radioSearch')); [...radioField.options].forEach(option => { option.textContent = t(({ name: 'searchByStation', tag: 'searchByGenre', country: 'searchByCountry' })[option.value]); }); }
    const onlineInput = $('#onlineSearchInput'); if (onlineInput) { onlineInput.placeholder = t('onlinePlaceholder'); onlineInput.setAttribute('aria-label', t('onlinePlaceholder')); }
    const onlineField = $('#onlineSearchField'); if (onlineField) { onlineField.setAttribute('aria-label', t('onlineTitle')); [...onlineField.options].forEach(option => { option.textContent = t(({ track: 'searchByTrack', artist: 'searchByArtist', album: 'searchByAlbum' })[option.value]); }); }
    const clientInput = $('#jamendoClientInput'); if (clientInput) clientInput.placeholder = t('clientIdPlaceholder');
    const customName = $('#customStationName'); if (customName) customName.placeholder = t('stationName');
    const customUrl = $('#customStationUrl'); if (customUrl) customUrl.placeholder = t('streamUrl');
    const clientLink = $('#internetWorkspace [data-copy="getClientId"]'); if (clientLink) clientLink.textContent = t('getClientId');
    const playerKicker = $('#internetPlayerKicker'); if (playerKicker) playerKicker.textContent = t('currentStream');
    $('#internetPlayerStop')?.replaceChildren(document.createTextNode(t('stop')));
    $('#internetPlayerToggle')?.replaceChildren(document.createTextNode(streamAudio.paused ? t('play') : 'Ⅱ'));
    syncFilterButtons();
    if (currentPage) syncHeading();
    renderRadioResults();
    if (onlineFilter === 'favorites') renderOnlineFavorites();
    else renderOnlineResults();
  }

  function showPage(page) {
    currentPage = page === 'online' ? 'online' : 'radio';
    document.body.classList.add('internet-active');
    const workspace = $('#internetWorkspace'); if (workspace) workspace.hidden = false;
    $$('.internet-page').forEach(node => node.classList.toggle('is-active', node.id === (currentPage === 'radio' ? 'radioPage' : 'onlinePage')));
    $$('.internet-nav-item').forEach(node => node.classList.toggle('active', node.dataset.internetView === currentPage));
    $$('.nav-item[data-view]').forEach(node => node.classList.remove('active'));
    syncHeading();
    if (currentPage === 'radio' && !radioResults.length) searchRadio('');
    if (currentPage === 'online' && onlineFilter === 'favorites') renderOnlineFavorites();
  }

  function showLocal() {
    if (!currentPage) return;
    currentPage = null;
    document.body.classList.remove('internet-active');
    const workspace = $('#internetWorkspace'); if (workspace) workspace.hidden = true;
    $$('.internet-nav-item').forEach(node => node.classList.remove('active'));
    stopStream();
  }

  function syncHeading() {
    if (!currentPage) return;
    const title = $('#viewTitle'); const subtitle = $('#viewSubtitle');
    if (title) title.innerHTML = `${escapeHTML(t(currentPage === 'radio' ? 'radioTitle' : 'onlineTitle'))}<span class="title-period">.</span>`;
    if (subtitle) subtitle.textContent = t(currentPage === 'radio' ? 'radioSubtitle' : 'onlineSubtitle');
    const total = $('#trackTotal'); if (total) total.textContent = '';
    const sort = $('#sortBtn'); if (sort) sort.hidden = true;
  }

  function syncFilterButtons() {
    document.querySelectorAll('[data-radio-filter]').forEach(button => button.classList.toggle('is-active', button.dataset.radioFilter === radioFilter));
    document.querySelectorAll('[data-online-filter]').forEach(button => button.classList.toggle('is-active', button.dataset.onlineFilter === onlineFilter));
  }

  function setStatus(id, message, error = false) {
    const node = $(id); if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', !!error);
  }

  async function searchRadio(query, field = 'name') {
    if (!window.foxsmusic?.searchRadioStations) { setStatus('#radioStatus', t('missingBridge'), true); return; }
    radioFilter = 'all'; syncFilterButtons(); setStatus('#radioStatus', t('radioLoading'));
    $('#radioResults').innerHTML = '';
    try {
      const items = await window.foxsmusic.searchRadioStations(String(query || '').trim(), field);
      radioResults = Array.isArray(items) ? items.filter(item => isWebUrl(item.streamUrl)) : [];
      renderRadioResults();
      if (!radioResults.length) setStatus('#radioStatus', t('radioEmptyText'));
      else setStatus('#radioStatus', `${radioResults.length} · ${t('allStations')}`);
    } catch (error) {
      console.warn('FoxsMusic radio search failed', error);
      setStatus('#radioStatus', t('radioError'), true);
    }
  }

  function getStationFavorites() { return radioFavorites.filter(item => item && isWebUrl(item.streamUrl)); }
  function renderRadioResults() {
    const target = $('#radioResults'); if (!target) return;
    const items = radioFilter === 'favorites' ? getStationFavorites() : radioResults;
    if (!items.length) {
      target.innerHTML = `<div class="internet-empty"><strong>${escapeHTML(radioFilter === 'favorites' ? t('savedStations') : t('radioEmptyTitle'))}</strong>${escapeHTML(radioFilter === 'favorites' ? t('radioReady') : t('radioEmptyText'))}</div>`;
      return;
    }
    target.innerHTML = items.map(station => {
      const saved = radioFavorites.some(item => item.id === station.id);
      const meta = [station.country, station.codec, station.bitrate ? `${station.bitrate} kbps` : ''].filter(Boolean).map(value => `<span class="internet-meta-pill">${escapeHTML(value)}</span>`).join('');
      const art = station.favicon ? `<img src="${escapeHTML(station.favicon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : icon('radio');
      return `<article class="internet-card"><div class="internet-art">${art}</div><div class="internet-card-copy"><strong title="${escapeHTML(station.name)}">${escapeHTML(station.name)}</strong><small>${escapeHTML(station.tags?.slice(0,3).join(' · ') || station.language || t('radio'))}</small><div class="internet-card-meta">${meta}</div></div><div class="internet-card-actions"><button class="internet-icon-action" type="button" data-radio-action="play" data-id="${escapeHTML(station.id)}" title="${escapeHTML(t('play'))}" aria-label="${escapeHTML(t('play'))}">${icon('play')}</button><button class="internet-icon-action ${saved ? 'is-saved' : ''}" type="button" data-radio-action="save" data-id="${escapeHTML(station.id)}" title="${escapeHTML(saved ? t('remove') : t('save'))}" aria-label="${escapeHTML(saved ? t('remove') : t('save'))}">${icon('heart')}</button></div></article>`;
    }).join('');
  }

  function handleRadioAction(event) {
    const button = event.target.closest('[data-radio-action]'); if (!button) return;
    const id = button.dataset.id;
    const source = radioFilter === 'favorites' ? getStationFavorites() : radioResults;
    const station = source.find(item => item.id === id) || getStationFavorites().find(item => item.id === id);
    if (!station) return;
    if (button.dataset.radioAction === 'play') playStation(station);
    if (button.dataset.radioAction === 'save') toggleRadioFavorite(station);
  }

  function toggleRadioFavorite(station) {
    const index = radioFavorites.findIndex(item => item.id === station.id);
    if (index >= 0) { radioFavorites.splice(index, 1); setStatus('#radioStatus', t('stationRemoved')); }
    else { radioFavorites.unshift(station); radioFavorites = radioFavorites.slice(0, 300); setStatus('#radioStatus', t('stationSaved')); }
    writeArray(keys.radioStations, radioFavorites); renderRadioResults();
  }

  function addCustomStation(event) {
    event.preventDefault();
    const name = $('#customStationName').value.trim() || t('customStation');
    const streamUrl = isWebUrl($('#customStationUrl').value.trim());
    if (!streamUrl) { setStatus('#radioStatus', t('invalidStream'), true); return; }
    const station = { id: `custom-${Date.now()}`, name, streamUrl, country: '', codec: '', bitrate: 0, tags: [locale === 'ru' ? 'Собственная' : locale === 'de' ? 'Eigener Sender' : 'Custom'] };
    radioFavorites.unshift(station); radioFavorites = radioFavorites.slice(0, 300); writeArray(keys.radioStations, radioFavorites);
    $('#customStationName').value = ''; $('#customStationUrl').value = '';
    radioFilter = 'favorites'; syncFilterButtons(); renderRadioResults(); setStatus('#radioStatus', t('stationAdded'));
  }

  async function playStation(station) {
    const streamUrl = isWebUrl(station.streamUrl);
    if (!streamUrl) { setCurrentStatus(t('invalidStream'), true); return; }
    const localAudio = $('#audioElement'); if (localAudio && !localAudio.paused) localAudio.pause();
    currentStream = {
      type: 'radio', id: station.id, title: station.name,
      subtitle: [station.country, station.codec].filter(Boolean).join(' · '),
      url: streamUrl, image: station.favicon || '', item: station
    };
    await startStream();
    if (window.foxsmusic?.countRadioStationClick && !String(station.id).startsWith('custom-')) window.foxsmusic.countRadioStationClick(station.id).catch(() => {});
  }

  function saveJamendoClient() {
    const value = $('#jamendoClientInput').value.trim();
    if (!/^[a-z0-9]{6,64}$/i.test(value)) { setStatus('#onlineStatus', t('clientIdRequired'), true); return; }
    jamendoClientId = value; localStorage.setItem(keys.jamendoClient, value); setStatus('#onlineStatus', t('clientIdSaved'));
  }

  async function searchOnline(query, field = 'track') {
    if (!jamendoClientId) { setStatus('#onlineStatus', t('clientIdRequired')); $('#jamendoClientInput')?.focus(); return; }
    if (!window.foxsmusic?.searchOnlineMusic) { setStatus('#onlineStatus', t('missingBridge'), true); return; }
    onlineFilter = 'catalog'; syncFilterButtons(); setStatus('#onlineStatus', t('onlineLoading')); $('#onlineResults').innerHTML = '';
    try {
      onlineResults = await window.foxsmusic.searchOnlineMusic(String(query || '').trim(), jamendoClientId, field);
      if (!Array.isArray(onlineResults)) onlineResults = [];
      renderOnlineResults();
      setStatus('#onlineStatus', onlineResults.length ? `${onlineResults.length} · ${t('licensedMusic')}` : t('onlineEmptyText'));
    } catch (error) {
      console.warn('FoxsMusic online search failed', error);
      setStatus('#onlineStatus', t('onlineError'), true);
    }
  }

  function renderOnlineResults() {
    const target = $('#onlineResults'); if (!target) return;
    const items = onlineResults.filter(item => isWebUrl(item.audioUrl));
    if (!items.length) { target.innerHTML = `<div class="internet-empty"><strong>${escapeHTML(t('onlineEmptyTitle'))}</strong>${escapeHTML(t('onlineEmptyText'))}</div>`; return; }
    target.innerHTML = items.map(track => onlineTrackCard(track)).join('');
  }

  function renderOnlineFavorites() {
    const target = $('#onlineResults'); if (!target) return;
    const items = onlineFavorites.filter(item => isWebUrl(item.audioUrl));
    if (!items.length) { target.innerHTML = `<div class="internet-empty"><strong>${escapeHTML(t('savedTracks'))}</strong>${escapeHTML(t('noSavedTracks'))}</div>`; return; }
    target.innerHTML = items.map(track => onlineTrackCard(track)).join('');
  }

  function onlineTrackCard(track) {
    const saved = onlineFavorites.some(item => item.id === track.id);
    const image = isWebUrl(track.image) ? `<img src="${escapeHTML(track.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : icon('music');
    const meta = [track.album, track.duration ? formatTime(track.duration) : ''].filter(Boolean).map(value => `<span class="internet-meta-pill">${escapeHTML(value)}</span>`).join('');
    const license = track.licenseUrl ? `<a class="internet-link" href="${escapeHTML(track.licenseUrl)}" target="_blank" rel="noreferrer">${escapeHTML(t('license'))}</a>` : '';
    return `<article class="internet-card"><div class="internet-art">${image}</div><div class="internet-card-copy"><strong title="${escapeHTML(track.title)}">${escapeHTML(track.title)}</strong><small>${escapeHTML(track.artist || 'Jamendo')}</small><div class="internet-card-meta">${meta}${license ? `<span class="internet-meta-pill">${license}</span>` : ''}</div></div><div class="internet-card-actions"><button class="internet-icon-action" type="button" data-online-action="play" data-id="${escapeHTML(track.id)}" title="${escapeHTML(t('play'))}" aria-label="${escapeHTML(t('play'))}">${icon('play')}</button><button class="internet-icon-action ${saved ? 'is-saved' : ''}" type="button" data-online-action="save" data-id="${escapeHTML(track.id)}" title="${escapeHTML(saved ? t('remove') : t('save'))}" aria-label="${escapeHTML(saved ? t('remove') : t('save'))}">${icon('heart')}</button></div></article>`;
  }

  function handleOnlineAction(event) {
    const button = event.target.closest('[data-online-action]'); if (!button) return;
    const id = button.dataset.id;
    const track = [...onlineResults, ...onlineFavorites].find(item => item.id === id);
    if (!track) return;
    if (button.dataset.onlineAction === 'play') playOnlineTrack(track);
    if (button.dataset.onlineAction === 'save') toggleOnlineFavorite(track);
  }

  function toggleOnlineFavorite(track) {
    const index = onlineFavorites.findIndex(item => item.id === track.id);
    if (index >= 0) onlineFavorites.splice(index, 1);
    else onlineFavorites.unshift(track);
    onlineFavorites = onlineFavorites.slice(0, 300); writeArray(keys.onlineTracks, onlineFavorites);
    if (onlineFilter === 'favorites') renderOnlineFavorites(); else renderOnlineResults();
  }

  async function playOnlineTrack(track) {
    const streamUrl = isWebUrl(track.audioUrl);
    if (!streamUrl) { setCurrentStatus(t('streamError'), true); return; }
    const localAudio = $('#audioElement'); if (localAudio && !localAudio.paused) localAudio.pause();
    currentStream = { type: 'online', id: track.id, title: track.title, subtitle: track.artist || 'Jamendo', url: streamUrl, image: track.image || '', item: track };
    await startStream();
  }

  async function startStream() {
    try {
      streamAudio.pause();
      streamAudio.src = currentStream.url;
      streamAudio.load();
      // Internet audio is controlled from the original bottom player bar.
      const bar = $('#internetPlayerBar'); if (bar) bar.hidden = true;
      updatePlayerBar();
      await streamAudio.play();
      updatePlayerBar();
    } catch (error) {
      console.warn('FoxsMusic internet stream playback failed', error);
      setCurrentStatus(t('streamError'), true);
      updatePlayerBar();
    }
  }

  function isActive() { return Boolean(currentStream); }

  function toggleStream() {
    if (!currentStream) return;
    if (streamAudio.paused) streamAudio.play().then(updatePlayerBar).catch(() => setCurrentStatus(t('streamError'), true));
    else streamAudio.pause();
    updatePlayerBar();
  }

  function stopStream() {
    streamAudio.pause();
    try { streamAudio.removeAttribute('src'); streamAudio.load(); } catch (_) {}
    currentStream = null;
    const bar = $('#internetPlayerBar'); if (bar) bar.hidden = true;
    renderBottomPlayer();
    window.dispatchEvent(new CustomEvent('foxsmusic:internet-stream-changed'));
  }

  function getAdjacentItems() {
    if (!currentStream) return [];
    if (currentStream.type === 'radio') {
      const combined = [...radioResults, ...getStationFavorites()];
      if (currentStream.item) combined.unshift(currentStream.item);
      const seen = new Set();
      return combined.filter(item => item && isWebUrl(item.streamUrl) && !seen.has(item.id) && seen.add(item.id));
    }
    const combined = [...onlineResults, ...onlineFavorites];
    if (currentStream.item) combined.unshift(currentStream.item);
    const seen = new Set();
    return combined.filter(item => item && isWebUrl(item.audioUrl) && !seen.has(item.id) && seen.add(item.id));
  }

  function playAdjacentStream(direction) {
    if (!currentStream) return false;
    const items = getAdjacentItems();
    if (!items.length) return false;
    const currentIndex = items.findIndex(item => item.id === currentStream.id);
    if (items.length === 1) { toggleStream(); return true; }
    const index = currentIndex < 0
      ? (direction > 0 ? 0 : items.length - 1)
      : (currentIndex + (direction < 0 ? -1 : 1) + items.length) % items.length;
    if (currentStream.type === 'radio') void playStation(items[index]);
    else void playOnlineTrack(items[index]);
    return true;
  }

  let lastStreamVolume = 0.76;
  function setStreamVolume(value) {
    const volume = Math.max(0, Math.min(1, Number(value) || 0));
    streamAudio.volume = volume;
    streamAudio.muted = volume === 0;
    if (volume > 0) lastStreamVolume = volume;
    updatePlayerBar();
  }

  function toggleStreamMute() {
    if (streamAudio.muted || streamAudio.volume === 0) {
      streamAudio.muted = false;
      streamAudio.volume = lastStreamVolume || 0.76;
    } else {
      lastStreamVolume = streamAudio.volume;
      streamAudio.muted = true;
    }
    updatePlayerBar();
  }

  function localizeTransportText(key) {
    const labels = {
      ru: { stop: 'Остановить радио', previousStation: 'Предыдущая станция', nextStation: 'Следующая станция', previousTrack: 'Предыдущий онлайн-трек', nextTrack: 'Следующий онлайн-трек', radioLive: 'РАДИО В ЭФИРЕ', radioPaused: 'РАДИО НА ПАУЗЕ', onlineLive: 'ОНЛАЙН · ВОСПРОИЗВЕДЕНИЕ', onlinePaused: 'ОНЛАЙН · ПАУЗА', play: 'Продолжить', pause: 'Пауза' },
      en: { stop: 'Stop stream', previousStation: 'Previous station', nextStation: 'Next station', previousTrack: 'Previous online track', nextTrack: 'Next online track', radioLive: 'RADIO LIVE', radioPaused: 'RADIO PAUSED', onlineLive: 'ONLINE · PLAYING', onlinePaused: 'ONLINE · PAUSED', play: 'Resume', pause: 'Pause' },
      de: { stop: 'Stream stoppen', previousStation: 'Vorheriger Sender', nextStation: 'Nächster Sender', previousTrack: 'Vorheriger Online-Titel', nextTrack: 'Nächster Online-Titel', radioLive: 'RADIO LIVE', radioPaused: 'RADIO PAUSIERT', onlineLive: 'ONLINE · WIEDERGABE', onlinePaused: 'ONLINE · PAUSE', play: 'Fortsetzen', pause: 'Pause' }
    };
    return (labels[locale] || labels.ru)[key] || key;
  }

  function renderBottomPlayer() {
    const active = Boolean(currentStream);
    document.body.classList.toggle('internet-stream-active', active);
    document.body.classList.toggle('internet-radio-live', active && currentStream.type === 'radio');
    const bar = $('#internetPlayerBar'); if (bar) bar.hidden = true;
    if (!active) {
      $('#nowFavoriteBtn')?.removeAttribute('hidden');
      $('#shuffleBtn')?.removeAttribute('hidden');
      $('#repeatBtn')?.removeAttribute('hidden');
      $('#seekBar')?.removeAttribute('disabled');
      $('#npSeekBar')?.removeAttribute('disabled');
      return false;
    }

    const playing = !streamAudio.paused && !streamAudio.ended;
    document.body.classList.toggle('is-playing', playing);
    const title = $('#nowTitle'); if (title) title.textContent = currentStream.title || 'FoxsMusic';
    const artist = $('#nowArtist'); if (artist) artist.textContent = currentStream.subtitle || (currentStream.type === 'radio' ? 'Internet radio' : 'Jamendo');
    const status = $('#nowStatus'); if (status) status.textContent = currentStream.type === 'radio'
      ? localizeTransportText(playing ? 'radioLive' : 'radioPaused')
      : localizeTransportText(playing ? 'onlineLive' : 'onlinePaused');

    const cover = $('#nowCover');
    if (cover) {
      const image = isWebUrl(currentStream.image) ? currentStream.image : 'assets/foxsmusic-logo.png';
      cover.removeAttribute('data-track-artwork');
      if (cover.getAttribute('src') !== image) cover.src = image;
      cover.onerror = () => { cover.onerror = null; cover.src = 'assets/foxsmusic-logo.png'; };
    }

    const stopButton = $('#nowFavoriteBtn');
    if (stopButton) {
      stopButton.hidden = false;
      stopButton.innerHTML = icon('stop');
      stopButton.title = localizeTransportText('stop');
      stopButton.setAttribute('aria-label', localizeTransportText('stop'));
      stopButton.setAttribute('aria-pressed', 'false');
    }
    const playButton = $('#playBtn');
    if (playButton) {
      playButton.innerHTML = icon(playing ? 'pause' : 'play');
      playButton.title = localizeTransportText(playing ? 'pause' : 'play');
      playButton.setAttribute('aria-label', playButton.title);
    }
    const previous = $('#previousBtn'); const next = $('#nextBtn');
    if (previous) { previous.title = localizeTransportText(currentStream.type === 'radio' ? 'previousStation' : 'previousTrack'); previous.setAttribute('aria-label', previous.title); }
    if (next) { next.title = localizeTransportText(currentStream.type === 'radio' ? 'nextStation' : 'nextTrack'); next.setAttribute('aria-label', next.title); }
    $('#shuffleBtn')?.setAttribute('hidden', '');
    $('#repeatBtn')?.setAttribute('hidden', '');
    $('#seekBar')?.setAttribute('disabled', '');
    $('#npSeekBar')?.setAttribute('disabled', '');
    const currentTime = $('#currentTime'); if (currentTime) currentTime.textContent = 'LIVE';
    const duration = $('#durationText'); if (duration) duration.textContent = 'LIVE';
    const npCurrent = $('#npCurrentTime'); if (npCurrent) npCurrent.textContent = 'LIVE';
    const npDuration = $('#npDuration'); if (npDuration) npDuration.textContent = 'LIVE';

    const volume = $('#volumeBar');
    if (volume) { volume.value = String(Math.round(streamAudio.volume * 100)); volume.style.setProperty('--range-fill', `${Math.round(streamAudio.volume * 100)}%`); }
    const mute = $('#muteBtn');
    if (mute) {
      mute.innerHTML = icon(streamAudio.muted || streamAudio.volume === 0 ? 'muted' : 'volume');
      mute.classList.toggle('active', streamAudio.muted || streamAudio.volume === 0);
    }

    const overlay = $('#nowPlayingOverlay');
    if (overlay && !overlay.hidden) {
      const nowCover = $('#nowPlayingCover');
      if (nowCover) nowCover.src = isWebUrl(currentStream.image) ? currentStream.image : 'assets/foxsmusic-logo.png';
      const backdrop = $('#nowPlayingBackdrop');
      if (backdrop) backdrop.style.backgroundImage = 'linear-gradient(120deg,rgba(8,4,7,.84),rgba(22,4,10,.72))';
      const nowTitle = $('#nowPlayingTitle'); if (nowTitle) nowTitle.textContent = currentStream.title || 'FoxsMusic';
      const nowArtist = $('#nowPlayingArtist'); if (nowArtist) nowArtist.textContent = currentStream.subtitle || 'FoxsMusic';
      const npPlay = $('#npPlayBtn'); if (npPlay) { npPlay.innerHTML = icon(playing ? 'pause' : 'play'); npPlay.setAttribute('aria-label', localizeTransportText(playing ? 'pause' : 'play')); }
    }
    return true;
  }

  function updatePlayerBar() {
    const bar = $('#internetPlayerBar'); if (bar) bar.hidden = true;
    renderBottomPlayer();
  }

  function setCurrentStatus(message, error = false) {
    if (currentPage === 'online') setStatus('#onlineStatus', message, error);
    else if (currentPage === 'radio') setStatus('#radioStatus', message, error);
  }

  function formatTime(value) {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  createWorkspace();
  window.foxOnline = {
    stopStream, setLocale, syncHeading,
    isActive, toggleStream, playAdjacentStream,
    setStreamVolume, toggleStreamMute, renderBottomPlayer
  };
})();
