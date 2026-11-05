# Validación de incidencias

Realizar las pruebas en un ambiente de QA con la versión que incluya este commit.
Cerrar las pestañas antiguas del sistema y volver a abrirlo conectado antes de
comenzar, para permitir la actualización de la aplicación y su service worker.
No borrar IndexedDB: contiene registros pendientes de sincronización.

## Preparación

- Usar cuentas de Administrador y Médico, según el caso.
- Con conexión, abrir Pacientes y Citas para cargar los datos locales.
- Para trabajar offline en Chrome: F12 → Network → Offline. Para reconectar:
  seleccionar No throttling. El indicador de conexión del sistema debe actualizarse.
- Registrar identificador, paciente, fecha y hora de las citas de prueba y guardar
  capturas antes y después. Usar citas nuevas para comprobar que ya no se generan
  duplicados; los duplicados de versiones anteriores requieren revisión separada.

## 0003234 / CP045: exportar reporte de citas

1. Ingresar como Administrador y abrir Reportes.
2. Filtrar desde 01/01/2026 hasta 31/12/2026, estado PROGRAMADA y especialidad
   Medicina General. Anotar la cantidad total de resultados.
3. Con más de cinco coincidencias, mantener la paginación de cinco y avanzar a
   otra página. Pulsar Exportar XLSX una sola vez.
4. Abrir el archivo descargado en Excel o LibreOffice.

Esperado: archivo .xlsx válido, hoja Citas, columnas Fecha, Hora, Paciente,
Profesional, Especialidad, Tipo y Estado. La cantidad de filas de datos coincide
con el total filtrado, incluyendo otras páginas. No aparecen citas de otra
especialidad, estado o periodo; se incluyen coincidencias de las fechas límite.
Durante la generación aparece Exportando y se deshabilita el botón.

## 0003215 / CP034: Historia clínica en Trazabilidad

1. Ingresar como Médico y abrir Trazabilidad.
2. Seleccionar Historia clínica entre las opciones de entidad.
3. Buscar un paciente con atenciones registradas y abrir Ver trazabilidad.

Esperado: Historia clínica está disponible, se muestran las atenciones asociadas
y se abre el historial de cambios con sus evidencias. La consulta de integridad
responde; si el registro no tiene evidencias, debe informarlo explícitamente.
La historia clínica utiliza las evidencias existentes de las atenciones médicas.

## 0003148 / CP032: mensaje para bajo riesgo

1. Ingresar como Médico y abrir Predicción (ML).
2. Filtrar Bajo riesgo y revisar varios pacientes, incluyendo uno con 0 % si existe.
3. Exportar los resultados y revisar la columna Recomendación.
4. Tras cargar los datos online, activar Offline y volver a abrir el módulo para
   consultar los resultados guardados.
5. Volver online y revisar también pacientes de riesgo medio y alto.

Esperado: todos los pacientes clasificados BAJO muestran «No se requiere
recomendación de reprogramación.», también en la exportación. Se mantiene la
indicación de último resultado guardado cuando corresponde. Las recomendaciones
de riesgo medio y alto se conservan.

## 0003074 / CP017: cancelar offline y sincronizar

1. Activar Offline y crear una cita nueva PROGRAMADA. Anotar paciente, fecha y hora.
2. Ir a Pacientes → Ver citas, abrir Ver / Editar y confirmar Cancelar cita.
3. Cerrar el editor y volver a abrir el historial; revisar también la agenda.
4. Seleccionar No throttling y ejecutar la sincronización desde el sistema.
5. Esperar a que finalice y volver a cargar el historial y la agenda conectados.
6. Repetir con una cita que ya tenía un ID del servidor antes de quedar offline.

Esperado: antes y después de sincronizar existe una sola cita con esos datos,
en estado CANCELADA. Antes figura Pendiente y después Sincronizado. No queda
otra cita PROGRAMADA. Recargar conectado debe mantener el mismo resultado.
Sincronizar nuevamente no debe generar registros adicionales.

## 0003073 / CP024: nombre del paciente en agenda offline

1. Cargar online al paciente Joao David Jiménez Abarca y activar Offline.
2. Crear una cita para ese paciente el 09/11/2026 a las 19:14, completando los
   campos obligatorios. Usar otra hora libre si ya existe una cita de prueba.
3. Consultar esa fecha en la agenda general.
4. Salir y volver a entrar a Citas manteniendo Offline. Comparar con Ver citas
   del paciente. Reconectar, sincronizar y consultar nuevamente.

Esperado: la agenda muestra «Joao David Jiménez Abarca», sin «Sin nombre».
Paciente, fecha, hora y estado coinciden con el historial antes y después de
recargar y sincronizar. Las citas antiguas con solo pacienteId recuperan el
nombre si el paciente está disponible en los datos locales.

## Pruebas automatizadas

Desde la raíz del frontend, con Node.js, npm y Chrome instalados:

```powershell
npm ci
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/reportes/reportes.component.spec.ts --include=src/app/pages/trazabilidad/trazabilidad.component.spec.ts --include=src/app/pages/prediccion/prediccion.component.spec.ts --include=src/app/pages/paciente-citas/paciente-citas.component.spec.ts --include=src/app/pages/citas/citas.component.spec.ts --include=src/app/services/cita-offline.service.spec.ts
npm run build
```

Las pruebas de sincronización usan IndexedDB real en una base aislada y respuestas
HTTP simuladas. La validación manual conectada verifica la integración con el
backend desplegado. Estas pruebas no regularizan duplicados históricos.
