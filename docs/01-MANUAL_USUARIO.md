# Manual de usuario - Sistema de Inventario METAS PERU

## 1. Objetivo

El sistema permite ejecutar inventarios de tienda usando dispositivos Pocket o celulares, consolidar conteos en un dashboard, cruzar lo contado contra el stock de tienda, revisar diferencias, exportar informes y comunicarse con los usuarios por chat.

El objetivo operativo es que el conteo sea rapido, controlado y trazable por usuario, zona, subzona y sesion.

## 2. Roles principales

### Administrador

Puede crear sesiones, configurar usuarios, tiendas, zonas y subzonas, importar inventario, monitorear el dashboard, exportar reportes, revisar rendimiento y usar el monitor de sockets.

### Auditor

Puede revisar sesiones, conteos, cruces, diferencias, reportes y usar herramientas de seguimiento segun permisos.

### Pocket

Usuario operativo que registra conteos desde el modulo Pocket. Puede trabajar en modo online o manual, revisar pendientes, sincronizar e interactuar por chat.

## 3. Iniciar sesion

1. Abrir la aplicacion.
2. Ingresar usuario y clave.
3. Presionar iniciar sesion.
4. El sistema carga las opciones segun el rol.

Si el usuario es Pocket, normalmente ingresa directo al modulo de escaneo. Si es administrador o auditor, puede acceder a sesiones, dashboard y configuracion.

## 4. Flujo general de inventario

1. El administrador crea o activa una sesion.
2. Se asignan subzonas a la sesion.
3. Los usuarios Pocket ingresan el codigo de sesion.
4. Cada usuario selecciona la subzona activa.
5. Se escanean productos.
6. El dashboard recibe los conteos.
7. Se importa o sincroniza el inventario de tienda.
8. Se revisa el cruce de inventario.
9. Se exportan reportes.
10. Se finaliza la sesion.

## 5. Sesiones de inventario

### Crear sesion

1. Ir al modulo de sesiones.
2. Seleccionar tienda.
3. Seleccionar o asignar subzonas.
4. Crear la sesion.
5. Compartir el codigo de sesion con los usuarios Pocket.

### Activar sesion

1. Buscar la sesion.
2. Activarla.
3. Entrar al dashboard de monitoreo.

### Finalizar sesion

1. Verificar que no existan pendientes importantes.
2. Exportar reportes si corresponde.
3. Finalizar la sesion desde el dashboard.

## 6. Modulo Pocket

El modulo Pocket se usa para escanear productos.

### 6.1 Codigo de sesion

Si no hay sesion cargada, el sistema solicita el codigo. Ejemplo: `JF8KU7`.

Despues de ingresar el codigo, el sistema carga las subzonas asignadas.

### 6.2 Seccion o subzona activa

Antes de contar, seleccionar la subzona correcta. Todo escaneo queda asociado a esa subzona.

Buenas practicas:

- Revisar la subzona antes de iniciar.
- No cambiar de subzona sin confirmar visualmente.
- Si se trabaja en grupo, cada usuario debe respetar su zona asignada.

### 6.3 Modo de funcionamiento

El modo se muestra en el encabezado del Pocket y se administra desde el perfil.

#### Modo online

Es el modo normal.

- El escaneo se guarda localmente.
- Si hay conexion, se sincroniza con el servidor.
- El dashboard puede actualizarse en vivo.
- Si falla la conexion, queda pendiente para sincronizar luego.

#### Modo manual

Sirve cuando se quiere revisar antes de enviar o cuando la red es inestable.

- Todo escaneo queda pendiente.
- Se puede editar o eliminar antes de sincronizar.
- Al presionar `Sincronizar`, se envia al servidor.
- Si el servidor confirma, se limpia de pendientes locales.
- El historial muestra lo enviado.

### 6.4 Tipo de registro

#### Pistola

Cada lectura cuenta 1 unidad. Es recomendado para lector de codigo de barras.

#### Cantidad

Permite escribir una cantidad manual. Es recomendado cuando se cuentan varias unidades del mismo producto juntas.

### 6.5 Registrar escaneo

1. Seleccionar subzona.
2. Seleccionar `Pistola` o `Cantidad`.
3. Leer o escribir el codigo de barras.
4. Si usa cantidad, ingresar unidades.
5. Presionar `Registrar escaneo` o Enter.
6. Confirmar el mensaje de exito o estado de sincronizacion.

