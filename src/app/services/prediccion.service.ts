import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrediccionService {

  private apiCitas = 'https://hce-backend.onrender.com/api/citas/hoy';
  private apiML = 'https://ml-api-inasistencias.onrender.com/predict';

  constructor(private http: HttpClient) {}

  obtenerCitasHoy() {
    return this.http.get<any[]>(this.apiCitas);
  }

  predecir(cita: any) {

    const payload = {
      edad: cita.edad,
      sexo: cita.sexo,
      tipo_cita: cita.tipoCita,
      especialidad: cita.especialidad,
      dia_semana: cita.diaSemana,
      hora: Number(cita.hora),
      antecedentes_inasistencias: cita.antecedentesInasistencias,
      cantidad_citas_previas: cita.cantidadCitasPrevias
    };

    return this.http.post<any>(this.apiML, payload).pipe(
      map(res => {

        let nivel = 'BAJO';

        if (res.prediccion === 1 || res.probabilidad >= 0.7) {
          nivel = 'ALTO';
        } else if (res.probabilidad >= 0.4) {
          nivel = 'MEDIO';
        }

        return {
          paciente: {
            nombres: cita.nombres,
            apellidos: cita.apellidos
          },
          nivelRiesgo: nivel,
          probabilidadInasistencia: res.probabilidad,
          recomendacion: this.generarRecomendacion(nivel)
        };
      })
    );
  }

  obtenerAlertas() {
    return this.obtenerCitasHoy().pipe(
      switchMap(citas =>
        forkJoin(citas.map(c => this.predecir(c)))
      )
    );
  }

  private generarRecomendacion(nivel: string) {
    switch (nivel) {
      case 'ALTO':
        return 'Seguimiento inmediato';
      case 'MEDIO':
        return 'Monitoreo preventivo';
      default:
        return 'Sin acción';
    }
  }
}
