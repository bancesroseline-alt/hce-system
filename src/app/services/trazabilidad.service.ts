import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

// Render puede tardar en despertar: se da margen antes de fallar.
const TIMEOUT_MS = 20000;

@Injectable({
  providedIn: 'root'
})
export class TrazabilidadService {

  private api = `${environment.apiBaseUrl}/trazabilidad`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.api).pipe(timeout(TIMEOUT_MS));
  }

  /** Registros que se pueden elegir (sin conocer ids). */
  registros(tipo: string, texto = ''): Observable<any[]> {
    let params = new HttpParams().set('tipo', tipo);

    if (texto.trim()) {
      params = params.set('q', texto.trim());
    }

    return this.http.get<any[]>(`${this.api}/registros`, { params }).pipe(timeout(TIMEOUT_MS));
  }

  /** Datos clinicos del registro (vacio para el administrador). */
  resumen(entityType: string, entityId: string | number): Observable<{ etiqueta: string; valor: string }[]> {
    return this.http
      .get<{ etiqueta: string; valor: string }[]>(`${this.api}/resumen/${entityType}/${entityId}`)
      .pipe(timeout(TIMEOUT_MS));
  }

  estadoLedger(): Observable<any> {
    return this.http.get<any>(`${this.api}/ledger/estado`).pipe(timeout(TIMEOUT_MS));
  }

  historialLedger(entityType: string, entityId: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/ledger/${entityType}/${entityId}`).pipe(timeout(TIMEOUT_MS));
  }

  historialPorEntidad(entityType: string, entityId: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${entityType}/${entityId}`).pipe(timeout(TIMEOUT_MS));
  }

  verificarIntegridad(entityType: string, entityId: string | number): Observable<any> {
    return this.http.post<any>(`${this.api}/verificar`, { entityType, entityId: String(entityId) }).pipe(timeout(TIMEOUT_MS));
  }

  historialPorAtencion(atencionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/atencion/${atencionId}`).pipe(timeout(TIMEOUT_MS));
  }

  validarIntegridad(atencionId: number): Observable<string> {
    return this.http.get(`${this.api}/validar/${atencionId}`, { responseType: 'text' }).pipe(timeout(TIMEOUT_MS));
  }
}
