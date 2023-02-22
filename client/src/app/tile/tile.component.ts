import { CdkDragDrop, CdkDragEnd } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.less'],
})
export class TileComponent implements OnInit {
  @Input() tile: string | null = null;

  rotationAngle = 0;
  tilePath = '';

  constructor() {}

  ngOnInit(): void {
    console.log(this.tile);
    this.tilePath = '../../assets/tiles/tile_' + this.tile + '.png';
  }

  onClick(event: MouseEvent) {
    event.preventDefault();
    this.rotationAngle = (this.rotationAngle + 90) % 360;
  }

  dragEnd(event: CdkDragEnd) {
    const { x, y } = event.source.getFreeDragPosition();
    // update the position of the element here, e.g.:
    event.source.element.nativeElement.style.transform = `translate3d(${x}px, ${y}px, 5)`;
  }
}
