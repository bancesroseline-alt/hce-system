import { Injectable } from '@angular/core';

/** Por debajo de este ancho rige el diseno movil/tablet existente y no se escala. */
const ANCHO_MINIMO_ESCALADO = 900;

/**
 * Escala automatica de la interfaz. Compensa pantallas con poco ancho util (por ejemplo laptops con
 * escalado de Windows al 150 %) reduciendo todo de forma uniforme con la propiedad `zoom` del documento.
 */
@Injectable({
  providedIn: 'root'
})
export class UiScaleService {

  private pendiente: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Version anterior: existia un selector manual; se descarta cualquier preferencia guardada.
    try {
      localStorage.removeItem('hceTamanoInterfaz');
    } catch {
      // Sin almacenamiento: nada que limpiar.
    }

    this.aplicar();

    window.addEventListener('resize', () => {
      if (this.pendiente) {
        clearTimeout(this.pendiente);
      }

      this.pendiente = setTimeout(() => this.aplicar(), 120);
    });
  }

  /** Factor de escala segun el ancho de la ventana. */
  get factor(): number {
    const ancho = window.innerWidth;

    if (ancho < ANCHO_MINIMO_ESCALADO || ancho >= 1600) return 1;
    if (ancho >= 1366) return 0.92;
    return 0.85;
  }

  private aplicar(): void {
    const factor = this.factor;
    const raiz = document.documentElement;

    raiz.style.setProperty('--ui-zoom', String(factor));

    if (factor === 1) {
      raiz.style.removeProperty('zoom');
    } else {
      raiz.style.setProperty('zoom', String(factor));
    }
  }
}
