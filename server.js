const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');
const path = require('path');

const app = express();
app.use(express.static(__dirname));
const server = http.Server(app);
const io = SocketIO(server);
const port = 3000;

const snakes = 
[
    { x: 50, y: 50, name: "", parts: []},
    { x: 500, y: 50, name: "", parts: []},
    { x: 500, y: 500, name: "", parts: []},
    { x: 50, y: 500, name: "", parts: []}
];

let playersCount = 0;
const maxPlayers = 4;
let alivePlayersCount;
let playersDiedThisTick;
let lastPlayerToDieThisTick;
let updatedPosCount = 0;
let timeBetweenRounds = 1000;
let ommitedSelfPartsCount = 20;
let roundEnded;
let whoAlive = [];
let ticks = 0;
let bonusEveryTick = 100;
let bonusRadius = 15;
let bonusDiameter = bonusRadius * 2;
const maxBonuses = 3;
let bonuses = [];
let bonusesTypes =
{
    0: "slowDown",
    1: "speedUp"
}
let snakeThickness = 1.5;
let snakeDiameter = snakeThickness * 2;
let boardHeight = 550;
let boardWidth = 550;

io.on('connection', (socket) =>
{
    console.log(socket.id + " connected.");

    socket.on('findLobby', (data) =>
    {
        if (playersCount >= maxPlayers)
        {
            socket.emit('serverFull');
            return;
        }

        console.log(data.name + " wants to play!");

        snakes[playersCount].name = data.name;

        let snakesNames = [];
        for (let i = 0; i <= playersCount; ++i)
        {
            snakesNames.push(snakes[i].name);
        }

        socket.to('playersInLobby').emit('newPlayerJoined', { name: data.name });
        socket.emit('findLobbyResponse', { id: playersCount, names: snakesNames });

        playersCount++;
        socket.join('playersInLobby');
    });

    socket.on('startGame', () =>
    {
        updatedPosCount = 0;
        alivePlayersCount = playersCount;
        playersDiedThisTick = 0;
        roundEnded = false;

        for (let i = 0; i < playersCount; ++i)
        {
            whoAlive.push(i);
            snakes[i].parts = [];
        }

        socket.to('playersInLobby').emit('gameStarted');
        // ?????
        socket.emit('gameStarted');
    });

    socket.on('updateSnakePos', (data) =>
    {
        snakes[data.id].x = data.x;
        snakes[data.id].y = data.y;
        snakes[data.id].parts.push({ x: data.x, y: data.y });

        let bonusId = checkCollisionWithBonuses(data.id);

        if (bonusId != -1)
        {
            socket.to('playersInLobby').emit('bonusTaken', { snakeId: data.id, bonusId: bonusId });
            // ?????
            socket.emit('bonusTaken', { snakeId: data.id, bonusId: bonusId });
        }

        if (checkCollisionWithBorder(data.id) || checkCollisionWithSnakes(data.id))
        {
            socket.to('playersInLobby').emit('playerDied', { id: data.id });
            // ?????
            socket.emit('playerDied', { id: data.id });

            ++playersDiedThisTick;
            lastPlayerToDieThisTick = data.id;
            console.log("player died " + data.id);

            whoAlive.splice(whoAlive.indexOf(data.id), 1);
        }

        console.log("iter " + ticks + ": player " + data.id);

        ++updatedPosCount;
        if (updatedPosCount == alivePlayersCount)
        {
            let snakesPos = [];
            for (let i = 0; i < playersCount; ++i)
            {
                snakesPos.push({ x: snakes[i].x, y: snakes[i].y });
            }

            socket.to('playersInLobby').emit('updateGameState', snakesPos);

            // ?????
            socket.emit('updateGameState', snakesPos);

            updatedPosCount = 0;
            alivePlayersCount -= playersDiedThisTick;
            playersDiedThisTick = 0;
            ticks++;

            if (ticks % bonusEveryTick == 0 && bonuses.length < maxBonuses)
            {
                data = chooseBonusPositionAndType();

                if (data !== -1)
                {
                    bonuses.push(data);
                    socket.to('playersInLobby').emit('bonusAppeared', data);
                    // ?????
                    socket.emit('bonusAppeared', data);
                }
            }
        }

        if (alivePlayersCount <= 1 && !roundEnded)
        {
            roundEnded = true;

            if (alivePlayersCount == 1)
            {
                socket.to('playersInLobby').emit('playerWon', { id: whoAlive[0] });
                // ?????
                socket.emit('playerWon', { id: whoAlive[0] });
            }
            else
            {
                socket.to('playersInLobby').emit('playerWonNoPoints', { id: lastPlayerToDieThisTick });
                // ?????
                socket.emit('playerWonNoPoints', { id: lastPlayerToDieThisTick });
            }

            setTimeout(() =>
            {
                socket.to('playersInLobby').emit('gameStarted');
                // ?????
                socket.emit('gameStarted');

                alivePlayersCount = playersCount;

                for (let i = 0; i < playersCount; ++i)
                {
                    snakes[i].parts = [];
                }

                whoAlive = [];
                for (let i = 0; i < playersCount; ++i)
                {
                    whoAlive.push(i);
                }

                roundEnded = false;
                ticks = 0;
                bonuses = [];
            }, timeBetweenRounds);
        }
    });
});

