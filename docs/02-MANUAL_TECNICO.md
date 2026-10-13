# Manual tecnico - Sistema de Inventario METAS PERU

## 1. Arquitectura general

El sistema esta compuesto por:

- Frontend Angular/Ionic.
- Backend Node.js/Express para inventario.
- Backend Node.js/Express para autenticacion.
- Socket.io para comunicacion en tiempo real.
- MySQL como base de datos principal.
- IndexedDB en el navegador para pendientes locales de Pocket.

## 2. Repositorios y servicios

### Frontend

Ruta local:

```text
C:\Users\W10\Desktop\PROYECTO_METAS_PERU\metasperu.inventory
```

Tecnologias principales:

- Angular 20.
- Ionic 8.
- Angular Material.
- RxJS.
- Dexie/IndexedDB.
- Socket.io client.
- Chart.js.
- XLSX.

### Inventory service

Ruta local:

```text
C:\Users\W10\Desktop\PROYECTO_METAS_PERU\metasperu-backend\inventory-service
```

Responsabilidades:

- Sesiones de inventario.
- Conteos Pocket.
- Sincronizacion de pendientes.
- Inventario de tienda.
- Cruce de inventario.
- Exportaciones.
- Mantenimiento de usuarios, tiendas, zonas y subzonas.
- Chat.
- Socket.io.
- Logs HTTP y logs de socket.

Puerto local:

```text
3001
```

Base path:

```text
/s3/inventory
```

### Auth service

Ruta local:

```text
C:\Users\W10\Desktop\PROYECTO_METAS_PERU\metasperu-backend\auth-service
```

Responsabilidades:

- Login.
- Logout.
- Check session.
- Emision de JWT.

Base path:

```text
/s2/auth
```

## 3. Configuracion de URLs en frontend

Actualmente el frontend apunta a produccion:

```text
https://api.metasperu.net.pe/s3/inventory
https://api.metasperu.net.pe/s2/auth
https://api.metasperu.net.pe
```

Socket path:

```text
/s3/socket/
```

Archivos donde se usan:

- `src/app/shared/services/inventory.service.ts`
- `src/app/shared/services/pocket-inventory.service.ts`
- `src/app/shared/services/inventory-socket.service.ts`
- `src/app/shared/component/pocket-chat/pocket-chat.ts`
- `src/app/core/auth/auth.service.ts`
- `src/app/shared/services/users.service.ts`
- `src/app/shared/services/stores.service.ts`

Recomendacion tecnica:

Centralizar URLs en `environment.ts` y `environment.prod.ts`.

## 4. Estructura frontend

```text
src/app/core
src/app/features/auth
src/app/features/inventory
src/app/features/maintenance
src/app/shared/component
src/app/shared/services
src/assets
```

### Modulos principales

```text
features/auth/login
features/inventory/pages/session-selector
features/inventory/pages/dashboard
features/inventory/pages/pocket
features/maintenance
```

### Servicios principales

```text
shared/services/inventory.service.ts
shared/services/pocket-inventory.service.ts
shared/services/inventory-socket.service.ts
shared/services/users.service.ts
shared/services/stores.service.ts
core/auth/auth.service.ts
core/db/offline-db.ts
```

## 5. Estructura backend inventory-service

```text
src/app.js
src/config/db.js
src/config/socket.js
src/controllers
src/middleware
src/routes/inventory.routes.js
src/services/pocket-sync.js
src/utils/logger.js
sql
logs
```

### Controladores

```text
chat.controller.js
inventory.controller.js
maintenance.controller.js
pocket.controller.js
store.controller.js
user.controller.js
```

### Middleware

```text
auth.middleware.js
http-logger.middleware.js
```

## 6. Autenticacion

El login se realiza contra `auth-service`.

Rutas:

```text
POST /s2/auth/login
GET  /s2/auth/check-session
POST /s2/auth/logout
```

El frontend guarda el token y lo envia en peticiones protegidas mediante interceptor.

Observacion tecnica importante:

En el estado actual del codigo, el JWT del `auth-service` se firma sin `expiresIn` y la cookie se crea sin `maxAge`. Eso significa que el token no tiene expiracion automatica definida por JWT. Se recomienda agregar expiracion, por ejemplo 8 horas, y mover el secreto JWT a variable de entorno.

## 7. Base de datos

Conexion actual de `inventory-service`:

```js
host: process.env.DB_HOST || '192.168.0.9'
user: process.env.DB_USER || 'dbserver'
database: process.env.DB_NAME || 'metasperu_bd'
connectionLimit: 10
```

Recomendaciones:

- No dejar password real como fallback en codigo.
- Usar `.env`.
- Usar `JWT_SECRET`.
- Separar configuracion local y produccion.

## 8. Socket.io

Socket.io se inicializa en `inventory-service/src/config/socket.js`.

Usos:

- Actualizacion de dashboard.
- Notificacion de nuevos conteos.
- Chat en tiempo real.
- Lectura de mensajes.
- Monitor de sockets.

Eventos relevantes:

```text
join_session
leave_session
update_totals
res_inv_store
chat_message
chat_read
subscribe_socket_monitor
socket_monitor_stats
```

Salas:

```text
user:<id>
codigo_sesion
ops:socket-monitor
```

El monitor de sockets debe estar limitado a rol `administrador`.

## 9. Sincronizacion Pocket

El Pocket usa IndexedDB para tolerar cortes de red.

Principios:

- Cada escaneo se guarda primero localmente.
- Los envios se hacen por lote.
- Cada registro debe tener `client_scan_id`.
- El backend registra recibos para evitar duplicados.
- Si el backend confirma, el frontend borra el pendiente local.

Archivo backend principal:

```text
inventory-service/src/services/pocket-sync.js
```

Archivo frontend principal:

```text
src/app/shared/services/pocket-inventory.service.ts
```

## 10. Logs

El backend tiene logger JSONL en:

```text
inventory-service/src/utils/logger.js
inventory-service/src/middleware/http-logger.middleware.js
inventory-service/logs
```

Los logs registran:

- Timestamp.
- Nivel.
- Servicio.
- Mensaje.
- Ruta HTTP.
- Estado.
- Duracion.
- Usuario.
- Eventos de socket.

## 11. Rendimiento

Buenas practicas aplicadas:

- Paginacion server-side.
- Filtros server-side.
- Debounce al filtrar.
- Exportacion desde backend.
- Calculos de resumen desde servidor.
- Uso de indices SQL.
- Socket para actualizaciones en vivo.

Buenas practicas pendientes o recomendadas:

- Mover reportes grandes a cola de trabajo.
- Agregar migraciones versionadas.
- Centralizar environments.
- Agregar pruebas automatizadas para calculos de diferencia.
- Agregar rotacion/retencion de logs.

## 12. Seguridad recomendada

- Usar HTTPS en produccion.
- Limitar CORS a dominios permitidos.
- Mover credenciales a variables de entorno.
- Agregar expiracion de token JWT.
- Agregar refresh o relogin controlado.
- Validar permisos por rol en backend, no solo en frontend.
- Registrar auditoria para importaciones, cierres y eliminaciones.
