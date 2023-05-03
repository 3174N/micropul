import { Component } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'supply',
  templateUrl: './supply.component.html',
  styleUrls: ['./supply.component.less'],
})
export class SupplyComponent {
  supply: string[] = ['1', '2', '3'];

  constructor(private sharedService: SharedService) {}

  click() {
    if (this.supply.length <= 0) return;

    // Remove tile from supply and add it to hand.
    let tile = this.supply[0];
    this.supply.splice(0, 1);
    let hand = this.sharedService.getHand();
    hand.push(tile);
    this.sharedService.setHand(hand);
  }

  addTile(tile: string) {
    this.supply.push(tile);
  }
}
