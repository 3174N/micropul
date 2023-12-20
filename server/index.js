const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const tilesData = require("./tiles.json");

const MoveType = {
  Tile: 0,
  Stone: 1,
  Draw: 2,
};

class Player {
  constructor(socket) {
    this.socket = socket;

    this.hand = [];
    this.supply = [];
    this.placedStones = [];
    this.remainingStones = 3;

    this.bonusTurns = 0;

    this.score = 0;
  }
}

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

    this.players.push(new Player(socket));

    if (this.players.length >= 2) this.startGame();
  }

  updateGame() {
    this.players.forEach((player) => {
      // TODO: Update stones

      player.socket.emit("setCore", this.core.length);
      player.socket.emit("tilesState", this.tiles);
      // FIXME: Weird stuff with player hands not setting correctly (can't reproduce).
      player.socket.emit("setHand", player.hand);
      player.socket.emit("setSupply", player.supply.length);
    });
  }

  startGame() {
    console.log("Starting game");
    this.players.forEach((p) => p.socket.emit("startGame"));

    this.players.forEach((player) => {
      var startingHand = [];
      for (let i = 0; i < 6; i++) {
        startingHand.push(this.drawFromCore());
      }
      player.hand = startingHand;
      player.supply = [];
    });

    this.players[0].socket.emit("setTurn", true);
    this.players[1].socket.emit("setTurn", false);
    this.currentTurn = 0;
    this.addTile("40", 0, { x: 0, y: 0 }, true);

    this.updateGame();
  }

  handleMove(move, playerIndex) {
    if (move.type == MoveType.Tile) {
      this.addTile(
        move.tile.tileIndex,
        move.tile.rotation,
        move.tile.position,
        false
      );
      this.players[playerIndex == 0 ? 1 : 0].socket.emit("getMove", move);
    } else if (move.type == MoveType.Draw) {
      this.drawFromSupply();
    } else if (move.type == MoveType.Stone) {
      this.addStone(move.stone);
      this.players[playerIndex == 0 ? 1 : 0].socket.emit("getMove", move);
    }

    if (this.players[this.currentTurn].bonusTurns == 0) {
      this.players[this.currentTurn].socket.emit("setTurn", false);
      this.currentTurn = this.currentTurn == 0 ? 1 : 0;
      this.players[this.currentTurn].socket.emit("setTurn", true);
    } else {
      this.players[this.currentTurn].bonusTurns--;
    }

    this.updateGame();

    // Check for game end.
    if (this.core.length == 0) {
      this.endGame();
    }
    for (let i = 0; i < this.players.length; i++) {
      if (
        this.players[i].hand.length == 0 &&
        this.players[i].supply.length == 0
      ) {
        this.endGame(i);
      }
    }
  }

  addTile(index, rotation, position, isFirstTile) {
    if (!index) return;

    ////////////////////////
    // Place tile on grid //
    ////////////////////////

    // Remove tile from hand
    if (!isFirstTile) {
      let hand = this.players[this.currentTurn].hand;
      hand.splice(
        hand.findIndex((t) => t == index),
        1
      );
    }

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
    let newTile = {
      position: position,
      tileIndex: index,
      isTile: true,
      rotation: rotation,
      locked: true,
    };
    this.tiles.push(newTile);

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

    // Check activated catalysts
    let connections = this.getConnections(newTile);
    let tilesToSupply = 0;
    let bonusTurns = 0;
    connections.forEach((c) => {
      if (c[0] == 1 || c[0] == 2) {
        if (c[1] == 3) tilesToSupply++;
        if (c[1] == 4) tilesToSupply += 2;
        if (c[1] == 5) bonusTurns++;
      } else if (c[1] == 1 || c[1] == 2) {
        if (c[0] == 3) tilesToSupply++;
        if (c[0] == 4) tilesToSupply += 2;
        if (c[0] == 5) bonusTurns++;
      }
    });

    if (tilesToSupply > 0) {
      for (let i = 0; i < tilesToSupply; i++) {
        this.players[this.currentTurn].supply.push(this.drawFromCore());
      }
    }

    this.players[this.currentTurn].bonusTurns += bonusTurns;
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

  getConnections(tile) {
    // TODO: use this function for checking move

    // Get adjacent tiles.
    let tiles = this.getAdjacentTiles(tile.position);
    let rightTile = tiles.right;
    let leftTile = tiles.left;
    let bottomTile = tiles.bottom;
    let topTile = tiles.top;

    let tileData = this.tilesData[tile.tileIndex];

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

    let connections = [];

    // Check connected micropuls.
    const checkSide = (sTile, a1, a2, b1, b2) => {
      // 1 = this tile; 2 = other tile.
      // a = first connection; b = second connection
      // example - checking the tile to the right:
      // 0 1(a1)  0(a2) 1
      // 2 3(b1)  2(b2) 3

      if (!sTile) return;

      let tData = this.tilesData[sTile.tileIndex];
      for (let i = 0; i < sTile.rotation / 90; i++) tData = rotate90(tData);
      let data = tileData;

      if (data.length === 2) {
        // Tile is big micropul.
        if (tData.length === 2) {
          // Both tiles are big micropuls.
          connections.push([data[0], tData[0]]);
          connections.push([data[0], tData[1]]);
          connections.push([data[1], tData[0]]);
          connections.push([data[1], tData[1]]);
        } else {
          connections.push([tData[a2], data[0]]);
          connections.push([tData[b2], data[0]]);
          connections.push([tData[a2], data[1]]);
          if (tData[a2] != tData[b2])
            // Avoid double awarding.
            connections.push([tData[b2], data[1]]);
        }
      } else if (tData.length === 2) {
        // Other tile is big micropul.
        connections.push([data[a1], tData[0]]);
        connections.push([data[b1], tData[0]]);
        connections.push([data[a1], tData[1]]);
        if (data[a1] != data[b1]) connections.push([data[b1], tData[1]]);
      } else {
        connections.push([data[a1], tData[a2]]);
        connections.push([data[b1], tData[b2]]);
      }
    };

    // Tile:
    // 0 1
    // 2 3
    checkSide(rightTile, 1, 0, 3, 2);
    checkSide(leftTile, 0, 1, 2, 3);
    checkSide(topTile, 0, 2, 1, 3);
    checkSide(bottomTile, 2, 0, 3, 1);

    return connections;
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

  drawFromSupply() {
    let supply = this.players[this.currentTurn].supply;
    let tile = supply.pop();
    this.players[this.currentTurn].hand.push(tile);
  }

  stoneCCA(coords, component) {
    if (
      component.some(
        (coord) =>
          coord.coords.x == coords.coords.x &&
          coord.coords.y == coords.coords.y &&
          coord.qrtr == coords.qrtr
      )
    )
      return false;

    component.push(coords);

    let position = coords.coords;

    // Get adjacent tiles.
    let tiles = this.getAdjacentTiles(coords.coords);
    let rightTile = tiles.right;
    let leftTile = tiles.left;
    let bottomTile = tiles.bottom;
    let topTile = tiles.top;

    let tile = this.tiles.find(
      (tile) =>
        tile.position.x == position.x &&
        tile.position.y == position.y &&
        tile.tileIndex
    );
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

    let isOpen = false;

    const checkAdjacentMicropul = (tile, qrtr, micropul) => {
      if (tile) {
        let data = this.tilesMicropulData[tile.tileIndex];
        if (data.length == 2) {
          if (data[0] != micropul) return;

          let open0 = this.stoneCCA(
            { coords: tile.position, qrtr: 0 },
            component
          );
          let open1 = this.stoneCCA(
            { coords: tile.position, qrtr: 1 },
            component
          );
          let open2 = this.stoneCCA(
            { coords: tile.position, qrtr: 2 },
            component
          );
          let open3 = this.stoneCCA(
            { coords: tile.position, qrtr: 3 },
            component
          );
          isOpen = isOpen || open0 || open1 || open2 || open3;
        } else {
          for (let i = 0; i < tile.rotation / 90; i++) data = rotate90(data);
          if (data[qrtr] == micropul)
            isOpen =
              this.stoneCCA({ coords: tile.position, qrtr: qrtr }, component) ||
              isOpen;
        }
      } else {
        isOpen = true;
      }
    };

    const checkAdjacent = (tileA, tileB, aQrtr, bQrtr) => {
      checkAdjacentMicropul(tileA, aQrtr, micropul);
      checkAdjacentMicropul(tileB, bQrtr, micropul);
      checkAdjacentMicropul(tile, aQrtr, micropul);
      checkAdjacentMicropul(tile, bQrtr, micropul);
    };

    let micropul = tileData.length != 2 ? tileData[coords.qrtr] : tileData[0];
    switch (coords.qrtr) {
      case 0:
        checkAdjacent(topTile, leftTile, 2, 1);
        break;
      case 1:
        checkAdjacent(topTile, rightTile, 3, 0);
        break;
      case 2:
        checkAdjacent(bottomTile, leftTile, 0, 3);
        break;
      case 3:
        checkAdjacent(bottomTile, rightTile, 1, 2);
        break;
    }

    return isOpen;
  }

  calcStonesArea() {
    let area = [];
    let isOpen = false;
    this.stones.forEach((stone) => {
      let component = [];
      isOpen = this.stoneCCA(stone, component) || isOpen;
      area = area.concat(component);
    });
    return area;
  }

  addStone(stoneCoords) {
    let player = this.players[this.currentTurn];
    if (player.remainingStones.length <= 0) return; // TODO: Error

    let area = this.calcStonesArea();
    if (
      area.some(
        (coord) =>
          coord.coords.x == stoneCoords.coords.x &&
          coord.coords.y == stoneCoords.coords.y &&
          coord.qrtr == stoneCoords.qrtr
      )
    )
      return; // TODO: Error

    this.stones.push(stoneCoords);

    player.remainingStones--;
    player.placedStones.push(stoneCoords);
  }

  endGame(winner = undefined) {
    if (winner !== undefined) {
      console.log("Winner: " + winner);
      return;
    }

    // Calculate score
    this.players.forEach((player) => {
      player.score += player.hand.length + player.supply.length * 2;
      // TODO: Stones score (based on CCA whatever)
    });

    // Find player with largest score
    let maxScore = 0;
    let winnerIndex = 0;
    this.players.forEach((player, index) => {
      if (player.score > maxScore) {
        maxScore = player.score;
        winnerIndex = index;
      }
    });

    console.log("Winner: " + winnerIndex);

    // TODO: close room or something
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
