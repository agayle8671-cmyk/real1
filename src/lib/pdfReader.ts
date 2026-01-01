// ============================================================================
// GRANTFLOW PDF TEXT EXTRACTION UTILITY
// Uses pdfjs-dist with CDN worker for Vite compatibility
// ============================================================================

import * as pdfjsLib from 'pdfjs-dist';
import type {
    PDFDocumentProxy,
    PDFPageProxy,
    TextContent,
    TextItem,
    TextMarkedContent
} from 'pdfjs-dist/types/src/display/api';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * PDF.js worker source URL
 * Using CDN to avoid Vite/Webpack bundling issues with workers
 * Version should match the installed pdfjs-dist version
 */
const PDFJS_VERSION = '5.4.530'; // Must match installed pdfjs-dist version
const WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

// Configure the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Options for PDF text extraction */
export interface PdfExtractionOptions {
    /** Password for encrypted PDFs */
    password?: string;

    /** Maximum number of pages to extract (default: all) */
    maxPages?: number;

    /** Skip pages with no text content */
    skipEmptyPages?: boolean;

    /** Include page numbers in output */
    includePageNumbers?: boolean;

    /** Custom page separator (default: '\n\n') */
    pageSeparator?: string;

    /** Custom line separator (default: '\n') */
    lineSeparator?: string;

    /** Normalize whitespace in output */
    normalizeWhitespace?: boolean;

    /** Progress callback for large documents */
    onProgress?: (progress: PdfExtractionProgress) => void;
}

/** Progress information during extraction */
export interface PdfExtractionProgress {
    currentPage: number;
    totalPages: number;
    percentage: number;
    status: 'loading' | 'extracting' | 'complete' | 'error';
    message: string;
}

/** Result of PDF text extraction */
export interface PdfExtractionResult {
    /** Extracted text content */
    text: string;

    /** Document metadata */
    metadata: PdfMetadata;

    /** Per-page extraction details */
    pages: PdfPageResult[];

    /** Extraction statistics */
    stats: PdfExtractionStats;
}

/** PDF document metadata */
export interface PdfMetadata {
    title: string | null;
    author: string | null;
    subject: string | null;
    keywords: string | null;
    creator: string | null;
    producer: string | null;
    creationDate: Date | null;
    modificationDate: Date | null;
    pageCount: number;
    isEncrypted: boolean;
    pdfVersion: string | null;
}

/** Per-page extraction result */
export interface PdfPageResult {
    pageNumber: number;
    text: string;
    wordCount: number;
    charCount: number;
    hasText: boolean;
    width: number;
    height: number;
}

/** Extraction statistics */
export interface PdfExtractionStats {
    totalPages: number;
    pagesWithText: number;
    pagesWithoutText: number;
    totalWords: number;
    totalCharacters: number;
    extractionTimeMs: number;
    averageWordsPerPage: number;
}

/** Custom error class for PDF extraction failures */
export class PdfExtractionError extends Error {
    public readonly code: PdfErrorCode;
    public readonly originalError?: Error;

    constructor(message: string, code: PdfErrorCode, originalError?: Error) {
        super(message);
        this.name = 'PdfExtractionError';
        this.code = code;
        this.originalError = originalError;

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PdfExtractionError);
        }
    }
}

/** Error codes for PDF extraction failures */
export type PdfErrorCode =
    | 'INVALID_FILE'
    | 'PASSWORD_REQUIRED'
    | 'INCORRECT_PASSWORD'
    | 'CORRUPTED_FILE'
    | 'UNSUPPORTED_FORMAT'
    | 'EMPTY_DOCUMENT'
    | 'EXTRACTION_FAILED'
    | 'WORKER_ERROR'
    | 'TIMEOUT'
    | 'UNKNOWN_ERROR';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a text content item is a TextItem (has 'str' property)
 */
function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
    return 'str' in item && typeof item.str === 'string';
}

/**
 * Convert File to ArrayBuffer
 */
async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read file as ArrayBuffer'));
            }
        };

        reader.onerror = () => {
            reject(new Error(`FileReader error: ${reader.error?.message || 'Unknown error'}`));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse PDF date string to Date object
 */
function parsePdfDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;

    // PDF dates are in format: D:YYYYMMDDHHmmSS
    const match = dateString.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);

    if (match) {
        const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
        return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
        );
    }

    // Try standard date parsing as fallback
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Normalize whitespace in text
 */
function normalizeText(text: string, options: PdfExtractionOptions): string {
    if (!options.normalizeWhitespace) {
        return text;
    }

    return text
        // Replace multiple spaces with single space
        .replace(/[^\S\n]+/g, ' ')
        // Replace multiple newlines with double newline
        .replace(/\n{3,}/g, '\n\n')
        // Trim lines
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        // Trim overall
        .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Extract text content from a single PDF page
 */
async function extractPageText(page: PDFPageProxy, lineSeparator: string): Promise<string> {
    const textContent: TextContent = await page.getTextContent();

    const textItems: string[] = [];
    let lastY: number | null = null;

    for (const item of textContent.items) {
        if (isTextItem(item)) {
            // Check if we need to add a line break based on Y position change
            const currentY = item.transform[5]; // Y position in transform matrix

            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                // Significant Y change indicates new line
                textItems.push(lineSeparator);
            } else if (textItems.length > 0 && !textItems[textItems.length - 1].endsWith(' ')) {
                // Add space between items on same line if needed
                textItems.push(' ');
            }

            textItems.push(item.str);
            lastY = currentY;
        }
    }

    return textItems.join('');
}

