/* Shared game rules, also exercised by Node tests. */
const FishingRules = (() => {
  const dayKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Kyiv', year:'numeric', month:'2-digit', day:'2-digit'}).format(date);
  const temperature = (season, weather, time, cold = false) => {
    const base = {spring:13, summer:23, autumn:12, winter:3}[season] || 13;
    return Math.max(1, base + ({clear:2, rain:-2, fog:-1, wind:-3, snow:-4}[weather] || 0) - (time === 'night' ? 3 : 0) - (cold ? 5 : 0));
  };
  function habitat(name, conditions = {}) {
    const cold = /Форель|Харіус|Голець|Сиг|Минь|Ряпушка/.test(name);
    const bottom = /Сом|Вугор|Минь|Калкан|Камбала|Стерлядь|Марена|Мідія|Серцевидка/.test(name);
    const sea = /Тунец|Групер|Вітрильник|Каранкс|Серіола|Макрель|Наполеон/.test(name);
    const depthPreferences = {
      'Окунь річковий':[2,8], 'Плітка звичайна':[1,5], 'Карась сріблястий':[1,4],
      'Лящ звичайний':[4,18], 'Короп звичайний':[2,10], 'Форель струмкова':[1,6],
      'Харіус європейський':[1,4], 'Сиг європейський':[8,25], 'Голець арктичний':[10,35],
      'Форель райдужна':[2,12], 'Щука звичайна':[2,9], 'Лин звичайний':[1,5],
      'Сом європейський':[8,35], "В'юн звичайний":[1,3], 'Краснопірка звичайна':[1,3],
      'Судак звичайний':[6,20], 'Головень звичайний':[1,6], 'Білизна звичайна':[1,4],
      'Вугор європейський':[4,15], 'Стерлядь':[5,22], 'Минь':[6,25],
      'Калкан чорноморський':[12,45], 'Камбала річкова':[4,25], 'Групер гігантський':[30,120],
      'Тунець собакозубий':[20,90], 'Вітрильник індо-тихоокеанський':[15,65]
    };
    return {depth:depthPreferences[name] || (sea ? [10,120] : bottom ? [4,35] : [1,12]), temperature:cold ? [2,16] : [10,28], time:conditions.time || (bottom ? ['night'] : ['day'])};
  }
  function affinity(profile, depth, temp, time, preferredBait) {
    const depthBonus = depth >= profile.depth[0] && depth <= profile.depth[1] ? 1.8 : 0.3;
    const tempBonus = temp >= profile.temperature[0] && temp <= profile.temperature[1] ? 1.25 : 0.55;
    return depthBonus * tempBonus * (profile.time.includes(time) ? 1.4 : 0.45) * (preferredBait ? 2 : 1);
  }
  function weightedPick(items, weight, random = Math.random) {
    if (!items.length) return null;
    let roll = random() * items.reduce((sum, item) => sum + weight(item), 0);
    return items.find(item => (roll -= weight(item)) <= 0) || items[items.length - 1];
  }
  const kitchenUnlocked = (recipe, base) => recipe.id === 'soup' || (recipe.id === 'smokedFish' ? base.smokehouse > 0 : base.kitchen > 0);
  function ingredients(inventory, recipe) {
    return inventory.filter(f => f.clean && !f.favorite && (!recipe.species || recipe.species.includes(f.name))).slice(0, recipe.needs.fish || 0);
  }
  function delivery(inventory, order) {
    return inventory.filter(f => f.clean && !f.favorite && f.name === order.fish).slice(0, order.target);
  }
  function tournamentScore(tournament, catches, now = Date.now()) {
    if (!tournament || !tournament.joined || tournament.claimed || now >= tournament.endsAt) return tournament;
    return {...tournament, count:tournament.count + catches.length, totalWeight:tournament.totalWeight + catches.reduce((sum,f) => sum + f.weight, 0), heaviest:Math.max(tournament.heaviest, ...catches.map(f => f.weight), 0)};
  }
  function tournamentRank(tournament) {
    const score = tournament.mode === 'total' ? tournament.totalWeight : tournament.heaviest;
    return 1 + tournament.rivals.filter(r => r.score >= score).length;
  }
  function validateSave(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.inventory) || !Number.isFinite(raw.coins) || !Number.isFinite(raw.rods)) throw Error('Це не збереження гри.');
    let nodes = 0;
    function visit(value, depth = 0) {
      if (++nodes > 100000 || depth > 15) throw Error('Збереження занадто велике.');
      if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) throw Error('Некоректне число у збереженні.');
      if (typeof value === 'string' && (value.length > 2000 || /[<>]/.test(value))) throw Error('Некоректний текст у збереженні.');
      if (value && typeof value === 'object') Object.entries(value).forEach(([key,item]) => {
        if (['__proto__','prototype','constructor'].includes(key) || /[<>]/.test(key)) throw Error('Некоректне поле збереження.');
        visit(item, depth + 1);
      });
    }
    visit(raw);
    for (const key of ['coins','xp','reputation','total','bankDebt','completedQuests','released','perfectCasts','worldSeconds','cleanedCount','catchStreak']) {
      if (raw[key] !== undefined && (!Number.isFinite(raw[key]) || raw[key] < 0)) throw Error(`Некоректне поле: ${key}.`);
    }
    for (const key of ['inventory','discovered','journal','pets','treasures','ownedBoats','ownedReels','auctions','auctionLog','trophyAlbum','preparedDishes']) {
      if (raw[key] !== undefined && !Array.isArray(raw[key])) throw Error(`Некоректний список: ${key}.`);
    }
    for (const key of ['base','materials','skills','baitStock','records','achievements','buffs','localReputation','bossKills','tutorial']) {
      if (raw[key] !== undefined && (!raw[key] || typeof raw[key] !== 'object' || Array.isArray(raw[key]))) throw Error(`Некоректний розділ: ${key}.`);
    }
    const ids = new Set();
    raw.inventory.forEach(f => {
      if (!f || typeof f.name !== 'string' || !Number.isFinite(f.weight) || f.weight <= 0 || !Number.isInteger(f.rarity) || f.rarity < 1 || f.rarity > 5 || !/^[\w.-]+$/.test(String(f.id)) || ids.has(String(f.id)) || (f.cuts !== undefined && (!Number.isFinite(f.cuts) || f.cuts < 0))) throw Error('Некоректна риба у садку.');
      ids.add(String(f.id));
    });
    for (const map of ['base','materials','skills','baitStock','records','localReputation','bossKills']) {
      for (const n of Object.values(raw[map] || {})) if (!Number.isFinite(n) || n < 0) throw Error(`Некоректне число: ${map}.`);
    }
    return raw;
  }
  return {dayKey, temperature, habitat, affinity, weightedPick, kitchenUnlocked, ingredients, delivery, tournamentScore, tournamentRank, validateSave};
})();
if (typeof module !== 'undefined') module.exports = FishingRules;
