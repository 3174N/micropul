import { Component } from '@angular/core';
import {
  PanZoomConfig,
  PanZoomAPI,
  PanZoomModel,
  PanZoomConfigOptions,
} from 'ngx-panzoom';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  title = 'client';
  panZoomConfig: PanZoomConfig = new PanZoomConfig();
}
