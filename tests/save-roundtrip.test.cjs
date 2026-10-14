const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../fishing-rules.js');

test('save validation accepts timestamps in tournaments, trophy photos and lodge buffs', () => {
  const now = Date.now();
  const save = {coins:30, rods:1, inventory:[], tournament:{startsAt:now, endsAt:now+600000}, trophyAlbum:[{caughtAt:now}], buffs:{cozyFire:{expires:now+900000}}};
  assert.deepEqual(rules.validateSave(JSON.parse(JSON.stringify(save))), save);
});

test('save validation still rejects nonfinite and unsafe numbers', () => {
  for (const number of [Infinity, NaN, Number.MAX_SAFE_INTEGER+1]) {
    assert.throws(() => rules.validateSave({coins:30,rods:1,inventory:[],tournament:{endsAt:number}}));
  }
});
