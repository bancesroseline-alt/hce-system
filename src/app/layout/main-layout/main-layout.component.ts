import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { IndexedDbService } from '../../services/indexed-db.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {

  usuario: any;
  mostrarMenuUsuario = false;
  mostrarNotificaciones = false;
  menuItems: any[] = [];
  tituloPagina = 'Dashboard';
  breadcrumbs: Array<{ label: string; route?: string }> = [];
  notificaciones: Array<{ tipo: string; titulo: string; detalle: string; route: string; severity: 'info' | 'warning' | 'danger' }> = [];
  totalNotificaciones = 0;

  private readonly items = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      roles: ['ADMIN', 'MEDICO', 'ENFERMERO'],
      icon: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z'
    },
    {
      label: 'Gestion de usuarios',
      route: '/usuarios',
      roles: ['ADMIN'],
      icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Zm7-2v-2h-2V8h2V6h2v2h2v2h-2v2h-2Z'
    },
    {
      label: 'Pacientes',
      route: '/pacientes',
      roles: ['ADMIN', 'MEDICO', 'ENFERMERO'],
      icon: 'M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z'
    },
    {
      label: 'Citas',
      route: '/citas',
      roles: ['ADMIN', 'MEDICO', 'ENFERMERO'],
      icon: 'M7 2h2v2h6V2h2v2h3c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h3V2Zm13 8H4v10h16V10ZM4 8h16V6H4v2Zm3 4h4v4H7v-4Z'
    },
    {
      label: 'Historia clinica',
      route: '/historias-clinicas',
      roles: ['ADMIN', 'MEDICO', 'ENFERMERO'],
      icon: 'M6 2h9l5 5v15c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Zm0-8h4v2H8V8Z'
    },
    {
      label: 'Prediccion (ML)',
      route: '/prediccion',
      roles: ['ADMIN', 'MEDICO', 'ENFERMERO'],
      icon: 'M12 2c1.1 0 2 .9 2 2v1h2c1.1 0 2 .9 2 2v2h1c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-1v2c0 1.1-.9 2-2 2h-2v1c0 1.1-.9 2-2 2s-2-.9-2-2v-1H8c-1.1 0-2-.9-2-2v-2H5c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2h1V7c0-1.1.9-2 2-2h2V4c0-1.1.9-2 2-2Zm-4 5v10h8V7H8Zm2 3h4v2h-4v-2Zm0 4h4v2h-4v-2Z'
    },
    {
      label: 'Sincronizacion',
      route: '/sincronizacion',
      roles: ['ADMIN', 'MEDICO', 'ENFERMERO'],
      icon: 'M12 4c2.1 0 4.01.81 5.43 2.14L15 8.57h7V1.57l-2.45 2.45C17.55 2.15 14.9 1 12 1 6.93 1 2.69 4.55 1.26 9.3l2.87.86C5.17 6.6 8.32 4 12 4Zm0 16c-2.1 0-4.01-.81-5.43-2.14L9 15.43H2v7l2.45-2.45C6.45 21.85 9.1 23 12 23c5.07 0 9.31-3.55 10.74-8.3l-2.87-.86C18.83 17.4 15.68 20 12 20Z'
    },
    {
      label: 'Trazabilidad',
      route: '/trazabilidad',
      roles: ['ADMIN', 'MEDICO', 'ENFERMERO'],
      icon: 'M12 2 3 7v6c0 5 3.8 8.7 9 9 5.2-.3 9-4 9-9V7l-9-5Zm0 3.2 6 3.3V13c0 3.4-2.3 5.8-6 6-3.7-.2-6-2.6-6-6V8.5l6-3.3Zm-1 4.8h2v5h-2v-5Zm0 6h2v2h-2v-2Z'
    },
    {
      label: 'Reportes',
      route: '/reportes',
      roles: ['ADMIN', 'MEDICO', 'ENFERMERO'],
      icon: 'M4 19h16v2H4v-2Zm2-8h3v6H6v-6Zm5-6h3v12h-3V5Zm5 3h3v9h-3V8Z'
    }
  ];

  constructor(
    private router: Router,
    private indexedDb: IndexedDbService
  ) {}

  ngOnInit(): void {
    this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const rol = this.normalizarRol(this.usuario?.rol);
    this.menuItems = this.items.filter(item => item.roles.includes(rol));
    this.actualizarBreadcrumb(this.router.url);
    this.cargarNotificaciones();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.actualizarBreadcrumb(event.urlAfterRedirects || event.url);
        this.mostrarMenuUsuario = false;
        this.mostrarNotificaciones = false;
        this.cargarNotificaciones();
      });

    window.addEventListener('online', () => this.cargarNotificaciones());
    window.addEventListener('focus', () => this.cargarNotificaciones());
  }

  toggleUserMenu(): void {
    this.mostrarMenuUsuario = !this.mostrarMenuUsuario;
    this.mostrarNotificaciones = false;
  }

  toggleNotificaciones(): void {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
    this.mostrarMenuUsuario = false;
    this.cargarNotificaciones();
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  async cargarNotificaciones(): Promise<void> {
    try {
      const [pendientes, errores, conflictos] = await Promise.all([
        this.indexedDb.obtenerPendientes(),
        this.indexedDb.obtenerTodos('syncErrors'),
        this.indexedDb.obtenerTodos('conflicts')
      ]);

      this.notificaciones = [];

      if (pendientes.length > 0) {
        this.notificaciones.push({
          tipo: 'Pendientes',
          titulo: `${pendientes.length} registro${pendientes.length === 1 ? '' : 's'} por sincronizar`,
          detalle: 'Hay cambios locales esperando conexión o sincronización manual.',
          route: '/sincronizacion',
          severity: 'warning'
        });
      }

      if (errores.length > 0) {
        this.notificaciones.push({
          tipo: 'Errores',
          titulo: `${errores.length} error${errores.length === 1 ? '' : 'es'} de sincronización`,
          detalle: 'Revisa los registros fallidos para reintentarlos o ver el detalle.',
          route: '/sincronizacion',
          severity: 'danger'
        });
      }

      const conflictosActivos = conflictos.filter((c: any) => c.estado !== 'RESUELTO_LOCAL' && c.estado !== 'RESUELTO_REMOTO');

      if (conflictosActivos.length > 0) {
        this.notificaciones.push({
          tipo: 'Conflictos',
          titulo: `${conflictosActivos.length} conflicto${conflictosActivos.length === 1 ? '' : 's'} detectado${conflictosActivos.length === 1 ? '' : 's'}`,
          detalle: 'Necesitan revisión para decidir si conservar dato local o remoto.',
          route: '/sincronizacion',
          severity: 'danger'
        });
      }

      this.totalNotificaciones = pendientes.length + errores.length + conflictosActivos.length;
    } catch (error) {
      this.notificaciones = [{
        tipo: 'Sistema',
        titulo: 'No se pudieron revisar las notificaciones',
        detalle: 'IndexedDB no respondió correctamente en este navegador.',
        route: '/sincronizacion',
        severity: 'info'
      }];
      this.totalNotificaciones = 1;
    }
  }

  irANotificacion(route: string): void {
    this.mostrarNotificaciones = false;
    this.router.navigate([route]);
  }

  inicialUsuario(): string {
    return (this.usuario?.nombres || this.usuario?.username || 'U').charAt(0).toUpperCase();
  }

  nombreUsuario(): string {
    return this.usuario?.nombres || this.usuario?.username || 'Usuario';
  }

  rolUsuarioSidebar(): string {
    const rol = this.normalizarRol(this.usuario?.rol);
    if (rol === 'ADMIN') return 'Administrador';
    if (rol === 'MEDICO') return 'Medico';
    if (rol === 'ENFERMERO') return 'Enfermero';
    return this.usuario?.rol || 'Usuario';
  }

  private normalizarRol(rol: any): string {
    const normalizado = (rol || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace('ROLE_', '')
      .toUpperCase();

    return normalizado === 'ADMINISTRADOR' ? 'ADMIN' : normalizado;
  }

  private actualizarBreadcrumb(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segmentos = cleanUrl.replace(/^\/+/, '').split('/').filter(Boolean);
    const principal = segmentos[0] || 'dashboard';

    const mapa: Record<string, string> = {
      dashboard: 'Dashboard',
      usuarios: 'Gestión de usuarios',
      pacientes: 'Pacientes',
      citas: 'Citas',
      'historias-clinicas': 'Historias clínicas',
      atenciones: 'Registro de atención médica',
      prediccion: 'Predicción ML',
      sincronizacion: 'Sincronización',
      trazabilidad: 'Trazabilidad',
      reportes: 'Reportes locales'
    };

    this.tituloPagina = mapa[principal] || 'Sistema HCE';
    this.breadcrumbs = [{ label: 'Inicio', route: '/dashboard' }];

    if (principal === 'dashboard') {
      this.breadcrumbs = [{ label: 'Dashboard' }];
      return;
    }

    if (principal === 'pacientes') {
      this.breadcrumbs.push({ label: 'Pacientes', route: '/pacientes' });

      if (segmentos[1] === 'nuevo') this.breadcrumbs.push({ label: 'Nuevo paciente' });
      if (segmentos[1] === 'editar') this.breadcrumbs.push({ label: `Editar paciente ${segmentos[2] || ''}`.trim() });
      if (segmentos[1] && !['nuevo', 'editar'].includes(segmentos[1])) {
        this.breadcrumbs.push({ label: `Paciente ${segmentos[1]}`, route: `/pacientes/${segmentos[1]}` });
      }
      if (segmentos[2] === 'citas') this.breadcrumbs.push({ label: 'Citas' });
      return;
    }

    if (principal === 'citas') {
      this.breadcrumbs.push({ label: 'Citas', route: '/citas' });
      if (segmentos[1] === 'paciente') this.breadcrumbs.push({ label: `Paciente ${segmentos[2] || ''}`.trim() });
      if (segmentos[1] === 'nueva') this.breadcrumbs.push({ label: 'Nueva cita' });
      return;
    }

    if (principal === 'historias-clinicas') {
      this.breadcrumbs.push({ label: 'Historias clínicas', route: '/historias-clinicas' });
      if (segmentos[1]) this.breadcrumbs.push({ label: `Paciente ${segmentos[1]}` });
      return;
    }

    if (principal === 'atenciones') {
      this.breadcrumbs.push({ label: 'Historias clínicas', route: '/historias-clinicas' });
      if (segmentos[2]) this.breadcrumbs.push({ label: `Paciente ${segmentos[2]}`, route: `/historias-clinicas/${segmentos[2]}` });
      this.breadcrumbs.push({ label: 'Nueva atención' });
      return;
    }

    this.breadcrumbs.push({ label: mapa[principal] || principal });
  }
}
