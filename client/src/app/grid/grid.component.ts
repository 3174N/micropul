import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';

interface Tile {
  state: number; // -1: Empty tile; 0: Placeable tile; 1: Occupied tile.
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

  tiles: Tile[][] = new Array(48 * 2 - 1).fill(
    new Array(48 * 2 - 1).fill({ state: -1, tileIndex: null })
  );

  constructor() {}

  ngOnInit(): void {
    this.tiles[48][48] = { state: 1, tileIndex: '0' };

    this.updateGrid();
  }

  updateGrid() {
    let newTiles = [];
    for (let i = 0; i < 48 * 2 - 1; i++) {
      let row = [];
      for (let j = 0; j < 48 * 2 - 1; j++) {
        row.push(
          this.tiles[i][j].state != -1
            ? this.tiles[i][j]
            : (i < this.tiles.length - 1
                ? this.tiles[i + 1][j].state == 1
                : false) ||
              (j < this.tiles[i].length - 1
                ? this.tiles[i][j + 1].state == 1
                : false) ||
              (j > 0 ? this.tiles[i][j - 1].state == 1 : false) ||
              (i > 0 ? this.tiles[i - 1][j].state == 1 : false)
            ? { state: 0, tileIndex: null }
            : { state: -1, tileIndex: null }
        );
      }
      newTiles.push(row);
    }
    this.tiles = newTiles;
    console.log(this.tiles);
  }

  drop(event: CdkDragDrop<any>, row: number, col: number) {
    // previous container = dragged tile.
    // current container = tile in dropped position.

    if (event.container.data.state != 0) return;

    this.tiles[row][col] = {
      state: 1,
      tileIndex: event.previousContainer.data,
    };
    this.updateGrid();
  }
}
