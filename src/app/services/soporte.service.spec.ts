import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SoporteService } from './soporte.service';
import { environment } from '../../environments/environment';

describe('SoporteService', () => {
  let service: SoporteService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}); service=TestBed.inject(SoporteService); http=TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('registra errores del usuario', () => { const data={modulo:'Citas',descripcion:'Falla visible'}; service.reportarError(data).subscribe(r=>expect(r.id).toBe(1)); const req=http.expectOne(`${environment.apiBaseUrl}/errores`); expect(req.request.method).toBe('POST'); req.flush({id:1}); });
  it('registra feedback del usuario', () => { service.enviarFeedback({comentario:'Bien',calificacion:5}).subscribe(); const req=http.expectOne(`${environment.apiBaseUrl}/feedback`); expect(req.request.method).toBe('POST'); req.flush({id:1}); });
  it('consulta metricas administrativas', () => { service.metricas().subscribe(r=>expect(r.totalLogs).toBe(10)); http.expectOne(`${environment.apiBaseUrl}/metricas`).flush({totalLogs:10}); });
});
