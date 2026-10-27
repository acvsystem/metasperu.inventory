# Sesiones y paginado de inventario

Cambios locales del 26/10/2026. Deben desplegarse junto con la nueva autenticación del backend.

- Cookie HttpOnly mediante withCredentials exclusivamente hacia los endpoints propios de inventario/autenticación. No se guarda token en localStorage ni se adjunta a peticiones de terceros.
- Guard verifica el rol devuelto por servidor tanto con sesión restaurada como ya iniciada. Sin redirección extra al autorizar y sin confiar en el rol editable de localStorage.
- Socket se conecta tras validar sesión y se desconecta al salir/expirar. Un 401 del inventario lleva al login conservando pendientes offline.
- Logout revoca en servidor antes de limpiar estado. Si falla la conexión, informa y permite reintentar.
- Stock tiene navegación arriba y al final con estado único, total global de API, retorno a la página anterior si falla la petición y protección contra respuestas atrasadas. El pie deja espacio para el botón flotante del chat.
- Actualización de stock por socket vuelve a consultar la página; no sustituye silenciosamente el estado por un arreglo parcial.

Validación: 31 pruebas Angular pasan; producción compila con advertencias de tamaño/CommonJS ya existentes. Navegador real, escritorio 1440 y móvil 390 px: 120 productos, páginas 50/50/20; controles superiores/inferiores sincronizados, primera/última página en móvil y sin desborde horizontal. Backend comprobado con controlador y MySQL 8.4 aislado: no se pierden ni repiten IDs.

La vista local de diseño sigue usando datos ficticios y no prueba el proxy/cookies del dominio público. En producción hay que configurar orígenes exactos, HTTPS y un despliegue de frontend/API del mismo sitio que no dependa de cookies de terceros.

Se dejaron de versionar cert.pem/key.pem sin borrar sus archivos locales. No se rotó el material antiguo ni se purgó el historial.

Dependencias: auditoría inicial 54 avisos y final 18 (1 crítico, 12 altos, 4 moderados y 1 bajo). No se considera resuelto: la actualización completa del framework y Excel requiere resolver peers/política de paquetes y volver a ejecutar QA. No se modificaron umbrales de build ni se suprimieron avisos.
