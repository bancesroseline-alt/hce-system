import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, from, map, of, switchMap, timeout } from 'rxjs';
import { IndexedDbService } from './indexed-db.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrediccionService {

  private apiCitas = `${environment.apiBaseUrl}/citas`;
  private apiPredicciones = `${environment.apiBaseUrl}/predicciones`;

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  obtenerCitasHoy(): Observable<any[]> {
    const hoy = new Date().toISOString().split('T')[0];

    return this.http.get<any[]>(this.apiCitas).pipe(
      timeout(4000),
      map(citas => (citas || []).filter(c => c.fecha === hoy)),
      switchMap(citas => from(this.cachearCitas(citas)).pipe(map(() => citas))),
      catchError(() => from(this.obtenerCitasHoyOffline()))
    );
  }

  predecir(cita: any): Observable<any> {
    const payload = {
      pacienteId: cita.pacienteId || cita.paciente?.id,
      edad: cita.edad || 0,
      cantidadCitasPrevias: cita.cantidadCitasPrevias || 0,
      cantidadInasistenciasPrevias: cita.antecedentesInasistencias || 0,
      tipoCita: cita.tipoCita,
      especialidad: cita.especialidad,
      citaId: cita.id || null,
      diaSemana: cita.diaSemana || '',
      hora: Number(`${cita.hora || '10'}`.split(':')[0])
    };

    return this.http.post<any>(`${this.apiPredicciones}/inasistencia`, payload).pipe(
      timeout(30000),
      map(res => this.mapearRespuesta(cita, Number(res.probabilidadInasistencia), false)),
      catchError(() => of(this.predecirOffline(cita))),
      switchMap(prediccion =>
        from(this.indexedDb.guardar('predicciones', {
          ...prediccion,
          uuidLocal: prediccion.uuidLocal || crypto.randomUUID(),
          citaId: cita.id || cita.uuidLocal || null,
          fechaPrediccionLocal: new Date().toISOString()
        })).pipe(map(() => prediccion))
      )
    );
  }

  predecirConModelo(cita: any): Observable<any> {
    const payload = {
      pacienteId: cita.pacienteId,
      edad: cita.edad || 0,
      cantidadCitasPrevias: cita.cantidadCitasPrevias || 0,
      cantidadInasistenciasPrevias: cita.antecedentesInasistencias || 0,
      tipoCita: cita.tipoCita,
      especialidad: cita.especialidad,
      citaId: cita.id || null,
      diaSemana: cita.diaSemana || 'MONDAY',
      hora: Number(`${cita.hora || '10'}`.split(':')[0])
    };

    return this.http.post<any>(`${this.apiPredicciones}/inasistencia`, payload).pipe(
      timeout(30000),
      map(res => {
        const probabilidad = Number(res?.probabilidadInasistencia);

        if (Number.isNaN(probabilidad)) {
          throw new Error('El backend no devolvio una probabilidad valida');
        }

        return this.mapearRespuesta(cita, probabilidad, false);
      })
    );
  }

  obtenerAlertas(): Observable<any[]> {
    return this.obtenerCitasHoy().pipe(
      switchMap(citas => {
        if (!citas.length) {
          return from(this.indexedDb.obtenerTodos('predicciones'));
        }

        return forkJoin(citas.map(c => this.predecir(c)));
      })
    );
  }

  private async cachearCitas(citas: any[]): Promise<void> {
    for (const cita of citas) {
      cita.uuidLocal = cita.uuidLocal || String(cita.id || crypto.randomUUID());
      cita.estadoSync = cita.estadoSync || 'SINCRONIZADO';
      await this.indexedDb.guardar('citas', cita);
    }
  }

  private async obtenerCitasHoyOffline(): Promise<any[]> {
    const hoy = new Date().toISOString().split('T')[0];
    const citas = await this.indexedDb.obtenerTodos('citas');

    return citas.filter((c: any) => c.fecha === hoy);
  }

  private predecirOffline(cita: any): any {
    let probabilidad = 0.18;

    if (cita.estado === 'NO_ASISTIO') probabilidad += 0.55;
    if (cita.estado === 'CANCELADA') probabilidad += 0.35;
    if (cita.tipoCita === 'EMERGENCIA') probabilidad -= 0.1;
    if (cita.tipoCita === 'PREVENTIVA') probabilidad += 0.08;
    if (`${cita.hora || ''}`.startsWith('07') || `${cita.hora || ''}`.startsWith('08')) {
      probabilidad += 0.07;
    }

    probabilidad = Math.max(0.05, Math.min(probabilidad, 0.95));

    return this.mapearRespuesta(cita, probabilidad, true);
  }

  private mapearRespuesta(cita: any, probabilidad: number, modoOffline: boolean): any {
    let nivel = 'BAJO';

    if (probabilidad >= 0.7) {
      nivel = 'ALTO';
    } else if (probabilidad >= 0.4) {
      nivel = 'MEDIO';
    }

    const nombres = cita.nombres || cita.pacienteNombre?.split(' ')[0] || '';
    const apellidos = cita.apellidos || cita.pacienteNombre?.split(' ').slice(1).join(' ') || '';

    return {
      uuidLocal: `${cita.id || cita.uuidLocal || crypto.randomUUID()}-${modoOffline ? 'offline' : 'online'}`,
      paciente: { nombres, apellidos },
      nivelRiesgo: nivel,
      probabilidadInasistencia: probabilidad,
      recomendacion: this.generarRecomendacion(nivel, modoOffline),
      modoOffline
    };
  }

  private generarRecomendacion(nivel: string, modoOffline: boolean): string {
    const sufijo = modoOffline ? ' (estimacion local)' : '';

    switch (nivel) {
      case 'ALTO':
        return `Seguimiento inmediato${sufijo}`;
      case 'MEDIO':
        return `Monitoreo preventivo${sufijo}`;
      default:
        return `Sin accion${sufijo}`;
    }
  }
}
