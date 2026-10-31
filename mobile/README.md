# FoxsMusic Mobile — Android 0.3.1

Отдельное нативное приложение FoxsMusic для Android. Desktop-проект на Electron не изменяется: мобильная версия находится в отдельной папке `mobile/`.

## Возможности мобильной версии 0.3.1

- Импорт нескольких аудиофайлов через системный Android picker (Storage Access Framework).
- Поддерживаемые расширения: MP3, M4A, AAC, WAV, FLAC, OGG/OGA и OPUS.
- Выбранные файлы копируются в приватную папку приложения. Для этого не запрашивается полный доступ ко всему хранилищу телефона.
- Локальная библиотека, поиск, избранное и плейлисты.
- Сортировка по дате добавления, названию и исполнителю.
- Фильтрация библиотеки по подключённым папкам и отдельно импортированным файлам.
- Повторное сканирование подключённой папки Music одной кнопкой без повторного выбора разрешения.
- Воспроизведение, пауза, предыдущий/следующий трек, увеличенная шкала перемотки, быстрые переходы ±10 секунд.
- Скорость 0.75× / 1× / 1.25× / 1.5× / 2× и регулировка громкости ползунком/кнопками.
- Повтор трека/очереди и случайный выбор следующего трека кнопкой Next.
- Сохранение метаданных библиотеки, плейлистов, профиля и статистики прослушиваний между запусками.
- Встроенные MP3-обложки APIC и ID3-метаданные (v2.2/v2.3/v2.4), резервные обложки из `cover.jpg`, `folder.jpg`, `album.png` и похожих файлов альбома.
- Профиль с аватаром, HEX-цветом, фоном, стилем карточек и сезонными палитрами Halloween / New Year / Birthday.
- Горизонтальные свайпы для переключения вкладок; вертикальная прокрутка остаётся стандартной.
- Русский, английский и немецкий интерфейс.
- Настроен Expo Audio Android media playback service: фоновое воспроизведение, системное медиа-уведомление и элементы управления на экране блокировки.

## Текущие ограничения

Это нативный Android-плеер, а не полная копия Desktop. Сейчас читаются встроенные ID3v2.2/v2.3/v2.4-теги и APIC/PIC-обложки MP3; также ищутся внешние cover/folder/album/front JPG/PNG в папках альбомов. Встроенные картинки FLAC/M4A/AAC/OGG/OPUS пока не извлекаются. Полноценный DSP-эквалайзер/Audio Studio и двусторонняя синхронизация с Desktop пока не входят в мобильную сборку.

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


## FoxsMusic Mobile 0.3.1

- Исправлено отображение обложек: при импорте MP3 считываются ID3v2.3/2.4 title, artist, album и APIC artwork; изображения сохраняются в приватной папке FoxsMusic.
- При следующем запуске старые MP3-записи без обложки/тегов автоматически обогащаются из исходных файлов, не очищая библиотеку.
- Подключённые папки используют копирование изображений через новый Expo File API с резервным legacy-путём.
- Сезонные режимы теперь меняют акцент, оттенок карточек, атмосферу фона и набор анимированных частиц: Halloween, New Year и Birthday.
- В плеере добавлены скорость 0.75× / 1× / 1.25× / 1.5× / 2×, регулировка громкости ползунком и кнопками ±5%, быстрый переход на 10 секунд назад/вперёд.
- Горизонтальный свайп между вкладками распознаётся отдельно от вертикальной прокрутки списка и настроек.
- Обложка текущего трека передаётся в системный медиаплеер Android, когда она доступна.
- Версия повышена до 0.3.1, Android versionCode — 7. AsyncStorage key и формат библиотеки version 1 сохранены.

### Ограничение по обложкам

Встроенные обложки поддерживаются сейчас для MP3 (ID3v2.3/2.4 APIC). Для FLAC/M4A и других форматов продолжают использоваться изображения `cover.jpg`, `folder.jpg`, `album.png` и аналогичные файлы рядом с музыкой.

## FoxsMusic Mobile 0.3.0

- Увеличены активные зоны кнопок и ползунок перемотки.
- Свайпы между вкладками и мягкая анимация смены экранов.
- Автоматические подборки «Недавно добавленные» и «Часто прослушиваемые».
- Счётчик прослушиваний и время последнего запуска для каждого трека.
- Дата исходного файла, фильтр музыкальных папок и подключённая Music-папка.
- Полная настройка профиля: имя, аватар, акцентный цвет, цвет фона, стиль карточек и сезонные режимы.
