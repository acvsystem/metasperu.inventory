# Productos sin exhibir: total y exportación

Cambio del 29 de octubre de 2026, rama `production-deploy`.

La vista recibía una página de la API y volvía a paginarla dentro de `mt-datatable`. Esto mostraba dos paginadores: el exterior conocía los 183 resultados, pero la tabla y el Excel solo tenían los 10 de la página recibida.

Ahora la vista reúne el resultado completo mediante lotes de hasta 500 registros, respetando el tamaño efectivo que devuelve la API. Solo entrega los datos a la tabla cuando termina la carga. Se mantiene un único paginador, el de la tabla, con el total completo. Los filtros se aplican a todos los productos cargados y el contador del botón coincide con los registros que exporta: sin filtros, todos; con filtros, todos los coincidentes, no únicamente la página visible.

Si falla un lote, faltan registros o cambia el total durante la carga, se informa del error y no se habilita una exportación parcial. No se modifica el endpoint ni se retiran sus límites de paginación. El conjunto completo se conserva en memoria para filtrar y exportar; el DOM sigue mostrando únicamente la página elegida.

Verificado en ChromeHeadless con 183 productos distribuidos en cuatro lotes: un paginador, 10 filas iniciales, tres filas en la última página y Excel leído nuevamente con sus 183 registros. También se verificó un filtro que encuentra productos de otros lotes y el rechazo de una exportación cuando falla la segunda petición. Suite completa: 68 pruebas correctas.

Cambio local, sin desplegar al servidor público. Los datos de las pruebas son ficticios; no se exportaron registros de producción.
