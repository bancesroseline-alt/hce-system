import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  diasSemana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

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

    if (pacienteId) {
      this.modoNuevaCita = true;
      this.cita.paciente.id = pacienteId;
    }

    this.cargarPacientes();
    this.cargarMedicos();
    this.cargarCitas();
  }

  getHeaders() {
    const token = localStorage.getItem('token');

    if (!token) return {};

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  cargarCitas(): void {
    this.http.get<any[]>(`${this.api}/citas`, this.getHeaders()).subscribe({
      next: data => {
        this.citas = data || [];
        this.filtrarCitasPorDia();
        this.generarCalendario();
      },
      error: err => console.error('Error al cargar citas', err)
    });
  }

  cargarPacientes(): void {
    this.http.get<any[]>(`${this.api}/pacientes`, this.getHeaders()).subscribe({
      next: data => {
        this.pacientes = data || [];

        if (this.cita.paciente.id) {
          const p = this.pacientes.find(x => Number(x.id) === Number(this.cita.paciente.id));

          if (p) {
            this.busquedaPaciente = `${p.nombres} ${p.apellidos} - DNI ${p.numeroDocumento}`;
          }
        }
      },
      error: err => {
        console.error('Error al cargar pacientes', err);
        this.pacientes = [];
      }
    });
  }

  cargarMedicos(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    this.http.get<any[]>(`${this.api}/usuarios`, this.getHeaders()).subscribe({
      next: data => {
        this.medicos = (data || []).filter(u => this.normalizarRol(u.rol) === 'MEDICO');

        if (
          this.normalizarRol(usuario.rol) === 'MEDICO' &&
          usuario.id &&
          !this.medicos.some(m => Number(m.id) === Number(usuario.id))
        ) {
          this.medicos.push(usuario);
        }

        if (usuario.id && this.normalizarRol(usuario.rol) === 'MEDICO') {
          this.cita.medico.id = usuario.id;
          this.busquedaMedico = this.obtenerNombreUsuario(usuario);
        }
      },
      error: err => {
        console.error('Error al cargar médicos', err);

        if (this.normalizarRol(usuario.rol) === 'MEDICO' && usuario.id) {
          this.medicos = [usuario];
          this.cita.medico.id = usuario.id;
          this.busquedaMedico = this.obtenerNombreUsuario(usuario);
        } else {
          this.medicos = [];
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

  obtenerNombreUsuario(usuario: any): string {
    const nombres = usuario.nombres || usuario.nombre || '';
    const apellidos = usuario.apellidos || '';
    const username = usuario.username || '';

    return `${nombres} ${apellidos}`.trim() || username || 'Médico';
  }

  pacientesFiltrados(): any[] {
    const q = this.busquedaPaciente.trim().toLowerCase();

    if (!q) return this.pacientes;

    return this.pacientes.filter(p =>
      `${p.id || ''}`.includes(q) ||
      `${p.nombres || ''}`.toLowerCase().includes(q) ||
      `${p.apellidos || ''}`.toLowerCase().includes(q) ||
      `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase().includes(q) ||
      `${p.numeroDocumento || ''}`.includes(q)
    );
  }

  medicosFiltrados(): any[] {
    const q = this.busquedaMedico.trim().toLowerCase();

    if (!q) return this.medicos;

    return this.medicos.filter(m =>
      `${m.id || ''}`.includes(q) ||
      this.obtenerNombreUsuario(m).toLowerCase().includes(q) ||
      `${m.username || ''}`.toLowerCase().includes(q)
    );
  }

  seleccionarPaciente(p: any): void {
    this.cita.paciente.id = p.id;
    this.busquedaPaciente = `${p.nombres} ${p.apellidos} - DNI ${p.numeroDocumento}`;
  }

  seleccionarMedico(m: any): void {
    this.cita.medico.id = m.id;
    this.busquedaMedico = this.obtenerNombreUsuario(m);
  }

  limpiarPaciente(): void {
    this.cita.paciente.id = null;
    this.busquedaPaciente = '';
  }

  limpiarMedico(): void {
    this.cita.medico.id = null;
    this.busquedaMedico = '';
  }

  // =========================
// GUARDAR
// =========================

guardar(): void {

  if (!this.cita.paciente.id || !this.cita.medico.id) {
    this.mensaje = 'Paciente y médico son obligatorios';
    return;
  }

  if (!this.cita.fecha || !this.cita.hora) {
    this.mensaje = 'Fecha y hora son obligatorias';
    return;
  }

  const payload = {
    pacienteId: Number(this.cita.paciente.id),
    medicoId: Number(this.cita.medico.id),
    tipoCita: this.cita.tipoCita,
    fecha: this.cita.fecha,
    hora: this.cita.hora,
    especialidad: this.cita.especialidad,
    motivoConsulta: this.cita.motivoConsulta,
    estado: this.cita.estado
  };

  console.log('Payload cita:', payload);

  this.http.post(`${this.api}/citas`, payload, this.getHeaders()).subscribe({
    next: () => {
      this.mensaje = 'Cita registrada correctamente';
      this.modoNuevaCita = false;
      this.limpiarFormulario();
      this.cargarCitas();
    },
    error: err => {
      console.error('Error al guardar cita', err);
      this.mensaje = err.error?.message || 'Error al guardar cita';
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
