# API backend

## 1. Base URLs

Produccion:

```text
https://api.metasperu.net.pe
```

Auth:

```text
/s2/auth
```

Inventario:

```text
/s3/inventory
```

Socket:

```text
/s3/socket/
```

## 2. Autenticacion

La mayoria de endpoints requiere JWT.

Header recomendado:

```http
Authorization: Bearer <token>
```

Tambien se usa cookie:

```text
auth_token
```

## 3. Auth service

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/s2/auth/login` | Login inventario |
| GET | `/s2/auth/check-session` | Verificar sesion |
| POST | `/s2/auth/logout` | Cerrar sesion |
| POST | `/s2/auth/center/login` | Login center |
| GET | `/s2/auth/center/check-session` | Verificar sesion center |
| POST | `/s2/auth/center/logout` | Cerrar sesion center |

## 4. Sesiones e inventario

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/s3/inventory/create-session` | Crear sesion |
| GET | `/s3/inventory/sessions` | Listar sesiones |
| PUT | `/s3/inventory/ended-session` | Finalizar sesion |
| PUT | `/s3/inventory/estart-session` | Activar sesion |
| GET | `/s3/inventory/stores` | Listar tiendas para sesion |
| GET | `/s3/inventory/section/assigned/:session_code` | Subzonas asignadas |

## 5. Conteos Pocket

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/s3/inventory/scan` | Registrar escaneo simple |
| POST | `/s3/inventory/sync-bulk` | Sincronizar lote Pocket |
| GET | `/s3/inventory/pocket/scan/:session_code` | Obtener escaneos Pocket |
| PUT | `/s3/inventory/pocket/scan` | Actualizar conteo Pocket |
| GET | `/s3/inventory/pocket/performance/:session_code` | Rendimiento por Pocket |

## 6. Dashboard y resumen

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/s3/inventory/summary/:session_code` | Resumen version inicial |
| GET | `/s3/inventory/v2/summary/:session_code` | Resumen paginado/filtrado |
| GET | `/s3/inventory/v2/summary/:session_code/statistics` | Estadisticas |
| GET | `/s3/inventory/v2/summary/:session_code/export/csv` | Exportar conteo |

## 7. Inventario tienda y cruce

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/s3/inventory/request/store` | Obtener inventario tienda/cruce |
| GET | `/s3/inventory/request/store/statistics` | Estadisticas de inventario tienda |
| GET | `/s3/inventory/request/store/export/csv` | Exportar cruce |
| GET | `/s3/inventory/request/store/products-without-display` | Productos sin exhibir |
| POST | `/s3/inventory/response/store` | Respuesta de inventario tienda |
| POST | `/s3/inventory/response/store/import` | Importar inventario tienda |
| PUT | `/s3/inventory/checked/row/inv` | Marcar fila revisada |

## 8. Mantenimiento de subzonas

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/s3/inventory/api/v1/seccion` | Listar subzonas |
| POST | `/s3/inventory/api/v1/seccion` | Crear subzona |
| POST | `/s3/inventory/api/v1/seccion/bulk` | Crear subzonas por rango |
| POST | `/s3/inventory/api/v1/seccion/session/bulk` | Asignar rango a sesion |
| PUT | `/s3/inventory/api/v1/seccion` | Editar subzona |
| DELETE | `/s3/inventory/api/v1/seccion/:seccion_id` | Eliminar subzona |
| POST | `/s3/inventory/api/v1/seccion/count/session` | Conteo por sesion/subzona |
| POST | `/s3/inventory/api/v1/seccion/group/session` | Agrupar subzonas por sesion |

## 9. Mantenimiento de zonas

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/s3/inventory/api/v2/zonas` | Listar zonas |
| POST | `/s3/inventory/api/v2/zonas` | Crear zona |
| PUT | `/s3/inventory/api/v2/zonas` | Editar zona |
| DELETE | `/s3/inventory/api/v2/zona/:zona_id` | Eliminar zona |
| GET | `/s3/inventory/api/v2/zonas/subzonas` | Listar zonas con subzonas |
| PUT | `/s3/inventory/api/v2/zonas/subzonas` | Asignar subzona a zona |

## 10. Importaciones y limpieza

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/s3/inventory/api/import/store/sesion` | Importar stock por sesion |
| POST | `/s3/inventory/api/import/conteo/sesion` | Importar conteo por sesion |
| POST | `/s3/inventory/api/delete/zona/escaneo` | Eliminar conteo de zona/subzona |

## 11. Usuarios

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/s3/inventory/api/v1/user` | Listar usuarios |
| POST | `/s3/inventory/api/v1/user` | Crear usuario |
| PUT | `/s3/inventory/api/v1/user` | Editar usuario |
| DELETE | `/s3/inventory/api/v1/user/:id` | Eliminar usuario |

## 12. Tiendas

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/s3/inventory/api/v1/store` | Listar tiendas |
| POST | `/s3/inventory/api/v1/store` | Crear tienda |
| PUT | `/s3/inventory/api/v1/store` | Editar tienda |
| DELETE | `/s3/inventory/api/v1/store/:id` | Eliminar tienda |

## 13. Chat

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/s3/inventory/chat/contacts` | Listar contactos |
| GET | `/s3/inventory/chat/:id/messages` | Obtener conversacion |
| POST | `/s3/inventory/chat/:id/messages` | Enviar mensaje |
| POST | `/s3/inventory/chat/:id/read` | Marcar leido |

## 14. Eventos Socket.io

| Evento | Direccion | Uso |
| --- | --- | --- |
| `join_session` | Frontend -> Backend | Unir dashboard a sesion |
| `leave_session` | Frontend -> Backend | Salir de sesion |
| `update_totals` | Backend -> Frontend | Avisar cambios de conteo |
| `res_inv_store` | Backend -> Frontend | Respuesta de inventario |
| `chat_message` | Backend -> Frontend | Mensaje entrante |
| `chat_read` | Backend -> Frontend | Mensaje leido |
| `subscribe_socket_monitor` | Frontend -> Backend | Suscribirse al monitor |
| `socket_monitor_stats` | Backend -> Frontend | Metricas de sockets |

## 15. Parametros comunes de paginacion

Usados en endpoints de dashboard:

```text
page
pageSize
search
filters
sort
```

El backend debe devolver:

```text
items
total
summary
```

Segun endpoint, los nombres pueden variar.
