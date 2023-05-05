import { Component } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'stones',
  templateUrl: './stones.component.html',
  styleUrls: ['./stones.component.less'],
})
export class StonesComponent {
  constructor(private sharedService: SharedService) {}

  getStones(): number {
    return this.sharedService.getStones();
  }

  click() {
    if (this.getStones() <= 0) return;

    this.sharedService.setSelectedTile({ tileIndex: null, rotation: 0 });
    this.sharedService.setStoneSelected(!this.sharedService.getStoneSelected());
  }
}
