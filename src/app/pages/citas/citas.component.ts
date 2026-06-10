import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent implements OnInit {

  api = 'https://hce-backend.onrender.com/api';

  citas: any[] = [];
  mensaje = '';

  cita: any = {
    paciente: { id: null },
    medico: { id: null },
    tipoCita: 'CONSULTA',
    fecha: '',
    hora: '',
    especialidad: '',
    motivoConsulta: '',
    estado: 'PROGRAMADA'
  };

  modoNuevaCita = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const pacienteId = Number(this.route.snapshot.paramMap.get('id'));

    if (pacienteId) {
      this.modoNuevaCita = true;
      this.cita.paciente.id = pacienteId;

      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      this.cita.medico.id = usuario.id || 2;
    } else {
      this.cargarCitas();
    }
  }

  cargarCitas(): void {
    this.http.get<any[]>(`${this.api}/citas`)
      .subscribe({
        next: data => this.citas = data || [],
        error: error => console.error('Error al cargar citas', error)
      });
  }

  guardar(): void {
    this.http.post(`${this.api}/citas`, this.cita)
      .subscribe({
        next: () => {
          this.mensaje = 'Cita registrada correctamente';
          this.modoNuevaCita = false;
          this.cargarCitas();
        },
        error: error => console.error('Error al guardar cita', error)
      });
  }
}
