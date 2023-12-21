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

  private stoneSelected: boolean = true;
  private stones: number = 3;

  private hand: string[] = [];

  private supply: string[] = [];

  private isCurrentTurn: boolean = false;

  constructor() {}

  setSelectedTile(tile: SelectedTile) {
    this.selectedTile = tile;
  }
  getSelectedTile(): SelectedTile {
    return this.selectedTile;
  }

  setStoneSelected(stoneSelected: boolean) {
    this.stoneSelected = stoneSelected;
  }
  getStoneSelected(): boolean {
    return this.stoneSelected;
  }
  setStones(stones: number) {
    this.stones = stones;
  }
  getStones(): number {
    return this.stones;
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

  setTurn(isTurn: boolean) {
    this.isCurrentTurn = isTurn;
  }
  getTurn(): boolean {
    return this.isCurrentTurn;
  }
}
