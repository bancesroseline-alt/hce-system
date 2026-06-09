import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private api = 'https://hce-backend.onrender.com/api/dashboard';

  constructor(private http: HttpClient) {}

  obtenerDashboardMedico(medicoId: number) {
    return this.http.get<any>(`${this.api}/medico/${medicoId}`);
  }
}
