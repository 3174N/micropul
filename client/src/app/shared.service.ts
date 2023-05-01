import { Injectable } from '@angular/core';

interface SelectedTile {
  tileIndex: string | null;
  rotation: number;
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  selectedTile: SelectedTile = { tileIndex: null, rotation: 0 };

  constructor() {}

  setSelectedTile(tile: SelectedTile) {
    this.selectedTile = tile;
  }
  getSelectedTile(): SelectedTile {
    return this.selectedTile;
  }
}
