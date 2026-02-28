import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { WebService } from '../../services/web-service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

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

  // fields for determining width of an event - not returned by API
  column?: number;
  columnSpan?: number;
  columnCount?: number;
}

// format of a day of the week, contains the date and events for that day
type WeekDay = {
  date: Date;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [WebService],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})

export class Calendar implements OnInit, OnDestroy{
  // finds and stores calendarScroll reference from HTML to allow auto scroll to current time
  @ViewChild('calendarScroll') calendarScroll?: ElementRef<HTMLDivElement>;

  /**
   * Constructor for calendar component
   * @param webService WebService for calling API endpoints
   * @param router Angular router for navigation to other pages
   */
  constructor(protected webService: WebService, private router: Router) {}

  // used to store the date of the first day of the week being viewed
  weekStart!: Date;

  // used to store the date of the last day of the week being viewed
  weekEnd!: Date;

  // array to store the days of the week being viewed
  weekDays: WeekDay[] = [];

  // first hour of the calendar view - created to ease addition of functionality to allow the calendar view to start at different hours (e.g show from 6AM onwards)
  startHour = 0;

  // last hour of the calendar view - created to ease addition of functionality to allow the calendar view to end at different hours (e.g show until 10PM)
  endHour = 24;

  // list of 0-23 for hours of the day
  hours: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  // stores current date (updated every minute by timer)
  now = new Date();

  // stores the ID of the timer started when page is opened and every minute after, used to stop timer when minute is up
  nowTimerId: any;

  // stores the height in pixels of an hour in the calendar view
  hourHeight = 80;

  // used to the position of the 'now line' in pixels
  nowPosition = 0;

  // stores the selected event to show extra info
  selectedEvent: CalendarEvent | null = null;

  selectedAnchor: HTMLElement | null = null;

  detailsStyle: { top: number; left: number } | null = null;

  // used to show loading screen until events have been retrieved
  loading = false;

  // stores error messages from failed API calls
  error = '';

  ngOnInit() {
    // sets the position of now line to current time
    this.updateNowLine();
    // start timer to track how long has passed since page was loaded
    this.startNowTimer();

    // retrieves events from db in current week
    this.loadWeek(new Date());
  }

  ngOnDestroy() {
    // stops timer when user leaves calendar page
    if (this.nowTimerId) clearInterval(this.nowTimerId);
  }

  private startNowTimer(){
    // calls updateNowLine every 60 seconds, to update position
    this.nowTimerId = setInterval(() => {
      this.updateNowLine();
    }, 60000);
  }

  private updateNowLine(){
    // gets the current time and calculates the difference in minutes between current time and beginning of calendar (00:00)
    this.now = new Date();
    const minutesFromStart = (this.now.getHours() - this.startHour) * 60 + this.now.getMinutes();
    // calculates how far down the 'now line' should be in pixels, with one hour being 100px (set at top of class)
    this.nowPosition = (minutesFromStart / 60) * this.hourHeight;
  }

  loadWeek(date: Date) {
    // clear any previous errors
    this.error = '';

    // used to show loading screen until events are returned
    this.loading = true;

    // sets first and last day of week
    this.weekStart = this.getWeekStart(date);
    this.weekEnd = new Date(this.weekStart);
    this.weekEnd.setDate(this.weekStart.getDate()+7);

    // calls API to retrieve week events with first and last day of week as date range parameters + sets loading to be false so loading screen is hidden and calendar view appears
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

        // gets list of days of the week with each day's events
        this.weekDays = this.buildWeekDays(this.weekStart, events);

        // only auto scrolls to current time if the week displayed contains today's date, otherwise scrolls to top
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

  // allows navigation to previous weeks
  prevWeek() {
    const prevWeek = new Date(this.weekStart);
    prevWeek.setDate(prevWeek.getDate()-7);
    this.loadWeek(prevWeek);
  }

  // allows navigation to future weeks
  nextWeek() {
    const nextWeek = new Date(this.weekStart);
    nextWeek.setDate(nextWeek.getDate()+7);
    this.loadWeek(nextWeek);
  }

  // returns the date of the Monday in the week which is passed to the method
  getWeekStart(date: Date): Date {
    const start = new Date(date);

    // returns number correlating to a day of the week - 0 = Sunday, 1 = Monday etc.
    const day = start.getDay();

    // calculates how many days behind the current date Monday is
    const diff = (day === 0 ? -6 : 1) - day;

    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    return start;
  }

  // builds and returns a list of WeekDays with their events
  buildWeekDays(weekStart: Date, events: CalendarEvent[]): WeekDay[] {
    const days: WeekDay[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);

      // checks each event in the list to see if it is scheduled for the current day of the loop, if yes, sorts events from earliest to latest
      let dayEvents = events.filter((event) => this.isSameLocalDate(event.start, day)).sort((eventA, eventB) => eventA.start.getTime() - eventB.start.getTime());
      dayEvents = this.layoutDayEvents(dayEvents);

      days.push({ date: day, events: dayEvents });
    }

    return days;
  }

