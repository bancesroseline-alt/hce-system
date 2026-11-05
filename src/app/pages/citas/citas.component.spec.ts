import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { CitasComponent } from './citas.component';
import { CitaOfflineService } from '../../services/cita-offline.service';
import { PacienteService } from '../../services/paciente.service';
import { of } from 'rxjs';

describe('CitasComponent', () => {
  let component: CitasComponent;
  let fixture: ComponentFixture<CitasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitasComponent],
      providers: [provideHttpClient(), provideRouter([]),
        { provide: CitaOfflineService, useValue: { listar: () => of([]), listarMedicos: () => of([]) } },
        { provide: PacienteService, useValue: { listar: () => of([]) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('CP024: muestra nombres y apellidos en la agenda del día', () => {
    component.fechaSeleccionada = new Date('2026-11-09T00:00:00');
    component.citas = [{ fecha: '2026-11-09', hora: '19:14', estado: 'PROGRAMADA',
      estadoSync: 'PENDIENTE', paciente: { id: 24, nombres: 'Joao David', apellidos: 'Jiménez Abarca' } }];
    component.filtrarCitasPorDia();
    fixture.detectChanges();
    const fila = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    expect(fila.textContent).toContain('Joao David Jiménez Abarca');
    expect(fila.textContent).not.toContain('Sin nombre');
  });
});
