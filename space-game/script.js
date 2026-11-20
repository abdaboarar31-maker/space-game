// عناصر الواجهة
const sceneContainer = document.getElementById('sceneContainer');
const enemyLabelsLayer = document.getElementById('enemyLabelsLayer');
const hud = document.getElementById('hud');
const activeBuffsEl = document.getElementById('activeBuffs');

const startScreen = document.getElementById('startScreen');
const stageCompleteModal = document.getElementById('stageCompleteModal');
const settingsModal = document.getElementById('settingsModal');
const aboutModal = document.getElementById('aboutModal');
const gameOverScreen = document.getElementById('gameOverScreen');

const scoreDisplay = document.getElementById('scoreDisplay');
const stageDisplay = document.getElementById('stageDisplay');
const stageProgressDisplay = document.getElementById('stageProgressDisplay');
const healthBar = document.getElementById('healthBar');
const highScoreStart = document.getElementById('highScoreStart');
const highScoreEnd = document.getElementById('highScoreEnd');
const finalScore = document.getElementById('finalScore');

const stageCompleteBadge = document.getElementById('stageCompleteBadge');
const stageCompleteTitle = document.getElementById('stageCompleteTitle');
const stageCompleteDesc = document.getElementById('stageCompleteDesc');
const stageScoreValue = document.getElementById('stageScoreValue');
const stageBonusValue = document.getElementById('stageBonusValue');
const nextStageBtn = document.getElementById('nextStageBtn');

const startBtn = document.getElementById('startBtn');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
const restartBtn = document.getElementById('restartBtn');
const homeBtn = document.getElementById('homeBtn');
const aboutBtn = document.getElementById('aboutBtn');
const closeAboutBtn = document.getElementById('closeAboutBtn');

const soundToggle = document.getElementById('soundToggle');
const autoFireToggle = document.getElementById('autoFireToggle');
const diffButtons = document.querySelectorAll('.diff-btn');

// إعدادات وحالة اللعبة
let width = window.innerWidth || 800;
let height = window.innerHeight || 600;

let gameState = 'START'; // START, PLAYING, STAGE_COMPLETE, PAUSED, GAMEOVER
let previousStateBeforeModal = 'START';
let pausedAt = 0;

let score = 0;
let stage = 1;
let enemiesSpawnedInStage = 0;
let enemiesDefeatedInStage = 0;
let stageTargetCount = 10;
let highScore = 0;

try {
    highScore = parseInt(localStorage.getItem('abdcode_space3d_highscore') || '0', 10);
} catch (e) {
    highScore = 0;
}
highScoreStart.textContent = highScore;

const settings = {
    sound: true,
    autoFire: true,
    difficulty: 'normal'
};

const difficultyConfig = {
    easy: { spawnRate: 1450, enemySpeedMult: 0.78, enemyHpMult: 0.85, fireCooldownMult: 1.25 },
    normal: { spawnRate: 1100, enemySpeedMult: 1.0, enemyHpMult: 1.0, fireCooldownMult: 1.0 },
    hard: { spawnRate: 820, enemySpeedMult: 1.28, enemyHpMult: 1.3, fireCooldownMult: 0.78 }
};

// تعريف المراحل 3D (كل مرحلة بتصميم وألوان وأجواء وأعداء مختلفين)
const STAGE_THEMES = [
    {
        name: 'السديم النيون',
        desc: 'أجواء سماوية هادئة، أسراب خفيفة واشتباك مباشر',
        bgHex: 0x050a18,
        fogHex: 0x07122b,
        lightHex: 0x00f2fe,
        accentCss: '#00f2fe',
        planetHex: 0x0284c7,
        ringHex: 0x38bdf8,
        enemyColors: { interceptor: 0x38bdf8, cruiser: 0x818cf8, crystal: 0x22d3ee },
        targetCount: 10,
        enemyFireInterval: 2100,
        hpMult: 1.0,
        speedMult: 1.0
    },
    {
        name: 'عاصفة النيازك',
        desc: 'قطاع بركاني ناري مع طرادات ثقيلة وطلقات مزدوجة',
        bgHex: 0x160708,
        fogHex: 0x2b0d0e,
        lightHex: 0xf97316,
        accentCss: '#fb923c',
        planetHex: 0xea580c,
        ringHex: 0xfbbf24,
        enemyColors: { interceptor: 0xfb7185, cruiser: 0xef4444, crystal: 0xf97316 },
        targetCount: 14,
        enemyFireInterval: 1750,
        hpMult: 1.4,
        speedMult: 1.15
    },
    {
        name: 'المدار القرمزي',
        desc: 'مناورات سريعة وهجوم مكثف من أسطول القرمزي',
        bgHex: 0x150414,
        fogHex: 0x2c0829,
        lightHex: 0xf43f5e,
        accentCss: '#f43f5e',
        planetHex: 0xbe123c,
        ringHex: 0xf472b6,
        enemyColors: { interceptor: 0xf43f5e, cruiser: 0xc026d3, crystal: 0xe11d48 },
        targetCount: 18,
        enemyFireInterval: 1450,
        hpMult: 1.85,
        speedMult: 1.28
    },
    {
        name: 'قلب المجرة الذهبي',
        desc: 'معركة النخبة وسط الطاقة الذهبية والزمردية',
        bgHex: 0x06130f,
        fogHex: 0x0f261d,
        lightHex: 0xfbbf24,
        accentCss: '#fbbf24',
        planetHex: 0xd97706,
        ringHex: 0x34d399,
        enemyColors: { interceptor: 0x34d399, cruiser: 0xfbbf24, crystal: 0xa3e635 },
        targetCount: 22,
        enemyFireInterval: 1200,
        hpMult: 2.35,
        speedMult: 1.4
    }
];

