import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PacienteService } from '../../services/paciente.service';
import { Paciente } from '../../models/paciente.model';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { claseEstadoSync, etiquetaEstadoSync } from '../../utils/sync-status.util';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {

  pacientes: Paciente[] = [];

  pacienteSeleccionado!: Paciente;

  buscarTexto: string = '';

  pacienteBaja: Paciente | null = null;
  bajaEnCurso = false;
  mensaje = '';
  tipoMensaje: 'ok' | 'error' = 'ok';

  constructor(private pacienteService: PacienteService) {}

  etiquetaSync(valor: any): string {
    return etiquetaEstadoSync(valor);
  }

  claseSync(valor: any): string {
    return claseEstadoSync(valor);
  }

  ngOnInit(): void {
    this.listarPacientes();
  }

  listarPacientes(): void {
    this.pacienteService.listar().subscribe({
      next: (data) => this.pacientes = data,
      error: (err) => console.error(err)
    });
  }

  pedirBaja(paciente: Paciente): void {
    this.mensaje = '';
    this.pacienteBaja = paciente;
  }

  cancelarBaja(): void {
    if (!this.bajaEnCurso) {
      this.pacienteBaja = null;
    }
  }

  /** Da de baja al paciente tras la confirmacion. */
  confirmarBaja(): void {
    const paciente: any = this.pacienteBaja;

    if (!paciente) {
      return;
    }

    this.bajaEnCurso = true;

    this.pacienteService.baja(paciente.id || paciente.uuidLocal).subscribe({
      next: () => {
        this.bajaEnCurso = false;
        this.pacienteBaja = null;
        this.tipoMensaje = 'ok';
        this.mensaje = `${paciente.nombres} ${paciente.apellidos} fue dado de baja.`;
        this.listarPacientes();
      },
      error: err => {
        console.error(err);
        this.bajaEnCurso = false;
        this.pacienteBaja = null;
        this.tipoMensaje = 'error';
        this.mensaje = 'No se pudo dar de baja al paciente. Intenta nuevamente.';
      }
    });
  }

  buscar(): void {

  if (this.buscarTexto.trim().length === 0) {
    this.listarPacientes();
    return;
  }

  this.pacienteService.buscar(this.buscarTexto)
    .subscribe({
      next: (data) => this.pacientes = data,
      error: (err) => console.error(err)
    });
}
}
