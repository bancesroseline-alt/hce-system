import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from '../models/cita.model';

@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private api = 'https://hce-backend.onrender.com/api/citas';

  constructor(private http: HttpClient) {}

  listar(): Observable<Cita[]> {
    return this.http.get<Cita[]>(this.api);
  }

  crear(cita: Cita): Observable<Cita> {
    return this.http.post<Cita>(this.api, cita);
  }
}
