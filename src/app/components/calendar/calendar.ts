import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { WebService } from '../../services/web-service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

// format of calendar event object returned from API
type CalendarEvent = {
  _id: string;
  userId: string;
  eventType: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  workoutLogId?: string;
}

// format of a day of the week, contains the date and events for that day
type WeekDay = {
  date: Date;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  providers: [WebService],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})

export class Calendar implements OnInit, OnDestroy{
  @ViewChild('calendarScroll') calendarScroll?: ElementRef<HTMLDivElement>;

  constructor(protected webService: WebService) {}

  weekStart!: Date;
  weekEnd!: Date;
  weekDays: WeekDay[] = [];
  startHour = 0;
  endHour = 24;
  now = new Date();
  nowMinutes = 0;
  private nowTimerId: any;

  loading = false;
  error = '';

  ngOnInit() {
    this.updateNowLine();
    this.startNowTimer();

    this.loadWeek(new Date());
  }

  ngOnDestroy(): void {
    if (this.nowTimerId) clearInterval(this.nowTimerId);
  }

  private startNowTimer(){
    this.nowTimerId = setInterval(() => {
      this.updateNowLine();
    }, 60_000);
  }

  private updateNowLine(){
    this.now = new Date();
    this.nowMinutes = this.now.getHours() * 60 + this.now.getMinutes();
  }

  loadWeek(date: Date) {
    this.error = '';
    this.loading = true;

    this.weekStart = this.getWeekStart(date);

    this.weekEnd = new Date(this.weekStart);
    this.weekEnd.setDate(this.weekStart.getDate()+7);

    this.webService.getEvents(this.weekStart, this.weekEnd)
    .pipe(finalize(() => (this.loading = false)))
    .subscribe({
      next: (raw: any[]) => {
        const events: CalendarEvent[] = raw.map((e:any) => ({
          _id: e._id,
          userId: e.userId,
          eventType: e.eventType,
          title: e.title,
          description: e.description,
          start: new Date(e.start),
          end: new Date(e.end),
          location: e.location,
          workoutLogId: e.workoutLogId ?? null
        }));

        this.weekDays = this.buildWeekDays(this.weekStart, events);

        if (this.weekContainsToday()){
          setTimeout(() => this.scrollToNow(), 0);
        } else {
          setTimeout(() => this.calendarScroll?.nativeElement.scrollTo({ top: 0 }), 0);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error ?? 'Failed to load events';
        this.loading = false;
      }
    });
  }

  prevWeek(): void {
    const d = new Date(this.weekStart);
    d.setDate(d.getDate()-7);
    this.loadWeek(d);
  }

  nextWeek(): void {
    const d = new Date(this.weekStart);
    d.setDate(d.getDate()+7);
    this.loadWeek(d);
  }

  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;

    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);

    return d;
  }

  buildWeekDays(weekStart: Date, events: CalendarEvent[]): WeekDay[] {
    const days: WeekDay[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);

      const dayEvents = events.filter((ev) => this.isSameLocalDate(ev.start, day)).sort((a, b) => a.start.getTime() - b.start.getTime());

      days.push({ date: day, events: dayEvents });
    }

    return days;
  }

  isSameLocalDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  get hours(): number[] {
    return Array.from({ length: 24 }, (_, i) => i);
  }

  eventTop(ev: CalendarEvent): number {
    return ((ev.start.getHours() - this.startHour) * 60) + ev.start.getMinutes();
  }

  eventHeight(ev: CalendarEvent): number {
    const minutes = (ev.end.getTime() - ev.start.getTime()) / 60000;
    return Math.max(24, minutes);
  }

  scrollToNow(): void {
    const el = this.calendarScroll?.nativeElement;
    if (!el) return;

    const target = Math.max(0, this.nowMinutes - 120);
    el.scrollTop = target;
  }

  weekContainsToday(): boolean {
    const today = new Date();
    return today >= this.weekStart && today < this.weekEnd;
  }
}
