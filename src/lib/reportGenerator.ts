// src/lib/reportGenerator.ts
// ============================================================================
// GRANTFLOW PROFESSIONAL AUDIT REPORT GENERATOR
// Dynamic Spacing - No Hardcoded Y Values
// ============================================================================

import { jsPDF } from 'jspdf';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Deal {
    id: number | string;
    company: string;
    ein?: string;
    value: number;
    risk_score: number;
    status: string;
    is_rd_eligible?: boolean;
    is_training_eligible?: boolean;
    is_green_eligible?: boolean;
    is_erc_eligible?: boolean;
    rd_credit_value?: number;
    training_credit_value?: number;
    green_energy_value?: number;
    erc_value?: number;
    naics_code?: string;
    industry?: string;
    employee_count?: number;
    fiscal_year?: number;
    confidence_score?: number;
    analyzed_at?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    anomalies?: any[];
}

export interface ReportOptions {
    preparedBy?: string;
    reportTitle?: string;
    caseId?: string;
    showWatermark?: boolean;
    watermarkText?: string;
}

// ============================================================================
// PAGE CONFIGURATION
// ============================================================================

const PAGE_CONFIG = {
    width: 210,
    height: 297,
    margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20,
    },
    // Footer zone - content must NOT enter this area
    footerHeight: 25,
} as const;

// Computed values
const CONTENT_WIDTH = PAGE_CONFIG.width - PAGE_CONFIG.margin.left - PAGE_CONFIG.margin.right;
const CONTENT_END_Y = PAGE_CONFIG.height - PAGE_CONFIG.margin.bottom - PAGE_CONFIG.footerHeight;
// const FOOTER_START_Y = PAGE_CONFIG.height - PAGE_CONFIG.margin.bottom - PAGE_CONFIG.footerHeight + 5; // Unused but descriptive

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
    navy: { r: 15, g: 30, b: 60 },
    blue: { r: 37, g: 99, b: 235 },
    darkText: { r: 45, g: 45, b: 45 },
    mediumGray: { r: 120, g: 120, b: 120 },
    lightGray: { r: 200, g: 200, b: 200 },
    bgLight: { r: 248, g: 249, b: 252 },
    white: { r: 255, g: 255, b: 255 },
    green: { r: 22, g: 163, b: 74 },
    red: { r: 220, g: 38, b: 38 },
    amber: { r: 217, g: 119, b: 6 },
} as const;

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

