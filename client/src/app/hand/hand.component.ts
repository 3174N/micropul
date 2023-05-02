import { Component, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';

interface Tile {
  index: string;
  rot: number;
}

@Component({
  selector: 'tile-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.less'],
})
export class HandComponent implements OnInit {
  hand: Tile[] = [
    { index: '31', rot: 0 },
    { index: '32', rot: 0 },
    { index: '33', rot: 0 },
  ];
  selectedCell: string | null = null;

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {}

  onCellClick(cell: string, rot: number) {
    this.selectedCell = this.sharedService.getSelectedTile().tileIndex;
  }
}
