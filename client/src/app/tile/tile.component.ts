import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.less'],
})
export class TileComponent implements OnInit {
  rotationAngle = 0;
  tilePath = '../../assets/tiles/tile_15.png';

  constructor() {}

  ngOnInit(): void {}

  onClick(event: MouseEvent) {
    event.preventDefault();
    this.rotationAngle = (this.rotationAngle + 90) % 360;
  }
}
