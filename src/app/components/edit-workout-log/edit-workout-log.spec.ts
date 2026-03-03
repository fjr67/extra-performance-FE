import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWorkoutLog } from './edit-workout-log';

describe('EditWorkoutLog', () => {
  let component: EditWorkoutLog;
  let fixture: ComponentFixture<EditWorkoutLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditWorkoutLog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditWorkoutLog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
