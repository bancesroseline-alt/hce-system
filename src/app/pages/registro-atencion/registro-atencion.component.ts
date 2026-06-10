import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registro-atencion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-atencion.component.html',
  styleUrls: ['./registro-atencion.component.css']
})
export class RegistroAtencionComponent implements OnInit {

  paciente: any = null;
  pacienteId!: number;

  private api = 'https://hce-backend.onrender.com/api';

  atencion: any = {
    fechaHora: '',
    tipoAtencion: 'CONSULTA',
    motivoConsulta: '',
    presionArterial: '',
    temperatura: null,
    saturacion: null,
    talla: null,
    peso: null,
    diagnostico: '',
    observaciones: '',
    tratamientoIndicado: '',
    medicamentos: '',
    estado: 'COMPLETADA'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {

  this.pacienteId = Number(
    this.route.snapshot.paramMap.get('pacienteId')
  );

  const citaId = this.route.snapshot.paramMap.get('citaId');

  if (citaId) {

    this.atencion.citaId = Number(citaId);

    this.http.get<any>(`${this.api}/citas/${citaId}`)
      .subscribe({
        next: cita => {

          this.atencion.motivoConsulta =
            cita.motivoConsulta || '';

          if (cita.tipoCita) {
            this.atencion.tipoAtencion = cita.tipoCita;
          }

        },
        error: err => {
          console.error('Error al cargar cita', err);
        }
      });
  }

  this.http.get<any>(`${this.api}/pacientes/${this.pacienteId}`)
    .subscribe({
      next: data => {
        this.paciente = data;
      },
      error: error => {
        console.error('Error al cargar paciente', error);
      }
    });
}
guardarAtencion(): void {

  const usuario =
    JSON.parse(localStorage.getItem('usuario') || '{}');

  const payload = {
    ...this.atencion,
    pacienteId: this.pacienteId,
    usuarioId: usuario.id || 2,
    citaId: this.atencion.citaId || null
  };

  console.log('Payload atención:', payload);

  this.http.post(
    `${this.api}/atenciones`,
    payload
  ).subscribe({
    next: (resp) => {
      console.log('Atención guardada', resp);

      this.router.navigate([
        '/historias-clinicas',
        this.pacienteId
      ]);
    },
    error: (err) => {
      console.error('Error al guardar atención', err);
    }
  });
}
}
