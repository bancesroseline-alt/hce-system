import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';

import { IndexedDbService } from './indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class AtencionOfflineService {

  private api = 'https://hce-backend.onrender.com/api';

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  registrar(atencion: any): Observable<any> {
    if (navigator.onLine) {
      return this.http.post(`${this.api}/atenciones`, atencion);
    }

    atencion.uuidLocal = crypto.randomUUID();
    atencion.estadoSync = 'PENDIENTE';
    atencion.origenRegistro = 'INDEXEDDB';
    atencion.fechaCreacionLocal = new Date().toISOString();

    return from(
      this.indexedDb.guardar('atenciones', atencion)
        .then(() =>
          this.indexedDb.agregarPendiente('ATENCION', 'CREAR', atencion)
        )
        .then(() => atencion)
    );
  }

  listar(): Observable<any[]> {
    if (navigator.onLine) {
      return this.http.get<any[]>(`${this.api}/atenciones`);
    }

    return from(this.indexedDb.obtenerTodos('atenciones'));
  }
}