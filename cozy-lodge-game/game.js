/**
 * COZY LAKESIDE BASE — 3D FIRST-PERSON GAME
 * Realistic 3D browser game built with Three.js.
 * Features:
 * - Starting Base: Luxurious lakeside wooden cabin with fireplace & burning logs.
 * - 4 Realistic Animal Trophy Heads: Bear, Moose, Wild Boar, Wolf.
 * - Panoramic floor-to-ceiling glass window with view of lake, forest & distant hills.
 * - 3 Main Interactive Buttons: Go Out to the Pier, Change Base, Wrap in Blanket & Drink Coffee.
 * - 4 Distinct Bases: Forest, Mountain, Lakeside, Winter (with live snowstorm).
 * - Full First-Person camera (mouse drag, touch gestures, pointer lock, smooth transitions).
 * - Procedural Web Audio API soundscapes (fire crackling, lake waves, breeze, birds, coffee sip).
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONFIGURATION & STATE
  // =========================================================================
  const BASES_CONFIG = {
    lakeside: {
      id: 'lakeside',
      name: 'Lakeside Base',
      sub: 'Panoramic Lake & Private Pier',
      icon: '🏡',
      wallColor: 0x422616,
      floorColor: 0x5a331c,
      stoneColor: 0x3d3936,
      ambientColor: 0xffe0b2,
      ambientIntensity: 0.55,
      sunColor: 0xffd899,
      sunIntensity: 0.85,
      sunPos: [-15, 12, -20],
      skyTop: '#1b3d54',
      skyBottom: '#d4a373',
      lakeColor: 0x1b4458,
      weather: 'calm',
      toast: 'Welcome to Lakeside Base. Cozy warmth beside the water.'
    },
    forest: {
      id: 'forest',
      name: 'Forest Base',
      sub: 'Deep Pine Forest & Tall Trees',
      icon: '🌲',
      wallColor: 0x362013,
      floorColor: 0x4e2c17,
      stoneColor: 0x332f2c,
      ambientColor: 0xffecc4,
      ambientIntensity: 0.5,
      sunColor: 0xffc870,
      sunIntensity: 0.75,
      sunPos: [-18, 14, -15],
      skyTop: '#173024',
      skyBottom: '#cf9e5f',
      lakeColor: 0x193a2b,
      weather: 'forest',
      toast: 'Welcome to Forest Base. Surrounded by towering pine trees.'
    },
    mountain: {
      id: 'mountain',
      name: 'Mountain Base',
      sub: 'Alpine Lodge & Snowy Peaks',
      icon: '🏔️',
      wallColor: 0x3a281e,
      floorColor: 0x543b2c,
      stoneColor: 0x484b50,
      ambientColor: 0xe0ecf8,
      ambientIntensity: 0.65,
      sunColor: 0xfff4db,
      sunIntensity: 0.95,
      sunPos: [-22, 18, -25],
      skyTop: '#243b55',
      skyBottom: '#b9cfe3',
      lakeColor: 0x224b67,
      weather: 'mountain',
      toast: 'Welcome to Mountain Base. Crisp alpine air and rocky summits.'
    },
    winter: {
      id: 'winter',
      name: 'Winter Base',
      sub: 'Snowy Cabin & Live Snowstorm',
      icon: '❄️',
      wallColor: 0x301e15,
      floorColor: 0x45291b,
      stoneColor: 0x383940,
      ambientColor: 0xd8e4f0,
      ambientIntensity: 0.45,
      sunColor: 0xdbe8f5,
      sunIntensity: 0.6,
      sunPos: [-12, 10, -18],
      skyTop: '#1e2832',
      skyBottom: '#8291a0',
      lakeColor: 0x162a36,
      weather: 'snow',
      toast: 'Welcome to Winter Base. Warm fireplace amid the swirling blizzard.'
    }
  };

  const STATE = {
    currentBase: 'lakeside',
    location: 'sofa', // 'sofa' | 'pier'
    isRelaxing: false,
    audioEnabled: false,
    camera: {
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
      fov: 68
    },
    positions: {
      sofa: new THREE.Vector3(0, 1.15, 1.25),
      pier: new THREE.Vector3(0, 1.65, 8.5)
    },
    lookTargets: {
      sofa: new THREE.Vector3(0, 1.25, -3.9),
      pier: new THREE.Vector3(0, 1.6, 25.0)
    }
  };

  // =========================================================================
  // 2. PROCEDURAL TEXTURE GENERATORS (PHOTOREALISTIC CANVAS TEXTURES)
  // =========================================================================
  const Textures = {
    woodPlanks(width = 1024, height = 1024, plankCount = 8, baseHex = '#54301a', darkHex = '#321c0e') {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d');

      const plankHeight = height / plankCount;
      for (let i = 0; i < plankCount; i++) {
        const y = i * plankHeight;
        // Random slight tone per plank
        const toneShift = (Math.random() - 0.5) * 20;
        ctx.fillStyle = baseHex;
        ctx.fillRect(0, y, width, plankHeight);

        // Wood grain lines
        ctx.lineWidth = 1.2;
        const grainCount = 35;
        for (let g = 0; g < grainCount; g++) {
          const gy = y + Math.random() * plankHeight;
          const alpha = 0.05 + Math.random() * 0.12;
          ctx.strokeStyle = `rgba(30, 14, 6, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          let cx = 0;
          while (cx < width) {
            cx += 40 + Math.random() * 80;
            const cy = gy + (Math.random() - 0.5) * 6;
            ctx.lineTo(cx, cy);
          }
          ctx.stroke();
        }

        // Dark plank seam
        ctx.fillStyle = darkHex;
        ctx.fillRect(0, y + plankHeight - 3, width, 3);
        ctx.fillStyle = 'rgba(255, 230, 180, 0.06)';
        ctx.fillRect(0, y, width, 1.5);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    },

    stoneMasonry(width = 512, height = 512) {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d');

      ctx.fillStyle = '#2a2725';
      ctx.fillRect(0, 0, width, height);

      const rows = 10;
      const rowH = height / rows;
      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        const stonesInRow = 5 + (r % 2);
        const stoneW = width / stonesInRow;
        for (let s = 0; s < stonesInRow; s++) {
          const x = s * stoneW + ((r % 2) ? stoneW * 0.25 : 0);
          ctx.fillStyle = `rgb(${55 + Math.random() * 30}, ${50 + Math.random() * 30}, ${48 + Math.random() * 25})`;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x + 2, y + 2, stoneW - 4, rowH - 4, 6) : ctx.fillRect(x + 2, y + 2, stoneW - 4, rowH - 4);
          ctx.fill();

          // Highlight & shadow on stones
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.stroke();
        }
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    },

    cabinRug(width = 512, height = 512) {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d');

      // Warm burgundy & cream woven pattern
      ctx.fillStyle = '#6b1d1d';
      ctx.fillRect(0, 0, width, height);

      // Borders
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#d6ad60';
      ctx.strokeRect(18, 18, width - 36, height - 36);

      ctx.lineWidth = 6;
      ctx.strokeStyle = '#f4e8c1';
      ctx.strokeRect(32, 32, width - 64, height - 64);

      // Diamond medallion center
      ctx.fillStyle = '#8f2d2d';
      ctx.beginPath();
      ctx.moveTo(width / 2, 60);
      ctx.lineTo(width - 60, height / 2);
      ctx.lineTo(width / 2, height - 60);
      ctx.lineTo(60, height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f4e8c1';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Soft noise
      const imgData = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 16;
        imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + n));
        imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + n));
        imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + n));
      }
      ctx.putImageData(imgData, 0, 0);

      const tex = new THREE.CanvasTexture(c);
      return tex;
    },

    fabric(colorHex = '#3d2b1f', checkHex = '#271c14') {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');

      ctx.fillStyle = colorHex;
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = checkHex;
      for (let y = 0; y < 256; y += 32) {
        for (let x = 0; x < 256; x += 32) {
          if ((x / 32 + y / 32) % 2 === 0) {
            ctx.fillRect(x, y, 32, 32);
          }
        }
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      return tex;
    },

    waterNormal() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(256, 256);
      for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
          const idx = (y * 256 + x) * 4;
          const nx = Math.sin(x * 0.1) * 30 + 128;
          const ny = Math.cos(y * 0.1) * 30 + 128;
          img.data[idx] = nx;
          img.data[idx + 1] = ny;
          img.data[idx + 2] = 255;
          img.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(16, 16);
      return tex;
    }
  };

  // =========================================================================
  // 3. SOUND ENGINE (PROCEDURAL WEB AUDIO API)
  // =========================================================================
  const SoundSystem = {
    ctx: null,
    fireGain: null,
    windGain: null,
    waterGain: null,
    birdTimer: null,
    initialized: false,

    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.initFire();
        this.initWind();
        this.initWater();
        this.startBirds();
        this.initialized = true;
      } catch (e) {
        console.warn('AudioContext unavailable:', e);
      }
    },

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    initFire() {
      if (!this.ctx) return;
      // Pink noise source for fire crackling
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter for warm fireplace rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 520;

      this.fireGain = this.ctx.createGain();
      this.fireGain.gain.value = 0.28;

      whiteNoise.connect(filter);
      filter.connect(this.fireGain);
      this.fireGain.connect(this.ctx.destination);
      whiteNoise.start(0);

      // Random pops and crackles generator
      setInterval(() => {
        if (!STATE.audioEnabled || !this.ctx || this.ctx.state !== 'running') return;
        if (Math.random() < 0.45) {
          this.playCrackle();
        }
      }, 350);
    },

    playCrackle() {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + Math.random() * 600, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08 + Math.random() * 0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04 + Math.random() * 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    },

    initWind() {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 380;
      bandpass.Q.value = 2.0;

      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.06;

      noise.connect(bandpass);
      bandpass.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);
      noise.start(0);
    },

    initWater() {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 400;

      this.waterGain = this.ctx.createGain();
      this.waterGain.gain.value = 0.08;

      noise.connect(lowpass);
      lowpass.connect(this.waterGain);
      this.waterGain.connect(this.ctx.destination);
      noise.start(0);
    },

    startBirds() {
      this.birdTimer = setInterval(() => {
        if (!STATE.audioEnabled || !this.ctx || this.ctx.state !== 'running') return;
        if (STATE.currentBase === 'winter') return; // No birds in winter blizzard
        if (Math.random() < 0.3) {
          this.playBirdChirp();
        }
      }, 4500);
    },

    playBirdChirp() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 2200 + Math.random() * 1200;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 700, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, now + 0.16);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    },

    playSipSound() {
      if (!this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      // Gentle warm gulp / sipping sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    },

    playBlanketSound() {
      if (!this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      // Soft wool rustle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    },

    setEnvironment(location, baseId) {
      if (!this.ctx) return;
      if (location === 'pier') {
        // Louder water & wind on pier
        if (this.waterGain) this.waterGain.gain.setTargetAtTime(0.25, this.ctx.currentTime, 0.4);
        if (this.windGain) this.windGain.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.4);
        if (this.fireGain) this.fireGain.gain.setTargetAtTime(0.02, this.ctx.currentTime, 0.4);
      } else {
        // Inside cabin: loud fire, subtle water & wind through glass
        if (this.waterGain) this.waterGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.4);
        if (this.windGain) this.windGain.gain.setTargetAtTime(baseId === 'winter' ? 0.22 : 0.05, this.ctx.currentTime, 0.4);
        if (this.fireGain) this.fireGain.gain.setTargetAtTime(0.28, this.ctx.currentTime, 0.4);
      }
    },

    toggleMute() {
      if (!this.initialized) this.init();
      STATE.audioEnabled = !STATE.audioEnabled;
      if (this.ctx) {
        if (STATE.audioEnabled) {
          this.resume();
          if (this.ctx.destination.gain) this.ctx.destination.gain.value = 1;
        } else {
          this.ctx.suspend();
        }
      }
      return STATE.audioEnabled;
    }
  };

  // =========================================================================
  // 4. THREE.JS SCENE SETUP & ENGINE
  // =========================================================================
  let scene, camera, renderer;
  let fireplaceLight, ambientLight, sunLight;
  let animatedObjects = [];
  let lakeMesh, fireParticles, emberParticles, steamParticles, snowParticles;
  let coffeeCupMesh, blanketMesh;
  let currentPosition = new THREE.Vector3().copy(STATE.positions.sofa);
  let targetPosition = new THREE.Vector3().copy(STATE.positions.sofa);

  function initThree() {
    const container = document.getElementById('canvas-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e141a);
    scene.fog = new THREE.FogExp2(0x162633, 0.015);

    camera = new THREE.PerspectiveCamera(STATE.camera.fov, width / height, 0.1, 500);
    camera.position.copy(STATE.positions.sofa);
    camera.rotation.order = 'YXZ';

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    buildLighting();
    buildRoomInterior();
    buildFireplaceAndTrophies();
    buildSofaAndTable();
    buildPanoramicWindow();
    buildOutdoorLandscape();
    buildPier();
    buildSteamAndParticles();

    setupInputControls();
    window.addEventListener('resize', onWindowResize, false);
  }

  // =========================================================================
  // 5. CABIN LIGHTING (WARM FIRE GLOW + SUNBEAM)
  // =========================================================================
  function buildLighting() {
    ambientLight = new THREE.AmbientLight(0xffecc4, 0.55);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xffdfa8, 0.85);
    sunLight.position.set(-15, 14, -18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -12;
    sunLight.shadow.camera.right = 12;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm fireplace point light casting dynamic dancing shadows
    fireplaceLight = new THREE.PointLight(0xff7722, 2.8, 12, 1.2);
    fireplaceLight.position.set(0, 0.85, -3.4);
    fireplaceLight.castShadow = true;
    fireplaceLight.shadow.mapSize.width = 1024;
    fireplaceLight.shadow.mapSize.height = 1024;
    fireplaceLight.shadow.bias = -0.001;
    scene.add(fireplaceLight);

    // Subtle blue lake reflection bounce into cabin
    const lakeBounceLight = new THREE.DirectionalLight(0x4ca3dd, 0.22);
    lakeBounceLight.position.set(-10, 2, 0);
    scene.add(lakeBounceLight);
  }

  // =========================================================================
  // 6. CABIN INTERIOR: ROOM, LOG WALLS & TIMBER BEAMS
  // =========================================================================
  let floorMesh, wallNorthMesh, wallSouthMesh, wallEastMesh, ceilingMesh;

  function buildRoomInterior() {
    const roomWidth = 8.4;
    const roomHeight = 4.4;
    const roomDepth = 8.6;

    const woodFloorTex = Textures.woodPlanks(1024, 1024, 10, '#54321d', '#2c180d');
    woodFloorTex.repeat.set(2, 3);

    const floorMat = new THREE.MeshStandardMaterial({
      map: woodFloorTex,
      roughness: 0.35,
      metalness: 0.05
    });

    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Ceiling with timber planks
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: woodFloorTex,
      roughness: 0.85,
      color: 0x3d2415
    });
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = roomHeight;
    scene.add(ceilingMesh);

    // Exposed heavy ceiling beams
    for (let z = -3.5; z <= 3.5; z += 1.75) {
      const beamGeo = new THREE.BoxGeometry(roomWidth + 0.1, 0.28, 0.22);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x2b170c, roughness: 0.8 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, roomHeight - 0.14, z);
      beam.castShadow = true;
      scene.add(beam);
    }

    // Walls
    const wallTex = Textures.woodPlanks(1024, 1024, 8, '#442616', '#261409');
    wallTex.repeat.set(3, 1);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.75,
      metalness: 0.02
    });

    // North wall (behind fireplace)
    wallNorthMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    wallNorthMesh.position.set(0, roomHeight / 2, -roomDepth / 2);
    wallNorthMesh.receiveShadow = true;
    scene.add(wallNorthMesh);

    // South wall (behind sofa)
    wallSouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    wallSouthMesh.rotation.y = Math.PI;
    wallSouthMesh.position.set(0, roomHeight / 2, roomDepth / 2);
    wallSouthMesh.receiveShadow = true;
    scene.add(wallSouthMesh);

    // East wall (right of player)
    wallEastMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMat);
    wallEastMesh.rotation.y = -Math.PI / 2;
    wallEastMesh.position.set(roomWidth / 2, roomHeight / 2, 0);
    wallEastMesh.receiveShadow = true;
    scene.add(wallEastMesh);

    // Baseboards along walls
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x221108, roughness: 0.7 });
    const bbNorth = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.18, 0.05), baseboardMat);
    bbNorth.position.set(0, 0.09, -roomDepth / 2 + 0.025);
    scene.add(bbNorth);
  }

  // =========================================================================
  // 7. FIREPLACE & THE FOUR ANIMAL TROPHY HEADS (BEAR, MOOSE, BOAR, WOLF)
  // =========================================================================
  let fireplaceGroup;

  function buildFireplaceAndTrophies() {
    fireplaceGroup = new THREE.Group();
    fireplaceGroup.position.set(0, 0, -4.1);

    const stoneTex = Textures.stoneMasonry(512, 512);
    stoneTex.repeat.set(2, 3);
    const stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.9,
      metalness: 0.1
    });

    // Massive stone chimney breast rising to ceiling
    const chimneyGeo = new THREE.BoxGeometry(3.4, 4.4, 0.85);
    const chimney = new THREE.Mesh(chimneyGeo, stoneMat);
    chimney.position.set(0, 2.2, 0.2);
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    fireplaceGroup.add(chimney);

    // Firebox opening cutout (dark recessed chamber)
    const fireboxMat = new THREE.MeshStandardMaterial({
      color: 0x120d09,
      roughness: 0.95
    });
    const firebox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.25, 0.65), fireboxMat);
    firebox.position.set(0, 0.65, 0.35);
    fireplaceGroup.add(firebox);

    // Solid wooden mantle shelf
    const mantleWoodTex = Textures.woodPlanks(512, 512, 2, '#422413', '#231208');
    const mantleMat = new THREE.MeshStandardMaterial({ map: mantleWoodTex, roughness: 0.5 });
    const mantle = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.55), mantleMat);
    mantle.position.set(0, 1.4, 0.45);
    mantle.castShadow = true;
    fireplaceGroup.add(mantle);

    // Fireplace hearth extension on floor
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.9), stoneMat);
    hearth.position.set(0, 0.04, 0.7);
    hearth.receiveShadow = true;
    fireplaceGroup.add(hearth);

    // Burning firewood logs inside hearth
    const logMat = new THREE.MeshStandardMaterial({ color: 0x241208, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.0, 8), logMat);
      log.rotation.z = Math.PI / 2 + (i - 1) * 0.18;
      log.rotation.y = (i - 1) * 0.25;
      log.position.set((i - 1) * 0.22, 0.2 + i * 0.07, 0.4);
      log.castShadow = true;
      fireplaceGroup.add(log);
    }

    // Burning glowing coal base
    const emberGeo = new THREE.BoxGeometry(1.2, 0.12, 0.4);
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });
    const emberMesh = new THREE.Mesh(emberGeo, emberMat);
    emberMesh.position.set(0, 0.14, 0.4);
    fireplaceGroup.add(emberMesh);

    // Animated multi-layer flame cone mesh
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff8811,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending
    });
    const flameGeo = new THREE.ConeGeometry(0.45, 0.8, 8);
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0.55, 0.4);
    fireplaceGroup.add(flameMesh);

    // Inner bright yellow flame
    const flameInner = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.55, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff066, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending })
    );
    flameInner.position.set(0, 0.45, 0.4);
    fireplaceGroup.add(flameInner);

    animatedObjects.push({
      update(t) {
        // Natural fire dance
        flameMesh.scale.x = 0.9 + Math.sin(t * 16) * 0.25 + Math.cos(t * 27) * 0.15;
        flameMesh.scale.y = 1.0 + Math.sin(t * 22) * 0.35 + Math.sin(t * 11) * 0.15;
        flameMesh.scale.z = 0.9 + Math.cos(t * 18) * 0.2;
        flameMesh.position.x = Math.sin(t * 14) * 0.05;

        flameInner.scale.x = 0.85 + Math.sin(t * 24) * 0.2;
        flameInner.scale.y = 0.95 + Math.cos(t * 19) * 0.25;

        // Dynamic light flicker
        if (fireplaceLight) {
          fireplaceLight.intensity = 2.6 + Math.sin(t * 13) * 0.45 + Math.cos(t * 29) * 0.3;
          fireplaceLight.position.x = Math.sin(t * 9) * 0.08;
        }
      }
    });

    // =======================================================================
    // THE FOUR ANIMAL TROPHY HEADS: BEAR, MOOSE, WILD BOAR, WOLF
    // Mounted in a grand row above the mantle shelf!
    // =======================================================================
    const trophyMountY = 2.45;
    const plaqueWoodMat = new THREE.MeshStandardMaterial({ color: 0x261309, roughness: 0.4 });

    function createPlaque(x) {
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.82, 0.08), plaqueWoodMat);
      plaque.position.set(x, trophyMountY, 0.65);
      plaque.castShadow = true;
      fireplaceGroup.add(plaque);
      return plaque;
    }

    // 1. BEAR TROPHY (Leftmost: x = -1.15)
    createPlaque(-1.15);
    const bearGroup = new THREE.Group();
    bearGroup.position.set(-1.15, trophyMountY, 0.72);
    const bearFurMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 });
    const bearNoseMat = new THREE.MeshStandardMaterial({ color: 0x110b07, roughness: 0.3 });
    // Head cranium
    const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), bearFurMat);
    bearGroup.add(bearHead);
    // Snout
    const bearSnout = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.22, 10), bearFurMat);
    bearSnout.rotation.x = Math.PI / 2;
    bearSnout.position.set(0, -0.04, 0.2);
    bearGroup.add(bearSnout);
    // Nose tip
    const bearNose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), bearNoseMat);
    bearNose.position.set(0, -0.02, 0.32);
    bearGroup.add(bearNose);
    // Rounded ears
    const bearEarL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), bearFurMat);
    bearEarL.position.set(-0.16, 0.18, -0.04);
    const bearEarR = bearEarL.clone();
    bearEarR.position.x = 0.16;
    bearGroup.add(bearEarL, bearEarR);
    fireplaceGroup.add(bearGroup);

    // 2. MOOSE TROPHY (Center-Left: x = -0.38) with majestic antlers
    createPlaque(-0.38);
    const mooseGroup = new THREE.Group();
    mooseGroup.position.set(-0.38, trophyMountY, 0.72);
    const mooseFurMat = new THREE.MeshStandardMaterial({ color: 0x4a3425, roughness: 0.9 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xd9cbb3, roughness: 0.7 });
    // Head & elongated muzzle
    const mooseHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), mooseFurMat);
    mooseGroup.add(mooseHead);
    const mooseMuzzle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.32), mooseFurMat);
    mooseMuzzle.position.set(0, -0.08, 0.22);
    mooseGroup.add(mooseMuzzle);
    // Dewlap/bell
    const dewlap = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), mooseFurMat);
    dewlap.position.set(0, -0.24, 0.14);
    mooseGroup.add(dewlap);
    // Wide palmate antlers
    const antlerBladeGeo = new THREE.BoxGeometry(0.38, 0.18, 0.04);
    const antlerL = new THREE.Mesh(antlerBladeGeo, antlerMat);
    antlerL.position.set(-0.32, 0.24, 0.05);
    antlerL.rotation.z = 0.35;
    antlerL.rotation.y = -0.2;
    const antlerR = new THREE.Mesh(antlerBladeGeo, antlerMat);
    antlerR.position.set(0.32, 0.24, 0.05);
    antlerR.rotation.z = -0.35;
    antlerR.rotation.y = 0.2;
    mooseGroup.add(antlerL, antlerR);
    // Antler tines
    for (let t = -1; t <= 1; t++) {
      const tineL = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.14, 6), antlerMat);
      tineL.position.set(-0.32 + t * 0.1, 0.34, 0.05);
      const tineR = tineL.clone();
      tineR.position.x = 0.32 + t * 0.1;
      mooseGroup.add(tineL, tineR);
    }
    fireplaceGroup.add(mooseGroup);

    // 3. WILD BOAR TROPHY (Center-Right: x = 0.38) with sharp tusks
    createPlaque(0.38);
    const boarGroup = new THREE.Group();
    boarGroup.position.set(0.38, trophyMountY, 0.72);
    const boarFurMat = new THREE.MeshStandardMaterial({ color: 0x2e241c, roughness: 0.95 });
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xede4d4, roughness: 0.3 });
    // Head wedge
    const boarHead = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.44, 10), boarFurMat);
    boarHead.rotation.x = Math.PI / 2;
    boarHead.position.set(0, 0, 0.15);
    boarGroup.add(boarHead);
    // Snout disc
    const boarSnout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 10), boarFurMat);
    boarSnout.rotation.x = Math.PI / 2;
    boarSnout.position.set(0, 0, 0.38);
    boarGroup.add(boarSnout);
    // Upward curved ivory tusks
    const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 6), tuskMat);
    tuskL.position.set(-0.09, 0.02, 0.32);
    tuskL.rotation.z = -0.3;
    tuskL.rotation.x = -0.4;
    const tuskR = tuskL.clone();
    tuskR.position.x = 0.09;
    tuskR.rotation.z = 0.3;
    boarGroup.add(tuskL, tuskR);
    // Pointed alert ears
    const boarEarL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), boarFurMat);
    boarEarL.position.set(-0.16, 0.18, 0.04);
    boarEarL.rotation.z = 0.4;
    const boarEarR = boarEarL.clone();
    boarEarR.position.x = 0.16;
    boarEarR.rotation.z = -0.4;
    boarGroup.add(boarEarL, boarEarR);
    fireplaceGroup.add(boarGroup);

    // 4. WOLF TROPHY (Rightmost: x = 1.15)
    createPlaque(1.15);
    const wolfGroup = new THREE.Group();
    wolfGroup.position.set(1.15, trophyMountY, 0.72);
    const wolfFurMat = new THREE.MeshStandardMaterial({ color: 0x6e6e73, roughness: 0.85 });
    const wolfNoseMat = new THREE.MeshStandardMaterial({ color: 0x161618, roughness: 0.3 });
    // Head & muzzle
    const wolfHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), wolfFurMat);
    wolfGroup.add(wolfHead);
    const wolfMuzzle = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 8), wolfFurMat);
    wolfMuzzle.rotation.x = Math.PI / 2;
    wolfMuzzle.position.set(0, -0.04, 0.2);
    wolfGroup.add(wolfMuzzle);
    const wolfNose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), wolfNoseMat);
    wolfNose.position.set(0, -0.04, 0.34);
    wolfGroup.add(wolfNose);
    // Tall upright triangular ears
    const wolfEarL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), wolfFurMat);
    wolfEarL.position.set(-0.11, 0.2, 0.02);
    wolfEarL.rotation.z = -0.15;
    const wolfEarR = wolfEarL.clone();
    wolfEarR.position.x = 0.11;
    wolfEarR.rotation.z = 0.15;
    wolfGroup.add(wolfEarL, wolfEarR);
    fireplaceGroup.add(wolfGroup);

    scene.add(fireplaceGroup);
  }

  // =========================================================================
  // 8. SOFA, COFFEE TABLE & WOVEN CABIN RUG
  // =========================================================================
  let sofaGroup, tableGroup;

  function buildSofaAndTable() {
    // Beautiful soft rug underneath sofa and coffee table
    const rugTex = Textures.cabinRug(512, 512);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex,
      roughness: 0.95
    });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.8), rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.012, 0.6);
    rug.receiveShadow = true;
    scene.add(rug);

    // Large comfortable sofa where the player sits
    sofaGroup = new THREE.Group();
    sofaGroup.position.set(0, 0, 1.25);

    const sofaFabricTex = Textures.fabric('#452b1b', '#2e1c12');
    const sofaMat = new THREE.MeshStandardMaterial({
      map: sofaFabricTex,
      roughness: 0.85
    });

    // Sofa base
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.32, 1.1), sofaMat);
    base.position.set(0, 0.2, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    sofaGroup.add(base);

    // 3 Thick comfortable seat cushions
    for (let c = -1; c <= 1; c++) {
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.18, 0.88), sofaMat);
      cushion.position.set(c * 0.82, 0.42, 0.05);
      cushion.castShadow = true;
      sofaGroup.add(cushion);
    }

    // High padded backrest
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 0.28), sofaMat);
    backrest.position.set(0, 0.78, 0.45);
    backrest.castShadow = true;
    sofaGroup.add(backrest);

    // Armrests
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 1.05), sofaMat);
    armL.position.set(-1.38, 0.52, 0.02);
    armL.castShadow = true;
    const armR = armL.clone();
    armR.position.x = 1.38;
    sofaGroup.add(armL, armR);

    // Decorative throw pillows
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0x9e3223, roughness: 0.8 });
    const pillowL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.14), pillowMat);
    pillowL.position.set(-1.15, 0.56, 0.22);
    pillowL.rotation.y = 0.35;
    const pillowR = pillowL.clone();
    pillowR.position.x = 1.15;
    pillowR.rotation.y = -0.35;
    sofaGroup.add(pillowL, pillowR);

    scene.add(sofaGroup);

    // Small wooden coffee table directly in front of the sofa
    tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, -0.4);

    const tableWoodTex = Textures.woodPlanks(512, 512, 4, '#502e18', '#2d180b');
    const tableMat = new THREE.MeshStandardMaterial({
      map: tableWoodTex,
      roughness: 0.38
    });

    // Tabletop
    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), tableMat);
    tabletop.position.set(0, 0.52, 0);
    tabletop.castShadow = true;
    tabletop.receiveShadow = true;
    tableGroup.add(tabletop);

    // 4 Sturdy timber legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2e190d, roughness: 0.6 });
    for (let lx of [-0.68, 0.68]) {
      for (let lz of [-0.35, 0.35]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.52, 0.09), legMat);
        leg.position.set(lx, 0.26, lz);
        leg.castShadow = true;
        tableGroup.add(leg);
      }
    }

    // Lower magazine shelf
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.75), tableMat);
    shelf.position.set(0, 0.18, 0);
    tableGroup.add(shelf);

    // Ceramic coffee cup on the coffee table within comfortable reach
    coffeeCupMesh = new THREE.Group();
    coffeeCupMesh.position.set(0.32, 0.56, 0.12);

    const mugMat = new THREE.MeshStandardMaterial({ color: 0xded4c5, roughness: 0.25 });
    const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.095, 16), mugMat);
    coffeeCupMesh.add(mugBody);

    // Dark hot coffee liquid surface
    const coffeeLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.005, 16),
      new THREE.MeshStandardMaterial({ color: 0x1f1008, roughness: 0.1 })
    );
    coffeeLiquid.position.y = 0.042;
    coffeeCupMesh.add(coffeeLiquid);

    // Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 8, 16, Math.PI), mugMat);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.065, 0, 0);
    coffeeCupMesh.add(handle);

    coffeeCupMesh.visible = false; // Appears during blanket relaxation mode
    tableGroup.add(coffeeCupMesh);

    scene.add(tableGroup);
  }

  // =========================================================================
  // 9. HUGE PANORAMIC GLASS WINDOW (TO THE PLAYER'S LEFT)
  // =========================================================================
  let windowFrameGroup, windowGlassMesh;

  function buildPanoramicWindow() {
    windowFrameGroup = new THREE.Group();
    windowFrameGroup.position.set(-4.19, 2.2, 0);

    const winW = 7.4;
    const winH = 4.1;

    // Glass panel extending from floor to ceiling
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      roughness: 0.04,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.52,
      reflectivity: 0.8
    });

    windowGlassMesh = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
    windowGlassMesh.rotation.y = Math.PI / 2;
    windowFrameGroup.add(windowGlassMesh);

    // Heavy wooden window frame & mullions
    const frameWoodMat = new THREE.MeshStandardMaterial({ color: 0x2e190d, roughness: 0.7 });

    // Outer frame perimeter
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, winW), frameWoodMat);
    topBar.position.y = winH / 2 - 0.08;
    const btmBar = topBar.clone();
    btmBar.position.y = -winH / 2 + 0.08;
    windowFrameGroup.add(topBar, btmBar);

    // Vertical timber mullions dividing the panoramic glass into 4 grand panes
    for (let m = -1.8; m <= 1.8; m += 1.8) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.14, winH, 0.12), frameWoodMat);
      mullion.position.z = m;
      mullion.castShadow = true;
      windowFrameGroup.add(mullion);
    }

    scene.add(windowFrameGroup);
  }

  // =========================================================================
  // 10. OUTDOOR LANDSCAPE: PEACEFUL LAKE, PINE FOREST & DISTANT MOUNTAINS
  // =========================================================================
  let outdoorGroup, skyDomeMesh;

  function buildOutdoorLandscape() {
    outdoorGroup = new THREE.Group();

    // Peaceful lake water plane
    const lakeGeo = new THREE.PlaneGeometry(240, 240, 48, 48);
    const waterTex = Textures.waterNormal();
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x184257,
      roughness: 0.08,
      metalness: 0.85,
      normalMap: waterTex,
      normalScale: new THREE.Vector2(0.35, 0.35)
    });

    lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
    lakeMesh.rotation.x = -Math.PI / 2;
    lakeMesh.position.set(-30, -0.25, 20);
    lakeMesh.receiveShadow = true;
    outdoorGroup.add(lakeMesh);

    // Animated gentle lake waves
    animatedObjects.push({
      update(t) {
        if (waterTex) {
          waterTex.offset.x = (t * 0.02) % 1;
          waterTex.offset.y = (t * 0.015) % 1;
        }
        // Subtle undulating water surface
        const pos = lakeGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const v = pos.getY(i);
          const wave = Math.sin(u * 0.12 + t * 1.5) * 0.08 + Math.cos(v * 0.14 + t * 1.8) * 0.06;
          pos.setZ(i, wave);
        }
        pos.needsUpdate = true;
      }
    });

    // Shoreline terrain around the lake
    const shoreGeo = new THREE.PlaneGeometry(160, 40);
    const shoreMat = new THREE.MeshStandardMaterial({ color: 0x2e3527, roughness: 0.95 });
    const shore = new THREE.Mesh(shoreGeo, shoreMat);
    shore.rotation.x = -Math.PI / 2;
    shore.position.set(0, -0.24, -10);
    outdoorGroup.add(shore);

    // Dense coniferous forest: 3D Pine Trees
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2e1d13, roughness: 0.9 });
    const pineFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1a3321, roughness: 0.85 });

    function createPineTree(x, z, scale = 1.0) {
      const tree = new THREE.Group();
      tree.position.set(x, -0.2, z);
      tree.scale.set(scale, scale, scale);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 4.2, 8), trunkMat);
      trunk.position.y = 2.1;
      trunk.castShadow = true;
      tree.add(trunk);

      // 3 Tiers of conifer pine needles
      for (let lvl = 0; lvl < 3; lvl++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(1.6 - lvl * 0.35, 2.2 - lvl * 0.2, 8),
          pineFoliageMat
        );
        cone.position.y = 3.2 + lvl * 1.3;
        cone.castShadow = true;
        tree.add(cone);
      }
      return tree;
    }

    // Distribute pine trees on shoreline and hills
    const treePositions = [
      [-14, 4], [-18, 9], [-22, 14], [-26, 8], [-32, 22],
      [-16, -6], [-24, -12], [-30, -8], [-38, -16],
      [-12, 18], [-20, 26], [-28, 32], [-35, 40],
      [10, -10], [16, -14], [22, -18], [28, -22],
      [-10, 45], [-18, 55], [-26, 62], [-40, 50]
    ];

    treePositions.forEach(p => {
      const s = 0.8 + Math.random() * 0.6;
      outdoorGroup.add(createPineTree(p[0], p[1], s));
    });

    // Distant mountain ridges
    const mtnMat = new THREE.MeshStandardMaterial({ color: 0x3d4b58, roughness: 0.95 });
    for (let m = 0; m < 5; m++) {
      const mtn = new THREE.Mesh(
        new THREE.ConeGeometry(24 + m * 6, 28 + m * 8, 6),
        mtnMat
      );
      mtn.position.set(-65 - m * 15, 0, 50 + m * 24);
      outdoorGroup.add(mtn);
    }

    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(180, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x2b4c68,
      side: THREE.BackSide
    });
    skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
    outdoorGroup.add(skyDomeMesh);

    scene.add(outdoorGroup);
  }

  // =========================================================================
  // 11. WOODEN PIER (OUT ON THE LAKE)
  // =========================================================================
  let pierGroup;

  function buildPier() {
    pierGroup = new THREE.Group();
    pierGroup.position.set(0, 0, 0);

    const plankTex = Textures.woodPlanks(512, 512, 6, '#4d301b', '#261408');
    plankTex.repeat.set(1, 4);
    const pierMat = new THREE.MeshStandardMaterial({
      map: plankTex,
      roughness: 0.65
    });

    // Pier deck extending out onto the water (from z = 4.3 to z = 14)
    const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 10.0), pierMat);
    pierDeck.position.set(0, -0.07, 9.3);
    pierDeck.receiveShadow = true;
    pierGroup.add(pierDeck);

    // Wooden pilings / stilts in the water
    const postMat = new THREE.MeshStandardMaterial({ color: 0x29180c, roughness: 0.9 });
    for (let pz = 5.5; pz <= 13.5; pz += 2.5) {
      for (let px of [-1.25, 1.25]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 2.2, 8), postMat);
        post.position.set(px, -0.85, pz);
        post.castShadow = true;
        pierGroup.add(post);
      }
    }

    // Pier bollards & rustic nautical lantern
    const bollardMat = new THREE.MeshStandardMaterial({ color: 0x1f1f22, metalness: 0.8, roughness: 0.4 });
    const bollardL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8), bollardMat);
    bollardL.position.set(-1.25, 0.15, 13.8);
    const bollardR = bollardL.clone();
    bollardR.position.x = 1.25;
    pierGroup.add(bollardL, bollardR);

    // Nautical lantern on the end of the pier
    const lanternPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 8), bollardMat);
    lanternPost.position.set(1.25, 0.7, 13.2);
    const lanternGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.09, 0.22, 8),
      new THREE.MeshBasicMaterial({ color: 0xffea88 })
    );
    lanternGlass.position.set(1.25, 1.35, 13.2);
    const pierLight = new THREE.PointLight(0xffcc66, 1.2, 6);
    pierLight.position.set(1.25, 1.35, 13.2);
    pierGroup.add(lanternPost, lanternGlass, pierLight);

    scene.add(pierGroup);
  }

  // =========================================================================
  // 12. STEAM PARTICLES & WEATHER (BLIZZARD SNOW PARTICLES)
  // =========================================================================
  function buildSteamAndParticles() {
    // 1. Rising coffee steam particles
    const steamGeo = new THREE.BufferGeometry();
    const steamCount = 35;
    const steamPositions = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 0.04;
      steamPositions[i * 3 + 1] = Math.random() * 0.35;
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));

    const steamMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    steamParticles = new THREE.Points(steamGeo, steamMat);
    steamParticles.position.set(0.32, 0.62, 0.12);
    steamParticles.visible = false;
    tableGroup.add(steamParticles);

    // 2. Swirling snow particles for Winter base
    const snowGeo = new THREE.BufferGeometry();
    const snowCount = 450;
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 50;
      snowPositions[i * 3 + 1] = Math.random() * 25;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.75
    });
    snowParticles = new THREE.Points(snowGeo, snowMat);
    snowParticles.visible = false;
    scene.add(snowParticles);

    animatedObjects.push({
      update(t) {
        // Animate rising steam
        if (steamParticles && steamParticles.visible) {
          const sPos = steamGeo.attributes.position;
          for (let i = 0; i < steamCount; i++) {
            let y = sPos.getY(i) + 0.0035;
            if (y > 0.4) y = 0;
            sPos.setY(i, y);
            sPos.setX(i, Math.sin(t * 4 + i) * 0.02);
          }
          sPos.needsUpdate = true;
        }

        // Animate swirling snow
        if (snowParticles && snowParticles.visible) {
          const snPos = snowGeo.attributes.position;
          for (let i = 0; i < snowCount; i++) {
            let y = snPos.getY(i) - 0.08;
            let x = snPos.getX(i) - 0.04;
            if (y < 0) y = 25;
            if (x < -25) x = 25;
            snPos.setY(i, y);
            snPos.setX(i, x);
          }
          snPos.needsUpdate = true;
        }
      }
    });
  }

  // =========================================================================
  // 13. FIRST-PERSON CAMERA CONTROLS (MOUSE, TOUCH & SMOOTH LERP)
  // =========================================================================
  let isDragging = false;
  let prevPointerX = 0, prevPointerY = 0;

  function setupInputControls() {
    const dom = renderer.domElement;

    // Mouse drag controls
    dom.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      SoundSystem.init();
      SoundSystem.resume();
      hideLookHint();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevPointerX;
      const dy = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      STATE.camera.targetYaw -= dx * 0.0032;
      STATE.camera.targetPitch -= dy * 0.0028;
      clampPitch();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch controls for mobile
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevPointerX = e.touches[0].clientX;
        prevPointerY = e.touches[0].clientY;
        SoundSystem.init();
        SoundSystem.resume();
        hideLookHint();
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevPointerX;
      const dy = e.touches[0].clientY - prevPointerY;
      prevPointerX = e.touches[0].clientX;
      prevPointerY = e.touches[0].clientY;

      STATE.camera.targetYaw -= dx * 0.0042;
      STATE.camera.targetPitch -= dy * 0.0036;
      clampPitch();
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Keyboard controls for subtle look
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') STATE.camera.targetYaw += 0.08;
      if (e.key === 'ArrowRight' || e.key === 'd') STATE.camera.targetYaw -= 0.08;
      if (e.key === 'ArrowUp' || e.key === 'w') STATE.camera.targetPitch += 0.06;
      if (e.key === 'ArrowDown' || e.key === 's') STATE.camera.targetPitch -= 0.06;
      clampPitch();
    });

    // Mouse wheel slight zoom
    dom.addEventListener('wheel', (e) => {
      STATE.camera.fov = Math.min(80, Math.max(50, STATE.camera.fov + e.deltaY * 0.04));
      camera.fov = STATE.camera.fov;
      camera.updateProjectionMatrix();
    }, { passive: true });
  }

  function clampPitch() {
    // Pitch clamped between -62 deg and +62 deg
    const maxPitch = 1.08;
    STATE.camera.targetPitch = Math.max(-maxPitch, Math.min(maxPitch, STATE.camera.targetPitch));
  }

  function hideLookHint() {
    const hint = document.getElementById('lookHint');
    if (hint) hint.classList.add('fade-out');
  }

  function onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // =========================================================================
  // 14. THE THREE MAIN BUTTON ACTIONS
  // =========================================================================

  // --- BUTTON 1: GO OUT TO THE PIER ---
  function goToPier() {
    STATE.location = 'pier';
    targetPosition.copy(STATE.positions.pier);
    STATE.camera.targetYaw = 0; // Look straight towards open lake
    STATE.camera.targetPitch = 0;

    // Toggle panels
    document.getElementById('mainButtonsPanel').style.display = 'none';
    document.getElementById('pierReturnPanel').hidden = false;

    SoundSystem.setEnvironment('pier', STATE.currentBase);
    showToast('Standing on the wooden pier. Take in the peaceful lake and fresh breeze.');
  }

  // Return to base from pier
  function returnToBase() {
    STATE.location = 'sofa';
    targetPosition.copy(STATE.positions.sofa);
    STATE.camera.targetYaw = 0; // Look towards fireplace
    STATE.camera.targetPitch = 0;

    document.getElementById('mainButtonsPanel').style.display = 'flex';
    document.getElementById('pierReturnPanel').hidden = true;

    SoundSystem.setEnvironment('sofa', STATE.currentBase);
    showToast('Returned inside to the warm fireplace and cozy sofa.');
  }

  // --- BUTTON 2: CHANGE BASE (FOREST, MOUNTAIN, LAKESIDE, WINTER) ---
  function openBaseSelector() {
    document.getElementById('modalBases').hidden = false;
  }

  function closeBaseSelector() {
    document.getElementById('modalBases').hidden = true;
  }

  function selectBase(baseKey) {
    const cfg = BASES_CONFIG[baseKey];
    if (!cfg) return;

    STATE.currentBase = baseKey;
    closeBaseSelector();

    // Update active card styling
    document.querySelectorAll('.base-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-base') === baseKey);
    });

    // Update top badge
    document.getElementById('badgeIcon').textContent = cfg.icon;
    document.getElementById('badgeTitle').textContent = cfg.name;
    document.getElementById('badgeSub').textContent = cfg.sub;

    // Reconfigure 3D environment & lighting
    ambientLight.color.setHex(cfg.ambientColor);
    ambientLight.intensity = cfg.ambientIntensity;
    sunLight.color.setHex(cfg.sunColor);
    sunLight.intensity = cfg.sunIntensity;
    sunLight.position.set(cfg.sunPos[0], cfg.sunPos[1], cfg.sunPos[2]);

    lakeMesh.material.color.setHex(cfg.lakeColor);
    skyDomeMesh.material.color.set(cfg.skyTop);

    // Weather particles
    snowParticles.visible = (baseKey === 'winter');

    // Audio update
    SoundSystem.setEnvironment(STATE.location, baseKey);

    showToast(cfg.toast);
  }

  // --- BUTTON 3: WRAP IN BLANKET AND DRINK HOT COFFEE ---
  function toggleRelaxationMode() {
    STATE.isRelaxing = !STATE.isRelaxing;

    const overlay = document.getElementById('fpBlanketOverlay');
    const hands = document.getElementById('fpCoffeeHands');
    const btn = document.getElementById('btnBlanket');
    const label = document.getElementById('blanketBtnLabel');
    const sub = document.getElementById('blanketBtnSub');
    const icon = document.getElementById('blanketBtnIcon');

    if (STATE.isRelaxing) {
      // 1. Drape soft blanket over player's legs / lap
      overlay.classList.add('active');
      btn.classList.add('active-blanket');
      icon.textContent = '🧣';
      label.textContent = 'Remove Blanket';
      sub.textContent = 'Return to Normal Mode';

      // 2. Coffee appears on table with rising steam
      coffeeCupMesh.visible = true;
      steamParticles.visible = true;

      // 3. Play cozy blanket rustle sound
      SoundSystem.playBlanketSound();

      // 4. Trigger first-person coffee sipping animation
      setTimeout(() => {
        hands.classList.add('sipping');
        // Play gentle sipping sound at peak of lift
        setTimeout(() => {
          SoundSystem.playSipSound();
        }, 1600);

        setTimeout(() => {
          hands.classList.remove('sipping');
        }, 4400);
      }, 500);

      showToast('Wrapped warm in a soft blanket, sipping hot coffee by the fireplace.');
    } else {
      // Remove blanket and return to normal mode
      overlay.classList.remove('active');
      btn.classList.remove('active-blanket');
      icon.textContent = '🧣';
      label.textContent = 'Wrap Yourself in a Blanket and Drink Hot Coffee';
      sub.textContent = 'Cozy relaxation mode';

      coffeeCupMesh.visible = false;
      steamParticles.visible = false;
      hands.classList.remove('sipping');

      SoundSystem.playBlanketSound();
      showToast('Removed blanket. Sitting comfortably on the sofa.');
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('cozyToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4200);
  }

  // =========================================================================
  // 15. MAIN RENDER LOOP & CAMERA LERP
  // =========================================================================
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Smooth camera position transition (lerp)
    currentPosition.lerp(targetPosition, 0.06);
    camera.position.copy(currentPosition);

    // Smooth camera rotation transition (damping)
    STATE.camera.yaw += (STATE.camera.targetYaw - STATE.camera.yaw) * 0.12;
    STATE.camera.pitch += (STATE.camera.targetPitch - STATE.camera.pitch) * 0.12;

    camera.rotation.y = STATE.camera.yaw;
    camera.rotation.x = STATE.camera.pitch;

    // Run procedural animations
    for (let i = 0; i < animatedObjects.length; i++) {
      animatedObjects[i].update(time, delta);
    }

    renderer.render(scene, camera);
  }

  // =========================================================================
  // 16. UI ATTACHMENT & INITIALIZATION
  // =========================================================================
  function initUI() {
    // Button 1: Go Out to Pier
    document.getElementById('btnPier').addEventListener('click', goToPier);
    document.getElementById('btnReturnBase').addEventListener('click', returnToBase);

    // Button 2: Change Base
    document.getElementById('btnChangeBase').addEventListener('click', openBaseSelector);
    document.getElementById('btnCloseBases').addEventListener('click', closeBaseSelector);
    document.getElementById('modalBases').addEventListener('click', (e) => {
      if (e.target.id === 'modalBases') closeBaseSelector();
    });

    document.querySelectorAll('.base-card').forEach(card => {
      card.addEventListener('click', () => {
        const baseKey = card.getAttribute('data-base');
        selectBase(baseKey);
      });
    });

    // Button 3: Blanket & Coffee
    document.getElementById('btnBlanket').addEventListener('click', toggleRelaxationMode);

    // Audio toggle
    document.getElementById('btnAudioToggle').addEventListener('click', () => {
      const on = SoundSystem.toggleMute();
      document.getElementById('audioIcon').textContent = on ? '🔊' : '🔇';
      showToast(on ? 'Sound effects enabled (Fire, water, breeze).' : 'Sound muted.');
    });

    // Fullscreen toggle
    document.getElementById('btnFullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Escape closes modals or returns from pier
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('modalBases');
        if (!modal.hidden) {
          closeBaseSelector();
        } else if (STATE.location === 'pier') {
          returnToBase();
        }
      }
    });
  }

  // =========================================================================
  // ENTRY POINT
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initThree();
    initUI();
    animate();

    // Auto-hide hint after 6s
    setTimeout(hideLookHint, 6000);
  });

})();
