import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'tile-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.less'],
})
export class HandComponent implements OnInit {
  selectedCell: string | null = null;

  constructor(private sharedService: SharedService) {
    sharedService.setHand(['1', '2', '3']);
  }

  ngOnInit(): void {}

  onCellClick(cell: string) {
    this.selectedCell =
      this.sharedService.getSelectedTile().tileIndex == this.selectedCell
        ? null
        : this.sharedService.getSelectedTile().tileIndex;
  }

  getHand(): string[] {
    return this.sharedService.getHand();
  }
}
