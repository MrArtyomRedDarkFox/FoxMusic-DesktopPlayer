'use strict';

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
