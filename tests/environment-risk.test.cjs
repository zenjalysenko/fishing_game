const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

test('game includes weather and storm risk system for fishing pressure', () => {
  assert.match(script, /function environmentRisk\s*\(/, 'Expected a dedicated environment risk function');
  assert.match(script, /world\.weather === 'storm'|world\.event === 'storm'/, 'Storm conditions should increase danger');
  assert.match(script, /releaseLine\s*\(/, 'The player should still have a line release escape move');
  assert.match(script, /strong wind|storm|Ризик/i, 'UI should communicate danger conditions');
});
