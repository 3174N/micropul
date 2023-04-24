import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tile-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.less'],
})
export class GridComponent implements OnInit {
  indexOver: number = -1;
  previewStyle: any = null;

  tiles: string[][] = new Array(48 * 2 - 1).fill(
    new Array(48 * 2 - 1).fill(' ')
  );

  constructor() {}

  ngOnInit(): void {
    this.tiles[48][48] = '1';

    this.updateGrid();
  }

  updateGrid() {
    let newTiles = [];
    for (let i = 0; i < 48 * 2 - 1; i++) {
      let row = [];
      for (let j = 0; j < 48 * 2 - 1; j++) {
        row.push(
          this.tiles[i][j] != ' '
            ? this.tiles[i][j]
            : (i < this.tiles.length - 1
                ? this.tiles[i + 1][j] != ' '
                : false) ||
              (j < this.tiles[i].length - 1
                ? this.tiles[i][j + 1] != ' '
                : false) ||
              (j > 0 ? this.tiles[i][j - 1] != ' ' : false) ||
              (i > 0 ? this.tiles[i - 1][j] != ' ' : false)
            ? ' '
            : '-1'
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

    if (event.container.data != ' ') return;

    this.tiles[row][col] = event.previousContainer.data;
    this.updateGrid();
  }
}
