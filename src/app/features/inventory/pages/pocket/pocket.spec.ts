import Pocket from './pocket';
import { signal } from '@angular/core';

describe('Pocket operating mode', () => {
  it('does not upload manual pending scans when the connection returns', async () => {
    const pocket = Object.create(Pocket.prototype) as Pocket;
    pocket.operationMode = 'manual';
    pocket.isOnline = signal(false);
    const sync = spyOn(pocket, 'sync').and.resolveTo();
    await pocket.onNetworkChange(true);
    expect(pocket.isOnline()).toBeTrue();
    expect(sync).not.toHaveBeenCalled();
    pocket.operationMode = 'online';
    await pocket.onNetworkChange(true);
    expect(sync).toHaveBeenCalledTimes(1);
  });
});

describe('Pocket draft protection on navigation to updates', () => {
  afterEach(() => localStorage.removeItem('pocketDraft:DRAFTTEST'));
  function draftPage() {
    const page = Object.create(Pocket.prototype) as Pocket;
    Object.assign(page, {
      pocketService: { isBusy: false }, sessionCode: signal('DRAFTTEST'), skuInput: signal('SKU-DRAFT'),
      inCantidad: '7', selectedSectionId: 12, OptionTypeScan: 'cantidad', isckeckedSku: true,
      editingId: null, editSku: '', editQuantity: 1,
      arAsignatedSections: [{ key: 12, id: 120, value: 'E1' }],
    });
    spyOn(page, 'onNotification');
    return page;
  }
  it('restores the typed SKU, quantity, scan mode and section after leaving Pocket', async () => {
    const page = draftPage(); expect(page.prepareToLeave()).toBeTrue();
    page.skuInput.set(''); page.inCantidad = ''; page.OptionTypeScan = 'pistola';
    const select = spyOn(page, 'onChangeSelect').and.resolveTo();
    await (page as any).restoreDraft();
    expect(page.skuInput()).toBe('SKU-DRAFT'); expect(page.inCantidad).toBe('7');
    expect(page.OptionTypeScan).toBe('cantidad'); expect(select).toHaveBeenCalledWith(page.arAsignatedSections[0]);
  });
  it('keeps the user in Pocket when sending or when the draft cannot be saved', () => {
    const page = draftPage(); (page as any).pocketService.isBusy = true;
    expect(page.prepareToLeave()).toBeFalse();
    (page as any).pocketService.isBusy = false;
    spyOn(localStorage, 'setItem').and.throwError('Storage full');
    expect(page.prepareToLeave()).toBeFalse();
  });
});
