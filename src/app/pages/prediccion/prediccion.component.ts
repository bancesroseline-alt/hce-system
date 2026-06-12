import { Component, OnInit } from '@angular/core';
import { PrediccionService } from '../../services/prediccion.service';

@Component({
  selector: 'app-prediccion',
  templateUrl: './prediccion.component.html',
  styleUrls: ['./prediccion.component.css']
})
export class PrediccionComponent implements OnInit {

  alertas: any[] = [];

  alertasAltas: any[] = [];
  alertasMedias: any[] = [];
  alertasBajas: any[] = [];

  constructor(private service: PrediccionService) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.service.obtenerAlertas().subscribe((data: any[]) => {

      this.alertas = data || [];

      this.alertasAltas = this.alertas.filter(a => a.nivelRiesgo === 'ALTO');
      this.alertasMedias = this.alertas.filter(a => a.nivelRiesgo === 'MEDIO');
      this.alertasBajas = this.alertas.filter(a => a.nivelRiesgo === 'BAJO');

    });
  }
}
