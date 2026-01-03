import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class InventorySocketService {
    private socket: Socket;
    public isConnected = signal(false);
    public syncNotification = signal<any>(null);

    // Guardamos el código por si hay que reintentar al conectar
    private pendingSessionCode: string | null = null;

    constructor() {
        this.socket = io('http://localhost:3001', {
            withCredentials: true,
            transports: ['websocket']
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

        // ESCUCHAR EL EVENTO EXACTO DEL BACKEND
        this.socket.on('update_totals', (data: any) => {
            console.log('📦 Sincronización masiva recibida:', data);
            this.syncNotification.set(data); // Guardamos la data (count, last_scans)
        });
    }

    /**
     * Unirse a una "sala" específica (la sesión de inventario actual)
     * Esto evita que un admin vea datos de una tienda que no le corresponde
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
        this.pendingSessionCode = null; // Limpiamos el pendiente
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