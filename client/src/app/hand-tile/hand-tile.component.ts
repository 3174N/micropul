import { Component, HostListener, Input } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'hand-tile',
  templateUrl: './hand-tile.component.html',
  styleUrls: ['./hand-tile.component.less'],
})
export class HandTileComponent {
  @Input() tileIndex: string | null = null;
  tilePath = '';

  rotationAngle: number = 0;

  readonly SCROLL_THRESH = 50;
  isHovered = false;

  @Input() isSelected: boolean = false;
  translateX: number = 0;
  translateY: number = 0;

  lastMouseX: number = 0;
  lastMouseY: number = 0;
  isDragging: boolean = false;

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.tilePath = '../../assets/tiles/svg/tile_' + this.tileIndex + '.svg';
  }

  onClick(event: MouseEvent) {
    event.preventDefault();

    if (!this.isHovered) return;

    this.rotationAngle = (this.rotationAngle + 90) % 360;

    if (this.sharedService.getSelectedTile().tileIndex == this.tileIndex)
      this.sharedService.setSelectedTile({
        tileIndex: this.tileIndex,
        rotation: this.rotationAngle,
      });
  }

  onCellClick() {}

  @HostListener('window:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (event.button !== 0 && !this.isHovered) return;

    event.preventDefault();

    this.sharedService.setSelectedTile({
      tileIndex: this.tileIndex,
      rotation: this.rotationAngle,
    });

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    this.isDragging = true;
    document.body.style.cursor = 'grabbing';
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (event.button !== 0 || !this.isHovered) return;

    event.preventDefault();

    this.isDragging = false;
    document.body.style.cursor = 'default';

    this.isSelected = false;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    this.translateX += deltaX;
    this.translateY += deltaY;
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

    if (this.sharedService.getSelectedTile().tileIndex == this.tileIndex)
      this.sharedService.setSelectedTile({
        tileIndex: this.tileIndex,
        rotation: this.rotationAngle,
      });
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.isHovered = true;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isHovered = false;
  }
}
