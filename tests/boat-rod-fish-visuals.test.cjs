const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptFile = path.join(__dirname, '..', 'script.js');
const cssFile = path.join(__dirname, '..', 'styles.css');
const htmlFile = path.join(__dirname, '..', 'index.html');

test('equipped rod is visible in deep-water mode on boats in styles.css', () => {
  const css = fs.readFileSync(cssFile, 'utf8');
  assert.doesNotMatch(css, /\.deep-water\s+\.equipped-rod\s*\{\s*display:\s*none/i, 'Rod should not be hidden in deep water');
  assert.match(css, /\.deep-water\s+\.equipped-rod\s*\{[^}]*display:\s*block/i, 'Rod should be visible in deep water');
});

test('equipped bobber (float) element exists and starts hidden before cast', () => {
  const html = fs.readFileSync(htmlFile, 'utf8');
  assert.match(html, /id="equippedFloat"[^>]*class="equipped-float"/i, 'Float element exists in HTML');
  assert.match(html, /<img\s+id="equippedFloat"[^>]*\s+hidden\b/i, 'Float element should start hidden before casting');
});

test('ProceduralScene keeps the fish, line, and bobber animated over the boat photograph', () => {
  const script = fs.readFileSync(scriptFile, 'utf8');
  assert.match(script, /drawSwimmingFish\(/, 'ProceduralScene should implement drawSwimmingFish');
  assert.doesNotMatch(script, /this\.deepWater\(/, 'An opaque procedural boat should not cover the photograph');
  assert.match(script, /this\.bobber\(/, 'ProceduralScene should animate the bobber in frame');
  assert.match(script, /this\.line\(/, 'ProceduralScene should draw fishing line in frame');
});

test('each equipped boat selects its own fishing photograph and returning to shore restores the location', () => {
  const script = fs.readFileSync(scriptFile, 'utf8');
  const boatSceneCode = script.slice(script.indexOf('const boats = ['), script.indexOf('function drawBoatArt('));
  const context = vm.createContext({state:{boat:null, atDepth:false}});
  vm.runInContext(boatSceneCode, context);
  const selectImage = () => vm.runInContext("fishingSceneImage({image:'assets/dnieper-river.png'})", context);

  for (const id of ['rowboat', 'motorboat', 'cutter', 'yacht']) {
    context.state.boat = id;
    context.state.atDepth = true;
    const image = selectImage();
    assert.equal(image, `assets/boats/${id}-fishing.png`, `${id} needs its own view from aboard`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', image)), `Missing photo: ${image}`);
    context.state.atDepth = false;
    assert.equal(selectImage(), 'assets/dnieper-river.png', 'The shore must use the current location');
  }
  context.state.boat = 'unknown';
  context.state.atDepth = true;
  assert.equal(selectImage(), 'assets/dnieper-river.png', 'An invalid boat must not display another vessel');
});