function getStageConfig(stageNum) {
    const idx = (stageNum - 1) % STAGE_THEMES.length;
    const cycle = Math.floor((stageNum - 1) / STAGE_THEMES.length);
    const base = STAGE_THEMES[idx];
    return {
        ...base,
        stageNum,
        label: cycle > 0 ? `${base.name} +${cycle}` : base.name,
        targetCount: base.targetCount + cycle * 6,
        hpMult: base.hpMult * (1 + cycle * 0.4),
        speedMult: base.speedMult * (1 + cycle * 0.1),
        enemyFireInterval: Math.max(850, base.enemyFireInterval * Math.pow(0.9, cycle))
    };
}

// نظام الصوت الآمن (Web Audio API)
let audioCtx = null;
function initAudio() {
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (e) {}
}

function playSound(type) {
    if (!settings.sound) return;
    try {
        initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        if (type === 'shoot') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(720, now);
            osc.frequency.exponentialRampToValueAtTime(190, now + 0.08);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'enemyShoot') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'explosion') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.26);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
            osc.start(now);
            osc.stop(now + 0.26);
        } else if (type === 'hit') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(210, now);
            osc.frequency.exponentialRampToValueAtTime(65, now + 0.14);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.start(now);
            osc.stop(now + 0.14);
        } else if (type === 'powerup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(920, now + 0.22);
            gain.gain.setValueAtTime(0.13, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'stageClear') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(840, now + 0.35);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch (e) {}
}

// ==========================================
// إعداد مشهد Three.js ثلاثي الأبعاد 3D
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050a18);
scene.fog = new THREE.FogExp2(0x07122b, 0.016);

const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 200);
// كاميرا قريبة خلف السفينة لإحساس قتال 3D قريب ومباشر
camera.position.set(0, 6.2, 13.5);
camera.lookAt(0, 0.5, -14);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
sceneContainer.appendChild(renderer.domElement);

// إضاءة المشهد 3D
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(8, 18, 12);
scene.add(dirLight);

const stagePointLight = new THREE.PointLight(0x00f2fe, 2.2, 75);
stagePointLight.position.set(0, 6, -15);
scene.add(stagePointLight);

// كوكب خلفي ثلاثي الأبعاد يتغير لونه وحلقته مع كل مرحلة
const bgPlanetGroup = new THREE.Group();
const planetMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.55,
    metalness: 0.2,
    emissive: 0x0369a1,
    emissiveIntensity: 0.35
});
const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(9, 28, 28), planetMat);
bgPlanetGroup.add(planetMesh);

const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45
});
const ringMesh = new THREE.Mesh(new THREE.RingGeometry(11.5, 15.5, 40), ringMat);
ringMesh.rotation.x = Math.PI * 0.38;
ringMesh.rotation.y = 0.25;
bgPlanetGroup.add(ringMesh);
bgPlanetGroup.position.set(-18, 12, -62);
scene.add(bgPlanetGroup);

// شبكة فضائية سفلية ثلاثية الأبعاد تعطي إحساس السرعة والعمق
const gridHelper = new THREE.GridHelper(90, 36, 0x00f2fe, 0x0f2547);
gridHelper.position.set(0, -4.5, -25);
scene.add(gridHelper);

