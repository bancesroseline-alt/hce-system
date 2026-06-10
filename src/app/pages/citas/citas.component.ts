import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent implements OnInit {

  api = 'https://hce-backend.onrender.com/api';

  citas: any[] = [];
  citasDelDia: any[] = [];

  pacientes: any[] = [];
  medicos: any[] = [];

  busquedaPaciente = '';
  busquedaMedico = '';

  mensaje = '';
  modoNuevaCita = false;

  fechaSeleccionada: Date = new Date();
  diasCalendario: any[] = [];

  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  cita: any = {
    paciente: { id: null },
    medico: { id: null },
    tipoCita: 'CONSULTA',
    fecha: '',
    hora: '',
    especialidad: '',
    motivoConsulta: '',
    estado: 'PROGRAMADA'
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const pacienteId = Number(this.route.snapshot.paramMap.get('id'));

    this.cargarPacientes();
    this.cargarMedicos();
    this.cargarCitas();

    if (pacienteId) {
      this.modoNuevaCita = true;
      this.cita.paciente.id = pacienteId;
    }
  }

  cargarCitas(): void {
    this.http.get<any[]>(`${this.api}/citas`).subscribe({
      next: data => {
        this.citas = data || [];
        this.filtrarCitasPorDia();
        this.generarCalendario();
      },
      error: error => {
        console.error('Error al cargar citas', error);
      }
    });
  }

  cargarPacientes(): void {
    this.http.get<any[]>(`${this.api}/pacientes`).subscribe({
      next: data => {
        this.pacientes = data || [];

        if (this.cita.paciente.id) {
          const pacienteSeleccionado = this.pacientes.find(
            p => Number(p.id) === Number(this.cita.paciente.id)
          );

          if (pacienteSeleccionado) {
            this.busquedaPaciente =
              `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos} - DNI ${pacienteSeleccionado.numeroDocumento}`;
          }
        }
      },
      error: error => {
        console.error('Error al cargar pacientes', error);
      }
    });
  }

  cargarMedicos(): void {
    const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

    this.http.get<any[]>(`${this.api}/usuarios`).subscribe({
      next: data => {
        const usuarios = data || [];

        this.medicos = usuarios.filter(u => this.normalizarRol(u.rol) === 'MEDICO');

        if (
          this.normalizarRol(usuarioActual.rol) === 'MEDICO' &&
          usuarioActual.id &&
          !this.medicos.some(m => Number(m.id) === Number(usuarioActual.id))
        ) {
          this.medicos.push(usuarioActual);
        }

        if (!this.cita.medico.id && usuarioActual.id && this.normalizarRol(usuarioActual.rol) === 'MEDICO') {
          this.cita.medico.id = usuarioActual.id;
          this.busquedaMedico = this.obtenerNombreUsuario(usuarioActual);
        }

        if (this.medicos.length === 1 && !this.cita.medico.id) {
          this.cita.medico.id = this.medicos[0].id;
          this.busquedaMedico = this.obtenerNombreUsuario(this.medicos[0]);
        }
      },
      error: error => {
        console.error('Error al cargar médicos', error);

        if (this.normalizarRol(usuarioActual.rol) === 'MEDICO' && usuarioActual.id) {
          this.medicos = [usuarioActual];
          this.cita.medico.id = usuarioActual.id;
          this.busquedaMedico = this.obtenerNombreUsuario(usuarioActual);
        }
      }
    });
  }

  normalizarRol(rol: any): string {
    return (rol || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace('ROLE_', '')
      .toUpperCase();
  }

  pacientesFiltrados(): any[] {
    const q = this.busquedaPaciente.trim().toLowerCase();

    if (!q) return [];

    return this.pacientes.filter(p =>
      `${p.id}`.includes(q) ||
      `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase().includes(q) ||
      `${p.numeroDocumento || ''}`.includes(q)
    );
  }

  medicosFiltrados(): any[] {
    const q = this.busquedaMedico.trim().toLowerCase();

    if (!q) return [];

    return this.medicos.filter(m =>
      `${m.id}`.includes(q) ||
      this.obtenerNombreUsuario(m).toLowerCase().includes(q) ||
      `${m.username || ''}`.toLowerCase().includes(q)
    );
  }

  seleccionarPaciente(paciente: any): void {
    this.cita.paciente.id = paciente.id;
    this.busquedaPaciente =
      `${paciente.nombres} ${paciente.apellidos} - DNI ${paciente.numeroDocumento}`;
  }

  seleccionarMedico(medico: any): void {
    this.cita.medico.id = medico.id;
    this.busquedaMedico = this.obtenerNombreUsuario(medico);
  }

  limpiarPaciente(): void {
    this.cita.paciente.id = null;
    this.busquedaPaciente = '';
  }

  limpiarMedico(): void {
    this.cita.medico.id = null;
    this.busquedaMedico = '';
  }

  obtenerNombreUsuario(usuario: any): string {
    return usuario.nombres || usuario.nombre || usuario.username || 'Usuario';
  }

  guardar(): void {
    if (!this.cita.paciente.id || !this.cita.medico.id) {
      this.mensaje = 'Paciente y médico son obligatorios';
      return;
    }

    const payload = {
      paciente: { id: Number(this.cita.paciente.id) },
      medico: { id: Number(this.cita.medico.id) },
      tipoCita: this.cita.tipoCita,
      fecha: this.cita.fecha,
      hora: this.cita.hora,
      especialidad: this.cita.especialidad,
      motivoConsulta: this.cita.motivoConsulta,
      estado: this.cita.estado
    };

    this.http.post(`${this.api}/citas`, payload).subscribe({
      next: () => {
        this.mensaje = 'Cita registrada correctamente';
        this.modoNuevaCita = false;
        this.limpiarFormulario();
        this.cargarCitas();
      },
      error: error => {
        console.error('Error al guardar cita', error);
        this.mensaje = 'Error al guardar cita';
      }
    });
  }

  limpiarFormulario(): void {
    this.cita = {
      paciente: { id: null },
      medico: { id: null },
      tipoCita: 'CONSULTA',
      fecha: '',
      hora: '',
      especialidad: '',
      motivoConsulta: '',
      estado: 'PROGRAMADA'
    };

    this.busquedaPaciente = '';
    this.busquedaMedico = '';
  }

  get nombreMesActual(): string {
    return `${this.meses[this.fechaSeleccionada.getMonth()]} ${this.fechaSeleccionada.getFullYear()}`;
  }

  mesAnterior(): void {
    this.fechaSeleccionada = new Date(
      this.fechaSeleccionada.getFullYear(),
      this.fechaSeleccionada.getMonth() - 1,
      1
    );

    this.generarCalendario();
    this.filtrarCitasPorDia();
  }

  mesSiguiente(): void {
    this.fechaSeleccionada = new Date(
      this.fechaSeleccionada.getFullYear(),
      this.fechaSeleccionada.getMonth() + 1,
      1
    );

    this.generarCalendario();
    this.filtrarCitasPorDia();
  }

  generarCalendario(): void {
    const year = this.fechaSeleccionada.getFullYear();
    const month = this.fechaSeleccionada.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    let start = first.getDay();
    start = start === 0 ? 6 : start - 1;

    this.diasCalendario = [];

    for (let i = 0; i < start; i++) {
      this.diasCalendario.push({
        dia: '',
        fecha: null,
        tieneCitas: false,
        seleccionado: false
      });
    }

    for (let d = 1; d <= last.getDate(); d++) {
      const fecha = new Date(year, month, d);
      const iso = this.formatearFecha(fecha);

      this.diasCalendario.push({
        dia: d,
        fecha: iso,
        tieneCitas: this.citas.some(c => c.fecha === iso),
        seleccionado: iso === this.formatearFecha(this.fechaSeleccionada)
      });
    }
  }

  seleccionarDia(item: any): void {
    if (!item.fecha) return;

    this.fechaSeleccionada = new Date(item.fecha + 'T00:00:00');
    this.filtrarCitasPorDia();
    this.generarCalendario();
  }

  filtrarCitasPorDia(): void {
    const iso = this.formatearFecha(this.fechaSeleccionada);
    this.citasDelDia = this.citas.filter(c => c.fecha === iso);
  }

  formatearFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  contarPorEstado(estado: string): number {
    return this.citasDelDia.filter(c => c.estado === estado).length;
  }
}
