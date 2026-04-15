import { PurchaseOrder } from '../store/useProcurementModuleStore';
import { formatCurrency } from '@/utils/currency';

/**
 * Generates a premium PDF for a Purchase Order matching the corporate geometric design.
 * @param po The Purchase Order object with items and supplier info.
 */
export async function generatePOPDF(po: PurchaseOrder) {
  if (typeof window === 'undefined') return;

  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const orange = [245, 158, 11]; // #f59e0b
  const darkBlue = [30, 41, 59]; // #1e293b
  const lightGray = [241, 245, 249]; // #f1f5f9
  const textGray = [100, 116, 139]; // #64748b

  // 1. TOP GEOMETRIC DECORATION (Orange angular overlays)
  doc.setFillColor(orange[0], orange[1], orange[2]);
  // Drawing the top-right triangle/polygon
  doc.triangle(140, 0, 210, 0, 210, 45, 'F');
  
  // 2. HEADER: Branding & Identity
  // Logo (Geometric 'G' placeholder)
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.circle(28, 22, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('G', 26, 24);
  
  // Company Name
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(18);
  doc.text('PharmERP Systems', 42, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Advanced Healthcare Solutions', 42, 25);
  
  // Large "PURCHASE ORDER" label overlay
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  // Large "PURCHASE ORDER" label overlay
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('PO', 165, 18);
  doc.setFontSize(10);
  doc.text('OFFICIAL RECORD', 165, 24);

  // 3. CONTACT INFO (Subtle icons approach)
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(8);
  doc.text('123 Pharma Heights, Science City, SC 4001', 20, 40);
  doc.text('+1 (555) 012-3492  |  hq@pharmerp.com', 20, 45);

  // 4. CONTENT BLOCKS (Two columns)
  const blockStart = 60;
  
  // LEFT: Supplier Info (Colored Tag)
  doc.setFillColor(orange[0], orange[1], orange[2]);
  doc.rect(20, blockStart, 40, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VENDOR INFO', 24, blockStart + 4.5);
  
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(11);
  doc.text(po.supplier?.name || 'Manual Vendor', 20, blockStart + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Status: ' + po.status.toUpperCase(), 20, blockStart + 17);
  doc.text('Created At: ' + new Date(po.created_at).toLocaleDateString(), 20, blockStart + 22);

  // RIGHT: PO Details (Boxed sections)
  const rightCol = 130;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(rightCol, blockStart, 60, 24, 'F');
  
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ORDER NO:', rightCol + 5, blockStart + 6);
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(10);
  doc.text(po.po_number, rightCol + 5, blockStart + 11);
  
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.setFontSize(8);
  doc.text('EST. DELIVERY:', rightCol + 5, blockStart + 17);
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(10);
  doc.text(po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : 'N/A', rightCol + 5, blockStart + 22);

  // 5. PRODUCT TABLE (Core focus area)
  autoTable(doc, {
    startY: 95,
    head: [['Product Description', 'Unit Cost', 'Ordered Qty', 'Total']],
    body: (po.items || []).map(item => [
      item.product?.name || 'Unknown Product',
      formatCurrency(item.unit_cost),
      item.quantity_ordered.toString(),
      formatCurrency(item.unit_cost * item.quantity_ordered)
    ]),
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 41, 59], 
      textColor: [255, 255, 255], 
      fontSize: 9, 
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
    },
    styles: { fontSize: 8, cellPadding: 4 },
    margin: { left: 20, right: 20 },
  });

  // 6. TOTALS (Right aligned)
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsLeft = 120; // Moved more to the left to avoid overlap
  const totalsRight = 190;
  
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsLeft, finalY, totalsRight, finalY);
  
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.setFontSize(9);
  doc.text('Subtotal:', totalsLeft, finalY + 8);
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.text(formatCurrency(po.total_amount), totalsRight, finalY + 8, { align: 'right' });

  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', totalsLeft, finalY + 18);
  doc.setFontSize(15);
  doc.text(formatCurrency(po.total_amount), totalsRight, finalY + 18, { align: 'right' });

  // Add a nice total underline
  doc.setDrawColor(orange[0], orange[1], orange[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsLeft, finalY + 22, totalsRight, finalY + 22);
  doc.setLineWidth(0.1); // reset

  // 7. EXTRAS & FOOTER
  // Terms box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, finalY + 8, 80, 20, 'F');
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.setFontSize(8);
  doc.text('TERMS & CONDITIONS', 24, finalY + 13);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.setFontSize(7);
  doc.text('1. Delivery should be made within 7 days.\n2. Invoices with PO reference are required.\n3. Goods must match specification exactly.', 24, finalY + 17);

  // Closure
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business.', 20, 275);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Authorized Signature', 150, 275);
  doc.line(150, 271, 190, 271);

  // Footer bar
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.rect(0, 287, 210, 10, 'F');

  // Save/Download
  doc.save(`${po.po_number}_PO.pdf`);
}
