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
    { x: 50, y: 50, name: ""},
    { x: 500, y: 50, name: ""},
    { x: 500, y: 500, name: ""},
    { x: 50, y: 500, name: ""}
];

let playersCount = 0;
const maxPlayers = 4;
let alivePlayersCount;
let playersDiedThisTick;
let updatedPosCount = 0;
let timeBetweenRounds = 1000;

//DEBUG
let ind = 0;

// STUFF THAT SHOULD NOT BE HARDCODED HERE
let snakeThickness = 1;
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

        if (checkCollisionWithBorder(data.id))
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

server.listen(port, () => console.log("Listening on port " + port))