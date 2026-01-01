// ============================================================================
// GRANTFLOW FORENSIC ENGINE v5.0.0
// Rule-Based Content Scanner Module
// ============================================================================

// ----------------------------------------------------------------------------
// SECTION 1: TYPE DEFINITIONS
// ----------------------------------------------------------------------------

/** Individual keyword match with context */
export interface KeywordMatch {
    keyword: string;
    pattern: string;
    position: number;
    lineNumber: number;
    columnNumber: number;
    context: string;
    contextStart: number;
    contextEnd: number;
    confidence: number;
}

/** Rule definition for grant qualification */
export interface GrantRule {
    ruleId: string;
    ruleName: string;
    category: 'rd_credit' | 'training' | 'green_energy' | 'employee_retention' | 'other';
    keywords: string[];
    valuePerMatch: number;
    flatBonus: number;
    maxValue: number | null;
    requiresMinMatches: number;
    description: string;
    irsReference: string | null;
}

/** Single rule evaluation result */
export interface RuleEvaluation {
    ruleId: string;
    ruleName: string;
    category: string;
    qualified: boolean;
    matchCount: number;
    uniqueKeywordsMatched: string[];
    matches: KeywordMatch[];
    calculatedValue: number;
    valueBreakdown: {
        perMatchValue: number;
        flatBonus: number;
        total: number;
    };
    confidence: number;
    evidenceStrength: 'strong' | 'moderate' | 'weak' | 'none';
    notes: string[];
}

/** Statistical analysis of the scanned content */
export interface ContentStatistics {
    totalCharacters: number;
    totalWords: number;
    totalLines: number;
    totalSentences: number;
    averageWordLength: number;
    averageSentenceLength: number;
    lexicalDensity: number;
    keywordDensity: number;
    topWords: { word: string; count: number }[];
}

/** Risk indicators found in content */
export interface RiskIndicator {
    indicatorId: string;
    type: 'warning' | 'caution' | 'info';
    category: string;
    description: string;
    evidence: string;
    position: number | null;
    recommendation: string;
}

/** Qualification summary for a specific grant type */
export interface QualificationSummary {
    programId: string;
    programName: string;
    irsForm: string | null;
    isEligible: boolean;
    eligibilityScore: number;
    estimatedValue: number;
    valueRange: {
        minimum: number;
        expected: number;
        maximum: number;
    };
    matchedRules: string[];
    evidenceCount: number;
    confidence: number;
    requirements: {
        requirement: string;
        met: boolean;
        evidence: string | null;
    }[];
    recommendations: string[];
}

/** Complete analysis result */
export interface AnalyzedResult {
    analysisId: string;
    analysisVersion: string;
    timestamp: string;
    processingTimeMs: number;

    source: {
        contentLength: number;
        contentHash: string;
        contentType: 'plain_text' | 'structured' | 'mixed';
        language: string;
        encoding: string;
    };

    // Primary eligibility flags
    isRdEligible: boolean;
    isTrainingEligible: boolean;
    isGreenEligible: boolean;

    // Extended eligibility flags
    isErcEligible: boolean;
    isWotcEligible: boolean;
    is179dEligible: boolean;

    financialSummary: {
        totalEstimatedValue: number;
        rdCreditValue: number;
        trainingCreditValue: number;
        greenEnergyValue: number;
        otherCreditsValue: number;
        confidenceWeightedValue: number;
        valueByCategory: Record<string, number>;
    };

    ruleEvaluations: RuleEvaluation[];

    qualifications: {
        rdCredit: QualificationSummary;
        trainingGrant: QualificationSummary;
        greenEnergy: QualificationSummary;
        employeeRetention: QualificationSummary;
    };

    allMatches: KeywordMatch[];
    matchesByCategory: Record<string, KeywordMatch[]>;
    statistics: ContentStatistics;
    riskIndicators: RiskIndicator[];
    overallRiskLevel: 'low' | 'medium' | 'high';

    processingDetails: {
        rulesApplied: number;
        rulesTriggered: number;
        totalMatchesFound: number;
        uniqueKeywordsFound: number;
        scanCoverage: number;
        confidenceScore: number;
    };

    auditLog: {
        action: string;
        timestamp: string;
        details: string;
    }[];
}

// ----------------------------------------------------------------------------
// SECTION 2: GRANT RULES CONFIGURATION
// ----------------------------------------------------------------------------

