const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('styles.css hides all modals and hints when #game is interface-hidden', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  assert.match(css, /#game\.interface-hidden\s*~\s*\.modal/i, 'Modals must be hidden when interface is hidden');
  assert.match(css, /#game\.interface-hidden\s*~\s*\.tutorial-hint/i, 'Tutorial hints must be hidden when interface is hidden');
});

test('script.js preserves interface-hidden across renderEnvironment and fish catches', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

  // Verify variable exists
  assert.match(js, /isInterfaceHidden\s*=\s*false/, 'isInterfaceHidden state must be declared');

  // Verify renderEnvironment preserves interface-hidden class
  assert.match(js, /\$\{isInterfaceHidden\s*\?\s*['"]\s*interface-hidden['"]\s*:\s*['"]['"]\}/, 'renderEnvironment must preserve interface-hidden in className');

  // Verify landFish does not pop up catch dialog when interface is hidden
  assert.match(js, /if\s*\(!isInterfaceHidden\)\s*\{\s*showCatchDialog\(catches\);\s*\}/, 'landFish must not open catch dialog when interface is hidden');

  // Verify toggleInterface function exists
  assert.match(js, /function\s+toggleInterface\b/, 'toggleInterface function must exist');
});

