import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './paciente-detalle.component.html',
  styleUrls: ['./paciente-detalle.component.css']
})
export class PacienteDetalleComponent implements OnInit {

  id!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {

    this.id = Number(this.route.snapshot.paramMap.get('id'));

    console.log('Paciente ID:', this.id);

  }

}