import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { PacienteDetalleComponent } from './paciente-detalle.component';

describe('PacienteDetalleComponent', () => {
  let component: PacienteDetalleComponent;
  let fixture: ComponentFixture<PacienteDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacienteDetalleComponent],
      providers: [provideHttpClient(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PacienteDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