// نجوم ثلاثية الأبعاد تندفع نحوك
const starCount = 420;
const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 90;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 55 + 6;
    starPositions[i * 3 + 2] = -Math.random() * 110 + 10;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.85 });
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// بناء مجسم سفينة اللاعب 3D
function createPlayerShip3D() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.45,
        roughness: 0.25
    });
    const wingMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0x00f2fe,
        emissiveIntensity: 0.25
    });
    const cockpitMat = new THREE.MeshStandardMaterial({
        color: 0x00f2fe,
        emissive: 0x00f2fe,
        emissiveIntensity: 0.65,
        roughness: 0.15
    });

    // الهيكل الرئيسي
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.65, 2.6, 8), bodyMat);
    nose.rotation.x = -Math.PI / 2;
    group.add(nose);

    // قمرة القيادة
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), cockpitMat);
    cockpit.scale.set(0.85, 0.65, 1.5);
    cockpit.position.set(0, 0.28, 0.1);
    group.add(cockpit);

    // الأجنحة الجانبية
    const wings = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 1.1), wingMat);
    wings.position.set(0, 0, 0.45);
    group.add(wings);

    // زعانف طرفية
    const finGeo = new THREE.BoxGeometry(0.14, 0.65, 0.8);
    const leftFin = new THREE.Mesh(finGeo, bodyMat);
    leftFin.position.set(-1.55, 0.2, 0.5);
    const rightFin = new THREE.Mesh(finGeo, bodyMat);
    rightFin.position.set(1.55, 0.2, 0.5);
    group.add(leftFin, rightFin);

    // لهب المحرك
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.1, 10), flameMat);
    flame.rotation.x = Math.PI / 2;
    flame.position.set(0, 0, 1.65);
    group.add(flame);

    // هالة الدرع الواقي 3D
    const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.26,
        wireframe: true
    });
    const shieldSphere = new THREE.Mesh(new THREE.SphereGeometry(2.1, 18, 18), shieldMat);
    shieldSphere.visible = false;
    group.add(shieldSphere);

    group.userData = { flame, shieldSphere };
    return group;
}

const playerMesh = createPlayerShip3D();
playerMesh.position.set(0, 0, 4.5); // موقع قريب للكاميرا والأعداء
scene.add(playerMesh);

// حالة اللاعب
const player = {
    x: 0,
    y: 0,
    z: 4.5,
    hp: 100,
    maxHp: 100,
    lastShot: 0,
    baseFireRate: 220,
    weaponLevel: 1,
    weaponTimer: 0,
    weaponDuration: 10000,
    rapidTimer: 0,
    rapidDuration: 9000,
    shieldTimer: 0,
    shieldDuration: 9000
};

// حدود الحركة 3D بحيث تبقى السفينة واضحة دائماً
function getBounds3D() {
    const aspect = width / height;
    const maxX = Math.max(4.6, Math.min(9.5, 5.8 * aspect));
    return { minX: -maxX, maxX, minY: -1.8, maxY: 3.4 };
}

window.addEventListener('resize', () => {
    width = window.innerWidth || 800;
    height = window.innerHeight || 600;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// التحكم بلوحة المفاتيح واللمس/الماوس
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Escape' && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
        togglePauseSettings();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

let isPointerDown = false;
sceneContainer.addEventListener('pointerdown', (e) => {
    if (gameState !== 'PLAYING') return;
    isPointerDown = true;
    movePlayerFromScreen(e.clientX, e.clientY);
});

window.addEventListener('pointermove', (e) => {
    if (!isPointerDown || gameState !== 'PLAYING') return;
    movePlayerFromScreen(e.clientX, e.clientY);
});

window.addEventListener('pointerup', () => {
    isPointerDown = false;
});

function movePlayerFromScreen(clientX, clientY) {
    const b = getBounds3D();
    const nx = (clientX / width) * 2 - 1;
    const ny = -(clientY / height) * 2 + 1;
    player.x = Math.max(b.minX, Math.min(b.maxX, nx * b.maxX * 1.1));
    player.y = Math.max(b.minY, Math.min(b.maxY, ny * 2.8 + 0.8));
}

// القوائم ثلاثية الأبعاد
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerups = [];
let particles = [];
let lastEnemySpawn = 0;

function clearAllEntities() {
    bullets.forEach(b => scene.remove(b.mesh));
    enemyBullets.forEach(b => scene.remove(b.mesh));
    enemies.forEach(e => {
        scene.remove(e.mesh);
        if (e.labelEl) e.labelEl.remove();
    });
    powerups.forEach(p => scene.remove(p.mesh));
    particles.forEach(pt => scene.remove(pt.mesh));

    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerups = [];
    particles = [];
    enemyLabelsLayer.innerHTML = '';
}

// تطبيق أجواء وألوان المرحلة 3D
function applyStageEnvironment(stageNum) {
    const cfg = getStageConfig(stageNum);
    scene.background = new THREE.Color(cfg.bgHex);
    scene.fog = new THREE.FogExp2(cfg.fogHex, 0.015);
    stagePointLight.color.setHex(cfg.lightHex);
    planetMat.color.setHex(cfg.planetHex);
    planetMat.emissive.setHex(cfg.planetHex);
    ringMat.color.setHex(cfg.ringHex);

    stageDisplay.textContent = `${stageNum} • ${cfg.label}`;
    stageDisplay.style.color = cfg.accentCss;
    updateStageProgressUI();
}

function updateStageProgressUI() {
    stageProgressDisplay.textContent = `${enemiesDefeatedInStage} / ${stageTargetCount}`;
}

// إطلاق نار اللاعب 3D
function firePlayerBullet(now) {
    const currentFireRate = player.rapidTimer > now ? player.baseFireRate * 0.52 : player.baseFireRate;
    if (now - player.lastShot < currentFireRate) return;
    player.lastShot = now;
    playSound('shoot');

    const spawnSingle = (offsetX, vx, colorHex) => {
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 1.5, 8),
            new THREE.MeshBasicMaterial({ color: colorHex })
        );
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(player.x + offsetX, player.y, player.z - 1.4);
        scene.add(mesh);
        bullets.push({ mesh, vx, vz: -0.95, radius: 0.45 });
    };

    if (player.weaponLevel === 1) {
        spawnSingle(0, 0, 0x00f2fe);
    } else if (player.weaponLevel === 2) {
        spawnSingle(-0.65, 0, 0x38bdf8);
        spawnSingle(0.65, 0, 0x38bdf8);
    } else {
        spawnSingle(0, 0, 0xfbbf24);
        spawnSingle(-0.75, -0.07, 0x00f2fe);
        spawnSingle(0.75, 0.07, 0x00f2fe);
    }
}

