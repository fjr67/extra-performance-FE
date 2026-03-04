import { Component } from '@angular/core';
import { WebService } from '../../services/web-service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { title } from 'process';

type ExerciseResponse = {
  exercises: any[],
  page: number,
  pageSize: number,
  totalExercises: number
};

@Component({
  selector: 'app-edit-workout-log',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-workout-log.html',
  styleUrl: './edit-workout-log.css',
})
export class EditWorkoutLog {

  workout_log: any;

  exercise_list: any = [];

  selected_exercises: any[] = [];

  page: number = 1;

  lastPage: number = 0;

  primaryMuscleFilter: string = 'ALL';

  searchTerm: string = '';

  searchTimer: any = null;

  primaryMuscles: string[] = [];

  submitted = false;

  workoutForm: FormGroup;

  constructor(protected webService: WebService, private router: Router, private route: ActivatedRoute, private formBuilder: FormBuilder) {
    this.workoutForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      notes: ['', [Validators.maxLength(2000)]],
      exercises: this.formBuilder.array([])
    });
  }

  get exercisesFormArray(): FormArray {
    return this.workoutForm.get('exercises') as FormArray;
  }

  setsFormArray(exerciseIndex: number): FormArray {
    return this.exercisesFormArray.at(exerciseIndex).get('sets') as FormArray
  }

  createCommittedSetFormGroup(reps: number | null = null, weight: number | null = null): FormGroup {
    return this.formBuilder.group({
      reps: [reps, [Validators.required, Validators.min(1), Validators.max(999)]],
      weight: [weight, [Validators.required, Validators.min(0), Validators.max(999)]]
    });
  }

  createExerciseFormGroup(exerciseId: string, name: string, sets: any[] = []): FormGroup {
    const setsArray = this.formBuilder.array((sets ?? []).map((set: any) => this.createCommittedSetFormGroup(set.reps ?? null, set.weight ?? null)));

    return this.formBuilder.group({
      exerciseId: [exerciseId, Validators.required],
      name: [name],
      sets: setsArray,
      newReps: [null, [Validators.min(1), Validators.max(999)]],
      newWeight: [null, [Validators.min(0), Validators.max(999)]]
    });
  }

  previousPage() {
    if (this.page > 1){
      this.page = this.page - 1;
      this.loadPage();
    }
  }

  nextPage() {
    if (this.page < this.lastPage){
      this.page = this.page + 1;
      this.loadPage();
    }
  }

  loadPage(){
    this.webService.getExercises(this.page, this.primaryMuscleFilter, this.searchTerm, this.selected_exercises).subscribe((response: ExerciseResponse) => {
      this.exercise_list = response?.exercises;
      const exerciseCount = response?.totalExercises;
      this.lastPage = Math.ceil(exerciseCount / this.webService.pageSize);
    })
  }

  onSearchInput(search: string){
    this.searchTerm = search;

    this.page = 1;

    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadPage(), 300);
  }

  clearSearch(){
    this.searchTerm = '';

    this.page = 1;

    this.loadPage();
  }

  onPrimaryMuscleChange(muscle: string){
    this.primaryMuscleFilter = muscle;

    this.page = 1;

    this.loadPage();
  }

  returnToCalendar(){
    this.router.navigate(['/calendar']);
  }

  addExercise(exercise: any){
    const exerciseId = exercise?._id;
    const name = exercise?.name;

    if (!exerciseId || this.selected_exercises.includes(exerciseId)){
      return;
    }

    this.selected_exercises.push(exerciseId);

    this.exercisesFormArray.push(this.createExerciseFormGroup(exerciseId, name, []));

    this.loadPage();
  }

  removeExercise(exerciseId: any){
    if (!this.selected_exercises.includes(exerciseId)){
      return;
    }

    if (this.workout_log?.exercises?.length) {
      this.workout_log.exercises = this.workout_log.exercises.filter(
        (exercise: any) => exercise.exerciseId !== exerciseId
      );
    }

    this.selected_exercises = this.selected_exercises.filter((id: any) => id !== exerciseId);

    const index = this.exercisesFormArray.controls.findIndex(ctrl => ctrl.get('exerciseId')?.value === exerciseId);
    if (index >= 0) this.exercisesFormArray.removeAt(index);

    this.loadPage();
  }

  addSet(exerciseIndex: number) {
    const exerciseFormGroup = this.exercisesFormArray.at(exerciseIndex) as FormGroup;

    const repsCtrl = exerciseFormGroup.get('newReps');
    const weightCtrl = exerciseFormGroup.get('newWeight');

    repsCtrl?.markAsTouched();
    weightCtrl?.markAsTouched();

    const reps = repsCtrl?.value;
    const weight = weightCtrl?.value;

    if (reps == null || weight == null) {
      if (reps == null) {
        repsCtrl?.setErrors({ requiredForAdd: true });
      }
      if (weight == null) {
        weightCtrl?.setErrors({ requiredForAdd: true });
      }
      return;
    }

    if (reps < 1 || weight > 999) {
      repsCtrl?.setErrors({ outOfRange: true })
      return;
    }

    if (weight < 0 || weight > 999) {
      weightCtrl?.setErrors({ outOfRange: true })
      return;
    }

    this.setsFormArray(exerciseIndex).push(
      this.createCommittedSetFormGroup(Number(reps), Number(weight))
    );

    repsCtrl?.reset(null);
    weightCtrl?.reset(null);
  }

  removeSet(exerciseIndex: number, setIndex: number) {
    this.setsFormArray(exerciseIndex).removeAt(setIndex);
  }

  getExerciseName(exerciseId: any): string {
    return this.workout_log?.exercises?.find((exercise: any) => exercise.exerciseId === exerciseId)?.name ?? '';
  }

  checkOptional(value: any): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  buildPayload() {
    const raw = this.workoutForm.getRawValue();

    const payload: any = {
      title: raw.title?.trim(),
      notes: this.checkOptional(raw.notes)
    };

    const exercises = (raw.exercises ?? []).map((exercise: any) => ({
        exerciseId: exercise.exerciseId,
        sets: (exercise.sets ?? []).map((set: any) => ({
          reps: Number(set.reps),
          weight: Number(set.weight)
        })),
      }));

      if (exercises.length) {
        payload.exercises = exercises;
      }

    return payload;
  }

  onSubmitWorkout() {
    this.submitted = true;

    if (this.workoutForm.invalid) {
      this.workoutForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();

    const workoutId = this.route.snapshot.paramMap.get('id');

    this.webService.editWorkoutLog(workoutId, payload).subscribe({
      next: () => this.router.navigate(['/calendar']),
      error: (err) => console.error(err)
    });
  }

  deleteWorkout(){
    const workoutId = this.route.snapshot.paramMap.get('id');

    this.webService.deleteWorkoutLog(workoutId).subscribe({
      next: () => this.router.navigate(['/calendar']),
      error: (err) => console.error(err)
    });
  }

  ngOnInit(){

    const workoutId = this.route.snapshot.paramMap.get('id');

    this.webService.getWorkoutLog(workoutId).subscribe((response: any) => {
      this.workout_log = response;

      this.workoutForm.patchValue({
        title: this.workout_log?.title ?? '',
        notes: this.workout_log?.notes ?? ''
      });

      this.exercisesFormArray.clear();
      this.selected_exercises = [];

      const existingExercises = this.workout_log?.exercises ?? [];
      for (const exercise of existingExercises) {
        this.selected_exercises.push(exercise.exerciseId);
        this.exercisesFormArray.push(this.createExerciseFormGroup(exercise.exerciseId, exercise.name, exercise.sets ?? []));
      }

      this.loadPage();
    });

    this.webService.getPrimaryMuscles().subscribe((response: string[]) => {
      this.primaryMuscles = response;
    })
  }
}
