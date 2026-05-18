import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PacienteService } from '../../../services/paciente.service';
import { Paciente } from '../../../models/paciente.model';

@Component({
  selector: 'app-paciente-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './paciente-form-page.component.html',
  styleUrls: ['./paciente-form-page.component.css']
})
export class PacienteFormPageComponent {

  mensaje = '';

  paciente: Paciente = {

    tipoDocumento: 'DNI',
    numeroDocumento: '',

    nombres: '',
    apellidos: '',

    fechaNacimiento: '',
    edad: 0,

    sexo: 'F',
    estadoCivil: 'SOLTERO',

    telefono: '',
    direccion: '',

    antecedentes: '',

    estado: true
  };

  constructor(
    private pacienteService: PacienteService,
    private router: Router
  ) {}

 calcularEdad(): void {

  if (!this.paciente.fechaNacimiento) return;

  const fechaNacimiento = new Date(this.paciente.fechaNacimiento);

  const hoy = new Date();

  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

  const mes = hoy.getMonth() - fechaNacimiento.getMonth();

  if (
    mes < 0 ||
    (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())
  ) {
    edad--;
  }

  this.paciente.edad = edad;
}

  guardar(): void {

  // VALIDAR CAMPOS
  if (
    !this.paciente.numeroDocumento ||
    !this.paciente.nombres ||
    !this.paciente.apellidos
  ) {
    alert('Complete los campos obligatorios');
    return;
  }

  // VALIDAR DNI DUPLICADO
  this.pacienteService.buscar(this.paciente.numeroDocumento)
    .subscribe({

      next: (data) => {

        if (data.length > 0) {
          alert('Ya existe un paciente con ese documento');
          return;
        }

        // GUARDAR
        this.pacienteService.registrar(this.paciente)
          .subscribe({

            next: () => {

              this.mensaje = 'Paciente registrado correctamente';

              setTimeout(() => {
                this.router.navigate(['/pacientes']);
              }, 5000);

            },

            error: (err) => {
              console.error(err);
              alert('Error al registrar paciente');
            }

          });

      },

      error: (err) => {
        console.error(err);
      }
    });
}
}
