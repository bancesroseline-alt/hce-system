import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AtencionOfflineService } from '../../../services/atencion-offline.service';
import { CitaOfflineService } from '../../../services/cita-offline.service';
import { PacienteService } from '../../../services/paciente.service';
import { claseEstadoSync, etiquetaEstadoSync } from '../../../utils/sync-status.util';

@Component({
  selector: 'app-atencion-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './atencion-detalle.component.html',
  styleUrl: './atencion-detalle.component.css'
})
export class AtencionDetalleComponent implements OnInit {

  atencionId = '';
  atencion: any = null;
  paciente: any = null;
  cita: any = null;
  cargando = true;
  mensaje = '';
  editando = false;
  guardando = false;
  copiaOriginal: any = null;

  constructor(
    private route: ActivatedRoute,
    private atencionOfflineService: AtencionOfflineService,
    private citaOfflineService: CitaOfflineService,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {
    this.atencionId = this.route.snapshot.paramMap.get('id') || '';
    this.cargarDetalle();
  }

  async cargarDetalle(): Promise<void> {
    this.cargando = true;
    this.mensaje = '';

    try {
      const atenciones = await firstValueFrom(this.atencionOfflineService.listar());
      this.atencion = (atenciones || []).find((item: any) =>
        String(item.id) === String(this.atencionId) ||
        String(item.uuidLocal) === String(this.atencionId)
      );

      if (!this.atencion) {
        this.mensaje = 'No se encontro la atencion medica solicitada.';
        return;
      }

      await Promise.all([
        this.cargarPaciente(),
        this.cargarCita()
      ]);
    } catch (error) {
      console.error('Error al cargar detalle de atencion', error);
      this.mensaje = 'No se pudo cargar el detalle de la atencion medica.';
    } finally {
      this.cargando = false;
    }
  }

  pacienteId(): number | null {
    const id = this.atencion?.pacienteId || this.atencion?.paciente?.id;
    return id ? Number(id) : null;
  }

  citaId(): string {
    return String(this.atencion?.citaId || this.atencion?.cita?.id || '');
  }

  nombrePaciente(): string {
    const nombre = `${this.paciente?.nombres || ''} ${this.paciente?.apellidos || ''}`.trim();
    return nombre || this.atencion?.pacienteNombre || 'Sin paciente';
  }

  nombreProfesional(): string {
    return this.atencion?.profesionalSalud || this.atencion?.usuarioNombre || 'Sin profesional';
  }

  fechaHoraInput(): string {
    const valor = this.atencion?.fechaHora || '';
    return valor ? String(valor).slice(0, 16) : '';
  }

  etiquetaSync(valor: any): string {
    return etiquetaEstadoSync(valor);
  }

  claseSync(valor: any): string {
    return claseEstadoSync(valor);
  }

  /** Solo el profesional que registro la atencion puede editarla. */
  get puedeEditar(): boolean {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const autorId = this.atencion?.usuarioId ?? this.atencion?.usuario?.id;

      return !!usuario?.id && autorId !== undefined && autorId !== null && Number(usuario.id) === Number(autorId);
    } catch {
      return false;
    }
  }

  iniciarEdicion(): void {
    if (!this.puedeEditar) {
      this.mensaje = 'Solo el médico que registró esta atención puede editarla.';
      return;
    }

    this.copiaOriginal = JSON.parse(JSON.stringify(this.atencion));
    this.editando = true;
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.atencion = this.copiaOriginal;
    this.copiaOriginal = null;
    this.editando = false;
  }

  guardarCambios(): void {
    const faltantes: string[] = [];

    if (!String(this.atencion?.motivoConsulta || '').trim()) faltantes.push('Motivo de consulta');
    if (!String(this.atencion?.diagnostico || '').trim()) faltantes.push('Diagnóstico');

    if (faltantes.length > 0) {
      this.mensaje = `Complete los campos obligatorios: ${faltantes.join(', ')}.`;
      return;
    }

    this.guardando = true;
    this.atencionOfflineService.actualizar(this.atencion).subscribe({
      next: actualizada => {
        this.atencion = actualizada;
        this.editando = false;
        this.guardando = false;
        this.copiaOriginal = null;
        this.mensaje = navigator.onLine
          ? 'Atencion medica actualizada correctamente.'
          : 'Cambio guardado offline. Se sincronizara al recuperar conexion.';
      },
      error: (err: any) => {
        this.guardando = false;
        this.mensaje = err?.status === 403
          ? 'Solo el médico que registró esta atención puede editarla.'
          : 'No se pudo actualizar la atencion medica.';
      }
    });
  }

  private async cargarPaciente(): Promise<void> {
    const pacienteId = this.pacienteId();
    if (!pacienteId) return;

    try {
      this.paciente = await firstValueFrom(this.pacienteService.obtener(pacienteId));
    } catch (error) {
      console.warn('No se pudo cargar paciente para detalle de atencion.', error);
    }
  }

  private async cargarCita(): Promise<void> {
    const citaId = this.citaId();
    if (!citaId) return;

    const citas = await firstValueFrom(this.citaOfflineService.listar());
    this.cita = (citas || []).find((item: any) =>
      String(item.id) === citaId ||
      String(item.uuidLocal) === citaId
    );
  }
}