const GRANT_RULES: GrantRule[] = [
    // R&D Credit Rules
    {
        ruleId: 'RD-001',
        ruleName: 'R&D Personnel Detection',
        category: 'rd_credit',
        keywords: ['engineer', 'developer', 'lab', 'research'],
        valuePerMatch: 5000,
        flatBonus: 0,
        maxValue: null,
        requiresMinMatches: 1,
        description: 'Identifies R&D qualified personnel and activities',
        irsReference: 'IRC §41(b)(2)(B)',
    },
    {
        ruleId: 'RD-002',
        ruleName: 'R&D Activity Indicators',
        category: 'rd_credit',
        keywords: ['prototype', 'experiment', 'testing', 'innovation', 'patent'],
        valuePerMatch: 3500,
        flatBonus: 0,
        maxValue: null,
        requiresMinMatches: 1,
        description: 'Identifies specific R&D activities',
        irsReference: 'IRC §41(d)',
    },
    {
        ruleId: 'RD-003',
        ruleName: 'Technical Uncertainty Indicators',
        category: 'rd_credit',
        keywords: ['uncertainty', 'unknown', 'feasibility', 'capability', 'alternative'],
        valuePerMatch: 2500,
        flatBonus: 0,
        maxValue: null,
        requiresMinMatches: 2,
        description: 'Identifies technical uncertainty language',
        irsReference: 'Treas. Reg. §1.41-4(a)(3)',
    },

    // Training Grant Rules
    {
        ruleId: 'TRN-001',
        ruleName: 'Training Program Detection',
        category: 'training',
        keywords: ['tuition', 'course', 'workshop'],
        valuePerMatch: 2000,
        flatBonus: 0,
        maxValue: null,
        requiresMinMatches: 1,
        description: 'Identifies qualified educational expenses',
        irsReference: 'IRC §127',
    },
    {
        ruleId: 'TRN-002',
        ruleName: 'Educational Assistance Indicators',
        category: 'training',
        keywords: ['certification', 'training', 'seminar', 'education', 'learning'],
        valuePerMatch: 1500,
        flatBonus: 0,
        maxValue: null,
        requiresMinMatches: 1,
        description: 'Identifies educational assistance indicators',
        irsReference: 'IRC §127(c)',
    },

    // Green Energy Rules
    {
        ruleId: 'GRN-001',
        ruleName: 'Green Energy Detection',
        category: 'green_energy',
        keywords: ['solar', 'energy', 'retrofit'],
        valuePerMatch: 0,
        flatBonus: 15000,
        maxValue: 15000,
        requiresMinMatches: 1,
        description: 'Identifies energy efficiency improvements',
        irsReference: 'IRC §179D',
    },
    {
        ruleId: 'GRN-002',
        ruleName: 'Energy Efficiency Indicators',
        category: 'green_energy',
        keywords: ['hvac', 'insulation', 'lighting', 'efficiency', 'sustainable'],
        valuePerMatch: 2500,
        flatBonus: 0,
        maxValue: 50000,
        requiresMinMatches: 2,
        description: 'Identifies specific energy efficiency improvements',
        irsReference: 'IRC §179D(c)',
    },

    // Employee Retention Credit Rules
    {
        ruleId: 'ERC-001',
        ruleName: 'ERC Eligibility Indicators',
        category: 'employee_retention',
        keywords: ['pandemic', 'covid', 'shutdown', 'suspension', 'gross receipts decline'],
        valuePerMatch: 0,
        flatBonus: 25000,
        maxValue: 25000,
        requiresMinMatches: 2,
        description: 'Identifies potential ERC eligibility',
        irsReference: 'IRC §3134',
    },
];

// Risk indicator patterns
const RISK_PATTERNS: {
    pattern: RegExp;
    type: 'warning' | 'caution' | 'info';
    category: string;
    description: string;
    recommendation: string;
}[] = [
        {
            pattern: /\b(estimated|approximately|about|roughly)\s+\$[\d,]+/gi,
            type: 'caution',
            category: 'financial_uncertainty',
            description: 'Estimated financial figures detected',
            recommendation: 'Request supporting documentation',
        },
        {
            pattern: /\b(verbal|oral|informal)\s+(agreement|contract)/gi,
            type: 'warning',
            category: 'documentation_gap',
            description: 'Informal agreement referenced',
            recommendation: 'Obtain written documentation',
        },
        {
            pattern: /\b(independent contractor|1099|freelance)/gi,
            type: 'info',
            category: 'worker_classification',
            description: 'Independent contractor reference detected',
            recommendation: 'Verify proper worker classification',
        },
    ];

