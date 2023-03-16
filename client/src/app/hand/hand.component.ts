import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tile-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.less'],
})
export class HandComponent implements OnInit {
  hand: string[] = ['31', '32', '33'];
  constructor() {}

  ngOnInit(): void {}
}
