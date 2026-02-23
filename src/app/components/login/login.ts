import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, Form } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  constructor(private formBuilder: FormBuilder, private auth: AuthService, private router: Router) {}

  loginForm: any;
  error: string = '';

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  loginSubmit(){
    if (this.loginForm.invalid){
      this.loginForm.markAllAsTouched();
      return;
    }

    const {username, password} = this.loginForm.value;
    this.error = '';

    this.auth.login(username!, password!).subscribe({
      next: () => this.router.navigate(['calendar']),
      error: () => (this.error = 'Invalid username or password')
    });
  }

  registerClick(){

  }
}
