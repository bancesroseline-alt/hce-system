import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-historia',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.css'
})
export class HistoriaComponent implements OnInit {

  paciente: any = null;
  atenciones: any[] = [];
  citasProgramadas: any[] = [];
  citasNoAsistidas: any[] = [];

  tab: 'atenciones' | 'citas' | 'inasistencias' = 'atenciones';

  private api = 'https://hce-backend.onrender.com/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const pacienteId = Number(this.route.snapshot.paramMap.get('id'));

    if (!pacienteId) return;

    this.http.get<any>(`${this.api}/historias-clinicas/paciente/${pacienteId}`)
      .subscribe({
        next: (data) => {
          this.paciente = data.paciente;
          this.atenciones = data.atenciones || [];
        },
        error: (error) => {
          console.error('Error al cargar historia clínica', error);
        }
      });

    this.http.get<any[]>(`${this.api}/citas/paciente/${pacienteId}`)
      .subscribe({
        next: (citas) => {
          this.citasProgramadas = citas.filter(c => c.estado !== 'NO_ASISTIO');
          this.citasNoAsistidas = citas.filter(c => c.estado === 'NO_ASISTIO');
        },
        error: (error) => {
          console.error('Error al cargar citas del paciente', error);
        }
      });
  }
}
