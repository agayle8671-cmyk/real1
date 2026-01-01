// src/lib/reportGenerator.ts
// ============================================================================
// GRANTFLOW FORENSIC AUDIT REPORT GENERATOR
// Professional PDF Certificate Generation
// ============================================================================

import { jsPDF } from 'jspdf';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Deal information for report generation */
export interface Deal {
    id: number | string;
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
    anomalies?: AnomalyItem[];
    verification_sources?: string[];
    created_at?: string;
    analyzed_at?: string;
}

/** Anomaly item for risk section */
export interface AnomalyItem {
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
}

/** Report generation options */
export interface ReportOptions {
    /** Include detailed breakdown section */
    includeBreakdown?: boolean;

    /** Include risk analysis section */
    includeRiskAnalysis?: boolean;

    /** Include legal disclaimers */
    includeLegalDisclaimer?: boolean;

    /** Include verification sources */
    includeVerificationSources?: boolean;

    /** Custom report title */
    reportTitle?: string;

    /** Preparer name */
    preparedBy?: string;

    /** Report reference number */
    referenceNumber?: string;

    /** Watermark text (default: "CONFIDENTIAL") */
    watermarkText?: string;

    /** Show watermark */
    showWatermark?: boolean;
}

/** Color definitions */
interface ColorRGB {
    r: number;
    g: number;
    b: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS: Record<string, ColorRGB> = {
    darkBlue: { r: 15, g: 35, b: 75 },
    mediumBlue: { r: 37, g: 99, b: 235 },
    lightBlue: { r: 219, g: 234, b: 254 },
    darkGray: { r: 55, g: 65, b: 81 },
    mediumGray: { r: 107, g: 114, b: 128 },
    lightGray: { r: 229, g: 231, b: 235 },
    veryLightGray: { r: 243, g: 244, b: 246 },
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    green: { r: 16, g: 185, b: 129 },
    darkGreen: { r: 6, g: 95, b: 70 },
    red: { r: 239, g: 68, b: 68 },
    amber: { r: 245, g: 158, b: 11 },
    watermark: { r: 200, g: 200, b: 200 },
};

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format date for display
 */
function formatDate(date: Date | string = new Date()): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format date and time
 */
function formatDateTime(date: Date | string = new Date()): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
}

/**
 * Get risk level label and color
 */
function getRiskLevel(score: number): { label: string; color: ColorRGB } {
    if (score <= 25) return { label: 'LOW RISK', color: COLORS.green };
    if (score <= 50) return { label: 'MODERATE RISK', color: COLORS.amber };
    if (score <= 75) return { label: 'ELEVATED RISK', color: COLORS.amber };
    return { label: 'HIGH RISK', color: COLORS.red };
}

/**
 * Generate reference number if not provided
 */
function generateReferenceNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GF-${timestamp}-${random}`;
}

/**
 * Set PDF fill color from RGB object
 */
function setFillColor(doc: jsPDF, color: ColorRGB): void {
    doc.setFillColor(color.r, color.g, color.b);
}

/**
 * Set PDF text color from RGB object
 */
function setTextColor(doc: jsPDF, color: ColorRGB): void {
    doc.setTextColor(color.r, color.g, color.b);
}

/**
 * Set PDF draw color from RGB object
 */
function setDrawColor(doc: jsPDF, color: ColorRGB): void {
    doc.setDrawColor(color.r, color.g, color.b);
}

// ============================================================================
// PDF DRAWING FUNCTIONS
// ============================================================================

/**
 * Draw diagonal watermark across the page
 */
function drawWatermark(doc: jsPDF, text: string = 'CONFIDENTIAL'): void {
    doc.saveGraphicsState();

    // Set watermark style
    setTextColor(doc, COLORS.watermark);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');

    // Calculate center position
    const centerX = PAGE_WIDTH / 2;
    const centerY = PAGE_HEIGHT / 2;

    // Rotate and draw text
    // jsPDF text rotation: we need to translate and rotate
    const angle = -45; // Diagonal angle
    // radians removed as unused

    // Use transformation matrix for rotation
    // @ts-ignore - GState constructor type definition mismatch
    doc.setGState(new doc.GState({ opacity: 0.15 }));

    // Draw rotated text
    doc.text(text, centerX, centerY, {
        angle: angle,
        align: 'center',
        baseline: 'middle',
    });

    doc.restoreGraphicsState();
}

/**
 * Draw the report header
 */
function drawHeader(doc: jsPDF, title: string): number {
    // yPos removed as unused - fixed header height

    // Header background
    setFillColor(doc, COLORS.darkBlue);
    doc.rect(0, 0, PAGE_WIDTH, 45, 'F');

    // Logo placeholder (geometric shape)
    setFillColor(doc, COLORS.mediumBlue);
    doc.rect(MARGIN, 12, 8, 20, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(MARGIN + 2, 16, 4, 4, 'F');
    doc.rect(MARGIN + 2, 24, 4, 4, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setTextColor(doc, COLORS.white);
    doc.text('GRANTFLOW', MARGIN + 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, { r: 148, g: 163, b: 184 });
    doc.text('FORENSIC AUDIT REPORT', MARGIN + 14, 30);

    // Report title on right side
    doc.setFontSize(9);
    setTextColor(doc, { r: 148, g: 163, b: 184 });
    doc.text(title.toUpperCase(), PAGE_WIDTH - MARGIN, 22, { align: 'right' });

    // Date
    doc.setFontSize(8);
    doc.text(formatDate(), PAGE_WIDTH - MARGIN, 30, { align: 'right' });

    return 55;
}

/**
 * Draw client information section
 */
function drawClientInfo(doc: jsPDF, deal: Deal, yStart: number, referenceNumber: string): number {
    let yPos = yStart;

    // Section background
    setFillColor(doc, COLORS.veryLightGray);
    doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 45, 3, 3, 'F');

    yPos += 8;

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setTextColor(doc, COLORS.mediumGray);
    doc.text('CLIENT INFORMATION', MARGIN + 8, yPos);

    yPos += 8;

    // Client details - two columns
    const col1X = MARGIN + 8;
    const col2X = MARGIN + CONTENT_WIDTH / 2;

    // Column 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setTextColor(doc, COLORS.mediumGray);
    doc.text('Client Name', col1X, yPos);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, COLORS.darkGray);
    doc.text(deal.company || 'N/A', col1X, yPos + 5);

    doc.setFont('helvetica', 'normal');
    setTextColor(doc, COLORS.mediumGray);
    doc.text('EIN', col1X, yPos + 15);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, COLORS.darkGray);
    doc.text(deal.ein || 'Not Provided', col1X, yPos + 20);

    // Column 2
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, COLORS.mediumGray);
    doc.text('Reference Number', col2X, yPos);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, COLORS.darkGray);
    doc.text(referenceNumber, col2X, yPos + 5);

    doc.setFont('helvetica', 'normal');
    setTextColor(doc, COLORS.mediumGray);
    doc.text('Audit Date', col2X, yPos + 15);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, COLORS.darkGray);
    doc.text(formatDate(deal.analyzed_at), col2X, yPos + 20);

    return yStart + 55;
}

/**
 * Draw the main value display
 */
function drawValueSection(doc: jsPDF, deal: Deal, yStart: number): number {
    let yPos = yStart;

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(doc, COLORS.darkBlue);
    doc.text('ESTIMATED TAX CREDIT VALUE', MARGIN, yPos);

    yPos += 5;

    // Underline
    setDrawColor(doc, COLORS.mediumBlue);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, yPos, MARGIN + 60, yPos);

    yPos += 15;

    // Large value display
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(42);
    setTextColor(doc, COLORS.darkBlue);
    doc.text(formatCurrency(deal.value), MARGIN, yPos);

    yPos += 8;

    // Confidence indicator
    const confidence = deal.confidence_score || 85;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setTextColor(doc, COLORS.mediumGray);
    doc.text(`Confidence Score: ${confidence}%`, MARGIN, yPos);

    // Confidence bar
    const barWidth = 60;
    const barHeight = 4;
    const barX = MARGIN + 45;
    const barY = yPos - 3;

    setFillColor(doc, COLORS.lightGray);
    doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');

    setFillColor(doc, COLORS.green);
    doc.roundedRect(barX, barY, barWidth * (confidence / 100), barHeight, 2, 2, 'F');

    return yPos + 15;
}

/**
 * Draw risk score section
 */
function drawRiskSection(doc: jsPDF, deal: Deal, yStart: number): number {
    let yPos = yStart;

    const { label, color } = getRiskLevel(deal.risk_score);

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(doc, COLORS.darkBlue);
    doc.text('RISK ASSESSMENT', MARGIN, yPos);

    yPos += 5;

    setDrawColor(doc, COLORS.mediumBlue);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, yPos, MARGIN + 40, yPos);

    yPos += 12;

    // Risk score box
    setFillColor(doc, color);
    doc.roundedRect(MARGIN, yPos - 6, 60, 25, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    setTextColor(doc, COLORS.white);
    doc.text(`${deal.risk_score}`, MARGIN + 8, yPos + 8);

    doc.setFontSize(8);
    doc.text(label, MARGIN + 28, yPos + 8);

    // Risk scale
    yPos += 25;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTextColor(doc, COLORS.mediumGray);
    doc.text('Risk Scale: 0 (Minimal) — 100 (Critical)', MARGIN, yPos);

    // Anomalies count if available
    if (deal.anomalies && deal.anomalies.length > 0) {
        yPos += 10;
        doc.setFontSize(8);
        doc.text(`${deal.anomalies.length} anomalies detected during analysis`, MARGIN, yPos);
    }

    return yPos + 10;
}

/**
 * Draw credit breakdown section
 */
function drawBreakdownSection(doc: jsPDF, deal: Deal, yStart: number): number {
    let yPos = yStart;

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(doc, COLORS.darkBlue);
    doc.text('CREDIT BREAKDOWN', MARGIN, yPos);

    yPos += 5;

    setDrawColor(doc, COLORS.mediumBlue);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, yPos, MARGIN + 45, yPos);

    yPos += 10;

    // Credit items
    const credits = [
        {
            name: 'R&D Tax Credit (IRC §41)',
            eligible: deal.is_rd_eligible,
            value: deal.rd_credit_value || 0,
        },
        {
            name: 'Training & Education Credit',
            eligible: deal.is_training_eligible,
            value: deal.training_credit_value || 0,
        },
        {
            name: 'Energy Efficiency (§179D)',
            eligible: deal.is_green_eligible,
            value: deal.green_energy_value || 0,
        },
        {
            name: 'Employee Retention Credit',
            eligible: deal.is_erc_eligible,
            value: deal.erc_value || 0,
        },
    ];

    credits.forEach((credit, index) => {
        const rowY = yPos + (index * 12);

        // Background for alternating rows
        if (index % 2 === 0) {
            setFillColor(doc, COLORS.veryLightGray);
            doc.rect(MARGIN, rowY - 4, CONTENT_WIDTH, 11, 'F');
        }

        // Status indicator
        if (credit.eligible) {
            setFillColor(doc, COLORS.green);
            doc.circle(MARGIN + 4, rowY, 2, 'F');
        } else {
            setFillColor(doc, COLORS.lightGray);
            doc.circle(MARGIN + 4, rowY, 2, 'F');
        }

        // Credit name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setTextColor(doc, credit.eligible ? COLORS.darkGray : COLORS.mediumGray);
        doc.text(credit.name, MARGIN + 10, rowY + 1);

        // Value
        doc.setFont('helvetica', 'bold');
        setTextColor(doc, credit.eligible ? COLORS.darkGreen : COLORS.mediumGray);
        const valueText = credit.eligible ? formatCurrency(credit.value) : 'Not Eligible';
        doc.text(valueText, PAGE_WIDTH - MARGIN - 5, rowY + 1, { align: 'right' });
    });

    yPos += (credits.length * 12) + 5;

    // Total line
    setDrawColor(doc, COLORS.darkGray);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);

    yPos += 8;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setTextColor(doc, COLORS.darkBlue);
    doc.text('TOTAL ESTIMATED VALUE', MARGIN, yPos);
    doc.text(formatCurrency(deal.value), PAGE_WIDTH - MARGIN - 5, yPos, { align: 'right' });

    return yPos + 15;
}

/**
 * Draw eligibility summary section
 */
function drawEligibilitySummary(doc: jsPDF, deal: Deal, yStart: number): number {
    let yPos = yStart;

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(doc, COLORS.darkBlue);
    doc.text('ELIGIBILITY SUMMARY', MARGIN, yPos);

    yPos += 5;

    setDrawColor(doc, COLORS.mediumBlue);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, yPos, MARGIN + 50, yPos);

    yPos += 12;

    // Eligibility boxes
    const eligibilities = [
        { code: 'IRC §41', name: 'R&D Credit', eligible: deal.is_rd_eligible },
        { code: '§127', name: 'Training', eligible: deal.is_training_eligible },
        { code: '§179D', name: 'Energy', eligible: deal.is_green_eligible },
        { code: 'ERC', name: 'Retention', eligible: deal.is_erc_eligible },
    ];

    const boxWidth = (CONTENT_WIDTH - 15) / 4;
    const boxHeight = 30;

    eligibilities.forEach((item, index) => {
        const boxX = MARGIN + (index * (boxWidth + 5));

        // Box background
        setFillColor(doc, item.eligible ? COLORS.lightBlue : COLORS.veryLightGray);
        doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 2, 2, 'F');

        // Border
        setDrawColor(doc, item.eligible ? COLORS.mediumBlue : COLORS.lightGray);
        doc.setLineWidth(0.5);
        doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 2, 2, 'S');

        // Code
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        setTextColor(doc, item.eligible ? COLORS.mediumBlue : COLORS.mediumGray);
        doc.text(item.code, boxX + boxWidth / 2, yPos + 10, { align: 'center' });

        // Name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setTextColor(doc, COLORS.darkGray);
        doc.text(item.name, boxX + boxWidth / 2, yPos + 17, { align: 'center' });

        // Status
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        setTextColor(doc, item.eligible ? COLORS.green : COLORS.mediumGray);
        doc.text(item.eligible ? '✓ ELIGIBLE' : '— N/A', boxX + boxWidth / 2, yPos + 24, { align: 'center' });
    });

    return yPos + boxHeight + 10;
}

/**
 * Draw legal footer
 */
function drawLegalFooter(doc: jsPDF): void {
    const footerY = PAGE_HEIGHT - 35;

    // Footer line
    setDrawColor(doc, COLORS.lightGray);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY);

    // Legal text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTextColor(doc, COLORS.mediumGray);

    const legalText = [
        'This report is provided for informational purposes only and does not constitute tax or legal advice.',
        'Credit estimates are based on IRC Section 41 (Research & Development), Section 179D (Energy Efficient Commercial Buildings),',
        'Section 45L (Energy Efficient Homes), and related Treasury Regulations. Final credit amounts are subject to IRS review.',
        'Consult a qualified tax professional before claiming any credits. © ' + new Date().getFullYear() + ' GrantFlow Systems, Inc.',
    ];

    legalText.forEach((line, index) => {
        doc.text(line, PAGE_WIDTH / 2, footerY + 6 + (index * 4), { align: 'center' });
    });

    // Page number
    doc.setFontSize(8);
    doc.text('Page 1 of 1', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });

    // Timestamp
    doc.text(`Generated: ${formatDateTime()}`, MARGIN, PAGE_HEIGHT - 10);
}

/**
 * Draw verification sources section
 */
function drawVerificationSources(doc: jsPDF, deal: Deal, yStart: number): number {
    if (!deal.verification_sources || deal.verification_sources.length === 0) {
        return yStart;
    }

    let yPos = yStart;

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextColor(doc, COLORS.darkBlue);
    doc.text('VERIFICATION SOURCES', MARGIN, yPos);

    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setTextColor(doc, COLORS.mediumGray);

    deal.verification_sources.forEach((source, index) => {
        doc.text(`• ${source}`, MARGIN + 5, yPos + (index * 5));
    });

    return yPos + (deal.verification_sources.length * 5) + 5;
}

/**
 * Draw certification stamp
 */
function drawCertificationStamp(doc: jsPDF, yStart: number, preparedBy?: string): number {
    let yPos = yStart;

    // Stamp box
    const stampWidth = 70;
    const stampHeight = 35;
    const stampX = PAGE_WIDTH - MARGIN - stampWidth;

    setDrawColor(doc, COLORS.mediumBlue);
    doc.setLineWidth(1);
    doc.roundedRect(stampX, yPos, stampWidth, stampHeight, 3, 3, 'S');

    // Inner border
    doc.setLineWidth(0.3);
    doc.roundedRect(stampX + 2, yPos + 2, stampWidth - 4, stampHeight - 4, 2, 2, 'S');

    // Stamp text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setTextColor(doc, COLORS.mediumBlue);
    doc.text('CERTIFIED', stampX + stampWidth / 2, yPos + 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setTextColor(doc, COLORS.mediumGray);
    doc.text('GrantFlow Forensic Engine', stampX + stampWidth / 2, yPos + 18, { align: 'center' });
    doc.text(`v4.2.1 • ${formatDate()}`, stampX + stampWidth / 2, yPos + 23, { align: 'center' });

    if (preparedBy) {
        doc.text(`Prepared by: ${preparedBy}`, stampX + stampWidth / 2, yPos + 28, { align: 'center' });
    }

    return yPos + stampHeight + 10;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generate a professional audit report PDF
 * 
 * @param deal - Deal data to include in the report
 * @param options - Optional configuration for report generation
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
export function generateAuditReport(
    deal: Deal,
    options: ReportOptions = {}
): jsPDF {
    // Default options
    const {
        includeBreakdown = true,
        includeRiskAnalysis = true,
        includeLegalDisclaimer = true,
        includeVerificationSources = true,
        reportTitle = 'ELIGIBILITY CERTIFICATE',
        preparedBy,
        referenceNumber = generateReferenceNumber(),
        watermarkText = 'CONFIDENTIAL',
        showWatermark = true,
    } = options;

    // Create PDF document
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Set default font
    doc.setFont('helvetica');

    // Draw watermark first (behind content)
    if (showWatermark) {
        drawWatermark(doc, watermarkText);
    }

    // Track vertical position
    let yPos = 0;

    // Header
    yPos = drawHeader(doc, reportTitle);

    // Client Information
    yPos = drawClientInfo(doc, deal, yPos, referenceNumber);

    // Value Section
    yPos = drawValueSection(doc, deal, yPos);

    // Eligibility Summary
    yPos = drawEligibilitySummary(doc, deal, yPos);

    // Risk Section
    if (includeRiskAnalysis) {
        yPos = drawRiskSection(doc, deal, yPos);
    }

    // Credit Breakdown
    if (includeBreakdown) {
        yPos = drawBreakdownSection(doc, deal, yPos);
    }

    // Verification Sources
    if (includeVerificationSources && deal.verification_sources) {
        yPos = drawVerificationSources(doc, deal, yPos);
    }

    // Certification Stamp
    drawCertificationStamp(doc, yPos, preparedBy);

    // Legal Footer
    if (includeLegalDisclaimer) {
        drawLegalFooter(doc);
    }

    return doc;
}

/**
 * Generate and immediately download the audit report
 * 
 * @param deal - Deal data to include in the report
 * @param filename - Output filename (default: 'audit-report.pdf')
 * @param options - Optional configuration for report generation
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
 * Generate report and return as Blob
 * 
 * @param deal - Deal data to include in the report
 * @param options - Optional configuration for report generation
 * @returns PDF as Blob
 */
export function generateAuditReportBlob(
    deal: Deal,
    options: ReportOptions = {}
): Blob {
    const doc = generateAuditReport(deal, options);
    return doc.output('blob');
}

/**
 * Generate report and return as base64 string
 * 
 * @param deal - Deal data to include in the report
 * @param options - Optional configuration for report generation
 * @returns PDF as base64 data URI
 */
export function generateAuditReportBase64(
    deal: Deal,
    options: ReportOptions = {}
): string {
    const doc = generateAuditReport(deal, options);
    return doc.output('datauristring');
}

/**
 * Generate report and open in new window
 * 
 * @param deal - Deal data to include in the report
 * @param options - Optional configuration for report generation
 */
export function previewAuditReport(
    deal: Deal,
    options: ReportOptions = {}
): void {
    const doc = generateAuditReport(deal, options);
    const blobUrl = URL.createObjectURL(doc.output('blob'));
    window.open(blobUrl, '_blank');
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default generateAuditReport;
