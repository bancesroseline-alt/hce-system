import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private api = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/citas`);
  }

  registrar(cita: any): Observable<any> {
    return this.http.post(`${this.api}/citas`, cita);
  }

  listarMedicos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/usuarios/medicos`);
  }
}
