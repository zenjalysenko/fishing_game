const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scriptFile = path.join(__dirname, '..', 'script.js');
const cssFile = path.join(__dirname, '..', 'styles.css');
const htmlFile = path.join(__dirname, '..', 'index.html');

test('equipped rod is visible in deep-water mode on boats in styles.css', () => {
  const css = fs.readFileSync(cssFile, 'utf8');
  assert.doesNotMatch(css, /\.deep-water\s+\.equipped-rod\s*\{\s*display:\s*none/i, 'Rod should not be hidden in deep water');
  assert.match(css, /\.deep-water\s+\.equipped-rod\s*\{[^}]*display:\s*block/i, 'Rod should be visible in deep water');
});

test('equipped bobber (float) is visible by default in index.html', () => {
  const html = fs.readFileSync(htmlFile, 'utf8');
  assert.match(html, /id="equippedFloat"[^>]*class="equipped-float"/i, 'Float element exists in HTML');
  assert.doesNotMatch(html, /<img\s+id="equippedFloat"[^>]*\s+hidden\b/i, 'Float element should not have hidden attribute');
});

test('ProceduralScene renders boat, swimming fish, line, and bobber in script.js', () => {
  const script = fs.readFileSync(scriptFile, 'utf8');
  assert.match(script, /drawSwimmingFish\(/, 'ProceduralScene should implement drawSwimmingFish');
  assert.match(script, /deepWater\(/, 'ProceduralScene should implement deepWater');
  assert.match(script, /cutter/, 'deepWater should support cutter boat');
  assert.match(script, /inflatable/, 'deepWater should support inflatable boat');
  assert.match(script, /rowboat/, 'deepWater should support rowboat');
  assert.match(script, /this\.bobber\(/, 'ProceduralScene should animate the bobber in frame');
  assert.match(script, /this\.line\(/, 'ProceduralScene should draw fishing line in frame');
});

