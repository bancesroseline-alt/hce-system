import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { IndexedDbService } from './indexed-db.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitaOfflineService {

  private api = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  listar(): Observable<any[]> {
  return new Observable(observer => {
    this.http.get<any[]>(`${this.api}/citas`).pipe(timeout(4000)).subscribe({
      next: async (data) => {
        for (const cita of data as any[]) {
          cita.uuidLocal = cita.uuidLocal || String(cita.id);
          cita.estadoSync = 'SINCRONIZADO';

          if (cita.paciente?.id && !cita.pacienteId) {
            cita.pacienteId = cita.paciente.id;
          }

          if (cita.medico?.id && !cita.medicoId) {
            cita.medicoId = cita.medico.id;
          }

          await this.indexedDb.guardar('citas', cita);
        }

        observer.next(data);
        observer.complete();
      },
      error: async (err) => {
        console.warn('Backend no disponible. Cargando citas offline...', err);

        const citas = await this.indexedDb.obtenerTodos('citas');
        observer.next(citas);
        observer.complete();
      }
    });
  });
}

  listarPorPaciente(pacienteId: number): Observable<any[]> {
    return new Observable(observer => {
      this.http.get<any[]>(`${this.api}/citas/paciente/${pacienteId}`).pipe(timeout(4000)).subscribe({
        next: async (data) => {
          for (const cita of data as any[]) {
            cita.uuidLocal = cita.uuidLocal || String(cita.id);
            cita.estadoSync = 'SINCRONIZADO';
            cita.pacienteId = cita.pacienteId || pacienteId;

            if (cita.medico?.id && !cita.medicoId) {
              cita.medicoId = cita.medico.id;
            }

            await this.indexedDb.guardar('citas', cita);
          }

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Cargando citas del paciente offline...', err);

          const citas = await this.indexedDb.obtenerTodos('citas');
          const filtradas = citas.filter((c: any) =>
            Number(c.pacienteId) === Number(pacienteId) ||
            Number(c.paciente?.id) === Number(pacienteId)
          );

          observer.next(filtradas);
          observer.complete();
        }
      });
    });
  }

  registrar(cita: any): Observable<any> {
    cita.uuidLocal = cita.uuidLocal || crypto.randomUUID();
    cita.estadoSync = 'PENDIENTE';
    cita.fechaCreacionLocal = new Date().toISOString();

    return new Observable(observer => {
      this.http.post<any>(`${this.api}/citas`, cita).pipe(timeout(4000)).subscribe({
        next: async (data: any) => {
          data.uuidLocal = data.uuidLocal || String(data.id);
          data.estadoSync = 'SINCRONIZADO';

          await this.indexedDb.guardar('citas', data);

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Guardando cita offline...', err);

          await this.indexedDb.guardar('citas', cita);
          await this.indexedDb.agregarPendiente('CITA', 'CREAR', cita);

          observer.next(cita);
          observer.complete();
        }
      });
    });
  }

  actualizar(cita: any): Observable<any> {
    cita.uuidLocal = cita.uuidLocal || String(cita.id || crypto.randomUUID());
    cita.estadoSync = 'PENDIENTE';
    cita.fechaActualizacionLocal = new Date().toISOString();

    return new Observable(observer => {
      if (cita.id) {
        this.http.put<any>(`${this.api}/citas/${cita.id}`, cita).pipe(timeout(4000)).subscribe({
          next: async (data: any) => {
            const citaActualizada = {
              ...cita,
              ...data,
              uuidLocal: cita.uuidLocal,
              estadoSync: 'SINCRONIZADO'
            };

            await this.indexedDb.guardar('citas', citaActualizada);

            observer.next(citaActualizada);
            observer.complete();
          },
          error: async (err) => {
            console.warn('Backend no disponible. Cita actualizada offline...', err);

            await this.indexedDb.guardar('citas', cita);
            await this.indexedDb.agregarPendiente('CITA', 'ACTUALIZAR', cita);

            observer.next(cita);
            observer.complete();
          }
        });
      } else {
        this.indexedDb.guardar('citas', cita)
          .then(() => this.indexedDb.agregarPendiente('CITA', 'ACTUALIZAR', cita))
          .then(() => {
            observer.next(cita);
            observer.complete();
          })
          .catch(err => observer.error(err));
      }
    });
  }

  actualizarEstado(cita: any, nuevoEstado: string): Observable<any> {
    cita.estado = nuevoEstado;
    cita.uuidLocal = cita.uuidLocal || String(cita.id || crypto.randomUUID());
    cita.estadoSync = 'PENDIENTE';
    cita.fechaActualizacionLocal = new Date().toISOString();

    return new Observable(observer => {
      if (cita.id) {
        this.http.patch<any>(`${this.api}/citas/${cita.id}/estado?estado=${nuevoEstado}`, {}).pipe(timeout(4000)).subscribe({
          next: async (data: any) => {
            const citaActualizada = {
              ...cita,
              ...data,
              uuidLocal: cita.uuidLocal,
              estadoSync: 'SINCRONIZADO'
            };

            await this.indexedDb.guardar('citas', citaActualizada);

            observer.next(citaActualizada);
            observer.complete();
          },
          error: async (err) => {
            console.warn('Backend no disponible. Estado guardado offline...', err);

            await this.indexedDb.guardar('citas', cita);
            await this.indexedDb.agregarPendiente('CITA', 'ACTUALIZAR_ESTADO', cita);

            observer.next(cita);
            observer.complete();
          }
        });
      } else {
        this.indexedDb.guardar('citas', cita)
          .then(() => this.indexedDb.agregarPendiente('CITA', 'ACTUALIZAR_ESTADO', cita))
          .then(() => {
            observer.next(cita);
            observer.complete();
          })
          .catch(err => observer.error(err));
      }
    });
  }

  listarMedicos(): Observable<any[]> {
    return new Observable(observer => {
      this.http.get<any[]>(`${this.api}/usuarios`).pipe(timeout(4000)).subscribe({
        next: (data) => {
          const medicos = (data || []).filter(u =>
            String(u.rol || '').toUpperCase().includes('MEDICO')
          );

          localStorage.setItem('medicos_cache', JSON.stringify(medicos));

          observer.next(data);
          observer.complete();
        },
        error: () => {
          const cache = localStorage.getItem('medicos_cache');

          if (cache) {
            observer.next(JSON.parse(cache));
            observer.complete();
            return;
          }

          const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
          observer.next(usuario?.id ? [usuario] : []);
          observer.complete();
        }
      });
    });
  }
}
