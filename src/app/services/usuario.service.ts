import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private api = `${environment.apiBaseUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.api).pipe(timeout(4000));
  }

  crear(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.api, usuario).pipe(timeout(4000));
  }

  actualizarRol(id: number, rol: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.api}/${id}/rol?rol=${rol}`, {}).pipe(timeout(4000));
  }
}
