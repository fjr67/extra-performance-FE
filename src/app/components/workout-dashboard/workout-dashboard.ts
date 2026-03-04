import { Component } from '@angular/core';
import { WebService } from '../../services/web-service';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-workout-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './workout-dashboard.html',
  styleUrl: './workout-dashboard.css',
})
export class WorkoutDashboard {

  workouts_list: any[] = [];

  constructor(protected webService: WebService) {}

  getExercisesPreview(workout: any): string {
    const exercises = workout?.exercises ?? [];
    const exerciseNames = exercises.slice(0, 3).map((exercise: any) => exercise?.name).filter(Boolean);
    const ending = exercises.length > 3 ? '...' : '';
    return exerciseNames.length ? `${exerciseNames.join(', ')}${ending}` : 'No exercises added';
  }

  ngOnInit(){
    this.webService.getUserWorkoutLogs().subscribe((response: any) => {
      this.workouts_list = response;
    })
  }

}
