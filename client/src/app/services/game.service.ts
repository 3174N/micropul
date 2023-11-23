import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor(public socket: Socket) {
  }
}
