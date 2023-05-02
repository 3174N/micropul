import { CdkDragDrop, CdkDragEnd } from '@angular/cdk/drag-drop';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.less'],
})
export class TileComponent implements OnInit {
  @Input() tileIndex: string | null = null;
  tilePath = '';

  @Input() locked: boolean = false;
  @Input() rotationAngle: number = 0;

  readonly SCROLL_THRESH = 50;
  isHovered = false;

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.tilePath = '../../assets/tiles/tile_' + this.tileIndex + '.png';
  }

  onClick(event: MouseEvent) {
    event.preventDefault();

    if (!this.isHovered || this.locked) return;

    this.rotationAngle = (this.rotationAngle + 90) % 360;

    if (this.sharedService.getSelectedTile().tileIndex == this.tileIndex)
      this.sharedService.setSelectedTile({
        tileIndex: this.tileIndex,
        rotation: this.rotationAngle,
      });
  }

  onCellClick() {
    this.sharedService.setSelectedTile({
      // Set tile index to null if the tile is already selected.
      tileIndex:
        this.sharedService.getSelectedTile().tileIndex == this.tileIndex
          ? null
          : this.tileIndex,
      rotation: this.rotationAngle,
    });
  }

  @HostListener('window:wheel', ['$event'])
  onScroll(event: WheelEvent) {
    if (!this.isHovered || this.locked) return;

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
