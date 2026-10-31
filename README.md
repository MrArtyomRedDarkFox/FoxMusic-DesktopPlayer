
## FoxsMusic Player Pro 1.3.14

This update expands everyday playback and library management:

- **Crossfade and volume normalization:** use the Audio Studio controls; the crossfade duration is adjustable and short tracks use a shorter fade window.
- **Queue and history:** build and reorder the upcoming queue, remove individual queued tracks, or clear the queue without stopping the current song. Playback history keeps the latest 100 tracks.
- **Backup and restore:** export library metadata, settings, playlists, queue and history as JSON. Original audio is not embedded; keep the music folder separately backed up.
- **Metadata editor:** edit the title, artist, album, genre and year stored by FoxsMusic. This does not write tags back into the original audio file.
- **Hotkeys and Now Playing:** use playback shortcuts and the fullscreen Now Playing overlay.
- **GitHub Releases updater:** the tagged-release workflow publishes Windows/Linux installers and the updater metadata required by electron-updater. Before publishing, make sure `build.publish.owner` and `build.publish.repo` in `package.json` exactly match the real GitHub repository.
- **Exact duplicate files in a selected source folder:** analysis compares byte-identical files with SHA-256. When confirmed, redundant copies are moved to the operating system Recycle Bin/Trash, leaving one copy in the source folder. This affects actual files on disk, not just library entries; inspect the report and do not empty the Recycle Bin until you are sure.

### Publishing a release

1. Commit and push the source code.
2. Verify the GitHub repository owner/repository values in `package.json`.
3. Create and push a version tag matching the package version, for example `v1.3.14`.
4. GitHub Actions builds Windows and Linux packages and publishes the release assets. The in-app updater works only after a valid, published release exists and the app was packaged with this GitHub publisher configuration.


## Per-track import date and time

Each library entry keeps `addedAt` as the exact time it was imported into FoxsMusic. The track list now displays this timestamp down to the minute for every track. The Recently Added smart playlist continues to sort by the original file's modification timestamp (`sourceDateAt`) and labels that value separately as **File modified**; it also displays the FoxsMusic import timestamp underneath. This keeps import time and source-file time visible without confusing the two. Most Played also keeps its play count visible and shows the import timestamp underneath it. The full localized timestamp is available as a row tooltip. Russian, English, and German labels are included.

# FoxsMusic Desktop

**FoxsMusic** — отдельное настольное приложение музыкального плеера в красно-чёрном стиле. Использует Electron и локальные HTML/CSS/JavaScript-файлы: интернет для воспроизведения собственной музыки не нужен.


### Original cover art

FoxsMusic looks for album art embedded in supported audio tags (ID3/FLAC/Vorbis/MP4) using `music-metadata`. If a file has no embedded image, it checks for a matching image beside the audio file (for example `Song.jpg`) and common folder covers (`cover.jpg`, `folder.png`, `album.jpg`, `front.jpg`). Artwork is loaded lazily for visible tracks and the currently playing song. User-selected covers take priority.

## Запуск приложения

### Windows

1. Установи Node.js (LTS): https://nodejs.org/
2. Распакуй папку проекта.
3. Запусти `start.bat`. При первом запуске скрипт загрузит зависимости, поэтому понадобится интернет; последующие запуски можно делать без установки заново.

### Linux (Ubuntu / Fedora)

1. Установи Node.js и npm. Установка через менеджер пакетов системы или https://nodejs.org/.
2. Открой терминал в папке проекта.
3. Выполни:

   ```bash
   chmod +x start.sh
   ./start.sh
   ```

При первом запуске `npm install` загрузит Electron и необходимые пакеты.

## Сборка установщика

Сборку лучше запускать на той ОС, для которой создаётся пакет.

- **Windows:** запусти `build-windows.bat`. В папке `release` появятся установщик `FoxsMusic-1.3.1-Windows-Setup-x64.exe` и `FoxsMusic-1.3.1-Windows-Portable-x64.exe` (название меняется вместе с версией в `package.json`).
- **Linux:** выполни `./build-linux.sh`. В папке `release` появятся AppImage и/или пакет `.deb` для x64.

Требуются Node.js/npm и подключение к интернету на этапе загрузки зависимостей. После сборки готовым приложением можно пользоваться без Node.js.

