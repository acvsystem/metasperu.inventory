# Documentacion del Sistema de Inventario METAS PERU

Esta carpeta contiene la documentacion funcional, tecnica y operativa del sistema de inventario.

## Indice recomendado

1. [Manual de usuario](./01-MANUAL_USUARIO.md)
2. [Manual tecnico](./02-MANUAL_TECNICO.md)
3. [Base de datos](./03-BASE_DATOS.md)
4. [Procesos del sistema](./04-PROCESOS.md)
5. [Diagramas](./05-DIAGRAMAS.md)
6. [Instalacion y despliegue](./06-INSTALACION_DESPLIEGUE.md)
7. [Soporte y solucion de problemas](./07-SOPORTE.md)
8. [API backend](./08-API_BACKEND.md)
9. [Pantallazos del sistema](./09-PANTALLAZOS.md)

## Alcance

La documentacion cubre:

- Login y control de acceso.
- Gestion de sesiones de inventario.
- Pocket en modo online y modo manual.
- Pendientes, historial y sincronizacion.
- Dashboard de monitoreo.
- Inventario Pocket.
- Cruce de inventario.
- Productos sin exhibir.
- Exportacion de reportes.
- Configuracion de zonas y subzonas.
- Chat y notificaciones en tiempo real.
- Rendimiento por Pocket.
- Monitor de sockets.
- Pantallazos de referencia del sistema.
- Logs, soporte, despliegue y mantenimiento.

## Repositorios relacionados

- Frontend Angular/Ionic: `metasperu.inventory`
- Backend principal de inventario: `metasperu-backend/inventory-service`
- Backend de autenticacion: `metasperu-backend/auth-service`
- Base de datos: MySQL, base `metasperu_bd`

## Convenciones

- Los diagramas estan en formato Mermaid.
- Los comandos estan pensados para Windows/PowerShell o terminal compatible.
- Las rutas de produccion documentadas usan `https://api.metasperu.net.pe`.
- La API de inventario se publica bajo `/s3/inventory`.
- La API de autenticacion se publica bajo `/s2/auth`.

## Mantenimiento

Actualizar estos documentos cuando:

- Se agregue un modulo.
- Cambie un flujo operativo.
- Cambie una ruta de API.
- Cambie el calculo de reportes o diferencias.
- Cambie la estructura de base de datos.
- Se agreguen permisos, roles o reglas de seguridad.
