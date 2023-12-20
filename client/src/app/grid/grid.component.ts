import { Component, HostListener, Input, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';
import { GameService } from '../services/game.service';
import tilesData from './tiles.json';

interface Coords {
  x: number;
  y: number;
}

interface StoneCoords {
  coords: Coords;
  qrtr: number;
}

interface Tile {
  position: Coords;
  isTile: boolean; // Non-tile are places near tiles that can be placed on.
  tileIndex: string | null;
  rotation: number;
  locked: boolean;
}

enum MoveType {
  Tile = 0,
  Stone,
  Draw,
}

interface MoveMessage {
  type: MoveType;
  tile: Tile | undefined;
  stone: StoneCoords | undefined;
}

@Component({
  selector: 'tile-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.less'],
})
export class GridComponent implements OnInit {
  indexOver: number = -1;
  previewStyle: any = null;

  tilesData: { [index: string]: number[] } = {};
  tilesMicropulData: { [index: string]: number[] } = {};
  tiles: Tile[] = [];
  stones: StoneCoords[] = [];
  enemyStones: StoneCoords[] = [];
  stonesCCA: StoneCoords[][] = [];
  enemyStonesCCA: StoneCoords[][] = [];

  readonly SCROLL_THRESH = 50;
  readonly MIN_SCALE = 1;
  readonly MAX_SCALE = 5;
  readonly SCALE_STEP = 1.02;
  isHovered = false;

  @Input() scale: number = 1;
  @Input() translateX: number = window.innerWidth / 2 - 50;
  @Input() translateY: number = window.innerHeight / 2 - 50;

  lastMouseX: number = 0;
  lastMouseY: number = 0;
  isDragging: boolean = false;

  hasMove: boolean = false;
  movePosition: Coords = { x: 0, y: 0 };
  isMoveValid: boolean = false;

  constructor(
    private sharedService: SharedService,
    private gameService: GameService
  ) {
    this.gameService.socket.on('setHand', (hand: string[]) => {
      this.sharedService.setHand(hand);
    });
    this.gameService.socket.on('startGame', () => {
      console.log('Got game start');
      this.startGame();
    });
    this.gameService.socket.on('setTurn', (playerTurn: boolean) => {
      this.sharedService.setTurn(playerTurn);
    });
    this.gameService.socket.on('getMove', (move: MoveMessage) => {
      this.handleNewMove(move);
    });
    this.gameService.socket.on('tilesState', (newTiles: Tile[]) => {
      this.tiles = [];
      newTiles.forEach((t) => {
        if (t.isTile) {
          this.placeNewTile(t, false); // Dont update CCA before all tiles are placed.
        }
      });
      this.updateStonesCCA();
    });
    this.gameService.socket.on('endGame', () => {
      this.endGame();
    });
  }

  ngOnInit(): void {
    this.gameService.socket.emit('joinGame', 'testroom');
  }

  startGame() {
    this.tilesData = tilesData;
    for (const key in this.tilesData) {
      if (this.tilesData.hasOwnProperty(key)) {
        const newArray = this.tilesData[key].map((value) =>
          value === 1 || value === 2 ? value : 0
        );
        this.tilesMicropulData[key] = newArray;
      }
    }
  }

  endGame() {
    // TODO
  }

  handleNewMove(move: MoveMessage) {
    switch (move.type) {
      case MoveType.Tile:
        this.placeNewTile(move.tile!);
        break;
      case MoveType.Stone:
        this.placeNewStone(move.stone!);
        break;
      case MoveType.Draw:
        break;
    }
  }

  /**
   * Adds placeholders near new tile.
   *
   * @param coords Coordinates of all tiles & placeholders.
   * @param position New tile position.
   */
  addPlaceholder(coords: Coords[], position: Coords) {
    if (!coords.some((coord) => coord.x == position.x && coord.y == position.y))
      this.tiles.push({
        position: { x: position.x, y: position.y },
        isTile: false,
        tileIndex: null,
        rotation: 0,
        locked: true,
      });
  }

