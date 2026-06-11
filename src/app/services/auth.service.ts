import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://hce-backend.onrender.com/api/auth';

  constructor(private http: HttpClient) {}

  login(data: { username: string; password: string }): Observable<any> {

    return new Observable(observer => {

      this.http.post<any>(`${this.apiUrl}/login`, data)
        .subscribe({

          next: (response) => {

            this.saveSession(response);

            observer.next(response);
            observer.complete();
          },

          error: (err) => {

            console.warn('Servidor no disponible. Intentando login offline...', err);

            const token = localStorage.getItem('token');
            const usuario = localStorage.getItem('usuario');
            const offlineAutorizado = localStorage.getItem('offlineAutorizado');

            if (token && usuario && offlineAutorizado === 'true') {

              observer.next({
                token,
                usuario: JSON.parse(usuario),
                modoOffline: true
              });

              observer.complete();

            } else {

              observer.error({
                mensaje: 'Este dispositivo no está autorizado para ingreso offline. Inicia sesión una vez con internet.'
              });

            }
          }

        });

    });
  }

  saveSession(response: any): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('usuario', JSON.stringify(response.usuario));
    localStorage.setItem('offlineAutorizado', 'true');
    localStorage.setItem('fechaAutorizacionOffline', new Date().toISOString());
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('offlineAutorizado');
    localStorage.removeItem('fechaAutorizacionOffline');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token') &&
           !!localStorage.getItem('usuario') &&
           localStorage.getItem('offlineAutorizado') === 'true';
  }

  getUsuario(): any {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isOfflineAuthorized(): boolean {
    return localStorage.getItem('offlineAutorizado') === 'true';
  }
}