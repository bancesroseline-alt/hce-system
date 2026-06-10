import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CitaService } from '../../services/cita.service';
import { Cita } from '../../models/cita.model';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent {

  citas: Cita[] = [];
  idPaciente: number | null = null;

  constructor(
    private citaService: CitaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.idPaciente = Number(id);

      this.citaService.porPaciente(this.idPaciente)
        .subscribe(data => {
          this.citas = data ?? [];
        });

    } else {
      this.citaService.listar()
        .subscribe(data => {
          this.citas = data ?? [];
        });
    }
  }
}
