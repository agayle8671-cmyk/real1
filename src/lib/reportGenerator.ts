// src/lib/reportGenerator.ts
// ============================================================================
// GRANTFLOW PROFESSIONAL AUDIT REPORT GENERATOR
// Big 4 Style Audit Packet
// ============================================================================

import { jsPDF } from 'jspdf';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Deal information for report generation */
export interface Deal {
    id: number | string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Allow loose typing to prevent App.tsx breakage
    company: string;
    ein?: string;
    value: number;
    risk_score: number;
    status: string;

    // Eligibility flags
    is_rd_eligible?: boolean;
    is_training_eligible?: boolean;
    is_green_eligible?: boolean;
    is_erc_eligible?: boolean;

    // Value breakdown
    rd_credit_value?: number;
    training_credit_value?: number;
    green_energy_value?: number;
    erc_value?: number;

    // Additional metadata
    naics_code?: string;
    industry?: string;
    employee_count?: number;
    fiscal_year?: number;
    confidence_score?: number;

    // Audit details
    anomalies_count?: number;
    created_at?: string;
    analyzed_at?: string;
}

/** Report generation options */
export interface ReportOptions {
    preparedBy?: string;
    reportTitle?: string;
    caseId?: string;
    showWatermark?: boolean;
    watermarkText?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Page dimensions (A4)
const PAGE = {
    width: 210,
    height: 297,
    marginLeft: 25,
    marginRight: 25,
    marginTop: 20,
    marginBottom: 17,
} as const;

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight;

// Colors
const COLOR = {
    navy: [15, 30, 60] as const,
    blue: [37, 99, 235] as const,
    darkGray: [50, 50, 50] as const,
    mediumGray: [120, 120, 120] as const,
    lightGray: [200, 200, 200] as const,
    bgGray: [245, 247, 250] as const,
    white: [255, 255, 255] as const,
    green: [16, 150, 80] as const,
    red: [200, 50, 50] as const,
    amber: [200, 130, 20] as const,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(date: Date | string = new Date()): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function generateCaseId(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GF-${year}-${random}`;
}

function getRiskLabel(score: number): { label: string; color: readonly number[] } {
    if (score <= 25) return { label: 'Low', color: COLOR.green };
    if (score <= 50) return { label: 'Moderate', color: COLOR.amber };
    if (score <= 75) return { label: 'Elevated', color: COLOR.amber };
    return { label: 'High', color: COLOR.red };
}

// Create dot leader string (Unused)
// function createDotLeader(text: string, value: string, totalWidth: number, doc: jsPDF): string {
//     const textWidth = doc.getTextWidth(text);
//     const valueWidth = doc.getTextWidth(value);
//     const dotsWidth = totalWidth - textWidth - valueWidth - 4;
//     const dotChar = '.';
//     const singleDotWidth = doc.getTextWidth(dotChar);
//     const numDots = Math.floor(dotsWidth / singleDotWidth);
//     return dotChar.repeat(Math.max(0, numDots));
// }

// ============================================================================
// PDF COMPONENT FUNCTIONS
// ============================================================================

/**
 * Draw the header section
 */
function drawHeader(doc: jsPDF, caseId: string): number {
    let y = PAGE.marginTop;

    // Brand bar
    doc.setFillColor(...COLOR.navy);
    doc.rect(0, 0, PAGE.width, 8, 'F');

    // Logo text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...COLOR.navy);
    doc.text('GRANTFLOW', PAGE.marginLeft, y + 14);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.mediumGray);
    doc.text('Tax Credit Advisory Services', PAGE.marginLeft, y + 21);

    // Right side: Case ID and Date box
    const boxWidth = 55;
    const boxHeight = 22;
    const boxX = PAGE.width - PAGE.marginRight - boxWidth;
    const boxY = y + 4;

    doc.setFillColor(COLOR.bgGray[0], COLOR.bgGray[1], COLOR.bgGray[2]);
    doc.setDrawColor(COLOR.lightGray[0], COLOR.lightGray[1], COLOR.lightGray[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.mediumGray);
    doc.text('Case ID:', boxX + 4, boxY + 7);
    doc.text('Date:', boxX + 4, boxY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.darkGray);
    doc.text(caseId, boxX + 22, boxY + 7);
    doc.text(formatDate(), boxX + 22, boxY + 15);

    // Divider line
    y = y + 32;
    doc.setDrawColor(...COLOR.navy);
    doc.setLineWidth(0.8);
    doc.line(PAGE.marginLeft, y, PAGE.width - PAGE.marginRight, y);

    return y + 8;
}

/**
 * Draw report title section
 */
function drawTitle(doc: jsPDF, y: number, title: string): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLOR.navy);
    doc.text(title, PAGE.marginLeft, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.mediumGray);
    doc.text('Preliminary Eligibility Assessment', PAGE.marginLeft, y + 6);

    return y + 16;
}

/**
 * Draw client information section
 */
function drawClientInfo(doc: jsPDF, y: number, deal: Deal): number {
    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.navy);
    doc.text('CLIENT INFORMATION', PAGE.marginLeft, y);

    // Thin divider
    y += 3;
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.3);
    doc.line(PAGE.marginLeft, y, PAGE.marginLeft + 45, y);

    y += 8;

    // Two-column layout
    const col1X = PAGE.marginLeft;
    const col2X = PAGE.marginLeft + 85;

    // Labels
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.mediumGray);

    doc.text('Company Name', col1X, y);
    doc.text('EIN', col1X, y + 12);
    doc.text('Industry', col2X, y);
    doc.text('Fiscal Year', col2X, y + 12);

    // Values
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.darkGray);

    doc.text(deal.company || '—', col1X, y + 5);
    doc.text(deal.ein || 'Not Provided', col1X, y + 17);
    doc.text(deal.industry || 'Technology', col2X, y + 5);
    doc.text(deal.fiscal_year?.toString() || new Date().getFullYear().toString(), col2X, y + 17);

    return y + 28;
}

/**
 * Draw the main value summary box
 */
function drawValueSummary(doc: jsPDF, y: number, deal: Deal): number {
    const boxHeight = 50;

    // Background box
    doc.setFillColor(...COLOR.bgGray);
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(PAGE.marginLeft, y, CONTENT_WIDTH, boxHeight, 3, 3, 'FD');

    // Left side: Label and Value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.mediumGray);
    doc.text('TOTAL ESTIMATED TAX CREDIT', PAGE.marginLeft + 10, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(...COLOR.navy);
    doc.text(formatCurrency(deal.value), PAGE.marginLeft + 10, y + 36);

    // Right side: Risk Score
    const riskBoxX = PAGE.width - PAGE.marginRight - 50;
    const riskBoxY = y + 8;
    const riskBoxW = 40;
    const riskBoxH = 34;

    const { label: riskLabel, color: riskColor } = getRiskLabel(deal.risk_score);

    doc.setFillColor(...COLOR.white);
    doc.setDrawColor(...COLOR.lightGray);
    doc.roundedRect(riskBoxX, riskBoxY, riskBoxW, riskBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR.mediumGray);
    doc.text('RISK SCORE', riskBoxX + riskBoxW / 2, riskBoxY + 8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.text(deal.risk_score.toString(), riskBoxX + riskBoxW / 2, riskBoxY + 21, { align: 'center' });

    doc.setFontSize(8);
    doc.text(riskLabel, riskBoxX + riskBoxW / 2, riskBoxY + 29, { align: 'center' });

    return y + boxHeight + 12;
}

/**
 * Draw section divider
 */
function drawDivider(doc: jsPDF, y: number): number {
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.3);
    doc.line(PAGE.marginLeft, y, PAGE.width - PAGE.marginRight, y);
    return y + 8;
}

/**
 * Draw the credit breakdown table
 */
function drawCreditBreakdown(doc: jsPDF, y: number, deal: Deal): number {
    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.navy);
    doc.text('CREDIT BREAKDOWN', PAGE.marginLeft, y);

    // Thin divider
    y += 3;
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.3);
    doc.line(PAGE.marginLeft, y, PAGE.marginLeft + 42, y);

    y += 10;

    // Credit line items
    const credits = [
        {
            name: 'Research & Development Credit (IRC §41)',
            eligible: deal.is_rd_eligible ?? false,
            value: deal.rd_credit_value ?? 0,
            code: 'Form 6765',
        },
        {
            name: 'Training & Education Assistance (IRC §127)',
            eligible: deal.is_training_eligible ?? false,
            value: deal.training_credit_value ?? 0,
            code: 'Form W-2',
        },
        {
            name: 'Energy Efficient Commercial Property (§179D)',
            eligible: deal.is_green_eligible ?? false,
            value: deal.green_energy_value ?? 0,
            code: 'Form 7205',
        },
        {
            name: 'Employee Retention Credit (IRC §3134)',
            eligible: deal.is_erc_eligible ?? false,
            value: deal.erc_value ?? 0,
            code: 'Form 941-X',
        },
    ];

    const lineHeight = 14;
    // const itemWidth = CONTENT_WIDTH;

    doc.setFontSize(9);

    credits.forEach((credit, index) => {
        const lineY = y + (index * lineHeight);
        const isEligible = credit.eligible && credit.value > 0;

        // Alternating row background
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 252);
            doc.rect(PAGE.marginLeft, lineY - 4, CONTENT_WIDTH, lineHeight - 1, 'F');
        }

        // Status indicator
        if (isEligible) {
            doc.setFillColor(...COLOR.green);
            doc.circle(PAGE.marginLeft + 4, lineY + 1, 2, 'F');
        } else {
            doc.setDrawColor(...COLOR.lightGray);
            doc.setLineWidth(0.5);
            doc.circle(PAGE.marginLeft + 4, lineY + 1, 2, 'S');
        }

        // Credit name
        doc.setFont('helvetica', 'normal');
        const nameColor = isEligible ? COLOR.darkGray : COLOR.lightGray;
        doc.setTextColor(nameColor[0], nameColor[1], nameColor[2]);
        doc.text(credit.name, PAGE.marginLeft + 10, lineY + 1);

        // Value
        const valueText = isEligible ? formatCurrency(credit.value) : '—';
        doc.setFont('helvetica', 'bold');
        const valueColor = isEligible ? COLOR.navy : COLOR.lightGray;
        doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
        doc.text(valueText, PAGE.width - PAGE.marginRight, lineY + 1, { align: 'right' });

        // Dot leader
        if (isEligible) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...COLOR.lightGray);
            const nameWidth = doc.getTextWidth(credit.name);
            const valueWidth = doc.getTextWidth(valueText);
            const dotsStart = PAGE.marginLeft + 10 + nameWidth + 2;
            const dotsEnd = PAGE.width - PAGE.marginRight - valueWidth - 2;
            const dotSpacing = 2;

            for (let x = dotsStart; x < dotsEnd; x += dotSpacing) {
                doc.text('.', x, lineY + 1);
            }
        }

        // Form code (small)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLOR.mediumGray);
        doc.text(credit.code, PAGE.marginLeft + 10, lineY + 6);
    });

    y += credits.length * lineHeight + 4;

    // Total line
    doc.setDrawColor(...COLOR.navy);
    doc.setLineWidth(0.5);
    doc.line(PAGE.marginLeft, y, PAGE.width - PAGE.marginRight, y);

    y += 8;

    // Total row
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.navy);
    doc.text('TOTAL ESTIMATED CREDITS', PAGE.marginLeft, y);
    doc.text(formatCurrency(deal.value), PAGE.width - PAGE.marginRight, y, { align: 'right' });

    return y + 12;
}

/**
 * Draw eligibility summary boxes
 */
function drawEligibilitySummary(doc: jsPDF, y: number, deal: Deal): number {
    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.navy);
    doc.text('ELIGIBILITY SUMMARY', PAGE.marginLeft, y);

    y += 3;
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.3);
    doc.line(PAGE.marginLeft, y, PAGE.marginLeft + 48, y);

    y += 10;

    const items = [
        { code: 'IRC §41', name: 'R&D Credit', eligible: deal.is_rd_eligible },
        { code: 'IRC §127', name: 'Training', eligible: deal.is_training_eligible },
        { code: '§179D', name: 'Energy', eligible: deal.is_green_eligible },
        { code: 'ERC', name: 'Retention', eligible: deal.is_erc_eligible },
    ];

    const boxWidth = (CONTENT_WIDTH - 15) / 4;
    const boxHeight = 28;

    items.forEach((item, index) => {
        const boxX = PAGE.marginLeft + (index * (boxWidth + 5));
        const isEligible = item.eligible ?? false;

        // Box
        doc.setFillColor(isEligible ? 235 : 250, isEligible ? 245 : 250, isEligible ? 255 : 252);
        const boxBorder = isEligible ? COLOR.blue : COLOR.lightGray;
        doc.setDrawColor(boxBorder[0], boxBorder[1], boxBorder[2]);
        doc.setLineWidth(isEligible ? 0.5 : 0.3);
        doc.roundedRect(boxX, y, boxWidth, boxHeight, 2, 2, 'FD');

        // Code
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const codeColor = isEligible ? COLOR.blue : COLOR.mediumGray;
        doc.setTextColor(codeColor[0], codeColor[1], codeColor[2]);
        doc.text(item.code, boxX + boxWidth / 2, y + 9, { align: 'center' });

        // Name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLOR.darkGray);
        doc.text(item.name, boxX + boxWidth / 2, y + 16, { align: 'center' });

        // Status
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        const statusColor = isEligible ? COLOR.green : COLOR.lightGray;
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(isEligible ? '✓ Eligible' : '— N/A', boxX + boxWidth / 2, y + 23, { align: 'center' });
    });

    return y + boxHeight + 12;
}

/**
 * Draw analysis details section
 */
function drawAnalysisDetails(doc: jsPDF, y: number, deal: Deal): number {
    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.navy);
    doc.text('ANALYSIS DETAILS', PAGE.marginLeft, y);

    y += 3;
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.3);
    doc.line(PAGE.marginLeft, y, PAGE.marginLeft + 42, y);

    y += 10;

    // Details grid
    const col1X = PAGE.marginLeft;
    const col2X = PAGE.marginLeft + 55;
    const col3X = PAGE.marginLeft + 110;

    const details = [
        { label: 'Confidence Score', value: `${deal.confidence_score ?? 85}%`, x: col1X },
        { label: 'Employee Count', value: deal.employee_count?.toString() ?? '—', x: col2X },
        { label: 'Analysis Date', value: formatDate(deal.analyzed_at), x: col3X },
    ];

    doc.setFontSize(8);

    details.forEach(detail => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR.mediumGray);
        doc.text(detail.label, detail.x, y);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.darkGray);
        doc.text(detail.value, detail.x, y + 5);
    });

    return y + 16;
}

/**
 * Draw certification stamp
 */
function drawCertificationStamp(doc: jsPDF, y: number, preparedBy?: string): number {
    const stampWidth = 55;
    const stampHeight = 32;
    const stampX = PAGE.width - PAGE.marginRight - stampWidth;

    // Outer border
    doc.setDrawColor(...COLOR.blue);
    doc.setLineWidth(1.5);
    doc.roundedRect(stampX, y, stampWidth, stampHeight, 2, 2, 'S');

    // Inner border
    doc.setLineWidth(0.3);
    doc.roundedRect(stampX + 2, y + 2, stampWidth - 4, stampHeight - 4, 1, 1, 'S');

    // Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.blue);
    doc.text('VERIFIED', stampX + stampWidth / 2, y + 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...COLOR.mediumGray);
    doc.text('GrantFlow Engine v4.2', stampX + stampWidth / 2, y + 18, { align: 'center' });
    doc.text(formatDate(), stampX + stampWidth / 2, y + 23, { align: 'center' });

    if (preparedBy) {
        doc.setFontSize(5);
        doc.text(`By: ${preparedBy}`, stampX + stampWidth / 2, y + 28, { align: 'center' });
    }

    return y + stampHeight + 8;
}

/**
 * Draw watermark
 */
function drawWatermark(doc: jsPDF, text: string): void {
    doc.saveGraphicsState();

    doc.setTextColor(230, 230, 230);
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');

    // @ts-ignore - GState exists in jsPDF but types might be missing
    if (doc.GState) {
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 0.12 }));
    }

    doc.text(text, PAGE.width / 2, PAGE.height / 2, {
        angle: -45,
        align: 'center',
    });

    doc.restoreGraphicsState();
}

/**
 * Draw footer - FIXED at Y=280mm
 */
function drawFooter(doc: jsPDF): void {
    const footerY = 280;

    // Divider line
    doc.setDrawColor(...COLOR.lightGray);
    doc.setLineWidth(0.3);
    doc.line(PAGE.marginLeft, footerY - 5, PAGE.width - PAGE.marginRight, footerY - 5);

    // Legal text - 8pt font
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR.mediumGray);

    const disclaimerLines = [
        'DISCLAIMER: This report is for informational purposes only and does not constitute tax, legal, or financial advice. Credit estimates are preliminary',
        'and based on IRC Section 41 (R&D), Section 179D (Energy Efficiency), Section 127 (Education), and Section 3134 (ERC). Actual credit amounts',
        'are subject to IRS review and may vary. Consult a qualified tax professional before claiming any credits. © ' + new Date().getFullYear() + ' GrantFlow Systems, Inc.',
    ];

    disclaimerLines.forEach((line, index) => {
        doc.text(line, PAGE.width / 2, footerY + (index * 3.5), { align: 'center' });
    });

    // Page number and timestamp
    doc.setFontSize(7);
    doc.text('Page 1 of 1', PAGE.width - PAGE.marginRight, PAGE.height - 10, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE.marginLeft, PAGE.height - 10);
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Generate a professional audit report PDF
 * 
 * @param deal - Deal data to include in the report
 * @param options - Optional configuration
 * @returns jsPDF document instance
 * 
 * @example
 * ```typescript
 * const deal = {
 *   id: 123,
 *   company: 'Acme Corp',
 *   value: 150000,
 *   risk_score: 25,
 *   status: 'VERIFIED',
 *   is_rd_eligible: true,
 *   rd_credit_value: 120000,
 * };
 * 
 * const pdf = generateAuditReport(deal);
 * pdf.save('audit-report.pdf');
 * ```
 */
export function generateAuditReport(deal: Deal, options: ReportOptions = {}): jsPDF {
    const {
        preparedBy,
        reportTitle = 'ELIGIBILITY CERTIFICATE',
        caseId = generateCaseId(),
        showWatermark = true,
        watermarkText = 'CONFIDENTIAL',
    } = options;

    // Create PDF
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Draw watermark first (behind content)
    if (showWatermark) {
        drawWatermark(doc, watermarkText);
    }

    // Build report sections with proper Y tracking
    let y = drawHeader(doc, caseId);

    y = drawTitle(doc, y, reportTitle);

    y = drawClientInfo(doc, y, deal);

    y = drawDivider(doc, y);

    y = drawValueSummary(doc, y, deal);

    y = drawCreditBreakdown(doc, y, deal);

    y = drawDivider(doc, y);

    y = drawEligibilitySummary(doc, y, deal);

    y = drawDivider(doc, y);

    y = drawAnalysisDetails(doc, y, deal);

    // Certification stamp (positioned relative to current Y)
    drawCertificationStamp(doc, y - 20, preparedBy);

    // Footer - always at fixed position
    drawFooter(doc);

    return doc;
}

/**
 * Generate and download the audit report
 */
export function downloadAuditReport(
    deal: Deal,
    filename: string = 'grantflow-audit-report.pdf',
    options: ReportOptions = {}
): void {
    const doc = generateAuditReport(deal, options);
    doc.save(filename);
}

/**
 * Generate report as Blob
 */
export function generateAuditReportBlob(deal: Deal, options: ReportOptions = {}): Blob {
    const doc = generateAuditReport(deal, options);
    return doc.output('blob');
}

/**
 * Generate report as base64 data URI
 */
export function generateAuditReportBase64(deal: Deal, options: ReportOptions = {}): string {
    const doc = generateAuditReport(deal, options);
    return doc.output('datauristring');
}

/**
 * Preview report in new browser tab
 */
export function previewAuditReport(deal: Deal, options: ReportOptions = {}): void {
    const doc = generateAuditReport(deal, options);
    const blobUrl = URL.createObjectURL(doc.output('blob'));
    window.open(blobUrl, '_blank');
}

// Default export
export default generateAuditReport;
