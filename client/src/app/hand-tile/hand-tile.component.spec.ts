import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandTileComponent } from './hand-tile.component';

describe('HandTileComponent', () => {
  let component: HandTileComponent;
  let fixture: ComponentFixture<HandTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandTileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
