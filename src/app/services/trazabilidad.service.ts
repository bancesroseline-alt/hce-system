import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrazabilidadService {

  private api = `${environment.apiBaseUrl}/trazabilidad`;

  constructor(private http: HttpClient) {}

  historialPorAtencion(atencionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/atencion/${atencionId}`).pipe(timeout(4000));
  }

  validarIntegridad(atencionId: number): Observable<string> {
    return this.http.get(`${this.api}/validar/${atencionId}`, { responseType: 'text' }).pipe(timeout(4000));
  }
}