// بناء مجسم عدو 3D مختلف حسب النوع والمرحلة
function createEnemyMesh3D(type, colorHex) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.35,
        metalness: 0.45,
        roughness: 0.3
    });

    if (type === 'cruiser') {
        // طراد مدرع عريض
        const core = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 1.8), mat);
        const cannonL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 8), mat);
        cannonL.rotation.x = Math.PI / 2;
        cannonL.position.set(-0.85, -0.1, 0.6);
        const cannonR = cannonL.clone();
        cannonR.position.x = 0.85;
        group.add(core, cannonL, cannonR);
    } else if (type === 'crystal') {
        // مركبة بلورية دوّارة
        const oct = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), mat);
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.45, 0.08, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        ring.rotation.x = Math.PI / 2;
        group.add(oct, ring);
    } else {
        // مقاتلة اعتراضية سريعة
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.2, 6), mat);
        body.rotation.x = Math.PI / 2;
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 0.7), mat);
        group.add(body, wing);
    }
    return group;
}

// توليد عدو جديد يتمركز على مسافة قريبة ويطلق النار عليك
function spawnEnemy3D(now) {
    if (enemiesSpawnedInStage >= stageTargetCount) return;

    const cfg = difficultyConfig[settings.difficulty];
    const stg = getStageConfig(stage);
    const b = getBounds3D();
    const rand = Math.random();

    let type = 'interceptor';
    let baseHp = 2 + Math.floor((stage - 1) * 0.8);
    let radius = 1.25;
    let points = 20;

    if (rand > 0.7) {
        type = 'cruiser';
        baseHp = 4 + Math.floor(stage * 1.2);
        radius = 1.55;
        points = 45;
    } else if (rand > 0.4) {
        type = 'crystal';
        baseHp = 3 + Math.floor(stage * 0.9);
        radius = 1.35;
        points = 30;
    }

    const hp = Math.max(1, Math.ceil(baseHp * cfg.enemyHpMult * stg.hpMult));
    const colorHex = stg.enemyColors[type];
    const mesh = createEnemyMesh3D(type, colorHex);

    const spawnX = (Math.random() * 2 - 1) * (b.maxX * 0.85);
    const spawnY = (Math.random() * 2 - 1) * 1.6 + 0.8;
    // يبدأ قريباً نسبياً (-28) ويتوقف للاشتباك القريب عند مسافة (-8 إلى -13) أمام السفينة
    mesh.position.set(spawnX, spawnY, -28);
    scene.add(mesh);

    // إنشاء شريط حياة العدو فوقه على الشاشة
    const labelEl = document.createElement('div');
    labelEl.className = 'enemy-hp-tag';
    labelEl.innerHTML = `
        <span class="enemy-hp-num">${hp}</span>
        <div class="enemy-hp-track">
            <div class="enemy-hp-fill" style="width: 100%;"></div>
        </div>
    `;
    enemyLabelsLayer.appendChild(labelEl);

    enemiesSpawnedInStage++;

    enemies.push({
        mesh,
        labelEl,
        type,
        hp,
        maxHp: hp,
        radius,
        points,
        colorHex,
        engageZ: -7.5 - Math.random() * 5.5, // مسافة قتال قريبة جداً وواضحة
        approachSpeed: 0.24 * cfg.enemySpeedMult * stg.speedMult,
        strafeSpeed: (0.035 + Math.random() * 0.025) * stg.speedMult,
        strafeDir: Math.random() < 0.5 ? 1 : -1,
        lastShot: now + 600 + Math.random() * 700,
        fireInterval: stg.enemyFireInterval * cfg.fireCooldownMult
    });
}

