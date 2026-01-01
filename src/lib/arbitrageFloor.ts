// ============================================================================
// GRANTFLOW ARBITRAGE FLOOR ENGINE
// Market Bid Generation & Transaction Execution
// ============================================================================

import { supabase } from './supabase';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** CPA Firm participating in the marketplace */
export interface CpaFirm {
    id: string;
    name: string;
    tier: 'big4' | 'national' | 'regional' | 'boutique';
    avgPremium: number;
    winRate: number;
    specializations: string[];
    minDealSize: number;
    maxDealSize: number;
    isActive: boolean;
}

/** Market bid from a CPA firm */
export interface MarketBid {
    id: string;
    bidId: string;
    dealId: string | null;
    firmId: string;
    firmName: string;
    firmTier: CpaFirm['tier'];
    bidAmount: number;
    bidPercentage: number;
    status: BidStatus;
    priority: BidPriority;
    expiresAt: string;
    createdAt: string;
    metadata: BidMetadata;
}

export type BidStatus = 'OPEN' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN' | 'OUTBID';
export type BidPriority = 'urgent' | 'high' | 'standard' | 'low';

export interface BidMetadata {
    dealValue: number;
    spread: number;
    spreadPercentage: number;
    firmRating: number;
    estimatedCloseTime: number;
    terms: string[];
}

/** Sale execution result */
export interface SaleExecutionResult {
    success: boolean;
    transactionId: string;
    dealId: number;
    buyerName: string;
    salePrice: number;
    soldAt: string;
    spread: number;
    spreadPercentage: number;
    processingTimeMs: number;
    error?: string;
}

/** Custom error class */
export class ArbitrageError extends Error {
    public readonly code: string;
    constructor(message: string, code: string) {
        super(message);
        this.name = 'ArbitrageError';
        this.code = code;
    }
}

// ============================================================================
// CPA FIRM DATA
// ============================================================================

