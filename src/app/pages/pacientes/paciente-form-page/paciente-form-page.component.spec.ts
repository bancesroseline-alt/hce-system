import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacienteFormPageComponent } from './paciente-form-page.component';

describe('PacienteFormPageComponent', () => {
  let component: PacienteFormPageComponent;
  let fixture: ComponentFixture<PacienteFormPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacienteFormPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PacienteFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
