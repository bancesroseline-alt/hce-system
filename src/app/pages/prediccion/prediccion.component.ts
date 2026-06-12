import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Paciente {
  nombres: string;
}

interface Alerta {
  paciente?: Paciente;
  nivelRiesgo: 'ALTO' | 'MEDIO' | 'BAJO';
  probabilidadInasistencia: number;
  recomendacion: string;
}

@Component({
  selector: 'app-prediccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediccion.component.html',
  styleUrls: ['./prediccion.component.css']
})
export class PrediccionComponent implements OnInit {

  alertas: Alerta[] = [];

  alertasAltas: Alerta[] = [];
  alertasMedias: Alerta[] = [];
  alertasBajas: Alerta[] = [];

  totalAlertas = 0;

  ngOnInit(): void {
    // Mock seguro (reemplaza con tu servicio)
    this.alertas = [
      {
        nivelRiesgo: 'ALTO',
        probabilidadInasistencia: 0.82,
        recomendacion: 'Seguimiento inmediato',
        paciente: { nombres: 'Juan Perez' }
      },
      {
        nivelRiesgo: 'BAJO',
        probabilidadInasistencia: 0.12,
        recomendacion: 'Sin acción',
        paciente: { nombres: 'Maria Lopez' }
      }
    ];

    this.procesarAlertas();
  }

  procesarAlertas(): void {
    this.alertasAltas = this.alertas.filter(a => a.nivelRiesgo === 'ALTO');
    this.alertasMedias = this.alertas.filter(a => a.nivelRiesgo === 'MEDIO');
    this.alertasBajas = this.alertas.filter(a => a.nivelRiesgo === 'BAJO');

    this.totalAlertas = this.alertas.length;
  }
}
