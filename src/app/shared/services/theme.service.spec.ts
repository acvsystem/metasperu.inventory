import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('Inventory theme', () => {
  beforeEach(() => {
    localStorage.removeItem('metas-inventory-theme');
    TestBed.resetTestingModule();
  });
  afterEach(() => {
    localStorage.removeItem('metas-inventory-theme');
    document.documentElement.removeAttribute('data-theme');
  });
  it('restores a saved dark theme across the whole document', () => {
    localStorage.setItem('metas-inventory-theme', 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
  it('toggles and persists an explicit preference', () => {
    localStorage.setItem('metas-inventory-theme', 'light');
    const service = TestBed.inject(ThemeService);
    service.toggle();
    expect(service.mode()).toBe('dark');
    expect(localStorage.getItem('metas-inventory-theme')).toBe('dark');
    service.toggle();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });
});
