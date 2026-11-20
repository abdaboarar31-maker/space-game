const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// عناصر الواجهة
const hud = document.getElementById('hud');
const activeBuffsEl = document.getElementById('activeBuffs');
const startScreen = document.getElementById('startScreen');
const settingsModal = document.getElementById('settingsModal');
const aboutModal = document.getElementById('aboutModal');
const gameOverScreen = document.getElementById('gameOverScreen');

const stageBanner = document.getElementById('stageBanner');
const stageBannerTag = document.getElementById('stageBannerTag');
const stageBannerTitle = document.getElementById('stageBannerTitle');
const stageBannerDesc = document.getElementById('stageBannerDesc');

const scoreDisplay = document.getElementById('scoreDisplay');
const stageDisplay = document.getElementById('stageDisplay');
const healthBar = document.getElementById('healthBar');
const highScoreStart = document.getElementById('highScoreStart');
const highScoreEnd = document.getElementById('highScoreEnd');
const finalScore = document.getElementById('finalScore');

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
let scaleFactor = 1;

let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
let previousStateBeforeModal = 'START';
let pausedAt = 0;
let bannerHideTimeout = null;

let score = 0;
let stage = 1;
let highScore = 0;

try {
    highScore = parseInt(localStorage.getItem('abdcode_space_highscore') || '0', 10);
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
    easy: { spawnRate: 1320, enemySpeedMult: 0.78, enemyHpMult: 0.8 },
    normal: { spawnRate: 960, enemySpeedMult: 1.0, enemyHpMult: 1.0 },
    hard: { spawnRate: 680, enemySpeedMult: 1.32, enemyHpMult: 1.3 }
};

// تعريف المراحل (كل مرحلة تغيّر الأجواء والألوان وأشكال الأعداء وقوتهم)
const STAGE_THEMES = [
    {
        name: 'السديم النيون',
        tag: 'المرحلة 1 • بداية هادئة',
        desc: 'أجواء سماوية وبنفسجية هادئة مع أسراب خفيفة',
        bgTop: '#060913',
        bgBottom: '#0c1633',
        nebulaColor: 'rgba(0, 242, 254, 0.11)',
        accentColor: '#00f2fe',
        starSpeedMult: 1.0,
        spawnMult: 1.0,
        speedMult: 1.0,
        hpMult: 1.0,
        enemyFireChance: 0.0,
        colors: { scout: '#38bdf8', asteroid: '#f59e0b', tank: '#818cf8', striker: '#22d3ee' }
    },
    {
        name: 'عاصفة النيازك',
        tag: 'المرحلة 2 • حرارة وتصاعد',
        desc: 'غبار ناري ونيازك أسرع مع هجمات متفرعة',
        bgTop: '#12070c',
        bgBottom: '#2b100e',
        nebulaColor: 'rgba(249, 115, 22, 0.14)',
        accentColor: '#fb923c',
        starSpeedMult: 1.45,
        spawnMult: 0.84,
        speedMult: 1.18,
        hpMult: 1.35,
        enemyFireChance: 0.22,
        colors: { scout: '#fb7185', asteroid: '#f97316', tank: '#ef4444', striker: '#fbbf24' }
    },
    {
        name: 'المدار القرمزي',
        tag: 'المرحلة 3 • ضغط عالٍ',
        desc: 'أجواء قرمزية حادة ومناورات أسرع وطلقات معادية',
        bgTop: '#140512',
        bgBottom: '#2d0924',
        nebulaColor: 'rgba(244, 63, 94, 0.15)',
        accentColor: '#f43f5e',
        starSpeedMult: 1.85,
        spawnMult: 0.72,
        speedMult: 1.34,
        hpMult: 1.75,
        enemyFireChance: 0.38,
        colors: { scout: '#f43f5e', asteroid: '#e11d48', tank: '#c026d3', striker: '#fda4af' }
    },
    {
        name: 'قلب المجرة الذهبي',
        tag: 'المرحلة 4 • ذروة المعركة',
        desc: 'طاقة ذهبية زمردية وأعداء شديدو التحمل',
        bgTop: '#071210',
        bgBottom: '#162614',
        nebulaColor: 'rgba(251, 191, 36, 0.14)',
        accentColor: '#fbbf24',
        starSpeedMult: 2.2,
        spawnMult: 0.62,
        speedMult: 1.48,
        hpMult: 2.2,
        enemyFireChance: 0.52,
        colors: { scout: '#34d399', asteroid: '#fbbf24', tank: '#f59e0b', striker: '#a3e635' }
    }
];

