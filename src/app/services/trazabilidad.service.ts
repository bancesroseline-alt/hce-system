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

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.api).pipe(timeout(4000));
  }

  historialPorEntidad(entityType: string, entityId: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${entityType}/${entityId}`).pipe(timeout(4000));
  }

  verificarIntegridad(entityType: string, entityId: string | number): Observable<any> {
    return this.http.post<any>(`${this.api}/verificar`, { entityType, entityId: String(entityId) }).pipe(timeout(4000));
  }

  historialPorAtencion(atencionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/atencion/${atencionId}`).pipe(timeout(4000));
  }

  validarIntegridad(atencionId: number): Observable<string> {
    return this.http.get(`${this.api}/validar/${atencionId}`, { responseType: 'text' }).pipe(timeout(4000));
  }
}