/**
 * Extract metadata from PDF document
 */
async function extractMetadata(pdfDoc: PDFDocumentProxy): Promise<PdfMetadata> {
    try {
        const metadata = await pdfDoc.getMetadata();
        const info = metadata.info as Record<string, any> || {};

        return {
            title: info.Title || null,
            author: info.Author || null,
            subject: info.Subject || null,
            keywords: info.Keywords || null,
            creator: info.Creator || null,
            producer: info.Producer || null,
            creationDate: parsePdfDate(info.CreationDate),
            modificationDate: parsePdfDate(info.ModDate),
            pageCount: pdfDoc.numPages,
            isEncrypted: info.IsEncrypted || false,
            pdfVersion: info.PDFFormatVersion || null,
        };
    } catch {
        // Return minimal metadata if extraction fails
        return {
            title: null,
            author: null,
            subject: null,
            keywords: null,
            creator: null,
            producer: null,
            creationDate: null,
            modificationDate: null,
            pageCount: pdfDoc.numPages,
            isEncrypted: false,
            pdfVersion: null,
        };
    }
}

/**
 * Map PDF.js error to our error code
 */
function mapPdfError(error: any): { code: PdfErrorCode; message: string } {
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes('Invalid PDF structure') ||
        errorMessage.includes('Invalid XRef')) {
        return {
            code: 'CORRUPTED_FILE',
            message: 'The PDF file appears to be corrupted or has an invalid structure.',
        };
    }

    if (errorMessage.includes('password')) {
        if (errorMessage.includes('incorrect') || errorMessage.includes('wrong')) {
            return {
                code: 'INCORRECT_PASSWORD',
                message: 'The provided password is incorrect.',
            };
        }
        return {
            code: 'PASSWORD_REQUIRED',
            message: 'This PDF is password-protected. Please provide the password.',
        };
    }

    if (errorMessage.includes('not a PDF') ||
        errorMessage.includes('Invalid header')) {
        return {
            code: 'INVALID_FILE',
            message: 'The file does not appear to be a valid PDF document.',
        };
    }

    if (errorMessage.includes('Worker')) {
        return {
            code: 'WORKER_ERROR',
            message: 'PDF processing worker failed to initialize.',
        };
    }

    return {
        code: 'EXTRACTION_FAILED',
        message: `Failed to extract text from PDF: ${errorMessage}`,
    };
}

// ============================================================================
// MAIN EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract text from a PDF file with full options and detailed results
 */
