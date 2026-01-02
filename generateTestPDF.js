import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Generates a "Perfect" test PDF for tax credit analysis
 * Contains exact text content for AI testing
 */
function generateTestPDF() {
    const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const outputPath = 'test_tax_audit.pdf';
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('CONFIDENTIAL TAX AUDIT', { align: 'center' });

    doc.moveDown(1);

    doc.fontSize(12)
        .font('Helvetica')
        .text('Client: Apex Innovations LLC', { align: 'center' });

    doc.moveDown(0.5);

    doc.text('Fiscal Year: 2025', { align: 'center' });

    doc.moveDown(2);

    // Qualified Research Activities Section
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('QUALIFIED RESEARCH ACTIVITIES (IRC 41):');

    doc.moveDown(0.8);

    doc.fontSize(11)
        .font('Helvetica')
        .text('1. Development of proprietary compression algorithm (Software).', { indent: 10 });

    doc.moveDown(0.5);

    doc.text('2. Cloud architecture redesign for scalability.', { indent: 10 });

    doc.moveDown(2);

    // Expense Breakdown Section
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('EXPENSE BREAKDOWN:');

    doc.moveDown(0.8);

    doc.fontSize(11)
        .font('Helvetica')
        .text('- Senior Engineer Wages: $150,000', { indent: 10 });

    doc.moveDown(0.5);

    doc.text('- Junior Developer Wages: $80,000', { indent: 10 });

    doc.moveDown(0.5);

    doc.text('- Cloud Hosting (AWS) Allocable to Testing: $12,000', { indent: 10 });

    doc.moveDown(0.5);

    doc.text('- Contractor (Research): $45,000', { indent: 10 });

    doc.moveDown(2);

    // Total Section
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('TOTAL QRE: $287,000.');

    doc.moveDown(0.8);

    doc.text('ESTIMATED CREDIT VALUE: $28,000.');

    // Finalize the PDF
    doc.end();

    stream.on('finish', () => {
        console.log(`✅ PDF generated successfully: ${outputPath}`);
    });

    stream.on('error', (err) => {
        console.error('❌ Error generating PDF:', err);
    });
}

// Run the function
generateTestPDF();
