import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PacienteService } from '../../services/paciente.service';
import { CitaOfflineService } from '../../services/cita-offline.service';
import { claseEstadoSync, etiquetaEstadoSync } from '../../utils/sync-status.util';

@Component({
  selector: 'app-paciente-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './paciente-citas.component.html',
  styleUrl: './paciente-citas.component.css'
})
export class PacienteCitasComponent implements OnInit {

  pacienteId!: number;
  paciente: any = null;

  citas: any[] = [];
  citasFiltradas: any[] = [];
  medicos: any[] = [];

  mensaje = '';
  cargando = true;

  filtroDesde = '';
  filtroHasta = '';
  filtroEstado = 'TODOS';

  citaEditando: any = null;
  modoEditar = false;

  constructor(
    private route: ActivatedRoute,
    private pacienteService: PacienteService,
    private citaOfflineService: CitaOfflineService
  ) {}

  etiquetaSync(valor: any): string {
    return etiquetaEstadoSync(valor);
  }

  claseSync(valor: any): string {
    return claseEstadoSync(valor);
  }

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('id'));

    this.cargarPaciente();
    this.cargarMedicos();
    this.cargarCitasPaciente();
  }

  cargarPaciente(): void {
    this.pacienteService.obtener(this.pacienteId)
      .subscribe({
        next: data => {
          this.paciente = data;
        },
        error: err => {
          console.error('Error al cargar paciente', err);
          this.mensaje = 'No se pudo cargar el paciente';
        }
      });
  }

  cargarCitasPaciente(): void {
    this.cargando = true;

    this.citaOfflineService.listarPorPaciente(this.pacienteId)
      .subscribe({
        next: data => {
          this.citas = data || [];
          this.aplicarFiltros();
          this.cargando = false;
        },
        error: err => {
          console.error('Error al cargar citas del paciente', err);
          this.citas = [];
          this.citasFiltradas = [];
          this.cargando = false;
        }
      });
  }

  cargarMedicos(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    this.citaOfflineService.listarMedicos()
      .subscribe({
        next: data => {
          this.medicos = (data || []).filter(u => this.normalizarRol(u.rol) === 'MEDICO');

          if (
            this.normalizarRol(usuario.rol) === 'MEDICO' &&
            usuario.id &&
            !this.medicos.some(m => Number(m.id) === Number(usuario.id))
          ) {
            this.medicos.push(usuario);
          }
        },
        error: err => {
          console.error('Error al cargar médicos', err);

          if (this.normalizarRol(usuario.rol) === 'MEDICO' && usuario.id) {
            this.medicos = [usuario];
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

  aplicarFiltros(): void {
    this.citasFiltradas = this.citas.filter(c => {
      const cumpleDesde = !this.filtroDesde || c.fecha >= this.filtroDesde;
      const cumpleHasta = !this.filtroHasta || c.fecha <= this.filtroHasta;
      const cumpleEstado = this.filtroEstado === 'TODOS' || c.estado === this.filtroEstado;

      return cumpleDesde && cumpleHasta && cumpleEstado;
    });
  }

  limpiarFiltros(): void {
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.filtroEstado = 'TODOS';
    this.aplicarFiltros();
  }

  abrirDetalle(cita: any): void {
    this.citaEditando = {
      id: cita.id,
      pacienteId: cita.pacienteId || this.pacienteId,
      medicoId: cita.medicoId,
      tipoCita: cita.tipoCita,
      fecha: cita.fecha,
      hora: cita.hora,
      especialidad: cita.especialidad,
      motivoConsulta: cita.motivoConsulta,
      estado: cita.estado
    };

    this.modoEditar = true;
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.modoEditar = false;
    this.citaEditando = null;
  }

  guardarCambios(): void {
    if (!this.citaEditando.tipoCita) {
      this.mensaje = 'El tipo de cita es obligatorio';
      return;
    }

    if (!this.citaEditando.fecha) {
      this.mensaje = 'La fecha es obligatoria';
      return;
    }

    if (!this.citaEditando.hora) {
      this.mensaje = 'La hora es obligatoria';
      return;
    }

    if (!this.citaEditando.especialidad?.trim()) {
      this.mensaje = 'La especialidad es obligatoria';
      return;
    }

    if (!this.citaEditando.motivoConsulta?.trim()) {
      this.mensaje = 'El motivo de consulta es obligatorio';
      return;
    }

    if (!this.citaEditando.medicoId) {
      this.mensaje = 'El médico es obligatorio';
      return;
    }

    const payload = {
      pacienteId: Number(this.pacienteId),
      medicoId: Number(this.citaEditando.medicoId),
      tipoCita: this.citaEditando.tipoCita,
      fecha: this.citaEditando.fecha,
      hora: this.citaEditando.hora,
      especialidad: this.citaEditando.especialidad,
      motivoConsulta: this.citaEditando.motivoConsulta,
      estado: this.citaEditando.estado
    };

    this.citaOfflineService.actualizar({
      ...this.citaEditando,
      ...payload
    })
      .subscribe({
        next: () => {
          this.mensaje = navigator.onLine
            ? 'Cita actualizada correctamente'
            : 'Cita actualizada offline. Se sincronizara cuando vuelva internet';
          this.modoEditar = false;
          this.citaEditando = null;
          this.cargarCitasPaciente();
        },
        error: err => {
          console.error('Error al editar cita', err);
          this.mensaje = err.error?.message || 'Error al actualizar la cita';
        }
      });
  }

  obtenerNombreMedico(id: number): string {
    const medico = this.medicos.find(m => Number(m.id) === Number(id));
    if (!medico) return 'Sin médico';

    return `${medico.nombres || ''} ${medico.apellidos || ''}`.trim() || medico.username;
  }

  calcularRiesgo(cita: any): number {
    if (!cita) return 18;

    if (cita.estado === 'CANCELADA') return 75;
    if (cita.estado === 'NO_ASISTIO') return 85;
    if (cita.tipoCita === 'PREVENTIVA') return 18;

    return 32;
  }

  textoRiesgo(cita: any): string {
    const riesgo = this.calcularRiesgo(cita);

    if (riesgo < 30) return 'Riesgo bajo';
    if (riesgo < 60) return 'Riesgo medio';
    return 'Riesgo alto';
  }
}
