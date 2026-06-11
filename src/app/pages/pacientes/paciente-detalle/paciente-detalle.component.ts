import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PacienteService } from '../../../services/paciente.service';
import { Paciente } from '../../../models/paciente.model';

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './paciente-detalle.component.html',
  styleUrls: ['./paciente-detalle.component.css']
})
export class PacienteDetalleComponent implements OnInit {

  paciente: Paciente | null = null;
  mensaje = '';

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
}
