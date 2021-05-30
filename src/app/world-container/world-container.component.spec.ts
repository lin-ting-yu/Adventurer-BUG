import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorldContainerComponent } from './world-container.component';

describe('WorldContainerComponent', () => {
  let component: WorldContainerComponent;
  let fixture: ComponentFixture<WorldContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorldContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorldContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
