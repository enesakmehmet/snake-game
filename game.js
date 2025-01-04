const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let snake = [
    { x: 10, y: 10 }
];
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};
let xVelocity = 0;
let yVelocity = 0;
let gameSpeed = 8;

// Yılan renk gradyanı için renkler
const snakeColors = ['#4CAF50', '#45a049', '#3d9142', '#36833b'];

// Mevcut değişkenlere ek olarak
let isPaused = false;
let isGameStarted = false;
let highScore = localStorage.getItem('snakeHighScore') || 0;
document.getElementById('highScore').textContent = highScore;

// Menü elemanları
const menu = document.getElementById('menu');
const startButton = document.getElementById('startGame');
const resumeButton = document.getElementById('resumeGame');
const difficultyButtons = document.querySelectorAll('.difficulty button');

// Yeni efektler için değişkenler
let particles = [];
let powerUps = [];
let powerUpTimer = null;
let isInvincible = false;

document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;
    const W_KEY = 87;
    const A_KEY = 65;
    const S_KEY = 83;
    const D_KEY = 68;

    const keyPressed = event.keyCode;
    const goingUp = yVelocity === -1;
    const goingDown = yVelocity === 1;
    const goingRight = xVelocity === 1;
    const goingLeft = xVelocity === -1;

    if ((keyPressed === LEFT_KEY || keyPressed === A_KEY) && !goingRight) {
        xVelocity = -1;
        yVelocity = 0;
    }
    if ((keyPressed === UP_KEY || keyPressed === W_KEY) && !goingDown) {
        xVelocity = 0;
        yVelocity = -1;
    }
    if ((keyPressed === RIGHT_KEY || keyPressed === D_KEY) && !goingLeft) {
        xVelocity = 1;
        yVelocity = 0;
    }
    if ((keyPressed === DOWN_KEY || keyPressed === S_KEY) && !goingUp) {
        xVelocity = 0;
        yVelocity = 1;
    }
}

// Menü kontrolleri
startButton.addEventListener('click', startGame);
resumeButton.addEventListener('click', resumeGame);
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        // Zorluk seviyelerine göre hız ayarı
        switch(parseInt(button.dataset.speed)) {
            case 150:
                gameSpeed = 8; // Kolay
                break;
            case 100:
                gameSpeed = 12; // Orta
                break;
            case 50:
                gameSpeed = 16; // Zor
                break;
        }
    });
});

// P tuşu ile oyunu durdurma
document.addEventListener('keydown', (event) => {
    if (event.key === 'p' || event.key === 'P') {
        togglePause();
    }
});

function togglePause() {
    if (!isGameStarted) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        menu.classList.add('active');
        startButton.style.display = 'none';
        resumeButton.style.display = 'block';
    } else {
        menu.classList.remove('active');
        resumeGame();
    }
}

function startGame() {
    isGameStarted = true;
    menu.classList.remove('active');
    resetGame();
}

function resumeGame() {
    isPaused = false;
    menu.classList.remove('active');
    drawGame();
}

// Parçacık efekti sınıfı
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
        this.size -= 0.1;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Power-up sınıfı
class PowerUp {
    constructor() {
        this.x = Math.floor(Math.random() * tileCount);
        this.y = Math.floor(Math.random() * tileCount);
        this.type = Math.random() < 0.5 ? 'speed' : 'invincible';
        this.duration = 5000; // 5 saniye
    }