// إطلاق نار العدو نحو اللاعب في الفضاء ثلاثي الأبعاد
function fireEnemyBullet3D(e) {
    playSound('enemyShoot');

    const startPos = e.mesh.position.clone();
    startPos.z += 1.0;

    const targetPos = new THREE.Vector3(player.x, player.y, player.z);
    const dir = targetPos.sub(startPos).normalize();
    const speed = 0.34 + stage * 0.025;

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff3b5c })
    );
    mesh.position.copy(startPos);
    scene.add(mesh);

    enemyBullets.push({
        mesh,
        vx: dir.x * speed,
        vy: dir.y * speed,
        vz: dir.z * speed,
        radius: 0.32
    });
}

// توليد هدية ثلاثية الأبعاد عند تدمير عدو
function spawnPowerup3D(pos) {
    const r = Math.random();
    let kind = 'weapon';
    let colorHex = 0xfbbf24;
    if (r < 0.28) {
        kind = 'health';
        colorHex = 0x10b981;
    } else if (r < 0.54) {
        kind = 'shield';
        colorHex = 0x34d399;
    } else if (r < 0.78) {
        kind = 'rapid';
        colorHex = 0xf43f5e;
    }

    const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.62, 0),
        new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: 0.65,
            roughness: 0.2
        })
    );
    mesh.position.copy(pos);
    scene.add(mesh);

    powerups.push({ mesh, kind, radius: 0.95 });
}

// انفجار ثلاثي الأبعاد
function createExplosion3D(pos, colorHex, count = 14) {
    const geo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        scene.add(mesh);
        particles.push({
            mesh,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            vz: (Math.random() - 0.5) * 0.45,
            life: 1.0
        });
    }
}

// تحديث شريط مؤقتات الهدايا النشطة أعلى الشاشة
function updateBuffsUI(now) {
    const buffs = [];

    if (player.weaponLevel > 1 && player.weaponTimer > now) {
        const rem = player.weaponTimer - now;
        const pct = Math.max(0, Math.min(100, (rem / player.weaponDuration) * 100));
        buffs.push({
            label: player.weaponLevel === 3 ? '⚡ سلاح ثلاثي' : '⚡ سلاح مزدوج',
            sec: (rem / 1000).toFixed(1) + 'ث',
            pct,
            color: '#fbbf24'
        });
    }

    if (player.rapidTimer > now) {
        const rem = player.rapidTimer - now;
        const pct = Math.max(0, Math.min(100, (rem / player.rapidDuration) * 100));
        buffs.push({
            label: '🔥 إطلاق سريع',
            sec: (rem / 1000).toFixed(1) + 'ث',
            pct,
            color: '#f43f5e'
        });
    }

    if (player.shieldTimer > now) {
        const rem = player.shieldTimer - now;
        const pct = Math.max(0, Math.min(100, (rem / player.shieldDuration) * 100));
        buffs.push({
            label: '🛡️ درع حماية',
            sec: (rem / 1000).toFixed(1) + 'ث',
            pct,
            color: '#34d399'
        });
    }

    if (buffs.length === 0) {
        activeBuffsEl.classList.add('hidden');
        activeBuffsEl.innerHTML = '';
        return;
    }

    activeBuffsEl.classList.remove('hidden');
    activeBuffsEl.innerHTML = buffs.map(b => `
        <div class="buff-pill" style="border-color: ${b.color}66;">
            <div class="buff-header">
                <span>${b.label}</span>
                <span class="buff-time">${b.sec}</span>
            </div>
            <div class="buff-track">
                <div class="buff-fill" style="width: ${b.pct}%; background: ${b.color};"></div>
            </div>
        </div>
    `).join('');
}

// تحديث موقع شريط حياة كل عدو 3D على الشاشة
function updateEnemyLabels3D() {
    const tempV = new THREE.Vector3();
    for (let e of enemies) {
        tempV.copy(e.mesh.position);
        tempV.y += e.radius * 0.95;
        tempV.project(camera);

        if (tempV.z > 1) {
            e.labelEl.style.display = 'none';
            continue;
        }

        const x = (tempV.x * 0.5 + 0.5) * width;
        const y = (-(tempV.y * 0.5) + 0.5) * height;
        e.labelEl.style.display = 'flex';
        e.labelEl.style.left = `${x}px`;
        e.labelEl.style.top = `${y}px`;
    }
}

