import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { IndexedDbService } from '../../services/indexed-db.service';

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
  rolUsuario = 'Médico';

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
      'Médico';

    const medicoId = usuario.id || 2;

    this.http.get<any>(
      `https://hce-backend.onrender.com/api/dashboard/medico/${medicoId}`
    ).subscribe({
      next: async (data) => {
        this.modoOffline = false;
        this.cargarDatos(data);

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
          return;
        }

        await this.cargarDashboardDesdeIndexedDb();
      }
    });
  }

  actualizarEstadoConexion(): void {
    this.sistemaOnline = navigator.onLine;
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

    this.actividades = [
      ...pacientes.slice(-3).map((p: any) => ({
        titulo: 'Paciente registrado',
        detalle: `${p.nombres || ''} ${p.apellidos || ''}`,
        tiempo: p.fechaCreacionLocal || 'Registro local'
      })),
      ...citas.slice(-3).map((c: any) => ({
        titulo: 'Cita registrada',
        detalle: c.motivoConsulta || c.motivo || 'Cita médica',
        tiempo: c.fechaCreacionLocal || 'Registro local'
      })),
      ...atenciones.slice(-3).map((a: any) => ({
        titulo: 'Atención registrada',
        detalle: a.diagnostico || a.motivoConsulta || 'Atención médica',
        tiempo: a.fechaCreacionLocal || 'Registro local'
      }))
    ].slice(-5).reverse();
  }
}