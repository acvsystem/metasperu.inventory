import type { InventoryLabel } from './inventory-label-data';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export function drawInventoryLabel(
  pdf: jsPDF, code: string, title: string, x: number, y: number, w: number, h: number, logo: string,
) {
  const blue = '#0b569c';
  pdf.setDrawColor(blue);
  pdf.setLineWidth(0.4);
  pdf.rect(x, y, w, h);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blue);
  pdf.setFontSize(10);
  const titleLines = pdf.splitTextToSize(title, w - 6).slice(0, 2);
  pdf.text(titleLines, x + w / 2, y + (titleLines.length > 1 ? 5 : 8), { align: 'center' });
  pdf.line(x, y + 13, x + w, y + 13);

  pdf.setFontSize(7);
  pdf.text('Sub-Zona #', x + 3, y + 22);
  // Draw vector runs instead of allocating a 320px PNG for every label.
  const matrix = QRCode.create(code, { errorCorrectionLevel: 'M' }).modules;
  const cell = 19 / (matrix.size + 8); // Four-module quiet zone on every side.
  pdf.setFillColor('#000000');
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size;) {
      if (!matrix.data[row * matrix.size + col]) { col++; continue; }
      const start = col;
      while (col < matrix.size && matrix.data[row * matrix.size + col]) col++;
      pdf.rect(x + w - 23 + (start + 4) * cell, y + 15 + (row + 4) * cell, (col - start) * cell, cell, 'F');
    }
  }

  const fields = ['Conteo:', 'Reconteo:', 'Contado por:', 'Recontado por:'];
  fields.forEach((field, i) => {
    const top = y + 36 + i * 6.5;
    pdf.line(x, top, x + w, top);
    pdf.text(field, x + 2, top + 4.5);
  });
  pdf.line(x, y + 62, x + w, y + 62);
  pdf.addImage(logo, 'PNG', x + 3, y + 65, 5, 5, 'metas-logo');
  pdf.setTextColor('#657280');
  pdf.setFontSize(6);
  pdf.text('METAS PERU', x + 10, y + 68.5);

  pdf.setDrawColor(blue);
  pdf.setFillColor('#fff200');
  pdf.rect(x + w - 22, y + h - 9, 20, 8, 'FD');
  pdf.setTextColor('#111111');
  // Fit long section names without overflowing the yellow identification box.
  pdf.setFontSize(13);
  const width = pdf.getTextWidth(code);
  if (width > 18) pdf.setFontSize(Math.max(5, 13 * 18 / width));
  pdf.text(code, x + w - 12, y + h - 3.4, { align: 'center', maxWidth: 18 });
}

export function createInventoryLabelPdf(
  labels: readonly InventoryLabel[], logo: string, progress: (done: number) => void = () => {},
): ArrayBuffer {
  if (!labels.length) throw new Error('No hay secciones válidas para exportar.');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true, floatPrecision: 3 });
  labels.forEach((label, index) => {
    if (index && index % 9 === 0) pdf.addPage();
    drawInventoryLabel(pdf, label.code, label.title, 10 + index % 3 * 60, 10 + Math.floor(index % 9 / 3) * 77, 55, 72, logo);
    if ((index + 1) % 45 === 0 || index === labels.length - 1) progress(index + 1);
  });
  return pdf.output('arraybuffer');
}
