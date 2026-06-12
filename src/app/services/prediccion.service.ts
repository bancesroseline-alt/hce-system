import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrediccionService {

  private api = 'https://hce-backend.onrender.com/api/predicciones';

  constructor(private http: HttpClient) {}

  obtenerAlertas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/alertas`);
  }

  obtenerPorPaciente(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/paciente/${id}`);
  }
}
