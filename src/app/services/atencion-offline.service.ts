import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs';

import { IndexedDbService } from './indexed-db.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AtencionOfflineService {

  private api = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  registrar(atencion: any): Observable<any> {
    atencion.uuidLocal = atencion.uuidLocal || crypto.randomUUID();
    atencion.estadoSync = 'PENDIENTE';
    atencion.origenRegistro = 'INDEXEDDB';
    atencion.fechaCreacionLocal = new Date().toISOString();

    return new Observable(observer => {
      this.http.post<any>(`${this.api}/atenciones`, atencion).pipe(timeout(4000)).subscribe({
        next: async (data: any) => {
          data.uuidLocal = data.uuidLocal || String(data.id);
          data.estadoSync = 'SINCRONIZADO';

          await this.indexedDb.guardar('atenciones', data);

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Guardando atención offline...', err);

          await this.indexedDb.guardar('atenciones', atencion);
          await this.indexedDb.agregarPendiente('ATENCION', 'CREAR', atencion);

          observer.next(atencion);
          observer.complete();
        }
      });
    });
  }

  listar(): Observable<any[]> {
    return new Observable(observer => {
      this.http.get<any[]>(`${this.api}/atenciones`).pipe(timeout(4000)).subscribe({
        next: async (data) => {
          for (const atencion of data as any[]) {
            atencion.uuidLocal = atencion.uuidLocal || String(atencion.id);
            atencion.estadoSync = 'SINCRONIZADO';

            await this.indexedDb.guardar('atenciones', atencion);
          }

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Cargando atenciones offline...', err);

          const atenciones = await this.indexedDb.obtenerTodos('atenciones');

          observer.next(atenciones);
          observer.complete();
        }
      });
    });
  }

  listarPorPaciente(pacienteId: number): Observable<any[]> {
    return new Observable(observer => {
      this.http.get<any[]>(`${this.api}/historias-clinicas/paciente/${pacienteId}`).pipe(timeout(4000)).subscribe({
        next: async (data: any) => {
          const atenciones = data?.atenciones || [];

          for (const atencion of atenciones) {
            atencion.uuidLocal = atencion.uuidLocal || String(atencion.id);
            atencion.pacienteId = atencion.pacienteId || pacienteId;
            atencion.estadoSync = 'SINCRONIZADO';

            await this.indexedDb.guardar('atenciones', atencion);
          }

          observer.next(atenciones);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Cargando historia offline...', err);

          const atenciones = await this.indexedDb.obtenerTodos('atenciones');

          const filtradas = atenciones.filter((a: any) =>
            Number(a.pacienteId) === Number(pacienteId) ||
            Number(a.paciente?.id) === Number(pacienteId)
          );

          observer.next(filtradas);
          observer.complete();
        }
      });
    });
  }
}