function checkCollisionWithBorder(snakeId)
{
    if (snakes[snakeId].x - snakeThickness <= 0 ||
        snakes[snakeId].x + snakeThickness >= boardWidth ||
        snakes[snakeId].y - snakeThickness <= 0 ||
        snakes[snakeId].y + snakeThickness >= boardHeight)
    {
        return true;
    }
    else
    {
        return false;
    }
}

function checkCollisionWithSnakes(snakeId)
{
    let end;
    let head = snakes[snakeId].parts[snakes[snakeId].parts.length - 1];

    for (let i = 0; i < playersCount; ++i)
    {
        end = (i == snakeId ? snakes[i].parts.length - ommitedSelfPartsCount : snakes[i].parts.length);
        
        // Checking every second circle
        for (let j = 0; j < end; j += 2)
        {
            if (circlesIntersect(snakes[i].parts[j], snakeThickness, head, snakeThickness))
            {
                return true;
            }
        }
    }
    
    return false;
}

function checkCollisionWithBonuses(snakeId)
{
    let head = snakes[snakeId].parts[snakes[snakeId].parts.length - 1];

    for (let i = 0; i < bonuses.length; ++i)
    {
        if (circlesIntersect(head, snakeThickness, { x: bonuses[i].x + bonusRadius, y: bonuses[i].y + bonusRadius }, bonusRadius))
        {
            let collisionBonusId = bonuses[i].id

            bonuses.splice(i, 1);

            return collisionBonusId;
        }
    }
    
    return -1;
}

function circlesIntersect(circle1Pos, circle1Diameter, circle2Pos, circle2Diameter)
{
    return (Math.sqrt(Math.pow(circle1Pos.x - circle2Pos.x, 2) + Math.pow(circle1Pos.y - circle2Pos.y, 2)) <= circle1Diameter + circle2Diameter);
}

function chooseBonusPositionAndType()
{
    let validPos;
    let tries = 0;

    while (++tries < 100)
    {
        let bonusX = Math.random() * (boardWidth - bonusDiameter);
        let bonusY = Math.random() * (boardHeight - bonusDiameter);

        // check
        validPos = true;
        
        for (let i = 0; i < playersCount && validPos; ++i)
        {
            for (let j = 0; j < snakes[i].parts.length; ++j)
            {
                if (circlesIntersect(snakes[i].parts[j], snakeThickness, { x: bonusX + bonusRadius, y: bonusY + bonusRadius }, bonusRadius))
                {
                    validPos = false;
                    break;
                }
            }
        }

        if (!validPos)
        {
            continue;
        }

        let type = Math.floor(Math.random() * Object.keys(bonusesTypes).length);
        //console.log(type + ' ' + bonusesTypes[type]);
        return { id: ticks, x: bonusX, y: bonusY, type: bonusesTypes[type] };
    }

    return -1;
}

server.listen(port, () => console.log("Listening on port " + port))