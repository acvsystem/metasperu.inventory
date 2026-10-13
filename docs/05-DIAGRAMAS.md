# Diagramas del sistema

Los diagramas usan Mermaid.

## 1. Arquitectura general

```mermaid
flowchart LR
    U[Usuario web] --> F[Frontend Angular/Ionic]
    P[Pocket / Celular] --> F
    F -->|REST /s2/auth| A[Auth Service]
    F -->|REST /s3/inventory| I[Inventory Service]
    F <-->|Socket.io /s3/socket| I
    A --> DB[(MySQL)]
    I --> DB
    F --> IDB[(IndexedDB Pocket)]
```

## 2. Casos de uso

```mermaid
flowchart TB
    Admin[Administrador]
    Auditor[Auditor]
    Pocket[Usuario Pocket]

    Admin --> UC1[Crear sesion]
    Admin --> UC2[Configurar zonas/subzonas]
    Admin --> UC3[Importar inventario]
    Admin --> UC4[Monitorear dashboard]
    Admin --> UC5[Exportar reportes]
    Admin --> UC6[Ver rendimiento]
    Admin --> UC7[Monitor de sockets]
    Admin --> UC8[Chat]

    Auditor --> UC4
    Auditor --> UC5
    Auditor --> UC6
    Auditor --> UC8

    Pocket --> UC9[Ingresar codigo de sesion]
    Pocket --> UC10[Seleccionar subzona]
    Pocket --> UC11[Escanear productos]
    Pocket --> UC12[Revisar pendientes]
    Pocket --> UC13[Sincronizar]
    Pocket --> UC14[Responder chat]
```

## 3. Flujo de escaneo online

```mermaid
sequenceDiagram
    participant U as Pocket
    participant F as Frontend
    participant L as IndexedDB
    participant B as Inventory Service
    participant DB as MySQL
    participant D as Dashboard

    U->>F: Escanea SKU
    F->>L: Guarda pendiente local
    F->>B: POST /sync-bulk
    B->>DB: Valida sesion y subzona
    B->>DB: Revisa client_scan_id
    B->>DB: Inserta conteo
    B-->>F: Confirma ids
    F->>L: Borra confirmados
    B-->>D: update_totals por socket
```

## 4. Flujo de escaneo manual

```mermaid
flowchart TD
    A[Escaneo] --> B[Guardar en IndexedDB]
    B --> C[Pendientes]
    C --> D{Usuario revisa}
    D -->|Editar| E[Actualizar cantidad local]
    D -->|Eliminar| F[Eliminar local]
    D -->|Sincronizar| G[Enviar lote]
    G --> H{Backend confirma}
    H -->|Si| I[Borrar pendientes confirmados]
    H -->|No| J[Mantener pendientes y mostrar error]
```

## 5. Cruce de inventario

```mermaid
flowchart TD
    A[Inventario tienda] --> C[Cruce backend]
    B[Conteos Pocket] --> C
    C --> D[Normalizar codigos]
    D --> E[Comparar SKU contra cCodigoBarra 1/2/3]
    E --> F[Calcular conteo - stock]
    F --> G[Dashboard]
    F --> H[Reporte Excel]
    E --> I[Codigos no reconocidos]
```

## 6. Chat por socket

```mermaid
sequenceDiagram
    participant A as Dashboard
    participant API as Inventory API
    participant DB as MySQL
    participant S as Socket.io
    participant P as Pocket

    A->>API: POST /chat/:id/messages
    API->>DB: Guarda mensaje
    API->>S: Emitir a user:destino
    S-->>P: chat_message
    P-->>P: Badge / sonido / notificacion
    P->>API: POST /chat/:id/read
    API->>DB: Actualiza read_at
    API->>S: chat_read
    S-->>A: Confirmacion lectura
```

## 7. Monitor de sockets

```mermaid
sequenceDiagram
    participant Admin as Administrador
    participant F as Frontend
    participant S as Socket.io Backend

    Admin->>F: Abre monitor
    F->>S: subscribe_socket_monitor
    S->>S: Valida rol administrador
    alt Autorizado
        S-->>F: socket_monitor_stats
        S-->>F: Actualizaciones periodicas
    else Denegado
        S-->>F: socket_monitor_stats denied
    end
```

## 8. Base de datos

```mermaid
erDiagram
    usuarios ||--o{ inventario_sesiones : crea
    usuarios ||--o{ inventario_escaneos : escanea
    usuarios ||--o{ inventory_messages : envia
    usuarios ||--o{ inventory_messages : recibe

    tiendas ||--o{ inventario_sesiones : pertenece
    inventario_sesiones ||--o{ inventario_escaneos : contiene
    inventario_sesiones ||--o{ inventario_store : carga
    inventario_sesiones ||--o{ secciones_asginados : asigna

    secciones_escaneos ||--o{ secciones_asginados : plantilla
    secciones_escaneos ||--o{ zonas_seccion : clasifica
    zonas_escaneos ||--o{ zonas_seccion : contiene
    secciones_asginados ||--o{ inventario_escaneos : recibe
```

## 9. Despliegue

```mermaid
flowchart LR
    Browser[Navegador / Pocket] --> N[Nginx / Proxy]
    N --> FE[Frontend estatico]
    N --> AUTH[Auth Service]
    N --> INV[Inventory Service]
    INV --> MYSQL[(MySQL Server)]
    AUTH --> MYSQL
    INV <-->|Socket.io| Browser
```
