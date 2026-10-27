import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { PacienteService } from '../../../services/paciente.service';
import { Paciente } from '../../../models/paciente.model';
import { ConnectionBadgeComponent } from '../../../shared/connection-badge/connection-badge.component';

@Component({
  selector: 'app-paciente-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConnectionBadgeComponent],
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

  errorValidacion = '';
  camposFaltantes: string[] = [];

  /** Campos obligatorios sin completar, con el nombre que ve el usuario. */
  private validarObligatorios(): { clave: string; etiqueta: string }[] {
    const p: any = this.paciente;
    const reglas = [
      { clave: 'tipoDocumento', etiqueta: 'Tipo de documento', falta: !p.tipoDocumento },
      { clave: 'numeroDocumento', etiqueta: 'Número de documento', falta: !String(p.numeroDocumento || '').trim() },
      { clave: 'nombres', etiqueta: 'Nombres', falta: !String(p.nombres || '').trim() },
      { clave: 'apellidos', etiqueta: 'Apellidos', falta: !String(p.apellidos || '').trim() },
      { clave: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', falta: !p.fechaNacimiento },
      { clave: 'sexo', etiqueta: 'Sexo', falta: !p.sexo },
      { clave: 'estadoCivil', etiqueta: 'Estado civil', falta: !p.estadoCivil }
    ];

    return reglas.filter(r => r.falta);
  }

  guardar(): void {

    this.errorValidacion = '';
    this.camposFaltantes = [];

    const faltantes = this.validarObligatorios();

    if (faltantes.length > 0) {
      this.camposFaltantes = faltantes.map(f => f.clave);
      this.errorValidacion = `Complete los campos obligatorios: ${faltantes.map(f => f.etiqueta).join(', ')}.`;
      return;
    }

    if (this.paciente.tipoDocumento === 'DNI' && !/^\d{8}$/.test(this.paciente.numeroDocumento)) {
      this.camposFaltantes = ['numeroDocumento'];
      this.errorValidacion = 'El DNI debe contener exactamente 8 dígitos numéricos.';
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

    this.pacienteService.registrar(this.paciente)
      .subscribe({
        next: () => {
          this.mensaje = navigator.onLine
            ? 'Paciente registrado correctamente'
            : 'Paciente guardado offline correctamente';

          setTimeout(() => {
            this.router.navigate(['/pacientes']);
          }, 2000);
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.message || 'Error al registrar paciente');
        }
      });
  }
}
