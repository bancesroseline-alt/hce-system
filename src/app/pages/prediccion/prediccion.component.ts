import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrediccionService } from '../../services/prediccion.service';

@Component({
  selector: 'app-prediccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediccion.component.html',
})
export class PrediccionComponent implements OnInit {

  alertas: any[] = [];
  totalAlertas = 0;

  constructor(private prediccionService: PrediccionService) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.prediccionService.obtenerAlertas().subscribe({
      next: (data) => {
        this.alertas = data;
        this.totalAlertas = data.length;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
