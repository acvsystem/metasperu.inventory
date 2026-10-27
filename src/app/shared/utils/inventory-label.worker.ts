import { createInventoryLabelPdf } from './inventory-label';
import type { InventoryLabel } from './inventory-label-data';

addEventListener('message', ({ data }: MessageEvent<{ labels: InventoryLabel[]; logo: string }>) => {
  try {
    const buffer = createInventoryLabelPdf(data.labels, data.logo, (done) => {
      postMessage({ type: 'progress', done });
    });
    postMessage({ type: 'ready', buffer }, { transfer: [buffer] });
  } catch {
    postMessage({ type: 'error', message: 'No se pudo generar el PDF. Reintenta la descarga.' });
  }
});
