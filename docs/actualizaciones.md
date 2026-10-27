# Actualizaciones de la aplicación

Las nuevas versiones se descargan mediante el service worker de Angular. El usuario recibe un aviso, puede posponerlo y conserva un indicador en la cabecera. Todos los roles pueden acceder a `/inventory/updates` para leer las novedades y aplicar la versión descargada.

## Publicar

1. Cambiar `version`, `title` y `changes` en `src/release-notes.json`. Usar una versión diferente en cada publicación.
2. Ejecutar las pruebas y `npm run build`. El paso `prebuild` prepara `ngsw.release.json` con las notas, commit y fecha. Este archivo es generado y no se versiona.
3. Publicar **todo** `dist/metasperu.inventory/browser`, incluidos `ngsw.json`, el worker y los chunks, mediante un cambio atómico de directorio. Conservar los archivos con hash de la versión anterior durante la transición para clientes que todavía la utilizan.
4. Evitar caché prolongada de `index.html`, `ngsw.json` y `ngsw-worker.js` en el servidor/CDN. Los archivos JS/CSS con hash pueden almacenarse con caché larga. No usar `Clear-Site-Data`.

El cliente busca versiones al entrar, cada dos minutos mientras está visible y al recuperar foco o conexión. Solo se notifica una versión lista, después de que el worker verifique sus archivos. La instalación combina `activateUpdate()` con una recarga inmediata para evitar mezclar componentes y chunks de versiones distintas.

## Protección de Pocket

- No se ejecutan borrados de caché manuales, `localStorage.clear()`, eliminación de IndexedDB ni cierres de sesión al actualizar.
- Pocket impide salir mientras guarda o envía. Antes de navegar conserva el SKU en edición, cantidad, sección y modo, y restaura el borrador al regresar.
- Antes de activar, se comprueba que no haya escrituras/envíos activos y se espera una transacción de IndexedDB. Los registros pendientes no se suben ni eliminan como parte de la actualización.
- Un fallo de descarga, almacenamiento o activación conserva la versión activa y permite reintentar.
- Los demás dispositivos o pestañas deciden cuándo actualizar; no se fuerzan recargas globales.

Esto conserva los conteos ya guardados y los borradores al usar el flujo de actualización. No sustituye respaldos frente a pérdida del teléfono, borrado manual de datos del navegador o eliminación del perfil. Las futuras migraciones de IndexedDB deberán mantener los registros y probarse antes de publicarlas.

## Primera instalación del mecanismo

Los clientes que todavía ejecutan una versión anterior a esta función no pueden mostrar un aviso que su código no contiene. Necesitan cargar esta versión una vez (recarga normal o cerrar y volver a abrir, sin borrar datos). Las siguientes publicaciones usarán el aviso y el botón.

Referencias: https://angular.dev/ecosystem/service-workers/communications y https://angular.dev/ecosystem/service-workers/devops
