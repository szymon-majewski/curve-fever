import { Snake } from './snake.js'

let canvas = document.getElementById('Board');
let ctx = canvas.getContext('2d');

const socket = io();

const snakesPrefabs = 
[
    new Snake(50, 50, 0.5, 0.5, '#00FF00'),
    new Snake(500, 50, -0.5, 0.5, '#FFFF00'),
    new Snake(500, 500, -0.5, -0.5, '#FF0000'),
    new Snake(50, 500, 0.5, -0.5, '#0000FF')
];

let snakes = [];
let id;
const tickInterval = 25;

let findLobbyButton = document.getElementById("findLobbyButton");
let startGameButton = document.getElementById("startGameButton");
let playersList = document.getElementById("playersList");
let updateSnakePosInterval;
let playersParagraphs = [];

startGameButton.disabled = true;

socket.on('connect', () =>
{
    console.log("You connected to achtung die kurve server.");
});

findLobbyButton.onclick = () =>
{
    socket.emit('findLobby', { name: document.getElementById("nicknameInput").value });
    findLobbyButton.disabled = true;
}

socket.on('findLobbyResponse', (data) =>
{
    id = data.id;

    for (let i = 0; i <= data.id; ++i)
    {
        let newSnake = new Snake(50, 50, 0.5, 0.5, '#00FF00');
        copySnakePosition(snakesPrefabs[i], newSnake);
        newSnake.color = snakesPrefabs[i].color;
        snakes.push(newSnake);
        snakes[i].name = data.names[i];
        snakes[i].drawHead();

        const p = document.createElement("p");
        p.classList.add("PlayerId");
        p.style.color = snakesPrefabs[i].color;
        const node = document.createTextNode(data.names[i] + ' 0');
        p.appendChild(node);
        playersList.appendChild(p);
        playersParagraphs.push(p);
    }

    if (snakes.length > 1)
    {
        startGameButton.disabled = false;
    }
});

socket.on('serverFull', () =>
{
    console.log('Server is full. Cannot join.');
});

socket.on('newPlayerJoined', (data) =>
{
    let newSnakeId = snakes.length;

    let newSnake = new Snake(50, 50, 0.5, 0.5, '#00FF00');
    copySnakePosition(snakesPrefabs[newSnakeId], newSnake);
    newSnake.color = snakesPrefabs[newSnakeId].color;
    snakes.push(newSnake);
    snakes[newSnakeId].name = data.name;
    snakes[newSnakeId].drawHead();

    const p = document.createElement("p");
    p.classList.add("PlayerId");
    p.style.color = snakesPrefabs[newSnakeId].color;
    const node = document.createTextNode(data.name + ' 0');
    p.appendChild(node);
    playersList.appendChild(p);
    playersParagraphs.push(p);

    if (snakes.length > 1)
    {
        startGameButton.disabled = false;
    }
});

startGameButton.onclick = function()
{
    socket.emit('startGame');
    startGameButton.disabled = true;
}

let gameOver = true;
let roundId = 0;
let recievedServerGameStateResponse = false;
let alive;
let alivePlayersCount;

// setup game
socket.on('gameStarted', () =>
{
    startGameButton.disabled = true;
    gameOver = false;
    alive = true;
    alivePlayersCount = snakes.length;
    ++roundId;
    refreshBoard();

    for (let i = 0; i < snakes.length; ++i)
    {
        // TODO: change starting points
        copySnakePosition(snakesPrefabs[i], snakes[i])
    }

    console.log("moj waz: x: " + snakes[id].x + ", y: " + snakes[id].y);

    socket.emit('updateSnakePos', { id: id, x: snakes[id].x, y: snakes[id].y });

    updateSnakePosInterval = setInterval( () =>
    {
        if (recievedServerGameStateResponse)
        {
            recievedServerGameStateResponse = false;
            snakes[id].move();
            socket.emit('updateSnakePos', { id: id, x: snakes[id].x, y: snakes[id].y });
        }
    }, tickInterval);
});

socket.on('updateGameState', (data) =>
{
    console.log("jestem tu");

    for (let i = 0; i < snakes.length; ++i)
    {
        if (i != id)
        {
            snakes[i].x = data[i].x;
            snakes[i].y = data[i].y;
            snakes[i].drawHead();
        }
    }

    if (alive)
    {
        snakes[id].drawHead();
    }

    recievedServerGameStateResponse = true;
});

socket.on('playerDied', (data) =>
{
    console.log("someone died");
    if (data.id == id)
    {
        console.log("i died");
        alive = false;
        clearInterval(updateSnakePosInterval);
    }

    alivePlayersCount--;
    snakes[data.id].score += snakes.length - alivePlayersCount;
    playersParagraphs[data.id].textContent = snakes[data.id].name + ' ' + snakes[data.id].score;
});

function refreshBoard()
{
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Draw the black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function copySnakePosition(original, copy)
{
    copy.x = original.x;
    copy.y = original.y;
    copy.xDir = original.xDir;
    copy.yDir = original.yDir;
    copy.moveLeft = false;
    copy.moveRight = false;
}