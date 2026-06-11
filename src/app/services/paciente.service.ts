import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';

import { Paciente } from '../models/paciente.model';
import { IndexedDbService } from './indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  private api = 'https://hce-backend.onrender.com/api/pacientes';

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  listar(): Observable<Paciente[]> {
  if (navigator.onLine) {
    return new Observable(observer => {
      this.http.get<Paciente[]>(this.api).subscribe({
        next: async (data) => {
          for (const paciente of data as any[]) {
            paciente.uuidLocal = paciente.uuidLocal || String(paciente.id);
            await this.indexedDb.guardar('pacientes', paciente);
          }

          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('No se pudo cargar backend. Leyendo IndexedDB...', err);

          const pacientes = await this.indexedDb.obtenerTodos('pacientes');
          observer.next(pacientes);
          observer.complete();
        }
      });
    });
  }

  return from(this.indexedDb.obtenerTodos('pacientes')) as Observable<Paciente[]>;
}

  obtener(id: number): Observable<Paciente> {
    if (navigator.onLine) {
      return this.http.get<Paciente>(`${this.api}/${id}`);
    }

    return from(
      this.indexedDb.obtenerTodos('pacientes')
        .then((pacientes: any[]) =>
          pacientes.find(p =>
            Number(p.id) === Number(id) ||
            Number(p.pacienteId) === Number(id)
          )
        )
    ) as Observable<Paciente>;
  }

  registrar(paciente: any): Observable<any> {
  paciente.uuidLocal = paciente.uuidLocal || crypto.randomUUID();
  paciente.estadoSync = 'PENDIENTE';
  paciente.fechaCreacionLocal = new Date().toISOString();

  if (navigator.onLine) {
    return new Observable(observer => {
      this.http.post<Paciente>(this.api, paciente).subscribe({
        next: (data) => {
          observer.next(data);
          observer.complete();
        },
        error: async (err) => {
          console.warn('Backend no disponible. Guardando offline...', err);

          await this.indexedDb.guardar('pacientes', paciente);
          await this.indexedDb.agregarPendiente('PACIENTE', 'CREAR', paciente);

          observer.next(paciente);
          observer.complete();
        }
      });
    });
  }

  return from(
    this.indexedDb.guardar('pacientes', paciente)
      .then(() => this.indexedDb.agregarPendiente('PACIENTE', 'CREAR', paciente))
      .then(() => paciente)
  );
}

  actualizar(id: number, paciente: any): Observable<any> {
    if (navigator.onLine) {
      return this.http.put<Paciente>(`${this.api}/${id}`, paciente);
    }

    paciente.uuidLocal = paciente.uuidLocal || crypto.randomUUID();
    paciente.id = id;
    paciente.estadoSync = 'PENDIENTE';
    paciente.fechaActualizacionLocal = new Date().toISOString();

    return from(
      this.indexedDb.guardar('pacientes', paciente)
        .then(() =>
          this.indexedDb.agregarPendiente('PACIENTE', 'ACTUALIZAR', paciente)
        )
        .then(() => paciente)
    );
  }

  baja(id: number): Observable<any> {
    if (navigator.onLine) {
      return this.http.patch<Paciente>(`${this.api}/${id}/baja`, {});
    }

    return from(
      this.indexedDb.obtenerTodos('pacientes')
        .then(async (pacientes: any[]) => {
          const paciente = pacientes.find(p => Number(p.id) === Number(id));

          if (!paciente) {
            throw new Error('Paciente no encontrado offline');
          }

          paciente.estado = false;
          paciente.estadoSync = 'PENDIENTE';
          paciente.fechaActualizacionLocal = new Date().toISOString();

          await this.indexedDb.guardar('pacientes', paciente);
          await this.indexedDb.agregarPendiente('PACIENTE', 'BAJA', paciente);

          return paciente;
        })
    );
  }

  buscar(criterio: string): Observable<Paciente[]> {
  if (navigator.onLine) {
    return new Observable(observer => {
      this.http.get<Paciente[]>(`${this.api}/buscar?criterio=${criterio}`)
        .subscribe({
          next: (data) => {
            observer.next(data);
            observer.complete();
          },
          error: async (err) => {
            console.warn('Buscar backend falló. Buscando offline...', err);

            const pacientes = await this.indexedDb.obtenerTodos('pacientes');
            const texto = criterio.toLowerCase();

            const filtrados = pacientes.filter(p =>
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

  return from(
    this.indexedDb.obtenerTodos('pacientes')
      .then((pacientes: any[]) => {
        const texto = criterio.toLowerCase();

        return pacientes.filter(p =>
          `${p.nombres || ''}`.toLowerCase().includes(texto) ||
          `${p.apellidos || ''}`.toLowerCase().includes(texto) ||
          `${p.numeroDocumento || ''}`.includes(texto)
        );
      })
  ) as Observable<Paciente[]>;
}
}