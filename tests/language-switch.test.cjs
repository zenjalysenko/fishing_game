const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const langFile = path.join(__dirname, '..', 'lang.js');
const htmlFile = path.join(__dirname, '..', 'index.html');
const cssFile = path.join(__dirname, '..', 'styles.css');

test('language selector exists in settings and language helper file is present', () => {
  assert.ok(fs.existsSync(langFile), 'Expected language helper file to exist');

  const html = fs.readFileSync(htmlFile, 'utf8');
  assert.match(html, /settingsLanguageSelect/i, 'Expected language selector in settings UI');
});

test('settings UI includes English, Russian and Ukrainian language options and buttons', () => {
  const html = fs.readFileSync(htmlFile, 'utf8');

  // Verify select options
  assert.match(html, /<option[^>]*value="en"[^>]*>.*English/i, 'Expected English option in select');
  assert.match(html, /<option[^>]*value="ru"[^>]*>.*Русский/i, 'Expected Russian option in select');
  assert.match(html, /<option[^>]*value="uk"[^>]*>.*Українська/i, 'Expected Ukrainian option in select');

  // Verify interactive language buttons
  assert.match(html, /data-lang-code="en"/i, 'Expected English button');
  assert.match(html, /data-lang-code="ru"/i, 'Expected Russian button');
  assert.match(html, /data-lang-code="uk"/i, 'Expected Ukrainian button');
});

test('lang.js provides translations for en, ru, and uk', () => {
  const { I18N_MESSAGES, t } = require(langFile);

  assert.ok(I18N_MESSAGES.en, 'Expected English messages to be defined');
  assert.ok(I18N_MESSAGES.ru, 'Expected Russian messages to be defined');
  assert.ok(I18N_MESSAGES.uk, 'Expected Ukrainian messages to be defined');

  // Check translation functions
  assert.equal(t('settings', 'en'), 'Settings');
  assert.equal(t('settings', 'ru'), 'Настройки');
  assert.equal(t('settings', 'uk'), 'Налаштування');

  assert.equal(t('castBtn', 'en'), 'Cast');
  assert.equal(t('castBtn', 'ru'), 'Забросить');
  assert.equal(t('castBtn', 'uk'), 'Закинути');
});

test('styles.css includes styling for language switch buttons', () => {
  const css = fs.readFileSync(cssFile, 'utf8');
  assert.match(css, /\.lang-switch-group/, 'Expected .lang-switch-group styling');
  assert.match(css, /\.lang-btn/, 'Expected .lang-btn styling');
});
