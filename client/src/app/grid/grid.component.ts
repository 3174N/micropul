import { Component, HostListener, Input, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';
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

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.addTile('40', 0, { x: 0, y: 0 }, true);
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
   * @param isFirstTile
   */
  addTile(
    index: string | null,
    rotation: number,
    position: Coords,
    isFirstTile: boolean = false
  ) {
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
      locked: isFirstTile, // First tile should be locked, the rest should not.
    });

    if (!isFirstTile) {
      // Remove tile from hand.
      this.hasMove = true;
      this.movePosition = position;

      let hand = this.sharedService.getHand();
      hand.splice(hand.indexOf(index), 1);
      this.sharedService.setHand(hand);
      this.sharedService.setSelectedTile({ tileIndex: null, rotation: 0 });
    } else {
      // Add placeholders around new tile if there is empty space there.
      this.addPlaceholder(coords, { x: position.x - 1, y: position.y });
      this.addPlaceholder(coords, { x: position.x + 1, y: position.y });
      this.addPlaceholder(coords, { x: position.x, y: position.y - 1 });
      this.addPlaceholder(coords, { x: position.x, y: position.y + 1 });
    }

    // Sort tiles for rendering (placeholders before tiles).
    this.tiles.sort(this.sortTiles);

    if (isFirstTile) return;

    ////////////////////////////
    // Check if move is valid //
    ////////////////////////////

    // Get adjacent tiles.
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
        tile.position.y + 1 == position.y &&
        tile.tileIndex
    );
    let topTile = this.tiles.find(
      (tile) =>
        tile.position.x == position.x + 1 &&
        tile.position.y - 1 == position.y &&
        tile.tileIndex
    );

    // Check connectd micropuls.
    let tileData = this.tilesMicropulData[index];
    let moveValid = {
      hasValidConnection: false,
      hasInvalidConnection: false,
    };

    const checkMove = (
      sTile: Tile | undefined,
      a1: number,
      a2: number,
      b1: number,
      b2: number
    ) => {
      if (!sTile) return;

      let tData = this.tilesMicropulData[sTile.tileIndex!];
      let data = tileData;

      let hasValidConnection = data[a1] == tData[a2] || data[b1] == tData[b2];
      let hasInvalidConnection =
        (data[a1] != 0 && tData[a2] != 0 && data[a1] != tData[a2]) ||
        (data[b1] != 0 && tData[b2] != 0 && data[b1] != tData[b2]);

      moveValid.hasValidConnection =
        hasValidConnection || moveValid.hasValidConnection;
      moveValid.hasInvalidConnection =
        hasInvalidConnection || moveValid.hasInvalidConnection;
    };

    checkMove(rightTile, 1, 0, 3, 2);
    checkMove(leftTile, 0, 1, 2, 3);
    checkMove(bottomTile, 2, 0, 3, 1);
    checkMove(topTile, 0, 2, 1, 3);
    console.table(moveValid);

    // If move is valid, check activated catalysts.
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

    let coords: Coords[] = this.tiles.map((tile) => tile.position);
    let position = this.tiles[tileIndex].position;

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

    this.hasMove = false;

    // Sort tiles for rendering (placeholders before tiles).
    this.tiles.sort(this.sortTiles);
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

      let newPosition = {
        x: this.translateX * newScale,
        y: this.translateY * newScale,
      };
      let t1 = {
        x: newPosition.x - this.translateX,
        y: newPosition.y - this.translateY,
      };

      // this.translateX += t1.x;
      // this.translateY += t1.y * newScale;

      this.scale = newScale;
    }
  }

  addStone(coords: StoneCoords) {
    this.stones.push(coords);
    this.sharedService.setStones(this.sharedService.getStones() - 1);
    this.sharedService.setStoneSelected(false);
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
     | 0 2
     | 1 3
     */
    let qrtr = 0;

    if (remX < 0) {
      if (remY < 0) qrtr = 0;
      else qrtr = 1;
    } else {
      if (remY < 0) qrtr = 2;
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
        return { x: 1, y: 26 };
      case 2:
        return { x: 26, y: 1 };
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
}
