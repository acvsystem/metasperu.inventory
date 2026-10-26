# QA de modales, controles y chat

Revisión estática por agente QA y recorridos automatizados en Chrome, con APIs locales ficticias. Sin escrituras a producción.

## Correcciones

- Inputs y selectores compactos de 39 px, etiqueta sobre el valor. Se acotó el ancho de los selectores del formulario de apertura.
- El input compartido usa etiqueta e input nativos y elimina estilos profundos que afectaban a otros campos Material. Se conserva su interfaz de eventos y valores. Contraseña del formulario de usuario oculta los caracteres.
- Selección múltiple: Cancelar, Escape o backdrop descartan cambios sin confirmar; Aceptar los conserva. Checkboxes accionables por teclado y estado maestro recalculado al filtrar.
- Selector con cuerpo desplazable y cabecera/acciones visibles en ventanas bajas. Se respeta la capa nativa de Ionic.
- Una sola instancia de chat en la raíz del espacio de trabajo, fuera de pestañas y contenedores con transformaciones. Su capa queda bajo los diálogos. Se retiraron las instancias de las vistas de conteo, stock y Pocket.
- Minimizar libera el foco y no marca mensajes como leídos. El chat adapta su altura al viewport visible y elimina sus listeners al destruirse.
- Diálogos de rangos y asignación sin anchos mínimos que desbordan móviles; campos de usuario/tienda apilados sin solaparse; PIN con campos flexibles.

## Verificación

- Chat: 1440×900, 768×850, 390×844, 320×568 y 390×360. Panel, campo de mensaje y botón Enviar dentro del viewport; cierre funcional.
- Recorridos de Cancelar/Aceptar con teclado; liberación del foco al minimizar; edición de conteo; creación de subzona por rango; asignación a sesión; formularios de usuario y tienda. Comprobación de ancho y solapamiento de campos. No se guardaron cambios en el servidor.
- Selector probado también con viewport de 390×360 para comprobar sus acciones.
- Dos regresiones reproducidas con pruebas en rojo y corregidas: cancelación de multiselección y lectura de chat minimizado. Suite completa: 15 pruebas, 9 correctas y los mismos 6 fallos anteriores (App/ActivatedRoute y mocks del servicio Pocket). No se desactivaron pruebas.
- Compilación de producción y TypeScript completados. Persisten avisos de bundles y CommonJS; no se ampliaron presupuestos.

Límites: la reducción de ventana simula espacio disponible para teclado; no equivale a probar un teclado físico Android/iOS. No se verificó entrega real de mensajes ni sockets de producción. Las pantallas de diagnóstico, cámara y lectores físicos requieren sus pruebas de integración específicas.
