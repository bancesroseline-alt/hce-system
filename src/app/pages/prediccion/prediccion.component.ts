import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrediccionService } from '../../services/prediccion.service';

interface Paciente {
  nombres?: string;
  apellidos?: string;
}

interface Alerta {
  paciente?: Paciente;
  pacienteId?: number;
  nombres?: string;
  apellidos?: string;
  nivelRiesgo: 'ALTO' | 'MEDIO' | 'BAJO';
  probabilidadInasistencia: number;
  recomendacion: string;
  cantidadCitasPrevias?: number;
  cantidadInasistenciasPrevias?: number;
  cantidadReprogramaciones?: number;
  modoOffline?: boolean;
}

@Component({
  selector: 'app-prediccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediccion.component.html',
  styleUrls: ['./prediccion.component.css']
})
export class PrediccionComponent implements OnInit {

  alertas: Alerta[] = [];

  alertasAltas: Alerta[] = [];
  alertasMedias: Alerta[] = [];
  alertasBajas: Alerta[] = [];

  totalAlertas = 0;

  constructor(
    private prediccionService: PrediccionService
  ) {}

  ngOnInit(): void {

    this.prediccionService.obtenerPrediccionesPacientes()
      .subscribe({
        next: (data: any) => {

          console.log('Alertas recibidas:', data);

          this.alertas = data;
          this.procesarAlertas();
        },

        error: (error) => {
          console.error('Error obteniendo alertas:', error);
        }
      });

  }

  procesarAlertas(): void {

    this.alertasAltas =
      this.alertas.filter(a => a.nivelRiesgo === 'ALTO');

    this.alertasMedias =
      this.alertas.filter(a => a.nivelRiesgo === 'MEDIO');

    this.alertasBajas =
      this.alertas.filter(a => a.nivelRiesgo === 'BAJO');

    this.totalAlertas = this.alertas.length;
  }

  nombrePaciente(alerta: Alerta): string {
    const nombres = alerta.nombres || alerta.paciente?.nombres || '';
    const apellidos = alerta.apellidos || alerta.paciente?.apellidos || '';

    return `${nombres} ${apellidos}`.trim() || 'Sin datos';
  }

}
