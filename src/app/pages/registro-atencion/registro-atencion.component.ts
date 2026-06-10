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

  console.log('================================');
  console.log('URL actual:', this.router.url);

  console.log(
    'pacienteId param:',
    this.route.snapshot.paramMap.get('pacienteId')
  );

  console.log(
    'citaId param:',
    this.route.snapshot.paramMap.get('citaId')
  );

  this.pacienteId = Number(
    this.route.snapshot.paramMap.get('pacienteId')
  );

  console.log(
    'pacienteId convertido:',
    this.pacienteId
  );

  console.log('================================');

  const citaId =
    this.route.snapshot.paramMap.get('citaId');

  if (citaId) {

    this.atencion.citaId = Number(citaId);

    this.http.get<any>(
      `${this.api}/citas/${citaId}`
    ).subscribe({
      next: cita => {

        console.log('Cita cargada:', cita);

        this.atencion.motivoConsulta =
          cita.motivoConsulta || '';

        if (cita.tipoCita) {
          this.atencion.tipoAtencion =
            cita.tipoCita;
        }

      },
      error: err => {
        console.error(
          'Error al cargar cita',
          err
        );
      }
    });
  }

  if (!isNaN(this.pacienteId)) {

    this.http.get<any>(
      `${this.api}/pacientes/${this.pacienteId}`
    ).subscribe({
      next: data => {

        console.log(
          'Paciente cargado:',
          data
        );

        this.paciente = data;
      },
      error: error => {
        console.error(
          'Error al cargar paciente',
          error
        );
      }
    });

  } else {

    console.error(
      'pacienteId inválido:',
      this.route.snapshot.paramMap.get('pacienteId')
    );

  }
}
  
guardarAtencion(): void {

  const usuario = JSON.parse(
    localStorage.getItem('usuario') || '{}'
  );

  const payload = {
    ...this.atencion,
    pacienteId: this.pacienteId,
    usuarioId: usuario.id || 2,
    citaId: this.atencion.citaId || null
  };

  console.log('========================');
  console.log('pacienteId:', this.pacienteId);
  console.log('usuarioId:', usuario.id);
  console.log('citaId:', this.atencion.citaId);
  console.log('Payload completo:', payload);
  console.log('========================');

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
      console.error(
        'Error al guardar atención',
        err
      );
    }
  });
}
  
}
