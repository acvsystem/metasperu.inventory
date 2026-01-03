import { Injectable, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class InventorySocketService implements OnDestroy {
  private socket: Socket;
  
  // Estado de la conexión
  public isConnected = signal<boolean>(false);
  
  // Signal que almacenará el último cambio recibido (para que el Dashboard reaccione)
  public lastScanUpdate = signal<any>(null);

  constructor() {
    // Reemplaza con la URL de tu backend
    this.socket = io('http://localhost:3001', {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket'] // Forzamos websocket para mejor performance
    });

    this.initListeners();
  }

  private initListeners() {
    // Evento cuando conectamos con el servidor
    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor de Sockets');
      this.isConnected.set(true);
    });

    // Evento cuando perdemos la conexión
    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor de Sockets');
      this.isConnected.set(false);
    });

    // ESCUCHAR: Cuando el backend nos avisa que hay nuevos datos
    this.socket.on('update_totals', (data: any) => {
      console.log('🔔 Nueva actualización de inventario recibida:', data);
      this.lastScanUpdate.set(data);
    });
  }

  /**
   * Unirse a una "sala" específica (la sesión de inventario actual)
   * Esto evita que un admin vea datos de una tienda que no le corresponde
   */
  joinSession(sessionCode: string) {
    if (sessionCode) {
      console.log(`Entrando a la sala: ${sessionCode}`);
      this.socket.emit('join_session', sessionCode);
    }
  }

  /**
   * Abandonar la sala actual
   */
  leaveSession(sessionCode: string) {
    this.socket.emit('leave_session', sessionCode);
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}