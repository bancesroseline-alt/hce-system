import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesComponent } from './reportes.component';
import { provideHttpClient } from '@angular/common/http';

describe('ReportesComponent', () => {
  let component: ReportesComponent;
  let fixture: ComponentFixture<ReportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filtra citas por fecha, estado y especialidad', () => {
    component.citasReporte = [
      {fecha:'2026-08-01',estado:'PROGRAMADA',especialidad:'Cardiologia'},
      {fecha:'2026-08-15',estado:'ATENDIDA',especialidad:'Pediatria'}
    ];
    component.filtroDesde='2026-08-10';
    component.filtroEstado='ATENDIDA';
    component.filtroEspecialidad='pedia';
    expect(component.citasFiltradas().length).toBe(1);
  });
});
