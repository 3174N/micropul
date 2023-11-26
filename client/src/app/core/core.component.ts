import { Component } from '@angular/core';
import { GameService } from '../services/game.service';
import { SharedService } from '../shared.service';

enum EffectType {
  Draw = 0,
  Plus,
}

interface Effect {
  type: EffectType;
  count: number;
}

@Component({
  selector: 'core',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.less'],
})
export class CoreComponent {
  size: number = 48;

  constructor(private gameService: GameService) {
    this.gameService.socket.on('setCore', (size: number) => this.setSize(size));
  }

  setSize(size: number) {
    this.size = size;
  }
}
