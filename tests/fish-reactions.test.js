const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('script.js', 'utf8');

assert.match(source, /cautious|осторож/i, 'expected a cautious bite reaction');
assert.match(source, /escape|резкий.*уход|резкий.*уход/i, 'expected a sudden escape reaction');
assert.match(source, /surface|поверхности/i, 'expected a surface-fight reaction');
assert.match(source, /boatProfiles|boatShape|drawBoat\s*\(|selectedBoat.*boat/i, 'expected distinct boat visuals by selected boat');

console.log('Fish reaction behaviors are present.');
