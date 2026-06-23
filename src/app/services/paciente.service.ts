import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs';

import { Paciente } from '../models/paciente.model';
import { IndexedDbService } from './indexed-db.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  private api = `${environment.apiBaseUrl}/pacientes`;

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  listar(): Observable<Paciente[]> {
    return new Observable(observer => {
      this.http.get<Paciente[]>(this.api).pipe(timeout(4000)).subscribe({
        next: async (data) => {
          for (const paciente of data as any[]) {
            paciente.uuidLocal = paciente.uuidLocal || String(paciente.id);
            paciente.estadoSync = 'SINCRONIZADO';
            await this.indexedDb.guardar('pacientes', paciente);
          }

          await this.reconciliarPacientesLocales(data || []);

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Cargando pacientes offline...', err);

          const pacientes = await this.indexedDb.obtenerTodos('pacientes');
          observer.next(pacientes);
          observer.complete();
        }
      });
    });
  }

  obtener(id: number | string): Observable<Paciente> {
    return new Observable(observer => {
      this.http.get<Paciente>(`${this.api}/${id}`).pipe(timeout(4000)).subscribe({
        next: async (data: any) => {
          data.uuidLocal = data.uuidLocal || String(data.id);
          data.estadoSync = 'SINCRONIZADO';

          await this.indexedDb.guardar('pacientes', data);

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Buscando paciente offline...', err);

          const pacientes = await this.indexedDb.obtenerTodos('pacientes');

          const paciente = pacientes.find((p: any) =>
            Number(p.id) === Number(id) ||
            Number(p.pacienteId) === Number(id) ||
            String(p.uuidLocal) === String(id)
          );

          if (!paciente) {
            observer.error('Paciente no encontrado offline');
            return;
          }

          observer.next(paciente);
          observer.complete();
        }
      });
    });
  }

  registrar(paciente: any): Observable<any> {
    paciente.uuidLocal = paciente.uuidLocal || crypto.randomUUID();
    paciente.estadoSync = 'PENDIENTE';
    paciente.fechaCreacionLocal = new Date().toISOString();

    return new Observable(observer => {
      this.http.post<Paciente>(this.api, paciente).pipe(timeout(4000)).subscribe({
        next: async (data: any) => {
          data.uuidLocal = data.uuidLocal || String(data.id);
          data.estadoSync = 'SINCRONIZADO';

          await this.indexedDb.guardar('pacientes', data);

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Guardando paciente offline...', err);

          await this.indexedDb.guardar('pacientes', paciente);
          await this.indexedDb.agregarPendiente('PACIENTE', 'CREAR', paciente);

          observer.next(paciente);
          observer.complete();
        }
      });
    });
  }

  actualizar(id: number | string, paciente: any): Observable<any> {
    paciente.uuidLocal = paciente.uuidLocal || String(paciente.id || id);
    paciente.id = paciente.id || id;
    paciente.estadoSync = 'PENDIENTE';
    paciente.fechaActualizacionLocal = new Date().toISOString();

    return new Observable(observer => {
      this.http.put<Paciente>(`${this.api}/${id}`, paciente).pipe(timeout(4000)).subscribe({
        next: async (data: any) => {
          data.uuidLocal = data.uuidLocal || String(data.id || paciente.uuidLocal);
          data.estadoSync = 'SINCRONIZADO';

          await this.indexedDb.guardar('pacientes', data);

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Actualizando paciente offline...', err);

          await this.indexedDb.guardar('pacientes', paciente);
          await this.indexedDb.agregarPendiente('PACIENTE', 'ACTUALIZAR', paciente);

          observer.next(paciente);
          observer.complete();
        }
      });
    });
  }

  baja(id: number | string): Observable<any> {
    return new Observable(observer => {
      this.http.patch<Paciente>(`${this.api}/${id}/baja`, {}).pipe(timeout(4000)).subscribe({
        next: async (data: any) => {
          data.uuidLocal = data.uuidLocal || String(data.id || id);
          data.estadoSync = 'SINCRONIZADO';

          await this.indexedDb.guardar('pacientes', data);

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Dando de baja paciente offline...', err);

          const pacientes = await this.indexedDb.obtenerTodos('pacientes');

          const paciente = pacientes.find((p: any) =>
            Number(p.id) === Number(id) ||
            Number(p.pacienteId) === Number(id) ||
            String(p.uuidLocal) === String(id)
          );

          if (!paciente) {
            observer.error('Paciente no encontrado offline');
            return;
          }

          paciente.estado = false;
          paciente.estadoSync = 'PENDIENTE';
          paciente.fechaActualizacionLocal = new Date().toISOString();

          await this.indexedDb.guardar('pacientes', paciente);
          await this.indexedDb.agregarPendiente('PACIENTE', 'BAJA', paciente);

          observer.next(paciente);
          observer.complete();
        }
      });
    });
  }

  buscar(criterio: string): Observable<Paciente[]> {
    return new Observable(observer => {
      this.http.get<Paciente[]>(`${this.api}/buscar?criterio=${criterio}`)
        .pipe(timeout(4000))
        .subscribe({
          next: (data) => {
            observer.next(data);
            observer.complete();
          },
          error: async (err) => {
            console.warn('Backend no disponible. Buscando pacientes offline...', err);

            const pacientes = await this.indexedDb.obtenerTodos('pacientes');
            const texto = criterio.toLowerCase();

            const filtrados = pacientes.filter((p: any) =>
              `${p.nombres || ''}`.toLowerCase().includes(texto) ||
              `${p.apellidos || ''}`.toLowerCase().includes(texto) ||
              `${p.numeroDocumento || ''}`.includes(texto)
            );

            observer.next(filtrados);
            observer.complete();
          }
        });
    });
  }

  private async reconciliarPacientesLocales(remotos: any[]): Promise<void> {
    const locales = await this.indexedDb.obtenerTodos('pacientes');

    for (const local of locales) {
      const estaPendiente = local.estadoSync === 'PENDIENTE' || local.estadoSync === 'ERROR_SYNC';

      if (estaPendiente || !local.uuidLocal) {
        continue;
      }

      const remotoPorId = remotos.find(p => local.id && String(p.id) === String(local.id));
      const remotoPorUuid = remotos.find(p =>
        String(p.uuidLocal || p.id) === String(local.uuidLocal)
      );
      const remotoPorDocumento = remotos.find(p =>
        p.numeroDocumento && String(p.numeroDocumento) === String(local.numeroDocumento || '')
      );

      const esCopiaRemotaActual = !!remotoPorId || !!remotoPorUuid;
      const esDuplicadoPorDocumento = !!remotoPorDocumento && !esCopiaRemotaActual;

      if (esDuplicadoPorDocumento || (!remotoPorDocumento && !esCopiaRemotaActual)) {
        await this.indexedDb.eliminar('pacientes', local.uuidLocal);
      }
    }
  }
}
