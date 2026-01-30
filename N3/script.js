const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 14 * 48; // 14 columns * 48px
canvas.height = 19 * 48 + 48; // 19 rows * 48px (for maze) + 48px for score

let score = 0;
let gameOver = false;
let gameWon = false;
let gameInterval;

const boxSize = 48;

const initialMaze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,1,1,2,1,1,1],
    [1,2,1,1,2,2,2,2,2,2,2,1,1,1],
    [1,2,2,2,2,1,1,1,1,1,2,2,2,1],
    [1,2,1,1,2,1,2,2,2,1,2,1,1,1],
    [1,2,1,1,2,1,2,1,2,1,2,1,1,1],
    [1,2,2,2,2,1,2,1,2,1,2,2,2,1],
    [1,1,1,1,2,1,2,1,2,1,2,1,1,1],
    [1,2,2,2,2,2,2,1,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

let maze = [];
let totalPellets = 0;
let pelletsEaten = 0;

const pacman = {
    x: 0, // Initialized in resetGame
    y: 0, // Initialized in resetGame
    radius: 15,
    speed: 2,
    dx: 0,
    dy: 0,
    nextDirX: 0,
    nextDirY: 0,
    direction: 'right', // New property for direction
    draw: function() {
        let startAngle, endAngle;
        const mouthOpen = 0.2 * Math.PI; // How wide the mouth opens
        switch (this.direction) {
            case 'right':
                startAngle = mouthOpen;
                endAngle = 2 * Math.PI - mouthOpen;
                break;
            case 'left':
                startAngle = Math.PI + mouthOpen;
                endAngle = Math.PI - mouthOpen;
                break;
            case 'up':
                startAngle = 1.5 * Math.PI + mouthOpen;
                endAngle = 1.5 * Math.PI - mouthOpen;
                break;
            case 'down':
                startAngle = 0.5 * Math.PI + mouthOpen;
                endAngle = 0.5 * Math.PI - mouthOpen;
                break;
            default: // Default to right
                startAngle = mouthOpen;
                endAngle = 2 * Math.PI - mouthOpen;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, startAngle, endAngle);
        ctx.lineTo(this.x, this.y);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.closePath();
    },
    canMove: function(targetX, targetY) {
        const gridX = Math.floor(targetX / boxSize);
        const gridY = Math.floor(targetY / boxSize);

        const corners = [
            [targetX - this.radius, targetY - this.radius],
            [targetX + this.radius, targetY - this.radius],
            [targetX - this.radius, targetY + this.radius],
            [targetX + this.radius, targetY + this.radius]
        ];

        for (const [cx, cy] of corners) {
            const cornerGridX = Math.floor(cx / boxSize);
            const cornerGridY = Math.floor(cy / boxSize);
            if (maze[cornerGridY] && maze[cornerGridY][cornerGridX] === 1) {
                return false;
            }
        }
        return true;
    },
    move: function() {
        let newX = this.x + this.dx;
        let newY = this.y + this.dy;

        if (this.nextDirX !== 0 || this.nextDirY !== 0) {
            const nextX = this.x + this.nextDirX;
            const nextY = this.y + this.nextDirY;
            if (this.canMove(nextX, nextY)) {
                this.dx = this.nextDirX;
                this.dy = this.nextDirY;
                this.nextDirX = 0;
                this.nextDirY = 0;
                // Update direction based on actual movement
                if (this.dx > 0) this.direction = 'right';
                else if (this.dx < 0) this.direction = 'left';
                else if (this.dy > 0) this.direction = 'down';
                else if (this.dy < 0) this.direction = 'up';
            }
        }

        newX = this.x + this.dx;
        newY = this.y + this.dy;

        if (this.canMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            this.dx = 0;
            this.dy = 0;
        }
    },
    eatPellet: function() {
        const gridX = Math.floor(this.x / boxSize);
        const gridY = Math.floor(this.y / boxSize);

        if (maze[gridY] && maze[gridY][gridX] === 2) {
            maze[gridY][gridX] = 0;
            score += 10;
            pelletsEaten++;
        } else if (maze[gridY] && maze[gridY][gridX] === 3) {
            maze[gridY][gridX] = 0;
            score += 50;
            pelletsEaten++;
            // TODO: Implement power-up effect (e.g., ghosts become vulnerable)
        }
    }
};

class Ghost {
    constructor(x, y, color, speed) {
        this.initialX = x * boxSize + boxSize / 2;
        this.initialY = y * boxSize + boxSize / 2;
        this.x = this.initialX;
        this.y = this.initialY;
        this.color = color;
        this.speed = speed;
        this.dx = speed;
        this.dy = 0;
        this.radius = 15;
    } // Added closing brace for constructor
    draw() {
        ctx.beginPath();
        
        // Ghost body
        const radius = this.radius;
        const bodyHeight = radius * 1.8; // Make body taller than radius
        
        // Rounded top
        ctx.arc(this.x, this.y - bodyHeight / 2 + radius, radius, Math.PI, 2 * Math.PI);
        
        // Sides
        ctx.lineTo(this.x + radius, this.y + radius);
        
        // Wavy bottom
        ctx.lineTo(this.x + radius, this.y + radius * 0.5);
        ctx.arc(this.x + radius * 0.66, this.y + radius * 0.75, radius * 0.33, 0, Math.PI, true);
        ctx.arc(this.x + radius * 0.0, this.y + radius * 0.75, radius * 0.33, 0, Math.PI, true);
        ctx.arc(this.x - radius * 0.66, this.y + radius * 0.75, radius * 0.33, 0, Math.PI, true);
        ctx.lineTo(this.x - radius, this.y + radius * 0.5);
        ctx.lineTo(this.x - radius, this.y - bodyHeight / 2 + radius);

        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Eyes
        ctx.beginPath();
        ctx.arc(this.x - radius * 0.5, this.y - radius * 0.2, radius * 0.3, 0, 2 * Math.PI); // Left eye white
        ctx.arc(this.x + radius * 0.5, this.y - radius * 0.2, radius * 0.3, 0, 2 * Math.PI); // Right eye white
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.x - radius * 0.5, this.y - radius * 0.2, radius * 0.15, 0, 2 * Math.PI); // Left pupil blue
        ctx.arc(this.x + radius * 0.5, this.y - radius * 0.2, radius * 0.15, 0, 2 * Math.PI); // Right pupil blue
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }

    canMove(targetX, targetY) {
        const gridX = Math.floor(targetX / boxSize);
        const gridY = Math.floor(targetY / boxSize);

        const corners = [
            [targetX - this.radius, targetY - this.radius],
            [targetX + this.radius, targetY - this.radius],
            [targetX - this.radius, targetY + this.radius],
            [targetX + this.radius, targetY + this.radius]
        ];

        for (const [cx, cy] of corners) {
            const cornerGridX = Math.floor(cx / boxSize);
            const cornerGridY = Math.floor(cy / boxSize);
            if (maze[cornerGridY] && maze[cornerGridY][cornerGridX] === 1) {
                return false;
            }
        }
        return true;
    }

    move() {
        let newX = this.x + this.dx;
        let newY = this.y + this.dy;

        if (this.canMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            let directions = [[this.speed, 0], [-this.speed, 0], [0, this.speed], [0, -this.speed]];
            let validDirections = [];
            for (let dir of directions) {
                if (this.canMove(this.x + dir[0], this.y + dir[1])) {
                    validDirections.push(dir);
                }
            }
            if (validDirections.length > 0) {
                let newDir = validDirections[Math.floor(Math.random() * validDirections.length)];
                this.dx = newDir[0];
                this.dy = newDir[1];
            } else {
                this.dx = 0;
                this.dy = 0;
            }
        }
    }
}

