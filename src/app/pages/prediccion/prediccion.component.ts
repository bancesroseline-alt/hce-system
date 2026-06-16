import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './prediccion.component.html',
  styleUrls: ['./prediccion.component.css']
})
export class PrediccionComponent implements OnInit {

  alertas: Alerta[] = [];

  alertasAltas: Alerta[] = [];
  alertasMedias: Alerta[] = [];
  alertasBajas: Alerta[] = [];

  totalAlertas = 0;
  precisionModelo = 84;
  ultimaActualizacion = '';
  filtroBusqueda = '';
  filtroRiesgo = 'TODOS';

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
          this.ultimaActualizacion = this.formatearHora(new Date());
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

  get alertasFiltradas(): Alerta[] {
    const busqueda = this.filtroBusqueda.trim().toLowerCase();

    return this.alertas.filter(alerta => {
      const cumpleBusqueda = !busqueda || this.nombrePaciente(alerta).toLowerCase().includes(busqueda);
      const cumpleRiesgo = this.filtroRiesgo === 'TODOS' || alerta.nivelRiesgo === this.filtroRiesgo;

      return cumpleBusqueda && cumpleRiesgo;
    });
  }

  get prediccionesHoy(): number {
    return this.alertas.length;
  }

  porcentajeRiesgo(alerta: Alerta): number {
    const valor = Number(alerta.probabilidadInasistencia || 0);
    const porcentaje = valor > 1 ? valor : valor * 100;

    return Math.max(0, Math.min(100, Math.round(porcentaje)));
  }

  progresoIndicador(total: number): number {
    if (this.totalAlertas === 0) return 0;
    return Math.round((total / this.totalAlertas) * 100);
  }

  donutBackground(): string {
    if (this.totalAlertas === 0) {
      return 'conic-gradient(#e5e7eb 0 100%)';
    }

    const bajo = this.progresoIndicador(this.alertasBajas.length);
    const medio = this.progresoIndicador(this.alertasMedias.length);
    const alto = 100 - bajo - medio;

    return `conic-gradient(#10b981 0 ${bajo}%, #f59e0b ${bajo}% ${bajo + medio}%, #ef4444 ${bajo + medio}% ${bajo + medio + alto}%)`;
  }

  riesgoClase(alerta: Alerta): string {
    return (alerta.nivelRiesgo || 'BAJO').toLowerCase();
  }

  exportarExcel(): void {
    const encabezados = [
      'Paciente',
      'Citas previas',
      'Inasistencias',
      'Reprogramaciones',
      'Riesgo',
      'Probabilidad',
      'Recomendacion'
    ];

    const filas = this.alertasFiltradas.map(alerta => [
      this.nombrePaciente(alerta),
      alerta.cantidadCitasPrevias || 0,
      alerta.cantidadInasistenciasPrevias || 0,
      alerta.cantidadReprogramaciones || 0,
      alerta.nivelRiesgo,
      `${this.porcentajeRiesgo(alerta)}%`,
      alerta.recomendacion || ''
    ]);

    const contenido = [encabezados, ...filas]
      .map(fila => fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predicciones-ml-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  nombrePaciente(alerta: Alerta): string {
    const nombres = alerta.nombres || alerta.paciente?.nombres || '';
    const apellidos = alerta.apellidos || alerta.paciente?.apellidos || '';

    return `${nombres} ${apellidos}`.trim() || 'Sin datos';
  }

  inicialPaciente(alerta: Alerta): string {
    return this.nombrePaciente(alerta).charAt(0).toUpperCase();
  }

  private formatearHora(fecha: Date): string {
    return fecha.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

}
