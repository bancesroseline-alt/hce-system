import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrazabilidadService } from '../../services/trazabilidad.service';

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trazabilidad.component.html',
  styleUrl: './trazabilidad.component.css'
})
export class TrazabilidadComponent {

  entityType = 'ATENCION';
  entityId: number | null = null;
  atencionId: number | null = null;
  historial: any[] = [];
  resultadoValidacion: any = null;
  mensaje = '';
  cargando = false;
  verificando = false;

  tiposEntidad = [
    { value: 'ATENCION', label: 'Atencion medica' },
    { value: 'CITA', label: 'Cita' },
    { value: 'PACIENTE', label: 'Paciente' },
    { value: 'HISTORIA_CLINICA', label: 'Historia clinica' }
  ];

  constructor(private trazabilidadService: TrazabilidadService) {}

  consultar(): void {
    this.mensaje = '';
    this.resultadoValidacion = null;

    if (!this.entityId) {
      this.mensaje = 'Ingrese el ID del registro';
      return;
    }

    this.cargando = true;

    this.trazabilidadService.historialPorEntidad(this.entityType, this.entityId).subscribe({
      next: data => {
        this.historial = data || [];
        this.cargando = false;
      },
      error: err => {
        console.error('Error consultando trazabilidad', err);
        this.mensaje = 'No se pudo consultar la trazabilidad';
        this.cargando = false;
      }
    });
  }

  validar(): void {
    this.mensaje = '';
    this.resultadoValidacion = null;

    if (!this.entityId) {
      this.mensaje = 'Ingrese el ID del registro';
      return;
    }

    this.verificando = true;

    this.trazabilidadService.verificarIntegridad(this.entityType, this.entityId).subscribe({
      next: data => {
        this.resultadoValidacion = data;
        this.verificando = false;
        this.consultar();
      },
      error: err => {
        console.error('Error validando integridad', err);
        this.mensaje = 'No se pudo validar la integridad';
        this.verificando = false;
      }
    });
  }
}
