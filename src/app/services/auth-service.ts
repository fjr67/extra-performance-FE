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

  login(username: string, password: string) {
    const bauth = btoa(`${username}:${password}`)
    const headers = new HttpHeaders({
      Authorization: `Basic ${bauth}`
    });

    return this.http.get<LoginResponse>(`${this.baseUrl}/login`, { headers }).pipe(
      tap((response: any) => sessionStorage['JWT']=response.token),
      map(() => true)
    )
  }
}
