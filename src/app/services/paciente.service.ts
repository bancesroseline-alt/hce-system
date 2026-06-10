import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  private api = 'https://hce-backend.onrender.com/api/pacientes';

  constructor(private http: HttpClient) {}

  // LISTAR
  listar(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.api);
  }

  // OBTENER POR ID
  obtener(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.api}/${id}`);
  }

  // CREAR
  registrar(paciente: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.api, paciente);
  }

  // ACTUALIZAR (EDITAR)
  actualizar(id: number, paciente: Paciente): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.api}/${id}`, paciente);
  }

  // BAJA LÓGICA
  baja(id: number): Observable<Paciente> {
    return this.http.patch<Paciente>(`${this.api}/${id}/baja`, {});
  }

  // BUSCAR
  buscar(criterio: string): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(
      `${this.api}/buscar?criterio=${criterio}`
    );
  }
}
