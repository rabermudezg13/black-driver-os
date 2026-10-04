# Funcionalidades de Black Driver OS

## Consultar viajes por fecha
- Usar el selector de fecha de la página principal y el botón «Ver hoy».
- Mostrar ingresos, promedio por viaje, espera y viajes de la fecha seleccionada.
- Agrupar registros en la zona horaria America/New_York, incluido el cambio de horario.
- Mantener la clave de Shortcuts para leer y modificar registros.

## Diario de predicciones
- Guardar fecha, zonas y horarios previstos, ingresos esperados y notas en Firebase.
- Conservar la fecha de creación de cada predicción.
- Mostrar las predicciones de la fecha seleccionada entre las últimas 100 entradas.
- Comparar ingresos esperados con tarifas y propinas registradas del día completo.
- Indicar cuando la comparación está en curso o no hay viajes registrados.

## Comprobación de cambios
- Ejecutar `npm test`, `npm run typecheck` y `npm run build`.
- Verificar el acceso, un día con registros, un día sin registros y el regreso a hoy.
- No incluir claves ni credenciales en código o documentación.
