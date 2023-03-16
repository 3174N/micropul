import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TileComponent } from './tile/tile.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { GridComponent } from './grid/grid.component';
import { TileEmptyComponent } from './tile-empty/tile-empty.component';
import { TilePlaceholderComponent } from './tile-placeholder/tile-placeholder.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { HandComponent } from './hand/hand.component';

@NgModule({
  declarations: [
    AppComponent,
    TileComponent,
    GridComponent,
    TileEmptyComponent,
    TilePlaceholderComponent,
    HandComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DragDropModule,
    MatIconModule,
    MatGridListModule,
    MatCardModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
