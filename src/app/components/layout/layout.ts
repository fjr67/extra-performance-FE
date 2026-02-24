import { Component } from '@angular/core';
import { Navigation } from "../navigation/navigation";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-layout',
  imports: [Navigation, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {

}