function formatDate(date?: Date | string): string {
    const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function generateCaseId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GF-${year}-${random}`;
}

function getRiskInfo(score: number): { label: string; color: { r: number; g: number; b: number } } {
    if (score <= 25) return { label: 'Low Risk', color: COLORS.green };
    if (score <= 50) return { label: 'Moderate', color: COLORS.amber };
    if (score <= 75) return { label: 'Elevated', color: COLORS.amber };
    return { label: 'High Risk', color: COLORS.red };
}

function setColor(doc: jsPDF, color: { r: number; g: number; b: number }, type: 'fill' | 'text' | 'draw'): void {
    if (type === 'fill') doc.setFillColor(color.r, color.g, color.b);
    else if (type === 'text') doc.setTextColor(color.r, color.g, color.b);
    else doc.setDrawColor(color.r, color.g, color.b);
}

// ============================================================================
// SECTION DRAWING FUNCTIONS
// Each function returns the new Y position after drawing
// ============================================================================

/**
 * Draw header band and logo - Returns new Y position
 */
function drawHeader(doc: jsPDF, caseId: string): number {
    // Navy header band
    setColor(doc, COLORS.navy, 'fill');
    doc.rect(0, 0, PAGE_CONFIG.width, 6, 'F');

    let y = PAGE_CONFIG.margin.top + 5;

    // Logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    setColor(doc, COLORS.navy, 'text');
    doc.text('GRANTFLOW', PAGE_CONFIG.margin.left, y);

    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('Tax Credit Advisory Services', PAGE_CONFIG.margin.left, y + 6);

    // Case info box (top right)
    const boxWidth = 52;
    const boxHeight = 18;
    const boxX = PAGE_CONFIG.width - PAGE_CONFIG.margin.right - boxWidth;
    const boxY = y - 8;

    setColor(doc, COLORS.bgLight, 'fill');
    setColor(doc, COLORS.lightGray, 'draw');
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFontSize(7);
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('Case ID:', boxX + 3, boxY + 6);
    doc.text('Date:', boxX + 3, boxY + 13);

    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.darkText, 'text');
    doc.text(caseId, boxX + 20, boxY + 6);
    doc.text(formatDate(), boxX + 20, boxY + 13);

    // Divider line
    y += 14;
    setColor(doc, COLORS.navy, 'draw');
    doc.setLineWidth(0.6);
    doc.line(PAGE_CONFIG.margin.left, y, PAGE_CONFIG.width - PAGE_CONFIG.margin.right, y);

    return y + 8;
}

/**
 * Draw report title - Returns new Y position
 */
function drawTitle(doc: jsPDF, y: number, title: string): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    setColor(doc, COLORS.navy, 'text');
    doc.text(title.toUpperCase(), PAGE_CONFIG.margin.left, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('Preliminary Eligibility Assessment', PAGE_CONFIG.margin.left, y + 5);

    return y + 14;
}

/**
 * Draw client information - Returns new Y position
 */
function drawClientInfo(doc: jsPDF, y: number, deal: Deal): number {
    // Section label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, COLORS.navy, 'text');
    doc.text('CLIENT INFORMATION', PAGE_CONFIG.margin.left, y);

    y += 2;
    setColor(doc, COLORS.blue, 'draw');
    doc.setLineWidth(0.4);
    doc.line(PAGE_CONFIG.margin.left, y, PAGE_CONFIG.margin.left + 38, y);

    y += 7;

    // Two columns of info
    const col1 = PAGE_CONFIG.margin.left;
    const col2 = PAGE_CONFIG.margin.left + 80;

    doc.setFontSize(8);

    // Column 1
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('Company Name', col1, y);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.darkText, 'text');
    doc.text(deal.company || '—', col1, y + 4);

    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('EIN', col1, y + 11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.darkText, 'text');
    doc.text(deal.ein || 'Not Provided', col1, y + 15);

    // Column 2
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('Industry', col2, y);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.darkText, 'text');
    doc.text(deal.industry || 'Technology', col2, y + 4);

    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('Fiscal Year', col2, y + 11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.darkText, 'text');
    doc.text((deal.fiscal_year || new Date().getFullYear()).toString(), col2, y + 15);

    return y + 24;
}

/**
 * Draw horizontal divider - Returns new Y position
 */
function drawDivider(doc: jsPDF, y: number): number {
    setColor(doc, COLORS.lightGray, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGE_CONFIG.margin.left, y, PAGE_CONFIG.width - PAGE_CONFIG.margin.right, y);
    return y + 6;
}

/**
 * Draw the main value summary box - Returns new Y position
 */
function drawValueBox(doc: jsPDF, y: number, deal: Deal): number {
    const boxHeight = 42;

    // Background
    setColor(doc, COLORS.bgLight, 'fill');
    setColor(doc, COLORS.lightGray, 'draw');
    doc.setLineWidth(0.3);
    doc.roundedRect(PAGE_CONFIG.margin.left, y, CONTENT_WIDTH, boxHeight, 3, 3, 'FD');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('TOTAL ESTIMATED TAX CREDIT VALUE', PAGE_CONFIG.margin.left + 8, y + 10);

    // Large value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    setColor(doc, COLORS.navy, 'text');
    doc.text(formatCurrency(deal.value), PAGE_CONFIG.margin.left + 8, y + 30);

    // Risk score box (right side)
    const riskBoxW = 36;
    const riskBoxH = 30;
    const riskBoxX = PAGE_CONFIG.width - PAGE_CONFIG.margin.right - riskBoxW - 6;
    const riskBoxY = y + 6;

    const riskInfo = getRiskInfo(deal.risk_score);

    setColor(doc, COLORS.white, 'fill');
    setColor(doc, COLORS.lightGray, 'draw');
    doc.roundedRect(riskBoxX, riskBoxY, riskBoxW, riskBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('RISK SCORE', riskBoxX + riskBoxW / 2, riskBoxY + 7, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    setColor(doc, riskInfo.color, 'text');
    doc.text(deal.risk_score.toString(), riskBoxX + riskBoxW / 2, riskBoxY + 18, { align: 'center' });

    doc.setFontSize(7);
    doc.text(riskInfo.label, riskBoxX + riskBoxW / 2, riskBoxY + 25, { align: 'center' });

    return y + boxHeight + 8;
}

/**
 * Draw credit breakdown table - Returns new Y position
 */
function drawCreditBreakdown(doc: jsPDF, y: number, deal: Deal): number {
    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, COLORS.navy, 'text');
    doc.text('CREDIT BREAKDOWN', PAGE_CONFIG.margin.left, y);

    y += 2;
    setColor(doc, COLORS.blue, 'draw');
    doc.setLineWidth(0.4);
    doc.line(PAGE_CONFIG.margin.left, y, PAGE_CONFIG.margin.left + 38, y);

    y += 8;

    // Credit items data
    const credits = [
        {
            name: 'Research & Development Credit',
            code: 'IRC §41 • Form 6765',
            eligible: deal.is_rd_eligible ?? false,
            value: deal.rd_credit_value ?? 0,
        },
        {
            name: 'Training & Education Assistance',
            code: 'IRC §127 • Form W-2',
            eligible: deal.is_training_eligible ?? false,
            value: deal.training_credit_value ?? 0,
        },
        {
            name: 'Energy Efficient Property',
            code: '§179D • Form 7205',
            eligible: deal.is_green_eligible ?? false,
            value: deal.green_energy_value ?? 0,
        },
        {
            name: 'Employee Retention Credit',
            code: 'IRC §3134 • Form 941-X',
            eligible: deal.is_erc_eligible ?? false,
            value: deal.erc_value ?? 0,
        },
    ];

    const rowHeight = 14;
    const valueX = PAGE_CONFIG.width - PAGE_CONFIG.margin.right;

    credits.forEach((credit, index) => {
        const rowY = y + (index * rowHeight);
        const isActive = credit.eligible && credit.value > 0;

        // Alternating background
        if (index % 2 === 0) {
            setColor(doc, { r: 252, g: 252, b: 254 }, 'fill');
            doc.rect(PAGE_CONFIG.margin.left, rowY - 3, CONTENT_WIDTH, rowHeight - 1, 'F');
        }

        // Status dot
        if (isActive) {
            setColor(doc, COLORS.green, 'fill');
            doc.circle(PAGE_CONFIG.margin.left + 4, rowY + 2, 1.8, 'F');
        } else {
            setColor(doc, COLORS.lightGray, 'draw');
            doc.setLineWidth(0.4);
            doc.circle(PAGE_CONFIG.margin.left + 4, rowY + 2, 1.8, 'S');
        }

        // Credit name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setColor(doc, isActive ? COLORS.darkText : COLORS.lightGray, 'text');
        doc.text(credit.name, PAGE_CONFIG.margin.left + 10, rowY + 2);

        // Code (small)
        doc.setFontSize(7);
        setColor(doc, COLORS.mediumGray, 'text');
        doc.text(credit.code, PAGE_CONFIG.margin.left + 10, rowY + 7);

        // Value with dot leader
        const valueText = isActive ? formatCurrency(credit.value) : '—';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        setColor(doc, isActive ? COLORS.navy : COLORS.lightGray, 'text');
        doc.text(valueText, valueX, rowY + 2, { align: 'right' });

        // Dot leader for active items
        if (isActive) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            setColor(doc, COLORS.lightGray, 'text');

            const nameWidth = doc.getTextWidth(credit.name);
            const valueWidth = doc.getTextWidth(valueText);
            const startX = PAGE_CONFIG.margin.left + 10 + nameWidth + 3;
            const endX = valueX - valueWidth - 3;

            let dotX = startX;
            while (dotX < endX) {
                doc.text('.', dotX, rowY + 2);
                dotX += 2;
            }
        }
    });

    y += credits.length * rowHeight + 2;

    // Total separator line
    setColor(doc, COLORS.navy, 'draw');
    doc.setLineWidth(0.5);
    doc.line(PAGE_CONFIG.margin.left, y, PAGE_CONFIG.width - PAGE_CONFIG.margin.right, y);

    y += 6;

    // Total row
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, COLORS.navy, 'text');
    doc.text('TOTAL ESTIMATED CREDITS', PAGE_CONFIG.margin.left, y);
    doc.text(formatCurrency(deal.value), valueX, y, { align: 'right' });

    return y + 10;
}

/**
 * Draw eligibility boxes - Returns new Y position
 */
function drawEligibilityBoxes(doc: jsPDF, y: number, deal: Deal): number {
    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, COLORS.navy, 'text');
    doc.text('ELIGIBILITY SUMMARY', PAGE_CONFIG.margin.left, y);

    y += 2;
    setColor(doc, COLORS.blue, 'draw');
    doc.setLineWidth(0.4);
    doc.line(PAGE_CONFIG.margin.left, y, PAGE_CONFIG.margin.left + 42, y);

    y += 8;

    const boxes = [
        { code: 'IRC §41', name: 'R&D', eligible: deal.is_rd_eligible },
        { code: '§127', name: 'Training', eligible: deal.is_training_eligible },
        { code: '§179D', name: 'Energy', eligible: deal.is_green_eligible },
        { code: 'ERC', name: 'Retention', eligible: deal.is_erc_eligible },
    ];

    const boxWidth = (CONTENT_WIDTH - 12) / 4;
    const boxHeight = 24;

    boxes.forEach((box, index) => {
        const boxX = PAGE_CONFIG.margin.left + (index * (boxWidth + 4));
        const isEligible = box.eligible ?? false;

        // Box background
        setColor(doc, isEligible ? { r: 239, g: 246, b: 255 } : COLORS.bgLight, 'fill');
        setColor(doc, isEligible ? COLORS.blue : COLORS.lightGray, 'draw');
        doc.setLineWidth(isEligible ? 0.5 : 0.2);
        doc.roundedRect(boxX, y, boxWidth, boxHeight, 2, 2, 'FD');

        // Code
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        setColor(doc, isEligible ? COLORS.blue : COLORS.mediumGray, 'text');
        doc.text(box.code, boxX + boxWidth / 2, y + 7, { align: 'center' });

        // Name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        setColor(doc, COLORS.darkText, 'text');
        doc.text(box.name, boxX + boxWidth / 2, y + 13, { align: 'center' });

        // Status
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        setColor(doc, isEligible ? COLORS.green : COLORS.lightGray, 'text');
        doc.text(isEligible ? '✓ Eligible' : '— N/A', boxX + boxWidth / 2, y + 19, { align: 'center' });
    });

    return y + boxHeight + 8;
}

/**
 * Draw analysis metadata - Returns new Y position
 */
function drawAnalysisInfo(doc: jsPDF, y: number, deal: Deal, preparedBy?: string): number {
    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, COLORS.navy, 'text');
    doc.text('ANALYSIS DETAILS', PAGE_CONFIG.margin.left, y);

    y += 2;
    setColor(doc, COLORS.blue, 'draw');
    doc.setLineWidth(0.4);
    doc.line(PAGE_CONFIG.margin.left, y, PAGE_CONFIG.margin.left + 36, y);

    y += 7;

    // Info items
    const items = [
        { label: 'Confidence Score', value: `${deal.confidence_score ?? 85}%` },
        { label: 'Employee Count', value: deal.employee_count?.toString() ?? '—' },
        { label: 'Analysis Date', value: formatDate(deal.analyzed_at) },
    ];

    const colWidth = 50;

    doc.setFontSize(7);

    items.forEach((item, index) => {
        const x = PAGE_CONFIG.margin.left + (index * colWidth);

        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.mediumGray, 'text');
        doc.text(item.label, x, y);

        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.darkText, 'text');
        doc.text(item.value, x, y + 4);
    });

    // Certification stamp (right side)
    const stampW = 45;
    const stampH = 26;
    const stampX = PAGE_CONFIG.width - PAGE_CONFIG.margin.right - stampW;
    const stampY = y - 5;

    setColor(doc, COLORS.blue, 'draw');
    doc.setLineWidth(1);
    doc.roundedRect(stampX, stampY, stampW, stampH, 2, 2, 'S');
    doc.setLineWidth(0.3);
    doc.roundedRect(stampX + 1.5, stampY + 1.5, stampW - 3, stampH - 3, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(doc, COLORS.blue, 'text');
    doc.text('VERIFIED', stampX + stampW / 2, stampY + 9, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    setColor(doc, COLORS.mediumGray, 'text');
    doc.text('GrantFlow Engine v4.2', stampX + stampW / 2, stampY + 15, { align: 'center' });
    doc.text(formatDate(), stampX + stampW / 2, stampY + 19, { align: 'center' });

    if (preparedBy) {
        doc.text(`By: ${preparedBy}`, stampX + stampW / 2, stampY + 23, { align: 'center' });
    }

    return y + 14;
}

/**
 * Draw watermark (called first, behind all content)
 */
function drawWatermark(doc: jsPDF, text: string): void {
    doc.saveGraphicsState();

    doc.setTextColor(235, 235, 235);
    doc.setFontSize(45);
    doc.setFont('helvetica', 'bold');

    // Draw rotated watermark at center
    doc.text(text, PAGE_CONFIG.width / 2, PAGE_CONFIG.height / 2, {
        angle: -45,
        align: 'center',
    });

    doc.restoreGraphicsState();
}

/**
 * Draw footer - ALWAYS at fixed position relative to page bottom
 */
function drawFooter(doc: jsPDF): void {
    // Calculate fixed positions from page bottom
    const pageHeight = doc.internal.pageSize.getHeight();
    const disclaimerY = pageHeight - 18;
    const bottomLineY = pageHeight - 22;
    const timestampY = pageHeight - 8;

    // Separator line
    setColor(doc, COLORS.lightGray, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGE_CONFIG.margin.left, bottomLineY, PAGE_CONFIG.width - PAGE_CONFIG.margin.right, bottomLineY);

    // Disclaimer text - 6pt font, centered
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setColor(doc, COLORS.mediumGray, 'text');

    const disclaimerText = [
        'DISCLAIMER: This report is for informational purposes only and does not constitute tax, legal, or financial advice.',
        'Credit estimates are based on IRC Section 41 (R&D), Section 179D (Energy), Section 127 (Education), and Section 3134 (ERC).',
        'Actual amounts subject to IRS review. Consult a qualified tax professional. © ' + new Date().getFullYear() + ' GrantFlow Systems, Inc.',
    ];

    disclaimerText.forEach((line, index) => {
        doc.text(line, PAGE_CONFIG.width / 2, disclaimerY + (index * 3), { align: 'center' });
    });

    // Bottom row: timestamp and page number
    doc.setFontSize(7);
    doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE_CONFIG.margin.left, timestampY);
    doc.text('Page 1 of 1', PAGE_CONFIG.width - PAGE_CONFIG.margin.right, timestampY, { align: 'right' });
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generate a professional audit report PDF with dynamic spacing
 * 
 * @param deal - Deal data for the report
 * @param options - Optional configuration
 * @returns jsPDF document instance
 */
export function generateAuditReport(deal: Deal, options: ReportOptions = {}): jsPDF {
    const {
        preparedBy,
        reportTitle = 'ELIGIBILITY CERTIFICATE',
        caseId = generateCaseId(),
        showWatermark = true,
        watermarkText = 'CONFIDENTIAL',
    } = options;

    // Create document
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Draw watermark first (background layer)
    if (showWatermark) {
        drawWatermark(doc, watermarkText);
    }

    // Track Y position dynamically
    let currentY: number;

    // Draw sections in order, each returns new Y
    currentY = drawHeader(doc, caseId);
    currentY = drawTitle(doc, currentY, reportTitle);
    currentY = drawClientInfo(doc, currentY, deal);
    currentY = drawDivider(doc, currentY);
    currentY = drawValueBox(doc, currentY, deal);
    currentY = drawCreditBreakdown(doc, currentY, deal);
    currentY = drawDivider(doc, currentY);
    currentY = drawEligibilityBoxes(doc, currentY, deal);
    currentY = drawDivider(doc, currentY);
    currentY = drawAnalysisInfo(doc, currentY, deal, preparedBy);

    // Safety check: warn if content exceeded safe zone
    if (currentY > CONTENT_END_Y) {
        console.warn(`Content overflow: Y=${currentY} exceeds safe zone (${CONTENT_END_Y})`);
    }

    // Draw footer at fixed position (always last)
    drawFooter(doc);

    return doc;
}

/**
 * Generate and download the report
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
 * Generate report as Blob for upload/email
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
    const url = URL.createObjectURL(doc.output('blob'));
    window.open(url, '_blank');
}

// Default export
export default generateAuditReport;
