import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { SoporteService } from '../../services/soporte.service';
import { UsuarioService } from '../../services/usuario.service';
import { ConnectionBadgeComponent } from '../../shared/connection-badge/connection-badge.component';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ConnectionBadgeComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.css'
})
export class DashboardAdminComponent implements OnInit {

  nombreUsuario = 'Administrador';
  cargando = true;
  sinConexion = false;

  metricas: any = {};
  usuarios: any[] = [];
  errores: any[] = [];
  feedback: any[] = [];

  readonly roles = ['ADMIN', 'MEDICO', 'ENFERMERO'];

  readonly accesos = [
    { titulo: 'Gestion de usuarios', detalle: 'Altas, roles y estado', ruta: '/usuarios' },
    { titulo: 'Reportes', detalle: 'Citas, filtros y exportacion', ruta: '/reportes' },
    { titulo: 'Monitoreo', detalle: 'Metricas, logs y errores', ruta: '/monitoreo' },
    { titulo: 'Trazabilidad', detalle: 'Integridad de registros', ruta: '/trazabilidad' }
  ];

  constructor(
    private soporte: SoporteService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.nombreUsuario = usuario.nombres || usuario.username || 'Administrador';
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;

    let fallo = false;
    const seguro = <T>(valor: T) => catchError<T, Observable<T>>(() => {
      fallo = true;
      return of(valor);
    });

    forkJoin({
      metricas: this.soporte.metricas().pipe(seguro<any>({})),
      usuarios: this.usuarioService.listar().pipe(seguro<any[]>([])),
      errores: this.soporte.errores().pipe(seguro<any[]>([])),
      feedback: this.soporte.feedback().pipe(seguro<any[]>([]))
    }).subscribe(r => {
      this.metricas = r.metricas || {};
      this.usuarios = r.usuarios || [];
      this.errores = (r.errores || []).slice().reverse();
      this.feedback = (r.feedback || []).slice().reverse();
      this.sinConexion = fallo;
      this.cargando = false;
    });
  }

  usuariosActivos(): number {
    return this.usuarios.filter(u => u.estado !== false).length;
  }

  usuariosPorRol(rol: string): number {
    return this.usuarios.filter(u => this.normalizarRol(u.rol) === rol).length;
  }

  porcentajeRol(rol: string): number {
    return this.usuarios.length ? Math.round((this.usuariosPorRol(rol) / this.usuarios.length) * 100) : 0;
  }

  promedioFeedback(): string {
    const notas = this.feedback.map(f => Number(f.calificacion)).filter(n => !isNaN(n));
    return notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '-';
  }

  uptime(): string {
    const s = Number(this.metricas.uptimeSegundos || 0);
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  }

  private normalizarRol(rol: any): string {
    return String(rol || '').replace('ROLE_', '').toUpperCase();
  }
}
