const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Cozy Lakeside Base: index.html has 3 main buttons and base modal', () => {
  const htmlPath = path.join(__dirname, '..', 'cozy-lodge-game', 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'cozy-lodge-game/index.html must exist');

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Verify Three.js inclusion
  assert.match(html, /three\.min\.js/i, 'Must include Three.js library');

  // Verify the Three Main Buttons
  assert.match(html, /id="btnPier"[^>]*>[\s\S]*?Go Out to the Pier/i, 'Button 1: Go Out to the Pier must exist');
  assert.match(html, /id="btnChangeBase"[^>]*>[\s\S]*?Change Base/i, 'Button 2: Change Base must exist');
  assert.match(html, /id="btnBlanket"[^>]*>[\s\S]*?Wrap Yourself in a Blanket and Drink Hot Coffee/i, 'Button 3: Wrap Yourself in a Blanket and Drink Hot Coffee must exist');

  // Verify Return to Base button
  assert.match(html, /Return to Base/i, 'Must have Return to Base button on pier');

  // Verify 4 Bases in modal
  assert.match(html, /Forest Base/i, 'Must include Forest Base');
  assert.match(html, /Mountain Base/i, 'Must include Mountain Base');
  assert.match(html, /Lakeside Base/i, 'Must include Lakeside Base');
  assert.match(html, /Winter Base/i, 'Must include Winter Base');

  // Verify blanket overlay and coffee hands
  assert.match(html, /id="fpBlanketOverlay"/i, 'Must have first-person blanket overlay');
  assert.match(html, /id="fpCoffeeHands"/i, 'Must have coffee drinking hands element');
});

test('Cozy Lakeside Base: game.js implements 3D cabin, 4 trophies, pier, blanket & coffee', () => {
  const jsPath = path.join(__dirname, '..', 'cozy-lodge-game', 'game.js');
  assert.ok(fs.existsSync(jsPath), 'cozy-lodge-game/game.js must exist');

  const js = fs.readFileSync(jsPath, 'utf8');

  // Verify 4 trophy heads
  assert.match(js, /bear/i, 'Must feature bear trophy mount');
  assert.match(js, /moose/i, 'Must feature moose trophy mount with antlers');
  assert.match(js, /boar/i, 'Must feature wild boar trophy mount with tusks');
  assert.match(js, /wolf/i, 'Must feature wolf trophy mount');

  // Verify fireplace and panoramic window
  assert.match(js, /fireplaceLight|flameMesh/i, 'Must have dynamic burning fireplace');
  assert.match(js, /buildPanoramicWindow/i, 'Must have panoramic window');
  assert.match(js, /buildPier/i, 'Must build wooden pier');

  // Verify Sound System (Web Audio API)
  assert.match(js, /SoundSystem/i, 'Must have Web Audio sound system');
  assert.match(js, /playSipSound/i, 'Must have coffee sip sound');
  assert.match(js, /playCrackle/i, 'Must have fire crackle sound');
});

