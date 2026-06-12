import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrediccionService {

  private apiBackend = 'https://hce-backend.onrender.com';
  private apiML = 'https://ml-api-inasistencias.onrender.com';

  constructor(private http: HttpClient) {}

  // 1. Obtener citas reales del backend
  obtenerCitasHoy(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBackend}/api/citas`);
  }

  // 2. Llamar al modelo ML
  predecir(citas: any[]): Observable<any[]> {

    const payload = citas.map(c => ({
      edad: c.edad,
      sexo: c.sexo,
      tipo_cita: c.tipoCita,
      especialidad: c.especialidad,
      dia_semana: c.diaSemana,
      hora: c.hora,
      antecedentes_inasistencias: c.antecedentesInasistencias,
      cantidad_citas_previas: c.cantidadCitasPrevias
    }));

    return this.http.post<any[]>(`${this.apiML}/predict`, payload);
  }

  // 3. Flujo completo
  obtenerAlertas() {
    return this.obtenerCitasHoy().pipe(
      map(citas => {

        // ⚠️ IMPORTANTE: aquí debes llamar predict dentro de otro flujo
        return { citas };

      })
    );
  }

  // 4. Flujo recomendado REAL (uso en component)
  ejecutarPrediccion(citas: any[]): Observable<any[]> {

    const payload = citas.map(c => ({
      edad: c.edad,
      sexo: c.sexo,
      tipo_cita: c.tipoCita,
      especialidad: c.especialidad,
      dia_semana: c.diaSemana,
      hora: c.hora,
      antecedentes_inasistencias: c.antecedentesInasistencias,
      cantidad_citas_previas: c.cantidadCitasPrevias
    }));

    return this.http.post<any[]>(`${this.apiML}/predict`, payload).pipe(
      map(predicciones => {

        return predicciones.map((p, i) => {

          const cita = citas[i]; // 👈 clave: match por índice, no ID

          return {
            paciente: {
              nombres: cita?.cliente?.nombre || 'Sin nombre'
            },
            nivelRiesgo: p.nivelRiesgo,
            probabilidadInasistencia: p.probabilidadInasistencia,
            recomendacion: this.generarRecomendacion(p.nivelRiesgo)
          };

        });

      })
    );
  }

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
