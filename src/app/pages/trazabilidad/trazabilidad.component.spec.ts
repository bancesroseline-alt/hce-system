import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TrazabilidadService } from '../../services/trazabilidad.service';
import { TrazabilidadComponent } from './trazabilidad.component';

describe('TrazabilidadComponent - CP034', () => {
  let fixture: ComponentFixture<TrazabilidadComponent>;
  let servicio: jasmine.SpyObj<TrazabilidadService>;

  beforeEach(async () => {
    spyOn(localStorage, 'getItem').and.callFake(clave =>
      clave === 'usuario' ? JSON.stringify({ rol: 'MEDICO' }) : null
    );
    servicio = jasmine.createSpyObj<TrazabilidadService>('TrazabilidadService', [
      'estadoLedger', 'registros', 'historialLedger', 'resumen', 'verificarIntegridad'
    ]);
    servicio.estadoLedger.and.returnValue(of({}));
    servicio.registros.and.returnValue(of([]));
    servicio.historialLedger.and.returnValue(of([]));
    servicio.resumen.and.returnValue(of([]));
    servicio.verificarIntegridad.and.returnValue(of({ estado: 'VERIFICADO' }));

    await TestBed.configureTestingModule({
      imports: [TrazabilidadComponent],
      providers: [{ provide: TrazabilidadService, useValue: servicio }]
    }).compileComponents();
    fixture = TestBed.createComponent(TrazabilidadComponent);
    fixture.detectChanges();
  });

  it('ofrece Historia clínica al médico y consulta los registros al seleccionarla', () => {
    const opcion = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('.tabs button'))
      .find(boton => boton.textContent?.trim() === 'Historia clínica');
    expect(fixture.componentInstance.esAdmin).toBeFalse();
    expect(opcion).toBeDefined();
    fixture.componentInstance.busqueda = 'búsqueda anterior';
    opcion!.click();
    fixture.detectChanges();

    expect(servicio.registros).toHaveBeenCalledWith('HISTORIA_CLINICA', '');
    expect(opcion!.classList.contains('active')).toBeTrue();
  });

  it('abre el historial clínico usando el tipo e identificador devueltos por el backend', () => {
    // HISTORIA_CLINICA consulta las evidencias existentes de las atenciones médicas.
    servicio.registros.and.returnValue(of([{
      entityType: 'ATENCION', entityId: '34', titulo: 'Atencion #34',
      detalle: 'Paciente de prueba', evidencias: 2
    }]));
    servicio.historialLedger.and.returnValue(of([
      { version: 1, action: 'CREAR', actorNombre: 'Médico', bloqueValido: true },
      { version: 2, action: 'ACTUALIZAR', actorNombre: 'Médico', bloqueValido: true }
    ]));
    fixture.componentInstance.cambiarTipo('HISTORIA_CLINICA');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button.ver') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(servicio.historialLedger).toHaveBeenCalledWith('ATENCION', '34');
    expect(servicio.resumen).toHaveBeenCalledWith('ATENCION', '34');
    expect(servicio.verificarIntegridad).toHaveBeenCalledWith('ATENCION', '34');
    expect(fixture.nativeElement.querySelectorAll('.timeline > li').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.drawer').textContent).toContain('Registro actualizado');
  });
});
