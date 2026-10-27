import { ElementRef, QueryList } from '@angular/core';
import { MtVerificationModal } from './mt-verification-modal';

describe('session code entry', () => {
  function setup() {
    const close = jasmine.createSpy('close');
    const modal = new MtVerificationModal({ close } as any);
    const elements = Array.from({ length: 6 }, () => document.createElement('input'));
    modal.inputs = new QueryList<ElementRef<HTMLInputElement>>();
    modal.inputs.reset(elements.map(el => new ElementRef(el)));
    return { modal, close, elements };
  }
  it('accepts an alphanumeric paste, removes separators and returns uppercase only when complete', () => {
    const { modal, close } = setup();
    modal.onPaste({ preventDefault() {}, clipboardData: { getData: () => ' ab-12 cd ' } } as any);
    expect(modal.code.join('')).toBe('AB12CD');
    expect(modal.isComplete).toBeTrue();
    modal.onVerify();
    expect(close).toHaveBeenCalledWith('AB12CD');
  });
  it('does not submit an incomplete code or invalid characters', () => {
    const { modal, close, elements } = setup();
    elements[0].value = '@';
    elements[0].addEventListener('input', event => modal.onInput(event, 0));
    elements[0].dispatchEvent(new Event('input'));
    modal.onVerify();
    expect(modal.code.join('')).toBe('');
    expect(close).not.toHaveBeenCalled();
  });
  it('clears stale characters when replacing a complete code with a shorter paste', () => {
    const { modal } = setup();
    modal.onPaste({ preventDefault() {}, clipboardData: { getData: () => 'ABC123' } } as any);
    modal.onPaste({ preventDefault() {}, clipboardData: { getData: () => 'X9' } } as any);
    expect(modal.code).toEqual(['X', '9', '', '', '', '']);
    expect(modal.isComplete).toBeFalse();
  });
  it('replaces a character in the middle without clearing the rest of the code', () => {
    const { modal, elements } = setup();
    modal.onPaste({ preventDefault() {}, clipboardData: { getData: () => 'ABC123' } } as any);
    elements[2].value = 'CD';
    elements[2].addEventListener('input', event => modal.onInput(event, 2));
    elements[2].dispatchEvent(new InputEvent('input', { data: 'D', inputType: 'insertText' }));
    expect(modal.code.join('')).toBe('ABD123');
    expect(elements[2].value).toBe('D');
    expect(modal.isComplete).toBeTrue();
  });
  it('keeps a single visible character when autofill replaces an existing code', () => {
    const { modal, elements } = setup();
    modal.code[0] = 'A';
    elements[0].value = 'ABC999';
    elements[0].addEventListener('input', event => modal.onInput(event, 0));
    elements[0].dispatchEvent(new InputEvent('input', { data: 'ABC999', inputType: 'insertReplacementText' }));
    expect(modal.code.join('')).toBe('ABC999');
    expect(elements[0].value).toBe('A');
    expect(modal.isComplete).toBeTrue();
  });
});
