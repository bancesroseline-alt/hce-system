import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SoporteService } from '../../services/soporte.service';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './soporte.component.html',
  styleUrl: './soporte.component.css'
})
export class SoporteComponent {
  tipo: 'ERROR' | 'FEEDBACK' = 'ERROR';
  modulo = '';
  descripcion = '';
  comentario = '';
  calificacion = 5;
  enviando = false;
  mensaje = '';
  esError = false;

  constructor(private soporte: SoporteService) {}

  enviarError(): void {
    if (!this.modulo.trim() || this.descripcion.trim().length < 10) {
      this.mostrar('Indica el modulo y una descripcion de al menos 10 caracteres.', true);
      return;
    }
    this.enviando = true;
    this.soporte.reportarError({ usuarioId: this.usuarioId(), modulo: this.modulo, descripcion: this.descripcion }).subscribe({
      next: () => { this.enviando = false; this.modulo = ''; this.descripcion = ''; this.mostrar('Error reportado correctamente.', false); },
      error: () => { this.enviando = false; this.mostrar('No se pudo registrar el error.', true); }
    });
  }

  enviarFeedback(): void {
    if (this.comentario.trim().length < 5 || this.calificacion < 1 || this.calificacion > 5) {
      this.mostrar('Escribe un comentario y selecciona una calificacion de 1 a 5.', true);
      return;
    }
    this.enviando = true;
    this.soporte.enviarFeedback({ usuarioId: this.usuarioId(), comentario: this.comentario, calificacion: this.calificacion }).subscribe({
      next: () => { this.enviando = false; this.comentario = ''; this.calificacion = 5; this.mostrar('Gracias. Tu feedback fue registrado.', false); },
      error: () => { this.enviando = false; this.mostrar('No se pudo enviar el feedback.', true); }
    });
  }

  private usuarioId(): number | null { return JSON.parse(localStorage.getItem('usuario') || '{}')?.id || null; }
  private mostrar(texto: string, error: boolean): void { this.mensaje = texto; this.esError = error; }
}
