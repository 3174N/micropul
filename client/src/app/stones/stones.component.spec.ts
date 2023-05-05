import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StonesComponent } from './stones.component';

describe('StonesComponent', () => {
  let component: StonesComponent;
  let fixture: ComponentFixture<StonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StonesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
