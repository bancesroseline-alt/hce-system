import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'app-connection-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="conexion.estado" [attr.title]="detalle()" role="status">
      <span class="dot"></span>
      {{ etiqueta() }}
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
      cursor: default;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .online {
      background: #dcfce7;
      color: #166534;
    }

    .offline {
      background: #fee2e2;
      color: #991b1b;
    }

    .verificando {
      background: #fef3c7;
      color: #92400e;
    }

    .verificando .dot {
      animation: parpadeo 1s ease-in-out infinite;
    }

    @keyframes parpadeo {
      50% {
        opacity: 0.25;
      }
    }
  `]
})
export class ConnectionBadgeComponent {

  constructor(public conexion: ConnectionService) {}

  etiqueta(): string {
    if (this.conexion.estado === 'online') return 'Online';
    if (this.conexion.estado === 'offline') return 'Offline';
    return 'Conectando...';
  }

  detalle(): string {
    if (this.conexion.estado === 'online') {
      return 'Conectado al servidor.';
    }

    if (this.conexion.estado === 'offline') {
      return 'Sin conexion con el servidor. Puedes seguir trabajando: los datos se guardan en este dispositivo y se sincronizan al reconectar.';
    }

    return 'Verificando la conexion con el servidor. Puede tardar hasta un minuto si estaba inactivo.';
  }
}
