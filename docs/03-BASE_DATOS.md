# Documentacion de base de datos

## 1. Motor

Motor usado:

```text
MySQL 8
```

Base principal:

```text
metasperu_bd
```

## 2. Tablas principales identificadas

### usuarios

Guarda usuarios de inventario.

Campos usados por el sistema:

- `id`
- `username`
- `password`
- `perfilname`
- `role`
- `estado`

Usos:

- Login.
- Permisos por rol.
- Relacion con escaneos.
- Contactos de chat.

### tiendas

Guarda tiendas disponibles.

Campos usados:

- `id`
- `serie`
- `nombre_tienda`
- `estado`

Usos:

- Crear sesiones por tienda.
- Identificar inventario de tienda.

### inventario_sesiones

Guarda sesiones de inventario.

Campos usados:

- `id`
- `codigo_sesion`
- `tienda_id`
- `estado`
- `creado_por`
- `fecha_inicio`
- `inventario_registrado`

Usos:

- Control de sesion activa/finalizada.
- Relacion con conteos.
- Relacion con inventario importado.

### inventario_escaneos

Guarda conteos fisicos enviados desde Pocket o importaciones.

Campos usados:

- `id`
- `sesion_id`
- `codigo_sesion`
- `sku`
- `cantidad`
- `escaneado_por`
- `fecha_escaneo`
- `seccion_id`
- `estado`

Usos:

- Inventario Pocket.
- Totales de conteo.
- Cruce contra stock.
- Rendimiento por Pocket.
- Reportes.

### inventario_store

Guarda inventario de tienda para una sesion.

Campos usados:

- `id`
- `cSessionCode`
- `cCodigoTienda`
- `cCodigoArticulo`
- `cReferencia`
- `cCodigoBarra`
- `cCodigoBarra2`
- `cCodigoBarra3`
- `cDescripcion`
- `cDepartamento`
- `cSeccion`
- `cFamilia`
- `cSubFamilia`
- `cTalla`
- `cColor`
- `cStock`
- `cConteo`
- `cTotalConteo`
- `checking`

Usos:

- Stock base.
- Cruce inventario.
- Productos sin exhibir.
- Reporte de diferencias.

### secciones_escaneos

Catalogo de subzonas.

Campos usados:

- `seccion_id`
- `nombre_seccion`

Usos:

- Crear subzonas.
- Relacion con zonas.
- Asignacion a sesiones.

### secciones_asginados

Subzonas asignadas a una sesion.

Campos usados:

- `id`
- `codigo_sesion`
- `seccion_id_fk`
- `nombre_seccion`

Usos:

- Mostrar subzonas disponibles en Pocket.
- Validar si una subzona pertenece a la sesion.
- Relacionar escaneo con subzona.

Nota: el nombre de tabla esta escrito como `asginados` en el codigo.

### zonas_escaneos

Catalogo de zonas.

Campos usados:

- `zona_id`
- `nombre_zona`

Usos:

- Clasificar subzonas por zona.
- Reportes por zona.

### zonas_seccion

Relacion zona/subzona.

Campos usados:

- `zona_escaneo_id`
- `zona_id_fk`
- `seccion_id_fk`

Usos:

- Obtener zona de una subzona.
- Reporte de rendimiento por zona/subzona.
- Dashboard y exportaciones.

### inventario_pocket_receipts

Tabla de recibos para evitar duplicados en sincronizacion Pocket.

Creada por SQL:

```text
inventory-service/sql/pocket-receipts.sql
```

Usos:

- Registrar `client_scan_id`.
- Confirmar escaneos procesados.
- Evitar doble insercion si el Pocket reintenta.

### inventory_messages

Tabla de mensajes de chat.

Se crea automaticamente si no existe desde `chat.controller.js`.

Campos usados:

- `id`
- `sender_id`
- `recipient_id`
- `client_id`
- `body`
- `created_at`
- `read_at`

Usos:

- Chat dashboard/Pocket.
- No leidos.
- Confirmacion de lectura.
- Evitar duplicado por `sender_id + client_id`.

