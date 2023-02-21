import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.less'],
})
export class TileComponent implements OnInit {
  rotationAngle = 0;
  tilePath = '../../assets/tiles/tile_0.png';

  constructor() {}

  ngOnInit(): void {}

  onClick() {
    this.rotationAngle = (this.rotationAngle + 90) % 360;
  }
}
