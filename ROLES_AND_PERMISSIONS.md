# Roles y Permisos

Este documento describe las caracteristicas implementadas por rol en el frontend HCE.

## Roles soportados

| Rol | Descripcion |
| --- | --- |
| `ADMIN` | Gestiona usuarios, reportes, pacientes, historia clinica, prediccion y trazabilidad. |
| `MEDICO` | Gestiona atenciones, citas, pacientes, historia clinica, prediccion, trazabilidad y reportes. |
| `ENFERMERO` | Accede a pacientes, citas, historia clinica y sincronizacion operativa. |

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
- Pacientes.
- Historia clinica.
- Prediccion ML.
- Sincronizacion.
- Trazabilidad.
- Reportes.

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

- La pantalla de usuarios usa los campos actuales del backend: nombres, apellidos, username, password, rol y estado.
- DNI, telefono y correo personal se usan como apoyo visual del formulario, pero no se persisten porque el modelo backend `Usuario` aun no contiene esos campos.
- La seguridad real sigue dependiendo del backend. El frontend oculta y bloquea rutas, pero el backend debe mantener las restricciones por rol.
