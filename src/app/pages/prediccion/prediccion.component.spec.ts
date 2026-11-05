import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PrediccionService } from '../../services/prediccion.service';

import { PrediccionComponent } from './prediccion.component';

describe('PrediccionComponent', () => {
  let component: PrediccionComponent;
  let fixture: ComponentFixture<PrediccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrediccionComponent],
      providers: [{ provide: PrediccionService, useValue: {
        obtenerPrediccionesPacientes: () => of([])
      } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrediccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('CP032: muestra el mensaje en todos los pacientes de bajo riesgo, incluso sin recomendación', () => {
    component.alertas = [null, undefined, '', '   ', 'Sin accion'].map((recomendacion, i) => ({
      nombres: `Paciente ${i}`, nivelRiesgo: 'BAJO',
      probabilidadInasistencia: i === 0 ? 0 : 0.23, recomendacion
    }));
    component.alertas.push({ nivelRiesgo: 'MEDIO', probabilidadInasistencia: 0.5, recomendacion: 'Recordatorio' });
    component.filtroRiesgo = 'BAJO';
    fixture.detectChanges();

    const mensajes = fixture.nativeElement.querySelectorAll('.recommendation') as NodeListOf<HTMLElement>;
    expect(mensajes.length).toBe(5);
    mensajes.forEach(mensaje => expect(mensaje.textContent?.trim())
      .toBe('No se requiere recomendación de reprogramación.'));
  });

  it('mantiene el mensaje de bajo riesgo y la procedencia de los resultados guardados u offline', () => {
    const alerta = { nivelRiesgo: 'BAJO' as const, probabilidadInasistencia: 0.2 };
    expect(component.textoRecomendacion({ ...alerta, modoOffline: true }))
      .toBe('No se requiere recomendación de reprogramación. (ultimo resultado guardado)');
    expect(component.textoRecomendacion({ ...alerta, recomendacion: 'Ultimo resultado guardado (ultimo resultado guardado)' }))
      .toBe('No se requiere recomendación de reprogramación. (ultimo resultado guardado)');
    expect(component.textoRecomendacion({ ...alerta, recomendacion: 'Sin accion (estimacion local)' }))
      .toBe('No se requiere recomendación de reprogramación. (estimacion local)');
  });

  it('conserva las recomendaciones de riesgo medio y alto', () => {
    for (const nivelRiesgo of ['MEDIO', 'ALTO'] as const) {
      expect(component.textoRecomendacion({ nivelRiesgo, probabilidadInasistencia: 0.7, recomendacion: 'Contactar al paciente' }))
        .toBe('Contactar al paciente');
    }
  });

  it('incluye el mismo mensaje de bajo riesgo en el archivo exportado', async () => {
    component.alertas = [{ nivelRiesgo: 'BAJO', probabilidadInasistencia: 0, recomendacion: null }];
    let archivo!: Blob;
    spyOn(URL, 'createObjectURL').and.callFake(blob => { archivo = blob as Blob; return 'blob:exportacion'; });
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');

    component.exportarExcel();

    expect(await archivo.text()).toContain('No se requiere recomendación de reprogramación.');
  });
});