## Новое в Audio Studio

- Живой спектральный эквалайзер в hero-баннере и панели звуковой студии.
- Настройка скорости воспроизведения от 0.50× до 1.50×.
- Трёхполосный эквалайзер: басы, средние и высокие частоты от −12 до +12 dB.
- Регулируемое усиление выходного сигнала от 50% до 150% с мягким компрессором для снижения риска перегруза.
- Предустановки Flat, Bass+, Vocal и Night.
- Настройки звука сохраняются локально и применяются к последующим трекам.

Открой Audio Studio нажатием на шильдик **SOUND ON** в hero-баннере, на значок шестерёнки в нижней панели или сочетанием **Ctrl + Shift + E** (на macOS — **Cmd + Shift + E**). Это сочетание открывает и закрывает панель звуковой студии. Аудиоэффекты используют Web Audio API; граф создаётся при первом запуске трека.

## Возможности

- Воспроизведение и пауза, предыдущий/следующий трек.
- Перемотка, громкость и отключение звука.
- Перемешивание и три режима повтора: выключен, повтор плейлиста (∞) и повтор одного трека (1).
- Анимированный эквалайзер у текущего трека в библиотеке и очереди воспроизведения.
- Импорт аудиофайлов и целых папок, а также перетаскивание файлов в окно.
- Поиск по названию и исполнителю.
- Избранное, создание собственных плейлистов и добавление треков в подборки.
- Обложки треков.
- Сохранение библиотеки в локальном хранилище приложения (IndexedDB) и настроек в localStorage.
- Анимированный логотип и эффекты, которые можно отключить.

## Хранение музыки и доступ к оригинальным файлам

- Новые треки, добавленные через «Добавить музыку» или «Импортировать папку», хранятся в библиотеке как ссылки на оригинальные файлы по абсолютному пути. Аудиоданные не копируются в IndexedDB.
- В меню трека можно посмотреть исходный путь и выбрать «Показать исходный файл в папке». Windows откроет Проводник с выделенным файлом.
- Если трек был импортирован старой версией, для него исходный путь не сохранён: открой меню трека и выбери «Найти оригинальный файл», чтобы привязать его к существующему файлу на компьютере. Это не удаляет сам файл.
- Если оригинальный файл перемещён или удалён, плеер не сможет его открыть до повторной привязки.
- Библиотека и настройки остаются локальными. Музыка не отправляется на GitHub или в облако. Рекомендуется не удалять и не перемещать исходные музыкальные файлы без необходимости.

## Структура проекта

- `main.cjs` — главное окно Electron и настройки безопасности.
- `index.html` — интерфейс.
- `styles.css` — оформление и анимации.
- `app.js` — проигрыватель и библиотека.
- `assets/` — логотип и иконки приложения.
- `package.json` — зависимости и настройки сборки.


## Исправление анимации эквалайзера

В этой версии визуализатор использует данные частот и формы волны, а также мягкую временную пульсацию как fallback для тихих/ровных аудиофрагментов. Во время воспроизведения центральный баннер получает более заметные эффекты движения. Пересоберите приложение командой `build-windows.bat`.

## Обновление без мерцания при переключении треков

В этой версии изменение состояния воспроизведения обновляет только нижнюю панель и индикаторы активного трека. Список библиотеки и очередь больше не пересоздаются на событиях `play`, `pause` и `loadedmetadata`, поэтому прокрутка и положение элементов должны сохраняться при переключении и паузе.


## Общие настройки

- В верхней панели есть меню настроек с выбором языка интерфейса: русский, английский и немецкий.
- Там же находится переключатель визуальных эффектов. При первом запуске эффекты включены; выбор и язык сохраняются локально.
- Нижняя шестерёнка по-прежнему открывает Audio Studio и не заменяет новое общее меню.


## Author and hero cleanup

- The general settings panel displays the author as `MrArtyomRedDarkFox`, with the label translated into Russian, English, or German.
- Removed the “MADE FOR NIGHT” chip from the hero banner.

## Active folder library

Use **Library folder / Папка библиотеки** in the sidebar to choose a music folder. When a folder is selected, the library and playback queue are limited to audio files found in that folder and its subfolders; tracks play directly from their original paths without duplicating audio in IndexedDB. The selected folder is remembered and rescanned at startup so additions and removals on disk are reflected.

