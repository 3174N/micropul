import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'tile-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.less'],
})
export class HandComponent implements OnInit {
  selectedCell: string | null = null;

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {}

  getSelected(): string | null {
    this.selectedCell = this.sharedService.getSelectedTile().tileIndex;
    return this.selectedCell;
  }

  onCellClick() {
    this.selectedCell =
      this.sharedService.getSelectedTile().tileIndex == this.selectedCell
        ? null
        : this.sharedService.getSelectedTile().tileIndex;
  }

  getHand(): string[] {
    return this.sharedService.getHand();
  }
}
