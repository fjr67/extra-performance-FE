import { Component } from '@angular/core';
import { WebService } from '../../services/web-service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

type GoalType = 'TOTAL_WORKOUTS' | 'TOTAL_WEIGHT_LIFTED';

type Goal = {
  _id: string;
  userId: string;
  type: GoalType;
  target: number;
};

@Component({
  selector: 'app-goals',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './goals.html',
  styleUrl: './goals.css',
})
export class Goals {
  loading = false;

  error = '';

  workoutsGoal: Goal | null = null;

  weightGoal: Goal | null = null;

  workoutsProgress = 0;

  weightProgress = 0;

  workoutForm: FormGroup;

  weightForm: FormGroup;

  constructor(protected webService: WebService, private formBuilder: FormBuilder) {
    this.workoutForm = this.formBuilder.group({
      target: [null as number | null, [Validators.required, Validators.min(1), Validators.max(10000)]]
    });
    this.weightForm = this.formBuilder.group({
      target: [null as number | null, [Validators.required, Validators.min(1), Validators.max(10000000)]]
    });
  }

  ngOnInit(){
    this.loadGoals();
  }

  loadGoals() {
    this.loading = true;
    this.error = '';

    this.webService.getGoals().subscribe({
      next: (goals: Goal[]) => {
        this.workoutsGoal = null;
        this.weightGoal = null;

        for (const goal of goals || []) {
          if (goal.type === 'TOTAL_WORKOUTS') {
            this.workoutsGoal = goal;
          }
          if (goal.type === 'TOTAL_WEIGHT_LIFTED') {
            this.weightGoal = goal;
          }
        }

        this.loadProgress();

        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error;
        this.loading = false;
      }
    });
  }

  loadProgress() {
    if (this.workoutsGoal) {
      this.webService.getTotalWorkoutsProgress().subscribe({
        next: (response: any) => {
          this.workoutsProgress = Number(response?.current ?? 0);
        },
        error: () => {
          this.workoutsProgress = 0;
        }
      });
    } else {
      this.workoutsProgress = 0;
    }

    if (this.weightGoal) {
      this.webService.getTotalWeightProgress().subscribe({
        next: (response: any) => {
          this.weightProgress = Number(response?.current ?? 0);
        },
        error: () => {
          this.weightProgress = 0;
        }
      });
    } else {
      this.weightProgress = 0;
    }
  }

  createWorkoutsGoal() {
    if (this.workoutForm.invalid) {
      this.workoutForm.markAllAsTouched();
      return;
    }

    const target = Number(this.workoutForm.value.target);

    this.loading = true;
    this.error = '';

    const goal = {
      type: 'TOTAL_WORKOUTS',
      target: target
    };

    this.webService.createGoal(goal).subscribe({
      next: () => {
        this.workoutForm.reset();
        this.loadGoals();
      },
      error: (err) => {
        this.error = err?.error?.error;
        this.loading = false;
      }
    });
  }

  createWeightGoal() {
    if (this.weightForm.invalid) {
      this.weightForm.markAllAsTouched();
      return;
    }

    const target = Number(this.weightForm.value.target);

    this.loading = true;
    this.error = '';

    const goal = {
      type: 'TOTAL_WEIGHT_LIFTED',
      target: target
    };

    this.webService.createGoal(goal).subscribe({
      next: () => {
        this.weightForm.reset();
        this.loadGoals();
      },
      error: (err) => {
        this.error = err?.error?.error;
        this.loading = false;
      }
    });
  }

  workoutsPercent(): number {
    if (!this.workoutsGoal || this.workoutsGoal.target <= 0) return 0;
    return Math.min(100, (this.workoutsProgress / this.workoutsGoal.target) * 100);
  }

  weightPercent(): number {
    if (!this.weightGoal || this.weightGoal.target <= 0) return 0;
    return Math.min(100, (this.weightProgress / this.weightGoal.target) * 100);
  }

}
