import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';

import { IndexedDbService } from './indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class CitaOfflineService {

  private api = 'https://hce-backend.onrender.com/api';

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  listar(): Observable<any[]> {
    if (navigator.onLine) {
      return this.http.get<any[]>(`${this.api}/citas`);
    }

    return from(this.indexedDb.obtenerTodos('citas'));
  }

  registrar(cita: any): Observable<any> {
    if (navigator.onLine) {
      return this.http.post(`${this.api}/citas`, cita);
    }

    cita.uuidLocal = crypto.randomUUID();
    cita.estadoSync = 'PENDIENTE';
    cita.fechaCreacionLocal = new Date().toISOString();

    return from(
      this.indexedDb.guardar('citas', cita)
        .then(() =>
          this.indexedDb.agregarPendiente('CITA', 'CREAR', cita)
        )
        .then(() => cita)
    );
  }

  actualizarEstado(cita: any, nuevoEstado: string): Observable<any> {
    cita.estado = nuevoEstado;

    if (navigator.onLine && cita.id) {
      return this.http.put(`${this.api}/citas/${cita.id}/estado`, {
        estado: nuevoEstado
      });
    }

    cita.uuidLocal = cita.uuidLocal || crypto.randomUUID();
    cita.estadoSync = 'PENDIENTE';
    cita.fechaActualizacionLocal = new Date().toISOString();

    return from(
      this.indexedDb.guardar('citas', cita)
        .then(() =>
          this.indexedDb.agregarPendiente('CITA', 'ACTUALIZAR_ESTADO', cita)
        )
        .then(() => cita)
    );
  }

  listarMedicos(): Observable<any[]> {
    if (navigator.onLine) {
      return this.http.get<any[]>(`${this.api}/usuarios`);
    }

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return from(Promise.resolve(usuario?.id ? [usuario] : []));
  }
}