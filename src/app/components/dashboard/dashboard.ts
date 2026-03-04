import { Component } from '@angular/core';
import { WebService } from '../../services/web-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  events_list: any[] = [];

  today: any;

  constructor(protected webService: WebService) {}

  ngOnInit(){
    this.today = new Date().toISOString();
    this.webService.getEventsForDashboard(this.today).subscribe((response: any) => {
      this.events_list = response;
    })
  }
}
