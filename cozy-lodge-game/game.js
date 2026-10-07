/**
 * УЮТНАЯ РЫБАЛКА НА БАЗАХ — GAME.JS
 * Архитектура:
 * 1. Базы (Lodge data & customization)
 * 2. Web Audio API (Автономные процедурные звуки камина, воды, поклевки)
 * 3. Анимации Canvas (Огонь в камине, блики воды на пирсе)
 * 4. Игровой цикл и механика рыбалки
 * 5. Нарастающая система баллов и комбо
 * 6. Сохранение прогресса (localStorage + Server Hook)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. КОНФИГУРАЦИЯ БАЗ И РЫБ
  // =========================================================================
  const BASES = [
    {
      id: 'forest',
      name: 'Медвежий угол',
      subtitle: 'Лесная хижина',
      capacity: 4,
      icon: '🌲',
      description: 'Уютный сруб из вековой сосны посреди тихого бора. Деревянные балки, панорамное окно на тихое лесное озеро.',
      skyColor: 'linear-gradient(180deg, #1d2d24 0%, #3b533b 50%, #e09f5a 100%)',
      landscapeClip: 'polygon(0% 100%, 15% 40%, 35% 75%, 50% 25%, 70% 65%, 85% 30%, 100% 100%)',
      landscapeColor: '#142918',
      waterColor: 'linear-gradient(180deg, #1b3d2f 0%, #0e2119 100%)',
      fishList: [
        { name: 'Речной окунь', rarity: 'common', weightRange: [0.2, 0.9], basePoints: 40, icon: '🐟' },
        { name: 'Золотой карась', rarity: 'uncommon', weightRange: [0.4, 1.8], basePoints: 75, icon: '🐠' },
        { name: 'Озёрный линь', rarity: 'rare', weightRange: [1.0, 3.2], basePoints: 140, icon: '🐡' },
        { name: 'Пятнистая щука', rarity: 'trophy', weightRange: [2.5, 7.5], basePoints: 260, icon: '🦈' }
      ]
    },
    {
      id: 'sea',
      name: 'Тихая лагуна',
      subtitle: 'Домик у моря',
      capacity: 6,
      icon: '🌊',
      description: 'Светлый домик из выбеленного дерева на песчаном берегу. Вечерний морской бриз, шум прибоя и длинный пирс на сваях.',
      skyColor: 'linear-gradient(180deg, #2b3a4a 0%, #4a6fa5 50%, #e9b872 100%)',
      landscapeClip: 'polygon(0% 100%, 25% 65%, 45% 70%, 65% 55%, 85% 60%, 100% 100%)',
      landscapeColor: '#364958',
      waterColor: 'linear-gradient(180deg, #1d3557 0%, #0c1826 100%)',
      fishList: [
        { name: 'Черноморская ставрида', rarity: 'common', weightRange: [0.15, 0.6], basePoints: 50, icon: '🐟' },
        { name: 'Морской карась (Ласкирь)', rarity: 'uncommon', weightRange: [0.3, 1.2], basePoints: 90, icon: '🐠' },
        { name: 'Средиземноморская кефаль', rarity: 'rare', weightRange: [0.9, 2.8], basePoints: 170, icon: '🐡' },
        { name: 'Королевский сибас', rarity: 'trophy', weightRange: [2.0, 6.0], basePoints: 310, icon: '🦈' }
      ]
    },
    {
      id: 'mountain',
      name: 'Горный приют',
      subtitle: 'Альпийское шале',
      capacity: 2,
      icon: '🏔️',
      description: 'Уединённое каменное шале у подножия заснеженных скал. Кристально чистое ледниковое озеро и первозданная тишина.',
      skyColor: 'linear-gradient(180deg, #1b263b 0%, #3d5a80 50%, #ee6c4d 100%)',
      landscapeClip: 'polygon(0% 100%, 18% 20%, 35% 55%, 52% 10%, 68% 45%, 85% 15%, 100% 100%)',
      landscapeColor: '#1d232a',
      waterColor: 'linear-gradient(180deg, #184e77 0%, #0a2538 100%)',
      fishList: [
        { name: 'Альпийский голец', rarity: 'uncommon', weightRange: [0.4, 1.5], basePoints: 85, icon: '🐟' },
        { name: 'Европейский хариус', rarity: 'rare', weightRange: [0.5, 2.2], basePoints: 160, icon: '🐠' },
        { name: 'Радужная форель', rarity: 'trophy', weightRange: [1.2, 4.5], basePoints: 290, icon: '🐡' },
        { name: 'Царский таймень', rarity: 'legendary', weightRange: [4.0, 14.0], basePoints: 600, icon: '🐉' }
      ]
    }
  ];

  const RARITY_MAP = {
    common: { title: 'Обычная рыба', multiplier: 1.0, colorClass: 'rarity-common' },
    uncommon: { title: 'Необычная рыба', multiplier: 1.25, colorClass: 'rarity-uncommon' },
    rare: { title: 'Редкая рыба', multiplier: 1.6, colorClass: 'rarity-rare' },
    trophy: { title: 'Трофейная рыба', multiplier: 2.1, colorClass: 'rarity-trophy' },
    legendary: { title: 'Легендарный улов!', multiplier: 3.2, colorClass: 'rarity-legendary' }
  };

  // =========================================================================
  // 2. ИГРОВОЕ СОСТОЯНИЕ (STATE)
  // =========================================================================
  const STORAGE_KEY = 'cozy_fishing_progress_v1';

  let state = {
    score: 0,
    currentBaseId: 'forest',
    streak: 0,
    bestStreak: 0,
    totalCaught: 0,
    maxSingleScore: 0,
    isCozyResting: false,
    soundEnabled: true,
    catchHistory: []
  };

  // Рыболовная мини-игра
  let fishingPhase = 'idle'; // 'idle' | 'waiting' | 'biting' | 'caught'
  let biteTimeout = null;
  let strikeTimer = null;
  let strikeStartTime = 0;
  const STRIKE_WINDOW_MS = 1500; // Окно времени на подсечку

  // =========================================================================
  // 3. ЗВУКОВОЙ ДВИЖОК (WEB AUDIO API - АВТОНОМНЫЙ И ЛЁГКИЙ)
  // =========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.fireNode = null;
      this.fireGain = null;
    }

    init() {
      if (!this.ctx && typeof AudioContext !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.startFireAmbience();
      }
    }

    toggle(enabled) {
      if (!this.ctx) this.init();
      if (!this.ctx) return;
      if (this.fireGain) {
        this.fireGain.gain.setValueAtTime(enabled ? 0.04 : 0, this.ctx.currentTime);
      }
    }

    startFireAmbience() {
      if (!this.ctx || !state.soundEnabled) return;
      // Генератор треска камина через шум и полосовой фильтр
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Редкие щелчки + белый шум
        const crackle = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.04;
        data[i] = crackle;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      this.fireGain = this.ctx.createGain();
      this.fireGain.gain.value = state.soundEnabled ? 0.04 : 0;

      noise.connect(filter);
      filter.connect(this.fireGain);
      this.fireGain.connect(this.ctx.destination);
      noise.start();
      this.fireNode = noise;
    }

    playWhoosh() {
      if (!this.ctx || !state.soundEnabled) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    }

    playSplash() {
      if (!this.ctx || !state.soundEnabled) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    }

    playBiteChime() {
      if (!this.ctx || !state.soundEnabled) return;
      // Приятный звоночек поклёвки
      [660, 880, 1100].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = this.ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    }

    playCatchFanfare() {
      if (!this.ctx || !state.soundEnabled) return;
      // Уютный трезвучный аккорд победы
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = this.ctx.currentTime + i * 0.09;
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    }

    playCozyRest() {
      if (!this.ctx || !state.soundEnabled) return;
      // Тёплый глубокий аккорд релакса
      [261.63, 329.63, 392.00, 523.25].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.92);
      });
    }
  }

  const sound = new SoundEngine();

  // =========================================================================
  // 4. CANVAS-АНИМАЦИИ: ОГОНЬ В КАМИНЕ И БЛИКИ ВОДЫ
  // =========================================================================
  function initFireAnimation() {
    const canvas = document.getElementById('fire-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const maxParticles = 45;

    function Particle() {
      this.reset();
    }
    Particle.prototype.reset = function () {
      this.x = canvas.width / 2 + (Math.random() * 50 - 25);
      this.y = canvas.height - 12;
      this.vx = (Math.random() * 2 - 1) * 0.6;
      this.vy = -(Math.random() * 1.8 + 1.2);
      this.life = Math.random() * 0.6 + 0.4;
      this.maxLife = this.life;
      this.size = Math.random() * 9 + 6;
    };

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    function animateFire() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        const ratio = p.life / p.maxLife;
        if (ratio <= 0) {
          p.reset();
          continue;
        }

        const rad = p.size * ratio;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        grad.addColorStop(0, `rgba(255, 230, 110, ${ratio * 0.8})`);
        grad.addColorStop(0.4, `rgba(255, 110, 20, ${ratio * 0.6})`);
        grad.addColorStop(1, 'rgba(180, 40, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(animateFire);
    }
    animateFire();
  }

  function initWaterAnimation() {
    const canvas = document.getElementById('water-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let step = 0;
    function animateWater() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      step += 0.025;

      // Лёгкие лунные/закатные блики на воде
      ctx.strokeStyle = 'rgba(255, 230, 160, 0.09)';
      ctx.lineWidth = 1.5;

      const lines = 8;
      for (let i = 0; i < lines; i++) {
        const y = (canvas.height / lines) * i + Math.sin(step + i) * 6;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.35, y);
        ctx.bezierCurveTo(
          canvas.width * 0.5, y + Math.sin(step * 1.5 + i) * 8,
          canvas.width * 0.65, y - Math.sin(step * 1.2 + i) * 8,
          canvas.width * 0.85, y
        );
        ctx.stroke();
      }

      requestAnimationFrame(animateWater);
    }
    animateWater();
  }

  // =========================================================================
  // 5. РЫБОЛОВНАЯ ЛЕСКА И ПОПЛАВОК (SVG BEZIER)
  // =========================================================================
  function updateFishingLine() {
    const rod = document.getElementById('rod-element');
    const bobber = document.getElementById('bobber-element');
    const linePath = document.getElementById('fishing-line');
    const container = document.getElementById('fishing-scene');
    if (!rod || !bobber || !linePath || !container) return;

    const contRect = container.getBoundingClientRect();
    const rodRect = rod.getBoundingClientRect();
    const bobberRect = bobber.getBoundingClientRect();

    // Кончик удочки
    const x1 = (rodRect.right - contRect.left) - 4;
    const y1 = (rodRect.top - contRect.top) + 6;

    // Верх поплавка
    const x2 = (bobberRect.left + bobberRect.width / 2) - contRect.left;
    const y2 = (bobberRect.top) - contRect.top;

    // Прогиб лески под силой тяжести
    const bend = fishingPhase === 'biting' ? 10 : 25;
    const cx = (x1 + x2) / 2;
    const cy = Math.max(y1, y2) - (Math.abs(x2 - x1) * 0.1) + bend;

    linePath.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    requestAnimationFrame(updateFishingLine);
  }

  // =========================================================================
  // 6. ФОРМУЛА НАРАСТАЮЩИХ БАЛЛОВ (PROGRESSIVE SCORING)
  // =========================================================================
  /**
   * Формула нарастающих баллов:
   * Очки = Round( BasePoints * (Weight / AvgWeight) * RarityMult * StreakMult * CozyBonus )
   * где:
   *  - BasePoints: базовая стоимость рыбы (40 - 600)
   *  - WeightFactor: вес / средний вес вида
   *  - RarityMult: множитель редкости (1.0 - 3.2)
   *  - StreakMult: нарастающий множитель комбо = 1 + (streak * 0.15), максимум x3.0
   *  - CozyBonus: +10% бонус, если перед этим посидели под пледом
   */
  function calculateCatchPoints(fishTemplate, actualWeight) {
    const avgWeight = (fishTemplate.weightRange[0] + fishTemplate.weightRange[1]) / 2;
    const weightFactor = actualWeight / avgWeight;
    const rarity = RARITY_MAP[fishTemplate.rarity];
    const rarityMult = rarity ? rarity.multiplier : 1.0;

    // Множитель серии уловов (Combo Streak)
    const streakMult = Math.min(3.0, 1.0 + state.streak * 0.15);

    // Бонус уюта
    const cozyBonus = state.isCozyResting ? 1.15 : 1.0;

    const basePts = fishTemplate.basePoints;
    const weightPts = Math.round(basePts * weightFactor * rarityMult) - basePts;
    const totalPts = Math.round((basePts + weightPts) * streakMult * cozyBonus);
    const streakBonus = totalPts - (basePts + weightPts);

    return {
      basePts,
      weightPts,
      streakMult: streakMult.toFixed(1),
      streakBonus: Math.max(0, streakBonus),
      totalPts
    };
  }

  // =========================================================================
  // 7. ИГРОВОЙ ЦИКЛ: БАЗА ↔ ПИРС ↔ РЫБАЛКА ↔ РЕКОРДЫ
  // =========================================================================
  const dom = {
    screenLodge: document.getElementById('screen-lodge'),
    screenPier: document.getElementById('screen-pier'),
    btnGoPier: document.getElementById('btn-go-pier'),
    btnBackLodge: document.getElementById('btn-back-lodge'),
    btnFishAction: document.getElementById('btn-fish-action'),
    btnSitBlanket: document.getElementById('btn-sit-blanket'),
    chairZone: document.getElementById('chair-zone'),
    interactiveMug: document.getElementById('interactive-mug'),
    totalScore: document.getElementById('total-score'),
    streakPill: document.getElementById('streak-pill'),
    baseBadge: document.getElementById('base-badge'),
    btnSelectBase: document.getElementById('btn-select-base'),
    btnLeaderboard: document.getElementById('btn-leaderboard'),
    modalBases: document.getElementById('modal-bases'),
    modalRecords: document.getElementById('modal-records'),
    modalCatch: document.getElementById('modal-catch'),
    basesGrid: document.getElementById('bases-grid'),
    btnSound: document.getElementById('btn-sound'),
    cozyBanner: document.getElementById('cozy-banner'),
    bobber: document.getElementById('bobber-element'),
    rod: document.getElementById('rod-element'),
    fishingStatus: document.getElementById('fishing-status'),
    strikeMeterWrap: document.getElementById('strike-meter-wrap'),
    strikeProgress: document.getElementById('strike-progress'),
    btnCollectCatch: document.getElementById('btn-collect-catch')
  };

  // Переключение экранов
  function switchScreen(screenName) {
    if (screenName === 'pier') {
      dom.screenLodge.classList.remove('active');
      dom.screenPier.classList.add('active');
      resetFishingState();
    } else {
      dom.screenPier.classList.remove('active');
      dom.screenLodge.classList.add('active');
    }
  }

  // Применение базы
  function applyBase(baseId) {
    const base = BASES.find((b) => b.id === baseId) || BASES[0];
    state.currentBaseId = base.id;

    // Значок вверху
    dom.baseBadge.querySelector('.base-badge-icon').textContent = base.icon;
    dom.baseBadge.querySelector('.base-badge-name').textContent = base.name;

    // Стили вьюпорта
    const app = document.getElementById('game-app');
    app.className = `game-container base-${base.id}`;

    // Окно в домике
    const winSky = document.querySelector('.window-sky');
    const winLand = document.getElementById('window-landscape');
    if (winSky) winSky.style.background = base.skyColor;
    if (winLand) {
      winLand.style.clipPath = base.landscapeClip;
      winLand.style.background = base.landscapeColor;
    }

    // Пирс
    const pierSky = document.getElementById('env-sky');
    const pierMount = document.getElementById('env-mountains');
    const pierWater = document.getElementById('env-water');
    if (pierSky) pierSky.style.background = base.skyColor;
    if (pierMount) {
      pierMount.style.clipPath = base.landscapeClip;
      pierMount.style.background = base.landscapeColor;
    }
    if (pierWater) pierWater.style.background = base.waterColor;

    renderBasesModal();
    saveProgress();
  }

  // Уютное кресло с пледом
  function toggleCozyBlanket() {
    state.isCozyResting = !state.isCozyResting;
    dom.chairZone.classList.toggle('is-cozy-resting', state.isCozyResting);

    if (state.isCozyResting) {
      sound.playCozyRest();
      showCozyBanner('🧣 Вы укутались в тёплый плед у камина (+15% бонус к улову!)');
      // Плед защищает и даёт дополнительную уверенность
      state.streak = Math.max(state.streak, 1);
      updateScoreUI();
    } else {
      showCozyBanner('Вы встали из кресла, полные сил и спокойствия.');
    }
  }

  function showCozyBanner(text) {
    if (!dom.cozyBanner) return;
    dom.cozyBanner.textContent = text;
    dom.cozyBanner.classList.add('show');
    clearTimeout(dom.cozyBanner._timer);
    dom.cozyBanner._timer = setTimeout(() => {
      dom.cozyBanner.classList.remove('show');
    }, 3200);
  }

  // =========================================================================
  // 8. МИНИ-ИГРА РЫБАЛКИ НА ПИРСЕ
  // =========================================================================
  function resetFishingState() {
    clearTimeout(biteTimeout);
    clearInterval(strikeTimer);
    fishingPhase = 'idle';
    dom.bobber.classList.remove('biting');
    dom.rod.classList.remove('bending');
    dom.strikeMeterWrap.hidden = true;
    dom.fishingStatus.textContent = 'Готовьтесь к забросу';
    dom.btnFishAction.textContent = '🎣 Забросить удочку';
    dom.btnFishAction.className = 'btn-primary btn-large';

    // Поплавок в стартовую позицию
    dom.bobber.style.left = '65%';
    dom.bobber.style.top = '65%';
  }

  function handleFishAction() {
    sound.init();

    if (fishingPhase === 'idle') {
      startCast();
    } else if (fishingPhase === 'waiting') {
      // Преждевременная подсечка
      cancelCast('Слишком рано! Рыба ещё не подошла к наживке.');
    } else if (fishingPhase === 'biting') {
      // Успешная своевременная подсечка!
      catchFishSuccess();
    }
  }

  function startCast() {
    fishingPhase = 'waiting';
    sound.playWhoosh();
    dom.fishingStatus.textContent = 'Ожидаем поклёвку... следите за поплавком';
    dom.btnFishAction.textContent = '⏳ Ждём рыбу...';
    dom.btnFishAction.className = 'btn-secondary btn-large';

    // Анимация заброса
    const targetX = 58 + Math.random() * 16;
    const targetY = 62 + Math.random() * 10;
    dom.bobber.style.left = `${targetX}%`;
    dom.bobber.style.top = `${targetY}%`;

    setTimeout(() => sound.playSplash(), 350);

    // Случайное время ожидания поклевки (1.8 - 4.2 сек)
    const waitTime = 1800 + Math.random() * 2400;
    biteTimeout = setTimeout(triggerBite, waitTime);
  }

  function triggerBite() {
    if (fishingPhase !== 'waiting') return;
    fishingPhase = 'biting';

    sound.playBiteChime();
    dom.bobber.classList.add('biting');
    dom.rod.classList.add('bending');
    dom.fishingStatus.textContent = '💥 КЛЮЁТ! ПОДСЕКАЙТЕ БЫСТРЕЕ!';
    dom.btnFishAction.textContent = '⚡ ПОДСЕЧЬ!';
    dom.btnFishAction.className = 'btn-primary btn-large pulse-btn';

    // Шкала тайминга
    dom.strikeMeterWrap.hidden = false;
    strikeStartTime = Date.now();
    dom.strikeProgress.style.width = '100%';

    strikeTimer = setInterval(() => {
      const elapsed = Date.now() - strikeStartTime;
      const remaining = Math.max(0, STRIKE_WINDOW_MS - elapsed);
      const percent = (remaining / STRIKE_WINDOW_MS) * 100;
      dom.strikeProgress.style.width = `${percent}%`;

      if (remaining <= 0) {
        clearInterval(strikeTimer);
        fishGotAway();
      }
    }, 30);
  }

  function fishGotAway() {
    sound.playSplash();
    dom.strikeMeterWrap.hidden = true;
    dom.bobber.classList.remove('biting');
    dom.rod.classList.remove('bending');

    // Сброс комбо при срыве
    state.streak = 0;
    updateScoreUI();

    dom.fishingStatus.textContent = 'Рыба сорвалась и уплыла в глубину...';
    dom.btnFishAction.textContent = 'Попробовать снова';
    dom.btnFishAction.className = 'btn-primary btn-large';
    fishingPhase = 'idle';
  }

  function cancelCast(reason) {
    clearTimeout(biteTimeout);
    dom.fishingStatus.textContent = reason;
    dom.btnFishAction.textContent = '🎣 Забросить снова';
    dom.btnFishAction.className = 'btn-primary btn-large';
    fishingPhase = 'idle';
  }

  function catchFishSuccess() {
    clearInterval(strikeTimer);
    fishingPhase = 'caught';
    dom.strikeMeterWrap.hidden = true;
    dom.bobber.classList.remove('biting');
    dom.rod.classList.remove('bending');
    sound.playCatchFanfare();

    // Выбор рыбы с текущей базы
    const currentBase = BASES.find((b) => b.id === state.currentBaseId) || BASES[0];
    const fishTemplate = pickRandomFish(currentBase.fishList);

    // Случайный вес рыбы
    const [minW, maxW] = fishTemplate.weightRange;
    const actualWeight = parseFloat((minW + Math.random() * (maxW - minW)).toFixed(2));

    // Расчёт нарастающих баллов
    const pts = calculateCatchPoints(fishTemplate, actualWeight);

    // Увеличение серии комбо и общего счета
    state.streak += 1;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    state.totalCaught += 1;
    state.score += pts.totalPts;
    if (pts.totalPts > state.maxSingleScore) state.maxSingleScore = pts.totalPts;

    // Запись в журнал уловов
    const catchRecord = {
      name: fishTemplate.name,
      rarity: fishTemplate.rarity,
      weight: actualWeight,
      points: pts.totalPts,
      baseName: currentBase.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    state.catchHistory.unshift(catchRecord);
    if (state.catchHistory.length > 25) state.catchHistory.pop();

    updateScoreUI();
    saveProgress();

    // Показываем модальное окно улова
    showCatchModal(fishTemplate, actualWeight, pts, currentBase.name);
  }

  function pickRandomFish(fishList) {
    // Взвешенная вероятность редкости
    const weights = { common: 50, uncommon: 30, rare: 14, trophy: 5, legendary: 1 };
    const pool = [];
    fishList.forEach((fish) => {
      const w = weights[fish.rarity] || 10;
      for (let i = 0; i < w; i++) pool.push(fish);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function showCatchModal(fish, weight, pts, baseName) {
    const rarity = RARITY_MAP[fish.rarity];
    const rBadge = document.getElementById('catch-rarity');
    rBadge.textContent = rarity.title;
    rBadge.className = `catch-rarity-badge ${rarity.colorClass}`;

    document.getElementById('catch-icon').textContent = fish.icon;
    document.getElementById('catch-name').textContent = fish.name;
    document.getElementById('catch-weight').textContent = `Вес: ${weight} кг`;
    document.getElementById('catch-base-origin').textContent = `База: ${baseName}`;

    document.getElementById('pts-base').textContent = pts.basePts;
    document.getElementById('pts-weight').textContent = `+${pts.weightPts}`;
    document.getElementById('pts-streak-multiplier').textContent = `x${pts.streakMult}`;
    document.getElementById('pts-streak-bonus').textContent = `+${pts.streakBonus}`;
    document.getElementById('pts-awarded').textContent = `+${pts.totalPts} очков`;

    dom.modalCatch.hidden = false;
  }

  // =========================================================================
  // 9. СОХРАНЕНИЕ ПРОГРЕССА (LOCALSTORAGE + СЕРВЕРНЫЙ ХУК)
  // =========================================================================
  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Не удалось сохранить в localStorage:', e);
    }

    // ХУК ДЛЯ ВНЕШНЕЙ ИНТЕГРАЦИИ НА ВАШЕМ САЙТЕ
    // Если на сайте есть система аккаунтов, эта функция передает свежие данные
    if (typeof window.saveGameProgressToServer === 'function') {
      window.saveGameProgressToServer({
        score: state.score,
        totalCaught: state.totalCaught,
        bestStreak: state.bestStreak,
        maxSingleScore: state.maxSingleScore,
        currentBaseId: state.currentBaseId
      });
    }
  }

  function loadProgress() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        state = { ...state, ...parsed };
      }
    } catch (e) {
      console.warn('Ошибка загрузки прогресса:', e);
    }
    updateScoreUI();
    applyBase(state.currentBaseId || 'forest');
  }

  function updateScoreUI() {
    dom.totalScore.textContent = state.score.toLocaleString();
    const streakMult = (1.0 + state.streak * 0.15).toFixed(1);
    dom.streakPill.textContent = `Комбо: x${streakMult}`;
    dom.streakPill.title = `Серия уловов: ${state.streak} шт. подряд`;

    // Обновление статистики в рекордах
    const statCaught = document.getElementById('stat-total-caught');
    const statMax = document.getElementById('stat-max-single');
    const statStreak = document.getElementById('stat-best-streak');
    if (statCaught) statCaught.textContent = `${state.totalCaught} шт.`;
    if (statMax) statMax.textContent = `${state.maxSingleScore} очков`;
    if (statStreak) statStreak.textContent = `x${(1.0 + state.bestStreak * 0.15).toFixed(1)}`;

    renderCatchHistory();
  }

  function renderCatchHistory() {
    const list = document.getElementById('catch-history-list');
    if (!list) return;
    if (state.catchHistory.length === 0) {
      list.innerHTML = '<div class="empty-hint">Рыба ещё не поймана. Самое время выйти на пирс!</div>';
      return;
    }
    list.innerHTML = state.catchHistory
      .map(
        (c) => `
        <div class="history-item">
          <div class="history-item-left">
            <span>🐟</span>
            <b>${c.name}</b>
            <small>(${c.weight} кг · ${c.baseName})</small>
          </div>
          <span class="history-item-pts">+${c.points}</span>
        </div>
      `
      )
      .join('');
  }

  // =========================================================================
  // 10. МОДАЛЬНЫЕ ОКНА: ВЫБОР БАЗЫ И РЕКОРДЫ
  // =========================================================================
  function renderBasesModal() {
    dom.basesGrid.innerHTML = BASES.map((b) => {
      const isActive = b.id === state.currentBaseId;
      const preview = b.fishList.map((f) => f.name).join(', ');
      return `
        <div class="base-card ${isActive ? 'active-base' : ''}" data-base-id="${b.id}">
          <div class="base-card-top">
            <span class="base-name">${b.icon} ${b.name}</span>
            <span class="base-capacity-pill">👥 ${b.capacity} мест</span>
          </div>
          <p class="base-desc">${b.description}</p>
          <div class="base-fish-preview">🎣 Водится: ${preview}</div>
        </div>
      `;
    }).join('');

    // Клик по карточке базы
    dom.basesGrid.querySelectorAll('.base-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.baseId;
        applyBase(id);
        dom.modalBases.hidden = true;
        showCozyBanner(`Добро пожаловать на базу «${card.querySelector('.base-name').textContent}»!`);
      });
    });
  }

  // =========================================================================
  // 11. ПРИВЯЗКА СОБЫТИЙ И ИНИЦИАЛИЗАЦИЯ
  // =========================================================================
  function bindEvents() {
    // Навигация между базой и пирсом
    dom.btnGoPier.addEventListener('click', () => switchScreen('pier'));
    dom.btnBackLodge.addEventListener('click', () => switchScreen('lodge'));

    // Уютные взаимодействия на базе
    dom.btnSitBlanket.addEventListener('click', toggleCozyBlanket);
    dom.chairZone.addEventListener('click', toggleCozyBlanket);
    dom.interactiveMug.addEventListener('click', () => {
      sound.playCozyRest();
      showCozyBanner('☕ Вы сделали глоток ароматного горячего чая.');
    });

    // Рыбалка
    dom.btnFishAction.addEventListener('click', handleFishAction);
    dom.btnCollectCatch.addEventListener('click', () => {
      dom.modalCatch.hidden = true;
      resetFishingState();
    });

    // Управление пробелом и кликом по экрану пирса
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && dom.screenPier.classList.contains('active') && dom.modalCatch.hidden) {
        e.preventDefault();
        handleFishAction();
      }
    });

    // Модальные окна
    dom.btnSelectBase.addEventListener('click', () => {
      renderBasesModal();
      dom.modalBases.hidden = false;
    });
    dom.btnLeaderboard.addEventListener('click', () => {
      dom.modalRecords.hidden = false;
    });

    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        const target = document.getElementById(modalId);
        if (target) target.hidden = true;
      });
    });

    // Звук
    dom.btnSound.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      dom.btnSound.querySelector('.icon-sound').textContent = state.soundEnabled ? '🔊' : '🔇';
      sound.toggle(state.soundEnabled);
      saveProgress();
    });
  }

  // Старт приложения
  function init() {
    loadProgress();
    bindEvents();
    initFireAnimation();
    initWaterAnimation();
    updateFishingLine();
  }

  // Автозапуск при готовности DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
