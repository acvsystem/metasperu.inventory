# Publicación 1.1.2

La versión 1.1.2 reúne los cambios de conteos negativos y exportación completa de productos sin exhibir. El contador visible y las novedades proceden de `src/release-notes.json`; deben actualizarse junto con cada publicación. El service worker identifica compilaciones mediante el manifiesto y sus hashes, independientemente del número visible.

Diagnóstico externo del 29/10/2026: `https://inventory.metasperu.net.pe/ngsw.json` devolvía versión 1.1.1, commit `f71eb28bf8aa3d42e5bcade2c827fb561f3b2283` y fecha de compilación `2026-10-27T21:54:01.438Z`. El navegador no puede encontrar los últimos cambios mientras el dominio entregue ese manifiesto antiguo. Esto debe distinguirse de las notas antiguas que también permanecían en el repositorio.

En el servidor, usar Node 22 compatible, actualizar `production-deploy` y ejecutar `npm ci --include=dev` seguido de `npm run build`. Este comando genera `ngsw.release.json` y la compilación de producción incluye `ngsw.json` y `ngsw-worker.js`.

Publicar el contenido completo de `dist/metasperu.inventory/browser/` en la raíz efectiva del virtual host de inventario. Verificar que la ruta configurada en Nginx coincida con el destino de la copia; la ubicación `/var/inventory.metasperu/` comunicada por el usuario no pudo verificarse por SSH. Para reducir el riesgo de una actualización parcial, copiar primero todos los archivos excepto `ngsw.json` y publicar el manifiesto al final. Conservar los bundles antiguos que puedan necesitar pestañas todavía abiertas. No eliminar IndexedDB, registros Pocket, cachés de usuario ni sesiones para forzar la actualización.

Comprobar la versión en los tres manifiestos: el compilado, el de la carpeta pública y el obtenido por HTTPS. Deben contener 1.1.2 y el mismo commit/fecha. Si el archivo público local es nuevo pero HTTPS devuelve el anterior, revisar el `root`/`alias`, el upstream y cualquier caché del dominio antes de atribuir el fallo al navegador.

Una vez publicado todo, usar Buscar actualizaciones y, cuando la descarga esté lista, Actualizar ahora. Si la app ya arrancó con 1.1.2, esa será la versión instalada y no habrá una versión posterior que descargar. El backend necesita además el commit `ea7769d` y el reinicio de su proceso de inventario para admitir la edición negativa.