// تحديث منطق اللعبة
function update(now) {
    // تحريك النجوم والكوكب والشبكة لإعطاء حركة فضاء 3D مستمرة
    const posArr = starField.geometry.attributes.position.array;
    const starSpeed = gameState === 'PLAYING' ? 0.55 + stage * 0.08 : 0.18;
    for (let i = 0; i < starCount; i++) {
        posArr[i * 3 + 2] += starSpeed;
        if (posArr[i * 3 + 2] > 14) {
            posArr[i * 3 + 2] = -105;
        }
    }
    starField.geometry.attributes.position.needsUpdate = true;
    bgPlanetGroup.rotation.y += 0.002;
    gridHelper.position.z += gameState === 'PLAYING' ? 0.25 : 0.08;
    if (gridHelper.position.z > -15) gridHelper.position.z = -25;

    if (gameState !== 'PLAYING') return;

    // حركة سفينة اللاعب عبر لوحة المفاتيح
    const b = getBounds3D();
    const moveStep = 0.19;
    let tiltZ = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= moveStep; tiltZ = 0.35; }
    if (keys['ArrowRight'] || keys['KeyD']) { player.x += moveStep; tiltZ = -0.35; }
    if (keys['ArrowUp'] || keys['KeyW']) player.y += moveStep * 0.85;
    if (keys['ArrowDown'] || keys['KeyS']) player.y -= moveStep * 0.85;

    player.x = Math.max(b.minX, Math.min(b.maxX, player.x));
    player.y = Math.max(b.minY, Math.min(b.maxY, player.y));

    playerMesh.position.lerp(new THREE.Vector3(player.x, player.y, player.z), 0.28);
    playerMesh.rotation.z += (tiltZ - playerMesh.rotation.z) * 0.18;
    playerMesh.userData.flame.scale.y = 0.85 + Math.random() * 0.45;
    playerMesh.userData.shieldSphere.visible = player.shieldTimer > now;
    if (playerMesh.userData.shieldSphere.visible) {
        playerMesh.userData.shieldSphere.rotation.y += 0.04;
    }

    // إطلاق النار
    if (settings.autoFire || keys['Space'] || isPointerDown) {
        firePlayerBullet(now);
    }

    // انتهاء مؤقتات الهدايا
    if (player.weaponLevel > 1 && now > player.weaponTimer) player.weaponLevel = 1;
    if (player.rapidTimer > 0 && now > player.rapidTimer) player.rapidTimer = 0;
    if (player.shieldTimer > 0 && now > player.shieldTimer) player.shieldTimer = 0;
    updateBuffsUI(now);

    // توليد أعداء المرحلة الحالية
    const cfg = difficultyConfig[settings.difficulty];
    if (enemiesSpawnedInStage < stageTargetCount && enemies.length < 5 && now - lastEnemySpawn > cfg.spawnRate) {
        spawnEnemy3D(now);
        lastEnemySpawn = now;
    }

    // تحديث رصاص اللاعب
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bl = bullets[i];
        bl.mesh.position.x += bl.vx;
        bl.mesh.position.z += bl.vz;
        if (bl.mesh.position.z < -42) {
            scene.remove(bl.mesh);
            bullets.splice(i, 1);
        }
    }

    // تحديث طلقات الأعداء
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        eb.mesh.position.x += eb.vx;
        eb.mesh.position.y += eb.vy;
        eb.mesh.position.z += eb.vz;

        const dist = eb.mesh.position.distanceTo(playerMesh.position);
        if (dist < 1.25 + eb.radius) {
            createExplosion3D(eb.mesh.position, 0xff3b5c, 8);
            scene.remove(eb.mesh);
            enemyBullets.splice(i, 1);
            playSound('hit');
            damagePlayer(14);
            continue;
        }

        if (eb.mesh.position.z > 14 || eb.mesh.position.z < -45) {
            scene.remove(eb.mesh);
            enemyBullets.splice(i, 1);
        }
    }

    // تحديث الهدايا 3D
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.mesh.position.z += 0.22;
        p.mesh.rotation.y += 0.06;

        if (p.mesh.position.distanceTo(playerMesh.position) < 1.55 + p.radius) {
            playSound('powerup');
            if (p.kind === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 35);
                updateHealthUI();
            } else if (p.kind === 'shield') {
                player.shieldTimer = now + player.shieldDuration;
            } else if (p.kind === 'rapid') {
                player.rapidTimer = now + player.rapidDuration;
            } else {
                player.weaponLevel = Math.min(3, player.weaponLevel + 1);
                player.weaponTimer = now + player.weaponDuration;
            }
            updateBuffsUI(now);
            createExplosion3D(p.mesh.position, 0x34d399, 10);
            scene.remove(p.mesh);
            powerups.splice(i, 1);
            continue;
        }

        if (p.mesh.position.z > 13) {
            scene.remove(p.mesh);
            powerups.splice(i, 1);
        }
    }

    // تحديث الأعداء والاشتباك القريب
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // التقدم حتى مسافة القتال القريبة ثم المناورة أمام اللاعب
        if (e.mesh.position.z < e.engageZ) {
            e.mesh.position.z += e.approachSpeed;
        } else {
            e.mesh.position.x += e.strafeSpeed * e.strafeDir;
            if (e.mesh.position.x > b.maxX * 0.85) e.strafeDir = -1;
            if (e.mesh.position.x < -b.maxX * 0.85) e.strafeDir = 1;
        }

        if (e.type === 'crystal') {
            e.mesh.rotation.y += 0.04;
        } else {
            e.mesh.lookAt(playerMesh.position);
        }

        // إطلاق نار العدو عليك
        if (e.mesh.position.z >= e.engageZ - 3 && now - e.lastShot > e.fireInterval) {
            e.lastShot = now;
            fireEnemyBullet3D(e);
        }

        // تصادم رصاص اللاعب مع العدو
        let destroyed = false;
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bl = bullets[j];
            if (e.mesh.position.distanceTo(bl.mesh.position) < e.radius + bl.radius) {
                scene.remove(bl.mesh);
                bullets.splice(j, 1);
                e.hp--;
                createExplosion3D(bl.mesh.position, 0xffffff, 4);

                // تحديث رقم وشريط حياة العدو
                const numEl = e.labelEl.querySelector('.enemy-hp-num');
                const fillEl = e.labelEl.querySelector('.enemy-hp-fill');
                if (numEl) numEl.textContent = Math.max(0, e.hp);
                if (fillEl) {
                    const pct = Math.max(0, (e.hp / e.maxHp) * 100);
                    fillEl.style.width = `${pct}%`;
                    fillEl.style.background = pct > 50 ? '#22c55e' : (pct > 25 ? '#f59e0b' : '#ef4444');
                }

                if (e.hp <= 0) {
                    playSound('explosion');
                    createExplosion3D(e.mesh.position, e.colorHex, 16);
                    score += e.points;
                    scoreDisplay.textContent = score;
                    enemiesDefeatedInStage++;
                    updateStageProgressUI();

                    // فرصة إسقاط هدية تقوّيك
                    if (Math.random() < 0.34) {
                        spawnPowerup3D(e.mesh.position);
                    }

                    scene.remove(e.mesh);
                    e.labelEl.remove();
                    enemies.splice(i, 1);
                    destroyed = true;
                    break;
                }
            }
        }
        if (destroyed) continue;
    }

    // تحديث الجزيئات 3D
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.mesh.position.x += pt.vx;
        pt.mesh.position.y += pt.vy;
        pt.mesh.position.z += pt.vz;
        pt.life -= 0.035;
        pt.mesh.scale.setScalar(Math.max(0.01, pt.life));
        if (pt.life <= 0) {
            scene.remove(pt.mesh);
            particles.splice(i, 1);
        }
    }

    updateEnemyLabels3D();

    // التحقق من إنهاء المرحلة الحالية وعرض زر "التالي"
    if (enemiesDefeatedInStage >= stageTargetCount && enemies.length === 0) {
        openStageCompleteScreen();
    }
}

