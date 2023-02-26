import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tile-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.less'],
})
export class GridComponent implements OnInit {
  tiles = [
    ['', '', ''],
    ['', '', '3'],
    ['2', '1', '0'],
    ['', '13', ''],
    ['', '', ''],
  ];

  constructor() {}

  ngOnInit(): void {
    let newTiles = [];
    for (let i = 0; i < this.tiles.length; i++) {
      let row = [];
      for (let j = 0; j < this.tiles[i].length; j++) {
        row.push(
          this.tiles[i][j] != ''
            ? this.tiles[i][j]
            : (i < this.tiles.length - 1
                ? this.tiles[i + 1][j] != ''
                : false) ||
              (j < this.tiles[i].length - 1
                ? this.tiles[i][j + 1] != ''
                : false) ||
              (j > 0 ? this.tiles[i][j - 1] != '' : false) ||
              (i > 0 ? this.tiles[i - 1][j] != '' : false)
            ? ''
            : '-1'
        );
      }
      newTiles.push(row);
    }
    this.tiles = newTiles;
    console.log(this.tiles);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      console.log(event.previousIndex, event.currentIndex);
      let temp = event.container.data[event.currentIndex];
      event.container.data[event.currentIndex] =
        event.previousContainer.data[event.previousIndex];
      event.previousContainer.data[event.previousIndex] = temp;
    }
  }
}
