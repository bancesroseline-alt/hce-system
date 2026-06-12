import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrediccionService {

  private apiCitas = 'https://TU_BACKEND/api/citas/hoy';
  private apiPrediccion = 'https://TU_RENDER/predict';

  constructor(private http: HttpClient) {}

  // 1. Obtener citas reales del backend
  obtenerCitasHoy(): Observable<any[]> {
    return this.http.get<any[]>(this.apiCitas);
  }

  // 2. Enviar datos al modelo Python
  predecir(citas: any[]): Observable<any[]> {
    const payload = citas.map(c => ({
      pacienteId: c.pacienteId,
      edad: c.edad,
      sexo: c.sexo,
      tipoCita: c.tipoCita,
      hora: c.hora,
      diaSemana: c.diaSemana,
      antecedentes_inasistencias: c.antecedentesInasistencias,
      cantidad_citas_previas: c.cantidadCitasPrevias
    }));

    return this.http.post<any[]>(this.apiPrediccion, payload);
  }

  // 3. Flujo completo listo (RECOMENDADO USAR ESTE)
  obtenerAlertas(): Observable<any[]> {

    return forkJoin({
      citas: this.obtenerCitasHoy(),
      predicciones: this.http.get<any[]>(this.apiPrediccion)
    }).pipe(
      map(({ citas, predicciones }) => {

        return predicciones.map(p => {

          const cita = citas.find(c => c.pacienteId === p.pacienteId);

          return {
            paciente: {
              nombres: cita?.nombres,
              apellidos: cita?.apellidos
            },
            nivelRiesgo: p.nivelRiesgo,
            probabilidadInasistencia: p.probabilidadInasistencia,
            recomendacion: this.generarRecomendacion(p.nivelRiesgo)
          };
        });

      })
    );
  }

  // 4. Reglas simples de negocio
  private generarRecomendacion(nivel: string): string {

    switch (nivel) {
      case 'ALTO':
        return 'Seguimiento urgente';
      case 'MEDIO':
        return 'Monitoreo preventivo';
      case 'BAJO':
        return 'Sin acción';
      default:
        return 'No definido';
    }
  }
}
