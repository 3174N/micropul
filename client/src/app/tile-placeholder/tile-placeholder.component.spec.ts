import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TilePlaceholderComponent } from './tile-placeholder.component';

describe('TilePlaceholderComponent', () => {
  let component: TilePlaceholderComponent;
  let fixture: ComponentFixture<TilePlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TilePlaceholderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TilePlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
