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

  it('pagina las citas en grupos de 5, 10 o todos', () => {
    component.citasReporte = Array.from({length: 12}, (_, index) => ({fecha: `2026-08-${String(index + 1).padStart(2, '0')}`}));
    expect(component.citasPaginadas().length).toBe(5);
    expect(component.totalPaginas()).toBe(3);
    component.paginaSiguiente();
    expect(component.registroInicial()).toBe(6);
    component.tamanoPagina = 10;
    component.cambiarTamanoPagina();
    expect(component.citasPaginadas().length).toBe(10);
    component.tamanoPagina = 'TODOS';
    expect(component.citasPaginadas().length).toBe(12);
  });
});
