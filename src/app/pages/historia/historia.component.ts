import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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

  private api = 'https://hce-backend.onrender.com/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
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
    this.http.get<any[]>(`${this.api}/pacientes`)
      .subscribe({
        next: data => {
          this.pacientes = data || [];
        },
        error: error => {
          console.error('Error al cargar pacientes', error);
        }
      });
  }

  cargarDetallePaciente(pacienteId: number): void {
    this.http.get<any>(`${this.api}/historias-clinicas/paciente/${pacienteId}`)
      .subscribe({
        next: data => {
          this.paciente = data.paciente;

          const atencionesRecibidas = data.atenciones || [];

          this.atenciones = this.eliminarAtencionesDuplicadas(atencionesRecibidas);
        },
        error: error => {
          console.error('Error al cargar historia clínica', error);
        }
      });

    this.http.get<any[]>(`${this.api}/citas/paciente/${pacienteId}`)
      .subscribe({
        next: citas => {
          const citasUnicas = this.eliminarCitasDuplicadas(citas || []);

          this.citasProgramadas = citasUnicas.filter(c => c.estado !== 'NO_ASISTIO');
          this.citasNoAsistidas = citasUnicas.filter(c => c.estado === 'NO_ASISTIO');
        },
        error: error => {
          console.error('Error al cargar citas del paciente', error);
        }
      });
  }

  private eliminarAtencionesDuplicadas(atenciones: any[]): any[] {
    const mapa = new Map<string, any>();

    atenciones.forEach(a => {
      const clave = a.id
        ? `ID-${a.id}`
        : `${a.tipoAtencion}-${a.fechaHora}-${a.motivoConsulta}-${a.diagnostico}-${a.tratamientoIndicado}`;

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
        : `${c.tipoCita}-${c.fecha}-${c.hora}-${c.motivoConsulta}`;

      if (!mapa.has(clave)) {
        mapa.set(clave, c);
      }
    });

    return Array.from(mapa.values());
  }

}
