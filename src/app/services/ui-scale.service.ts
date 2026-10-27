import { Injectable } from '@angular/core';

export type PreferenciaTamano = 'auto' | 'compacto' | 'normal';

const CLAVE = 'hceTamanoInterfaz';

/** Por debajo de este ancho rige el diseno movil/tablet existente y no se escala. */
const ANCHO_MINIMO_ESCALADO = 900;

/**
 * Tamano de la interfaz. Compensa pantallas con poco ancho util (por ejemplo laptops con escalado de
 * Windows al 150 %) reduciendo todo de forma uniforme con la propiedad `zoom` del documento.
 */
@Injectable({
  providedIn: 'root'
})
export class UiScaleService {

  readonly opciones: { valor: PreferenciaTamano; etiqueta: string; ayuda: string }[] = [
    { valor: 'auto', etiqueta: 'Automático', ayuda: 'Se adapta al tamaño de la pantalla' },
    { valor: 'compacto', etiqueta: 'Compacto', ayuda: 'Más contenido en pantalla' },
    { valor: 'normal', etiqueta: 'Normal', ayuda: 'Tamaño original' }
  ];

  private actual: PreferenciaTamano = this.leer();
  private pendiente: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.aplicar();

    window.addEventListener('resize', () => {
      if (this.pendiente) {
        clearTimeout(this.pendiente);
      }

      this.pendiente = setTimeout(() => this.aplicar(), 120);
    });
  }

  get preferencia(): PreferenciaTamano {
    return this.actual;
  }

  set preferencia(valor: PreferenciaTamano) {
    this.actual = valor;

    try {
      localStorage.setItem(CLAVE, valor);
    } catch {
      // Sin almacenamiento: la preferencia vale solo para esta sesion.
    }

    this.aplicar();
  }

  /** Factor de escala segun el ancho de la ventana y la preferencia elegida. */
  get factor(): number {
    const ancho = window.innerWidth;

    if (ancho < ANCHO_MINIMO_ESCALADO || this.actual === 'normal') {
      return 1;
    }

    if (this.actual === 'compacto') {
      return 0.85;
    }

    if (ancho >= 1600) return 1;
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

  private leer(): PreferenciaTamano {
    try {
      const guardada = localStorage.getItem(CLAVE);
      return guardada === 'compacto' || guardada === 'normal' ? guardada : 'auto';
    } catch {
      return 'auto';
    }
  }
}
