import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AtencionOfflineService } from '../../../services/atencion-offline.service';
import { CitaOfflineService } from '../../../services/cita-offline.service';
import { PacienteService } from '../../../services/paciente.service';
import { claseEstadoSync, etiquetaEstadoSync } from '../../../utils/sync-status.util';

@Component({
  selector: 'app-cita-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cita-detalle.component.html',
  styleUrl: './cita-detalle.component.css'
})
export class CitaDetalleComponent implements OnInit {

  citaId = '';
  cita: any = null;
  paciente: any = null;
  atenciones: any[] = [];
  cargando = true;
  mensaje = '';

  constructor(
    private route: ActivatedRoute,
    private citaOfflineService: CitaOfflineService,
    private atencionOfflineService: AtencionOfflineService,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {
    this.citaId = this.route.snapshot.paramMap.get('id') || '';
    this.cargarDetalle();
  }

  async cargarDetalle(): Promise<void> {
    this.cargando = true;
    this.mensaje = '';

    try {
      const citas = await firstValueFrom(this.citaOfflineService.listar());
      this.cita = (citas || []).find((c: any) =>
        String(c.id) === String(this.citaId) ||
        String(c.uuidLocal) === String(this.citaId)
      );

      if (!this.cita) {
        this.mensaje = 'No se encontro la cita solicitada.';
        this.cargando = false;
        return;
      }

      await Promise.all([
        this.cargarPaciente(),
        this.cargarAtenciones()
      ]);
    } catch (error) {
      console.error('Error al cargar detalle de cita', error);
      this.mensaje = 'No se pudo cargar el detalle de la cita.';
    } finally {
      this.cargando = false;
    }
  }

  pacienteId(): number | null {
    const id = this.cita?.pacienteId || this.cita?.paciente?.id;
    return id ? Number(id) : null;
  }

  nombrePaciente(): string {
    const paciente = this.paciente || this.cita?.paciente || {};
    const nombreCita = this.cita?.pacienteNombre || '';
    const nombre = `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim();

    return nombre || nombreCita || 'Sin paciente';
  }

  nombreProfesional(): string {
    const medico = this.cita?.medico || {};
    const nombre = `${medico.nombres || ''} ${medico.apellidos || ''}`.trim();

    return nombre || this.cita?.medicoNombre || 'Sin profesional';
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
      console.warn('No se pudo cargar paciente remoto para detalle de cita.', error);
      this.paciente = this.cita?.paciente || null;
    }
  }

  private async cargarAtenciones(): Promise<void> {
    const atenciones = await firstValueFrom(this.atencionOfflineService.listar());

    this.atenciones = (atenciones || [])
      .filter((a: any) =>
        String(a.citaId || a.cita?.id || '') === String(this.cita.id || this.cita.uuidLocal)
      )
      .sort((a: any, b: any) =>
        `${b.fechaHora || b.fechaCreacionLocal || ''}`.localeCompare(`${a.fechaHora || a.fechaCreacionLocal || ''}`)
      );
  }
}