export async function extractPdfTextDetailed(
    file: File,
    options: PdfExtractionOptions = {}
): Promise<PdfExtractionResult> {
    const startTime = performance.now();

    // Default options
    const opts: Required<Omit<PdfExtractionOptions, 'password' | 'maxPages' | 'onProgress'>> &
        Pick<PdfExtractionOptions, 'password' | 'maxPages' | 'onProgress'> = {
        password: options.password,
        maxPages: options.maxPages,
        skipEmptyPages: options.skipEmptyPages ?? false,
        includePageNumbers: options.includePageNumbers ?? false,
        pageSeparator: options.pageSeparator ?? '\n\n',
        lineSeparator: options.lineSeparator ?? '\n',
        normalizeWhitespace: options.normalizeWhitespace ?? true,
        onProgress: options.onProgress,
    };

    // Report initial progress
    opts.onProgress?.({
        currentPage: 0,
        totalPages: 0,
        percentage: 0,
        status: 'loading',
        message: 'Loading PDF document...',
    });

    // Validate file
    if (!file) {
        throw new PdfExtractionError(
            'No file provided',
            'INVALID_FILE'
        );
    }

    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new PdfExtractionError(
            'The provided file does not appear to be a PDF',
            'INVALID_FILE'
        );
    }

    let pdfDoc: PDFDocumentProxy | null = null;

    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await fileToArrayBuffer(file);

        if (arrayBuffer.byteLength === 0) {
            throw new PdfExtractionError(
                'The PDF file is empty',
                'EMPTY_DOCUMENT'
            );
        }

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            password: opts.password,
            // Disable features we don't need for text extraction
            disableFontFace: true,
            useSystemFonts: false,
        });

        pdfDoc = await loadingTask.promise;

        const totalPages = pdfDoc.numPages;
        const pagesToProcess = opts.maxPages
            ? Math.min(totalPages, opts.maxPages)
            : totalPages;

        if (totalPages === 0) {
            throw new PdfExtractionError(
                'The PDF document has no pages',
                'EMPTY_DOCUMENT'
            );
        }

        // Extract metadata
        const metadata = await extractMetadata(pdfDoc);

        // Extract text from each page
        const pageResults: PdfPageResult[] = [];
        const textParts: string[] = [];

        for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
            // Report progress
            opts.onProgress?.({
                currentPage: pageNum,
                totalPages: pagesToProcess,
                percentage: Math.round((pageNum / pagesToProcess) * 100),
                status: 'extracting',
                message: `Extracting page ${pageNum} of ${pagesToProcess}...`,
            });

            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.0 });
                const pageText = await extractPageText(page, opts.lineSeparator);

                const pageResult: PdfPageResult = {
                    pageNumber: pageNum,
                    text: pageText,
                    wordCount: countWords(pageText),
                    charCount: pageText.length,
                    hasText: pageText.trim().length > 0,
                    width: viewport.width,
                    height: viewport.height,
                };

                pageResults.push(pageResult);

                // Add to combined text
                if (pageResult.hasText || !opts.skipEmptyPages) {
                    if (opts.includePageNumbers) {
                        textParts.push(`[Page ${pageNum}]${opts.lineSeparator}${pageText}`);
                    } else {
                        textParts.push(pageText);
                    }
                }

            } catch (pageError) {
                console.warn(`Warning: Failed to extract text from page ${pageNum}:`, pageError);

                // Add empty result for failed page
                pageResults.push({
                    pageNumber: pageNum,
                    text: '',
                    wordCount: 0,
                    charCount: 0,
                    hasText: false,
                    width: 0,
                    height: 0,
                });
            }
        }

        // Combine all page text
        let combinedText = textParts.join(opts.pageSeparator);

        // Normalize if requested
        combinedText = normalizeText(combinedText, opts);

        // Calculate statistics
        const pagesWithText = pageResults.filter(p => p.hasText).length;
        const totalWords = pageResults.reduce((sum, p) => sum + p.wordCount, 0);
        const totalCharacters = pageResults.reduce((sum, p) => sum + p.charCount, 0);

        const stats: PdfExtractionStats = {
            totalPages: pagesToProcess,
            pagesWithText,
            pagesWithoutText: pagesToProcess - pagesWithText,
            totalWords,
            totalCharacters,
            extractionTimeMs: Math.round(performance.now() - startTime),
            averageWordsPerPage: pagesToProcess > 0 ? Math.round(totalWords / pagesToProcess) : 0,
        };

        // Report completion
        opts.onProgress?.({
            currentPage: pagesToProcess,
            totalPages: pagesToProcess,
            percentage: 100,
            status: 'complete',
            message: `Extraction complete. Found ${totalWords} words across ${pagesWithText} pages.`,
        });

        return {
            text: combinedText,
            metadata,
            pages: pageResults,
            stats,
        };

    } catch (error) {
        // Report error
        opts.onProgress?.({
            currentPage: 0,
            totalPages: 0,
            percentage: 0,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        });

        // Re-throw if already our error type
        if (error instanceof PdfExtractionError) {
            throw error;
        }

        // Map to our error type
        const { code, message } = mapPdfError(error);
        throw new PdfExtractionError(message, code, error instanceof Error ? error : undefined);

    } finally {
        // Clean up
        if (pdfDoc) {
            try {
                await pdfDoc.destroy();
            } catch (cleanupError) {
                console.warn('Warning: Failed to cleanup PDF document:', cleanupError);
            }
        }
    }
}

/**
 * Extract text from a PDF file (simple version)
 */
export default async function extractPdfText(file: File): Promise<string> {
    const result = await extractPdfTextDetailed(file, {
        normalizeWhitespace: true,
        skipEmptyPages: true,
    });

    return result.text;
}

/**
 * Check if a file is a valid PDF without fully extracting it
 */
export async function validatePdf(file: File): Promise<{
    isValid: boolean;
    pageCount: number;
    isEncrypted: boolean;
    error?: string;
}> {
    try {
        const arrayBuffer = await fileToArrayBuffer(file);

        // Check PDF magic bytes
        const header = new Uint8Array(arrayBuffer.slice(0, 5));
        const headerString = String.fromCharCode(...header);

        if (!headerString.startsWith('%PDF-')) {
            return {
                isValid: false,
                pageCount: 0,
                isEncrypted: false,
                error: 'File does not have a valid PDF header',
            };
        }

        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            disableFontFace: true,
        });

        const pdfDoc = await loadingTask.promise;
        const metadata = await extractMetadata(pdfDoc);

        await pdfDoc.destroy();

        return {
            isValid: true,
            pageCount: metadata.pageCount,
            isEncrypted: metadata.isEncrypted,
        };

    } catch (error) {
        const { code, message } = mapPdfError(error);

        return {
            isValid: code !== 'INVALID_FILE' && code !== 'CORRUPTED_FILE',
            pageCount: 0,
            isEncrypted: code === 'PASSWORD_REQUIRED',
            error: message,
        };
    }
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export {
    pdfjsLib,
    PDFJS_VERSION,
    WORKER_SRC,
};
