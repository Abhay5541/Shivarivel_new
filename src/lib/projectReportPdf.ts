import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '@/Asserts/shivarivel_svc_logo.png';

export interface ProjectReportData {
  project: {
    id: string;
    name: string;
    project_code?: string | null;
    code?: string | null;
    status: string;
    site_address?: string | null;
    start_date?: string | null;
    target_completion_date?: string | null;
    actual_completion_date?: string | null;
    end_date?: string | null;
    created_at?: string;
  };
  customer?: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    location?: string | null;
    email?: string | null;
  } | null;
  company?: {
    name?: string | null;
    owner_name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    gst_number?: string | null;
  } | null;
  wages: {
    totalWages: number;
    totalDays: number;
    uniqueLabourers: number;
    items: Array<{
      employeeName: string;
      trade?: string | null;
      days: number;
      total: number;
    }>;
  };
  procurement: {
    totalPurchased: number;
    totalPaid: number;
    totalOutstanding: number;
    items: Array<{
      date: string;
      productName: string;
      supplierName: string;
      quantity?: string | number | null;
      amount: number;
      paymentStatus: string;
    }>;
  };
}

// Module-level cached logo element for instant synchronous and asynchronous rendering
let cachedLogoImg: HTMLImageElement | null = null;
if (typeof window !== 'undefined') {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    cachedLogoImg = img;
  };
  img.src = logoImg;
}

function getLogoElement(): Promise<HTMLImageElement | null> {
  if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
    return Promise.resolve(cachedLogoImg);
  }
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedLogoImg = img;
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = logoImg;
  });
}