function damagePlayer(amount) {
    if (player.shieldTimer > performance.now()) return;
    player.hp = Math.max(0, player.hp - amount);
    updateHealthUI();
    if (player.hp <= 0) {
        endGame();
    }
}

function updateHealthUI() {
    const pct = (player.hp / player.maxHp) * 100;
    healthBar.style.width = `${pct}%`;
    if (pct > 50) {
        healthBar.style.background = 'linear-gradient(90deg, #10b981, #00f2fe)';
    } else if (pct > 25) {
        healthBar.style.background = '#f59e0b';
    } else {
        healthBar.style.background = '#f43f5e';
    }
}

// شاشة إنهاء المرحلة مع زر الانتقال للمرحلة التالية
function openStageCompleteScreen() {
    gameState = 'STAGE_COMPLETE';
    playSound('stageClear');

    // تنظيف أي طلقات متبقية
    bullets.forEach(b => scene.remove(b.mesh));
    enemyBullets.forEach(b => scene.remove(b.mesh));
    bullets = [];
    enemyBullets = [];

    const bonus = stage * 150;
    score += bonus;
    scoreDisplay.textContent = score;

    const nextCfg = getStageConfig(stage + 1);
    stageCompleteBadge.textContent = `تم إكمال المرحلة ${stage}`;
    stageCompleteTitle.textContent = `أنهيت المرحلة ${stage} بنجاح 🎉`;
    stageCompleteDesc.textContent = `المرحلة القادمة (${nextCfg.label}): ${nextCfg.desc}`;
    stageScoreValue.textContent = score;
    stageBonusValue.textContent = `+${bonus}`;
    nextStageBtn.textContent = `التالي ⬅️ المرحلة ${stage + 1}`;

    stageCompleteModal.classList.remove('hidden');
}

