const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptSource = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

function extractGameData() {
  const dummyEl = {
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => false, contains: () => false },
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    dataset: {},
    appendChild: () => {},
    focus: () => {}
  };
  const dummyCtx = {
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    ellipse: () => {},
    save: () => {},
    restore: () => {},
    setTransform: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} })
  };

  const sandbox = {
    document: {
      getElementById: () => dummyEl,
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      documentElement: dummyEl
    },
    window: {
      addEventListener: () => {},
      devicePixelRatio: 1
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    navigator: { vibrate: () => {} },
    performance: globalThis.performance || { now: () => Date.now() },
    AudioContext: class {
      createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
      get destination() { return {}; }
      get currentTime() { return 0; }
      resume() { return Promise.resolve(); }
    },
    webkitAudioContext: class {
      createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
      get destination() { return {}; }
      get currentTime() { return 0; }
      resume() { return Promise.resolve(); }
    },
    location: { reload: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    Blob: globalThis.Blob,
    URL: globalThis.URL,
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: () => 0,
    console,
    Math,
    Date,
    Array,
    Object,
    Number,
    String,
    Set,
    Map
  };
  dummyEl.getContext = () => dummyCtx;
  dummyEl.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
  dummyEl.animate = () => ({});

  vm.createContext(sandbox);

  // Виділяємо код до рендерингу та прив'язки подій
  const evalCode = scriptSource.slice(0, scriptSource.indexOf('// Прив\'язка кнопок інтерфейсу'));
  vm.runInContext(evalCode + `
    var __exported = {
      locations,
      travelRegions,
      gear,
      baitTypes,
      fishWeights,
      fishPrices,
      fishImages,
      fishDescriptions,
      pets,
      boats,
      achievements,
      kitchenRecipes,
      craftRecipes,
      bosses,
      tackleLimits,
      price,
      qualityOf,
      marketMultiplier,
      dailyMarket,
      state,
      fightLoad
    };
  `, sandbox);
  return sandbox.__exported;
}

const gameData = extractGameData();

test('1. Цілісність бази риб (51 вид)', async (t) => {
  const fishNames = Object.keys(gameData.fishImages);
  assert.equal(fishNames.length, 51, 'Очікується рівно 51 вид риби');

  await t.test('Кожна риба має існуючий файл зображення', () => {
    for (const [name, imgPath] of Object.entries(gameData.fishImages)) {
      const fullPath = path.join(__dirname, '..', imgPath);
      assert.ok(fs.existsSync(fullPath), 'Файл асету риби "' + name + '" не знайдено: ' + imgPath);
    }
  });

  await t.test('Кожна риба має валідний діапазон ваги', () => {
    for (const name of fishNames) {
      const w = gameData.fishWeights[name];
      assert.ok(Array.isArray(w) && w.length === 2, 'Риба "' + name + '" не має валідного діапазону ваги');
      assert.ok(w[0] > 0 && w[1] > w[0], 'Риба "' + name + '" має некоректні межі ваги: ' + w);
    }
  });

  await t.test('Кожна риба має позитивну ціну за кілограм', () => {
    for (const name of fishNames) {
      const p = gameData.fishPrices[name];
      assert.ok(Number.isFinite(p) && p > 0, 'Риба "' + name + '" має некоректну ціну: ' + p);
    }
  });

  await t.test('Усі 51 риба мають художні описи українською мовою', () => {
    for (const name of fishNames) {
      const desc = gameData.fishDescriptions[name];
      assert.ok(typeof desc === 'string' && desc.length > 15, 'Риба "' + name + '" не має детального опису українською');
    }
  });
});

test('2. Локації та водойми', async (t) => {
  await t.test('Усі риби у водоймах присутні в головному списку риб', () => {
    for (const [locKey, loc] of Object.entries(gameData.locations)) {
      for (const f of loc.fish) {
        assert.ok(gameData.fishImages[f], 'У локації "' + locKey + '" знайдено невідому рибу: "' + f + '"');
      }
    }
  });

  await t.test('Кожна локація має існуюче фонове зображення', () => {
    for (const [locKey, loc] of Object.entries(gameData.locations)) {
      const fullPath = path.join(__dirname, '..', loc.image);
      assert.ok(fs.existsSync(fullPath), 'Фонове зображення для "' + locKey + '" відсутнє: ' + loc.image);
    }
  });
});

test('3. Спорядження та прогресія', async (t) => {
  await t.test('Вудки мають зростаючу вантажопідйомність', () => {
    const rods = gameData.gear.rods;
    assert.equal(rods.length, 8, 'Очікується 8 рівнів вудок');
    for (let i = 1; i < rods.length; i++) {
      assert.ok(rods[i].maxWeight > rods[i - 1].maxWeight, 'Вудка рівня ' + (i + 1) + ' повинна бути міцнішою');
    }
  });

  await t.test('Волосіні мають зростаюче розривне навантаження', () => {
    const lines = gameData.gear.lines;
    assert.equal(lines.length, 8, 'Очікується 8 рівнів волосіней');
    for (let i = 1; i < lines.length; i++) {
      assert.ok(lines[i][2] > lines[i - 1][2], 'Волосінь рівня ' + (i + 1) + ' повинна бути міцнішою');
    }
  });
});

test('4. Перебалансовані улюбленці (Pets)', () => {
  const pets = gameData.pets;
  assert.ok(pets.length >= 6, 'Очікується щонайменше 6 улюбленців');
  const starterPet = pets.find(p => p.minLevel === 1);
  assert.ok(starterPet && starterPet.price <= 500, 'Початковий улюбленець має бути доступним на 1 рівні (<= 500 монет)');
});

test('5. Крафт наживок та Кухня', async (t) => {
  await t.test('Усі рецепти наживок мають валідні ресурси', () => {
    for (const r of gameData.craftRecipes) {
      assert.ok(r.bait && r.name && r.amount > 0, 'Некоректний рецепт наживки: ' + r.name);
      assert.ok(Object.keys(r.needs).length > 0, 'Рецепт ' + r.name + ' не має інгредієнтів');
    }
  });

  await t.test('Усі кулінарні страви мають тривалість і бафи', () => {
    for (const dish of gameData.kitchenRecipes) {
      assert.ok(dish.id && dish.name && dish.buff && dish.duration >= 60000, 'Некоректна страва: ' + dish.name);
      assert.ok(dish.needs.fish, 'Страва ' + dish.name + ' повинна готуватися з риби');
    }
  });
});

test('6. Система досягнень (20+ ачівок)', () => {
  const achs = gameData.achievements;
  assert.ok(achs.length >= 20, 'Очікується 20+ досягнень, зараз: ' + achs.length);
  for (const a of achs) {
    assert.ok(a.id && a.name && a.desc && a.reward > 0, 'Некоректне досягнення: ' + JSON.stringify(a));
  }
});

test('7. Динаміка навантаження (fightLoad)', () => {
  const sampleFish = { name: 'Щука звичайна', weight: 4.5, rarity: 3 };
  const load = gameData.fightLoad(sampleFish, 0);
  assert.ok(Number.isFinite(load) && load > 0.5, 'fightLoad повинен повертати коректне додатне навантаження');
});

test('8. Інтерфейс виважування (fight-hud) прихований за замовчуванням', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

  assert.match(html, /id=["']fightHud["'][^>]*hidden/, 'fightHud повинен мати атрибут hidden у розмітці index.html');
  assert.match(css, /\.fight-hud\[hidden\]\s*\{[^}]*display:\s*none\s*!important/i, 'CSS повинен гарантувати display: none !important для прихованого fight-hud');
  assert.ok(!css.includes('top:80px;left:50%'), 'fight-hud не повинен зависати в центрі вгорі екрану');
});

