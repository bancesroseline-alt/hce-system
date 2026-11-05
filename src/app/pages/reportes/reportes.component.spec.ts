import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesComponent } from './reportes.component';
import { provideHttpClient } from '@angular/common/http';
import ExcelJS from 'exceljs';

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

  it('CP045: descarga un XLSX válido con todas las citas filtradas, incluyendo los límites del periodo', async () => {
    component.cargando = false;
    const cita = {
      hora: '09:30', estado: 'PROGRAMADA', especialidad: 'Medicina General', tipoCita: 'CONSULTA',
      paciente: { nombres: 'José', apellidos: 'Pérez' },
      medico: { nombres: 'Ana', apellidos: 'Díaz' }
    };
    component.citasReporte = [
      ...Array.from({ length: 6 }, (_, i) => ({ ...cita, fecha: i === 0 ? '2026-01-01' : '2026-12-31' })),
      { ...cita, fecha: '2025-12-31' },
      { ...cita, fecha: '2027-01-01' },
      { ...cita, fecha: '2026-06-01', estado: 'ATENDIDA' },
      { ...cita, fecha: '2026-06-01', especialidad: 'Pediatría' }
    ];
    component.filtroDesde = '2026-01-01';
    component.filtroHasta = '2026-12-31';
    component.filtroEstado = 'PROGRAMADA';
    component.filtroEspecialidad = 'Medicina General';
    component.paginaActual = 2;

    let archivo!: Blob;
    const crearUrl = spyOn(URL, 'createObjectURL').and.callFake(blob => {
      archivo = blob as Blob;
      return 'blob:reporte-citas';
    });
    const revocarUrl = spyOn(URL, 'revokeObjectURL');
    let enlace!: HTMLAnchorElement;
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      enlace = this;
      expect(document.body.contains(this)).toBeTrue();
    });
    const programarLimpieza = spyOn(window, 'setTimeout').and.returnValue(1);

    await component.exportarCitasXlsx();

    expect(crearUrl).toHaveBeenCalledTimes(1);
    expect(archivo.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(enlace.download).toMatch(/^reporte-citas-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(document.body.contains(enlace)).toBeFalse();
    expect(revocarUrl).not.toHaveBeenCalled();
    const limpiar = programarLimpieza.calls.mostRecent().args[0] as () => void;
    limpiar();
    expect(revocarUrl).toHaveBeenCalledWith('blob:reporte-citas');

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(await archivo.arrayBuffer());
    const hoja = libro.getWorksheet('Citas')!;
    expect(hoja.rowCount).toBe(7);
    expect(hoja.getCell('A2').value).toBe('2026-01-01');
    expect(hoja.getCell('A7').value).toBe('2026-12-31');
    expect(hoja.getCell('C2').value).toBe('José Pérez');
    expect(hoja.getCell('D2').value).toBe('Ana Díaz');
    expect(hoja.getCell('E2').value).toBe('Medicina General');
    expect(hoja.getCell('G2').value).toBe('PROGRAMADA');
    expect(component.exportando).toBeFalse();
    expect(component.errorExportacion).toBe('');
  });

  it('avisa si falla la exportación y permite reintentar', async () => {
    component.cargando = false;
    spyOn(console, 'error');
    const crearUrl = spyOn(URL, 'createObjectURL').and.throwError('Fallo al generar URL');
    await component.exportarCitasXlsx();
    expect(component.errorExportacion).toContain('No se pudo generar');
    expect(component.exportando).toBeFalse();

    crearUrl.and.returnValue('blob:reintento');
    spyOn(HTMLAnchorElement.prototype, 'click');
    spyOn(window, 'setTimeout').and.returnValue(1);
    await component.exportarCitasXlsx();
    expect(component.errorExportacion).toBe('');
    expect(component.exportando).toBeFalse();
  });

  it('evita exportar mientras se cargan datos o hay otra exportación en curso', async () => {
    const crearUrl = spyOn(URL, 'createObjectURL');
    await component.exportarCitasXlsx();
    component.cargando = false;
    component.exportando = true;
    await component.exportarCitasXlsx();
    expect(crearUrl).not.toHaveBeenCalled();
  });
});
