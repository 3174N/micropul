import { Component } from '@angular/core';
import { SharedService } from '../shared.service';
import { GameService } from '../services/game.service';

enum MoveType {
  Tile = 0,
  Stone,
  Draw,
}

@Component({
  selector: 'supply',
  templateUrl: './supply.component.html',
  styleUrls: ['./supply.component.less'],
})
export class SupplyComponent {
  supplyLen: number = 0;

  // getSupply():  {
  //   return this.supplyLen;
  // }

  constructor(
    private sharedService: SharedService,
    private gameService: GameService
  ) {
    gameService.socket.on('setSupply', (supply: number) => {
      this.supplyLen = supply;
    });
  }

  click() {
    if (!this.sharedService.getTurn()) return;

    let move = {
      type: MoveType.Draw,
      tile: undefined,
      stone: undefined,
    };
    this.gameService.socket.emit('sendMove', move);
  }
}
