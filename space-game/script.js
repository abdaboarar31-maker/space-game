const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// عناصر الواجهة
const hud = document.getElementById('hud');
const startScreen = document.getElementById('startScreen');
const settingsModal = document.getElementById('settingsModal');
const aboutModal = document.getElementById('aboutModal');
const gameOverScreen = document.getElementById('gameOverScreen');

const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
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

let score = 0;
let level = 1;
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
    easy: { spawnRate: 1300, enemySpeedMult: 0.78, enemyHpMult: 0.8 },
    normal: { spawnRate: 950, enemySpeedMult: 1.0, enemyHpMult: 1.0 },
    hard: { spawnRate: 680, enemySpeedMult: 1.32, enemyHpMult: 1.3 }
};

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
    weaponTimer: 0
};

let bullets = [];
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
    player.y = Math.max(70, Math.min(height - player.radius - 55, player.y));

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
    player.y = Math.max(75, Math.min(height - player.radius - 55, clientY - offsetY));
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

// توليد الأعداء
function spawnEnemy() {
    const cfg = difficultyConfig[settings.difficulty];
    const rand = Math.random();
    let type = 'scout';
    let radius = 18 * scaleFactor;
    let hp = Math.ceil((1 + Math.floor(level * 0.3)) * cfg.enemyHpMult);
    let speed = (2.4 + Math.random() * 1.4 + level * 0.15) * cfg.enemySpeedMult * Math.min(scaleFactor, 1.2);
    let color = '#f43f5e';
    let points = 10;

    if (rand > 0.78) {
        type = 'tank';
        radius = 27 * scaleFactor;
        hp = Math.ceil((3 + Math.floor(level * 0.5)) * cfg.enemyHpMult);
        speed *= 0.65;
        color = '#a855f7';
        points = 30;
    } else if (rand > 0.52) {
        type = 'asteroid';
        radius = (20 + Math.random() * 10) * scaleFactor;
        hp = Math.ceil(2 * cfg.enemyHpMult);
        speed *= 0.85;
        color = '#f59e0b';
        points = 20;
    }

    enemies.push({
        x: Math.random() * (width - radius * 2 - 20) + radius + 10,
        y: -radius - 10,
        radius,
        hp,
        maxHp: hp,
        speed,
        type,
        color,
        points,
        angle: 0,
        spin: (Math.random() - 0.5) * 0.06
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

// تحديث منطق اللعبة
function update(now) {
    // تحريك النجوم في الخلفية دائماً
    for (let s of stars) {
        s.y += s.speed * (gameState === 'PLAYING' ? 1.5 : 0.6);
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
    player.y = Math.max(75, Math.min(height - player.radius - 55, player.y));

    // إطلاق النار
    if (settings.autoFire || keys['Space'] || isPointerDown) {
        fireBullet(now);
    }

    // مؤقت تطوير السلاح
    if (player.weaponLevel > 1 && now > player.weaponTimer) {
        player.weaponLevel = 1;
    }

    // توليد الأعداء
    const cfg = difficultyConfig[settings.difficulty];
    const currentSpawnInterval = Math.max(340, cfg.spawnRate - level * 35);
    if (now - lastEnemySpawn > currentSpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = now;
    }

    // تحديث الرصاص
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.y < -20 || b.x < -20 || b.x > width + 20) {
            bullets.splice(i, 1);
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
            } else {
                player.weaponLevel = Math.min(3, player.weaponLevel + 1);
                player.weaponTimer = now + 9000;
            }
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
                    level = Math.floor(score / 250) + 1;
                    levelDisplay.textContent = level;

                    if (Math.random() < 0.14) {
                        powerups.push({
                            x: e.x,
                            y: e.y,
                            radius: 13 * scaleFactor,
                            kind: Math.random() < 0.5 ? 'health' : 'weapon'
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

        if (e.y > height + e.radius + 20) {
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

// رسم العناصر
function draw() {
    ctx.fillStyle = '#060913';
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
        ctx.fillStyle = p.kind === 'health' ? '#10b981' : '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#040914';
        ctx.font = `bold ${Math.round(13 * scaleFactor)}px Cairo`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.kind === 'health' ? '+' : '⚡', 0, 1);
        ctx.restore();
    }

    // رسم الرصاص
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

    // رسم المركبة الفضائية للاعب
    ctx.save();
    ctx.translate(player.x, player.y);

    // لهب المحرك
    const flameHeight = (12 + Math.random() * 8) * scaleFactor;
    ctx.fillStyle = '#00f2fe';
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

    // رسم الأعداء
    for (let e of enemies) {
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
    draw();
    requestAnimationFrame(gameLoop);
}

// التحكم بحالات اللعبة والواجهة
function startGame() {
    initAudio();
    score = 0;
    level = 1;
    player.hp = player.maxHp;
    player.weaponLevel = 1;
    player.x = width / 2;
    player.y = height - 110;
    bullets = [];
    enemies = [];
    particles = [];
    powerups = [];

    scoreDisplay.textContent = '0';
    levelDisplay.textContent = '1';
    updateHealthUI();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsModal.classList.add('hidden');
    aboutModal.classList.add('hidden');
    hud.classList.remove('hidden');

    gameState = 'PLAYING';
}

function endGame() {
    gameState = 'GAMEOVER';
    hud.classList.add('hidden');
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

function togglePauseSettings() {
    if (gameState === 'PLAYING') {
        previousStateBeforeModal = 'PLAYING';
        gameState = 'PAUSED';
        restartFromPauseBtn.classList.remove('hidden');
        settingsModal.classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
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
        gameState = 'PLAYING';
    }
});

aboutBtn.addEventListener('click', () => {
    if (gameState === 'PLAYING') {
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