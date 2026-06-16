import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PacienteService } from '../../services/paciente.service';
import { CitaOfflineService } from '../../services/cita-offline.service';
import { AtencionOfflineService } from '../../services/atencion-offline.service';

@Component({
  selector: 'app-historia',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.css'
})
export class HistoriaComponent implements OnInit {

  modoListado = true;

  pacientes: any[] = [];
  paciente: any = null;
  atenciones: any[] = [];
  citasProgramadas: any[] = [];
  citasNoAsistidas: any[] = [];

  tab: 'atenciones' | 'citas' | 'inasistencias' = 'atenciones';

  constructor(
    private route: ActivatedRoute,
    private pacienteService: PacienteService,
    private citaOfflineService: CitaOfflineService,
    private atencionOfflineService: AtencionOfflineService
  ) {}

  ngOnInit(): void {
    const pacienteId = Number(this.route.snapshot.paramMap.get('id'));

    if (pacienteId) {
      this.modoListado = false;
      this.cargarDetallePaciente(pacienteId);
    } else {
      this.modoListado = true;
      this.cargarListadoHistorias();
    }
  }

  cargarListadoHistorias(): void {
  this.pacienteService.listar()
    .subscribe({
      next: data => {
        this.pacientes = data || [];
      },
      error: error => {
        console.error('Error al cargar pacientes', error);
        this.pacientes = [];
      }
    });
}

  cargarDetallePaciente(pacienteId: number): void {

    this.pacienteService.obtener(pacienteId)
      .subscribe({
        next: data => {
          this.paciente = data;
        },
        error: error => {
          console.error('Error al cargar paciente', error);
          this.paciente = null;
        }
      });

    this.atencionOfflineService.listarPorPaciente(pacienteId)
      .subscribe({
        next: data => {
          this.atenciones = this.eliminarAtencionesDuplicadas(data || []);
        },
        error: error => {
          console.error('Error al cargar atenciones', error);
          this.atenciones = [];
        }
      });

    this.citaOfflineService.listarPorPaciente(pacienteId)
      .subscribe({
        next: citas => {
          const citasUnicas = this.eliminarCitasDuplicadas(citas || []);

          this.citasProgramadas = citasUnicas.filter(c => c.estado !== 'NO_ASISTIO');
          this.citasNoAsistidas = citasUnicas.filter(c => c.estado === 'NO_ASISTIO');
        },
        error: error => {
          console.error('Error al cargar citas del paciente', error);
          this.citasProgramadas = [];
          this.citasNoAsistidas = [];
        }
      });
  }

  private eliminarAtencionesDuplicadas(atenciones: any[]): any[] {
    const mapa = new Map<string, any>();

    atenciones.forEach(a => {
      const clave = a.id
        ? `ID-${a.id}`
        : `${a.uuidLocal || ''}-${a.tipoAtencion}-${a.fechaHora}-${a.motivoConsulta}-${a.diagnostico}`;

      if (!mapa.has(clave)) {
        mapa.set(clave, a);
      }
    });

    return Array.from(mapa.values());
  }

  private eliminarCitasDuplicadas(citas: any[]): any[] {
    const mapa = new Map<string, any>();

    citas.forEach(c => {
      const clave = c.id
        ? `ID-${c.id}`
        : `${c.uuidLocal || ''}-${c.tipoCita}-${c.fecha}-${c.hora}-${c.motivoConsulta}`;

      if (!mapa.has(clave)) {
        mapa.set(clave, c);
      }
    });

    return Array.from(mapa.values());
  }
}
