# Manual de usuario - Sistema de Inventario METAS PERU

## 1. Objetivo del sistema

El sistema de inventario permite controlar una sesion de conteo en tienda, recibir escaneos desde dispositivos Pocket, cruzar el conteo contra el stock cargado, revisar diferencias, exportar informes y monitorear el rendimiento de los usuarios.

El sistema esta pensado para manejar inventarios grandes, con miles de productos de stock y cientos de miles de registros de conteo, evitando cargar toda la informacion en el navegador al mismo tiempo.

## 2. Roles de usuario

### Administrador

Puede crear sesiones, configurar zonas y subzonas, monitorear el dashboard, importar inventario, revisar cruces, exportar reportes, usar estadisticas y comunicarse por chat con usuarios Pocket.

### Auditor

Puede monitorear sesiones, revisar conteos, validar diferencias, generar reportes y usar el chat segun los permisos configurados.

### Pocket

Usuario operativo que escanea productos desde un celular o lector. Puede trabajar en modo online o manual, revisar pendientes, sincronizar y responder mensajes del dashboard.

## 3. Flujo general de trabajo

1. El administrador crea o activa una sesion de inventario.
2. Se asignan subzonas a la sesion.
3. Los usuarios Pocket ingresan con el codigo de sesion.
4. Se selecciona la subzona activa.
5. Se escanean productos.
6. El dashboard recibe y consolida los conteos.
7. Se importa o consulta el inventario de tienda.
8. Se revisa el cruce de inventario.
9. Se exportan informes para auditoria.
10. Se finaliza la sesion cuando el conteo termina.

## 4. Inicio de sesion

1. Ingrese con su usuario y clave.
2. El sistema mostrara las opciones disponibles segun su rol.
3. Si es usuario Pocket, el sistema lo dirige al modulo Pocket.
4. Si es administrador o auditor, el sistema muestra opciones de sesiones, dashboard y configuracion.

## 5. Sesiones de inventario

### Crear una sesion

1. Ingresar a `SESIONES`.
2. Seleccionar tienda.
3. Seleccionar secciones o subzonas que participaran.
4. Crear sesion.
5. Compartir el codigo de sesion con los usuarios Pocket.

### Activar una sesion existente

1. Ingresar a `SESIONES`.
2. Ubicar la sesion.
3. Presionar activar.
4. Ingresar al dashboard de monitoreo.

### Finalizar una sesion

1. Ingresar al dashboard de la sesion.
2. Presionar el boton de finalizar.
3. Confirmar la accion.

Una vez finalizada, los usuarios Pocket no deberian seguir enviando escaneos a esa sesion.

## 6. Modulo Pocket

El modulo Pocket es usado por los operarios para registrar conteos.

### 6.1 Seleccionar sesion

Si el sistema no tiene una sesion guardada:

1. Se abre un modal solicitando el codigo de sesion.
2. Ingrese el codigo entregado por el administrador.
3. Confirme para cargar las subzonas asignadas.

### 6.2 Seleccionar subzona activa

Antes de escanear:

1. Seleccione la subzona de trabajo.
2. Verifique que la seccion activa sea correcta.
3. Todo escaneo se registrara en esa subzona.

### 6.3 Modo de funcionamiento

El modo de funcionamiento se cambia desde el perfil de usuario.

#### Modo online

Es el modo normal.

- Cada escaneo se guarda localmente.
- Si hay conexion, se sincroniza automaticamente.
- El dashboard recibe actualizaciones en vivo.
- Si la red falla, los escaneos quedan pendientes y se sincronizan luego.

#### Modo manual

Usar cuando la red es inestable o cuando el supervisor desea revisar antes de enviar.

- Todo escaneo queda como pendiente.
- Los pendientes pueden editarse o eliminarse antes de sincronizar.
- Al presionar `Sincronizar`, se envia al servidor.
- Cuando el envio es exitoso, los pendientes se limpian.
- El historial muestra lo sincronizado.

### 6.4 Tipo de registro

#### Pistola

Cada lectura cuenta 1 unidad.

Uso recomendado para lector laser o escaner rapido.

#### Cantidad

Permite ingresar una cantidad manual.

Uso recomendado cuando se cuenta un bloque de unidades iguales.

### 6.5 Registrar escaneo

1. Seleccionar subzona.
2. Elegir `Pistola` o `Cantidad`.
3. Escanear o ingresar codigo de barras.
4. Presionar `Registrar escaneo` o Enter.
5. Verificar el ultimo registro mostrado.

### 6.6 Pendientes

En la pestana `Pendientes` se muestran escaneos aun no confirmados en servidor.

Estados habituales:

- `pendiente`: guardado localmente, aun no enviado.
- `por confirmar`: enviado al servidor, esperando confirmacion de lote.
- `enviado`: sincronizado.

En modo manual se permite editar o eliminar pendientes que aun no esten bloqueados.

### 6.7 Historial

La pestana `historial` muestra registros ya sincronizados con el servidor.

Use el filtro para buscar codigos, cantidades o secciones.

## 7. Dashboard de monitoreo

El dashboard permite revisar el avance del inventario.

### 7.1 Cards principales

#### Total Stock

Muestra el total global de stock de la sesion.

El valor `Filtrado` muestra el stock correspondiente al filtro aplicado.

