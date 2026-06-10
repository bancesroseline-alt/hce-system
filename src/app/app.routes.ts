import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './guards/auth.guard';

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
        loadComponent: () =>
          import('./pages/pacientes/pacientes.component')
            .then(m => m.PacientesComponent)
      },

      {
        path: 'pacientes/nuevo',
        loadComponent: () =>
          import('./pages/pacientes/paciente-form-page/paciente-form-page.component')
            .then(m => m.PacienteFormPageComponent)
      },

      {
        path: 'pacientes/editar/:id',
        loadComponent: () =>
          import('./pages/pacientes/paciente-form-page/paciente-form-page.component')
            .then(m => m.PacienteFormPageComponent)
      },

      {
        path: 'pacientes/:id',
        loadComponent: () =>
          import('./pages/pacientes/paciente-detalle/paciente-detalle.component')
            .then(m => m.PacienteDetalleComponent)
      },

      // =====================
      // HISTORIAS CLÍNICAS
      // =====================
      {
        path: 'historias-clinicas',
        loadComponent: () =>
          import('./pages/historia/historia.component')
            .then(m => m.HistoriaComponent)
      },

      {
        path: 'historias-clinicas/:id',
        loadComponent: () =>
          import('./pages/historia/historia.component')
            .then(m => m.HistoriaComponent)
      },

      {
        path: 'atenciones/nueva/:pacienteId',
        loadComponent: () =>
          import('./pages/registro-atencion/registro-atencion.component')
            .then(m => m.RegistroAtencionComponent)
      }

      // =====================
      // CITAS
      // =====================
      {
        path: 'citas',
        loadComponent: () =>
          import('./pages/citas/citas.component')
            .then(m => m.CitasComponent)
      },

      {
        path: 'citas/paciente/:id',
        loadComponent: () =>
          import('./pages/citas/citas.component')
            .then(m => m.CitasComponent)
      },

      {
        path: 'citas/nueva/:id',
        loadComponent: () =>
          import('./pages/citas/citas.component')
            .then(m => m.CitasComponent)
      },

      // =====================
      // OTROS MÓDULOS
      // =====================
      {
        path: 'prediccion',
        loadComponent: () =>
          import('./pages/prediccion/prediccion.component')
            .then(m => m.PrediccionComponent)
      },

      {
        path: 'sincronizacion',
        loadComponent: () =>
          import('./pages/sincronizacion/sincronizacion.component')
            .then(m => m.SincronizacionComponent)
      },

      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/reportes/reportes.component')
            .then(m => m.ReportesComponent)
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
