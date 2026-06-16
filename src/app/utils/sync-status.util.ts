export type SyncStatus = 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR_SYNC';

export function normalizarEstadoSync(valor: any): SyncStatus {
  if (valor === 'ERROR_SYNC') return 'ERROR_SYNC';
  if (valor === 'PENDIENTE') return 'PENDIENTE';
  return 'SINCRONIZADO';
}

export function etiquetaEstadoSync(valor: any): string {
  const estado = normalizarEstadoSync(valor);

  if (estado === 'ERROR_SYNC') return 'Error sync';
  if (estado === 'PENDIENTE') return 'Pendiente';
  return 'Sincronizado';
}

export function claseEstadoSync(valor: any): string {
  return `sync-${normalizarEstadoSync(valor).toLowerCase()}`;
}
