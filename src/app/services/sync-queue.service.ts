import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IndexedDbService } from './indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {

  private api = 'https://hce-backend.onrender.com/api';

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

        await this.indexedDb.marcarSincronizado(pendiente.uuidLocal);

      } catch (error) {
        console.error('Error sincronizando pendiente:', pendiente, error);
      }
    }
  }

  private sincronizarCita(pendiente: any): Promise<any> {
    const cita = pendiente.data;

    const payload = {
      uuidLocal: cita.uuidLocal,
      pacienteId: Number(cita.pacienteId || cita.paciente?.id),
      medicoId: Number(cita.medicoId || cita.medico?.id),
      tipoCita: cita.tipoCita,
      fecha: cita.fecha,
      hora: cita.hora,
      especialidad: cita.especialidad,
      motivoConsulta: cita.motivoConsulta,
      estado: cita.estado,
      origenRegistro: 'INDEXEDDB'
    };

    return this.http.post(`${this.api}/sincronizacion/citas`, payload).toPromise();
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
      diagnostico: a.diagnostico,
      tratamientoIndicado: a.tratamientoIndicado,
      observaciones: a.observaciones,
      estado: a.estado || 'COMPLETADA',
      origenRegistro: 'INDEXEDDB'
    };

    return this.http.post(`${this.api}/sincronizacion`, payload).toPromise();
  }

  private sincronizarPaciente(pendiente: any): Promise<any> {
    const paciente = pendiente.data;

    /**
     * IMPORTANTE:
     * En backend todavía debes crear:
     * POST /api/sincronizacion/pacientes
     */
    return this.http.post(`${this.api}/sincronizacion/pacientes`, paciente).toPromise();
  }

  private sincronizarPrediccion(pendiente: any): Promise<any> {
    /**
     * IMPORTANTE:
     * En backend todavía debes crear:
     * POST /api/sincronizacion/predicciones
     */
    return this.http.post(`${this.api}/sincronizacion/predicciones`, pendiente.data).toPromise();
  }
}