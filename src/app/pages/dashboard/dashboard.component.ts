import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { IndexedDbService } from '../../services/indexed-db.service';
import { timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  totalPacientes = 0;
  citasHoy = 0;
  totalCitasMedico = 0;
  totalAtenciones = 0;
  porcentajeInasistencia = 0;

  nombreUsuario = 'Usuario';
  rolUsuario = 'Medico';

  citasDelDia: any[] = [];
  actividades: any[] = [];

  modoOffline = false;
  sistemaOnline = navigator.onLine;

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  ngOnInit(): void {
    this.actualizarEstadoConexion();

    window.addEventListener('online', () => {
      this.sistemaOnline = true;
    });

    window.addEventListener('offline', () => {
      this.sistemaOnline = false;
    });

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    this.nombreUsuario =
      usuario.nombre ||
      usuario.nombres ||
      usuario.username ||
      'Usuario';

    this.rolUsuario =
      usuario.rol ||
      'Medico';

    const medicoId = usuario.id || 2;

    this.http.get<any>(
      `${environment.apiBaseUrl}/dashboard/medico/${medicoId}`
    ).pipe(timeout(4000)).subscribe({
      next: async (data) => {
        this.modoOffline = false;
        this.cargarDatos(data);
        await this.cargarActividadRecienteDesdeIndexedDb();

        localStorage.setItem(
          'dashboard_cache',
          JSON.stringify(data)
        );
      },
      error: async (error) => {
        console.warn(
          'Backend no disponible. Cargando dashboard offline...',
          error
        );

        this.modoOffline = true;

        const cache = localStorage.getItem('dashboard_cache');

        if (cache) {
          this.cargarDatos(JSON.parse(cache));
          await this.cargarActividadRecienteDesdeIndexedDb();
          return;
        }

        await this.cargarDashboardDesdeIndexedDb();
      }
    });
  }

  actualizarEstadoConexion(): void {
    this.sistemaOnline = navigator.onLine;
  }

  sistemaOffline(): boolean {
    return this.modoOffline || !this.sistemaOnline;
  }

  cargarDatos(data: any): void {
    this.totalPacientes = data.totalPacientes || 0;
    this.citasHoy = data.citasHoy || 0;
    this.totalCitasMedico = data.totalCitasMedico || 0;
    this.totalAtenciones = data.totalAtenciones || 0;
    this.porcentajeInasistencia = data.porcentajeInasistencia || 0;

    this.citasDelDia = data.citasDelDia || [];
    this.actividades = data.actividades || [];
  }

  async cargarDashboardDesdeIndexedDb(): Promise<void> {
    const pacientes = await this.indexedDb.obtenerTodos('pacientes');
    const citas = await this.indexedDb.obtenerTodos('citas');
    const atenciones = await this.indexedDb.obtenerTodos('atenciones');

    const hoy = new Date().toISOString().split('T')[0];

    const citasHoy = citas.filter((c: any) =>
      c.fecha === hoy ||
      c.fechaCita === hoy ||
      c.fechaAtencion === hoy
    );

    const noAsistio = citas.filter((c: any) =>
      c.estado === 'NO_ASISTIO'
    ).length;

    this.totalPacientes = pacientes.length;
    this.totalCitasMedico = citas.length;
    this.totalAtenciones = atenciones.length;
    this.citasHoy = citasHoy.length;

    this.porcentajeInasistencia = citas.length > 0
      ? Math.round((noAsistio / citas.length) * 100)
      : 0;

    this.citasDelDia = citasHoy;
    this.actividades = this.obtenerActividadReciente(pacientes, citas, atenciones);
  }

  async cargarActividadRecienteDesdeIndexedDb(): Promise<void> {
    const [pacientes, citas, atenciones] = await Promise.all([
      this.indexedDb.obtenerTodos('pacientes'),
      this.indexedDb.obtenerTodos('citas'),
      this.indexedDb.obtenerTodos('atenciones')
    ]);

    const actividadLocal = this.obtenerActividadReciente(pacientes, citas, atenciones);

    if (actividadLocal.length > 0) {
      this.actividades = actividadLocal;
    }
  }

  private obtenerActividadReciente(pacientes: any[], citas: any[], atenciones: any[]): any[] {
    return [
      ...pacientes.map((p: any) => ({
        titulo: 'PACIENTE',
        detalle: `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.numeroDocumento || 'Paciente',
        tiempo: p.fechaActualizacionLocal || p.fechaCreacionLocal || p.fechaRegistro || ''
      })),
      ...citas.map((c: any) => ({
        titulo: 'CITA',
        detalle: `${c.especialidad || 'Sin especialidad'} - ${c.estado || 'SIN_ESTADO'}`,
        tiempo: c.fechaActualizacionLocal || c.fechaCreacionLocal || c.fecha || ''
      })),
      ...atenciones.map((a: any) => ({
        titulo: 'ATENCION',
        detalle: a.diagnostico || a.motivoConsulta || 'Atencion medica',
        tiempo: a.fechaCreacionLocal || a.fechaHora || ''
      }))
    ]
      .filter(item => item.tiempo)
      .sort((a, b) => `${b.tiempo}`.localeCompare(`${a.tiempo}`))
      .slice(0, 8);
  }
}
