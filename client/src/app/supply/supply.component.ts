import { Component } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'supply',
  templateUrl: './supply.component.html',
  styleUrls: ['./supply.component.less'],
})
export class SupplyComponent {
  getSupply(): string[] {
    return this.sharedService.getSupply();
  }

  constructor(private sharedService: SharedService) {}

  click() {
    let supply = this.sharedService.getSupply();

    if (supply.length <= 0) return;

    // Remove tile from supply and add it to hand.
    let tile = supply[0];
    supply.splice(0, 1);
    let hand = this.sharedService.getHand();
    hand.push(tile);
    this.sharedService.setHand(hand);
    this.sharedService.setSupply(supply);
  }
}