#### Total Conteo

Muestra el total global de unidades contadas.

El valor `Filtrado` muestra el total contado segun el filtro aplicado.

#### Diferencias

Muestra la diferencia global entre conteo y stock.

El valor `Filtrado` cambia segun el filtro aplicado.

#### SKUs Unicos

Muestra la cantidad de codigos distintos identificados.

### 7.2 Inventario Pocket

Esta pestana muestra el detalle de conteos agrupado por producto, usuario, zona, subzona y cantidad.

Acciones principales:

- Importar conteo desde Excel.
- Filtrar por columnas.
- Eliminar subzona de conteo.
- Sincronizar pendientes recibidos por socket.
- Ver estadisticas.
- Ver rendimiento por Pocket.
- Exportar conteo completo.
- Usar chat con usuarios Pocket.

### 7.3 Cruce Inventario

Esta pestana cruza inventario de tienda contra conteos.

Acciones principales:

- Sincronizar con tienda.
- Importar inventario.
- Exportar informe.
- Seleccionar tipo de reporte.
- Filtrar por columnas.
- Revisar stock, conteo y diferencias.
- Usar chat con usuarios Pocket.

### 7.4 Productos sin exhibir

Muestra productos que no aparecen exhibidos o que no tienen conteo segun los criterios del sistema.

Use esta vista para detectar productos pendientes de revision fisica.

## 8. Filtros

Los filtros consultan informacion del servidor para evitar cargar todos los registros en el navegador.

Recomendaciones:

- Use filtros exactos cuando busque una subzona especifica.
- Para subzona `M10`, el sistema debe filtrar `M10` y no `M100` o `M101`.
- Cuando se aplica un filtro, el valor global de las cards no debe cambiar; solo cambia el valor `Filtrado`.

## 9. Exportacion de reportes

### Inventario Pocket

El boton `Exportar Excel` exporta el conteo completo desde el servidor, no solo lo cargado en pantalla.

### Cruce Inventario

El boton de exportacion genera el informe de inventario.

El informe puede incluir:

- Resumen.
- Inventario general.
- Informe de diferencias.
- Codigos no reconocidos.
- Productos no escaneados.
- Stock negativo u otras hojas de control segun configuracion.

### Informe de diferencias

El informe agrupa diferencias por codigo de barras.

Dentro de cada codigo, el detalle debe agruparse por zona y subzona, sumando unidades contadas.

## 10. Configuracion

### Zonas

Permite crear y mantener zonas de inventario.

Ejemplo:

- PISO DE VENTA
- BODEGA
- BODEGA EXTERNA
- TESTER
- DEFECTUOSOS

### Subzonas

Permite crear subzonas individuales o por rango.

Ejemplos:

- Crear una subzona: `M50`
- Crear por rango: `A150` a `A400`

### Asignacion de subzonas a sesion

Permite asignar subzonas a una sesion existente.

Ejemplo:

- Asignar `M50` a `M300` a la sesion `JF8KU7`.

## 11. Chat y notificaciones

El sistema incluye chat entre dashboard y usuarios Pocket.

### Desde dashboard

1. Presionar el boton de mensajes.
2. Seleccionar destinatario.
3. Escribir mensaje.
4. Presionar Enter o el boton enviar.

### Desde Pocket

1. Abrir el boton flotante de chat.
2. Seleccionar destinatario o responder al contacto abierto.
3. Escribir mensaje.
4. Presionar Enter para enviar.

### Mensajes minimizados

Si el chat esta minimizado y llega un mensaje:

- Se muestra contador de no leidos.
- El encabezado cambia a `Nuevo mensaje`.
- La barra se resalta visualmente.

## 12. Buenas practicas operativas

- Antes de iniciar conteo, confirme que la sesion sea correcta.
- Cada operario debe escanear en su subzona asignada.
- Evite cambiar de subzona sin revisar la seccion activa.
- En redes inestables, use modo manual.
- Sincronice pendientes antes de finalizar una sesion.
- Revise `Codigos no reconocidos` antes de cerrar informe.
- Exporte reportes desde el servidor para obtener datos completos.
- Use el chat para coordinar correcciones durante el conteo.

## 13. Problemas comunes

### El Pocket no sincroniza

Verificar:

- Conexion a internet.
- Modo de funcionamiento.
- Si hay pendientes bloqueados.
- Si la sesion sigue activa.

### El dashboard no actualiza rapido

Verificar:

- Estado `EN VIVO`.
- Conexion socket.
- Backend en ejecucion.
- Que frontend y backend apunten al mismo servidor.

### El chat demora

Verificar:

- Que exista conexion WebSocket.
- En local, debe apuntar a `localhost:3001`.
- En produccion, debe apuntar al servidor de API.
- Reiniciar backend despues de cambios de socket.

### El reporte demora

Los reportes grandes pueden tardar si hay muchos registros.

Recomendaciones:

- Usar filtros antes de exportar cuando sea posible.
- Ejecutar exportacion en servidor.
- Evitar cerrar la ventana mientras se genera.

### Chrome se queda sin memoria

El sistema debe trabajar con paginacion y calculos del servidor.

Si ocurre:

- Reducir registros cargados en pantalla.
- Revisar que la tabla no este recibiendo todo el inventario.
- Validar que los filtros sean server-side.

