import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxPanZoomModule } from 'ngx-panzoom';

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
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
