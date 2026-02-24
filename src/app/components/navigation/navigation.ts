import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation',
  imports: [RouterModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation {

  constructor(protected auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout().subscribe((response) => {
      this.router.navigate(['/']);
    })
  }
}
