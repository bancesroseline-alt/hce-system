import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  username = '';
  password = '';

  error = '';
  loading = false;
  estado = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    if (navigator.onLine) {
      this.authService.precalentarServidor();
    }
  }

  login(): void {

    this.error = '';

    if (!this.username || !this.password) {
      this.error = 'Complete todos los campos';
      return;
    }

    this.loading = true;
    this.estado = '';

    this.authService.login({
      username: this.username,
      password: this.password
    }, mensaje => this.estado = mensaje).subscribe({

      next: (res) => {

        this.loading = false;

        if (res.modoOffline) {
          console.warn('Ingreso autorizado en modo offline');
        }

        this.router.navigate(['/dashboard']);
      },

      error: (err) => {

        console.error(err);
        this.loading = false;
        this.estado = '';
        this.error = err?.mensaje || 'No se pudo iniciar sesión. Intenta nuevamente.';
      }

    });
  }
}