import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, tap } from 'rxjs';

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  private baseUrl = environment.apiUrl;
  token: any;

  login(username: string, password: string) {
    const bauth = btoa(`${username}:${password}`)
    const headers = new HttpHeaders({
      Authorization: `Basic ${bauth}`
    });

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, null, { headers }).pipe(
      tap((response: any) => sessionStorage.setItem('JWT', response.token)),
      map(() => true)
    )
  }

  getToken(): string | null {
    return sessionStorage.getItem('JWT');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(){
    return this.http.post<any>(`${this.baseUrl}/logout`, null).pipe(
      tap(() => this.clearToken())
    );
  }

  clearToken(){
    sessionStorage.removeItem('JWT');
  }
}
