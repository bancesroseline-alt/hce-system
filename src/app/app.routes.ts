import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

// Personal de salud: modulos clinicos. ADMIN solo gestiona y monitorea el sistema.
const SALUD = ['MEDICO', 'ENFERMERO'];
const ADMIN = ['ADMIN'];

export const routes: Routes = [

  // =====================
  // LOGIN (PUBLICO)
  // =====================
  { path: 'login', component: LoginComponent },

  // =====================
  // APP PROTEGIDA
  // =====================
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [

      // DASHBOARD
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      // =====================
      // PACIENTES
      // =====================
      {
        path: 'pacientes',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/pacientes/pacientes.component')
            .then(m => m.PacientesComponent)
      },

      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ADMIN },
        loadComponent: () =>
          import('./pages/usuarios/usuarios-admin.component')
            .then(m => m.UsuariosAdminComponent)
      },

      {
        path: 'pacientes/nuevo',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/pacientes/paciente-form-page/paciente-form-page.component')
            .then(m => m.PacienteFormPageComponent)
      },

      {
        path: 'pacientes/editar/:id',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/pacientes/paciente-form-page/paciente-form-page.component')
            .then(m => m.PacienteFormPageComponent)
      },

      {
        path: 'pacientes/:id',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/pacientes/paciente-detalle/paciente-detalle.component')
            .then(m => m.PacienteDetalleComponent)
      },
      
      // =====================
      // HISTORIAS CLÍNICAS
      // =====================
           {
        path: 'historias-clinicas',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/historia/historia.component')
            .then(m => m.HistoriaComponent)
      },
      {
        path: 'historias-clinicas/:id',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/historia/historia.component')
            .then(m => m.HistoriaComponent)
      },
      {
        path: 'atenciones/nueva/:pacienteId',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/registro-atencion/registro-atencion.component')
            .then(m => m.RegistroAtencionComponent)
      },
      {
        path: 'atenciones/nueva/:pacienteId/cita/:citaId',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/registro-atencion/registro-atencion.component')
            .then(m => m.RegistroAtencionComponent)
      },
      {
        path: 'atenciones/:id',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/registro-atencion/atencion-detalle/atencion-detalle.component')
            .then(m => m.AtencionDetalleComponent)
      },

      // =====================
      // CITAS
      // =====================
      {
        path: 'citas',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/citas/citas.component')
            .then(m => m.CitasComponent)
      },

      {
        path: 'citas/paciente/:id',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/citas/citas.component')
            .then(m => m.CitasComponent)
      },

      {
        path: 'citas/nueva/:id',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/citas/citas.component')
            .then(m => m.CitasComponent)
      },

      {
        path: 'citas/:id',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/citas/cita-detalle/cita-detalle.component')
            .then(m => m.CitaDetalleComponent)
      },

              {
          path: 'pacientes/:id/citas',
          canActivate: [roleGuard],
          data: { roles: SALUD },
          loadComponent: () =>
            import('./pages/paciente-citas/paciente-citas.component')
              .then(m => m.PacienteCitasComponent)
        },

        {
          path: 'atenciones/emergencia/:pacienteId',
          canActivate: [roleGuard],
          data: { roles: SALUD },
          loadComponent: () =>
            import('./pages/registro-atencion/registro-atencion.component')
              .then(m => m.RegistroAtencionComponent)
        },

      // =====================
      // OTROS MÓDULOS
      // =====================
      {
        path: 'prediccion',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/prediccion/prediccion.component')
            .then(m => m.PrediccionComponent)
      },

      {
        path: 'sincronizacion',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () =>
          import('./pages/sincronizacion/sincronizacion.component')
            .then(m => m.SincronizacionComponent)
      },

      {
        path: 'trazabilidad',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MEDICO', 'ENFERMERO'] },
        loadComponent: () =>
          import('./pages/trazabilidad/trazabilidad.component')
            .then(m => m.TrazabilidadComponent)
      },

      {
        path: 'reportes',
        canActivate: [roleGuard],
        data: { roles: ADMIN },
        loadComponent: () =>
          import('./pages/reportes/reportes.component')
            .then(m => m.ReportesComponent)
      },
      {
        path: 'soporte',
        canActivate: [roleGuard],
        data: { roles: SALUD },
        loadComponent: () => import('./pages/soporte/soporte.component').then(m => m.SoporteComponent)
      },
      {
        path: 'monitoreo',
        canActivate: [roleGuard],
        data: { roles: ADMIN },
        loadComponent: () => import('./pages/monitoreo/monitoreo.component').then(m => m.MonitoreoComponent)
      },

      // REDIRECCIÓN
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // =====================
  // FALLBACK
  // =====================
  { path: '**', redirectTo: 'login' }
];