    draw() {
        const x = this.x * gridSize;
        const y = this.y * gridSize;
        const size = gridSize - 2;

        ctx.fillStyle = this.type === 'speed' ? '#ffeb3b' : '#e91e63';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();

        // Parıltı efekti
        ctx.strokeStyle = this.type === 'speed' ? '#ffd700' : '#ff1493';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Arka plan ızgara çizimi için fonksiyon
function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

// Canvas temizleme fonksiyonunu güncelle
function clearCanvas() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
}

// Yılan çizim fonksiyonunu güncelle
function drawSnake() {
    snake.forEach((part, index) => {
        // Gradyan renk efekti
        const colorIndex = index % snakeColors.length;
        ctx.fillStyle = snakeColors[colorIndex];
        
        // Yuvarlak köşeli yılan parçaları
        const x = part.x * gridSize;
        const y = part.y * gridSize;
        const size = gridSize - 2;
        const radius = 8;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();
    });

    // Yılanın gözleri
    if (snake.length > 0) {
        const head = snake[0];
        const eyeSize = 3;
        ctx.fillStyle = 'white';
        
        // Yılanın yönüne göre göz pozisyonunu ayarla
        let eyeX1, eyeX2, eyeY;
        if (xVelocity === 1) { // Sağa
            eyeX1 = eyeX2 = head.x * gridSize + gridSize - 8;
            eyeY = head.y * gridSize + 6;
        } else if (xVelocity === -1) { // Sola
            eyeX1 = eyeX2 = head.x * gridSize + 8;
            eyeY = head.y * gridSize + 6;
        } else if (yVelocity === -1) { // Yukarı
            eyeX1 = head.x * gridSize + 6;
            eyeX2 = head.x * gridSize + gridSize - 8;
            eyeY = head.y * gridSize + 8;
        } else { // Aşağı veya durağan
            eyeX1 = head.x * gridSize + 6;
            eyeX2 = head.x * gridSize + gridSize - 8;
            eyeY = head.y * gridSize + 8;
        }
        
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeX2, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Yem çizim fonksiyonunu güncelle
function drawFood() {
    const x = food.x * gridSize;
    const y = food.y * gridSize;
    const size = gridSize - 2;
    
    // Parlama efekti
    const gradient = ctx.createRadialGradient(
        x + size/2, y + size/2, 2,
        x + size/2, y + size/2, size/2
    );
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ff0000');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
    ctx.fill();
}

function moveSnake() {
    const head = { x: snake[0].x + xVelocity, y: snake[0].y + yVelocity };
    snake.unshift(head);
    if (!eatFood()) {
        snake.pop();
    }
}

function eatFood() {
    if (snake[0].x === food.x && snake[0].y === food.y) {
        createParticles(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, '#ff6b6b');
        
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        score += 10;
        scoreElement.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            document.getElementById('highScore').textContent = highScore;
        }
        
        return true;
    }
    return false;
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Oyun bittiğinde efekt ekle
function showGameOverEffect() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Oyun Bitti!', canvas.width/2, canvas.height/2 - 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Skorunuz: ${score}`, canvas.width/2, canvas.height/2 + 10);
}

function gameOver() {
    if (isInvincible) return false;
    
    if (snake[0].x < 0 || snake[0].x >= tileCount || 
        snake[0].y < 0 || snake[0].y >= tileCount) {
        return true;
    }

    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }
    return false;
}

function resetGame() {
    score = 0;
    scoreElement.textContent = score;
    snake = [{ x: 10, y: 10 }];
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    xVelocity = 0;
    yVelocity = 0;
    drawGame();
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        
        if (particles[i].life <= 0 || particles[i].size <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePowerUps() {
    if (powerUps.length === 0 && Math.random() < 0.005) { // 0.5% şans
        powerUps.push(new PowerUp());
    }

    powerUps.forEach((powerUp, index) => {
        powerUp.draw();
        
        if (snake[0].x === powerUp.x && snake[0].y === powerUp.y) {
            activatePowerUp(powerUp);
            powerUps.splice(index, 1);
        }
    });
}

function activatePowerUp(powerUp) {
    if (powerUp.type === 'speed') {
        const originalSpeed = gameSpeed;
        gameSpeed = gameSpeed / 2;
        setTimeout(() => {
            gameSpeed = originalSpeed;
        }, powerUp.duration);
    } else if (powerUp.type === 'invincible') {
        isInvincible = true;
        setTimeout(() => {
            isInvincible = false;
        }, powerUp.duration);
    }
}

// Başlangıçta menüyü göster
menu.classList.add('active');

let lastRenderTime = 0;

function drawGame(currentTime) {
    if (!isGameStarted || isPaused) {
        requestAnimationFrame(drawGame);
        return;
    }

    requestAnimationFrame(drawGame);

    if (!lastRenderTime) {
        lastRenderTime = currentTime;
        return;
    }

    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / gameSpeed) return;

    lastRenderTime = currentTime;

    moveSnake();

    if (gameOver()) {
        showGameOverEffect();
        setTimeout(() => {
            menu.classList.add('active');
            startButton.style.display = 'block';
            resumeButton.style.display = 'none';
            isGameStarted = false;
        }, 2000);
        return;
    }

    clearCanvas();
    drawGrid();
    updateParticles();
    updatePowerUps();
    drawFood();
    drawSnake();
}

// Oyunu başlat
requestAnimationFrame(drawGame); 