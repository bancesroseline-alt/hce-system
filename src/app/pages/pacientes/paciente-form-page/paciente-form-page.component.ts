import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

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

  modoEdicion = false;
  idPaciente: number | null = null;

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
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {

      const id = params.get('id');

      if (id) {
        this.modoEdicion = true;
        this.idPaciente = Number(id);

        this.pacienteService.obtener(this.idPaciente)
          .subscribe({
            next: (data) => {
              this.paciente = data;
            },
            error: (err) => {
              console.error(err);
              alert('Error al cargar paciente');
            }
          });
      }

    });
  }

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

    if (
      !this.paciente.numeroDocumento ||
      !this.paciente.nombres ||
      !this.paciente.apellidos
    ) {
      alert('Complete los campos obligatorios');
      return;
    }

    if (this.modoEdicion) {

      this.pacienteService.actualizar(this.idPaciente!, this.paciente)
        .subscribe({
          next: () => {
            this.mensaje = navigator.onLine
              ? 'Paciente actualizado correctamente'
              : 'Paciente actualizado offline correctamente';

            setTimeout(() => {
              this.router.navigate(['/pacientes']);
            }, 2000);
          },
          error: (err) => {
            console.error(err);
            alert('Error al actualizar paciente');
          }
        });

      return;
    }

    // MODO CREAR OFFLINE
    if (!navigator.onLine) {

      this.pacienteService.registrar(this.paciente)
        .subscribe({
          next: () => {
            this.mensaje = 'Paciente guardado offline correctamente';

            setTimeout(() => {
              this.router.navigate(['/pacientes']);
            }, 2000);
          },
          error: (err) => {
            console.error(err);
            alert('Error al guardar paciente offline');
          }
        });

      return;
    }

    // MODO CREAR ONLINE
    this.pacienteService.buscar(this.paciente.numeroDocumento)
      .subscribe({
        next: (data) => {

          if (data.length > 0) {
            alert('Ya existe un paciente con ese documento');
            return;
          }

          this.pacienteService.registrar(this.paciente)
            .subscribe({
              next: () => {
                this.mensaje = 'Paciente registrado correctamente';

                setTimeout(() => {
                  this.router.navigate(['/pacientes']);
                }, 2000);
              },
              error: (err) => {
                console.error(err);
                alert('Error al registrar paciente');
              }
            });

        },
        error: (err) => {
          console.error(err);
          alert('No se pudo validar el documento con el servidor');
        }
      });
  }
}