import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { Calendar } from "./components/calendar/calendar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Calendar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private baseUrl = environment.apiUrl;
  protected readonly title = signal('actions works');
}
