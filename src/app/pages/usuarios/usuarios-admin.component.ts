import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-admin.component.html',
  styleUrl: './usuarios-admin.component.css'
})
export class UsuariosAdminComponent implements OnInit {

  usuarios: Usuario[] = [];
  mensaje = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  cargando = false;
  guardando = false;

  confirmarPassword = '';
  datosApoyo = {
    documento: '',
    telefono: '',
    correoPersonal: ''
  };

  usuario: Usuario = {
    nombres: '',
    apellidos: '',
    username: '',
    password: '',
    rol: 'MEDICO',
    estado: true
  };

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;

    this.usuarioService.listar().subscribe({
      next: data => {
        this.usuarios = data || [];
        this.cargando = false;
      },
      error: err => {
        console.error('Error cargando usuarios', err);
        this.mensaje = 'No se pudieron cargar los usuarios';
        this.tipoMensaje = 'error';
        this.cargando = false;
      }
    });
  }

  autocompletarUsername(): void {
    if (this.usuario.username?.trim()) return;

    const base = this.datosApoyo.correoPersonal?.trim();
    if (base) {
      this.usuario.username = base;
      return;
    }

    const nombres = this.usuario.nombres.trim().toLowerCase().replace(/\s+/g, '.');
    const apellidos = this.usuario.apellidos.trim().toLowerCase().replace(/\s+/g, '.');

    if (nombres && apellidos) {
      this.usuario.username = `${nombres}.${apellidos}`;
    }
  }

  guardar(): void {
    this.mensaje = '';
    this.tipoMensaje = '';
    this.autocompletarUsername();

    if (!this.usuario.nombres.trim() || !this.usuario.apellidos.trim()) {
      this.mostrarError('Nombre y apellidos son obligatorios');
      return;
    }

    if (!this.datosApoyo.documento.trim()) {
      this.mostrarError('DNI/NIF es obligatorio para registrar el usuario');
      return;
    }

    if (!this.usuario.username.trim()) {
      this.mostrarError('Correo o nombre de usuario es obligatorio');
      return;
    }

    if (!this.usuario.password || this.usuario.password.length < 6) {
      this.mostrarError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (this.usuario.password !== this.confirmarPassword) {
      this.mostrarError('Las contrasenas no coinciden');
      return;
    }

    this.guardando = true;

    this.usuarioService.crear(this.usuario).subscribe({
      next: () => {
        this.mensaje = 'Usuario creado correctamente';
        this.tipoMensaje = 'success';
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarUsuarios();
      },
      error: err => {
        console.error('Error creando usuario', err);
        this.mostrarError(err.error?.message || 'No se pudo crear el usuario');
        this.guardando = false;
      }
    });
  }

  cambiarRol(usuario: Usuario, rol: string): void {
    if (!usuario.id) return;

    this.usuarioService.actualizarRol(usuario.id, rol).subscribe({
      next: actualizado => {
        usuario.rol = actualizado.rol;
        this.mensaje = 'Rol actualizado correctamente';
        this.tipoMensaje = 'success';
      },
      error: err => {
        console.error('Error actualizando rol', err);
        this.mostrarError('No se pudo actualizar el rol');
      }
    });
  }

  fortalezaPassword(): number {
    const password = this.usuario.password || '';
    let score = 0;

    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  }

  private mostrarError(texto: string): void {
    this.mensaje = texto;
    this.tipoMensaje = 'error';
  }

  private limpiarFormulario(): void {
    this.usuario = {
      nombres: '',
      apellidos: '',
      username: '',
      password: '',
      rol: 'MEDICO',
      estado: true
    };

    this.confirmarPassword = '';
    this.datosApoyo = {
      documento: '',
      telefono: '',
      correoPersonal: ''
    };
  }
}
