import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutDashboard } from './workout-dashboard';

describe('WorkoutDashboard', () => {
  let component: WorkoutDashboard;
  let fixture: ComponentFixture<WorkoutDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkoutDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
