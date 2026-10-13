# Instalacion y despliegue

## 1. Requisitos

### Desarrollo

- Node.js compatible con Angular 20.
- npm.
- Angular CLI.
- MySQL 8.
- Git.
- Navegador Chrome/Edge.

### Produccion

- Servidor Linux o Windows.
- Node.js.
- PM2 o administrador de procesos equivalente.
- Nginx o proxy reverso.
- Certificado SSL.
- MySQL accesible desde backend.
- Dominio configurado.

## 2. Frontend

Ruta:

```text
C:\Users\W10\Desktop\PROYECTO_METAS_PERU\metasperu.inventory
```

Instalar dependencias:

```bash
npm install
```

Levantar en desarrollo:

```bash
npm start
```

Levantar para acceso por red local o Tailscale:

```bash
ng serve --host 0.0.0.0 --port 4900
```

Compilar produccion:

```bash
npm run build
```

Salida esperada:

```text
dist/
```

## 3. Backend inventory-service

Ruta:

```text
C:\Users\W10\Desktop\PROYECTO_METAS_PERU\metasperu-backend\inventory-service
```

Instalar dependencias:

```bash
npm install
```

Levantar:

```bash
npm start
```

Desarrollo:

```bash
npm run dev
```

Puerto:

```text
3001
```

## 4. Backend auth-service

Ruta:

```text
C:\Users\W10\Desktop\PROYECTO_METAS_PERU\metasperu-backend\auth-service
```

Instalar dependencias:

```bash
npm install
```

Levantar:

```bash
npm start
```

## 5. Variables de entorno recomendadas

Crear `.env` en cada servicio backend.

```env
DB_HOST=192.168.0.9
DB_USER=dbserver
DB_PASSWORD=********
DB_NAME=metasperu_bd
JWT_SECRET=********
PORT=3001
NODE_ENV=production
```

Recomendacion:

No dejar credenciales reales como fallback en codigo fuente.

## 6. Dominio de produccion

Dominio API:

```text
https://api.metasperu.net.pe
```

Rutas publicadas:

```text
https://api.metasperu.net.pe/s2/auth
https://api.metasperu.net.pe/s3/inventory
https://api.metasperu.net.pe/s3/socket/
```

## 7. Proxy reverso recomendado

Ejemplo conceptual Nginx:

```nginx
location /s2/auth/ {
    proxy_pass http://127.0.0.1:3000/s2/auth/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /s3/inventory/ {
    proxy_pass http://127.0.0.1:3001/s3/inventory/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /s3/socket/ {
    proxy_pass http://127.0.0.1:3001/s3/socket/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

Ajustar puertos segun configuracion real.

## 8. PM2

Instalar PM2:

```bash
npm install -g pm2
```

Levantar inventory-service:

```bash
pm2 start src/app.js --name inventory-service
```

Levantar auth-service:

```bash
pm2 start src/app.js --name auth-service
```

Ver estado:

```bash
pm2 status
```

Logs:

```bash
pm2 logs inventory-service
pm2 logs auth-service
```

Reinicio:

```bash
pm2 restart inventory-service
```

Guardar procesos:

```bash
pm2 save
```

## 9. Tailscale

Para pruebas por Tailscale:

1. Confirmar IP Tailscale del equipo.
2. Levantar backend escuchando en la red.
3. Levantar Angular con:

```bash
ng serve --host 0.0.0.0 --port 4900
```

4. Cambiar temporalmente URLs del frontend a la IP Tailscale.
5. Regresar a dominio de produccion antes de publicar.

## 10. Checklist antes de publicar

- `npm run build` frontend correcto.
- Backend sin errores de sintaxis.
- Login probado.
- Check session probado.
- Pocket online probado.
- Pocket manual probado.
- Dashboard probado.
- Filtros probados.
- Exportacion probada.
- Chat probado.
- Socket monitor probado con administrador.
- Certificado SSL vigente.
- Proxy WebSocket funcionando.
- Variables `.env` correctas.

## 11. Checklist despues de publicar

- Abrir frontend en produccion.
- Iniciar sesion.
- Validar llamadas `/s2/auth`.
- Validar llamadas `/s3/inventory`.
- Validar WebSocket `/s3/socket/`.
- Probar mensaje de chat.
- Probar escaneo real o manual.
- Revisar logs PM2.
- Revisar logs JSONL de inventory-service.