// ----------------------------------------------------------------------------
// SECTION 3: UTILITY FUNCTIONS
// ----------------------------------------------------------------------------

function hashContent(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

function generateAnalysisId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `SCAN-${timestamp}-${random}`.toUpperCase();
}

function getLineAndColumn(text: string, position: number): { line: number; column: number } {
    const lines = text.substring(0, position).split('\n');
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
    };
}

function extractContext(text: string, position: number, matchLength: number, contextRadius: number = 50): {
    context: string;
    start: number;
    end: number;
} {
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(text.length, position + matchLength + contextRadius);

    let context = text.substring(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return { context, start, end };
}

function findKeywordMatches(text: string, keyword: string): KeywordMatch[] {
    const matches: KeywordMatch[] = [];
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');

    let match;
    while ((match = regex.exec(text)) !== null) {
        const { line, column } = getLineAndColumn(text, match.index);
        const { context, start, end } = extractContext(text, match.index, match[0].length);

        matches.push({
            keyword: keyword.toLowerCase(),
            pattern: match[0],
            position: match.index,
            lineNumber: line,
            columnNumber: column,
            context,
            contextStart: start,
            contextEnd: end,
            confidence: 1.0,
        });
    }

    return matches;
}

function calculateStatistics(text: string, allMatches: KeywordMatch[]): ContentStatistics {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lines = text.split('\n');

    const wordFrequency: Record<string, number> = {};
    words.forEach(word => {
        const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalized.length > 2) {
            wordFrequency[normalized] = (wordFrequency[normalized] || 0) + 1;
        }
    });

    const topWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ word, count }));

    const totalWordLength = words.reduce((sum, w) => sum + w.length, 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;

    return {
        totalCharacters: text.length,
        totalWords: words.length,
        totalLines: lines.length,
        totalSentences: sentences.length,
        averageWordLength: words.length > 0 ? totalWordLength / words.length : 0,
        averageSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
        lexicalDensity: words.length > 0 ? (uniqueWords / words.length) * 100 : 0,
        keywordDensity: words.length > 0 ? (allMatches.length / words.length) * 100 : 0,
        topWords,
    };
}

function detectRiskIndicators(text: string): RiskIndicator[] {
    const indicators: RiskIndicator[] = [];

    RISK_PATTERNS.forEach((pattern, index) => {
        let match;
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

        while ((match = regex.exec(text)) !== null) {
            indicators.push({
                indicatorId: `RISK-${String(index + 1).padStart(3, '0')}-${indicators.length}`,
                type: pattern.type,
                category: pattern.category,
                description: pattern.description,
                evidence: match[0],
                position: match.index,
                recommendation: pattern.recommendation,
            });
        }
    });

    return indicators;
}

function determineEvidenceStrength(matchCount: number, uniqueKeywords: number, totalKeywords: number): 'strong' | 'moderate' | 'weak' | 'none' {
    if (matchCount === 0) return 'none';
    const coverage = uniqueKeywords / totalKeywords;
    if (matchCount >= 5 && coverage >= 0.5) return 'strong';
    if (matchCount >= 3 && coverage >= 0.3) return 'moderate';
    if (matchCount >= 1) return 'weak';
    return 'none';
}

function calculateConfidence(matchCount: number, uniqueKeywords: number, totalKeywords: number, requiresMinMatches: number): number {
    if (matchCount < requiresMinMatches) return 0;
    const coverageScore = (uniqueKeywords / totalKeywords) * 0.4;
    const densityScore = Math.min(1, matchCount / 10) * 0.4;
    const thresholdScore = Math.min(1, matchCount / (requiresMinMatches * 2)) * 0.2;
    return Math.min(1, coverageScore + densityScore + thresholdScore);
}

// ----------------------------------------------------------------------------
// SECTION 4: MAIN SCANNER FUNCTION
// ----------------------------------------------------------------------------