  // checks if two dates are on the same day
  isSameLocalDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // return the position of the top of the event in pixels based on its start time
  eventTop(event: CalendarEvent): number {
    return (((event.start.getHours() - this.startHour) * 60) + event.start.getMinutes()) / 60 * this.hourHeight;
  }

  // returns the height of the event in pixels based on its duration
  eventHeight(event: CalendarEvent): number {
    const minutes = (event.end.getTime() - event.start.getTime()) / 60000;
    return Math.max(24, (minutes / 60) * this.hourHeight);
  }

  // calculates the left position of an event for when two or more events events overlap
  eventLeftPercent(event: CalendarEvent): number {
    const columns = event.columnCount ?? 1;
    const column = event.column ?? 0;
    const gapPercent = 1;
    const totalGap = gapPercent * (columns - 1);
    const space = 100 - totalGap;
    const width = space / columns;

    return column * (width + gapPercent);
  }

  // calculates the percentage of the day column an event will take up based on how many events overlap
  eventWidthPercent(event: CalendarEvent): number {
    const columns = event.columnCount ?? 1;
    const gapPercent = 1;
    const totalGap = gapPercent * (columns - 1);
    const space = 100 - totalGap;

    return space / columns;
  }

  // method for auto scrolling to current time of day
  scrollToNow() {
    // retrieves calendarScroll element
    const element = this.calendarScroll?.nativeElement;
    if (!element) return;

    // calculates position of current time
    const target = Math.max(0, this.nowPosition - 2 * this.hourHeight);
    element.scrollTop = target;
  }

  // checks if the week being viewed contains today's date
  weekContainsToday(): boolean {
    const today = new Date();
    return today >= this.weekStart && today < this.weekEnd;
  }

  // naviagtes to createEvent page
  createEventClick(){
    this.router.navigate(['calendar/createEvent'])
  }

  // method to organise layout of overlapping events
  layoutDayEvents(events: CalendarEvent[]): CalendarEvent[] {
    const activeEvents: CalendarEvent[] = [];
    const freeColumns: number[] = [];
    let maxColumns = 0;
    let groupEvents: CalendarEvent[] = [];
    let groupEnd: number | null = null;

    const flushGroup = () => {
      if (groupEvents.length) {
        for (const event of groupEvents){
          event.columnCount = maxColumns || 1;
        }
      }
      groupEvents = [];
      groupEnd = null;
      maxColumns = 0;
    };

    for (const event of events) {
      if (groupEnd !== null && event.start.getTime() >= groupEnd) {
        flushGroup();
        activeEvents.length = 0;
        freeColumns.length = 0;
      }

      for (let i = activeEvents.length - 1; i>=0; i--) {
        if (activeEvents[i].end.getTime() <= event.start.getTime()) {
          freeColumns.push(activeEvents[i].column!);
          activeEvents.splice(i, 1);
        }
      }

      freeColumns.sort((a, b) => a - b);
      const column = freeColumns.length ? freeColumns.shift()! : activeEvents.length;

      event.column = column;
      activeEvents.push(event);

      const eventEnd = event.end.getTime();
      groupEnd = groupEnd === null ? eventEnd : Math.max(groupEnd, eventEnd);
      groupEvents.push(event);

      maxColumns = Math.max(maxColumns, activeEvents.length);
    }

    flushGroup();
    return events;
  }

  checkEventDuration(event: CalendarEvent): number {
    return (event.end.getTime() - event.start.getTime()) / 60000;
  }

  openEventDetails(event: CalendarEvent, domEvent: MouseEvent) {
    // event that has been clicked
    const target = domEvent.currentTarget as HTMLElement;

    // 
    const scroll = this.calendarScroll?.nativeElement;
    if (!scroll) return;

    // gets position of event and calendar container within browser window
    const eventPos = target.getBoundingClientRect();
    const scrollPos = scroll.getBoundingClientRect();

    const top = (eventPos.top - scrollPos.top) + scroll.scrollTop;
    const left = (eventPos.left - scrollPos.left) + scroll.scrollLeft;
    const gap = 12;
    const cardWidth = 260;

    const maxLeft = scroll.clientWidth - cardWidth - 8;
    const clampedLeft = Math.min(Math.max(left + target.offsetWidth + gap, 8), maxLeft);

    this.selectedEvent = event;
    this.detailsStyle = { top, left: clampedLeft };
  }

  deleteEvent() {
    this.webService.deleteEvent(this.selectedEvent?._id).subscribe({
      next: () => {
        this.selectedEvent = null;
        this.detailsStyle = null;

        this.loadWeek(this.weekStart);
      },
      error: (err) => {
        console.error(err);
        this.error = err?.error?.error;
      }
    })
  }
}
