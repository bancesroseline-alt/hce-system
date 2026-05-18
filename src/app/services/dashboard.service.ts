import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private api = 'https://hce-backend.onrender.com/api';

  constructor(private http: HttpClient) {}

  getTotalPacientes() {
    return this.http.get<number>(`${this.api}/pacientes/total`);
  }

  getTotalCitas() {
    return this.http.get<number>(`${this.api}/citas/total`);
  }

  getCitasHoy() {
    return this.http.get<number>(`${this.api}/citas/hoy`);
  }
}
