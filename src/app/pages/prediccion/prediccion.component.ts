import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrediccionService } from '../../services/prediccion.service';

@Component({
  selector: 'app-prediccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediccion.component.html',
  styleUrls: ['./prediccion.component.css']
})
export class PrediccionComponent implements OnInit {

  alertas: any[] = [];
  totalAlertas = 0;

  alertasAltas: any[] = [];
  alertasMedias: any[] = [];
  alertasBajas: any[] = [];

  constructor(private prediccionService: PrediccionService) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.prediccionService.obtenerAlertas().subscribe({
      next: (data) => {

        this.alertas = data || [];
        this.totalAlertas = this.alertas.length;

        this.alertasAltas = this.alertas.filter(a => a.nivelRiesgo === 'ALTO');
        this.alertasMedias = this.alertas.filter(a => a.nivelRiesgo === 'MEDIO');
        this.alertasBajas = this.alertas.filter(a => a.nivelRiesgo === 'BAJO');
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
