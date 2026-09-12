const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
  let deck = [];
  for (let s of SUITS) {
    for (let v of VALUES) {
      deck.push(`${v}${s}`);
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

let gameState = {
  players: {},
  communityCards: [],
  pot: 0,
  gameStarted: false
};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  gameState.players[socket.id] = {
    id: socket.id,
    name: `Player_${socket.id.substring(0, 4)}`,
    chips: 1000,
    cards: []
  };

  io.emit('stateUpdate', gameState);

  socket.on('startGame', () => {
    let deck = createDeck();
    gameState.communityCards = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
    gameState.pot = 100;
    gameState.gameStarted = true;

    Object.keys(gameState.players).forEach(id => {
      gameState.players[id].cards = [deck.pop(), deck.pop()];
    });

    io.emit('stateUpdate', gameState);
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    io.emit('stateUpdate', gameState);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
