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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    // REDIRECCIÓN AUTOMÁTICA
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

  }

  login(): void {

    this.error = '';

    // VALIDACIÓN
    if (!this.username || !this.password) {

      this.error = 'Complete todos los campos';

      return;
    }

    if (!navigator.onLine && this.authService.isLoggedIn()) {
    this.router.navigate(['/dashboard']);
    return;
  }

    this.loading = true;

    this.authService.login({

      username: this.username,
      password: this.password

    }).subscribe({

      next: (res) => {

        // GUARDAR SESIÓN
        this.authService.saveSession(res);

        // REDIRECCIÓN
        this.router.navigate(['/dashboard']);

      },

      error: (err) => {

        console.error(err);

        this.loading = false;

        if (err.status === 401) {

          this.error = 'Usuario o contraseña incorrectos';

        } else if (err.status === 0) {

          this.error = 'No se pudo conectar al servidor';

        } else {

          this.error = 'Error al iniciar sesión';

        }

      }

    });

  }

}