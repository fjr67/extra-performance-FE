import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebService {
  constructor(private http: HttpClient) {}

  private baseUrl = environment.apiUrl;

  getEvents(from: Date, to: Date){
    return this.http.get<any[]>(`${this.baseUrl}/userEvents`, {
      params: {
        from: from.toISOString(),
        to: to.toISOString()
      }
    });
  }

  createEvent(event: any) {
    return this.http.post<any>(`${this.baseUrl}/createEvent`, event);
  }

  deleteEvent(id: any) {
    return this.http.delete<any>(`${this.baseUrl}/deleteEvent/${id}`)
  }
}