const ghosts = [
    new Ghost(6, 6, 'red', pacman.speed),
    new Ghost(7, 6, 'pink', pacman.speed),
    new Ghost(6, 7, 'cyan', pacman.speed),
    new Ghost(7, 7, 'orange', pacman.speed)
];

function checkGhostCollision() {
    for (let i = 0; i < ghosts.length; i++) {
        const ghost = ghosts[i];
        const distance = Math.sqrt(
            Math.pow(pacman.x - ghost.x, 2) + Math.pow(pacman.y - ghost.y, 2)
        );

        if (distance < pacman.radius + ghost.radius) {
            gameOver = true;
            // clearInterval(gameInterval); // Removed: interval should continue running to draw end screen
            break;
        }
    }
}

function checkWinCondition() {
    if (pelletsEaten === totalPellets) {
        gameWon = true;
        // clearInterval(gameInterval); // Removed: interval should continue running to draw end screen
    }
}

function drawMaze() {
    for(let i = 0; i < maze.length; i++) {
        for(let j = 0; j < maze[i].length; j++) {
            if(maze[i][j] === 1) {
                ctx.fillStyle = 'blue';
                ctx.fillRect(j * boxSize, i * boxSize, boxSize, boxSize);
            } else if (maze[i][j] === 2) {
                ctx.beginPath();
                ctx.arc(j * boxSize + boxSize / 2, i * boxSize + boxSize / 2, 4, 0, 2 * Math.PI);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.closePath();
            } else if (maze[i][j] === 3) {
                ctx.beginPath();
                ctx.arc(j * boxSize + boxSize / 2, i * boxSize + boxSize / 2, 8, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

const button = {
    x: canvas.width / 2 - 75,
    y: canvas.height / 2 + 50,
    width: 150,
    height: 50,
    text: 'Try Again',
    draw: function() {
        ctx.fillStyle = '#00f';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.text, this.x + (this.width / 2) - (ctx.measureText(this.text).width / 2), this.y + (this.height / 2) + 8);
    }
};

function resetGame() {
    // Clear existing interval to prevent multiple game loops
    clearInterval(gameInterval);

    // Reset game state variables
    score = 0;
    gameOver = false;
    gameWon = false;
    pelletsEaten = 0;
    
    // Reset maze
    maze = initialMaze.map(row => [...row]); // Deep copy of the initial maze

    // Recalculate totalPellets for the new maze
    totalPellets = 0;
    for(let i = 0; i < maze.length; i++) {
        for(let j = 0; j < maze[i].length; j++) {
            if(maze[i][j] === 2 || maze[i][j] === 3) {
                totalPellets++;
            }
        }
    }

    // Reset Pac-Man
    pacman.x = 1 * boxSize + boxSize / 2;
    pacman.y = 1 * boxSize + boxSize / 2;
    pacman.dx = pacman.speed; // Start moving right
    pacman.dy = 0;
    pacman.nextDirX = 0;
    pacman.nextDirY = 0;
    pacman.direction = 'right';

    // Reset Ghosts
    ghosts.forEach(ghost => {
        ghost.x = ghost.initialX;
        ghost.y = ghost.initialY;
        let directions = [[ghost.speed, 0], [-ghost.speed, 0], [0, ghost.speed], [0, -ghost.speed]];
        let newDir = directions[Math.floor(Math.random() * directions.length)];
        ghost.dx = newDir[0];
        ghost.dy = newDir[1];
    });


    // Start the game loop again
    gameInterval = setInterval(gameLoop, 1000 / 60);
}


function gameLoop() {
    if (gameOver || gameWon) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas fully
        ctx.font = '48px Arial';
        ctx.fillStyle = gameOver ? 'red' : 'green';
        const message = gameOver ? 'Game Over!' : 'You Win!';
        ctx.fillText(message, canvas.width / 2 - ctx.measureText(message).width / 2, canvas.height / 2 - 50);
        button.draw();
        clearInterval(gameInterval); // Stop the interval *after* drawing the final screen
        return; // Stop further execution for this frame
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMaze();
        pacman.move();
        pacman.eatPellet();
        pacman.draw();

        ghosts.forEach(ghost => {
            ghost.move();
            ghost.draw();
        });

        checkGhostCollision();
        checkWinCondition();

        ctx.font = '24px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Score: ' + score, 10, canvas.height - 10);
    }
}

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            pacman.nextDirX = 0;
            pacman.nextDirY = -pacman.speed;
            pacman.direction = 'up'; // Set direction
            break;
        case 'ArrowDown':
            pacman.nextDirX = 0;
            pacman.nextDirY = pacman.speed;
            pacman.direction = 'down'; // Set direction
            break;
        case 'ArrowLeft':
            pacman.nextDirX = -pacman.speed;
            pacman.nextDirY = 0;
            pacman.direction = 'left'; // Set direction
            break;
        case 'ArrowRight':
            pacman.nextDirX = pacman.speed;
            pacman.nextDirY = 0;
            pacman.direction = 'right'; // Set direction
            break;
    }
});

canvas.addEventListener('click', e => {
    if (gameOver || gameWon) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (mouseX >= button.x && mouseX <= button.x + button.width &&
            mouseY >= button.y && mouseY <= button.y + button.height) {
            resetGame();
        }
    }
});

// Initial game setup
resetGame();