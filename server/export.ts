import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Supplier } from '../drizzle/schema';

export interface ExportFilters {
  categoryId?: number;
  status?: string;
  criticality?: string;
  searchTerm?: string;
}

export interface ExportOptions {
  format: 'excel' | 'pdf';
  filters?: ExportFilters;
  fields?: string[];
}

const defaultFields = [
  'companyName',
  'cnpj',
  'email',
  'phone',
  'status',
  'criticality',
];

const fieldLabels: Record<string, string> = {
  companyName: 'Razão Social',
  tradeName: 'Nome Fantasia',
  cnpj: 'CNPJ',
  email: 'Email',
  phone: 'Telefone',
  website: 'Website',
  street: 'Rua',
  city: 'Cidade',
  state: 'Estado',
  zipCode: 'CEP',
  bankName: 'Banco',
  status: 'Status',
  criticality: 'Criticidade',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  suspended: 'Suspenso',
  inactive: 'Inativo',
};

const criticalityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

/**
 * Export suppliers to Excel format
 */
export async function exportToExcel(
  suppliers: Supplier[],
  options: ExportOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Fornecedores');

  // Define fields to export
  const fields = options.fields && options.fields.length > 0 
    ? options.fields 
    : defaultFields;

  // Add header row with styling
  const headerRow = worksheet.addRow(
    fields.map((field) => fieldLabels[field] || field)
  );
  
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B1538' }, // Bordô do Grupo Arqueo
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  suppliers.forEach((supplier) => {
    const rowData = fields.map((field) => {
      const value = supplier[field as keyof Supplier];
      
      // Format specific fields
      if (field === 'status' && typeof value === 'string') {
        return statusLabels[value] || value;
      }
      if (field === 'criticality' && typeof value === 'string') {
        return criticalityLabels[value] || value;
      }
      
      return value ?? '';
    });
    
    const dataRow = worksheet.addRow(rowData);
    dataRow.alignment = { vertical: 'middle' };
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    if (column && column.eachCell) {
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
    }
    if (column) {
      column.width = Math.min(maxLength + 2, 50);
    }
  });

  // Add filters
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: fields.length },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export suppliers to PDF format
 */
export async function exportToPDF(
  suppliers: Supplier[],
  options: ExportOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4', 
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Define fields to export
    const fields = options.fields && options.fields.length > 0 
      ? options.fields 
      : defaultFields.slice(0, 5); // Limit fields for PDF to fit page

    // Header
    doc.fontSize(18)
       .fillColor('#8B1538') // Bordô do Grupo Arqueo
       .text('Relatório de Fornecedores', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
    
    doc.moveDown(2);

    // Table header
    const startY = doc.y;
    const columnWidth = (doc.page.width - 100) / fields.length;
    
    fields.forEach((field, index) => {
      const x = 50 + index * columnWidth;
      doc.rect(x, startY, columnWidth, 25)
         .fillAndStroke('#8B1538', '#8B1538');
      
      doc.fontSize(9)
         .fillColor('#FFFFFF')
         .text(
           fieldLabels[field] || field,
           x + 5,
           startY + 8,
           { width: columnWidth - 10, align: 'left' }
         );
    });

    doc.moveDown();
    let currentY = startY + 25;

    // Table rows
    suppliers.forEach((supplier, rowIndex) => {
      // Check if we need a new page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      const rowColor = rowIndex % 2 === 0 ? '#F9F9F9' : '#FFFFFF';
      
      fields.forEach((field, colIndex) => {
        const x = 50 + colIndex * columnWidth;
        
        doc.rect(x, currentY, columnWidth, 20)
           .fillAndStroke(rowColor, '#DDDDDD');
        
        let value = supplier[field as keyof Supplier];
        
        // Format specific fields
        if (field === 'status' && typeof value === 'string') {
          value = statusLabels[value] || value;
        }
        if (field === 'criticality' && typeof value === 'string') {
          value = criticalityLabels[value] || value;
        }
        
        const displayValue = value?.toString() || '';
        
        doc.fontSize(8)
           .fillColor('#333333')
           .text(
             displayValue,
             x + 5,
             currentY + 6,
             { width: columnWidth - 10, align: 'left', ellipsis: true }
           );
      });
      
      currentY += 20;
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `Página ${i + 1} de ${pages.count} | Grupo Arqueo - Gestão de Fornecedores`,
           50,
           doc.page.height - 30,
           { align: 'center' }
         );
    }

    doc.end();
  });
}
