# MetasperuInventory

## Elegir APIs locales o servidor

En `src/app/core/config/service-config.ts`, cambia `isLocalService`:

- `true`: autenticación en `http://localhost:3000/s2/auth`, inventario y chat en `http://localhost:3001/s3/inventory`, sockets en el puerto 3001 con ruta `/socket.io/`.
- `false`: todos los servicios usan `https://api.metasperu.net.pe`; los sockets conservan la ruta `/s3/socket/` del servidor.

Si abres el frontend en `127.0.0.1`, las APIs locales también usan ese nombre para conservar las cookies de sesión. Debes levantar ambos servicios locales. Reinicia `npm start` o recompila después del cambio; antes de generar una versión para el servidor, establece `isLocalService = false`.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
