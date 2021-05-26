import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeContainerComponent } from './three-container.component';

describe('ThreeContainerComponent', () => {
  let component: ThreeContainerComponent;
  let fixture: ComponentFixture<ThreeContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThreeContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreeContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