function getStageConfig(stageNum) {
    const idx = (stageNum - 1) % STAGE_THEMES.length;
    const cycle = Math.floor((stageNum - 1) / STAGE_THEMES.length);
    const base = STAGE_THEMES[idx];
    const extraScale = 1 + cycle * 0.35;

    return {
        ...base,
        stageNum,
        label: cycle > 0 ? `${base.name} (دورة ${cycle + 1})` : base.name,
        tag: cycle > 0 ? `المرحلة ${stageNum} • دورة متقدمة ${cycle + 1}` : base.tag,
        spawnMult: Math.max(0.42, base.spawnMult * Math.pow(0.92, cycle)),
        speedMult: base.speedMult * (1 + cycle * 0.12),
        hpMult: base.hpMult * extraScale,
        enemyFireChance: Math.min(0.75, base.enemyFireChance + cycle * 0.08)
    };
}

function showStageBanner(cfg) {
    stageBannerTag.textContent = cfg.tag;
    stageBannerTitle.textContent = `المرحلة ${cfg.stageNum}: ${cfg.label}`;
    stageBannerDesc.textContent = cfg.desc;
    stageBanner.style.borderColor = cfg.accentColor;
    stageBannerTag.style.color = cfg.accentColor;
    stageBanner.classList.remove('hidden');

    if (bannerHideTimeout) clearTimeout(bannerHideTimeout);
    bannerHideTimeout = setTimeout(() => {
        stageBanner.classList.add('hidden');
    }, 2300);
}

function syncStage(now, announce = true) {
    const newStage = Math.floor(score / 250) + 1;
    if (newStage !== stage) {
        stage = newStage;
        const cfg = getStageConfig(stage);
        stageDisplay.textContent = `${stage} • ${cfg.label}`;
        stageDisplay.style.color = cfg.accentColor;
        if (announce) {
            playSound('stageup');
            showStageBanner(cfg);
        }
    } else {
        const cfg = getStageConfig(stage);
        stageDisplay.textContent = `${stage} • ${cfg.label}`;
        stageDisplay.style.color = cfg.accentColor;
    }
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
            osc.frequency.setValueAtTime(680, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (type === 'explosion') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(32, now + 0.25);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'hit') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.14);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.start(now);
            osc.stop(now + 0.14);
        } else if (type === 'powerup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'stageup') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.32);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
            osc.start(now);
            osc.stop(now + 0.32);
        }
    } catch (e) {}
}

