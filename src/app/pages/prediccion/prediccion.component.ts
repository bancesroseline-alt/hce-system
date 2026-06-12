import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Alerta {
  paciente?: {
    nombres: string;
  };
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

  // listas derivadas (IMPORTANTE: aquí y NO en HTML)
  alertasAltas: Alerta[] = [];
  alertasMedias: Alerta[] = [];
  alertasBajas: Alerta[] = [];

  totalAlertas = 0;

  ngOnInit(): void {
    // simulación (reemplaza con tu servicio)
    this.alertas = [
      { nivelRiesgo: 'ALTO', probabilidadInasistencia: 0.85, recomendacion: 'Seguimiento urgente', paciente: { nombres: 'Juan' } },
      { nivelRiesgo: 'BAJO', probabilidadInasistencia: 0.15, recomendacion: 'Sin acción', paciente: { nombres: 'Maria' } }
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
