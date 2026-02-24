import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css',
})

export class Register implements OnInit {

  constructor(private formbuilder: FormBuilder, private auth: AuthService, private router: Router) {}

  registerForm: any;
  error: string = '';

  ngOnInit() {
    this.registerForm = this.formbuilder.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    },
  {
    validators: passwordMatchValidator
  });
  }

  registerSubmit(){
    if (this.registerForm.invalid){
      this.registerForm.markAllAsTouched();
      return;
    }

    const {name, username, email, password} = this.registerForm.value;
    this.error = '';

    const user = {
      "name": name,
      "username": username,
      "email": email,
      "password": password
    };

    this.auth.register(user).subscribe({
      next: () => this.auth.login(username!, password!).subscribe({
        next: () => this.router.navigate(['/calendar']),
        error: () => (this.error = 'User registered but login failed')
      }),
      error: (err) => (this.error = err?.error.error ?? 'Registration failed')
    });
  }

  returnToLogin(){
    this.router.navigate(['/login']);
  }
}
