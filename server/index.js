const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const tilesData = require("./tiles.json");

const MoveType = {
  Tile: 0,
  Stone: 1,
  Draw: 2,
};

class Room {
  constructor(name) {
    this.name = name;
    this.players = [];
    this.currentTurn = 0;

    this.tiles = [];
    this.stones = [];
    this.core = Array.from({ length: 48 }, (_, i) => i.toString()).filter(
      (i) => i !== "40"
    );

    this.tilesMicropulData = {};
    this.tilesData = tilesData;
    for (const key in this.tilesData) {
      if (this.tilesData.hasOwnProperty(key)) {
        const newArray = this.tilesData[key].map((value) =>
          value === 1 || value === 2 ? value : 0
        );
        this.tilesMicropulData[key] = newArray;
      }
    }

    this.shuffleCore();
  }

  shuffleCore() {
    for (let i = this.core.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.core[i], this.core[j]] = [this.core[j], this.core[i]];
    }
  }

  drawFromCore() {
    let tile = this.core[0];
    this.core.splice(0, 1);
    return tile;
  }

  addPlayer(socket) {
    if (this.players.length >= 2) return;

    var playerIndex = this.players.length; // player1 = 0, player2 = 1

    socket.on("sendMove", (move) => {
      this.handleMove(move, playerIndex);
    });

    socket.on("disconnect", () => {
      console.log("A client has disconnected");
      this.players.splice(playerIndex, 1);
      // TODO: stop game
    });

    this.players.push(socket);

    if (this.players.length >= 2) this.startGame();
  }

  startGame() {
    console.log("Starting game");
    this.players.forEach((s) => s.emit("startGame"));

    this.players.forEach((socket) => {
      var startingHand = [];
      for (let i = 0; i < 6; i++) {
        startingHand.push(this.drawFromCore());
      }
      socket.emit("setHand", startingHand);
    });
    this.players.forEach((s) => s.emit("setCore", this.core.length));

    this.players[0].emit("setTurn", true);
    this.players[1].emit("setTurn", false);
    this.currentTurn = 0;
    this.addTile("40", 0, { x: 0, y: 0 }, true);
  }

  handleMove(move, playerIndex) {
    if (move.type == MoveType.Tile) {
      this.addTile(
        move.tile.tileIndex,
        move.tile.rotation,
        move.tile.position,
        false
      );
      this.players[playerIndex == 0 ? 1 : 0].emit("getMove", move);
    }
    this.players[this.currentTurn].emit("setTurn", false);
    this.currentTurn = this.currentTurn == 0 ? 1 : 0;
    this.players[this.currentTurn].emit("setTurn", true);
  }

  addTile(index, rotation, position, isFirstTile) {
    if (!index) return;

    ////////////////////////
    // Place tile on grid //
    ////////////////////////

    // Get all placeholder/tiles coords.
    let coords = this.tiles.map((tile) => tile.position);

    // Check if there is a placeholder in the new position.
    if (
      !this.tiles.some(
        (tile) =>
          tile.position.x == position.x &&
          tile.position.y == position.y &&
          !tile.isTile
      ) &&
      coords.length > 0 // First tile can be placed without placeholder.
    ) {
      return; // Tiles cannot be placed on spaces that are not placeholders.
    }

    // Add new tile.
    this.tiles.push({
      position: position,
      tileIndex: index,
      isTile: true,
      rotation: rotation,
      locked: true,
    });

    if (isFirstTile) {
      // Add placeholders around new tile if there is empty space there.
      this.addPlaceholder(coords, { x: position.x - 1, y: position.y });
      this.addPlaceholder(coords, { x: position.x + 1, y: position.y });
      this.addPlaceholder(coords, { x: position.x, y: position.y - 1 });
      this.addPlaceholder(coords, { x: position.x, y: position.y + 1 });
    }

    // Sort tiles for rendering (placeholders before tiles).
    this.tiles.sort(this.sortTiles);

    if (isFirstTile) {
      this.players.forEach((s) => s.emit("tilesState", this.tiles));
      return;
    }

    // Check if move is valid
    let isMoveValid = this.checkMove({
      tileIndex: index,
      rotation: rotation,
      position: position,
      isTile: true,
      locked: true,
    });

    if (!isMoveValid) return;

    // Remove placeholder in the new tile position.
    let placeHolderIndex = this.tiles.findIndex(
      (tile) => tile.position.x == position.x && tile.position.y == position.y
    );
    this.tiles.splice(placeHolderIndex, 1);

    // Add placeholders around new tile if there is empty space there.
    this.addPlaceholder(coords, { x: position.x - 1, y: position.y });
    this.addPlaceholder(coords, { x: position.x + 1, y: position.y });
    this.addPlaceholder(coords, { x: position.x, y: position.y - 1 });
    this.addPlaceholder(coords, { x: position.x, y: position.y + 1 });

    // TODO:
    // Stones CCA.
    // this.updateStonesCCA();

    // TODO:
    // If move is valid, check activated catalysts.

    for (let i = 0; i < this.players.length; i++) {
      const element = this.players[i];
      element.emit("tilesState", this.tiles);
    }
  }

  sortTiles(a, b) {
    if (a.isTile && !b.isTile) {
      return 1; // a comes after b.
    } else if (!a.isTile && b.isTile) {
      return -1; // a comes before b.
    } else {
      return 0; // No change in order.
    }
  }

  checkMove(tile) {
    // Get adjacent tiles.
    let tiles = this.getAdjacentTiles(tile.position);
    let rightTile = tiles.right;
    let leftTile = tiles.left;
    let bottomTile = tiles.bottom;
    let topTile = tiles.top;

    let tileData = this.tilesMicropulData[tile.tileIndex];

    // Rotate tile.
    const rotate90 = (grid) => {
      const rotatedGrid = [];
      rotatedGrid[0] = grid[2];
      rotatedGrid[1] = grid[0];
      rotatedGrid[2] = grid[3];
      rotatedGrid[3] = grid[1];
      return rotatedGrid;
    };

    for (let i = 0; i < tile.rotation / 90; i++) tileData = rotate90(tileData);

    let moveValid = {
      hasValidConnection: false,
      hasInvalidConnection: false,
    };

    // Check connectd micropuls.
    const checkSide = (sTile, a1, a2, b1, b2) => {
      if (!sTile) return;

      let tData = this.tilesMicropulData[sTile.tileIndex];
      for (let i = 0; i < sTile.rotation / 90; i++) tData = rotate90(tData);
      let data = tileData;

      if (tData.length === 2) b1 = b2 = 0; // Big micropul.

      let hasValidConnection = data[a1] == tData[a2] || data[b1] == tData[b2];
      let hasInvalidConnection =
        (data[a1] != 0 && tData[a2] != 0 && data[a1] != tData[a2]) ||
        (data[b1] != 0 && tData[b2] != 0 && data[b1] != tData[b2]);

      moveValid.hasValidConnection =
        hasValidConnection || moveValid.hasValidConnection;
      moveValid.hasInvalidConnection =
        hasInvalidConnection || moveValid.hasInvalidConnection;
    };

    if (tileData.length === 4) {
      checkSide(rightTile, 1, 0, 3, 2);
      checkSide(leftTile, 0, 1, 2, 3);
      checkSide(topTile, 0, 2, 1, 3);
      checkSide(bottomTile, 2, 0, 3, 1);
    } else {
      // Big micropul.
      checkSide(rightTile, 0, 0, 0, 2);
      checkSide(leftTile, 0, 1, 0, 3);
      checkSide(topTile, 0, 2, 0, 3);
      checkSide(bottomTile, 0, 0, 0, 1);
    }

    return moveValid.hasValidConnection && !moveValid.hasInvalidConnection;
  }

  getAdjacentTiles(position) {
    let rightTile = this.tiles.find(
      (tile) =>
        tile.position.x == position.x + 1 &&
        tile.position.y == position.y &&
        tile.tileIndex
    );
    let leftTile = this.tiles.find(
      (tile) =>
        tile.position.x == position.x - 1 &&
        tile.position.y == position.y &&
        tile.tileIndex
    );
    let bottomTile = this.tiles.find(
      (tile) =>
        tile.position.x == position.x &&
        tile.position.y == position.y + 1 &&
        tile.tileIndex
    );
    let topTile = this.tiles.find(
      (tile) =>
        tile.position.x == position.x &&
        tile.position.y == position.y - 1 &&
        tile.tileIndex
    );

    return {
      right: rightTile,
      left: leftTile,
      bottom: bottomTile,
      top: topTile,
    };
  }

  addPlaceholder(coords, position) {
    if (!coords.some((coord) => coord.x == position.x && coord.y == position.y))
      this.tiles.push({
        position: { x: position.x, y: position.y },
        isTile: false,
        tileIndex: null,
        rotation: 0,
        locked: true,
      });
  }
}

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

const port = 3000;

var rooms = {};

io.on("connection", (socket) => {
  console.log("A client has connected");
  socket.on("joinGame", (room) => {
    console.log("Got joinGame from socket");
    if (rooms[room] == undefined) {
      rooms[room] = new Room(room);
    }
    rooms[room].addPlayer(socket);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
