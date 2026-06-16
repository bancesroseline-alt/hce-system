import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AtencionOfflineService } from '../../../services/atencion-offline.service';
import { CitaOfflineService } from '../../../services/cita-offline.service';
import { PacienteService } from '../../../services/paciente.service';
import { claseEstadoSync, etiquetaEstadoSync } from '../../../utils/sync-status.util';

@Component({
  selector: 'app-atencion-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