export const CPA_FIRMS: CpaFirm[] = [
    {
        id: 'firm-001',
        name: 'Deloitte',
        tier: 'big4',
        avgPremium: 0.12,
        winRate: 0.35,
        specializations: ['R&D', 'ERC', '179D', 'WOTC'],
        minDealSize: 50000,
        maxDealSize: 10000000,
        isActive: true,
    },
    {
        id: 'firm-002',
        name: 'KPMG',
        tier: 'big4',
        avgPremium: 0.10,
        winRate: 0.32,
        specializations: ['R&D', 'ERC', 'State Credits'],
        minDealSize: 75000,
        maxDealSize: 10000000,
        isActive: true,
    },
    {
        id: 'firm-003',
        name: 'EY',
        tier: 'big4',
        avgPremium: 0.11,
        winRate: 0.30,
        specializations: ['R&D', 'ERC', 'Green Energy'],
        minDealSize: 50000,
        maxDealSize: 10000000,
        isActive: true,
    },
    {
        id: 'firm-004',
        name: 'PwC',
        tier: 'big4',
        avgPremium: 0.13,
        winRate: 0.28,
        specializations: ['R&D', 'ERC', 'M&A Credits'],
        minDealSize: 100000,
        maxDealSize: 10000000,
        isActive: true,
    },
    {
        id: 'firm-005',
        name: 'RSM',
        tier: 'national',
        avgPremium: 0.08,
        winRate: 0.42,
        specializations: ['R&D', 'ERC', 'WOTC'],
        minDealSize: 25000,
        maxDealSize: 2000000,
        isActive: true,
    },
    {
        id: 'firm-006',
        name: 'BDO',
        tier: 'national',
        avgPremium: 0.07,
        winRate: 0.38,
        specializations: ['R&D', 'ERC', 'Manufacturing'],
        minDealSize: 25000,
        maxDealSize: 2000000,
        isActive: true,
    },
    {
        id: 'firm-007',
        name: 'Grant Thornton',
        tier: 'national',
        avgPremium: 0.09,
        winRate: 0.36,
        specializations: ['R&D', 'ERC', '179D'],
        minDealSize: 30000,
        maxDealSize: 3000000,
        isActive: true,
    },
    {
        id: 'firm-008',
        name: 'Moss Adams',
        tier: 'regional',
        avgPremium: 0.06,
        winRate: 0.45,
        specializations: ['R&D', 'Tech Credits'],
        minDealSize: 15000,
        maxDealSize: 1000000,
        isActive: true,
    },
    {
        id: 'firm-009',
        name: 'CLA',
        tier: 'regional',
        avgPremium: 0.05,
        winRate: 0.48,
        specializations: ['R&D', 'ERC', 'Agriculture'],
        minDealSize: 10000,
        maxDealSize: 1000000,
        isActive: true,
    },
    {
        id: 'firm-010',
        name: 'Plante Moran',
        tier: 'regional',
        avgPremium: 0.055,
        winRate: 0.44,
        specializations: ['R&D', 'Manufacturing'],
        minDealSize: 15000,
        maxDealSize: 1500000,
        isActive: true,
    },
    {
        id: 'firm-011',
        name: 'Armanino',
        tier: 'regional',
        avgPremium: 0.065,
        winRate: 0.40,
        specializations: ['R&D', 'Tech', 'Startups'],
        minDealSize: 10000,
        maxDealSize: 500000,
        isActive: true,
    },
    {
        id: 'firm-012',
        name: 'Marcum',
        tier: 'regional',
        avgPremium: 0.058,
        winRate: 0.41,
        specializations: ['R&D', 'Real Estate'],
        minDealSize: 20000,
        maxDealSize: 1000000,
        isActive: true,
    },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix: string = 'GF'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function randomIntInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getEligibleFirms(dealValue: number): CpaFirm[] {
    return CPA_FIRMS.filter(firm =>
        firm.isActive &&
        dealValue >= firm.minDealSize &&
        dealValue <= firm.maxDealSize
    );
}

function calculateBidExpiration(): string {
    const hoursToAdd = randomIntInRange(24, 72);
    return new Date(Date.now() + hoursToAdd * 60 * 60 * 1000).toISOString();
}

function determineBidPriority(dealValue: number, firmTier: CpaFirm['tier']): BidPriority {
    if (dealValue >= 500000 && (firmTier === 'big4' || firmTier === 'national')) return 'urgent';
    if (dealValue >= 200000) return 'high';
    if (dealValue >= 50000) return 'standard';
    return 'low';
}

// ============================================================================
// BID GENERATION
// ============================================================================

export interface BidGenerationOptions {
    minBids?: number;
    maxBids?: number;
    minBidPercentage?: number;
    maxBidPercentage?: number;
    dealId?: string;
    costBasis?: number;
}

/**
 * Generate market bids for a deal
 */
export function generateMarketBids(
    dealValue: number,
    options: BidGenerationOptions = {}
): MarketBid[] {
    if (dealValue <= 0) {
        throw new ArbitrageError('Deal value must be greater than 0', 'VALIDATION_ERROR');
    }

    const {
        minBids = 3,
        maxBids = 5,
        minBidPercentage = 0.03,
        maxBidPercentage = 0.08,
        dealId = null,
        costBasis = dealValue * 0.008,
    } = options;

    let eligibleFirms = getEligibleFirms(dealValue);
    if (eligibleFirms.length === 0) {
        eligibleFirms = CPA_FIRMS.filter(firm => firm.isActive);
    }

    const shuffledFirms = shuffleArray(eligibleFirms);
    const numBids = Math.min(randomIntInRange(minBids, maxBids), shuffledFirms.length);
    const selectedFirms = shuffledFirms.slice(0, numBids);

    const now = new Date().toISOString();

    const bids: MarketBid[] = selectedFirms.map(firm => {
        const basePercentage = randomInRange(minBidPercentage, maxBidPercentage);
        const firmAdjustment = firm.avgPremium * randomInRange(0.5, 1.5);
        const finalPercentage = Math.min(maxBidPercentage * 1.2, basePercentage + firmAdjustment);
        const bidAmount = Math.round(dealValue * finalPercentage);
        const spread = bidAmount - costBasis;
        const spreadPercentage = costBasis > 0 ? (spread / costBasis) * 100 : 0;

        const bidId = generateId('BID');

        return {
            id: bidId,
            bidId,
            dealId,
            firmId: firm.id,
            firmName: firm.name,
            firmTier: firm.tier,
            bidAmount,
            bidPercentage: Math.round(finalPercentage * 10000) / 100,
            status: 'OPEN' as BidStatus,
            priority: determineBidPriority(dealValue, firm.tier),
            expiresAt: calculateBidExpiration(),
            createdAt: now,
            metadata: {
                dealValue,
                spread,
                spreadPercentage: Math.round(spreadPercentage * 100) / 100,
                firmRating: Math.round(randomInRange(3.5, 5.0) * 10) / 10,
                estimatedCloseTime: firm.tier === 'big4' ? randomIntInRange(5, 14) : randomIntInRange(3, 10),
                terms: [
                    'Standard engagement letter required',
                    'Audit defense included for 3 years',
                ],
            },
        };
    });

    return bids.sort((a, b) => b.bidAmount - a.bidAmount);
}

// ============================================================================
// SALE EXECUTION
// ============================================================================

export interface SaleExecutionOptions {
    actor?: string;
    notes?: string;
}

/**
 * Execute a sale transaction
 */
export async function executeSale(
    dealId: number,
    buyerName: string,
    price: number,
    _options: SaleExecutionOptions = {}
): Promise<SaleExecutionResult> {
    const startTime = performance.now();
    const transactionId = generateId('TXN');
    const soldAt = new Date().toISOString();

    try {
        // Fetch deal
        const { data: deal, error: fetchError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

        if (fetchError || !deal) {
            throw new ArbitrageError(`Deal not found: ${dealId}`, 'DEAL_NOT_FOUND');
        }

        if (deal.status === 'SOLD') {
            throw new ArbitrageError('Deal has already been sold', 'DEAL_ALREADY_SOLD');
        }

        // Execute update
        const { error: updateError } = await supabase
            .from('deals')
            .update({
                status: 'SOLD',
                sold_to: buyerName.trim(),
                sale_price: price,
                sold_at: soldAt,
            })
            .eq('id', dealId);

        if (updateError) {
            throw new ArbitrageError(`Failed to update deal: ${updateError.message}`, 'TRANSACTION_FAILED');
        }

        const costBasis = deal.cost_basis || (deal.value * 0.008);
        const spread = price - costBasis;
        const spreadPercentage = costBasis > 0 ? (spread / costBasis) * 100 : 0;

        return {
            success: true,
            transactionId,
            dealId,
            buyerName,
            salePrice: price,
            soldAt,
            spread,
            spreadPercentage: Math.round(spreadPercentage * 100) / 100,
            processingTimeMs: Math.round(performance.now() - startTime),
        };

    } catch (error) {
        return {
            success: false,
            transactionId,
            dealId,
            buyerName,
            salePrice: price,
            soldAt,
            spread: 0,
            spreadPercentage: 0,
            processingTimeMs: Math.round(performance.now() - startTime),
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

export function formatBidAmount(amount: number): string {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
}

export function getTierColor(tier: CpaFirm['tier']): string {
    switch (tier) {
        case 'big4': return 'text-amber-400';
        case 'national': return 'text-cyan-400';
        case 'regional': return 'text-emerald-400';
        case 'boutique': return 'text-purple-400';
        default: return 'text-slate-400';
    }
}

export function getTierBadge(tier: CpaFirm['tier']): string {
    switch (tier) {
        case 'big4': return 'BIG4';
        case 'national': return 'NATL';
        case 'regional': return 'RGNL';
        case 'boutique': return 'BTQE';
    }
}