function formatCurrency(amt: number): string {
  return 'Rs. ' + Number(amt || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates the Official Final Project Completion & Closure Report PDF.
 */
export function generateProjectCompletionPDF(
  data: ProjectReportData,
  logoEl?: HTMLImageElement | null
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const maroon = [74, 14, 14] as [number, number, number];
  const gold = [201, 154, 46] as [number, number, number];
  const darkGray = [36, 36, 36] as [number, number, number];
  const muted = [107, 107, 107] as [number, number, number];
  const green = [30, 107, 55] as [number, number, number];
  const lightBg = [250, 248, 245] as [number, number, number];

  let y = margin;

  // Top Maroon & Gold Banner Accent Lines
  doc.setFillColor(...maroon);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  y += 4;

  // ── 1. HEADER SECTION (With Company Logo, Official Name & Contact) ─────────
  const logoToUse = logoEl || cachedLogoImg;
  const logoSize = 17;

  if (logoToUse && logoToUse.complete && logoToUse.naturalWidth > 0) {
    try {
      doc.addImage(logoToUse, 'PNG', margin, y, logoSize, logoSize);
    } catch (err) {
      console.warn('Could not add logo to PDF:', err);
    }
  }

  const textX = logoToUse ? margin + logoSize + 3.5 : margin;

  // Company Name
  doc.setTextColor(...maroon);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SHIVARIVEL CONSTRUCTIONS & INTERIORS', textX, y + 4);

  // Subtitle
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gold);
  doc.text('PREMIUM RESIDENTIAL & COMMERCIAL PROJECTS', textX, y + 8.5);

  // Company Contact Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  const addressLine = data.company?.address || '14, South Car Street, Sankarankovil, Tenkasi District, Tamil Nadu - 627756';
  const phoneLine = 'Mobile: +91 73394 57041  |  Email: contact@shivarivel.com';
  doc.text(addressLine, textX, y + 12.5);
  doc.text(phoneLine, textX, y + 16.5);

  // Right-aligned report metadata
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const projectRef = data.project.project_code || data.project.code || data.project.name || 'PRJ';
  const reportCode = `REP-${projectRef.toUpperCase().slice(0, 8)}-${Date.now().toString().slice(-4)}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...maroon);
  doc.text('PROJECT CLOSURE REPORT', pageWidth - margin, y + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(`Ref: ${reportCode}`, pageWidth - margin, y + 8, { align: 'right' });
  doc.text(`Date: ${reportDate}`, pageWidth - margin, y + 11.5, { align: 'right' });

  // Status Badge on top right
  doc.setFillColor(232, 248, 238);
  doc.setDrawColor(134, 239, 172);
  doc.roundedRect(pageWidth - margin - 25, y + 13.5, 25, 5, 1.2, 1.2, 'FD');
  doc.setTextColor(...green);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('• COMPLETED', pageWidth - margin - 12.5, y + 17, { align: 'center' });

  y += 22;

  // Horizontal divider line
  doc.setDrawColor(226, 221, 213);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ── 2. PROJECT OVERVIEW CARD ────────────────────────────────────────────────
  doc.setFillColor(...lightBg);
  doc.setDrawColor(226, 221, 213);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  const cardY = y + 5;

  // Col 1: Project Name
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...muted);
  doc.text('PROJECT NAME', margin + 4, cardY);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text(doc.splitTextToSize(data.project.name, colWidth - 6)[0] || data.project.name, margin + 4, cardY + 5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text(`Code: ${data.project.project_code || data.project.code || 'SVC-' + data.project.id.slice(0, 5).toUpperCase()}`, margin + 4, cardY + 9.5);

  // Col 2: Client Details
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...muted);
  doc.text('CLIENT / OWNER', margin + colWidth + 2, cardY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text(data.customer?.name || 'Client', margin + colWidth + 2, cardY + 5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text(data.customer?.phone || 'Contact on file', margin + colWidth + 2, cardY + 9.5);

  // Col 3: Location
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...muted);
  doc.text('SITE LOCATION', margin + colWidth * 2 + 2, cardY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  const loc = data.project.site_address || data.customer?.city || data.customer?.address || data.customer?.location || 'Tamil Nadu';
  doc.text(doc.splitTextToSize(loc, colWidth - 6)[0] || loc, margin + colWidth * 2 + 2, cardY + 5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text('Tamil Nadu, India', margin + colWidth * 2 + 2, cardY + 9.5);

  // Col 4: Timeline
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...muted);
  doc.text('COMPLETION DATE', margin + colWidth * 3 + 2, cardY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...green);
  const completionDate = data.project.actual_completion_date || data.project.target_completion_date || data.project.end_date || new Date().toISOString();
  doc.text(formatDate(completionDate), margin + colWidth * 3 + 2, cardY + 5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text(`Started: ${formatDate(data.project.start_date || data.project.created_at)}`, margin + colWidth * 3 + 2, cardY + 9.5);

  y += 24;

  // ── 3. EXECUTIVE FINANCIAL SUMMARY ──────────────────────────────────────────
  const totalProjectCost = data.wages.totalWages + data.procurement.totalPurchased;
  const boxWidth = (contentWidth - 6) / 3;
  const boxHeight = 19;

  // Box 1: Total Project Cost
  doc.setFillColor(254, 247, 240);
  doc.setDrawColor(245, 218, 178);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...maroon);
  doc.text('TOTAL PROJECT COST', margin + 4, y + 4.5);
  doc.setFontSize(12);
  doc.setTextColor(...maroon);
  doc.text(formatCurrency(totalProjectCost), margin + 4, y + 10.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text('Combined Wages + Materials', margin + 4, y + 15);

  // Box 2: Total Labour Wages
  doc.setFillColor(242, 250, 245);
  doc.setDrawColor(198, 231, 210);
  doc.roundedRect(margin + boxWidth + 3, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...green);
  doc.text('TOTAL LABOUR WAGES', margin + boxWidth + 7, y + 4.5);
  doc.setFontSize(12);
  doc.setTextColor(...green);
  doc.text(formatCurrency(data.wages.totalWages), margin + boxWidth + 7, y + 10.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text(`${data.wages.uniqueLabourers} Labourers  •  ${data.wages.totalDays} Man-days`, margin + boxWidth + 7, y + 15);

  // Box 3: Total Materials / Procurement
  doc.setFillColor(255, 245, 245);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin + (boxWidth + 3) * 2, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('MATERIAL PROCUREMENT', margin + (boxWidth + 3) * 2 + 4, y + 4.5);
  doc.setFontSize(12);
  doc.setTextColor(...darkGray);
  doc.text(formatCurrency(data.procurement.totalPurchased), margin + (boxWidth + 3) * 2 + 4, y + 10.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text(`Paid: ${formatCurrency(data.procurement.totalPaid)} | Due: ${formatCurrency(data.procurement.totalOutstanding)}`, margin + (boxWidth + 3) * 2 + 4, y + 15);

  y += boxHeight + 6;

  // ── 4. LABOUR / WORKFORCE BREAKDOWN TABLE ──────────────────────────────────
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...maroon);
  doc.text('1. LABOUR & WORKFORCE UTILIZATION', margin, y + 1);

  const wageRows = data.wages.items.map((item, idx) => [
    String(idx + 1),
    item.employeeName || 'Worker',
    item.trade || 'Field Laborer',
    `${item.days} ${item.days === 1 ? 'day' : 'days'}`,
    formatCurrency(item.total),
  ]);

  if (wageRows.length === 0) {
    wageRows.push(['-', 'No wages recorded for this project', '-', '-', 'Rs. 0']);
  }

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    head: [['#', 'Labourer Name', 'Category / Trade', 'Man-Days', 'Total Wage (INR)']],
    body: wageRows,
    foot: [
      [
        '',
        'Total Workforce Cost',
        `${data.wages.uniqueLabourers} Labourers`,
        `${data.wages.totalDays} days`,
        formatCurrency(data.wages.totalWages),
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: maroon,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [247, 245, 240],
      textColor: maroon,
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: darkGray,
      lineColor: [226, 221, 213],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: green },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Check if we need to add a page or if space is tight
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin + 5;
  }

  // ── 5. PROCUREMENT & MATERIALS TABLE ──────────────────────────────────────
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...maroon);
  doc.text('2. PROJECT MATERIALS & PROCUREMENT', margin, y + 1);

  const purchaseRows = data.procurement.items.map((p, idx) => [
    String(idx + 1),
    formatDate(p.date),
    p.productName || 'Material',
    p.supplierName && !p.supplierName.toLowerCase().includes('direct') ? p.supplierName : 'Local Supplier',
    p.quantity ? String(p.quantity) : '—',
    formatCurrency(p.amount),
    p.paymentStatus || 'Unpaid',
  ]);

  if (purchaseRows.length === 0) {
    purchaseRows.push(['-', '-', 'No purchases recorded for this project', '-', '-', 'Rs. 0', '-']);
  }

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    head: [['#', 'Date', 'Material / Item Description', 'Supplier', 'Qty', 'Amount (INR)', 'Status']],
    body: purchaseRows,
    foot: [
      [
        '',
        'Total',
        `${data.procurement.items.length} items purchased`,
        '',
        '',
        formatCurrency(data.procurement.totalPurchased),
        `Paid: ${formatCurrency(data.procurement.totalPaid)}`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: maroon,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [247, 245, 240],
      textColor: darkGray,
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: darkGray,
      lineColor: [226, 221, 213],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 54, fontStyle: 'bold' },
      3: { cellWidth: 36 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'center' },
    },
  });

  // ── 6. FOOTER ON ALL PAGES ────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 221, 213);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    doc.text(
      'Shivarivel Constructions & Interiors  •  Confidential & Proprietary  •  Final Project Closure Report',
      margin,
      pageHeight - 6.5
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  return doc;
}

/**
 * Helper to download the PDF directly in browser/device.
 */
export async function downloadProjectCompletionPDF(data: ProjectReportData) {
  const logoEl = await getLogoElement();
  const doc = generateProjectCompletionPDF(data, logoEl);
  const cleanName = (data.project.name || 'Project')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const fileName = `${cleanName}_Completion_Report.pdf`;
  doc.save(fileName);
}
