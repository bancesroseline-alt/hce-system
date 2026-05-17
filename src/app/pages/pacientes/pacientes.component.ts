import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PacienteService } from '../../services/paciente.service';
import { Paciente } from '../../models/paciente.model';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {

  pacientes: Paciente[] = [];

  pacienteSeleccionado!: Paciente;

  buscarTexto: string = '';

  constructor(private pacienteService: PacienteService) {}

  ngOnInit(): void {
    this.listarPacientes();
  }

  listarPacientes(): void {
    this.pacienteService.listar().subscribe({
      next: (data) => this.pacientes = data,
      error: (err) => console.error(err)
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