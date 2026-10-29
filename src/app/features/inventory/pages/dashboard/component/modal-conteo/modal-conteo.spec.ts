import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalConteo } from './modal-conteo';

describe('Editar conteo: cantidades con signo', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [ModalConteo],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { id: 1, cantidad: -2, nombre_seccion: 'Sección A', title: 'Editar Conteo' } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ModalConteo);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const save = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.trim() === 'Guardar')!;
    return { fixture, input, save };
  }

  it('shows the current quantity rather than the section name and accepts signed integers', async () => {
    const { fixture, input, save } = await setup();
    expect(input.value).toBe('-2');
    for (const value of ['-1', '-2', '-3', '0', '2', '3', '-999999999', '999999999']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(save.disabled).withContext(value).toBeFalse();
      expect(String(fixture.componentInstance.data.cantidad)).toBe(value);
    }
  });

  it('does not submit a blank, unfinished sign, fractional or out-of-range quantity', async () => {
    const { fixture, input, save } = await setup();
    for (const value of ['', '-', '1.5', 'abc', '-1000000000', '1000000000']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(save.disabled).withContext(value).toBeTrue();
      expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    }
  });
});
