import { Injectable, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class InventorySocketService implements OnDestroy {
  private socket: Socket;
  public isConnected = signal(false);

  // ===== Señales que usa el Dashboard =====
  public syncNotification = signal<any>(null);          // se mantiene por compatibilidad
  public syncInventarioStore = signal<any>(null);
  public pendingCount = signal(0);                      // ← NUEVO: cantidad de escaneos pendientes

  // Cache interno de escaneos pendientes
  private pendingScans: any[] = [];
  private readonly maxPending = 600;                    // límite de seguridad

  // Guardamos el código por si hay que reintentar al conectar
  private pendingSessionCode: string | null = null;

  constructor() {
    this.socket = io('https://api.metasperu.net.pe', {
      path: '/s3/socket/',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    // Evento cuando conectamos con el servidor
    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor de Sockets');
      this.isConnected.set(true);

      // SI HABÍA UN CÓDIGO ESPERANDO, NOS UNIMOS AHORA
      if (this.pendingSessionCode) {
        this.joinSession(this.pendingSessionCode);
      }
    });

    // Evento cuando perdemos la conexión
    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor de Sockets');
      this.isConnected.set(false);
    });

    // =====================================================
    //  ESCUCHAR EL EVENTO EXACTO DEL BACKEND (update_totals)
    // =====================================================
    this.socket.on('update_totals', (data: any) => {
      console.log('📦 Sincronización recibida:', data);

      // Acumulamos en el cache en lugar de forzar carga inmediata
      this.addPending(data);

      // También actualizamos la señal por si en algún lado aún la usan
      this.syncNotification.set(data);
    });

    // =====================================================
    //  ESCUCHAR EL EVENTO INVENTARIO DE TIENDA
    // =====================================================
    this.socket.on('res_inv_store', (data: any) => {
      console.log('📦 Inventario recibido por socket:', data);

      if (Array.isArray(data) && data.length) {
        localStorage.removeItem('offline_inventory');
      }

      this.syncInventarioStore.set(data);
    });
  }

  // =====================================================
  //  LÓGICA DE CACHE / PENDIENTES
  // =====================================================

  /**
   * Agrega los datos recibidos al cache de pendientes
   */
  private addPending(data: any) {
    // El backend puede mandar un objeto con count o un array
    if (Array.isArray(data)) {
      this.pendingScans.push(...data);
    } else if (data?.last_scans && Array.isArray(data.last_scans)) {
      this.pendingScans.push(...data.last_scans);
    } else {
      // Si solo manda un contador o un objeto suelto
      this.pendingScans.push(data);
    }

    // Limitar tamaño del cache
    if (this.pendingScans.length > this.maxPending) {
      this.pendingScans = this.pendingScans.slice(-this.maxPending);
    }

    this.pendingCount.set(this.pendingScans.length);
  }

  /**
   * Devuelve una copia de los escaneos pendientes
   */
  getPendingScans(): any[] {
    return [...this.pendingScans];
  }

  /**
   * Limpia el cache de pendientes (se llama después de sincronizar)
   */
  clearPending() {
    this.pendingScans = [];
    this.pendingCount.set(0);
    this.syncNotification.set(null);
  }

  // =====================================================
  //  SESIONES
  // =====================================================

  /**
   * Unirse a una "sala" específica (la sesión de inventario actual)
   */
  joinSession(sessionCode: string) {
    const cleanCode = sessionCode.toUpperCase().trim();

    // Si no estamos conectados todavía, guardamos el código para después
    if (!this.socket.connected) {
      console.log('⏳ Conexión no lista. Guardando código para unión automática...');
      this.pendingSessionCode = cleanCode;
      return;
    }

    // Si ya estamos conectados, emitimos normalmente
    console.log(`🚀 Emitiendo join_session para: ${cleanCode}`);
    this.socket.emit('join_session', cleanCode);
    this.pendingSessionCode = null;
  }

  /**
   * Abandonar la sala actual
   */
  leaveSession(sessionCode: string) {
    this.socket.emit('leave_session', sessionCode);
  }

  // =====================================================
  //  CICLO DE VIDA
  // =====================================================
  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}