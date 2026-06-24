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
  busqueda = '';
  mensaje = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  cargando = false;
  guardando = false;
  modoEdicion = false;
  usuarioEditandoId: number | null = null;

  usuario: Usuario = this.crearFormularioVacio();

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
        this.mostrarError('No se pudieron cargar los usuarios');
        this.cargando = false;
      }
    });
  }

  usuariosFiltrados(): Usuario[] {
    const q = this.busqueda.trim().toLowerCase();

    if (!q) return this.usuarios;

    return this.usuarios.filter(u =>
      `${u.nombres || ''}`.toLowerCase().includes(q) ||
      `${u.apellidos || ''}`.toLowerCase().includes(q) ||
      `${u.username || ''}`.toLowerCase().includes(q)
    );
  }

  guardar(): void {
    this.mensaje = '';
    this.tipoMensaje = '';

    if (!this.validarFormulario()) return;

    const usernameDuplicado = this.usuarios.some(u =>
      u.username.trim().toLowerCase() === this.usuario.username.trim().toLowerCase() &&
      u.id !== this.usuarioEditandoId
    );

    if (usernameDuplicado) {
      this.mostrarError('Ya existe un usuario con ese username');
      return;
    }

    this.guardando = true;

    const request = this.modoEdicion && this.usuarioEditandoId
      ? this.usuarioService.actualizar(this.usuarioEditandoId, this.usuario)
      : this.usuarioService.crear(this.usuario);

    request.subscribe({
      next: () => {
        this.mensaje = this.modoEdicion
          ? 'Usuario actualizado correctamente'
          : 'Usuario creado correctamente';
        this.tipoMensaje = 'success';
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarUsuarios();
      },
      error: err => {
        console.error('Error guardando usuario', err);
        this.mostrarError(err.error?.message || 'No se pudo guardar el usuario');
        this.guardando = false;
      }
    });
  }

  editar(usuario: Usuario): void {
    this.modoEdicion = true;
    this.usuarioEditandoId = usuario.id || null;
    this.mensaje = '';
    this.tipoMensaje = '';

    this.usuario = {
      id: usuario.id,
      nombres: usuario.nombres || '',
      apellidos: usuario.apellidos || '',
      username: usuario.username || '',
      password: '',
      rol: usuario.rol,
      estado: usuario.estado !== false
    };
  }

  cambiarEstado(usuario: Usuario): void {
    if (!usuario.id) return;

    const nuevoEstado = usuario.estado === false;

    this.usuarioService.cambiarEstado(usuario.id, nuevoEstado).subscribe({
      next: actualizado => {
        usuario.estado = actualizado.estado;
        this.mensaje = actualizado.estado ? 'Usuario activado correctamente' : 'Usuario desactivado correctamente';
        this.tipoMensaje = 'success';
      },
      error: err => {
        console.error('Error actualizando estado', err);
        this.mostrarError('No se pudo actualizar el estado del usuario');
      }
    });
  }

  eliminar(usuario: Usuario): void {
    if (!usuario.id) return;

    const confirmado = window.confirm(`Seguro que deseas eliminar el usuario ${usuario.username}?`);

    if (!confirmado) return;

    this.usuarioService.eliminar(usuario.id).subscribe({
      next: () => {
        this.mensaje = 'Usuario eliminado correctamente';
        this.tipoMensaje = 'success';
        this.cargarUsuarios();
      },
      error: err => {
        console.error('Error eliminando usuario', err);
        this.mostrarError(err.error?.message || 'No se pudo eliminar el usuario');
      }
    });
  }

  limpiarFormulario(): void {
    this.usuario = this.crearFormularioVacio();
    this.modoEdicion = false;
    this.usuarioEditandoId = null;
  }

  cancelar(): void {
    this.limpiarFormulario();
    this.mensaje = '';
    this.tipoMensaje = '';
  }

  etiquetaRol(rol: string): string {
    if (rol === 'ADMIN') return 'ADMINISTRADOR';
    return rol;
  }

  private validarFormulario(): boolean {
    if (!this.usuario.nombres.trim()) {
      this.mostrarError('Nombre obligatorio');
      return false;
    }

    if (!this.usuario.apellidos.trim()) {
      this.mostrarError('Apellido obligatorio');
      return false;
    }

    if (!this.usuario.username.trim()) {
      this.mostrarError('Username obligatorio');
      return false;
    }

    if (!this.modoEdicion && !this.usuario.password?.trim()) {
      this.mostrarError('Contrasena obligatoria');
      return false;
    }

    if (!this.usuario.rol) {
      this.mostrarError('Rol obligatorio');
      return false;
    }

    if (this.usuario.estado === null || this.usuario.estado === undefined) {
      this.mostrarError('Estado obligatorio');
      return false;
    }

    return true;
  }

  private mostrarError(texto: string): void {
    this.mensaje = texto;
    this.tipoMensaje = 'error';
  }

  private crearFormularioVacio(): Usuario {
    return {
      nombres: '',
      apellidos: '',
      username: '',
      password: '',
      rol: 'MEDICO',
      estado: true
    };
  }
}
