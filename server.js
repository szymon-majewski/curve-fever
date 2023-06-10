const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');
const path = require('path');

const app = express();
app.use(express.static(__dirname));
const server = http.Server(app);
const io = SocketIO(server);
const port = 3000;

// I dont think I need xDir, yDir in here
const snakes = 
[
    { x: 50, y: 50, name: "", xDir: 0.5, yDir: 0.5 },
    { x: 500, y: 50, name: "", xDir: -0.5, yDir: 0.5 },
    { x: 500, y: 500, name: "", xDir: -0.5, yDir: -0.5 },
    { x: 50, y: 500, name: "", xDir: 0.5, yDir: -0.5 }
];

let playersCount = 0;
const maxPlayers = 4;
let updatedPosCount = 0;

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
        socket.to('playersInLobby').emit('gameStarted');

        // ?????
        socket.emit('gameStarted');
    });

    socket.on('updateSnakePos', (data) =>
    {
        ++updatedPosCount;
        snakes[data.id].x = data.x;
        snakes[data.id].y = data.y;

        if (updatedPosCount == playersCount)
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
        }
    });
});

server.listen(port, () => console.log("Listening on port " + port))