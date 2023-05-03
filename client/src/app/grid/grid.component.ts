import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';

interface Coords {
  x: number;
  y: number;
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

  tiles: Tile[] = [];

  readonly SCROLL_THRESH = 50;
  readonly MIN_SCALE = 0.5;
  readonly MAX_SCALE = 10;
  readonly SCALE_STEP = 1.02;
  isHovered = false;

  @Input() scale: number = 1;
  @Input() translateX: number = 0;
  @Input() translateY: number = 0;

  lastMouseX = 0;
  lastMouseY = 0;
  isDragging = false;

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.addTile('40', 0, { x: 0, y: 0 }, true);
  }

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

  sortTiles(a: Tile, b: Tile) {
    if (a.isTile && !b.isTile) {
      return 1; // a comes after b.
    } else if (!a.isTile && b.isTile) {
      return -1; // a comes before b.
    } else {
      return 0; // No change in order.
    }
  }

  addTile(
    index: string | null,
    rotation: number,
    position: Coords,
    isFirstTile: boolean = false
  ) {
    if (!index) return;

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
    )
      return; // Tiles cannot be placed on spaces that are not placeholders.

    // Remove placeholder in the new tile position.
    let placeHolderIndex = this.tiles.findIndex(
      (tile) => tile.position.x == position.x && tile.position.y == position.y
    );
    this.tiles.splice(placeHolderIndex, 1);

    // Add new tile.
    this.tiles.push({
      position: position,
      tileIndex: index,
      isTile: true,
      rotation: rotation,
      locked: true,
    });

    if (!isFirstTile) {
      // Remove tile from hand.
      let hand = this.sharedService.getHand();
      hand.splice(hand.indexOf(index), 1);
      this.sharedService.setHand(hand);
    }

    // Add placeholders around new tile if there is empty space there.
    this.addPlaceholder(coords, { x: position.x - 1, y: position.y });
    this.addPlaceholder(coords, { x: position.x + 1, y: position.y });
    this.addPlaceholder(coords, { x: position.x, y: position.y - 1 });
    this.addPlaceholder(coords, { x: position.x, y: position.y + 1 });

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
      let oldScale = this.scale;
      this.scale *= scaleChange;
      this.scale = this.clamp(this.scale, this.MIN_SCALE, this.MAX_SCALE);

      // TODO: Zoom from the middle of the screen.
    }
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
    // Mouse button 1 = scroll wheel; 2 = right click.
    if (event.button === 0 || !this.isHovered) return;
    event.preventDefault();

    if (event.button === 1) {
      // Panning.
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;

      this.isDragging = true;
      document.body.style.cursor = 'grabbing';
    } else {
      // Cell placement.
      if (!this.sharedService.getSelectedTile()) return;

      console.log(this.sharedService.getSelectedTile());

      let coords = this.mousePosToCoords({
        x: event.clientX,
        y: event.clientY,
      });
      this.addTile(
        this.sharedService.getSelectedTile().tileIndex,
        this.sharedService.getSelectedTile().rotation,
        coords
      );
    }
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (event.button !== 1 || !this.isHovered) return;

    event.preventDefault();

    this.isDragging = false;
    document.body.style.cursor = 'default';
  }

  mousePosToCoords(position: Coords): Coords {
    // console.table({
    //   mousePos: { x: position.x, y: position.y },
    //   gridTranslate: { x: this.translateX + 25, y: this.translateY + 25 },
    //   gridTranslateScaled: {
    //     x: (this.translateX + 25) * this.scale,
    //     y: (this.translateY + 25) * this.scale,
    //   },
    //   coords: {
    //     x: Math.round((position.x - this.translateX - 25) / this.scale / 50),
    //     y: Math.round((position.y / this.scale - this.translateY - 25) / 50),
    //   },
    //   scale: this.scale,
    // });

    let coords = {
      x: Math.round((position.x - this.translateX - 25) / this.scale / 50),
      y: Math.round((position.y / this.scale - this.translateY - 25) / 50),
    };

    return coords;
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
