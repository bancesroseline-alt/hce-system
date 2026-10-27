# Roles y Permisos

Este documento describe las caracteristicas implementadas por rol en el frontend HCE.

## Roles soportados

| Rol | Descripcion |
| --- | --- |
| `ADMIN` | Administra el sistema: usuarios y roles, reportes, trazabilidad (validacion de integridad), monitoreo, metricas, logs y feedback. **No accede a informacion clinica** (pacientes, citas, historia clinica, atenciones, prediccion, sincronizacion). |
| `MEDICO` | Personal de salud: pacientes, citas, historia clinica y atenciones, prediccion de inasistencias, sincronizacion offline, trazabilidad (consulta de historial) y soporte. |
| `ENFERMERO` | Mismos modulos operativos que `MEDICO`. |

## Matriz de acceso por modulo

| Modulo | ADMIN | MEDICO / ENFERMERO | Historias de usuario |
| --- | :---: | :---: | --- |
| Dashboard | Si | Si | |
| Gestion de usuarios (alta y roles) | Si | No | HU026, HU028 |
| Trazabilidad | Si | Si | HU023, HU024, HU025 |
| Reportes | Si | No | HU029, HU030, HU035 |
| Monitoreo (metricas, logs, errores, feedback) | Si | No | HU031 a HU035 |
| Pacientes | No | Si | HU004 a HU009 |
| Citas | No | Si | HU010 a HU014 |
| Historia clinica y atenciones | No | Si | HU001 a HU003 |
| Prediccion (ML) | No | Si | HU020 a HU022 |
| Sincronizacion | No | Si | HU015 a HU019 |
| Soporte (reportar error / feedback) | No | Si | HU033, HU036 |

## Restricciones en el backend (`SecurityDisableConfig`)

| Ruta | Roles |
| --- | --- |
| `/api/usuarios/**`, `/api/reportes/**` | `ADMIN` |
| `GET /api/metricas/**`, `/api/logs/**`, `/api/errores/**`, `/api/feedback/**` | `ADMIN` |
| `GET /api/pacientes/**`, `GET /api/citas/**` | `ADMIN`, `MEDICO`, `ENFERMERO` (lectura para alimentar reportes) |
| `/api/pacientes/**`, `/api/citas/**` (crear, editar, baja, cancelar) | `MEDICO`, `ENFERMERO` |
| `/api/atenciones/**`, `/api/historias-clinicas/**`, `/api/predicciones/**`, `/api/sincronizacion/**` | `MEDICO`, `ENFERMERO` |

## Proteccion de rutas

Se agrego:

```text
src/app/guards/role.guard.ts
```

Este guard lee el usuario guardado en `localStorage`, normaliza el rol y valida si la ruta permite ese rol.

Si el rol no esta autorizado, el usuario vuelve a:

```text
/dashboard
```

## Menu dinamico

El menu lateral ahora se genera desde `MainLayoutComponent` y filtra opciones por rol.

Esto evita que perfiles no autorizados vean funciones que no les corresponden.

## Administradores

Los administradores tienen acceso a:

- Dashboard.
- Usuarios.
- Trazabilidad.
- Reportes.
- Monitoreo.

La pantalla principal agregada para administradores es:

```text
src/app/pages/usuarios
```

Permite:

- Crear usuarios.
- Asignar rol `ADMIN`, `MEDICO` o `ENFERMERO`.
- Ver usuarios registrados.
- Cambiar rol de un usuario existente.

## Trazabilidad

Se agrego una pantalla de consulta de trazabilidad:

```text
src/app/pages/trazabilidad
```

Permite:

- Consultar historial blockchain por ID de atencion medica.
- Validar integridad del registro.

Usa los endpoints:

```text
GET /api/trazabilidad/atencion/{id}
GET /api/trazabilidad/validar/{id}
```

## Servicios agregados

- `UsuarioService`: consume `/api/usuarios`.
- `TrazabilidadService`: consume `/api/trazabilidad`.

## Limitaciones

- Reportes obtiene sus datos con lecturas (`GET`) a `/api/pacientes` y `/api/citas`, por eso `ADMIN` conserva solo lectura en esas dos rutas del backend, aunque la interfaz no le muestre esos modulos.
- El Dashboard muestra aun informacion de agenda; para `ADMIN` se ocultan sus enlaces a Citas.

- La pantalla de usuarios usa los campos actuales del backend: nombres, apellidos, username, password, rol y estado.
- DNI, telefono y correo personal se usan como apoyo visual del formulario, pero no se persisten porque el modelo backend `Usuario` aun no contiene esos campos.
- La seguridad real sigue dependiendo del backend. El frontend oculta y bloquea rutas, pero el backend debe mantener las restricciones por rol.
