import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type InventoryTheme = 'light' | 'dark';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<InventoryTheme>(this.initialTheme());
  constructor() {
    this.apply();
  }
  toggle() {
    this.mode.update((mode) => (mode === 'dark' ? 'light' : 'dark'));
    try {
      localStorage.setItem('metas-inventory-theme', this.mode());
    } catch {
      /* Private browsing may disable storage. */
    }
    this.apply();
  }
  private initialTheme(): InventoryTheme {
    try {
      const saved = localStorage.getItem('metas-inventory-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* Fall back to the device preference. */
    }
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  private apply() {
    this.document.documentElement.dataset['theme'] = this.mode();
    this.document.documentElement.style.colorScheme = this.mode();
  }
}
