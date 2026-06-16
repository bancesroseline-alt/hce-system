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

  atencionId: number | null = null;
  historial: any[] = [];
  resultadoValidacion = '';
  mensaje = '';
  cargando = false;

  constructor(private trazabilidadService: TrazabilidadService) {}

  consultar(): void {
    this.mensaje = '';
    this.resultadoValidacion = '';

    if (!this.atencionId) {
      this.mensaje = 'Ingrese el ID de una atencion medica';
      return;
    }

    this.cargando = true;

    this.trazabilidadService.historialPorAtencion(this.atencionId).subscribe({
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

    if (!this.atencionId) {
      this.mensaje = 'Ingrese el ID de una atencion medica';
      return;
    }

    this.trazabilidadService.validarIntegridad(this.atencionId).subscribe({
      next: data => this.resultadoValidacion = data,
      error: err => {
        console.error('Error validando integridad', err);
        this.mensaje = 'No se pudo validar la integridad';
      }
    });
  }
}
