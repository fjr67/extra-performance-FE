import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebService {
  constructor(private http: HttpClient) {}

  private baseUrl = environment.apiUrl;

  getAllEvents(){
    return this.http.get<any>(`${this.baseUrl}/events`);
  }
}
