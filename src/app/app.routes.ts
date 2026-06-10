import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [

      { 
        path: 'dashboard', 
        loadComponent: () => import('./pages/dashboard/dashboard.component')
          .then(m => m.DashboardComponent) 
      },

      { path: 'pacientes', loadComponent: () => import('./pages/pacientes/pacientes.component').then(m => m.PacientesComponent) },
      { path: 'citas', loadComponent: () => import('./pages/citas/citas.component').then(m => m.CitasComponent) },
      { path: 'historias-clinicas', loadComponent: () => import('./pages/historia/historia.component').then(m => m.HistoriaComponent) },
      { path: 'prediccion', loadComponent: () => import('./pages/prediccion/prediccion.component').then(m => m.PrediccionComponent) },
      { path: 'sincronizacion', loadComponent: () => import('./pages/sincronizacion/sincronizacion.component').then(m => m.SincronizacionComponent) },
      { path: 'reportes', loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent) },
      { path: 'pacientes/nuevo', loadComponent: () => import('./pages/pacientes/paciente-form-page/paciente-form-page.component') .then(m => m.PacienteFormPageComponent)},
      { path: 'pacientes/editar/:id', loadComponent: () => import('./pages/pacientes/paciente-form-page/paciente-form-page.component').then(m => m.PacienteFormPageComponent)},
      { path: 'pacientes/:id', loadComponent: () => import('./pages/pacientes/paciente-detalle/paciente-detalle.component') .then(m => m.PacienteDetalleComponent)},
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
