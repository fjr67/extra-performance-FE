import { Component, OnInit } from '@angular/core';
import { WebService } from '../../services/web-service';

@Component({
  selector: 'app-calendar',
  imports: [],
  providers: [WebService],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnInit{
  constructor(protected webService: WebService) {}

  temp: any;

  ngOnInit() {
    this.webService.getAllEvents().subscribe((response: any) => {
      this.temp = response;

      console.log(this.temp);
    })
  }
}
