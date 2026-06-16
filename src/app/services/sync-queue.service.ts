import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { IndexedDbService } from './indexed-db.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {

  private api = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  async sincronizarPendientes(): Promise<void> {
    if (!navigator.onLine) {
      console.warn('Sin internet. No se puede sincronizar.');
      return;
    }

    const pendientes = await this.indexedDb.obtenerPendientes();

    for (const pendiente of pendientes) {
      try {
        if (pendiente.entidad === 'CITA') {
          await this.sincronizarCita(pendiente);
        }

        if (pendiente.entidad === 'ATENCION') {
          await this.sincronizarAtencion(pendiente);
        }

        if (pendiente.entidad === 'PACIENTE') {
          await this.sincronizarPaciente(pendiente);
        }

        if (pendiente.entidad === 'PREDICCION') {
          await this.sincronizarPrediccion(pendiente);
        }

        await this.marcarEntidadSincronizada(pendiente);
        await this.indexedDb.marcarSincronizado(pendiente.uuidLocal);
      } catch (error) {
        await this.marcarEntidadConError(pendiente, error);
        await this.indexedDb.marcarErrorSync(pendiente.uuidLocal, error);
        await this.registrarConflictoSiAplica(pendiente, error);
        console.error('Error sincronizando pendiente:', pendiente, error);
      }
    }
  }

  private sincronizarCita(pendiente: any): Promise<any> {
    const cita = pendiente.data;

    if (pendiente.accion === 'ACTUALIZAR_ESTADO' && cita.id) {
      return this.http
        .patch(`${this.api}/citas/${cita.id}/estado?estado=${cita.estado}`, {})
        .pipe(timeout(4000))
        .toPromise();
    }

    if (pendiente.accion === 'ACTUALIZAR' && cita.id) {
      const payload = this.mapearCitaPayload(cita);

      return this.http
        .put(`${this.api}/citas/${cita.id}`, payload)
        .pipe(timeout(4000))
        .toPromise();
    }

    return this.http
      .post(`${this.api}/sincronizacion/citas`, {
        ...this.mapearCitaPayload(cita),
        uuidLocal: cita.uuidLocal,
        origenRegistro: 'INDEXEDDB'
      })
      .pipe(timeout(4000))
      .toPromise();
  }

  private sincronizarAtencion(pendiente: any): Promise<any> {
    const a = pendiente.data;

    const payload = {
      uuidLocal: a.uuidLocal,
      pacienteId: Number(a.pacienteId),
      usuarioId: Number(a.usuarioId),
      citaId: a.citaId ? Number(a.citaId) : null,
      fechaHora: a.fechaHora,
      tipoAtencion: a.tipoAtencion,
      motivoConsulta: a.motivoConsulta,
      presionArterial: a.presionArterial,
      temperatura: a.temperatura,
      saturacion: a.saturacion,
      talla: a.talla,
      peso: a.peso,
      diagnostico: a.diagnostico,
      tratamientoIndicado: a.tratamientoIndicado,
      observaciones: a.observaciones,
      medicamentos: a.medicamentos,
      estado: a.estado || 'COMPLETADA',
      origenRegistro: 'INDEXEDDB'
    };

    return this.http
      .post(`${this.api}/sincronizacion`, payload)
      .pipe(timeout(4000))
      .toPromise();
  }

  private sincronizarPaciente(pendiente: any): Promise<any> {
    const paciente = pendiente.data;

    if (pendiente.accion === 'ACTUALIZAR' && paciente.id) {
      return this.http
        .put(`${this.api}/pacientes/${paciente.id}`, paciente)
        .pipe(timeout(4000))
        .toPromise();
    }

    if (pendiente.accion === 'BAJA' && paciente.id) {
      return this.http
        .patch(`${this.api}/pacientes/${paciente.id}/baja`, {})
        .pipe(timeout(4000))
        .toPromise();
    }

    return this.http
      .post(`${this.api}/sincronizacion/pacientes`, paciente)
      .pipe(timeout(4000))
      .toPromise();
  }

  private sincronizarPrediccion(pendiente: any): Promise<any> {
    return Promise.resolve(pendiente.data);
  }

  private async registrarConflictoSiAplica(pendiente: any, error: any): Promise<void> {
    const status = error?.status;
    const mensaje = error?.error?.message || error?.message || '';

    if (status === 409 || /conflict|conflicto|duplicado|registrado/i.test(mensaje)) {
      await this.indexedDb.registrarConflicto(
        pendiente,
        error?.error || null,
        mensaje || 'Posible conflicto entre registro local y remoto'
      );
    }
  }

  private async marcarEntidadSincronizada(pendiente: any): Promise<void> {
    const store = this.obtenerStoreEntidad(pendiente.entidad);

    if (!store || !pendiente.data?.uuidLocal) return;

    await this.indexedDb.guardar(store, {
      ...pendiente.data,
      estadoSync: 'SINCRONIZADO',
      fechaSincronizacion: new Date().toISOString()
    });
  }

  private async marcarEntidadConError(pendiente: any, error: any): Promise<void> {
    const store = this.obtenerStoreEntidad(pendiente.entidad);

    if (!store || !pendiente.data?.uuidLocal) return;

    await this.indexedDb.guardar(store, {
      ...pendiente.data,
      estadoSync: 'ERROR_SYNC',
      errorSync: error?.error?.message || error?.message || 'Error de sincronizacion'
    });
  }

  private obtenerStoreEntidad(entidad: string): string | null {
    if (entidad === 'PACIENTE') return 'pacientes';
    if (entidad === 'CITA') return 'citas';
    if (entidad === 'ATENCION') return 'atenciones';
    if (entidad === 'PREDICCION') return 'predicciones';
    return null;
  }

  private mapearCitaPayload(cita: any): any {
    return {
      pacienteId: Number(cita.pacienteId || cita.paciente?.id),
      medicoId: Number(cita.medicoId || cita.medico?.id),
      tipoCita: cita.tipoCita,
      fecha: cita.fecha,
      hora: cita.hora,
      especialidad: cita.especialidad,
      motivoConsulta: cita.motivoConsulta,
      estado: cita.estado
    };
  }
}