function startStage(stageNum) {
    const now = performance.now();
    stage = stageNum;
    const cfg = getStageConfig(stage);
    stageTargetCount = cfg.targetCount;
    enemiesSpawnedInStage = 0;
    enemiesDefeatedInStage = 0;
    lastEnemySpawn = now - 500;

    // تعبئة جزء من الدرع عند بداية مرحلة جديدة
    player.hp = Math.min(player.maxHp, player.hp + 25);
    updateHealthUI();
    applyStageEnvironment(stage);

    stageCompleteModal.classList.add('hidden');
    gameState = 'PLAYING';
}

function startGame() {
    initAudio();
    const now = performance.now();
    clearAllEntities();

    score = 0;
    player.hp = player.maxHp;
    player.weaponLevel = 1;
    player.weaponTimer = 0;
    player.rapidTimer = 0;
    player.shieldTimer = 0;
    player.x = 0;
    player.y = 0;
    playerMesh.position.set(0, 0, player.z);

    scoreDisplay.textContent = '0';
    updateHealthUI();
    updateBuffsUI(now);

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsModal.classList.add('hidden');
    aboutModal.classList.add('hidden');
    stageCompleteModal.classList.add('hidden');
    hud.classList.remove('hidden');

    startStage(1);
}

function endGame() {
    gameState = 'GAMEOVER';
    hud.classList.add('hidden');
    activeBuffsEl.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScore.textContent = score;

    if (score > highScore) {
        highScore = score;
        try {
            localStorage.setItem('abdcode_space3d_highscore', String(highScore));
        } catch (e) {}
    }
    highScoreStart.textContent = highScore;
    highScoreEnd.textContent = highScore;
}

function shiftTimersOnResume(deltaMs) {
    if (deltaMs <= 0) return;
    if (player.weaponTimer > 0) player.weaponTimer += deltaMs;
    if (player.rapidTimer > 0) player.rapidTimer += deltaMs;
    if (player.shieldTimer > 0) player.shieldTimer += deltaMs;
    if (lastEnemySpawn > 0) lastEnemySpawn += deltaMs;
    for (let e of enemies) {
        if (e.lastShot > 0) e.lastShot += deltaMs;
    }
}

function togglePauseSettings() {
    if (gameState === 'PLAYING') {
        pausedAt = performance.now();
        previousStateBeforeModal = 'PLAYING';
        gameState = 'PAUSED';
        restartFromPauseBtn.classList.remove('hidden');
        settingsModal.classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
        shiftTimersOnResume(performance.now() - pausedAt);
        settingsModal.classList.add('hidden');
        gameState = 'PLAYING';
    }
}

// ربط الأزرار
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
restartFromPauseBtn.addEventListener('click', startGame);
nextStageBtn.addEventListener('click', () => startStage(stage + 1));

homeBtn.addEventListener('click', () => {
    clearAllEntities();
    gameOverScreen.classList.add('hidden');
    stageCompleteModal.classList.add('hidden');
    hud.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameState = 'START';
});

openSettingsBtn.addEventListener('click', () => {
    previousStateBeforeModal = 'START';
    restartFromPauseBtn.classList.add('hidden');
    settingsModal.classList.remove('hidden');
});

pauseBtn.addEventListener('click', togglePauseSettings);

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    if (previousStateBeforeModal === 'PLAYING') {
        shiftTimersOnResume(performance.now() - pausedAt);
        gameState = 'PLAYING';
    }
});

aboutBtn.addEventListener('click', () => {
    if (gameState === 'PLAYING') {
        pausedAt = performance.now();
        previousStateBeforeModal = 'PLAYING';
        gameState = 'PAUSED';
    } else {
        previousStateBeforeModal = gameState;
    }
    aboutModal.classList.remove('hidden');
});

closeAboutBtn.addEventListener('click', () => {
    aboutModal.classList.add('hidden');
    if (previousStateBeforeModal === 'PLAYING') {
        shiftTimersOnResume(performance.now() - pausedAt);
        gameState = 'PLAYING';
    }
});

soundToggle.addEventListener('change', (e) => {
    settings.sound = e.target.checked;
    if (settings.sound) initAudio();
});

autoFireToggle.addEventListener('change', (e) => {
    settings.autoFire = e.target.checked;
});

diffButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        diffButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        settings.difficulty = btn.dataset.diff;
    });
});

// حلقة الرسم الرئيسية 3D
function animate(now) {
    requestAnimationFrame(animate);
    update(now);
    renderer.render(scene, camera);
}

requestAnimationFrame(animate);
