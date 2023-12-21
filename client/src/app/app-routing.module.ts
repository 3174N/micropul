import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { JoinGameComponent } from './join-game/join-game.component';

const routes: Routes = [
  { path: '', component: JoinGameComponent },
  { path: 'game/:room', component: GameComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
