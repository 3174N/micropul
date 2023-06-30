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
  core: string[] = Array.from({ length: 48 }, (_, i) => i.toString()).filter(
    (i) => i !== '40'
  );

  shuffle() {
    for (let i = this.core.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.core[i], this.core[j]] = [this.core[j], this.core[i]];
    }
  }

  constructor(
    private sharedService: SharedService,
    private gameService: GameService
  ) {
    this.shuffle();

    this.gameService.socket.on('effects', (effects: Effect[]) => {
      if (!sharedService.getTurn()) return;

      effects.forEach((e) => {
        if (e.type == EffectType.Draw) this.draw();
      });
    });
  }

  draw() {
    // Remove tile from core and add it to supply.
    let tile = this.core[0];
    this.core.splice(0, 1);
    let supply = this.sharedService.getSupply();
    supply.push(tile);
    this.sharedService.setSupply(supply);
  }
}
