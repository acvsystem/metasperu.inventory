# Dirección visual: Skotwind

Referencia solicitada: https://myrathemes.in/skotwind/ . Se revisaron el dashboard y los formularios de su demo pública. Esta es una adaptación de su lenguaje visual al inventario existente; no incorpora datos comerciales ni páginas de ejemplo de la demo.

## Diseño

- Fondo `#f8f9fb`, superficies blancas, texto `#18181b`, bordes `#e5e7eb`, primario violeta `#6155f5` y acento turquesa `#2eb8ac`.
- DM Sans alojada localmente, con licencia OFL incluida junto al archivo de fuente.
- Menú lateral blanco de 280 px en escritorio; encabezado de 70 px y navegación compacta móvil. Se mantienen las rutas y permisos existentes.
- Tarjetas independientes con iconos de color, cabeceras discretas, tablas compactas y formularios de 39 px. El chat pasa a una superficie clara.
- No se añaden botones decorativos sin función ni cifras que no procedan de la sesión.

## Integración

Tailwind CSS 4 se integra mediante `@tailwindcss/postcss`, siguiendo la guía oficial para Angular: https://tailwindcss.com/docs/installation/framework-guides/angular .

El archivo `src/styles/tailwind.css` importa tema y utilidades con prefijo `tw`, sin Preflight, para evitar que un reset global altere Ionic/Material. La cuadrícula del resumen y la navegación secundaria emplean utilidades responsive reales. Los estilos de los componentes mantienen las particularidades de los controles y sus overlays.

No se modificaron servicios, autorización ni contratos de API. No se ampliaron límites de compilación.

## Validación

Compilación de producción correcta. Chrome: resumen de cuatro columnas a 1440 px, dos a 1024/768 px y una a 390/320 px, sin desbordamiento de la página. Fuente local cargada y recorridos con APIs ficticias. Se repitieron los recorridos de chat, edición, selección y Pocket. Suite Angular: 15 pruebas, 9 correctas y los mismos 6 fallos anteriores documentados en QA-MODALES-2026-10-26.md.

La vista de revisión es local y usa datos ficticios; no verifica los servicios de producción ni sustituye pruebas en dispositivos físicos.
