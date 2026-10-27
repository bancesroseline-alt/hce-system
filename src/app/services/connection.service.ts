import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type EstadoConexion = 'verificando' | 'online' | 'offline';

const INTERVALO_ONLINE_MS = 20000;
const INTERVALO_REINTENTO_MS = 5000;
const TIMEOUT_PING_MS = 10000;
// Fallos seguidos antes de declarar "offline" (evita parpadeos y cubre el arranque de Render).
const FALLOS_PARA_OFFLINE = 3;

/**
 * Estado de conexion REAL: no basta navigator.onLine (solo indica red local), asi que
 * se verifica que el backend responda. Cualquier respuesta HTTP (incluso 401/403) cuenta como conectado.
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  private readonly estadoSubject = new BehaviorSubject<EstadoConexion>(
    navigator.onLine ? 'verificando' : 'offline'
  );

  readonly estado$ = this.estadoSubject.pipe(distinctUntilChanged());
  readonly online$ = this.estado$.pipe(map(estado => estado === 'online'), distinctUntilChanged());

  private fallosSeguidos = 0;
  private verificacion: Promise<void> | null = null;
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    window.addEventListener('online', () => this.verificar());
    window.addEventListener('offline', () => this.marcar('offline'));
    window.addEventListener('focus', () => this.verificar());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.verificar();
      }
    });

    this.verificar();
  }

  get estado(): EstadoConexion {
    return this.estadoSubject.value;
  }

  get online(): boolean {
    return this.estado === 'online';
  }

  /** Comprueba la conexion ahora (reutiliza una comprobacion en curso). */
  verificar(): Promise<void> {
    if (!this.verificacion) {
      this.verificacion = this.ejecutarVerificacion().finally(() => {
        this.verificacion = null;
        this.programarSiguiente();
      });
    }

    return this.verificacion;
  }

  private async ejecutarVerificacion(): Promise<void> {
    if (!navigator.onLine) {
      this.fallosSeguidos = FALLOS_PARA_OFFLINE;
      this.marcar('offline');
      return;
    }

    const controlador = new AbortController();
    const corte = setTimeout(() => controlador.abort(), TIMEOUT_PING_MS);

    try {
      // no-cors: basta con que el servidor responda; no depende de la politica CORS.
      await fetch(`${environment.apiBaseUrl}/auth/login?ngsw-bypass=true&t=${Date.now()}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controlador.signal
      });

      this.fallosSeguidos = 0;
      this.marcar('online');
    } catch {
      this.fallosSeguidos++;

      if (this.fallosSeguidos >= FALLOS_PARA_OFFLINE) {
        this.marcar('offline');
      }
      // Con menos fallos se conserva el estado actual (online o verificando).
    } finally {
      clearTimeout(corte);
    }
  }

  private programarSiguiente(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }

    // Tras un fallo se reintenta rapido para confirmar (o descartar) la caida.
    const estable = this.estado === 'online' && this.fallosSeguidos === 0;
    const espera = estable ? INTERVALO_ONLINE_MS : INTERVALO_REINTENTO_MS;
    this.temporizador = setTimeout(() => this.verificar(), espera);
  }

  private marcar(estado: EstadoConexion): void {
    if (this.estadoSubject.value !== estado) {
      this.estadoSubject.next(estado);
    }
  }
}
