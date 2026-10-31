'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const packagePath = path.join(root, 'package.json');
const appPath = path.join(root, 'app.json');
const configTestPath = path.join(root, 'tests', 'config.test.cjs');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

if (!fs.existsSync(packagePath) || !fs.existsSync(appPath)) {
  console.error('Run this script from the mobile project folder (the folder containing package.json and app.json).');
  process.exit(1);
}

const pkg = readJson(packagePath);
if (pkg.name !== 'foxsmusic-mobile') {
  console.error(`Unexpected project: ${pkg.name || '(no package name)'}. Refusing to edit files.`);
  process.exit(1);
}

const appJson = readJson(appPath);
const expo = appJson.expo;
if (!expo || typeof expo !== 'object') {
  throw new Error('app.json does not contain an expo configuration object.');
}

const oldSplash = expo.splash && typeof expo.splash === 'object' ? expo.splash : {};
const splashImage = oldSplash.image || './assets/splash.png';
const splashBackground = oldSplash.backgroundColor || '#08070a';
const splashResizeMode = ['contain', 'cover', 'native'].includes(oldSplash.resizeMode)
  ? oldSplash.resizeMode
  : 'contain';

const plugins = Array.isArray(expo.plugins) ? [...expo.plugins] : [];
const splashPluginIndex = plugins.findIndex(plugin =>
  plugin === 'expo-splash-screen' ||
  (Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')
);
const splashPlugin = [
  'expo-splash-screen',
  {
    image: splashImage,
    imageWidth: 180,
    resizeMode: splashResizeMode,
    backgroundColor: splashBackground
  }
];

if (splashPluginIndex >= 0) plugins[splashPluginIndex] = splashPlugin;
else plugins.push(splashPlugin);

expo.plugins = plugins;
delete expo.splash;
fs.writeFileSync(appPath, `${JSON.stringify(appJson, null, 2)}\n`, 'utf8');

const configTest = `'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const packageConfig = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function findPlugin(name) {
  return appConfig.plugins.find(plugin =>
    plugin === name || (Array.isArray(plugin) && plugin[0] === name)
  );
}

test('mobile project has a distinct Android application identity', () => {
  assert.equal(packageConfig.name, 'foxsmusic-mobile');
  assert.equal(appConfig.slug, 'foxsmusic-android');
  assert.equal(appConfig.android.package, 'com.artyomreddarkfox.foxsmusic.mobile');
  assert.notEqual(appConfig.android.package, 'com.artyomreddarkfox.foxsmusic');
});

test('background playback is enabled without microphone recording permission', () => {
  const audioPlugin = findPlugin('expo-audio');
  assert.ok(audioPlugin, 'expo-audio config plugin should be present');
  assert.equal(audioPlugin[1].enableBackgroundPlayback, true);
  assert.equal(audioPlugin[1].enableBackgroundRecording, false);
  assert.equal(audioPlugin[1].recordAudioAndroid, false);
  assert.ok(appConfig.android.permissions.includes('POST_NOTIFICATIONS'));
});

test('splash screen uses the SDK-supported config plugin', () => {
  assert.equal(Object.hasOwn(appConfig, 'splash'), false, 'legacy top-level splash config should be removed');
  const splashPlugin = findPlugin('expo-splash-screen');
  assert.ok(Array.isArray(splashPlugin), 'expo-splash-screen config plugin should be configured');
  assert.equal(splashPlugin[1].image, './assets/splash.png');
  assert.equal(splashPlugin[1].backgroundColor, '#08070a');
});

test('Android icon and splash assets exist', () => {
  const splashPlugin = findPlugin('expo-splash-screen');
  for (const relativePath of [
    appConfig.icon,
    splashPlugin[1].image,
    appConfig.android.adaptiveIcon.foregroundImage,
  ]) {
    assert.ok(fs.existsSync(path.join(root, relativePath)), 'asset should exist: ' + relativePath);
  }
});

test('preview EAS profile creates an installable APK', () => {
  const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
  assert.equal(eas.build.preview.distribution, 'internal');
  assert.equal(eas.build.preview.android.buildType, 'apk');
});
`;

// Avoid replacing unrelated custom test changes: require the expected file to be the starter test.
if (fs.existsSync(configTestPath)) {
  const existing = fs.readFileSync(configTestPath, 'utf8');
  if (!existing.includes("test('Android icon and splash assets exist'")) {
    throw new Error('tests/config.test.cjs does not match the expected starter test; left it unchanged.');
  }
  fs.writeFileSync(configTestPath, configTest, 'utf8');
}

console.log('Updated app.json to the expo-splash-screen config plugin.');
console.log('Updated tests/config.test.cjs to verify the SDK 58 splash configuration.');
console.log('Next run: npx expo install expo-asset expo-splash-screen');
console.log('Then run: npx expo install --fix');
console.log('Finally run: npm test && npx expo-doctor');
