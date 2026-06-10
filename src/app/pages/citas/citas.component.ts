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
  citasDelDia: any[] = [];
  mensaje = '';

  modoNuevaCita = false;

  fechaSeleccionada = new Date();
  diasCalendario: any[] = [];

  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
    }

    this.cargarCitas();
  }

  cargarCitas(): void {
    this.http.get<any[]>(`${this.api}/citas`)
      .subscribe({
        next: data => {
          this.citas = data || [];
          this.filtrarCitasPorDia();
          this.generarCalendario();
        },
        error: error => console.error('Error al cargar citas', error)
      });
  }

  guardar(): void {
    this.http.post(`${this.api}/citas`, this.cita)
      .subscribe({
        next: () => {
          this.mensaje = 'Cita registrada correctamente';
          this.modoNuevaCita = false;
          this.limpiarFormulario();
          this.cargarCitas();
        },
        error: error => console.error('Error al guardar cita', error)
      });
  }

  limpiarFormulario(): void {
    this.cita = {
      paciente: { id: null },
      medico: { id: null },
      tipoCita: 'CONSULTA',
      fecha: '',
      hora: '',
      especialidad: '',
      motivoConsulta: '',
      estado: 'PROGRAMADA'
    };
  }

  get nombreMesActual(): string {
    return `${this.meses[this.fechaSeleccionada.getMonth()]} ${this.fechaSeleccionada.getFullYear()}`;
  }

  generarCalendario(): void {
    const year = this.fechaSeleccionada.getFullYear();
    const month = this.fechaSeleccionada.getMonth();

    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);

    let inicioSemana = primerDia.getDay();
    inicioSemana = inicioSemana === 0 ? 6 : inicioSemana - 1;

    this.diasCalendario = [];

    for (let i = 0; i < inicioSemana; i++) {
      this.diasCalendario.push({
        dia: '',
        fecha: null,
        tieneCitas: false,
        seleccionado: false
      });
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const fechaISO = this.formatearFecha(fecha);

      this.diasCalendario.push({
        dia,
        fecha: fechaISO,
        tieneCitas: this.citas.some(c => c.fecha === fechaISO),
        seleccionado: this.formatearFecha(this.fechaSeleccionada) === fechaISO
      });
    }
  }

  seleccionarDia(item: any): void {
    if (!item.fecha) return;

    this.fechaSeleccionada = new Date(item.fecha + 'T00:00:00');
    this.filtrarCitasPorDia();
    this.generarCalendario();
  }

  mesAnterior(): void {
    this.fechaSeleccionada = new Date(
      this.fechaSeleccionada.getFullYear(),
      this.fechaSeleccionada.getMonth() - 1,
      1
    );

    this.filtrarCitasPorDia();
    this.generarCalendario();
  }

  mesSiguiente(): void {
    this.fechaSeleccionada = new Date(
      this.fechaSeleccionada.getFullYear(),
      this.fechaSeleccionada.getMonth() + 1,
      1
    );

    this.filtrarCitasPorDia();
    this.generarCalendario();
  }

  filtrarCitasPorDia(): void {
    const fechaISO = this.formatearFecha(this.fechaSeleccionada);
    this.citasDelDia = this.citas.filter(c => c.fecha === fechaISO);
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  contarPorEstado(estado: string): number {
    return this.citasDelDia.filter(c => c.estado === estado).length;
  }
}
