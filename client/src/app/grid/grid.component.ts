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

  tiles: string[][] = [
    [' ', ' ', '3'],
    ['2', '1', '0'],
    [' ', '13', ' '],
  ];
  hand: string[] = ['31', '32', '33'];

  constructor() {}

  ngOnInit(): void {
    let newTiles = [];
    for (let i = 0; i < this.tiles.length; i++) {
      let row = [];
      for (let j = 0; j < this.tiles[i].length; j++) {
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
  }

  drop(event: CdkDragDrop<any>, row: number, col: number) {
    // previous container = dragged tile.
    // current container = tile in dropped position.

    if (event.container.data != ' ') return;

    this.tiles[row][col] = event.previousContainer.data;
    this.hand.splice(this.hand.indexOf(event.previousContainer.data), 1);
  }
}
