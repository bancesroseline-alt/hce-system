import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PacienteService } from '../../../services/paciente.service';
import { Paciente } from '../../../models/paciente.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './paciente-detalle.component.html',
  styleUrls: ['./paciente-detalle.component.css']
})
export class PacienteDetalleComponent implements OnInit {

  paciente: Paciente | null = null;
  mensaje = '';
  confirmandoBaja = false;
  bajaEnCurso = false;
  mensajeOk = '';

  constructor(
    private route: ActivatedRoute,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.mensaje = 'No se encontró el ID del paciente';
      return;
    }

    this.pacienteService.obtener(Number(id)).subscribe({
      next: data => {
        this.paciente = data;
      },
      error: err => {
        console.error('Error cargando paciente', err);
        this.paciente = null;
        this.mensaje = 'No se pudo cargar el paciente';
      }
    });
  }

  /** Da de baja al paciente tras la confirmacion. */
  confirmarBaja(): void {
    const paciente: any = this.paciente;

    if (!paciente) {
      return;
    }

    this.bajaEnCurso = true;

    this.pacienteService.baja(paciente.id || paciente.uuidLocal).subscribe({
      next: actualizado => {
        this.bajaEnCurso = false;
        this.confirmandoBaja = false;
        this.paciente = { ...paciente, ...(actualizado || {}), estado: false };
        this.mensajeOk = 'El paciente fue dado de baja.';
      },
      error: err => {
        console.error(err);
        this.bajaEnCurso = false;
        this.confirmandoBaja = false;
        this.mensaje = 'No se pudo dar de baja al paciente. Intenta nuevamente.';
      }
    });
  }
}
