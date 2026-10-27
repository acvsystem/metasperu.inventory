# Tema azul, modo oscuro y QA

## Cambios entregados

El primario es **#173E76**, muestreado de la imagen del usuario. El selector de tema está en la cabecera y en el login. La preferencia se conserva al recargar y cerrar sesión. En ausencia de preferencia explícita se usa la del dispositivo.

Se adaptaron navegación, tablas, formularios, chat, modales y etiquetas de gráficas a ambos temas. Los campos siguen siendo compactos. Se incluyeron mejoras de accesibilidad del login, y las gráficas actualizan leyendas y ejes cuando cambia el tema.

QA encontró y corrigió:

- Indicadores de página que no se reiniciaban junto con los filtros del servidor.
- Doble paginador en Stock y diferencias, que mezclaba paginación local y de servidor.
- Escape atrapado dentro del campo de filtro.
- Posible excepción al abrir un inventario cuya tienda no estaba disponible.
- Pruebas antiguas que esperaban el título inicial de Angular y un contrato de sincronización obsoleto. Las pruebas del servicio Pocket ahora usan IndexedDB real en el navegador de pruebas y validan identificadores confirmados, reintento, concurrencia, aislamiento y confirmación parcial. No se desactivaron pruebas.

## Resultados

| Comprobación | Resultado |
| --- | --- |
| Compilación de producción y TypeScript | Correctos, sin ampliar presupuestos |
| Suite Angular | **19 pruebas correctas, 0 fallidas** |
| Claro/oscuro y persistencia | Verificados en navegador |
| Escritorio/móvil | 1440 px y pantallas de 390/320 px, sin desbordamiento de página en los recorridos |
| Modales | Edición de conteo, selección simple/múltiple, rangos, asignación, usuario y tienda; acciones de Cancelar/Aceptar, teclado y campos sin solapamientos |
| Pocket | Registro local, pendientes y estado sin conexión; pruebas aisladas de confirmación de envío |
| Paginación | 120 registros ficticios: conteos, stock, revisión, tiendas e historial; siguiente página, tamaño de página y filtro tras avanzar |
| Chat | Tema claro/oscuro, apertura, cierre, minimizar, foco y campo de escritura en viewport reducido |

## Rendimiento medido

Prueba sintética de Chrome Headless sobre el **build de producción**, con gzip, API ficticia local y 5.000 sesiones. Una muestra por perfil y cinco interacciones de filtro; no son percentiles ni métricas de usuarios reales.

| Perfil | LCP | CLS | Filtro sobre 5.000 sesiones |
| --- | --- | --- | --- |
| Local, CPU normal | 3,36 s | 0,022 | 38–65 ms |
| CPU 4×, 1,6 Mbps y 150 ms | 7,39 s | 0,022 | 119–225 ms |

Los filtros responden con rapidez y el desplazamiento visual es bajo, pero **la carga inicial necesita optimización**. El paquete diferido del dashboard ronda 2,3 MB sin comprimir y reúne herramientas de exportación y gráficas. Se recomienda separarlas mediante carga bajo demanda y revisar dependencias externas del HTML antes del lanzamiento. Permanecen los avisos de tamaño y CommonJS conocidos.

## Alcance y límites

Se combinaron revisiones de agentes QA y verificaciones locales directas. Los agentes no completaron todos sus recorridos; sus resultados parciales no se contaron como aprobados. Los recorridos entregados se reprodujeron y completaron directamente.

Todo el QA de interfaz se ejecutó con respuestas ficticias, bloqueando la API de producción. No valida el rendimiento del backend, concurrencia real, entrega de mensajes por sockets, archivos reales de importación/exportación, cámara o lectores físicos. La reducción del viewport prueba espacio disponible y no sustituye pruebas en teclados Android/iOS. No se desplegó a producción.
