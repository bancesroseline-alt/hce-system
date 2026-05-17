import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  private api = 'http://localhost:8080/api/pacientes';

  constructor(private http: HttpClient) {}

  listar(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.api);
  }

  registrar(paciente: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.api, paciente);
  }

  obtener(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.api}/${id}`);
  }

  editar(id: number, paciente: Paciente): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.api}/${id}`, paciente);
  }

  baja(id: number): Observable<Paciente> {
    return this.http.patch<Paciente>(`${this.api}/${id}/baja`, {});
  }

  actualizar(id: number, paciente: Paciente) {
  return this.http.put<Paciente>(`${this.api}/${id}`, paciente);
}

buscar(criterio: string) {
  return this.http.get<Paciente[]>(
    `${this.api}/buscar?criterio=${criterio}`
  );
}

}