  /**
   * Sorts tiles by tile < placeholders (used to render tiles above placeholders).
   *
   * @param a
   * @param b
   */
  sortTiles(a: Tile, b: Tile) {
    if (a.isTile && !b.isTile) {
      return 1; // a comes after b.
    } else if (!a.isTile && b.isTile) {
      return -1; // a comes before b.
    } else {
      return 0; // No change in order.
    }
  }

  /**
   * Adds a new tile to grid.
   *
   * @param index Tile index.
   * @param rotation Tile rotation.
   * @param position New position.
   */
  addTile(index: string | null, rotation: number, position: Coords) {
    if (!this.sharedService.getTurn()) return;

    if (!index) return;

    ////////////////////////
    // Place tile on grid //
    ////////////////////////

    // Get all placeholder/tiles coords.
    let coords: Coords[] = this.tiles.map((tile) => tile.position);

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
      this.sharedService.setSelectedTile({ tileIndex: null, rotation: 0 });
      return; // Tiles cannot be placed on spaces that are not placeholders.
    }

    // Cancel unconfirmed move.
    if (this.hasMove) this.cancelMove();

    // Add new tile.
    this.tiles.push({
      position: position,
      tileIndex: index,
      isTile: true,
      rotation: rotation,
      locked: false,
    });

    // Remove tile from hand.
    this.hasMove = true;
    this.movePosition = position;

    let hand = this.sharedService.getHand();
    hand.splice(hand.indexOf(index), 1);
    this.sharedService.setHand(hand);
    this.sharedService.setSelectedTile({ tileIndex: null, rotation: 0 });

    // Sort tiles for rendering (placeholders before tiles).
    this.tiles.sort(this.sortTiles);

    // Check if move is valid
    this.isMoveValid = this.checkMove({
      tileIndex: index,
      rotation: rotation,
      position: position,
      isTile: true,
      locked: false,
    });

