import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxPanZoomModule } from 'ngx-panzoom';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TileComponent } from './tile/tile.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { GridComponent } from './grid/grid.component';
import { TilePlaceholderComponent } from './tile-placeholder/tile-placeholder.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { HandComponent } from './hand/hand.component';
import { HandTileComponent } from './hand-tile/hand-tile.component';
import { SupplyComponent } from './supply/supply.component';
import { CoreComponent } from './core/core.component';
import { StonesComponent } from './stones/stones.component';
import { GameComponent } from './game/game.component';
import { JoinGameComponent } from './join-game/join-game.component';

const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    TileComponent,
    GridComponent,
    TilePlaceholderComponent,
    HandComponent,
    HandTileComponent,
    SupplyComponent,
    CoreComponent,
    StonesComponent,
    GameComponent,
    JoinGameComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DragDropModule,
    MatIconModule,
    MatGridListModule,
    MatCardModule,
    NgxPanZoomModule,
    SocketIoModule.forRoot(config),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
