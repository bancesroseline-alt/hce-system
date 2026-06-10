import { Component } from '@angular/core';
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
export class PacienteDetalleComponent {

  paciente: Paciente | null = null; // ✔ FIX IMPORTANTE

  constructor(
    private route: ActivatedRoute,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) return;

    this.pacienteService.obtener(Number(id))
      .subscribe({
        next: (data) => {
          this.paciente = data;
        },
        error: (err) => {
          console.error('Error cargando paciente', err);
          this.paciente = null;
        }
      });
  }
}
