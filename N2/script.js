const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

context.scale(BLOCK_SIZE, BLOCK_SIZE);
nextContext.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = createBoard();
let animationId;

const COLORS = [
    null,
    'cyan',    // I
    'blue',    // J
    'orange',  // L
    'yellow',  // O
    'green',   // S
    'purple',  // T
    'red',     // Z
];

const TETROMINOES = {
    'I': [[1, 1, 1, 1]],
    'J': [[2, 0, 0], [2, 2, 2]],
    'L': [[0, 0, 3], [3, 3, 3]],
    'O': [[4, 4], [4, 4]],
    'S': [[0, 5, 5], [5, 5, 0]],
    'T': [[0, 6, 0], [6, 6, 6]],
    'Z': [[7, 7, 0], [0, 7, 7]],
};

let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

let nextPiece = null;

function createBoard() {
    return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

function getRandomPiece() {
    const pieces = 'IJLOSTZ';
    const type = pieces[pieces.length * Math.random() | 0];
    return TETROMINOES[type];
}

function playerReset() {
    player.matrix = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    if (collide(board, player)) {
        gameOver();
    }
}

function gameOver() {
    cancelAnimationFrame(animationId);
    animationId = null;
    context.fillStyle = 'rgba(0,0,0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.font = '1px "Press Start 2P"';
    context.textAlign = 'center';
    context.fillText('GAME OVER', COLS / 2, ROWS / 2);
}

function draw() {
    // Main board
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, {x: 0, y: 0}, context);
    drawMatrix(player.matrix, player.pos, context);

    // Next piece
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const x = (nextCanvas.width / BLOCK_SIZE - nextPiece[0].length) / 2;
    const y = (nextCanvas.height / BLOCK_SIZE - nextPiece.length) / 2;
    if (nextPiece) {
        drawMatrix(nextPiece, {x, y}, nextContext);
    }
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(offset.x + x, offset.y + y, 1, 1);
                // Add a border to each block for a more classic look
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.1;
                ctx.strokeRect(offset.x + x, offset.y + y, 1, 1);
            }
        });
    });
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(board, player) {
    const { matrix, pos } = player;
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0 &&
                (board[y + pos.y] && board[y + pos.y][x + pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

function rotate(matrix) {
    const newMatrix = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex])).reverse();
    return newMatrix;
}

function playerRotate() {
    const originalPos = player.pos.x;
    let offset = 1;
    const rotated = rotate(player.matrix);
    player.matrix = rotated;

    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            player.matrix = rotate(rotate(rotate(player.matrix))); // Rotate back
            player.pos.x = originalPos;
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    animationId = requestAnimationFrame(update);
}

function updateScore() {
    scoreElement.innerText = player.score;
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

document.addEventListener('keydown', event => {
    if (!animationId) return;

    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate();
    }
});

startButton.addEventListener('click', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    board.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    playerReset();
    update();
});
