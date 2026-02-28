import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { WebService } from '../../services/web-service';

function dateTimeToISO(strDate: string, strHour: string, strMinute: string): string {
  const [year, month, day] = strDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, Number(strHour), Number(strMinute), 0, 0));
  return date.toISOString().replace('Z', '+00:00');
}

function checkEndAfterStart(fields: AbstractControl): ValidationErrors | null {
  const date = fields.get('date')?.value;
  const startH = fields.get('startHour')?.value;
  const startM = fields.get('startMinute')?.value;
  const endH = fields.get('endHour')?.value;
  const endM = fields.get('endMinute')?.value;

  if (!date || startH == null || startM == null || endH == null || endM == null) {
    return null;
  }

  const start = dateTimeToISO(date, startH, startM);
  const end = dateTimeToISO(date, endH, endM);

  const startDate = new Date(start.replace('+00:00', 'Z'));
  const endDate = new Date(end.replace('+00:00', 'Z'));

  return endDate > startDate ? null : { endNotAfterStart: true }
}

function checkEventDuration(fields: AbstractControl): ValidationErrors | null {
  const date = fields.get('date')?.value;
  const startH = fields.get('startHour')?.value;
  const startM = fields.get('startMinute')?.value;
  const endH = fields.get('endHour')?.value;
  const endM = fields.get('endMinute')?.value;

  if (!date || startH == null || startM == null || endH == null || endM == null) {
    return null;
  }

  const start = dateTimeToISO(date, startH, startM);
  const end = dateTimeToISO(date, endH, endM);

  const startDate = new Date(start.replace('+00:00', 'Z'));
  const endDate = new Date(end.replace('+00:00', 'Z'));

  return (((endDate.getTime() - startDate.getTime()) / 60000) >= 15) ? null : { eventTooShort: true }
}

@Component({
  selector: 'app-edit-event',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-event.html',
  styleUrl: './edit-event.css',
})
export class EditEvent {
  eventForm: FormGroup;

  event: any;

  eventTypes: string[] = ['STANDARD', 'WORKOUT'];

  hoursList: string[] = Array.from({ length:24 }, (_, i) => String(i).padStart(2, '0'));

  minutesList: string[] = Array.from({ length: 12 }, (_, i) => String(i*5).padStart(2, '0'));

  submitted: boolean = false;

  constructor(private webService: WebService, protected auth: AuthService, private formBuilder: FormBuilder, private router: Router, private route: ActivatedRoute) {
    this.eventForm = this.formBuilder.group(
      {
        title : ['', [Validators.required, Validators.maxLength(80)]],
        eventType : [this.eventTypes[0], Validators.required],
        description : ['', Validators.maxLength(500)],
        date: ['', Validators.required],
        startHour : [this.hoursList[0], Validators.required],
        startMinute : [this.minutesList[0], Validators.required],
        endHour : [this.hoursList[0], Validators.required],
        endMinute : [this.minutesList[0], Validators.required],
        location : ['', Validators.maxLength(150)],
        workoutLogId : ['']
      },
      {
        validators: [checkEndAfterStart, checkEventDuration]
      }
    );
  }

  ngOnInit() {
    this.webService.getOneEvent(this.route.snapshot.paramMap.get('id')).subscribe((response: any) => {
      this.event = response;

      const eventDate = this.event.start.split('T')[0];

      const startHour = this.event.start.split('T')[1].split(':')[0];
      const startMinute = this.event.start.split('T')[1].split(':')[1];

      const endHour = this.event.end.split('T')[1].split(':')[0];
      const endMinute = this.event.end.split('T')[1].split(':')[1];

      this.eventForm.patchValue({
        title: this.event.title,
        eventType: this.event.eventType,
        description: this.event.description || '',
        date: eventDate,
        startHour: startHour,
        startMinute: startMinute,
        endHour: endHour,
        endMinute: endMinute,
        location: this.event.location || ''
      })
    })
  }

  checkOptional(value: any): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();

    return trimmed.length ? trimmed : null;
  }

  onSubmitEvent(){

    this.submitted = true;

    if (this.eventForm.invalid){
      this.eventForm.markAllAsTouched();
      return;
    }

    const values = this.eventForm.value;
    const start = dateTimeToISO(values.date, values.startHour, values.startMinute);
    const end = dateTimeToISO(values.date, values.endHour, values.endMinute);

    const payload = {
      eventType: values.eventType,
      title: values.title.trim(),
      start,
      end,
      description: this.checkOptional(values.description),
      location: this.checkOptional(values.location),
      workoutLogId: null //TEMPORARY FORCE OF NULL, WILL BE RETRIEVED FROM createWorkout ENDPOINT WHEN MADE AND IF EVENT IS TYPE WORKOUT
    }

    this.webService.editEvent(this.route.snapshot.paramMap.get('id'), payload).subscribe({
      next: () => this.router.navigate(['/calendar']),
      error: (err) => {
        console.error(err);
      }
    });
  }

  cancelClick(){
    this.router.navigate(['/calendar']);
  }

}
