import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrediccionService {

  private api = 'https://hce-backend.onrender.com/api/predicciones';

  constructor(private http: HttpClient) {}

  predecir(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.api}/inasistencia`,
      data
    );
  }

  listarAlertas(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/alertas`
    );
  }
}
