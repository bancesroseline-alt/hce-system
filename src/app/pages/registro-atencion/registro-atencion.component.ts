import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registro-atencion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-atencion.component.html',
  styleUrls: ['./registro-atencion.component.css']
})
export class RegistroAtencionComponent implements OnInit {

  paciente: any = null;
  pacienteId!: number;

  citaId: number | null = null;
  citaOrigen: any = null;

  modoEmergencia = false;
  mensaje = '';

  private api = 'https://hce-backend.onrender.com/api';

  atencion: any = {
    pacienteId: null,
    usuarioId: null,
    fechaHora: '',
    tipoAtencion: '',
    motivoConsulta: '',
    presionArterial: '',
    temperatura: null,
    saturacion: null,
    talla: null,
    peso: null,
    diagnostico: '',
    observaciones: '',
    tratamientoIndicado: '',
    medicamentos: '',
    estado: 'COMPLETADA',
    citaId: null
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const pacienteParam =
  this.route.snapshot.paramMap.get('pacienteId') ||
  this.route.snapshot.paramMap.get('id');

    const citaParam = this.route.snapshot.paramMap.get('citaId');
    
    this.pacienteId = Number(pacienteParam);
    this.citaId = citaParam ? Number(citaParam) : null;

    this.modoEmergencia = this.router.url.includes('/emergencia/');

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    this.atencion.pacienteId = this.pacienteId;
    this.atencion.usuarioId = usuario.id || 2;
    this.atencion.estado = 'COMPLETADA';

    if (!this.pacienteId || isNaN(this.pacienteId)) {
      this.mensaje = 'Paciente inválido';
      return;
    }

    this.cargarPaciente();

    if (this.modoEmergencia) {
      this.prepararEmergencia();
    } else if (this.citaId) {
      this.cargarCita(this.citaId);
    } else {
      this.prepararAtencionManual();
    }
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

  cargarPaciente(): void {
    this.http.get<any>(
      `${this.api}/pacientes/${this.pacienteId}`,
      this.getHeaders()
    ).subscribe({
      next: data => {
        this.paciente = data;
      },
      error: error => {
        console.error('Error al cargar paciente', error);
        this.mensaje = 'No se pudo cargar el paciente';
      }
    });
  }

  prepararEmergencia(): void {
    this.citaOrigen = null;

    this.atencion.fechaHora = this.obtenerFechaHoraActualLocal();
    this.atencion.tipoAtencion = 'EMERGENCIA';
    this.atencion.motivoConsulta = '';
    this.atencion.citaId = null;
  }

  prepararAtencionManual(): void {
    this.citaOrigen = null;

    this.atencion.fechaHora = this.obtenerFechaHoraActualLocal();
    this.atencion.tipoAtencion = 'CONSULTA';
    this.atencion.citaId = null;
  }

  cargarCita(id: number): void {
    this.http.get<any[]>(
      `${this.api}/citas`,
      this.getHeaders()
    ).subscribe({
      next: citas => {
        const cita = (citas || []).find(c => Number(c.id) === Number(id));

        if (!cita) {
          this.mensaje = 'No se encontró la cita seleccionada';
          return;
        }

        this.citaOrigen = cita;

        this.atencion.citaId = cita.id;
        this.atencion.fechaHora = `${cita.fecha}T${cita.hora}`;
        this.atencion.tipoAtencion =
          cita.tipoCita === 'PREVENTIVA' ? 'PREVENTIVA' : 'CONSULTA';
        this.atencion.motivoConsulta = cita.motivoConsulta || '';
      },
      error: err => {
        console.error('Error al cargar cita', err);
        this.mensaje = 'Error al cargar datos de la cita';
      }
    });
  }

  obtenerFechaHoraActualLocal(): string {
    const ahora = new Date();

    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    const hours = String(ahora.getHours()).padStart(2, '0');
    const minutes = String(ahora.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  guardarAtencion(): void {
    this.mensaje = '';

    if (!this.atencion.pacienteId) {
      this.mensaje = 'El paciente es obligatorio';
      return;
    }

    if (!this.atencion.usuarioId) {
      this.mensaje = 'El profesional de salud es obligatorio';
      return;
    }

    if (!this.atencion.fechaHora) {
      this.mensaje = 'La fecha y hora son obligatorias';
      return;
    }

    if (!this.atencion.tipoAtencion) {
      this.mensaje = 'El tipo de atención es obligatorio';
      return;
    }

    if (!this.atencion.motivoConsulta?.trim()) {
      this.mensaje = 'El motivo de consulta es obligatorio';
      return;
    }

    if (!this.atencion.diagnostico?.trim()) {
      this.mensaje = 'El diagnóstico es obligatorio';
      return;
    }

    if (!this.atencion.tratamientoIndicado?.trim()) {
      this.mensaje = 'El tratamiento indicado es obligatorio';
      return;
    }

    const payload = {
      pacienteId: Number(this.atencion.pacienteId),
      usuarioId: Number(this.atencion.usuarioId),
      fechaHora: this.atencion.fechaHora,
      tipoAtencion: this.atencion.tipoAtencion,
      motivoConsulta: this.atencion.motivoConsulta,
      presionArterial: this.atencion.presionArterial,
      temperatura: this.atencion.temperatura,
      saturacion: this.atencion.saturacion,
      talla: this.atencion.talla,
      peso: this.atencion.peso,
      diagnostico: this.atencion.diagnostico,
      observaciones: this.atencion.observaciones,
      tratamientoIndicado: this.atencion.tratamientoIndicado,
      medicamentos: this.atencion.medicamentos,
      estado: 'COMPLETADA',
      citaId: this.atencion.citaId ? Number(this.atencion.citaId) : null
    };

    console.log('Payload atención:', payload);

    this.http.post(
      `${this.api}/atenciones`,
      payload,
      this.getHeaders()
    ).subscribe({
      next: () => {
        this.router.navigate(['/historias-clinicas', this.pacienteId]);
      },
      error: err => {
        console.error('Error al guardar atención', err);
        this.mensaje = err.error?.message || 'Error al registrar atención';
      }
    });
  }
}
