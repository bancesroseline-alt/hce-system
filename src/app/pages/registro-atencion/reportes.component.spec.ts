import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { RegistroAtencionComponent } from './registro-atencion.component';

describe('RegistroAtencionComponent', () => {
  let component: RegistroAtencionComponent;
  let fixture: ComponentFixture<RegistroAtencionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAtencionComponent],
      providers: [provideHttpClient(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroAtencionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