    // If move is valid, check activated catalysts.
    // TODO
  }

  /**
   * Checks if a move is valid.
   *
   * @param index New tile index.
   * @param position New tile position.
   * @return True if move is valid.
   */
  checkMove(tile: Tile): boolean {
    // FIXME: not always works for some reason

    // Get adjacent tiles.
    let tiles = this.getAdjacentTiles(tile.position);
    let rightTile = tiles.right;
    let leftTile = tiles.left;
    let bottomTile = tiles.bottom;
    let topTile = tiles.top;

    let tileData = this.tilesMicropulData[tile.tileIndex!];

    // Rotate tile.
    const rotate90 = (grid: number[]): number[] => {
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
    const checkSide = (
      sTile: Tile | undefined,
      a1: number,
      a2: number,
      b1: number,
      b2: number
    ) => {
      if (!sTile) return;

      let tData = this.tilesMicropulData[sTile.tileIndex!];
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

  /**
   * Confirms a move.
   */
  confirmMove() {
    if (!this.hasMove) return;

    let tileIndex = this.tiles.findIndex(
      (tile) => tile.isTile == true && tile.locked == false
    );
    this.tiles[tileIndex].locked = true;

    // Send move to server.
    let move: MoveMessage = {
      type: MoveType.Tile,
      tile: this.tiles[tileIndex],
      stone: undefined,
    };
    this.gameService.socket.emit('sendMove', move);

    // TODO: wait for server response?
    this.placeNewTile(this.tiles[tileIndex]);

    this.hasMove = false;
  }

  placeNewTile(tile: Tile, updateCCA: boolean = true) {
    let coords: Coords[] = this.tiles.map((tile) => tile.position);
    let position = tile.position;

    // Remove placeholder in the new tile position.
    let placeHolderIndex = this.tiles.findIndex(
      (tile) => tile.position.x == position.x && tile.position.y == position.y
    );
    this.tiles.splice(placeHolderIndex, 1);
    if (!this.tiles.some((t) => t.tileIndex == tile.tileIndex)) {
      this.tiles.push(tile);
    }

    // Add placeholders around new tile if there is empty space there.
    this.addPlaceholder(coords, { x: position.x - 1, y: position.y });
    this.addPlaceholder(coords, { x: position.x + 1, y: position.y });
    this.addPlaceholder(coords, { x: position.x, y: position.y - 1 });
    this.addPlaceholder(coords, { x: position.x, y: position.y + 1 });

    // Sort tiles for rendering (placeholders before tiles).
    this.tiles.sort(this.sortTiles);

    // Stones CCA.
    if (updateCCA) this.updateStonesCCA();
  }

  updateStonesCCA() {
    this.stonesCCA = [];
    this.stones.forEach((stone) => {
      let component: StoneCoords[] = [];
      this.stoneCCA({ coords: stone.coords, qrtr: stone.qrtr }, component);
      this.stonesCCA.push(component);
    });
    this.enemyStonesCCA = [];
    this.enemyStones.forEach((stone) => {
      let component: StoneCoords[] = [];
      this.stoneCCA({ coords: stone.coords, qrtr: stone.qrtr }, component);
      this.enemyStonesCCA.push(component);
    });
  }

  /**
   * Cancels a move.
   */
  cancelMove() {
    if (!this.hasMove) return;

    let tileIndex = this.tiles.findIndex(
      (tile) => tile.isTile == true && tile.locked == false
    );
    let tile = this.tiles.splice(tileIndex, 1)[0];

    if (tile.tileIndex) {
      let hand = this.sharedService.getHand();
      hand.push(tile.tileIndex);
      this.sharedService.setHand(hand);
      this.sharedService.setSelectedTile({ tileIndex: null, rotation: 0 });

      this.hasMove = false;
    }

    // Sort tiles for rendering (placeholders before tiles).
    this.tiles.sort(this.sortTiles);
  }

  clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  @HostListener('window:wheel', ['$event'])
  onScroll(event: WheelEvent) {
    if (!this.isHovered || this.isDragging) return;

    const delta = event.deltaY;
    const sign = delta / Math.abs(delta);
    if (Math.abs(delta) > this.SCROLL_THRESH) {
      const scaleChange = Math.pow(
        this.SCALE_STEP,
        -sign * 0.05 * Math.abs(delta)
      );
      let newScale = this.scale * scaleChange;
      newScale = this.clamp(newScale, this.MIN_SCALE, this.MAX_SCALE);

      // let newPosition = {
      //   x: this.translateX * newScale,
      //   y: this.translateY * newScale,
      // };
      // let t1 = {
      //   x: newPosition.x - this.translateX,
      //   y: newPosition.y - this.translateY,
      // };

      this.scale = newScale;
    }
  }

  addStone(coords: StoneCoords) {
    if (!this.sharedService.getTurn()) return;

    this.sharedService.setStones(this.sharedService.getStones() - 1);
    this.sharedService.setStoneSelected(false);

    this.placeNewStone(coords);

    let move: MoveMessage = {
      type: MoveType.Stone,
      stone: coords,
      tile: undefined,
    };
    this.gameService.socket.emit('sendMove', move);
  }

  placeNewStone(coords: StoneCoords) {
    if (this.sharedService.getTurn()) this.stones.push(coords);
    else this.enemyStones.push(coords);
    this.updateStonesCCA();
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.isHovered = true;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isHovered = false;
  }

  @HostListener('window:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    // Mouse button 1 = scroll wheel; 2 = right click.
    if (event.button === 0 || !this.isHovered) return;

    if (event.button === 1) {
      // Panning.
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;

      this.isDragging = true;
      document.body.style.cursor = 'grabbing';
    } else {
      if (!this.sharedService.getTurn()) return;

      if (this.sharedService.getSelectedTile().tileIndex != null) {
        // Cell placement.
        let coords = this.mousePosToCoords({
          x: event.clientX,
          y: event.clientY,
        });
        this.addTile(
          this.sharedService.getSelectedTile().tileIndex,
          this.sharedService.getSelectedTile().rotation,
          coords.coords
        );
      } else if (this.sharedService.getStoneSelected()) {
        // Stone placement.
        let coords = this.mousePosToCoords({
          x: event.clientX,
          y: event.clientY,
        });
        this.addStone(coords);
      }
    }
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    event.preventDefault();

    if (event.button === 1) {
      if (!this.isHovered) return;

      this.isDragging = false;
      document.body.style.cursor = 'default';
    } else if (event.button === 0) {
      if (!this.sharedService.getSelectedTile().tileIndex) return;

      let coords = this.mousePosToCoords({
        x: event.clientX,
        y: event.clientY,
      });
      this.addTile(
        this.sharedService.getSelectedTile().tileIndex,
        this.sharedService.getSelectedTile().rotation,
        coords.coords
      );
    }
  }

  mousePosToCoords(position: Coords): StoneCoords {
    let x = (position.x - this.translateX - 25) / this.scale / 50;
    let y = (position.y / this.scale - this.translateY - 25) / 50;
    // let coords = {
    //   x: Math.round(x),
    //   y: Math.round(y),
    // };
    let coords = {
      x: Math.round(x),
      y: Math.round(y),
    };

    let remX = x - coords.x;
    let remY = y - coords.y;

    /*
    | 0 = top left
     | 1 = bottom left
     | 2 = top right
     | 3 = bottom right
     |
     | 0 1
     | 2 3
     */
    let qrtr = 0;

    if (remX < 0) {
      if (remY < 0) qrtr = 0;
      else qrtr = 2;
    } else {
      if (remY < 0) qrtr = 1;
      else qrtr = 3;
    }

    // console.table({
    //   mousePos: { x: position.x, y: position.y },
    //   gridTranslate: { x: this.translateX + 25, y: this.translateY + 25 },
    //   coords: {
    //     x: x,
    //     y: y,
    //   },
    //   coordsRounded: coords,
    //   rem: {
    //     x: remX,
    //     y: remY,
    //   },
    //   qrtr: qrtr,
    //   scale: this.scale,
    // });

    return { coords: coords, qrtr: qrtr };
  }

  getOffset(qrtr: number): Coords {
    switch (qrtr) {
      case 0:
        return { x: 1, y: 1 };
      case 1:
        return { x: 26, y: 1 };
      case 2:
        return { x: 1, y: 26 };
      case 3:
        return { x: 26, y: 26 };
      default:
        // Error
        return { x: 0, y: 0 };
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    this.translateX += deltaX / this.scale;
    this.translateY += deltaY / this.scale;
  }

  onTileClick(event: MouseEvent, tile: Tile) {
    event.preventDefault();

    if (tile.locked) return;

    tile.rotation = (tile.rotation + 90) % 360;
    this.isMoveValid = this.checkMove(tile);
  }

  getAdjacentTiles(position: Coords) {
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

  stoneCCA(coords: StoneCoords, component: StoneCoords[]): boolean {
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
    let aTiles = this.getAdjacentTiles(coords.coords);
    let rightTile = aTiles.right;
    let leftTile = aTiles.left;
    let bottomTile = aTiles.bottom;
    let topTile = aTiles.top;

    // console.log(this.tiles);
    let tile = this.tiles.find(
      (tile) =>
        tile.position.x == position.x &&
        tile.position.y == position.y &&
        tile.tileIndex
    )!;
    let tileData = this.tilesMicropulData[tile.tileIndex!];

    // Rotate tile.
    const rotate90 = (grid: number[]): number[] => {
      const rotatedGrid = [];
      rotatedGrid[0] = grid[2];
      rotatedGrid[1] = grid[0];
      rotatedGrid[2] = grid[3];
      rotatedGrid[3] = grid[1];
      return rotatedGrid;
    };

    for (let i = 0; i < tile.rotation / 90; i++) tileData = rotate90(tileData);

    let isOpen = false;

    const checkAdjacentMicropul = (
      tile: Tile | undefined,
      qrtr: number,
      micropul: number
    ) => {
      if (tile) {
        let data = this.tilesMicropulData[tile.tileIndex!];
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

    const checkAdjacent = (
      tileA: Tile | undefined,
      tileB: Tile | undefined,
      aQrtr: number,
      bQrtr: number
    ) => {
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
}
