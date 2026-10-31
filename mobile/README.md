# FoxsMusic Mobile — Android 0.2.0

Отдельное нативное приложение FoxsMusic для Android. Desktop-проект на Electron не изменяется: мобильная версия находится в отдельной папке `mobile/`.

## Что уже входит в первую версию

- Импорт нескольких аудиофайлов через системный Android picker (Storage Access Framework).
- Поддерживаемые расширения: MP3, M4A, AAC, WAV, FLAC, OGG/OGA и OPUS.
- Выбранные файлы копируются в приватную папку приложения. Для этого не запрашивается полный доступ ко всему хранилищу телефона.
- Локальная библиотека, поиск, избранное и плейлисты.
- Сортировка по дате добавления, названию и исполнителю.
- Фильтрация библиотеки по подключённым папкам и отдельно импортированным файлам.
- Повторное сканирование подключённой папки Music одной кнопкой без повторного выбора разрешения.
- Воспроизведение, пауза, предыдущий/следующий трек, переход по шкале времени.
- Повтор трека/очереди и случайный выбор следующего трека кнопкой Next.
- Сохранение метаданных библиотеки между запусками приложения.
- Русский, английский и немецкий интерфейс.
- Настроен Expo Audio Android media playback service: фоновое воспроизведение, системное медиа-уведомление и элементы управления на экране блокировки.

## Что пока не входит

Это первый Android MVP, а не полная копия Desktop. Пока нет DSP-эквалайзера/Audio Studio, извлечения встроенных обложек и тегов из всех форматов, двусторонней синхронизации с Desktop и переноса самих аудиофайлов через Desktop JSON backup. Эти функции стоит добавлять отдельными этапами после проверки базового Android-плеера на реальном телефоне.

## Требования

- Node.js 22.13 или новее (на SDK 58 используется React Native 0.88).
- npm.
- Для локальной сборки: Android Studio, Android SDK и настроенный эмулятор/USB debugging.
- Для облачной APK-сборки: аккаунт Expo и EAS CLI.

## Установка и запуск

Из корня репозитория:

```bash
cd mobile
npm install
npm test
npx expo-doctor
```

Для запуска Metro/быстрого UI-предпросмотра:

```bash
npx expo start
```

Для полноценной проверки фонового воспроизведения используйте native development/preview build: настройки foreground media service применяются config plugin при нативной сборке. Expo Go может не содержать нужные сгенерированные Android manifest-настройки.

## Сборка APK для телефона

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Профиль `preview` настроен на установочный APK (`android.buildType: apk`). После успешной сборки EAS покажет ссылку на APK; скачайте файл на Android и установите его, разрешив установку приложений из выбранного источника.

Для Google Play позже используется production-профиль, который собирает Android App Bundle:

```bash
eas build --platform android --profile production
```

## Структура

```text
mobile/
  App.js                  # UI, библиотека и управление воспроизведением
  app.json                # Expo/Android и background audio config plugin
  eas.json                # preview APK и production AAB профили
  src/core.js             # чистые функции импорта/форматирования
  tests/core.test.cjs     # Node.js unit tests
  assets/                 # приложение icon/adaptive icon/splash
```

## Приватность и файлы

Приложение открывает системный picker только после нажатия пользователем «Добавить музыку». Выбранные аудиофайлы копируются в `Paths.document` приложения, чтобы доступ к ним сохранялся между перезапусками. Это занимает место во внутреннем хранилище приложения; удаление FoxsMusic удалит и эти копии. Исходные файлы пользователя не изменяются.


### Music folder sync (Android)

On the Library screen, choose **Connect Music folder** and select the device's `Music` folder in the Android system folder picker. FoxsMusic stores the granted folder URI and scans that folder (including subfolders) after later launches, importing only files not already in the in-app library. You can select another folder again from the same row. Android requires the user to grant this folder access; the app does not silently scan the whole device.

Audio files selected through the file picker are copied sequentially into FoxsMusic's private Documents storage. This avoids retaining short-lived picker-cache URIs as library entries.


## FoxsMusic Mobile 0.3.0

- Larger touch targets across the mobile UI and a 68 px playback seek area with a 26 px thumb.
- Swipe navigation between Library, Playlists, Player and Settings, with a short fade/slide transition.
- Smart playlists: Recently added and Most played. Play counts and last-played timestamps are stored separately from the track queue to avoid rebuilding playback when stats change.
- Track rows show the source file date (creation timestamp where the platform provides it, otherwise the modification timestamp). For connected folders, FoxsMusic can use `cover.jpg`, `cover.jpeg`, `cover.png`, `folder.jpg`, `folder.png`, `album.jpg`, `album.png`, `front.jpg` or `front.png` in each album folder as the artwork. This is a folder-cover fallback; the current Expo MVP does not yet read embedded ID3/FLAC artwork or tags from every codec.
- Profile settings: display name, avatar, accent color presets/custom HEX, background color, card style, seasonal effects (Halloween/Christmas/Birthday), a custom image background, image removal and a profile appearance reset.
- Existing library, playlists and Music-folder permissions remain stored under the existing AsyncStorage keys and version-1 payload; new settings and playback statistics are additive.

The custom background/avatar images are copied into the app-private Documents directory. Resetting the profile removes those copies but does not delete audio files, playlists or library metadata.
