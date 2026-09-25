import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, firstValueFrom, timeout } from 'rxjs';
import { InventorySocketService } from '@metasperu/services/inventory-socket.service';

interface Contact { id: number; username: string; unread: number; }
interface Message { id: number; body: string; created_at: string; read_at: string | null; mine: boolean; }
@Component({
  selector: 'pocket-chat', standalone: true, imports: [CommonModule, FormsModule, MatIconModule, A11yModule],
  templateUrl: './pocket-chat.html', styleUrl: './pocket-chat.scss'
})
export class PocketChat implements OnInit, OnDestroy {
  @ViewChild('messageList') messageList?: ElementRef<HTMLElement>;
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLTextAreaElement>;
  private http = inject(HttpClient);
  private socket = inject(InventorySocketService);
  private url = 'https://api.metasperu.net.pe/s3/inventory/chat';
  private timer?: ReturnType<typeof setInterval>;
  private socketSub?: Subscription;
  private readSub?: Subscription;
  private busy = false;
  private destroyed = false;
  private revision = 0;
  private pulseTimer?: ReturnType<typeof setTimeout>;
  private pending?: { body: string; client_id: string; peer: number };
  private notificationAudio = new Audio('assets/sounds/chat-pop.wav');
  contacts: Contact[] = []; rows: Message[] = [];
  selected?: Contact; selectedId: number | null = null; opened = false; minimized = false; sending = false; loading = false;
  draft = ''; search = ''; error = ''; notice = ''; older = false; attention = false;
  get unread() { return this.contacts.reduce((n, c) => n + Number(c.unread), 0); }
  get activeUnread() { return this.selected ? Number(this.contacts.find(c => c.id === this.selected?.id)?.unread || this.selected.unread || 0) : this.unread; }
  get filtered() { return this.contacts.filter(c => c.username.toLowerCase().includes(this.search.toLowerCase())); }
  ngOnInit() {
    this.notificationAudio.preload = 'auto';
    this.notificationAudio.volume = 0.55;
    void this.refresh();
    this.timer = setInterval(() => { if (!document.hidden) void this.refresh(); }, 30000);
    this.socketSub = this.socket.chatMessage$.subscribe(message => this.onSocketMessage(message));
    this.readSub = this.socket.chatRead$.subscribe(data => this.onSocketRead(data));
  }
  ngOnDestroy() {
    this.destroyed = true;
    this.revision++;
    clearInterval(this.timer);
    clearTimeout(this.pulseTimer);
    this.socketSub?.unsubscribe();
    this.readSub?.unsubscribe();
  }
  async refresh() {
    if (this.busy || this.destroyed) return;
    this.busy = true;
    try {
      const list = await firstValueFrom(this.http.get<Contact[]>(`${this.url}/contacts`).pipe(timeout(15000)));
      if (this.destroyed) return;
      const incoming = list.find(c => Number(c.unread) > Number(this.contacts.find(old => old.id === c.id)?.unread || 0));
      if (incoming) {
        this.notice = `Nuevo mensaje de ${incoming.username}`;
        this.playNotificationTone();
      }
      this.contacts = list; this.error = '';
      if (this.selected) {
        this.selected = this.contacts.find(c => c.id === this.selected?.id) || this.selected;
        this.selectedId = this.selected.id;
      }
      if (this.opened && this.selected && !this.older) await this.load();
    } catch { this.error = 'Chat sin conexion. Reintentando...'; }
    finally { this.busy = false; }
  }
  open() { this.opened = true; this.minimized = false; this.attention = false; this.notice = ''; void this.refresh(); }
  close() { this.opened = false; this.revision++; }
  toggleMinimize() {
    this.minimized = !this.minimized;
    if (!this.minimized) {
      this.attention = false;
      if (this.selected && this.rows.length) void this.markRead(this.rows[this.rows.length - 1].id);
    }
  }
  chooseById(id: number | null) {
    if (id === null || id === undefined) {
      this.selected = undefined;
      this.selectedId = null;
      this.rows = [];
      this.draft = '';
      this.pending = undefined;
      this.revision++;
      return;
    }

    const contact = this.contacts.find(c => c.id === Number(id));
    if (contact) this.choose(contact);
  }
  choose(c: Contact) {
    if (this.sending) return;
    this.selected = c;
    this.selectedId = c.id;
    this.rows = [];
    this.draft = '';
    this.pending = undefined;
    this.older = false;
    void this.load();
  }
  private onSocketMessage(message: any) {
    if (!message?.id || !message?.peer_id) return;

    const peerId = Number(message.peer_id);
    const mine = !!message.mine;
    const row: Message = {
      id: Number(message.id),
      body: String(message.body || ''),
      created_at: message.created_at,
      read_at: message.read_at || null,
      mine
    };

    if (!mine) this.playNotificationTone();

    this.contacts = this.contacts.map(c => {
      if (c.id !== peerId) return c;
      return { ...c, unread: this.opened && !this.minimized && this.selected?.id === peerId ? 0 : Number(c.unread || 0) + (mine ? 0 : 1) };
    });

    if (this.opened && this.selected?.id === peerId && !this.older) {
      if (!this.rows.some(item => Number(item.id) === row.id)) {
        this.rows = [...this.rows, row].sort((a, b) => Number(a.id) - Number(b.id));
        requestAnimationFrame(() => {
          const el = this.messageList?.nativeElement;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
      if (!mine && !document.hidden && !this.minimized) void this.markRead(row.id);
      if (!mine && this.minimized) this.flagAttention(message.sender_username);
      return;
    }

    if (!mine) {
      const contactName = this.contacts.find(c => c.id === peerId)?.username || message.sender_username || 'usuario';
      this.notice = `Nuevo mensaje de ${contactName}`;
      if (this.opened && this.minimized) this.flagAttention(contactName);
    }

    void this.refresh();
  }
  private playNotificationTone() {
    try {
      this.notificationAudio.pause();
      this.notificationAudio.currentTime = 0;
      this.notificationAudio.play().catch(() => {});
    } catch {}
  }
  private flagAttention(name?: string) {
    this.attention = true;
    this.notice = `Nuevo mensaje${name ? ' de ' + name : ''}`;
    clearTimeout(this.pulseTimer);
    this.pulseTimer = setTimeout(() => this.attention = false, 6000);
  }
  private onSocketRead(data: any) {
    if (!data?.peer_id || !data?.through || this.selected?.id !== Number(data.peer_id)) return;
    const through = Number(data.through);
    this.rows = this.rows.map(row => row.mine && Number(row.id) <= through
      ? { ...row, read_at: row.read_at || new Date().toISOString() }
      : row
    );
  }
  private async markRead(through: number) {
    const selected = this.selected;
    if (!selected) return;
    try {
      await firstValueFrom(this.http.post(`${this.url}/${selected.id}/read`, { through }).pipe(timeout(15000)));
      selected.unread = 0;
      this.contacts = this.contacts.map(c => c.id === selected.id ? { ...c, unread: 0 } : c);
    } catch {}
  }
  async load(before?: number) {
    const selected = this.selected;
    if (!selected) return;
    const revision = ++this.revision;
    this.loading = true;
    try {
      const rows = await firstValueFrom(this.http.get<Message[]>(`${this.url}/${selected.id}/messages`, { params: before ? { before } : {} }).pipe(timeout(15000)));
      if (this.destroyed || revision !== this.revision) return;
      const changed = rows[rows.length - 1]?.id !== this.rows[this.rows.length - 1]?.id;
      this.rows = rows; this.older = !!before; this.error = '';
      if (changed && !before) requestAnimationFrame(() => {
        const el = this.messageList?.nativeElement;
        if (el && revision === this.revision) el.scrollTop = el.scrollHeight;
      });
      if (rows.length && this.opened && !document.hidden) {
        await this.markRead(rows[rows.length - 1].id);
        if (!before) selected.unread = 0;
      }
    } catch { if (revision === this.revision) this.error = 'No se pudieron cargar los mensajes.'; }
    finally { if (revision === this.revision) this.loading = false; }
  }
  submitOnEnter(event: Event) {
    const keyboard = event as KeyboardEvent;
    if (keyboard.shiftKey) return;
    event.preventDefault();
    void this.send();
  }
  async send() {
    const body = this.draft.trim(), peer = this.selected?.id;
    if (!body || !peer || this.sending || body.length > 2000) return;
    if (!this.pending || this.pending.body !== body || this.pending.peer !== peer) {
      const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
      this.pending = { body, peer, client_id: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('') };
    }
    this.sending = true;
    try {
      await firstValueFrom(this.http.post(`${this.url}/${peer}/messages`, this.pending).pipe(timeout(15000)));
      this.draft = ''; this.pending = undefined; this.older = false; await this.load();
    } catch { this.error = 'No se confirmo el envio. Puedes reintentar.'; }
    finally { this.sending = false; this.focusMessageInput(); }
  }
  private focusMessageInput() {
    requestAnimationFrame(() => this.messageInput?.nativeElement.focus());
  }
}
