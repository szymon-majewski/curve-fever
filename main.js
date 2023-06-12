import { Snake } from './snake.js'
import { SlowDownBonus, SpeedUpBonus } from './bonus.js'

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
let bonuses = [];
let id;
const tickInterval = 25;

let findLobbyButton = document.getElementById("findLobbyButton");
let startGameButton = document.getElementById("startGameButton");
let playersList = document.getElementById("playersList");
let winnerText = document.getElementById("winnerText");
let updateSnakePosInterval;
let playersParagraphs = [];

startGameButton.disabled = true;
winnerText.hidden = true;

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

let roundId = 0;
let recievedServerGameStateResponse = false;
let alive;
let alivePlayersCount;

// setup game
socket.on('gameStarted', () =>
{
    startGameButton.disabled = true;
    winnerText.hidden = true;
    alive = true;
    alivePlayersCount = snakes.length;
    ++roundId;
    refreshBoard();
    bonuses = [];

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

socket.on('playerWon', (data) =>
{
    if (data.id == id)
    {
        console.log("i won");
        alive = false;
        clearInterval(updateSnakePosInterval);
    }

    alivePlayersCount--;
    snakes[data.id].score += snakes.length - alivePlayersCount;
    playersParagraphs[data.id].textContent = snakes[data.id].name + ' ' + snakes[data.id].score;

    winnerText.style.color = snakesPrefabs[data.id].color;
    winnerText.textContent = snakes[data.id].name + ' won!!!';
    winnerText.hidden = false;
});

socket.on('playerWonNoPoints', (data) =>
{
    if (data.id == id)
    {
        console.log("i won");
        alive = false;
        clearInterval(updateSnakePosInterval);
    }

    winnerText.style.color = snakesPrefabs[data.id].color;
    winnerText.textContent = snakes[data.id].name + ' won!!!';
    winnerText.hidden = false;
});

socket.on('bonusAppeared', (data) =>
{
    let bonus;
    switch (data.type)
    {
        case "slowDown":
            bonus = new SlowDownBonus(data.id, data.x, data.y);
            break;
        case "speedUp":
            bonus = new SpeedUpBonus(data.id, data.x, data.y);
            break;
    }
    bonuses.push(bonus);
    bonus.draw();
});

socket.on('bonusTaken', (data) =>
{
    for (let i = 0; i < bonuses.length; ++i)
    {
        if (bonuses[i].id == data.bonusId)
        {
            if (data.snakeId == id)
            {  
                bonuses[i].action(snakes[id]);
            }
            bonuses[i].erase();
            bonuses.splice(i, 1);
            break;
        }
    }
});

function refreshBoard()
{
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Draw the black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bonuses.length; ++i)
    {
        bonuses[i].erase();
    }
}

function copySnakePosition(original, copy)
{
    copy.x = original.x;
    copy.y = original.y;
    copy.xDir = original.xDir;
    copy.yDir = original.yDir;
    copy.moveLeft = false;
    copy.moveRight = false;
    copy.speed = copy.defaultSpeed;
}