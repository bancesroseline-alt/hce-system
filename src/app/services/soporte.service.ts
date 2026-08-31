import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SoporteService {
  private api = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  reportarError(data: any): Observable<any> { return this.http.post(`${this.api}/errores`, data); }
  enviarFeedback(data: any): Observable<any> { return this.http.post(`${this.api}/feedback`, data); }
  metricas(): Observable<any> { return this.http.get(`${this.api}/metricas`); }
  logs(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/logs`); }
  errores(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/errores`); }
  feedback(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/feedback`); }
}
