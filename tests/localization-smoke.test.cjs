const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'preload.cjs'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.match(pkg.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'package version should be a valid semantic version');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
assert.equal(lock.version, pkg.version, 'package-lock version should match package.json');
assert.equal(lock.packages?.['']?.version, pkg.version, 'root package-lock entry should match package.json');
assert.match(app, /const INLINE_TRANSLATIONS = new Map\(Object\.entries\(/, 'inline translation dictionary should exist');
assert.match(app, /for \(const key of Object\.keys\(LANGUAGES\.ru \|\| \{\}\)\)/, 'canonical RU/EN/DE strings should feed the inline translator');
assert.match(app, /function translateInlineSegments\(value\)/, 'composite text translator should exist');
assert.match(app, /new RegExp\(escapeRegExp\(entry\.source\), 'giu'\)/, 'phrase replacement should be case-insensitive');
assert.match(app, /function observeDynamicLocaleContent\(\)/, 'dynamic locale observer should exist');
assert.match(app, /observer\.observe\(document\.body, \{ childList: true, subtree: true, characterData: true, attributes: true/, 'observer should cover dynamically inserted text and attributes');
assert.match(app, /\.track-row', '\.queue-row', '\.playlist-link', '\.custom-studio-preset'/, 'user-provided text should be excluded from auto-translation');
assert.match(app, /captureStaticLocaleContent\(\);\s*applyStaticLocale\(\);\s*document\.documentElement\.lang/, 'locale changes should recapture and reapply saved originals');
assert.match(app, /captureStaticLocaleSubtree\(ui\.modalRoot\)/, 'modal strings should be registered before translation');
assert.match(main, /const DIALOG_COPY = \{[\s\S]*?en: \{[\s\S]*?de: \{/, 'native dialogs should have English and German copy');
assert.match(main, /dialogCopy\(locale\)/, 'main-process dialogs should use the active app locale');
assert.match(preload, /selectAudioFiles: \(allowMultiple = true, locale = 'ru'\)/, 'preload should pass the active locale into native dialogs');
assert.match(styles, /content:attr\(data-drop-hint\)/, 'drag overlay copy should be supplied by the current locale');
const deletePresetStart = app.indexOf(
  'function confirmDeleteCustomEqPreset(name) {'
);

const savePresetStart = app.indexOf(
  'function saveCustomEqPreset()',
  deletePresetStart
);

assert.ok(
  deletePresetStart >= 0 && savePresetStart > deletePresetStart,
  'custom preset delete handler should be defined'
);

const deletePresetSource = app.slice(
  deletePresetStart,
  savePresetStart
);

assert.match(
  deletePresetSource,
  /delete customEqPresets\[name\]/,
  'deleting a preset should remove it from storage'
);

assert.match(
  deletePresetSource,
  /persistSettings\(\)/,
  'deleting a preset should persist settings'
);

assert.match(
  deletePresetSource,
  /renderCustomEqPresets\(\)/,
  'deleting a preset should refresh the preset list'
);

// Verify real phrase coverage for both non-Russian locales, including mixed/dynamic UI copy.
const dictionaryMatch = app.match(/const INLINE_TRANSLATIONS = new Map\(Object\.entries\(([\s\S]*?)\)\.map/);
assert.ok(dictionaryMatch, 'translation dictionary JSON should be extractable');
const dictionary = JSON.parse(dictionaryMatch[1]);
const entries = Object.entries(dictionary).map(([source, values]) => ({ source, en: values[0], de: values[1] })).sort((a, b) => b.source.length - a.source.length);
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function preserveCase(match, translated, locale) {
  const tag = locale === 'de' ? 'de-DE' : 'en-US';
  if (/[А-ЯЁ]/.test(match) && match === match.toLocaleUpperCase('ru-RU')) return translated.toLocaleUpperCase(tag);
  if (/[А-ЯЁ]/.test(match[0] || '') && match[0] === match[0].toLocaleUpperCase('ru-RU')) return translated[0].toLocaleUpperCase(tag) + translated.slice(1);
  return translated;
}
function translate(source, locale) {
  let output = source;
  for (const entry of entries) {
    if (!entry[locale] || entry.source.length < 3) continue;
    output = output.replace(new RegExp(escapeRegExp(entry.source), 'giu'), match => preserveCase(match, entry[locale], locale));
  }
  return output;
}
assert.equal(translate('Настройки', 'en'), 'Settings');
assert.equal(translate('Настройки', 'de'), 'Einstellungen');
assert.equal(translate('Пресет «123» сохранён', 'en'), 'Preset “123” saved');
assert.equal(translate('Пресет «123» сохранён', 'de'), 'Preset „123“ gespeichert');
assert.equal(translate('ПОИСК МУЗЫКИ', 'en'), 'SEARCH MUSIC');
assert.equal(translate('Открыть звуковую студию', 'de'), 'Soundstudio öffnen');
assert.equal(translate('Отпусти, чтобы добавить музыку', 'en'), 'Release to add music');
assert.equal(translate('Отпусти, чтобы добавить музыку', 'de'), 'Loslassen, um Musik hinzuzufügen');

for (const phrase of ['Удалить пресет?', 'Добавить в очередь', 'Поиск музыки, исполнителя...', 'Проверка библиотеки']) {
  assert.ok(app.includes(phrase), `expected translation source phrase: ${phrase}`);
}
console.log('Localization smoke test passed (RU/EN/DE phrase checks).');