export function scanFileContent(text: string): AnalyzedResult {
    const startTime = performance.now();
    const analysisId = generateAnalysisId();
    const auditLog: AnalyzedResult['auditLog'] = [];

    auditLog.push({
        action: 'SCAN_INITIATED',
        timestamp: new Date().toISOString(),
        details: `Analysis ${analysisId} started, content length: ${text.length} characters`,
    });

    const allMatches: KeywordMatch[] = [];
    const matchesByCategory: Record<string, KeywordMatch[]> = {};
    const ruleEvaluations: RuleEvaluation[] = [];

    // Process each rule
    GRANT_RULES.forEach(rule => {
        const ruleMatches: KeywordMatch[] = [];
        const uniqueKeywordsMatched = new Set<string>();

        rule.keywords.forEach(keyword => {
            const keywordMatches = findKeywordMatches(text, keyword);
            if (keywordMatches.length > 0) {
                uniqueKeywordsMatched.add(keyword.toLowerCase());
                ruleMatches.push(...keywordMatches);
                allMatches.push(...keywordMatches);

                if (!matchesByCategory[rule.category]) {
                    matchesByCategory[rule.category] = [];
                }
                matchesByCategory[rule.category].push(...keywordMatches);
            }
        });

        let calculatedValue = 0;
        const meetsMinMatches = ruleMatches.length >= rule.requiresMinMatches;

        if (meetsMinMatches) {
            calculatedValue = ruleMatches.length * rule.valuePerMatch;
            calculatedValue += rule.flatBonus;
            if (rule.maxValue !== null) {
                calculatedValue = Math.min(calculatedValue, rule.maxValue);
            }
        }

        const confidence = calculateConfidence(
            ruleMatches.length,
            uniqueKeywordsMatched.size,
            rule.keywords.length,
            rule.requiresMinMatches
        );

        const evidenceStrength = determineEvidenceStrength(
            ruleMatches.length,
            uniqueKeywordsMatched.size,
            rule.keywords.length
        );

        const notes: string[] = [];
        if (!meetsMinMatches && ruleMatches.length > 0) {
            notes.push(`Found ${ruleMatches.length} matches but requires minimum ${rule.requiresMinMatches}`);
        }
        if (evidenceStrength === 'strong') {
            notes.push('Strong evidence supporting qualification');
        }

        ruleEvaluations.push({
            ruleId: rule.ruleId,
            ruleName: rule.ruleName,
            category: rule.category,
            qualified: meetsMinMatches,
            matchCount: ruleMatches.length,
            uniqueKeywordsMatched: Array.from(uniqueKeywordsMatched),
            matches: ruleMatches,
            calculatedValue,
            valueBreakdown: {
                perMatchValue: ruleMatches.length * rule.valuePerMatch,
                flatBonus: meetsMinMatches ? rule.flatBonus : 0,
                total: calculatedValue,
            },
            confidence,
            evidenceStrength,
            notes,
        });
    });

    auditLog.push({
        action: 'RULES_PROCESSED',
        timestamp: new Date().toISOString(),
        details: `Processed ${GRANT_RULES.length} rules, found ${allMatches.length} total matches`,
    });

    // Aggregate by category
    const rdEvaluations = ruleEvaluations.filter(e => e.category === 'rd_credit');
    const trainingEvaluations = ruleEvaluations.filter(e => e.category === 'training');
    const greenEvaluations = ruleEvaluations.filter(e => e.category === 'green_energy');
    const ercEvaluations = ruleEvaluations.filter(e => e.category === 'employee_retention');

    const isRdEligible = rdEvaluations.some(e => e.qualified);
    const isTrainingEligible = trainingEvaluations.some(e => e.qualified);
    const isGreenEligible = greenEvaluations.some(e => e.qualified);
    const isErcEligible = ercEvaluations.some(e => e.qualified);

    const rdCreditValue = rdEvaluations.reduce((sum, e) => sum + e.calculatedValue, 0);
    const trainingCreditValue = trainingEvaluations.reduce((sum, e) => sum + e.calculatedValue, 0);
    const greenEnergyValue = greenEvaluations.reduce((sum, e) => sum + e.calculatedValue, 0);
    const ercValue = ercEvaluations.reduce((sum, e) => sum + e.calculatedValue, 0);

    const totalEstimatedValue = rdCreditValue + trainingCreditValue + greenEnergyValue + ercValue;
    const statistics = calculateStatistics(text, allMatches);
    const riskIndicators = detectRiskIndicators(text);
    const overallRiskLevel = riskIndicators.filter(r => r.type === 'warning').length >= 2 ? 'high' :
        riskIndicators.filter(r => r.type === 'warning').length >= 1 ? 'medium' : 'low';

    const buildQualificationSummary = (
        programName: string,
        programId: string,
        irsForm: string | null,
        evaluations: RuleEvaluation[],
        isEligible: boolean,
        totalValue: number
    ): QualificationSummary => {
        const matchedRules = evaluations.filter(e => e.qualified).map(e => e.ruleId);
        const evidenceCount = evaluations.reduce((sum, e) => sum + e.matchCount, 0);
        const avgConfidence = evaluations.length > 0
            ? evaluations.reduce((sum, e) => sum + e.confidence, 0) / evaluations.length
            : 0;

        return {
            programId,
            programName,
            irsForm,
            isEligible,
            eligibilityScore: Math.round(avgConfidence * 100),
            estimatedValue: totalValue,
            valueRange: {
                minimum: Math.round(totalValue * 0.7),
                expected: totalValue,
                maximum: Math.round(totalValue * 1.3),
            },
            matchedRules,
            evidenceCount,
            confidence: avgConfidence,
            requirements: evaluations.map(e => ({
                requirement: e.ruleName,
                met: e.qualified,
                evidence: e.qualified ? `${e.matchCount} matches found` : null,
            })),
            recommendations: isEligible
                ? ['Gather supporting documentation', 'Review contemporaneous records']
                : ['Insufficient evidence found'],
        };
    };

    const uniqueKeywordsFound = new Set(allMatches.map(m => m.keyword)).size;
    const rulesTriggered = ruleEvaluations.filter(e => e.qualified).length;
    const confidenceWeightedValue = ruleEvaluations.reduce((sum, e) => sum + (e.calculatedValue * e.confidence), 0);

    const endTime = performance.now();

    auditLog.push({
        action: 'SCAN_COMPLETE',
        timestamp: new Date().toISOString(),
        details: `Analysis complete in ${Math.round(endTime - startTime)}ms`,
    });

    return {
        analysisId,
        analysisVersion: '5.0.0',
        timestamp: new Date().toISOString(),
        processingTimeMs: Math.round(endTime - startTime),

        source: {
            contentLength: text.length,
            contentHash: hashContent(text),
            contentType: 'plain_text',
            language: 'en',
            encoding: 'UTF-8',
        },

        isRdEligible,
        isTrainingEligible,
        isGreenEligible,
        isErcEligible,
        isWotcEligible: false,
        is179dEligible: isGreenEligible,

        financialSummary: {
            totalEstimatedValue,
            rdCreditValue,
            trainingCreditValue,
            greenEnergyValue,
            otherCreditsValue: ercValue,
            confidenceWeightedValue: Math.round(confidenceWeightedValue),
            valueByCategory: {
                rd_credit: rdCreditValue,
                training: trainingCreditValue,
                green_energy: greenEnergyValue,
                employee_retention: ercValue,
            },
        },

        ruleEvaluations,

        qualifications: {
            rdCredit: buildQualificationSummary('Federal R&D Tax Credit', 'IRC-41', 'Form 6765', rdEvaluations, isRdEligible, rdCreditValue),
            trainingGrant: buildQualificationSummary('Training & Education Grant', 'TRN-127', 'Form W-2', trainingEvaluations, isTrainingEligible, trainingCreditValue),
            greenEnergy: buildQualificationSummary('Energy Efficiency Deduction', 'SEC-179D', 'Form 7205', greenEvaluations, isGreenEligible, greenEnergyValue),
            employeeRetention: buildQualificationSummary('Employee Retention Credit', 'ERC-3134', 'Form 941-X', ercEvaluations, isErcEligible, ercValue),
        },

        allMatches,
        matchesByCategory,
        statistics,
        riskIndicators,
        overallRiskLevel,

        processingDetails: {
            rulesApplied: GRANT_RULES.length,
            rulesTriggered,
            totalMatchesFound: allMatches.length,
            uniqueKeywordsFound,
            scanCoverage: 100,
            confidenceScore: rulesTriggered > 0
                ? ruleEvaluations.filter(e => e.qualified).reduce((sum, e) => sum + e.confidence, 0) / rulesTriggered
                : 0,
        },

        auditLog,
    };
}

// ----------------------------------------------------------------------------
// SECTION 5: HELPER EXPORTS
// ----------------------------------------------------------------------------

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function quickEligibilityCheck(text: string): {
    isRdEligible: boolean;
    isTrainingEligible: boolean;
    isGreenEligible: boolean;
    totalEstimatedValue: number;
} {
    const result = scanFileContent(text);
    return {
        isRdEligible: result.isRdEligible,
        isTrainingEligible: result.isTrainingEligible,
        isGreenEligible: result.isGreenEligible,
        totalEstimatedValue: result.financialSummary.totalEstimatedValue,
    };
}

export { GRANT_RULES };
