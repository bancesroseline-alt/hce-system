import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  totalPacientes = 0;
  totalCitasHoy = 0;
  porcentajeInasistencia = 0;

  citasDelDia: any[] = [];
  actividadesRecientes: any[] = [];

  usuario: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    const usuarioStorage = localStorage.getItem('usuario');

    if (usuarioStorage) {
      this.usuario = JSON.parse(usuarioStorage);
      this.cargarDashboard();
    }
  }

  cargarDashboard(): void {
    this.dashboardService.obtenerDashboardMedico(this.usuario.id).subscribe({
      next: (data) => {
        this.totalPacientes = data.totalPacientes;
        this.totalCitasHoy = data.totalCitasHoy;
        this.porcentajeInasistencia = data.porcentajeInasistencia;
        this.citasDelDia = data.citasDelDia;
        this.actividadesRecientes = data.actividadesRecientes;
      },
      error: (err) => {
        console.error('Error al cargar dashboard', err);
      }
    });
  }
}
