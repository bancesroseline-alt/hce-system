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
  mensaje = '';
  modoNuevaCita = false;

  fechaSeleccionada = new Date();
  diasCalendario: any[] = [];

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
    this.cargarPacientes();
    this.cargarMedicos();

    const pacienteId = Number(this.route.snapshot.paramMap.get('id'));

    if (pacienteId) {
      this.modoNuevaCita = true;
      this.cita.paciente.id = pacienteId;
    }

    this.cargarCitas();
  }

  cargarPacientes(): void {
    this.http.get<any[]>(`${this.api}/pacientes`)
      .subscribe({
        next: data => this.pacientes = data || [],
        error: err => console.error(err)
      });
  }

  cargarMedicos(): void {
    this.http.get<any[]>(`${this.api}/usuarios`)
      .subscribe({
        next: data => {
          this.medicos = (data || []).filter(u =>
            (u.rol || '').toUpperCase() === 'MEDICO'
          );
        },
        error: err => console.error(err)
      });
  }

  guardar(): void {

    if (!this.cita.paciente.id || !this.cita.medico.id) {
      this.mensaje = 'Debes seleccionar paciente y médico.';
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

    this.http.post(`${this.api}/citas`, payload)
      .subscribe({
        next: () => {
          this.mensaje = 'Cita registrada correctamente';
          this.limpiarFormulario();
          this.cargarCitas();
        },
        error: err => {
          console.error('ERROR BACKEND:', err);
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
  }

  cargarCitas(): void {
    this.http.get<any[]>(`${this.api}/citas`)
      .subscribe({
        next: data => {
          this.citas = data || [];
          this.filtrarCitasPorDia();
        },
        error: err => console.error(err)
      });
  }

  filtrarCitasPorDia(): void {
    const fechaISO = this.formatearFecha(this.fechaSeleccionada);
    this.citasDelDia = this.citas.filter(c => c.fecha === fechaISO);
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
