import { Injectable } from '@angular/core';

interface SelectedTile {
  tileIndex: string | null;
  rotation: number;
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private selectedTile: SelectedTile = { tileIndex: null, rotation: 0 };
  private hand: string[] = [];

  constructor() {}

  setSelectedTile(tile: SelectedTile) {
    this.selectedTile = tile;
  }
  getSelectedTile(): SelectedTile {
    return this.selectedTile;
  }

  setHand(hand: string[]) {
    this.hand = hand;
    console.log(hand, this.hand);
  }
  getHand(): string[] {
    return this.hand;
  }
}
