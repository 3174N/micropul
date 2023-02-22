import { CdkDragDrop, CdkDragEnd } from '@angular/cdk/drag-drop';
import { Component, HostListener, Input, OnInit } from '@angular/core';

@Component({
  selector: 'tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.less'],
})
export class TileComponent implements OnInit {
  @Input() tile: string | null = null;
  tilePath = '';

  rotationAngle = 0;
  readonly SCROLL_THRESH = 50;
  isHovered = false;

  constructor() {}

  ngOnInit(): void {
    console.log(this.tile);
    this.tilePath = '../../assets/tiles/tile_' + this.tile + '.png';
  }

  onClick(event: MouseEvent) {
    event.preventDefault();
    this.rotationAngle = (this.rotationAngle + 90) % 360;
  }

  @HostListener('window:wheel', ['$event'])
  onScroll(event: WheelEvent) {
    if (!this.isHovered) return;

    const delta = event.deltaY;
    const sign = delta / Math.abs(delta);
    if (Math.abs(delta) > this.SCROLL_THRESH) {
      this.rotationAngle += 90 * sign;
      if (this.rotationAngle < 0)
        this.rotationAngle = 360 - Math.abs(this.rotationAngle);
      if (this.rotationAngle > 360) this.rotationAngle %= 360;
    }
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.isHovered = true;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isHovered = false;
  }

  dragEnd(event: CdkDragEnd) {
    const { x, y } = event.source.getFreeDragPosition();
    // update the position of the element here, e.g.:
    event.source.element.nativeElement.style.transform = `translate3d(${x}px, ${y}px, 5)`;
  }
}
