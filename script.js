/**
 * 经典贪吃蛇游戏逻辑
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

// 游戏常量
const GRID_SIZE = 20; // 网格大小
const TILE_COUNT = canvas.width / GRID_SIZE; // 网格数量 (20x20)
const INITIAL_SPEED = 150; // 初始速度 (ms)
const MIN_SPEED = 60; // 最高速度 (ms)

// 游戏状态变量
let snake = [];
let food = { x: 10, y: 10 };
let dx = 0; // x轴移动方向
let dy = 0; // y轴移动方向
let nextDx = 0; // 下一步移动方向，防止180度掉头
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameInterval = null;
let isPaused = true;
let gameRunning = false;
let currentSpeed = INITIAL_SPEED;

// 初始化最高分显示
highScoreEl.textContent = highScore;

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
    createFood();
}

/**
 * 随机生成食物位置
 */
function createFood() {
    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };
        // 确保食物不在蛇身上
        let onSnake = snake.some(part => part.x === newFood.x && part.y === newFood.y);
        if (!onSnake) break;
    }
    food = newFood;
}

/**
 * 游戏主循环
 */
function gameLoop() {
    if (isPaused) return;

    update();
    draw();

    // 根据分数调整速度
    const speed = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(score / 2) * 5);
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

    // 计算蛇头新位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 边界碰撞检测
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        return endGame();
    }

    // 自身碰撞检测
    if (snake.some(part => part.x === head.x && part.y === head.y)) {
        return endGame();
    }

    // 移动蛇头
    snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score++;
        currentScoreEl.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        createFood();
    } else {
        // 没吃到食物，移除蛇尾
        snake.pop();
    }
}

/**
 * 绘制游戏画面
 */
function draw() {
    // 清空画布
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制食物
    ctx.fillStyle = '#e94560';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#e94560';
    ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    ctx.shadowBlur = 0;

    // 绘制蛇
    snake.forEach((part, index) => {
        // 蛇头颜色略深
        ctx.fillStyle = index === 0 ? '#4ecca3' : '#45b293';
        ctx.fillRect(part.x * GRID_SIZE + 1, part.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        
        // 绘制眼睛 (仅蛇头)
        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeSize = 3;
            if (dx === 1) { // 向右
                ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 5, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 12, eyeSize, eyeSize);
            } else if (dx === -1) { // 向左
                ctx.fillRect(part.x * GRID_SIZE + 3, part.y * GRID_SIZE + 5, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 3, part.y * GRID_SIZE + 12, eyeSize, eyeSize);
            } else if (dy === -1) { // 向上
                ctx.fillRect(part.x * GRID_SIZE + 5, part.y * GRID_SIZE + 3, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 12, part.y * GRID_SIZE + 3, eyeSize, eyeSize);
            } else if (dy === 1) { // 向下
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

/**
 * 键盘事件处理
 */
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // 方向控制
    if ((key === 'arrowup' || key === 'w') && dy === 0) {
        nextDx = 0; nextDy = -1;
    } else if ((key === 'arrowdown' || key === 's') && dy === 0) {
        nextDx = 0; nextDy = 1;
    } else if ((key === 'arrowleft' || key === 'a') && dx === 0) {
        nextDx = -1; nextDy = 0;
    } else if ((key === 'arrowright' || key === 'd') && dx === 0) {
        nextDx = 1; nextDy = 0;
    }
    
    // 空格键暂停/开始
    if (e.code === 'Space') {
        e.preventDefault(); // 防止页面滚动
        toggleGame();
    }
});

// 按钮点击事件
startBtn.addEventListener('click', toggleGame);

// 初始状态：初始化数据并绘制首帧
initGame();
draw();
