import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, from, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export type LoginErrorTipo = 'CREDENCIALES' | 'DISPOSITIVO_NO_AUTORIZADO' | 'SIN_CONEXION';

export interface LoginError {
  tipo: LoginErrorTipo;
  mensaje: string;
}

interface CredencialOffline {
  salt: string;
  hash: string;
  token: string;
  usuario: any;
  fecha: string;
}

const OFFLINE_KEY = 'hceOfflineCredentials';
const PBKDF2_ITERATIONS = 150000;

// Render (plan gratuito) tarda 30-60 s en despertar: se reintenta en lugar de caer a offline.
const INTENTOS_ONLINE = 3;
const TIMEOUT_INTENTO_MS = 20000;
// Con credenciales locales se espera menos: si no responde, se entra en modo offline.
const TIMEOUT_CON_CREDENCIAL_LOCAL_MS = 8000;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiBaseUrl}/auth`;

  constructor(private http: HttpClient) {}

  /** Despierta el backend (cold start) sin esperar respuesta. */
  precalentarServidor(): void {
    this.http.get(`${this.apiUrl}/login`).subscribe({ error: () => {} });
  }

  login(
    data: { username: string; password: string },
    onEstado?: (mensaje: string) => void
  ): Observable<any> {
    return from(this.loginAsync(data, onEstado));
  }

  private async loginAsync(
    data: { username: string; password: string },
    onEstado?: (mensaje: string) => void
  ): Promise<any> {

    const username = data.username.trim();
    const credencialLocal = this.obtenerCredencialOffline(username);

    if (!navigator.onLine) {
      return this.loginOffline(username, data.password);
    }

    const intentos = credencialLocal ? 1 : INTENTOS_ONLINE;
    const limite = credencialLocal ? TIMEOUT_CON_CREDENCIAL_LOCAL_MS : TIMEOUT_INTENTO_MS;

    for (let intento = 1; intento <= intentos; intento++) {

      if (intento > 1) {
        onEstado?.('El servidor está iniciando, esto puede tardar hasta un minuto...');
      }

      try {
        const response = await firstValueFrom(
          this.http.post<any>(`${this.apiUrl}/login`, { ...data, username }).pipe(timeout(limite))
        );

        await this.saveSession(response, username, data.password);
        return response;

      } catch (err) {

        if (this.esErrorDeCredenciales(err)) {
          throw {
            tipo: 'CREDENCIALES',
            mensaje: 'Usuario o contraseña incorrectos'
          } as LoginError;
        }

        console.warn(`Login: servidor no disponible (intento ${intento}/${intentos})`, err);
      }
    }

    // El servidor no respondió tras los reintentos: se usa el acceso offline del dispositivo.
    return this.loginOffline(username, data.password, true);
  }

  /** 400/401/403 = el servidor respondió y rechazó las credenciales (no es un problema de red). */
  private esErrorDeCredenciales(err: unknown): boolean {
    return err instanceof HttpErrorResponse && [400, 401, 403].includes(err.status);
  }

  private async loginOffline(username: string, password: string, servidorCaido = false): Promise<any> {

    const credencial = this.obtenerCredencialOffline(username);

    if (!credencial) {
      throw {
        tipo: servidorCaido ? 'SIN_CONEXION' : 'DISPOSITIVO_NO_AUTORIZADO',
        mensaje: servidorCaido
          ? 'No se pudo conectar con el servidor. Intenta nuevamente en unos segundos.'
          : 'Sin conexión: este usuario aún no está habilitado en este dispositivo. Inicia sesión una vez con internet.'
      } as LoginError;
    }

    const hash = await this.derivarHash(password, credencial.salt);

    if (hash !== credencial.hash) {
      throw {
        tipo: 'CREDENCIALES',
        mensaje: 'Usuario o contraseña incorrectos'
      } as LoginError;
    }

    this.guardarSesion(credencial.token, credencial.usuario);

    return {
      token: credencial.token,
      usuario: credencial.usuario,
      modoOffline: true
    };
  }

  async saveSession(response: any, username?: string, password?: string): Promise<void> {
    this.guardarSesion(response.token, response.usuario);

    if (username && password) {
      await this.guardarCredencialOffline(username, password, response);
    }
  }

  private guardarSesion(token: string, usuario: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('offlineAutorizado', 'true');
    localStorage.setItem('fechaAutorizacionOffline', new Date().toISOString());
  }

  /** Registra el dispositivo: guarda un hash salado (nunca la contraseña) para validar ingresos sin conexión. */
  private async guardarCredencialOffline(username: string, password: string, response: any): Promise<void> {
    if (!crypto?.subtle) {
      return;
    }

    const salt = this.aHex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await this.derivarHash(password, salt);

    const todas = this.leerCredenciales();
    todas[username.toLowerCase()] = {
      salt,
      hash,
      token: response.token,
      usuario: response.usuario,
      fecha: new Date().toISOString()
    };

    localStorage.setItem(OFFLINE_KEY, JSON.stringify(todas));
  }

  private obtenerCredencialOffline(username: string): CredencialOffline | null {
    return this.leerCredenciales()[username.trim().toLowerCase()] ?? null;
  }

  private leerCredenciales(): Record<string, CredencialOffline> {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private async derivarHash(password: string, saltHex: string): Promise<string> {
    const base = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations: PBKDF2_ITERATIONS,
        salt: this.deHex(saltHex)
      },
      base,
      256
    );

    return this.aHex(new Uint8Array(bits));
  }

  private aHex(bytes: Uint8Array): string {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  private deHex(hex: string): Uint8Array {
    return Uint8Array.from(hex.match(/.{2}/g) ?? [], h => parseInt(h, 16));
  }

  /** Cierra la sesión pero conserva las credenciales offline del dispositivo. */
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
