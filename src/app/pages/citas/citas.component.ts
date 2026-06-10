import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CitaService } from '../../services/cita.service';
import { Cita } from '../../models/cita.model';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent {

  cita: Cita = {
    paciente: { id: 0 },
    medico: { id: 0 },
    tipoCita: 'CONSULTA',
    fecha: '',
    hora: '',
    especialidad: '',
    motivoConsulta: '',
    estado: 'PROGRAMADA'
  };

  mensaje = '';

  constructor(private citaService: CitaService) {}

  guardar(): void {

    if (!this.cita.paciente.id || !this.cita.medico.id) {
      alert('Paciente y médico son obligatorios');
      return;
    }

    this.citaService.crear(this.cita).subscribe({
      next: () => {
        this.mensaje = 'Cita registrada correctamente';

        this.cita = {
          paciente: { id: 0 },
          medico: { id: 0 },
          tipoCita: 'CONSULTA',
          fecha: '',
          hora: '',
          especialidad: '',
          motivoConsulta: '',
          estado: 'PROGRAMADA'
        };
      },
      error: (err) => {
        console.error(err);
        alert('Error al registrar cita');
      }
    });
  }
}
