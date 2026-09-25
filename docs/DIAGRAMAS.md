# Diagramas de uso del sistema de inventario

Los siguientes diagramas usan sintaxis Mermaid. Pueden visualizarse en GitHub, GitLab, VS Code con extension Mermaid o herramientas compatibles.

## 1. Flujo general de inventario

```mermaid
flowchart TD
    A[Administrador crea o activa sesion] --> B[Asigna zonas y subzonas]
    B --> C[Usuarios Pocket ingresan codigo de sesion]
    C --> D[Seleccionan subzona activa]
    D --> E[Escanean productos]
    E --> F{Modo Pocket}
    F -->|Online| G[Guarda local y sincroniza]
    F -->|Manual| H[Guarda en pendientes]
    H --> I[Usuario revisa, edita o elimina]
    I --> J[Sincronizar]
    G --> K[Backend guarda conteos]
    J --> K
    K --> L[Dashboard actualiza avance]
    L --> M[Importar o consultar inventario tienda]
    M --> N[Cruce inventario]
    N --> O[Revision de diferencias]
    O --> P[Exportar informe]
    P --> Q[Finalizar sesion]
```

## 2. Flujo de escaneo Pocket

```mermaid
sequenceDiagram
    participant U as Usuario Pocket
    participant P as App Pocket
    participant L as IndexedDB local
    participant B as Backend
    participant D as Dashboard

    U->>P: Selecciona subzona
    U->>P: Escanea codigo de barras
    P->>L: Guarda escaneo local
    alt Modo online y con conexion
        P->>B: Envia lote pendiente
        B->>B: Valida sesion, usuario y subzona
        B->>B: Inserta conteo sin duplicar
        B-->>P: Confirma registros
        P->>L: Elimina confirmados
        B-->>D: Emite actualizacion por socket
    else Modo manual o sin conexion
        P-->>U: Muestra pendiente
        U->>P: Sincroniza manualmente
        P->>B: Envia pendientes
        B-->>P: Confirma
    end
```

## 3. Modo online vs modo manual

```mermaid
flowchart LR
    A[Escaneo] --> B[Guardar local]
    B --> C{Modo}
    C -->|Online| D{Hay conexion}
    D -->|Si| E[Sincronizar automatico]
    D -->|No| F[Queda pendiente]
    C -->|Manual| G[Queda pendiente editable]
    G --> H[Editar o eliminar]
    F --> I[Sincronizar al recuperar red]
    H --> J[Boton sincronizar]
    E --> K[Historial]
    I --> K
    J --> K
```

## 4. Dashboard y cruce de inventario

```mermaid
flowchart TD
    A[Dashboard] --> B[Inventario Pocket]
    A --> C[Cruce inventario]
    A --> D[Productos sin exhibir]

    B --> B1[Conteos paginados]
    B --> B2[Filtros server-side]
    B --> B3[Estadisticas Pocket]
    B --> B4[Exportar conteo completo]

    C --> C1[Inventario tienda paginado]
    C --> C2[Calculos de stock, conteo y diferencia en servidor]
    C --> C3[Filtros globales]
    C --> C4[Exportar informe]

    D --> D1[Productos sin conteo o sin exhibicion]
    D --> D2[Revision operativa]
```

## 5. Filtros y calculos

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as MySQL

    U->>F: Escribe filtro
    F->>F: Espera debounce
    F->>B: Envia filtro y paginacion
    B->>DB: Consulta registros filtrados
    B->>DB: Calcula resumen filtrado
    DB-->>B: Datos y totales
    B-->>F: Pagina, totalRows y summary
    F-->>U: Muestra tabla y valores filtrados
```

## 6. Chat por socket

```mermaid
sequenceDiagram
    participant A as Dashboard/Admin
    participant API as Backend API
    participant S as Socket.io
    participant DB as MySQL
    participant P as Pocket

    A->>API: Envia mensaje HTTP
    API->>DB: Guarda mensaje
    API->>S: Emite chat_message a user:destino
    S-->>P: Recibe mensaje en vivo
    P-->>P: Muestra alerta o badge
    P->>API: Marca leido al abrir
    API->>DB: Actualiza read_at
    API->>S: Emite chat_read
    S-->>A: Actualiza estado leido
```

## 7. Exportacion de informe

```mermaid
flowchart TD
    A[Usuario solicita exportar] --> B[Frontend envia filtros y sesion]
    B --> C[Backend consulta datos completos]
    C --> D[Backend agrupa conteos]
    D --> E[Calcula stock, fisico y diferencia]
    E --> F[Genera archivo]
    F --> G[Frontend descarga informe]
```

## 8. Configuracion de zonas y subzonas

```mermaid
flowchart TD
    A[Configuracion] --> B[Zonas]
    A --> C[Subzonas]
    B --> B1[Crear zona]
    B --> B2[Editar zona]
    B --> B3[Eliminar zona]
    C --> C1[Crear subzona individual]
    C --> C2[Crear subzonas por rango]
    C --> C3[Asignar rango a sesion]
    C3 --> D[Sesion recibe nuevas subzonas]
```

## 9. Estados principales

```mermaid
stateDiagram-v2
    [*] --> SesionActiva
    SesionActiva --> ConteoEnCurso
    ConteoEnCurso --> PendientesLocales
    PendientesLocales --> Sincronizando
    Sincronizando --> Sincronizado
    Sincronizando --> ErrorSincronizacion
    ErrorSincronizacion --> PendientesLocales
    Sincronizado --> ConteoEnCurso
    ConteoEnCurso --> CruceInventario
    CruceInventario --> ReporteGenerado
    ReporteGenerado --> SesionFinalizada
    SesionFinalizada --> [*]
```

