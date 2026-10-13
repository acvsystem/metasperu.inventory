# Documentacion de procesos

## 1. Proceso de login

1. Usuario ingresa credenciales.
2. Frontend llama a `POST /s2/auth/login`.
3. Auth service valida usuario y password.
4. Auth service devuelve JWT y datos de usuario.
5. Frontend guarda token y rol.
6. Interceptor agrega token a peticiones protegidas.
7. Backend valida token en cada ruta protegida.

## 2. Proceso de creacion de sesion

1. Administrador selecciona tienda.
2. Sistema genera o recibe codigo de sesion.
3. Backend crea registro en `inventario_sesiones`.
4. Se asignan subzonas a `secciones_asginados`.
5. La sesion queda disponible para Pocket y dashboard.

## 3. Proceso de escaneo online

1. Pocket tiene sesion y subzona activa.
2. Usuario escanea codigo.
3. Frontend crea registro local con identificador unico.
4. Registro se guarda en IndexedDB.
5. Si hay conexion, se envia por `POST /s3/inventory/sync-bulk`.
6. Backend valida sesion activa.
7. Backend valida subzona asignada.
8. Backend revisa recibos para no duplicar.
9. Backend inserta en `inventario_escaneos`.
10. Backend responde registros confirmados.
11. Frontend limpia confirmados del almacenamiento local.
12. Backend emite `update_totals` por socket.
13. Dashboard refresca totales y tabla.

## 4. Proceso de escaneo manual

1. Usuario cambia modo a manual desde perfil.
2. Todo escaneo queda pendiente local.
3. En la pestana Pendientes puede editar cantidad o eliminar.
4. Al presionar `Sincronizar`, se envia al backend.
5. Backend procesa igual que modo online.
6. Si confirma, se eliminan pendientes locales.
7. Historial muestra lo enviado.

## 5. Proceso de sincronizacion sin duplicados

Regla:

Cada escaneo debe tener un `client_scan_id`.

Flujo:

1. Pocket envia lote con ids de cliente.
2. Backend registra o consulta esos ids en `inventario_pocket_receipts`.
3. Si un id ya fue procesado, no inserta de nuevo.
4. Si un id no fue procesado, inserta conteo.
5. Backend confirma los ids aceptados.
6. Frontend elimina solo los confirmados.

Esto permite reintentar cuando hay red inestable sin duplicar conteos.

## 6. Proceso de cruce de inventario

1. Se carga inventario de tienda en `inventario_store`.
2. Se reciben conteos en `inventario_escaneos`.
3. Backend normaliza codigos para comparar:
   - `cCodigoBarra`
   - `cCodigoBarra2`
   - `cCodigoBarra3`
   - `sku` escaneado
4. Backend agrupa conteos por producto, zona y subzona.
5. Calcula stock, fisico y diferencia.
6. Dashboard muestra pagina y totales.
7. Exportacion genera informe completo.

Formula operativa:

```text
diferencia = conteo - stock
```

## 7. Proceso de codigos no reconocidos

1. Usuario escanea un SKU.
2. Backend busca coincidencia en los codigos de inventario.
3. Si no existe coincidencia, el SKU no se puede cruzar contra stock.
4. En reportes debe aparecer en hoja de codigos no reconocidos.
5. El auditor revisa si es:
   - codigo mal escaneado
   - producto no cargado en stock
   - codigo alternativo faltante
   - error de maestros

## 8. Proceso de filtros

1. Usuario escribe en filtro de columna.
2. Frontend espera debounce para evitar varias peticiones.
3. Frontend envia filtro, pagina y tamano de pagina.
4. Backend consulta registros filtrados.
5. Backend calcula resumen filtrado.
6. Frontend muestra tabla y valores `Filtrado`.

Regla importante:

Si el filtro es `M10`, debe buscar exactamente `M10`, no `M100` ni `M101`.

## 9. Proceso de exportacion

1. Usuario presiona `Exportar Excel`.
2. Frontend envia sesion y filtros.
3. Backend consulta dataset completo.
4. Backend genera archivo.
5. Frontend descarga.

La exportacion no debe depender solo de los 10, 20, 50 o 500 registros visibles en tabla.

## 10. Proceso de chat

1. Usuario abre chat.
2. Frontend carga contactos desde API.
3. Usuario selecciona destinatario.
4. Al enviar, frontend llama API HTTP.
5. Backend guarda mensaje en MySQL.
6. Backend emite `chat_message` por socket a `user:<recipient_id>`.
7. Destinatario recibe mensaje en vivo.
8. Si abre chat, frontend marca mensajes como leidos.
9. Backend emite `chat_read`.

## 11. Proceso de rendimiento por Pocket

1. Administrador abre rendimiento por Pocket.
2. Backend consulta escaneos de la sesion.
3. Agrupa por usuario.
4. Calcula:
   - escaneos
   - unidades
   - subzonas
   - inicio
   - fin
   - tiempo total
   - tiempo activo
   - escaneos por hora
5. Frontend muestra resumen y detalle por zona/subzona.

## 12. Proceso de monitor de sockets

1. Administrador abre monitor.
2. Frontend emite `subscribe_socket_monitor`.
3. Backend valida rol administrador.
4. Backend une el socket a `ops:socket-monitor`.
5. Backend emite metricas en vivo.
6. Frontend muestra conexiones, eventos, rooms y actividad reciente.

Si el usuario no es administrador, el backend debe denegar la suscripcion.
