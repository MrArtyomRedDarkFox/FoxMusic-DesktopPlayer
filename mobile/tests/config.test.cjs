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


test('mobile branding keeps the DP header mark and uses the fox emblem in the center banner and empty/loading states', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.ok(fs.existsSync(path.join(root, 'assets', 'foxsmusic-logo.png')));
  assert.match(appSource, /FOXSMUSIC ORIGINAL/);
  assert.match(appSource, /Image source={require\('\.\/assets\/foxsmusic-logo\.png'\)} style={styles\.compactHeroLogo}/);
  assert.match(appSource, /Image source={require\('\.\/assets\/desktop-logo\.png'\)} style={styles\.brandMarkImage}/);
  assert.match(appSource, /require\('\.\/assets\/foxsmusic-logo\.png'\)/);
  assert.doesNotMatch(appSource, /fox-headphones\.png/);
});

test('connected Music folder is remembered and rescanned after app launch', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /MUSIC_FOLDER_KEY/);
  assert.match(appSource, /requestDirectoryPermissionsAsync\(initialMusicUri \|\| undefined\)/);
  assert.match(appSource, /scanMusicFolderContents\(savedFolderUri, savedTracks\)/);
  assert.match(appSource, /sourceFolder: relativeFolder \|\| folderName/);
});

test('audio picker imports are copied sequentially into persistent app storage', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /MAX_IMPORT_FILES = 250/);
  assert.match(appSource, /await LegacyFileSystem\.copyAsync\(\{ from: asset\.uri, to: destination \}\)/);
  assert.doesNotMatch(appSource, /using cache URI/);
});


test('player timeline has a large touch target, a larger thumb, and drag seeking', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /PanResponder\.create/);
  assert.match(appSource, /onPanResponderMove/);
  assert.match(appSource, /styles\.seekTouchArea/);
  assert.match(appSource, /seekTouchArea: \{ height: 68/);
  assert.match(appSource, /seekKnob: \{[^}]*width: 26, height: 26/);
  assert.match(appSource, /accessibilityRole=\"adjustable\"/);
});


test('library exposes sorting and source-folder filtering controls', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /sortMode/);
  assert.match(appSource, /sortRecent/);
  assert.match(appSource, /sortTitle/);
  assert.match(appSource, /sortArtist/);
  assert.match(appSource, /sourceFilter/);
  assert.match(appSource, /sourceFolders/);
  assert.match(appSource, /track\.sourceFolder/);
});

test('connected Music folder can be rescanned without reopening the system picker', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /async function rescanConnectedMusicFolder\(\)/);
  assert.match(appSource, /scanMusicFolderContents\(musicFolderUri, tracks\)/);
  assert.match(appSource, /onPress=\{rescanConnectedMusicFolder\}/);
});

test('mobile release versions are consistent and Android versionCode is incremented', () => {
  assert.equal(packageConfig.version, '0.3.1');
  assert.equal(appConfig.version, '0.3.1');
  assert.equal(appConfig.android.versionCode, 7);
});


test('profile appearance supports custom colors, backgrounds, avatar and seasonal modes', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  for (const token of ['backgroundImageUri', 'avatarUri', 'accentColor', 'backgroundColor', 'panelStyle', 'halloween', 'christmas', 'birthday', 'resetProfile', 'pickProfileImage']) {
    assert.ok(appSource.includes(token), `missing profile feature token: ${token}`);
  }
});

test('smart playlists and listening statistics are persisted', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /smartRecent/);
  assert.match(appSource, /smartFrequent/);
  assert.match(appSource, /playStats/);
  assert.match(appSource, /lastPlayedAt/);
});

test('folder scan supports original folder cover images and file modification timestamps', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /cover\.jpg/);
  assert.match(appSource, /artworkUri: folderArtwork/);
  assert.match(appSource, /originalModifiedAt/);
});

test('app supports swipe navigation, screen transitions and optimized FlatList rendering', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /navigateSwipe/);
  assert.match(appSource, /Animated\.timing/);
  assert.match(appSource, /initialNumToRender/);
  assert.match(appSource, /maxToRenderPerBatch/);
});


test('package and lockfile versions stay in sync for mobile release', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  assert.equal(lock.version, packageConfig.version);
  assert.equal(lock.packages[''].version, packageConfig.version);
});


test('embedded MP3 artwork parser is connected to both import and library repair', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  const coreSource = fs.readFileSync(path.join(root, 'src', 'core.js'), 'utf8');
  assert.match(coreSource, /function parseId3v2Tag/);
  assert.match(coreSource, /frameId === 'TIT2'/);
  assert.match(coreSource, /frameId === 'TPE1'/);
  assert.match(coreSource, /frameId === 'TALB'/);
  assert.match(coreSource, /id === 'APIC'/);
  assert.match(appSource, /await extractMp3Metadata\(destination, id\)/);
  assert.match(appSource, /artworkUri: metadata\.artworkUri \|\| null/);
  assert.match(appSource, /FoxsMusic: embedded MP3 tags could not be read/);
});

test('season mode changes the app palette and exposes themed particles', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /const SEASON_THEMES =/);
  assert.match(appSource, /const seasonTheme = SEASON_THEMES\[profile\.season\]/);
  assert.match(appSource, /const accentColor = seasonTheme\?\.accent/);
  assert.match(appSource, /seasonAtmosphere/);
  assert.match(appSource, /SeasonalEffects season=\{profile\.season\} theme=\{seasonTheme\}/);
});

test('player provides persisted playback speed, volume control and ten-second seeking', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /playlist\.playbackRate = playbackRate/);
  assert.match(appSource, /playlist\.volume = Math\.max/);
  assert.match(appSource, /playbackRate, volumePercent/);
  assert.match(appSource, /seekBy\(-10\)/);
  assert.match(appSource, /seekBy\(10\)/);
  assert.match(appSource, /volumeResponder/);
});

test('horizontal swipe navigation does not capture vertical scrolling', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /onMoveShouldSetPanResponder: \(_, gesture\) => !playlistModalVisible/);
  assert.match(appSource, /Math\.abs\(gesture\.dx\) > Math\.abs\(gesture\.dy\) \* 1\.6/);
  assert.doesNotMatch(appSource, /onTouchStart=\{event => \{ swipeTouchStart/);
});


test('folder cover discovery calls the actual file-copy helper without shadowing it', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /async function copyFolderArtwork\(sourceUri, destinationUri\)/);
  assert.match(appSource, /async function findAndCopyFolderArtwork\(entries, folderKey\)/);
  assert.match(appSource, /const copiedUri = await copyFolderArtwork\(uri, destination\)/);
  assert.match(appSource, /const folderArtwork = await findAndCopyFolderArtwork\(entries, directoryUri\)/);
});

test('season themes change the root background while custom background colors remain respected', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  assert.match(appSource, /halloween: \{ accent: '#F08A42', background: '#0D0809'/);
  assert.match(appSource, /christmas: \{ accent: '#79C9E8', background: '#071019'/);
  assert.match(appSource, /birthday: \{ accent: '#D59AD6', background: '#100B14'/);
  assert.match(appSource, /const appBackgroundColor = seasonTheme && profile\.backgroundColor === DEFAULT_PROFILE\.backgroundColor/);
});
