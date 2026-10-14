// Missions, competitions and the player's trophy album.
function exportBackupSave() {
  const backup = localStorage.getItem(`${SAVE_KEY}-backup`);
  if (!backup) { note('Резервна копія з’явиться перед першим імпортом збереження.'); return; }
  const url = URL.createObjectURL(new Blob([backup],{type:'application/json'}));
  const link = document.createElement('a');
  link.href = url; link.download = `fishing-backup-${FishingRules.dayKey()}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}
function ensureOrders() {
  const day = FishingRules.dayKey();
  if (state.orders?.day === day) return state.orders;
  const candidates = locations.pier.fishPool.filter(f => f.rarity <= state.rods && f.weight[0] < tackleLimits().limit);
  const seed = Number(day.replaceAll('-', ''));
  const fish = (candidates[seed % candidates.length] || locations.pier.fishPool[0]).name;
  state.orders = {day, restaurant:{fish, target:2, reward:180 + playerLevel()*40, completed:false}, collection:{species:locations.pier.fish.slice(0,3), seen:[], reward:240, completed:false}};
  return state.orders;
}

function deliverRestaurantOrder() {
  const order = ensureOrders().restaurant;
  if (order.completed) return;
  const fish = FishingRules.delivery(state.inventory, order);
  if (fish.length < order.target) { note('Потрібні дві очищені рибини потрібного виду. Захищені трофеї не використовуються.'); return; }
  const earned = order.reward + fish.reduce((sum,f) => sum + price(f), 0);
  state.inventory = state.inventory.filter(f => !fish.includes(f));
  order.completed = true;
  completeTutorial('sell');
  state.coins += earned;
  state.total += earned;
  state.completedQuests++;
  state.reputation += 3;
  unlockAchievement('restaurateur');
  sound.playCoin();
  note(`Замовлення ресторану доставлено: +${earned} ◉ та +3 репутації.`);
  render();
}

function advanceCollection(catches) {
  const order = ensureOrders().collection;
  if (order.completed) return;
  order.seen = [...new Set([...order.seen, ...catches.filter(f => order.species.includes(f.name)).map(f => f.name)])];
  if (order.seen.length < order.species.length) return;
  order.completed = true;
  state.coins += order.reward;
  state.total += order.reward;
  state.completedQuests++;
  unlockAchievement('collector');
  note(`Колекцію видів зібрано: +${order.reward} ◉. Риба залишається у садку.`);
}

function renderOrders() {
  const root = $('ordersContent');
  if (!root) return;
  const {restaurant:r, collection:c} = ensureOrders();
  const have = FishingRules.delivery(state.inventory, r).length;
  root.innerHTML = `<article class="adventure-card"><h3>🍽️ Замовлення ресторану</h3><p>${r.fish} · ${have}/${r.target} очищених рибин.</p><small>Оплата за рибу + ${r.reward} ◉ премії. Оновлення щодня за київським часом.</small><button onclick="deliverRestaurantOrder()" ${r.completed || have < r.target ? 'disabled' : ''}>${r.completed ? 'Доставлено ✓' : 'Доставити улов'}</button></article>
    <article class="adventure-card"><h3>📚 Колекція дня</h3><p>${c.species.map(name => `${c.seen.includes(name) ? '✓' : '○'} ${name}`).join('<br>')}</p><small>Зловіть усі види сьогодні. Нагорода: ${c.reward} ◉; риба залишається у вас.</small><b>${c.completed ? 'Виконано ✓' : `${c.seen.length}/${c.species.length}`}</b></article>`;
}

function sellPreparedDish(id) {
  const dish = state.preparedDishes.find(d => String(d.id) === String(id));
  if (!dish) return;
  state.preparedDishes = state.preparedDishes.filter(d => d !== dish);
  state.coins += dish.value;
  state.total += dish.value;
  completeTutorial('sell');
  unlockAchievement('foodMerchant');
  sound.playCoin();
  note(`Страву продано: +${dish.value} ◉.`);
  render();
}
function renderPreparedDishes() {
  const root = $('preparedDishesContent');
  if (!root) return;
  root.innerHTML = state.preparedDishes.length ? state.preparedDishes.map(d => {
    const recipe = kitchenRecipes.find(r => r.id === d.recipe);
    return `<article class="adventure-card"><b>${recipe.icon} ${recipe.name}</b><button onclick="sellPreparedDish('${d.id}')">Продати · ${d.value} ◉</button></article>`;
  }).join('') : '<p class="muted">Приготуйте страву на продаж. Її інгредієнти спишуться одразу; посилення дає лише страва, яку ви з’їли.</p>';
}
function claimStorageSupplies() {
  const day = FishingRules.dayKey();
  if (!state.base.storage || state.storageDay === day) return;
  const amount = state.base.storage*3;
  state.storageDay = day;
  state.baitStock.bread += amount;
  state.baitStock.worm += amount;
  note(`Отримано зі складу: хліб ×${amount}, черв’як ×${amount}.`);
  render();
}

function makeTournament(mode) {
  const level = playerLevel();
  const scale = mode === 'total' ? 3 : 1;
  return {mode, joined:true, startsAt:Date.now(), endsAt:Date.now()+600000, claimed:false, count:0, totalWeight:0, heaviest:0,
    rivals:[{name:'Олена', score:+((1.2+level)*scale).toFixed(2)}, {name:'Тарас',score:+((0.8+level*.6)*scale).toFixed(2)}, {name:'Гліб',score:+((0.4+level*.3)*scale).toFixed(2)}]};
}
function joinTournament(mode) {
  if (!['heaviest','total'].includes(mode) || (state.tournament?.joined && !state.tournament.claimed)) return;
  state.tournament = makeTournament(mode);
  note('Турнір почався! Маєте 10 хвилин. Улови з усіх водойм зараховуються.');
  render();
}
function claimTournament() {
  const t = state.tournament;
  if (!t?.joined || t.claimed || Date.now() < t.endsAt) return;
  t.claimed = true;
  const rank = FishingRules.tournamentRank(t);
  const reward = t.count ? [500,300,150,50][rank-1] : 0;
  state.coins += reward;
  state.total += reward;
  if (rank === 1 && t.count) { unlockAchievement('dailyRecord'); state.tournamentWins++; }
  state.journal.unshift(`🏆 Турнір завершено: місце ${rank}, нагорода ${reward} ◉.`);
  note(`Місце ${rank}. Нагорода: ${reward} ◉.`);
  render();
}
function renderTournament() {
  const root = $('tournamentContent');
  if (!root) return;
  const t = state.tournament;
  let content = '<p>Локальні змагання з комп’ютерними суперниками. Участь безкоштовна, тривалість — 10 хвилин. Призи: 500 / 300 / 150 / 50 ◉; без улову — 0.</p>';
  if (t?.joined) {
    const remaining = Math.max(0, Math.ceil((t.endsAt-Date.now())/1000));
    const score = t.mode === 'total' ? t.totalWeight : t.heaviest;
    const board = [...t.rivals, {name:'Ви',score}].sort((a,b) => b.score-a.score || (a.name === 'Ви' ? 1 : -1));
    content += `<h3>${t.mode === 'total' ? 'Загальна вага улову' : 'Найбільша риба'}</h3><p>${remaining ? `Залишилося ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}` : 'Турнір завершено'} · Риб: ${t.count}</p><ol>${board.map(r => `<li>${r.name}: <b>${r.score.toFixed(2)} кг</b></li>`).join('')}</ol><button onclick="claimTournament()" ${remaining || t.claimed ? 'disabled' : ''}>${t.claimed ? 'Нагороду отримано ✓' : 'Отримати нагороду'}</button>`;
  }
  if (!t?.joined || t.claimed) content += '<div class="adventure-actions"><button onclick="joinTournament(\'heaviest\')">🎣 Найбільша риба</button><button onclick="joinTournament(\'total\')">⚖️ Загальна вага</button></div>';
  root.innerHTML = content;
}

function depthLimit() { return state.atDepth ? boats.find(b => b.id === state.boat)?.depth || 12 : 12; }
function fishingDepth() { return Math.min(depthLimit(), Math.max(1, state.fishingDepth || 3)); }
function setFishingDepth(value) {
  if (casting || charging) { note('Спочатку витягніть снасть.'); return; }
  state.fishingDepth = Math.min(depthLimit(), Math.max(1, Number(value) || 3));
  render();
}
function preferredBaits(fish) {
  const explicit = baitTypes.filter(b => b.species.includes(fish.name));
  if (explicit.length) return explicit;
  const id = /Короп|Плітка|Краснопірка/.test(fish.name) ? 'bread' : /Форель|Харіус|Голець|Сиг/.test(fish.name) ? 'trout' : isMarineLocation(state.location) ? 'shrimp' : 'worm';
  return baitTypes.filter(b => b.id === id);
}
function fishAffinity(fish) {
  const profile = FishingRules.habitat(fish.name, catchConditions[fish.name]);
  return FishingRules.affinity(profile, fishingDepth(), world.temperature, world.time, preferredBaits(fish).some(b => b.id === state.bait));
}
function renderHabitat() {
  const root = $('habitatContent');
  if (!root) return;
  root.innerHTML = `<label for="fishingDepth">Глибина наживки: <b>${fishingDepth()} м</b> · ${state.atDepth ? 'з човна' : 'з берега'}</label><input id="fishingDepth" type="range" min="1" max="${depthLimit()}" step="1" value="${fishingDepth()}" onchange="setFishingDepth(this.value)" ${casting ? 'disabled' : ''}><p class="muted">Глибина, температура, час і наживка змінюють шанс зустріти кожен вид.</p><div class="habitat-grid">${locations[state.location].fishPool.map(f => {
    const p = FishingRules.habitat(f.name, catchConditions[f.name]);
    const baits = preferredBaits(f).map(b => b.name);
    return `<article class="adventure-card"><b>${f.name}</b><small>${p.depth.join('–')} м · ${p.temperature.join('–')} °C · ${p.time.map(t => timeData[t].name).join(', ')}</small><small>Улюблена наживка: ${baits.join(', ')}</small><small>Вплив умов на шанс: ×${fishAffinity(f).toFixed(2)}</small></article>`;
  }).join('')}</div>`;
}

function snapshotFish(fish) {
  return {id:fish.id, name:fish.name, weight:fish.weight, rarity:fish.rarity, location:fish.location, caughtAt:fish.caughtAt || Date.now(), depth:fish.depth || fishingDepth(), bait:fish.bait || state.bait, quality:fish.quality || 'normal', record:!!fish.isRecord};
}
function photographFish(id) {
  const fish = state.inventory.find(f => String(f.id) === String(id));
  if (!fish || state.trophyAlbum.some(f => String(f.id) === String(id))) return;
  if (state.trophyAlbum.length >= 200) { note('Альбом заповнено: видаліть зайву картку.'); return; }
  state.trophyAlbum.unshift(snapshotFish(fish));
  unlockAchievement('photographer');
  note('Трофей сфотографовано! Картка залишиться після продажу або відпускання риби.');
  render();
}
function archiveRecord(fish) {
  if (!fish.isRecord) return;
  if (state.trophyAlbum.some(f => String(f.id) === String(fish.id))) return;
  if (state.trophyAlbum.length >= 200) state.trophyAlbum.pop();
  state.trophyAlbum.unshift(snapshotFish(fish));
}
function deleteTrophyPhoto(id) {
  state.trophyAlbum = state.trophyAlbum.filter(f => String(f.id) !== String(id));
  renderPhotoAlbum();
  renderCatchActions();
  save();
}
function renderPhotoAlbum() {
  const root = $('trophyAlbumContent');
  if (!root) return;
  root.innerHTML = state.trophyAlbum.length ? state.trophyAlbum.map(f => `<figure class="trophy-photo"><img src="${fishImages[f.name] || fishImages[bosses.find(b => b.name === f.name)?.base] || 'assets/freshwater-fish.png'}" alt="${f.name}" loading="lazy"><figcaption><b>${f.record ? '🏅 ' : ''}${f.name} · ${f.weight.toFixed(2)} кг</b><small>${locations[f.location]?.name || 'Невідома водойма'} · ${new Date(f.caughtAt).toLocaleString('uk-UA', {timeZone:'Europe/Kyiv'})}</small><small>Глибина ${f.depth} м · ${(baitTypes.find(b => b.id === f.bait) || baitTypes[0]).name}</small><button onclick="downloadTrophyPhoto('${f.id}')">Завантажити фото</button> <button onclick="deleteTrophyPhoto('${f.id}')">Видалити картку</button></figcaption></figure>`).join('') : '<p class="muted">Рекорди фотографуються автоматично. Інші улови можна сфотографувати у вікні улову або садку.</p>';
}

function downloadTrophyPhoto(id) {
  const fish = state.trophyAlbum.find(f => String(f.id) === String(id));
  if (!fish) return;
  const photo = new Image();
  photo.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#082735'; ctx.fillRect(0,0,1200,900);
    const scale = Math.min(1120/photo.width,650/photo.height);
    ctx.drawImage(photo,(1200-photo.width*scale)/2,30+(650-photo.height*scale)/2,photo.width*scale,photo.height*scale);
    ctx.fillStyle = '#ffe3a0'; ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`${fish.name} · ${fish.weight.toFixed(2)} кг`,40,735,1120);
    ctx.fillStyle = '#e5f8fa'; ctx.font = '26px sans-serif';
    ctx.fillText(locations[fish.location]?.name || 'Рибальський трофей',40,785,1120);
    ctx.fillText(new Date(fish.caughtAt).toLocaleString('uk-UA',{timeZone:'Europe/Kyiv'}),40,830,1120);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `trophy-${fish.id}.png`; link.click();
      setTimeout(() => URL.revokeObjectURL(url),1000);
    },'image/png');
  };
      photo.onerror = () => note('Зображення ще не завантажене. Під’єднайтеся до мережі та спробуйте ще раз.');
  photo.src = fishImages[fish.name] || fishImages[bosses.find(b => b.name === fish.name)?.base] || 'assets/freshwater-fish.png';
}

const tutorialSteps = [
  {id:'cast', title:'Перший закид', text:'Закрийте базу та утримуйте «Закинути». Відпустіть у золотій зоні 66–78%. Дочекайтеся сигналу клювання.'},
  {id:'catch', title:'Виважування', text:'Після клювання утримуйте «Тягнути» або R. Відпускайте під час ривків, а кнопкою «Послабити» або S зменшуйте натяг.'},
  {id:'clean', title:'Оброблення улову', text:'Відкрийте садок і натискайте «Розрізати», або відкрийте стіл розбирання та проведіть по рибі. Захищені трофеї не обробляються.'},
  {id:'sell', title:'Продаж', text:'Продайте очищену рибу в садку або доставте її ресторану через «Завдання». Зробіть фото трофея перед продажем.'},
  {id:'buy', title:'Перша покупка', text:'Відкрийте магазин і придбайте наживку або краще спорядження. Стежте за допустимою вагою вудки, волосіні й гачка.'}
];
function completeTutorial(id) { if (tutorialSteps.some(s => s.id === id)) state.tutorial[id] = true; }
function dismissTutorial() { state.tutorial.dismissed = true; renderTutorial(); save(); }
function restartTutorial() { state.tutorial = {}; closeAll(); renderTutorial(); save(); }
function renderTutorial() {
  const root = $('tutorialHint');
  if (!root) return;
  const step = tutorialSteps.find(s => !state.tutorial[s.id]);
  root.hidden = state.tutorial.dismissed || !step || !!document.querySelector('.modal.open, .butcher-overlay.open');
  if (root.hidden) return;
  root.innerHTML = `<b>Навчання ${tutorialSteps.indexOf(step)+1}/${tutorialSteps.length}: ${step.title}</b><p>${step.text}</p><button onclick="dismissTutorial()" aria-label="Приховати навчання">Зрозуміло, приховати</button>`;
}