// كائنات اللعبة
const player = {
    x: width / 2,
    y: height - 110,
    radius: 22,
    speed: 6.5,
    hp: 100,
    maxHp: 100,
    lastShot: 0,
    fireRate: 210,
    weaponLevel: 1,
    weaponTimer: 0,
    weaponDuration: 9000,
    shieldTimer: 0,
    shieldDuration: 8000
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let stars = [];
let powerups = [];
let lastEnemySpawn = 0;

// ضبط أبعاد الشاشة
function resizeCanvas() {
    width = window.innerWidth || document.documentElement.clientWidth || 800;
    height = window.innerHeight || document.documentElement.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;

    scaleFactor = Math.min(Math.max(width / 460, 0.8), 1.35);
    player.radius = 20 * scaleFactor;
    player.speed = 6.5 * Math.min(scaleFactor, 1.25);

    player.x = Math.max(player.radius + 10, Math.min(width - player.radius - 10, player.x));
    player.y = Math.max(95, Math.min(height - player.radius - 55, player.y));

    if (stars.length === 0) {
        initStars();
    }
}

function initStars() {
    stars = [];
    const starCount = Math.floor((width * height) / 9000);
    for (let i = 0; i < Math.max(50, starCount); i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.6,
            speed: Math.random() * 1.8 + 0.4,
            alpha: Math.random() * 0.7 + 0.3
        });
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// التحكم بلوحة المفاتيح والماوس واللمس
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
canvas.addEventListener('pointerdown', (e) => {
    if (gameState !== 'PLAYING') return;
    isPointerDown = true;
    movePlayerToPointer(e.clientX, e.clientY, e.pointerType === 'touch');
});

window.addEventListener('pointermove', (e) => {
    if (!isPointerDown || gameState !== 'PLAYING') return;
    movePlayerToPointer(e.clientX, e.clientY, e.pointerType === 'touch');
});

window.addEventListener('pointerup', () => {
    isPointerDown = false;
});

function movePlayerToPointer(clientX, clientY, isTouch) {
    const offsetY = isTouch ? 45 * scaleFactor : 0;
    player.x = Math.max(player.radius + 8, Math.min(width - player.radius - 8, clientX));
    player.y = Math.max(95, Math.min(height - player.radius - 55, clientY - offsetY));
}

// إطلاق النار
function fireBullet(now) {
    if (now - player.lastShot < player.fireRate) return;
    player.lastShot = now;
    playSound('shoot');

    const bSpeed = 11 * Math.min(scaleFactor, 1.25);
    const bRadius = 4 * scaleFactor;

    if (player.weaponLevel === 1) {
        bullets.push({ x: player.x, y: player.y - player.radius, vx: 0, vy: -bSpeed, r: bRadius, color: '#00f2fe' });
    } else if (player.weaponLevel === 2) {
        const spread = 12 * scaleFactor;
        bullets.push({ x: player.x - spread, y: player.y - player.radius * 0.7, vx: 0, vy: -bSpeed, r: bRadius, color: '#38bdf8' });
        bullets.push({ x: player.x + spread, y: player.y - player.radius * 0.7, vx: 0, vy: -bSpeed, r: bRadius, color: '#38bdf8' });
    } else {
        bullets.push({ x: player.x, y: player.y - player.radius, vx: 0, vy: -bSpeed, r: bRadius * 1.1, color: '#fbbf24' });
        bullets.push({ x: player.x - 14 * scaleFactor, y: player.y - player.radius * 0.6, vx: -1.6, vy: -bSpeed, r: bRadius, color: '#00f2fe' });
        bullets.push({ x: player.x + 14 * scaleFactor, y: player.y - player.radius * 0.6, vx: 1.6, vy: -bSpeed, r: bRadius, color: '#00f2fe' });
    }
}

// توليد الأعداء بأشكال وقوى تتغير حسب المرحلة
function spawnEnemy(now) {
    const cfg = difficultyConfig[settings.difficulty];
    const stg = getStageConfig(stage);
    const rand = Math.random();

    let type = 'scout';
    let radius = 18 * scaleFactor;
    let baseHp = 1 + Math.floor((stage - 1) * 0.6);
    let speed = (2.3 + Math.random() * 1.2 + stage * 0.14) * cfg.enemySpeedMult * stg.speedMult * Math.min(scaleFactor, 1.2);
    let color = stg.colors.scout;
    let points = 10;

    if (stage >= 2 && rand > 0.82) {
        type = 'striker';
        radius = 19 * scaleFactor;
        baseHp = 2 + Math.floor(stage * 0.7);
        speed *= 0.92;
        color = stg.colors.striker;
        points = 25;
    } else if (rand > 0.72) {
        type = 'tank';
        radius = 27 * scaleFactor;
        baseHp = 3 + Math.floor(stage * 1.1);
        speed *= 0.65;
        color = stg.colors.tank;
        points = 35;
    } else if (rand > 0.46) {
        type = 'asteroid';
        radius = (20 + Math.random() * 10) * scaleFactor;
        baseHp = 2 + Math.floor((stage - 1) * 0.5);
        speed *= 0.85;
        color = stg.colors.asteroid;
        points = 20;
    }

    const hp = Math.max(1, Math.ceil(baseHp * cfg.enemyHpMult * stg.hpMult));

    enemies.push({
        x: Math.random() * (width - radius * 2 - 24) + radius + 12,
        y: -radius - 16,
        radius,
        hp,
        maxHp: hp,
        speed,
        type,
        color,
        points,
        angle: 0,
        spin: (Math.random() - 0.5) * 0.06,
        swayAmp: type === 'striker' ? (24 + Math.random() * 18) * scaleFactor : 0,
        swayFreq: 0.003 + Math.random() * 0.002,
        phase: Math.random() * Math.PI * 2,
        lastEnemyShot: now + Math.random() * 900
    });
}

// توليد الجزيئات البصرية
function createExplosion(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.5 + 1;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: (Math.random() * 3.5 + 1.5) * scaleFactor,
            color
        });
    }
}

