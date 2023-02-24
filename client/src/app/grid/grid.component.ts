import {
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tile-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.less'],
})
export class GridComponent implements OnInit {
  tiles = [
    ['0', '1'],
    ['2', '3'],
  ];

  constructor() {}

  ngOnInit(): void {}

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
