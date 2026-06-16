import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private api = `${environment.apiBaseUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  obtenerDashboardMedico(medicoId: number) {
    return this.http.get<any>(`${this.api}/medico/${medicoId}`);
  }
}