// تحديث واجهة المؤقتات العلوية للتعزيزات
function updateBuffsUI(now) {
    const buffs = [];

    if (player.weaponLevel > 1 && player.weaponTimer > now) {
        const rem = player.weaponTimer - now;
        const pct = Math.max(0, Math.min(100, (rem / player.weaponDuration) * 100));
        buffs.push({
            label: player.weaponLevel === 3 ? '⚡ سلاح ثلاثي' : '⚡ سلاح مزدوج',
            sec: (rem / 1000).toFixed(1) + 's',
            pct,
            color: player.weaponLevel === 3 ? '#fbbf24' : '#38bdf8'
        });
    }

    if (player.shieldTimer > now) {
        const rem = player.shieldTimer - now;
        const pct = Math.max(0, Math.min(100, (rem / player.shieldDuration) * 100));
        buffs.push({
            label: '🛡️ درع طاقة',
            sec: (rem / 1000).toFixed(1) + 's',
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
        <div class="buff-pill" style="border-color: ${b.color}55;">
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

// تحديث منطق اللعبة
function update(now) {
    const stg = getStageConfig(stage);

    // تحريك النجوم في الخلفية
    for (let s of stars) {
        const speedMult = gameState === 'PLAYING' ? 1.5 * stg.starSpeedMult : 0.6;
        s.y += s.speed * speedMult;
        if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
        }
    }

    if (gameState !== 'PLAYING') return;

    // حركة اللاعب عبر لوحة المفاتيح
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
    if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;

    player.x = Math.max(player.radius + 8, Math.min(width - player.radius - 8, player.x));
    player.y = Math.max(95, Math.min(height - player.radius - 55, player.y));

    // إطلاق النار
    if (settings.autoFire || keys['Space'] || isPointerDown) {
        fireBullet(now);
    }

    // انتهاء مؤقتات التعزيزات
    if (player.weaponLevel > 1 && now > player.weaponTimer) {
        player.weaponLevel = 1;
    }
    if (player.shieldTimer > 0 && now > player.shieldTimer) {
        player.shieldTimer = 0;
    }
    updateBuffsUI(now);

    // توليد الأعداء
    const cfg = difficultyConfig[settings.difficulty];
    const currentSpawnInterval = Math.max(300, cfg.spawnRate * stg.spawnMult);
    if (now - lastEnemySpawn > currentSpawnInterval) {
        spawnEnemy(now);
        lastEnemySpawn = now;
    }

    // تحديث رصاص اللاعب
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.y < -20 || b.x < -20 || b.x > width + 20) {
            bullets.splice(i, 1);
        }
    }

    // تحديث طلقات الأعداء
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        eb.x += eb.vx;
        eb.y += eb.vy;

        if (Math.hypot(player.x - eb.x, player.y - eb.y) < player.radius + eb.r - 2) {
            enemyBullets.splice(i, 1);
            playSound('hit');
            createExplosion(eb.x, eb.y, eb.color, 8);
            damagePlayer(12);
            continue;
        }

        if (eb.y > height + 25 || eb.x < -25 || eb.x > width + 25) {
            enemyBullets.splice(i, 1);
        }
    }

    // تحديث المساعدات (Powerups)
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += 2.4;
        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist < player.radius + p.radius) {
            playSound('powerup');
            if (p.kind === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 30);
                updateHealthUI();
            } else if (p.kind === 'shield') {
                player.shieldTimer = now + player.shieldDuration;
            } else {
                player.weaponLevel = Math.min(3, player.weaponLevel + 1);
                player.weaponTimer = now + player.weaponDuration;
            }
            updateBuffsUI(now);
            createExplosion(p.x, p.y, '#10b981', 10);
            powerups.splice(i, 1);
            continue;
        }
        if (p.y > height + 30) powerups.splice(i, 1);
    }

    // تحديث الأعداء والتصادم
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.speed;
        e.angle += e.spin;

        if (e.swayAmp > 0) {
            e.x += Math.cos(now * e.swayFreq + e.phase) * 1.4;
            e.x = Math.max(e.radius + 12, Math.min(width - e.radius - 12, e.x));
        }

        // إطلاق نار من بعض الأعداء في المراحل المتقدمة
        if (stg.enemyFireChance > 0 && (e.type === 'tank' || e.type === 'striker') && e.y > 40 && e.y < height * 0.65) {
            if (now - e.lastEnemyShot > 1750) {
                e.lastEnemyShot = now;
                if (Math.random() < stg.enemyFireChance) {
                    const ang = Math.atan2(player.y - e.y, player.x - e.x);
                    const spd = 4.2 * Math.min(scaleFactor, 1.2);
                    enemyBullets.push({
                        x: e.x,
                        y: e.y + e.radius * 0.6,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        r: 4.5 * scaleFactor,
                        color: stg.accentColor
                    });
                }
            }
        }

        // تصادم الرصاص مع العدو
        let destroyed = false;
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.r) {
                bullets.splice(j, 1);
                e.hp--;
                createExplosion(b.x, b.y, '#ffffff', 4);

                if (e.hp <= 0) {
                    playSound('explosion');
                    createExplosion(e.x, e.y, e.color, 16);
                    score += e.points;
                    scoreDisplay.textContent = score;
                    syncStage(now, true);

                    if (Math.random() < 0.18) {
                        const rKind = Math.random();
                        const kind = rKind < 0.36 ? 'health' : (rKind < 0.68 ? 'weapon' : 'shield');
                        powerups.push({
                            x: e.x,
                            y: e.y,
                            radius: 13 * scaleFactor,
                            kind
                        });
                    }

                    enemies.splice(i, 1);
                    destroyed = true;
                    break;
                }
            }
        }
        if (destroyed) continue;

        // تصادم العدو مع اللاعب
        if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius - 4) {
            playSound('hit');
            createExplosion(e.x, e.y, '#f43f5e', 18);
            enemies.splice(i, 1);
            damagePlayer(25);
            continue;
        }

        if (e.y > height + e.radius + 24) {
            enemies.splice(i, 1);
        }
    }

    // تحديث الجزيئات
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.028;
        if (pt.alpha <= 0) particles.splice(i, 1);
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

