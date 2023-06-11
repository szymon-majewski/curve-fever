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
let updatedPosCount = 0;
let timeBetweenRounds = 1000;
let ommitedSelfPartsCount = 10;

//DEBUG
let ind = 0;

// STUFF THAT SHOULD NOT BE HARDCODED HERE
let snakeThickness = 1;
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

        socket.to('playersInLobby').emit('gameStarted');

        // ?????
        socket.emit('gameStarted');
    });

    socket.on('updateSnakePos', (data) =>
    {
        snakes[data.id].x = data.x;
        snakes[data.id].y = data.y;
        snakes[data.id].parts.push({ x: data.x, y: data.y });

        if (checkCollisionWithBorder(data.id) || checkCollisionWithSnakes(data.id))
        {
            socket.to('playersInLobby').emit('playerDied', { id: data.id });
            // ?????
            socket.emit('playerDied', { id: data.id });

            ++playersDiedThisTick;
            console.log("player died " + data.id);
        }

        console.log("iter " + ind + ": player " + data.id);

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
            ind++;
        }

        if (alivePlayersCount == 0)
        {
            setTimeout(() =>
            { 
                console.log("death");
                socket.to('playersInLobby').emit('gameStarted');
                // ?????
                socket.emit('gameStarted');

                alivePlayersCount = playersCount;

                for (let i = 0; i < playersCount; ++i)
                {
                    snakes[i].parts = [];
                }
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
        
        // Skipping every third circle
        for (let j = 0; j < end; j += 3)
        {
            if (circlesIntersect(snakes[i].parts[j], head))
            {
                return true;
            }
        }
    }
    
    return false;
}

function circlesIntersect(circle1, circle2)
{
    return (Math.sqrt(Math.pow(circle1.x - circle2.x, 2) + Math.pow(circle1.y - circle2.y, 2)) <= snakeDiameter)
}

server.listen(port, () => console.log("Listening on port " + port))