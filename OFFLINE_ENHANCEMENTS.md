# Mejoras Offline y Sincronizacion

Este documento resume las mejoras agregadas para fortalecer el modo offline del frontend HCE.

## 1. URL de API centralizada

Se agregaron environments de Angular:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

La aplicacion ahora usa:

```ts
environment.apiBaseUrl
environment.mlApiUrl
```

Con esto los servicios ya no dependen de URLs escritas directamente en cada archivo.

Configuracion actual:

| Ambiente | API |
| --- | --- |
| Desarrollo | `http://localhost:8080/api` |
| Produccion | `https://hce-backend.onrender.com/api` |

## 2. Badges visuales de sincronizacion

Se agrego el helper:

```text
src/app/utils/sync-status.util.ts
```

Estados visibles:

| Estado | Significado |
| --- | --- |
| `PENDIENTE` | El registro existe localmente y aun no fue enviado al backend. |
| `SINCRONIZADO` | El registro ya fue enviado o proviene del backend. |
| `ERROR_SYNC` | El intento de sincronizacion fallo y requiere revision. |

Los badges se muestran en:

- Listado de pacientes.
- Listado de citas.
- Historial de citas por paciente.
- Pantalla de sincronizacion.

## 3. Errores por registro

IndexedDB ahora incluye el store:

```text
syncErrors
```

Cuando una sincronizacion falla:

1. El pendiente cambia a `ERROR_SYNC`.
2. Se guarda el error en `syncErrors`.
3. La entidad local tambien cambia su `estadoSync` a `ERROR_SYNC`.
4. La pantalla de sincronizacion permite abrir el detalle del error.

## 4. Resolucion de conflictos

IndexedDB ahora incluye el store:

```text
conflicts
```

Cuando el backend responde con un error compatible con conflicto, duplicado o registro ya existente, se crea un conflicto local.

La pantalla de sincronizacion permite:

- `Usar local`: el pendiente vuelve a `PENDIENTE` para reintentar sincronizar la version local.
- `Usar remoto`: el pendiente se marca como `SINCRONIZADO` y se conserva la version remota como referencia del conflicto.

Limite actual:

- La comparacion avanzada campo por campo aun no esta implementada.
- Si el backend no devuelve el registro remoto completo, el detalle remoto puede contener solo el mensaje de error.

## 5. Detalle de errores y conflictos

La pantalla:

```text
src/app/pages/sincronizacion
```

ahora muestra:

- Pendientes.
- Errores de sincronizacion.
- Conflictos.
- Detalle JSON por registro.
- Acciones de resolucion para conflictos.

## 6. Reportes locales

La pantalla:

```text
src/app/pages/reportes
```

ahora calcula informacion usando IndexedDB:

- Total de pacientes.
- Pacientes activos.
- Total de citas.
- Citas del dia.
- Total de atenciones.
- Porcentaje de inasistencia.
- Pendientes por sincronizar.
- Errores de sincronizacion.
- Citas por estado.
- Especialidades con mas citas.
- Predicciones por nivel de riesgo.
- Actividad local reciente.

Tambien guarda una copia del reporte generado en el store:

```text
reportes
```

## Archivos principales modificados

- `angular.json`
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- `src/app/utils/sync-status.util.ts`
- `src/app/services/*`
- `src/app/pages/sincronizacion/*`
- `src/app/pages/reportes/*`
- `src/app/pages/pacientes/*`
- `src/app/pages/citas/*`
- `src/app/pages/paciente-citas/*`

## Validaciones recomendadas

1. Ejecutar `npm run build`.
2. Probar `ng serve` en desarrollo con backend local en `localhost:8080`.
3. Crear una cita o paciente offline.
4. Revisar badge `PENDIENTE`.
5. Forzar error de sincronizacion y revisar `ERROR_SYNC`.
6. Entrar a Sincronizacion y abrir el detalle del registro.
7. Entrar a Reportes y validar los indicadores locales.
