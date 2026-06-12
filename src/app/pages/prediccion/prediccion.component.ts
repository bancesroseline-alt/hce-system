import { Component, OnInit } from '@angular/core';
import { PrediccionService } from 'src/app/services/prediccion.service';

@Component({
  selector: 'app-prediccion',
  templateUrl: './prediccion.component.html',
  styleUrls: ['./prediccion.component.css']
})
export class PrediccionComponent implements OnInit {

  alertas: any[] = [];

  totalAlertas = 0;
  alto = 0;
  bajo = 0;

  constructor(private service: PrediccionService) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.service.obtenerAlertas().subscribe(data => {
      this.alertas = data || [];

      this.totalAlertas = this.alertas.length;

      this.alto = this.alertas.filter(a => a.nivelRiesgo === 'ALTO').length;
      this.bajo = this.alertas.filter(a => a.nivelRiesgo === 'BAJO').length;
    });
  }
}