Use the small **×** beside the selected folder path to return to the full local library. Tracks outside the active folder are hidden, not deleted. If the folder is unavailable, choose it again or clear the folder source.



## Очистка импортированной библиотеки

Откройте настройки приложения (верхняя шестерёнка), нажмите «Очистить» в разделе импортированной библиотеки и подтвердите действие. Будут удалены записи треков из локальной базы FoxsMusic и сброшен выбранный источник папки, чтобы при следующем запуске список не восстановился автоматически. Оригинальные аудиофайлы на диске не удаляются. Плейлисты и общие настройки сохраняются.


## Умная библиотека и защита данных

В настройках есть пункт **«Проверить библиотеку»**. Он проверяет доступность оригинальных файлов, ищет точные дубликаты по SHA-256 и подсвечивает недоступные источники. Для старых записей, где аудио было сохранено как Blob, содержимое проверяется только у файлов с совпадающим размером; слишком большие записи пропускаются, чтобы не создавать избыточную нагрузку на память.

В проверке локальных записей удаляются только дублирующие записи базы — сами файлы при этом остаются на диске. Для удаления дубликатов из выбранной исходной папки используй отдельную проверку «Find duplicates in source folder»: после подтверждения лишние побайтно одинаковые файлы перемещаются в системную корзину, оставляя один экземпляр. При объединении записей сохраняются избранное, связи с плейлистами и пользовательская обложка. При импорте того же абсолютного пути повторная запись пропускается. Сканирование не запускается постоянно в фоне.

Если оригинальный файл был перемещён или удалён, трек помечается как недоступный; используйте меню трека → **«Найти оригинальный файл»**, чтобы привязать его заново.


## FoxsMusic Player Pro 1.2.0 — baseline features

This section documents the baseline features retained in the 1.3.1 build. The current Player Pro 1.3.14 includes keyboard shortcut fixes in addition to the retained library, audio, and seasonal visual features.

### Included features

- **Smart library audit:** reports missing original files and exact byte-identical duplicate entries using SHA-256. Files with identical bytes are distinguished from different encodings that merely share a title.
- **Source-folder duplicate cleanup:** scans the selected library source folder, keeps one copy of each byte-identical audio file, re-validates every file before action, and moves only confirmed extra copies to the operating system Recycle Bin/Trash. No source file is removed without explicit confirmation. Never use the library-entry-only cleanup button if you intend to remove files from disk; use the dedicated source-folder duplicate scan.
- **Direct source paths:** imported folder tracks remain linked to their original paths; audio itself is not copied into the library database.
- **Playback queue and history:** saved queue, drag-to-reorder, remove-from-queue, one-click clear queue without stopping the current song, and a bounded recent-history list.
- **Sound studio:** two-deck crossfade, equalizer presets, saved custom EQ presets, playback-rate control, gain/compressor, and optional loudness compensation.
- **Backup and restore:** JSON backup of library metadata, preferences, playlists, playback queue/history, and original-file paths. The backup does not contain original audio; files need to remain accessible at the saved paths. Legacy blob-only imported audio is reported/skipped on restore rather than being falsely represented as a file path.
- **Metadata editor:** edits local FoxsMusic metadata fields (title, artist, album, genre, year). It does not rewrite embedded tags in the original source file in this build.
- **Keyboard/media controls:** Space play/pause; Left/Right seek ±5 seconds; Up/Down adjust volume ±5%; M mute; N/P next/previous; S shuffle; R cycles repeat mode; F fullscreen; Ctrl+K search; Ctrl+Shift+E toggles Sound Studio; Esc closes open dialogs/panels. Letter shortcuts use physical key codes and work with Russian or English keyboard layouts. Media Session actions are also available where supported.
- **Now Playing overlay:** fullscreen album artwork, transport controls and seeking.
- **Updates:** manual update check/download/install UI powered by `electron-updater`; real update delivery requires a matching GitHub Release with generated assets.

### Build

Windows: run `build-windows.bat` or `npm install` followed by `npm run dist:win`.
Linux: run `build-linux.sh` or `npm install` followed by `npm run dist:linux`.

### Publishing updates

