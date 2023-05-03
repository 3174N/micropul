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
  private supply: string[] = [];

  constructor() {}

  setSelectedTile(tile: SelectedTile) {
    this.selectedTile = tile;
  }
  getSelectedTile(): SelectedTile {
    return this.selectedTile;
  }

  setHand(hand: string[]) {
    this.hand = hand;
  }
  getHand(): string[] {
    return this.hand;
  }

  setSupply(supply: string[]) {
    this.supply = supply;
  }
  getSupply(): string[] {
    return this.supply;
  }
}