### 6.6 Pendientes

La pestana Pendientes muestra registros guardados localmente que aun no han sido confirmados por el servidor.

En modo manual se puede:

- Buscar pendientes.
- Editar cantidad.
- Eliminar registros.
- Revisar unidades contadas en memoria.
- Sincronizar cuando corresponda.

### 6.7 Historial

La pestana Historial muestra registros enviados correctamente al servidor.

Use el historial para validar:

- Codigo enviado.
- Cantidad enviada.
- Subzona.
- Fecha y hora.

## 7. Dashboard

El dashboard es la vista principal de monitoreo.

### 7.1 Cards superiores

#### Total Stock

Muestra el stock total cargado para la sesion.

#### Total Conteo

Muestra unidades contadas.

#### Diferencias

Muestra la diferencia entre conteo y stock.

La diferencia se interpreta como:

```text
conteo - stock
```

Si sale negativo, falta conteo frente al stock.

#### SKUs Unicos

Muestra codigos distintos encontrados segun la vista.

### 7.2 Valores filtrados

Cuando se aplica un filtro, el valor principal de cada card debe mantenerse global. Solo cambia el valor que dice `Filtrado`.

Ejemplo:

- Total Stock: se mantiene igual.
- Filtrado: cambia segun subzona, usuario, SKU u otro filtro.

### 7.3 Inventario Pocket

Muestra el conteo realizado por usuarios Pocket.

Acciones principales:

- Importar inventario/conteo.
- Filtrar por columnas.
- Eliminar subzona.
- Sincronizar cambios.
- Ver estadisticas.
- Ver rendimiento por Pocket.
- Abrir monitor de sockets, solo administrador.
- Abrir chat.
- Exportar Excel.

### 7.4 Cruce de inventario

Permite comparar stock de tienda contra conteo fisico.

Campos importantes:

- Stock.
- Conteo.
- Diferencia.
- Zona.
- Subzona.
- Usuario.
- Producto.

### 7.5 Productos sin exhibir

Permite revisar productos que requieren validacion porque no aparecen exhibidos o no fueron encontrados segun el criterio del sistema.

## 8. Exportar reportes

El boton `Exportar Excel` genera archivos desde la informacion del servidor.

El informe puede incluir:

- Resumen.
- Inventario general.
- Diferencias.
- Codigos no reconocidos.
- Productos sin escanear.
- Productos sin exhibir.
- Conteo por zona/subzona.

Antes de cerrar una sesion, se recomienda exportar y revisar el informe.

## 9. Rendimiento por Pocket

La estadistica de rendimiento muestra:

- Usuario Pocket.
- Escaneos.
- Unidades.
- Subzonas trabajadas.
- Tiempo total.
- Tiempo activo.
- Escaneos por hora.

`Esc/h` se calcula asi:

```text
escaneos * 3600 / segundos_transcurridos
```

El tiempo total usa el rango entre el primer y ultimo escaneo del usuario. El tiempo activo estima solo intervalos cortos dentro de una misma subzona.

## 10. Chat y notificaciones

El sistema incluye chat entre dashboard y usuarios Pocket.

Uso:

1. Abrir el boton de mensajes.
2. Seleccionar destinatario.
3. Escribir mensaje.
4. Presionar Enter para enviar.

Cuando llega un mensaje:

- Se muestra contador si el chat esta minimizado.
- Puede sonar una alerta.
- El usuario puede responder desde el chat.

## 11. Configuracion

### Usuarios

Permite crear, editar y eliminar usuarios.

### Tiendas

Permite mantener tiendas y series.

### Zonas

Permite mantener agrupaciones grandes, por ejemplo:

- PISO DE VENTA
- BODEGA INTERNA
- DEFECTUOSOS
- TESTER

### Subzonas

Permite crear subzonas individuales o por rango.

Ejemplos:

- Individual: `M50`
- Rango: `A150` hasta `A400`

Tambien permite asignar rangos de subzonas a una sesion.

## 12. Recomendaciones de uso

- Confirmar sesion antes de escanear.
- Confirmar subzona antes de cada bloque de conteo.
- Usar modo manual si la red es inestable.
- Revisar pendientes antes de finalizar.
- Revisar codigos no reconocidos antes de cerrar informe.
- Usar filtros exactos para subzonas como `M10`.
- No cerrar la ventana durante una exportacion grande.
