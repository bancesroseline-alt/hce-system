import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

/** Dialogo de confirmacion para acciones que modifican datos (cancelar una cita, dar de baja, etc.). */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="backdrop" *ngIf="abierto" (click)="cancelar.emit()"></div>

    <div class="dialog" *ngIf="abierto" role="alertdialog" aria-modal="true" [attr.aria-label]="titulo">
      <h3>{{ titulo }}</h3>
      <p>{{ mensaje }}</p>

      <div class="actions">
        <button type="button" class="secondary" (click)="cancelar.emit()" [disabled]="procesando">
          {{ textoCancelar }}
        </button>

        <button type="button" class="primary" [class.danger]="peligro" (click)="confirmar.emit()" [disabled]="procesando">
          {{ procesando ? 'Procesando...' : textoConfirmar }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.45);
    }

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      z-index: 1001;
      width: min(420px, calc(100vw - 32px));
      transform: translate(-50%, -50%);
      padding: 20px 22px 18px;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
    }

    h3 {
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 17px;
      font-weight: 700;
    }

    p {
      margin: 0 0 18px;
      color: #475569;
      font-size: 14px;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    button {
      height: 36px;
      padding: 0 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .secondary {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
    }

    .primary {
      border: 0;
      background: #2563eb;
      color: #ffffff;
    }

    .primary.danger {
      background: #dc2626;
    }

    button:disabled {
      opacity: 0.6;
      cursor: default;
    }
  `]
})
export class ConfirmDialogComponent {

  @Input() abierto = false;
  @Input() titulo = 'Confirmar acción';
  @Input() mensaje = '';
  @Input() textoConfirmar = 'Confirmar';
  @Input() textoCancelar = 'Volver';
  @Input() peligro = true;
  @Input() procesando = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    if (this.abierto && !this.procesando) {
      this.cancelar.emit();
    }
  }
}
