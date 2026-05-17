import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  totalPacientes = 0;
  totalCitas = 0;
  citasHoy = 0;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.dashboardService.getTotalPacientes()
      .subscribe(data => this.totalPacientes = data);

    this.dashboardService.getTotalCitas()
      .subscribe(data => this.totalCitas = data);

    this.dashboardService.getCitasHoy()
      .subscribe(data => this.citasHoy = data);
  }
}