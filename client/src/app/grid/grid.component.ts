import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, HostListener, Input, OnInit } from '@angular/core';

interface Coords {
  x: number;
  y: number;
}

interface Tile {
  position: Coords;
  isTile: boolean; // Non-tile are places near tiles that can be placed on.
  tileIndex: string | null;
}

@Component({
  selector: 'tile-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.less'],
})
export class GridComponent implements OnInit {
  indexOver: number = -1;
  previewStyle: any = null;

  tiles: Tile[] = [{ position: { x: 3, y: 2 }, isTile: true, tileIndex: '0' }];

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

  constructor() {}

  ngOnInit(): void {
    this.tiles.push({ position: { x: 0, y: 0 }, isTile: true, tileIndex: '4' });
    this.tiles.push({ position: { x: 2, y: 1 }, isTile: true, tileIndex: '7' });
    this.tiles.push({
      position: { x: 3, y: 3 },
      isTile: true,
      tileIndex: '14',
    });
    this.tiles.push({
      position: { x: 7, y: 2 },
      isTile: true,
      tileIndex: '28',
    });
    this.tiles.push({ position: { x: 0, y: 1 }, isTile: true, tileIndex: '3' });

    this.updateGrid();
  }

  updateGrid() {
    // let newTiles = [];
    // for (let i = 0; i < 48 * 2 - 1; i++) {
    //   let row = [];
    //   for (let j = 0; j < 48 * 2 - 1; j++) {
    //     row.push(
    //       this.tiles[i][j].state != -1
    //         ? this.tiles[i][j]
    //         : (i < this.tiles.length - 1
    //             ? this.tiles[i + 1][j].state == 1
    //             : false) ||
    //           (j < this.tiles[i].length - 1
    //             ? this.tiles[i][j + 1].state == 1
    //             : false) ||
    //           (j > 0 ? this.tiles[i][j - 1].state == 1 : false) ||
    //           (i > 0 ? this.tiles[i - 1][j].state == 1 : false)
    //         ? { state: 0, tileIndex: null }
    //         : { state: -1, tileIndex: null }
    //     );
    //   }
    //   newTiles.push(row);
    // }
    // this.tiles = newTiles;
    // console.log(this.tiles);
  }

  clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  @HostListener('window:wheel', ['$event'])
  onScroll(event: WheelEvent) {
    if (!this.isHovered || this.isDragging) return;

    event.preventDefault();

    const delta = event.deltaY;
    const sign = delta / Math.abs(delta);
    if (Math.abs(delta) > this.SCROLL_THRESH) {
      const scaleChange = Math.pow(
        this.SCALE_STEP,
        -sign * 0.05 * Math.abs(delta)
      );
      this.scale *= scaleChange;
      this.scale = this.clamp(this.scale, this.MIN_SCALE, this.MAX_SCALE);

      const centerY = window.innerHeight / 2;
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
    // Mouse button 1 = scroll wheel
    if (event.button !== 1 || !this.isHovered) return;

    event.preventDefault();

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    this.isDragging = true;
    document.body.style.cursor = 'grabbing';
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (event.button !== 1 || !this.isHovered) return;

    event.preventDefault();

    this.isDragging = false;
    document.body.style.cursor = 'default';
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
