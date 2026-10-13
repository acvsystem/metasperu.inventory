# Manual de soporte y solucion de problemas

## 1. Donde revisar primero

### Frontend

Abrir DevTools del navegador:

- Network.
- Console.
- Application > IndexedDB.
- Application > Local Storage.

### Backend

Revisar:

```bash
pm2 status
pm2 logs inventory-service
pm2 logs auth-service
```

Logs de aplicacion:

```text
metasperu-backend/inventory-service/logs
```

### Base de datos

Revisar:

- Estado de MySQL.
- Conexiones activas.
- Consultas lentas.
- Indices.
- Bloqueos.

## 2. No puedo iniciar sesion

Revisar:

- Usuario existe en `usuarios`.
- Usuario tiene `estado = 1`.
- Password esta correctamente hasheado con bcrypt.
- Auth service esta activo.
- Ruta `/s2/auth/login` responde.
- El frontend apunta al dominio correcto.
- El navegador acepta cookies y localStorage.

## 3. El Pocket no carga sesion

Revisar:

- Codigo de sesion correcto.
- Sesion existe en `inventario_sesiones`.
- Sesion esta activa.
- La sesion tiene subzonas asignadas en `secciones_asginados`.
- API `/section/assigned/:session_code`.

## 4. El Pocket no sincroniza

Revisar:

- Conexion de red.
- URL API en frontend.
- Token valido.
- Endpoint `/sync-bulk`.
- IndexedDB con pendientes.
- Tabla `inventario_pocket_receipts`.
- Logs backend.

Acciones:

1. Abrir pestana Pendientes.
2. Confirmar que existan registros.
3. Presionar Sincronizar.
4. Revisar Network si devuelve error.
5. Revisar PM2/logs.

## 5. Hay duplicados de conteo

Revisar:

- Que cada pendiente tenga `client_scan_id`.
- Que exista tabla `inventario_pocket_receipts`.
- Que el backend confirme ids.
- Que el frontend borre solo confirmados.
- Que no existan importaciones repetidas.

## 6. El dashboard no actualiza en vivo

Revisar:

- Backend inventory-service activo.
- Socket conectado en DevTools.
- Frontend usa socket URL correcta.
- Socket path correcto: `/s3/socket/`.
- Dashboard emitio `join_session`.
- Backend emitio `update_totals`.

## 7. El chat demora o no llega

Revisar:

- Socket conectado.
- Usuario conectado a sala `user:<id>`.
- API de chat guarda mensaje.
- Backend emite `chat_message`.
- Destinatario tiene token valido.
- No hay bloqueo por CORS o proxy WebSocket.

Prueba:

1. Enviar mensaje desde dashboard.
2. Ver respuesta HTTP.
3. Ver evento socket en monitor.
4. Confirmar que Pocket recibe badge/sonido.

## 8. No suena notificacion de chat

Revisar:

- Archivo de sonido existe en `src/assets/sounds/chat-pop.wav`.
- Navegador permite audio despues de interaccion del usuario.
- Chat no esta silenciado.
- Console sin error de carga de asset.

Nota:

Los navegadores suelen bloquear audio automatico hasta que el usuario toca/interactua con la pantalla.

## 9. El cruce inventario demora

Revisar:

- Cantidad de registros en `inventario_store`.
- Cantidad de registros en `inventario_escaneos`.
- Indices aplicados.
- Filtros enviados.
- Si la consulta esta trayendo todo sin paginar.

Indices importantes:

```text
cSessionCode + cCodigoBarra
cSessionCode + cCodigoBarra2
cSessionCode + cCodigoBarra3
sesion_id + sku
sesion_id + seccion_id
```

## 10. Filtro por subzona trae valores incorrectos

Ejemplo problema:

```text
Filtro M10 trae M100, M101
```

Revisar:

- Si backend usa `LIKE 'M10%'`.
- Debe usar coincidencia exacta para filtros de subzona cuando el usuario escribe codigo completo.
- Normalizar mayusculas/minusculas.

## 11. Diferencias no cuadran

Revisar:

- Formula: `conteo - stock`.
- Codigos no reconocidos.
- Productos con codigo alternativo.
- Ceros a la izquierda.
- Agrupacion por zona/subzona.
- Si exportacion usa datos completos y no solo pagina visible.

## 12. Exportacion se queda cargando

Revisar:

- Tiempo de consulta SQL.
- Memoria del proceso Node.
- Si XLSX se genera en servidor.
- Cantidad de registros.
- Logs HTTP para duracion.
- Timeouts del proxy.

Acciones:

- Filtrar antes de exportar.
- Revisar indices.
- Considerar cola de reportes si el volumen crece.

## 13. Monitor de sockets queda esperando

Revisar:

- Usuario debe ser administrador.
- Backend debe validar rol correctamente.
- Evento `subscribe_socket_monitor`.
- Evento `socket_monitor_stats`.
- Log `socket_monitor_denied`.

Si aparece `socket_monitor_denied`, revisar el rol del usuario en tabla `usuarios`.

## 14. Heap usage alto en Node

Revisar:

- Exportaciones grandes.
- Arrays muy grandes en memoria.
- Consultas sin paginacion.
- Logs excesivos.
- Sockets sin desconectar.

Acciones:

- Evitar cargar todo en memoria.
- Usar streaming para reportes grandes.
- Reiniciar proceso si hay fuga hasta corregir.
- Monitorear heap antes/despues de exportar.

## 15. Limpieza segura de pendientes Pocket

No borrar pendientes sin validar con usuario.

Procedimiento recomendado:

1. Revisar pestana Pendientes.
2. Intentar sincronizar.
3. Si falla, exportar evidencia o capturar pantalla.
4. Validar si esos registros ya existen en servidor.
5. Solo limpiar manualmente si el supervisor confirma.

## 16. Checklist de incidente

Registrar:

- Fecha y hora.
- Usuario.
- Codigo de sesion.
- Subzona.
- Error en pantalla.
- Request fallido.
- Respuesta backend.
- Logs relacionados.
- Accion tomada.
