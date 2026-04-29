/**
 * 经典贪吃蛇游戏逻辑 - 增强版
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const diffBtns = document.querySelectorAll('.diff-btn');

// 游戏常量
const GRID_SIZE = 20; // 网格大小
const TILE_COUNT = canvas.width / GRID_SIZE; // 网格数量 (20x20)
let INITIAL_SPEED = 150; // 初始速度 (ms)
const MIN_SPEED = 50; // 最高速度 (ms)

// 游戏状态变量
let snake = [];
let food = { x: 10, y: 10, type: 'normal' }; // 添加食物类型
let dx = 0; 
let dy = 0; 
let nextDx = 0; 
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameInterval = null;
let isPaused = true;
let gameRunning = false;
let currentSpeed = INITIAL_SPEED;
let particles = []; // 粒子系统

// 初始化最高分显示
highScoreEl.textContent = highScore;

/**
 * 粒子类
 */
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

/**
 * 初始化游戏状态
 */
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;
    score = 0;
    currentSpeed = INITIAL_SPEED;
    currentScoreEl.textContent = score;
    particles = [];
    createFood();
}

/**
 * 随机生成食物位置及类型
 */
function createFood() {
    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT),
            type: Math.random() > 0.9 ? 'special' : 'normal' // 10% 概率生成金色食物
        };
        let onSnake = snake.some(part => part.x === newFood.x && part.y === newFood.y);
        if (!onSnake) break;
    }
    food = newFood;
}

/**
 * 屏幕震动效果
 */
function shakeScreen() {
    canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), 500);
}

/**
 * 游戏主循环
 */
function gameLoop() {
    if (isPaused) return;

    update();
    draw();

    // 速度递增逻辑
    const speedStep = INITIAL_SPEED === 200 ? 3 : (INITIAL_SPEED === 100 ? 8 : 5);
    const speed = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(score / 2) * speedStep);
    
    if (speed !== currentSpeed) {
        currentSpeed = speed;
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, currentSpeed);
    }
}

/**
 * 更新游戏逻辑
 */
function update() {
    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 边界碰撞
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        return endGame();
    }

    // 自身碰撞
    if (snake.some(part => part.x === head.x && part.y === head.y)) {
        return endGame();
    }

    snake.unshift(head);

    // 检查吃食物
    if (head.x === food.x && head.y === food.y) {
        const isSpecial = food.type === 'special';
        score += isSpecial ? 5 : 1;
        currentScoreEl.textContent = score;

        // 产生粒子效果
        const color = isSpecial ? '#ffd700' : '#e94560';
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(
                food.x * GRID_SIZE + GRID_SIZE / 2,
                food.y * GRID_SIZE + GRID_SIZE / 2,
                color
            ));
        }

        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        createFood();
    } else {
        snake.pop();
    }

    // 更新粒子
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.update());
}

/**
 * 绘制游戏画面
 */
function draw() {
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制粒子
    particles.forEach(p => p.draw());

    // 绘制食物
    const isSpecial = food.type === 'special';
    ctx.fillStyle = isSpecial ? '#ffd700' : '#e94560';
    ctx.shadowBlur = isSpecial ? 20 : 10;
    ctx.shadowColor = ctx.fillStyle;
    
    if (isSpecial) {
        // 金色食物绘制成星形或带光环的圆
        ctx.beginPath();
        ctx.arc(food.x * GRID_SIZE + GRID_SIZE/2, food.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    }
    ctx.shadowBlur = 0;

    // 绘制蛇
    snake.forEach((part, index) => {
        const ratio = index / snake.length;
        // 蛇身渐变色
        ctx.fillStyle = index === 0 ? '#4ecca3' : `rgb(69, ${178 - ratio * 50}, ${147 - ratio * 30})`;
        
        ctx.fillRect(part.x * GRID_SIZE + 1, part.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        
        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeSize = 3;
            if (dx === 1) {
                ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 5, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 12, eyeSize, eyeSize);
            } else if (dx === -1) {
                ctx.fillRect(part.x * GRID_SIZE + 3, part.y * GRID_SIZE + 5, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 3, part.y * GRID_SIZE + 12, eyeSize, eyeSize);
            } else if (dy === -1) {
                ctx.fillRect(part.x * GRID_SIZE + 5, part.y * GRID_SIZE + 3, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 12, part.y * GRID_SIZE + 3, eyeSize, eyeSize);
            } else if (dy === 1) {
                ctx.fillRect(part.x * GRID_SIZE + 5, part.y * GRID_SIZE + 14, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 12, part.y * GRID_SIZE + 14, eyeSize, eyeSize);
            }
        }
    });
}

/**
 * 结束游戏
 */
function endGame() {
    shakeScreen();
    gameRunning = false;
    isPaused = true;
    clearInterval(gameInterval);
    
    overlayTitle.textContent = '游戏结束';
    overlayMessage.textContent = `最终得分: ${score}`;
    startBtn.textContent = '重新开始';
    overlay.classList.remove('hidden');
}

/**
 * 切换暂停/开始
 */
function toggleGame() {
    if (!gameRunning) {
        initGame();
        gameRunning = true;
        isPaused = false;
        overlay.classList.add('hidden');
        gameInterval = setInterval(gameLoop, currentSpeed);
    } else {
        isPaused = !isPaused;
        if (isPaused) {
            overlayTitle.textContent = '游戏暂停';
            overlayMessage.textContent = '按空格键继续';
            startBtn.textContent = '继续游戏';
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// 键盘控制
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if ((key === 'arrowup' || key === 'w') && dy === 0) { nextDx = 0; nextDy = -1; }
    else if ((key === 'arrowdown' || key === 's') && dy === 0) { nextDx = 0; nextDy = 1; }
    else if ((key === 'arrowleft' || key === 'a') && dx === 0) { nextDx = -1; nextDy = 0; }
    else if ((key === 'arrowright' || key === 'd') && dx === 0) { nextDx = 1; nextDy = 0; }
    
    if (e.code === 'Space') {
        e.preventDefault();
        toggleGame();
    }
});

// 触摸滑动控制
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) {
            if (diffX > 0 && dx === 0) { nextDx = 1; nextDy = 0; }
            else if (diffX < 0 && dx === 0) { nextDx = -1; nextDy = 0; }
        }
    } else {
        if (Math.abs(diffY) > 30) {
            if (diffY > 0 && dy === 0) { nextDx = 0; nextDy = 1; }
            else if (diffY < 0 && dy === 0) { nextDx = 0; nextDy = -1; }
        }
    }
}, { passive: true });

// 难度按钮事件
diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        INITIAL_SPEED = parseInt(btn.dataset.speed);
        currentSpeed = INITIAL_SPEED;
    });
});

startBtn.addEventListener('click', toggleGame);

initGame();
draw();