## 3. Relaciones principales

```text
usuarios.id -> inventario_sesiones.creado_por
usuarios.id -> inventario_escaneos.escaneado_por
usuarios.id -> inventory_messages.sender_id
usuarios.id -> inventory_messages.recipient_id

tiendas.id -> inventario_sesiones.tienda_id

inventario_sesiones.id -> inventario_escaneos.sesion_id
inventario_sesiones.codigo_sesion -> inventario_store.cSessionCode
inventario_sesiones.codigo_sesion -> secciones_asginados.codigo_sesion

secciones_escaneos.seccion_id -> secciones_asginados.seccion_id_fk
secciones_escaneos.seccion_id -> zonas_seccion.seccion_id_fk
zonas_escaneos.zona_id -> zonas_seccion.zona_id_fk

secciones_asginados.id -> inventario_escaneos.seccion_id
```

## 4. Indices recomendados

Archivo existente:

```text
inventory-service/sql/performance-indexes.sql
```

Indices definidos:

```sql
CREATE INDEX idx_inv_store_session_id ON inventario_store (cSessionCode, id);
CREATE INDEX idx_inv_store_session_barra ON inventario_store (cSessionCode, cCodigoBarra);
CREATE INDEX idx_inv_store_session_barra2 ON inventario_store (cSessionCode, cCodigoBarra2);
CREATE INDEX idx_inv_store_session_barra3 ON inventario_store (cSessionCode, cCodigoBarra3);
CREATE INDEX idx_escaneos_sesion_id ON inventario_escaneos (sesion_id, id);
CREATE INDEX idx_escaneos_sesion_sku ON inventario_escaneos (sesion_id, sku);
CREATE INDEX idx_escaneos_sesion_seccion ON inventario_escaneos (sesion_id, seccion_id);
CREATE INDEX idx_sesiones_codigo ON inventario_sesiones (codigo_sesion);
```

Indices adicionales recomendados:

```sql
CREATE INDEX idx_escaneos_sesion_user ON inventario_escaneos (sesion_id, escaneado_por);
CREATE INDEX idx_escaneos_sesion_fecha ON inventario_escaneos (sesion_id, fecha_escaneo);
CREATE INDEX idx_asignados_sesion_id ON secciones_asginados (codigo_sesion, id);
CREATE INDEX idx_asignados_sesion_fk ON secciones_asginados (codigo_sesion, seccion_id_fk);
CREATE INDEX idx_zonas_seccion_subzona ON zonas_seccion (seccion_id_fk);
CREATE INDEX idx_messages_recipient_read ON inventory_messages (recipient_id, read_at, id);
CREATE INDEX idx_messages_pair ON inventory_messages (sender_id, recipient_id, id);
```

## 5. Consultas criticas

### Dashboard Inventario Pocket

Consulta sobre:

- `inventario_escaneos`
- `usuarios`
- `secciones_asginados`
- `zonas_seccion`
- `zonas_escaneos`

Debe usar filtros por sesion, sku, usuario, zona y subzona.

### Cruce Inventario

Consulta sobre:

- `inventario_store`
- `inventario_escaneos`
- codigos de barra 1, 2 y 3

Regla importante:

Los codigos pueden venir con ceros a la izquierda. Las consultas comparan usando versiones normalizadas con `TRIM(LEADING '0' ...)`.

### Rendimiento por Pocket

Consulta sobre:

- `inventario_escaneos`
- `usuarios`
- `secciones_asginados`
- `zonas_seccion`
- `zonas_escaneos`

Calcula primer escaneo, ultimo escaneo, tiempo total, tiempo activo, escaneos, unidades y detalle por subzona.

### Chat

Consulta sobre:

- `inventory_messages`
- `usuarios`

Debe filtrar por par de usuarios:

```sql
(sender_id = usuario_actual AND recipient_id = otro_usuario)
OR
(sender_id = otro_usuario AND recipient_id = usuario_actual)
```

## 6. Diagrama entidad-relacion

Ver [Diagramas](./05-DIAGRAMAS.md), seccion "Base de datos".
