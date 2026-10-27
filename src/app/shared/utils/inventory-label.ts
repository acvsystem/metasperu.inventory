import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export async function drawInventoryLabel(
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
  // Quiet zone is included so the enlarged QR remains scannable after printing.
  const qr = await QRCode.toDataURL(code, { margin: 4, width: 320, errorCorrectionLevel: 'M' });
  pdf.addImage(qr, 'PNG', x + w - 23, y + 15, 19, 19);

  const fields = ['Conteo:', 'Reconteo:', 'Contado por:', 'Recontado por:'];
  fields.forEach((field, i) => {
    const top = y + 36 + i * 6.5;
    pdf.line(x, top, x + w, top);
    pdf.text(field, x + 2, top + 4.5);
  });
  pdf.line(x, y + 62, x + w, y + 62);
  pdf.addImage(logo, 'PNG', x + 3, y + 65, 5, 5);
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
