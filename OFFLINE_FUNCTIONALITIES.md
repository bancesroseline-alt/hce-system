# Funcionalidades Offline - Frontend HCE

Este frontend usa una estrategia offline-first parcial. La primera carga de la app y el primer login requieren internet, pero luego los modulos principales pueden trabajar con datos locales en IndexedDB y sincronizar pendientes cuando vuelve la conexion.

## Cambios Principales

- Se agrego timeout de 4 segundos a servicios HTTP criticos para evitar esperas largas cuando el backend remoto esta lento.
- `IndexedDbService` ahora incluye stores para `pacientes`, `citas`, `atenciones`, `predicciones`, `usuarios`, `dashboard`, `reportes` y `syncQueue`.
- `PacienteService` permite listar, buscar, obtener, registrar, editar y dar de baja pacientes con fallback offline.
- `CitaOfflineService` permite listar citas, listar por paciente, registrar, editar y cambiar estado con fallback offline.
- `AtencionOfflineService` permite registrar y consultar atenciones offline.
- `PrediccionService` usa la API ML si esta disponible y una estimacion local si no hay conexion.
- `SyncQueueService` sincroniza acciones pendientes segun entidad y accion.
- `PacienteCitasComponent` dejo de usar `HttpClient` directo y ahora usa servicios offline.
- El formulario de pacientes ya no bloquea el guardado esperando una validacion online previa.
- El dashboard calcula metricas desde IndexedDB si el backend no responde.

## Flujo de Escritura Offline

1. El usuario registra o modifica datos.
2. El servicio intenta enviar al backend con timeout corto.
3. Si falla, guarda en IndexedDB.
4. Agrega un pendiente en `syncQueue`.
5. La pantalla de sincronizacion reintenta cuando hay internet.

## Entidades Sincronizadas

| Entidad | Acciones |
| --- | --- |
| `PACIENTE` | Crear, actualizar, baja. |
| `CITA` | Crear, actualizar, actualizar estado. |
| `ATENCION` | Crear. |
| `PREDICCION` | Persistencia local. |

## Limites

- El primer login de un usuario requiere internet.
- La prediccion offline es una estimacion local, no el modelo ML real.
- Si un dato nunca fue descargado ni creado en el navegador, no estara disponible offline.
- Si se borra el almacenamiento del navegador, se pierden datos locales y autorizacion offline.
