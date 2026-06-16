import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PacienteService } from '../../services/paciente.service';
import { CitaOfflineService } from '../../services/cita-offline.service';
import { PrediccionService } from '../../services/prediccion.service';
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
  prediccionInasistencia: any = null;
  cargandoPrediccion = false;
  errorPrediccion = '';
  private prediccionTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private pacienteService: PacienteService,
    private citaOfflineService: CitaOfflineService,
    private prediccionService: PrediccionService
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
          this.medicos = (data || []).filter(u => this.esProfesionalCita(u.rol));

          if (
            this.esProfesionalCita(usuario.rol) &&
            usuario.id &&
            !this.medicos.some(m => Number(m.id) === Number(usuario.id))
          ) {
            this.medicos.push(usuario);
          }
        },
        error: err => {
          console.error('Error al cargar médicos', err);

          if (this.esProfesionalCita(usuario.rol) && usuario.id) {
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

  esProfesionalCita(rol: any): boolean {
    return ['MEDICO', 'ENFERMERO'].includes(this.normalizarRol(rol));
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
    this.cargarPrediccionReal();
  }

  cancelarEdicion(): void {
    this.modoEditar = false;
    this.citaEditando = null;
    this.prediccionInasistencia = null;
    this.errorPrediccion = '';
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
      this.mensaje = 'El profesional es obligatorio';
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
    if (!medico) return 'Sin profesional';

    return `${medico.nombres || ''} ${medico.apellidos || ''}`.trim() || medico.username;
  }

  programarPrediccion(): void {
    clearTimeout(this.prediccionTimer);
    this.prediccionTimer = setTimeout(() => this.cargarPrediccionReal(), 350);
  }

  cargarPrediccionReal(): void {
    if (!this.citaEditando || !this.paciente) {
      return;
    }

    this.cargandoPrediccion = true;
    this.errorPrediccion = '';

    this.prediccionService.predecirConModelo(this.construirCitaParaModelo())
      .subscribe({
        next: data => {
          this.prediccionInasistencia = data;
          this.cargandoPrediccion = false;
        },
        error: err => {
          console.error('Error al calcular prediccion real de inasistencia', err);
          this.prediccionInasistencia = null;
          this.errorPrediccion = 'No se pudo obtener la prediccion real del modelo ML.';
          this.cargandoPrediccion = false;
        }
      });
  }

  porcentajeRiesgo(): number {
    const probabilidad = Number(this.prediccionInasistencia?.probabilidadInasistencia);

    if (Number.isNaN(probabilidad)) {
      return 0;
    }

    const porcentaje = probabilidad > 1 ? probabilidad : probabilidad * 100;
    return Math.max(0, Math.min(100, Math.round(porcentaje)));
  }

  textoRiesgo(): string {
    const nivel = this.prediccionInasistencia?.nivelRiesgo;

    if (nivel === 'ALTO') return 'Riesgo alto';
    if (nivel === 'MEDIO') return 'Riesgo medio';
    if (nivel === 'BAJO') return 'Riesgo bajo';

    const riesgo = this.porcentajeRiesgo();

    if (riesgo < 30) return 'Riesgo bajo';
    if (riesgo < 60) return 'Riesgo medio';
    return 'Riesgo alto';
  }

  fondoRiesgo(): string {
    const porcentaje = this.porcentajeRiesgo();
    const color = porcentaje >= 70 ? '#ef4444' : porcentaje >= 40 ? '#f59e0b' : '#10b981';

    return `conic-gradient(${color} 0 ${porcentaje}%, #e5e7eb ${porcentaje}% 100%)`;
  }

  private construirCitaParaModelo(): any {
    const citasPrevias = this.citas.filter(c =>
      Number(c.id) !== Number(this.citaEditando.id) &&
      (!this.citaEditando.fecha || !c.fecha || c.fecha <= this.citaEditando.fecha)
    );

    return {
      ...this.citaEditando,
      pacienteId: this.citaEditando.pacienteId || this.pacienteId,
      edad: this.paciente?.edad || 0,
      sexo: this.paciente?.sexo || '',
      diaSemana: this.obtenerDiaSemana(this.citaEditando.fecha),
      antecedentesInasistencias: citasPrevias.filter(c => c.estado === 'NO_ASISTIO').length,
      cantidadCitasPrevias: citasPrevias.length
    };
  }

  private obtenerDiaSemana(fecha: string): string {
    if (!fecha) return 'MONDAY';

    const dias = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return dias[new Date(`${fecha}T00:00:00`).getDay()];
  }
}
