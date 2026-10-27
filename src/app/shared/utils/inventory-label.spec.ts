import { createInventoryLabelPdf } from './inventory-label';
import { toInventoryLabels } from './inventory-label-data';

describe('large QR label export', () => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const logo = canvas.toDataURL('image/png');
  it('keeps a 100-label PDF below 1 MB instead of allocating full PNGs per QR', () => {
    const progress: number[] = [];
    const pdf = createInventoryLabelPdf(Array.from({ length: 100 }, (_, i) => ({ code: 'E' + i, title: 'TESTER' })), logo, (done) => progress.push(done));
    expect(pdf.byteLength).toBeLessThan(1_000_000);
    expect(progress[progress.length - 1]).toBe(100);
    expect(progress.every((done, i) => i === 0 || done > progress[i - 1])).toBeTrue();
  });
  it('does not append a blank page after exactly nine labels', () => {
    const pdf = createInventoryLabelPdf(Array.from({ length: 9 }, (_, i) => ({ code: 'E' + i, title: 'TESTER' })), logo);
    const pages = new TextDecoder('latin1').decode(pdf).match(/\/Type \/Page\b/g);
    expect(pages?.length).toBe(1);
  });
  it('prepares only valid labels and finds zone names by section ID or normalized name', () => {
    expect(toInventoryLabels([
      { nombre_seccion: 'E1', seccion_id_fk: 1 }, { nombre_seccion: ' A 2 ' }, { nombre_seccion: ' ' }, 'B3',
    ], [
      { seccion_id: 1, nombre_zona: 'Tester' }, { nombre_seccion: 'A 2', nombre_zona: 'Almacén' },
    ])).toEqual([{ code: 'E1', title: 'TESTER' }, { code: 'A 2', title: 'ALMACÉN' }, { code: 'B3', title: 'PISO DE VENTAS' }]);
    expect(() => createInventoryLabelPdf([], logo)).toThrowError();
  });
});