The `.github/workflows/release.yml` workflow builds Windows and Linux packages and attaches them to a GitHub Release when a `v*` tag is pushed. Create a versioned tag matching `package.json`, e.g. `v1.3.1`, and push the tag. Before publishing, ensure `build.publish` in `package.json` points to the actual public GitHub repository. The current configured repository is `MrArtyomRedDarkFox/FoxsMusic-Desktop`; change `owner`/`repo` if you use another name.

### Safety notes

- Source-folder duplicate deletion is deliberately exact-content only and recoverable through the OS Recycle Bin/Trash. It never performs a permanent delete.
- Library duplicate cleanup only merges/removes database entries; it does **not** delete original files. To delete duplicate source files, use **Find duplicates in source folder** and explicitly confirm moving the copies to Trash.
- Backups include references/paths rather than the original audio files. Copy the music folder separately if you need a portable full backup.


### 1.3.1 — Playback switching and queue control polish
- Manual track selection, Previous, and Next switch at the current configured volume without fading the outgoing track or fading in the new track. Automatic crossfade near the natural end of a track remains available.
- Fixed the queue remove button layout so it stays inside the row, with a red/black styled accessible control instead of a default browser button.
- Queue remove tooltip follows Russian, English, and German UI language.


## Multi-source Smart Library (1.3.2)

- Add multiple source folders using **Add source folders** in Settings → Smart Library. These roots are used for duplicate scans; the currently displayed folder filter does not change.
- The scan hashes same-size audio files with SHA-256 across all registered roots, including subfolders, and finds byte-identical duplicates between different roots.
- Before cleanup, FoxsMusic displays a report and asks for confirmation. Extra exact copies are moved to the OS Recycle Bin/Trash; one copy per hash group is kept. It never permanently deletes files.
- The currently displayed source folder is preferred as the keeper when it contains a copy. Missing source folders are reported and skipped.
- Removing a source from the checks does not delete any file.


## Version 1.3.3 — optional source-file duplicate cleanup

The library duplicate-record confirmation now includes an unchecked-by-default checkbox to also scan configured source folders and move byte-identical duplicate audio files into the operating-system Recycle Bin/Trash. When enabled, a second confirmation lists a sample of the exact files and explains that one copy per hash group will remain. If the source scan fails or the user cancels the second confirmation, library records are not removed. Files changed after scanning are skipped by the existing main-process revalidation.


## Version 1.3.4 — scrollable duplicate confirmation dialogs

- Long duplicate-file confirmation dialogs are now constrained to the available window height and can be scrolled all the way to the bottom.
- Added a themed scrollbar and contained scroll behavior without changing duplicate-detection or deletion behavior.


### 1.3.6 — Anime Halloween ritual scene

- Adds a stylized anime jack-o'-lantern centered over a glowing pentagram with candles.
- Adds soft animated candle-flame highlights and pumpkin-eye glow; the in-app Effects toggle disables these animations.
- The Christmas and ordinary modes are unchanged.


## Version 1.3.8 — Illustrated Halloween profile

- Replaced the Halloween ritual artwork with a cleaner illustrated, cel-shaded composition that better matches the Christmas scene style.
- Added four side eyes: two horizontal eyes and two angled at ±120 degrees.
- Updated five animated candle-flame overlays and warm halos to match the new artwork.
- Seasonal effects still obey the in-app effects toggle.


## Version 1.3.9 — animated Halloween ritual

- The pumpkin and pentagram are displayed in a centered fixed-aspect SVG stage, so they keep their proportions when the window is maximized.
- The pumpkin eyes and four side eyes blink briefly at staggered intervals.
- Five separate candle illustrations levitate independently; their flame shapes and glow flicker on separate animation layers.
- The global Effects toggle freezes the new Halloween animations.
- The Christmas and ordinary modes, music library, sound settings and playback logic are unchanged.

## Version 1.3.11 — animated skull, pentagram and levitating pumpkin

The Halloween profile now layers a stylized crimson skull behind a separately glowing pentagram and a foreground pumpkin. The pumpkin gently floats vertically; four side eyes blink and independently shift their gaze. Existing floating candles, flickering flames, wind, bats, ghosts and embers remain in the scene. The in-app Visual Effects toggle disables the seasonal motion, and reduced-motion system settings are handled with slower continuous seasonal cycles.
