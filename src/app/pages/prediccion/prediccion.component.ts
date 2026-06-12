import { Component, OnInit } from '@angular/core';
import { PrediccionService } from '../../services/prediccion.service';

@Component({
  selector: 'app-prediccion',
  templateUrl: './prediccion.component.html',
  styleUrls: ['./prediccion.component.css']
})
export class PrediccionComponent implements OnInit {

  alertas: any[] = [];
  totalAlertas = 0;

  constructor(
    private prediccionService: PrediccionService
  ) {}

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
