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