// رسم عداد حياة العدو فوقه مباشرة
function drawEnemyHealthBar(e) {
    const barW = Math.max(30 * scaleFactor, e.radius * 1.65);
    const barH = 5 * scaleFactor;
    const x = e.x - barW / 2;
    const y = e.y - e.radius - 15 * scaleFactor;
    const pct = Math.max(0, Math.min(1, e.hp / e.maxHp));

    ctx.save();
    ctx.fillStyle = 'rgba(4, 7, 17, 0.78)';
    ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);

    ctx.fillStyle = pct > 0.5 ? '#22c55e' : (pct > 0.25 ? '#f59e0b' : '#ef4444');
    ctx.fillRect(x, y, barW * pct, barH);

    ctx.font = `bold ${Math.max(10, Math.round(10.5 * scaleFactor))}px Cairo`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${e.hp}`, e.x, y - 2);
    ctx.restore();
}

// رسم العناصر
function draw(now) {
    const stg = getStageConfig(stage);

    // خلفية متدرجة حسب المرحلة
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, stg.bgTop);
    grad.addColorStop(1, stg.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // توهج سديمي خفيف يعطي طابع كل مرحلة
    const neb = ctx.createRadialGradient(width * 0.5, height * 0.35, 20, width * 0.5, height * 0.35, Math.max(width, height) * 0.65);
    neb.addColorStop(0, stg.nebulaColor);
    neb.addColorStop(1, 'transparent');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, width, height);

    // النجوم
    for (let s of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }

    if (gameState === 'START') return;

    // رسم المساعدات
    for (let p of powerups) {
        ctx.save();
        ctx.translate(p.x, p.y);
        const pColor = p.kind === 'health' ? '#10b981' : (p.kind === 'shield' ? '#34d399' : '#fbbf24');
        const pIcon = p.kind === 'health' ? '+' : (p.kind === 'shield' ? '🛡️' : '⚡');
        ctx.fillStyle = pColor;
        ctx.shadowBlur = 12;
        ctx.shadowColor = pColor;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#040914';
        ctx.font = `bold ${Math.round(13 * scaleFactor)}px Cairo`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pIcon, 0, 1);
        ctx.restore();
    }

    // رسم رصاص اللاعب
    for (let b of bullets) {
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r * 0.7, b.r * 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // رسم طلقات الأعداء
    for (let eb of enemyBullets) {
        ctx.save();
        ctx.fillStyle = eb.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = eb.color;
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // رسم المركبة الفضائية للاعب
    ctx.save();
    ctx.translate(player.x, player.y);

    // هالة الدرع النشط
    if (player.shieldTimer > now) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#34d399';
        ctx.beginPath();
        ctx.arc(0, 0, player.radius * 1.45, 0, Math.PI * 2);
        ctx.stroke();
    }

    // لهب المحرك
    const flameHeight = (12 + Math.random() * 8) * scaleFactor;
    ctx.fillStyle = stg.accentColor;
    ctx.beginPath();
    ctx.moveTo(-player.radius * 0.35, player.radius * 0.7);
    ctx.lineTo(0, player.radius * 0.7 + flameHeight);
    ctx.lineTo(player.radius * 0.35, player.radius * 0.7);
    ctx.closePath();
    ctx.fill();

    // جسم المركبة
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f2fe';
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(0, -player.radius * 1.15);
    ctx.lineTo(player.radius * 0.95, player.radius * 0.85);
    ctx.lineTo(0, player.radius * 0.5);
    ctx.lineTo(-player.radius * 0.95, player.radius * 0.85);
    ctx.closePath();
    ctx.fill();

    // قمرة القيادة
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(0, -player.radius * 0.1, player.radius * 0.28, player.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // رسم الأعداء وعدّاد حياة كل عدو فوقه
    for (let e of enemies) {
        drawEnemyHealthBar(e);

        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        ctx.shadowBlur = 12;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;

        if (e.type === 'asteroid') {
            ctx.beginPath();
            const sides = 7;
            for (let k = 0; k < sides; k++) {
                const ang = (k / sides) * Math.PI * 2;
                const rad = e.radius * (k % 2 === 0 ? 1 : 0.78);
                if (k === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
                else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
            }
            ctx.closePath();
            ctx.fill();
        } else if (e.type === 'tank') {
            ctx.beginPath();
            ctx.moveTo(0, e.radius);
            ctx.lineTo(e.radius, 0);
            ctx.lineTo(e.radius * 0.6, -e.radius);
            ctx.lineTo(-e.radius * 0.6, -e.radius);
            ctx.lineTo(-e.radius, 0);
            ctx.closePath();
            ctx.fill();
        } else if (e.type === 'striker') {
            ctx.beginPath();
            ctx.moveTo(0, e.radius * 1.15);
            ctx.lineTo(e.radius * 0.95, -e.radius * 0.55);
            ctx.lineTo(0, -e.radius * 0.95);
            ctx.lineTo(-e.radius * 0.95, -e.radius * 0.55);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, e.radius * 1.1);
            ctx.lineTo(e.radius * 0.9, -e.radius * 0.8);
            ctx.lineTo(0, -e.radius * 0.4);
            ctx.lineTo(-e.radius * 0.9, -e.radius * 0.8);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    // رسم الجزيئات
    for (let pt of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// حلقة التشغيل الرئيسية
function gameLoop(now) {
    update(now);
    draw(now);
    requestAnimationFrame(gameLoop);
}

// التحكم بحالات اللعبة والواجهة
function startGame() {
    initAudio();
    const now = performance.now();
    score = 0;
    stage = 1;
    player.hp = player.maxHp;
    player.weaponLevel = 1;
    player.weaponTimer = 0;
    player.shieldTimer = 0;
    player.x = width / 2;
    player.y = height - 110;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    powerups = [];
    lastEnemySpawn = now;

    scoreDisplay.textContent = '0';
    syncStage(now, false);
    updateHealthUI();
    updateBuffsUI(now);

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsModal.classList.add('hidden');
    aboutModal.classList.add('hidden');
    hud.classList.remove('hidden');

    gameState = 'PLAYING';
    showStageBanner(getStageConfig(1));
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
            localStorage.setItem('abdcode_space_highscore', String(highScore));
        } catch (e) {}
    }
    highScoreStart.textContent = highScore;
    highScoreEnd.textContent = highScore;
}

function shiftTimersOnResume(deltaMs) {
    if (deltaMs <= 0) return;
    if (player.weaponTimer > 0) player.weaponTimer += deltaMs;
    if (player.shieldTimer > 0) player.shieldTimer += deltaMs;
    if (lastEnemySpawn > 0) lastEnemySpawn += deltaMs;
    for (let e of enemies) {
        if (e.lastEnemyShot > 0) e.lastEnemyShot += deltaMs;
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

// ربط الأحداث بالأزرار
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
restartFromPauseBtn.addEventListener('click', startGame);

homeBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    hud.classList.add('hidden');
    stageBanner.classList.add('hidden');
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

// تشغيل الحلقة
requestAnimationFrame(gameLoop);
