import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area,
    XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import {
    ArrowDown, ArrowUp,
    BarChart3, Bell, CheckCircle, ChevronRight,
    Clock, Database, DollarSign,
    FileCheck, Layers, Loader2, Mic, Scan, Server, Leaf,
    Settings, Shield, ShieldCheck, Target,
    Terminal, TrendingUp, Upload, User,
    Wifi, Zap, Building, Cpu,
    Circle, Eye
} from 'lucide-react';
import { scanFileContent, AnalyzedResult, formatCurrency as fmtCurrency } from './forensicEngine';
import { supabase, Deal } from './lib/supabase';
import extractPdfText from './lib/pdfReader';
import { generateMarketBids, executeSale, MarketBid, formatBidAmount, getTierColor, getTierBadge } from './lib/arbitrageFloor';
import PublicLanding from './PublicLanding';

interface FinancialRow {
    id: string;
    metric: string;
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    ytd: number;
    confidence: number;
    source: string;
    trend: number[];
    verified: boolean;
    flag?: string;
}

interface Lead {
    id: string;
    company: string;
    ein: string;
    sector: string;
    eligibility: number;
    estValue: number;
    stage: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    timestamp: Date;
}

// Bid interface removed - now using MarketBid from arbitrageFloor

interface LogEntry {
    id: string;
    timestamp: Date;
    level: 'info' | 'success' | 'warning' | 'error' | 'system';
    message: string;
    module: string;
}

const formatCurrency = (val: number): string => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
};



// Custom useInterval hook for animations
function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = React.useRef(callback);
    React.useEffect(() => { savedCallback.current = callback; }, [callback]);
    React.useEffect(() => {
        if (delay === null) return;
        const id = setInterval(() => savedCallback.current(), delay);
        return () => clearInterval(id);
    }, [delay]);
}

const GlobalCommandHeader: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [systemLoad, setSystemLoad] = useState(67);
    const [liveSpread, setLiveSpread] = useState(840);
    const [spreadChange, setSpreadChange] = useState(-2.1);

    useInterval(() => {
        setTime(new Date());
        setSystemLoad(65 + Math.random() * 15);
    }, 1000);

    // Live spread ticker
    useInterval(() => {
        const delta = (Math.random() - 0.5) * 10;
        setLiveSpread(prev => Math.max(835, Math.min(850, prev + delta)));
        setSpreadChange((Math.random() - 0.5) * 5);
    }, 2500);

    return (
        <header className="bg-slate-900 border-b border-slate-700 px-2 py-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded flex items-center justify-center">
                            <Zap className="w-5 h-5 text-slate-900" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white tracking-wider">GRANTFLOW</div>
                            <div className="text-[10px] text-slate-500 tracking-widest">TERMINAL v4.2.1</div>
                        </div>
                    </div>
                    <div className="h-6 w-px bg-slate-700" />
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                            <Wifi className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] text-slate-400 font-mono">LATENCY: 12ms</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                            <Server className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] text-slate-400 font-mono">LOAD: {systemLoad.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <MetricCard label="PIPELINE VAL" value="$4.2M" change={12.4} icon={DollarSign} color="emerald" />
                    <MetricCard label="ACCURACY" value="99.8%" change={0.2} icon={ShieldCheck} color="cyan" />
                    <MetricCard label="SPREAD" value={`${liveSpread.toFixed(0)}%`} change={spreadChange} icon={TrendingUp} color="amber" />
                    <MetricCard label="DEALS/HR" value="127" change={8.3} icon={Zap} color="emerald" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 bg-slate-800 rounded border border-slate-700 hover:border-slate-600"><Bell className="w-4 h-4 text-slate-400" /></button>
                        <button className="p-1.5 bg-slate-800 rounded border border-slate-700 hover:border-slate-600"><Settings className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    <div className="h-6 w-px bg-slate-700" />
                    <div className="text-right">
                        <div className="text-xs font-mono text-white">{time.toLocaleTimeString('en-US', { hour12: false })}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{time.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}</div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-900/30 border border-emerald-700/50 rounded">
                        <User className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-mono">JDK-7291</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

const MetricCard: React.FC<{ label: string; value: string; change: number; icon: any; color: string }> = ({ label, value, change, icon: Icon, color }) => {
    const colorMap: Record<string, string> = {
        emerald: 'text-emerald-400 border-emerald-800/50 bg-emerald-900/20',
        cyan: 'text-cyan-400 border-cyan-800/50 bg-cyan-900/20',
        amber: 'text-amber-400 border-amber-800/50 bg-amber-900/20',
    };
    return (
        <div className={`px-3 py-1 rounded border ${colorMap[color]} min-w-[100px]`}>
            <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-mono">{label}</span>
                <Icon className="w-3 h-3 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white font-mono">{value}</span>
                <span className={`text-[10px] font-mono flex items-center ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change >= 0 ? <ArrowUp className="w-2 h-2" /> : <ArrowDown className="w-2 h-2" />}{Math.abs(change)}%
                </span>
            </div>
        </div>
    );
};

const UnderwritingMatrix: React.FC<{ result: AnalyzedResult | null }> = ({ result }) => {
    // Generate financials from scan result or use placeholders
    const financials: FinancialRow[] = result ? [
        { id: '1', metric: 'R&D Credit', q1: Math.round(result.financialSummary.rdCreditValue * 0.22), q2: Math.round(result.financialSummary.rdCreditValue * 0.26), q3: Math.round(result.financialSummary.rdCreditValue * 0.28), q4: Math.round(result.financialSummary.rdCreditValue * 0.24), ytd: result.financialSummary.rdCreditValue, confidence: Math.round(result.processingDetails.confidenceScore * 100), source: 'SCAN', trend: [], verified: result.isRdEligible },
        { id: '2', metric: 'Training', q1: Math.round(result.financialSummary.trainingCreditValue * 0.25), q2: Math.round(result.financialSummary.trainingCreditValue * 0.25), q3: Math.round(result.financialSummary.trainingCreditValue * 0.25), q4: Math.round(result.financialSummary.trainingCreditValue * 0.25), ytd: result.financialSummary.trainingCreditValue, confidence: 95, source: 'SCAN', trend: [], verified: result.isTrainingEligible },
        { id: '3', metric: 'Green Energy', q1: Math.round(result.financialSummary.greenEnergyValue * 0.25), q2: Math.round(result.financialSummary.greenEnergyValue * 0.25), q3: Math.round(result.financialSummary.greenEnergyValue * 0.25), q4: Math.round(result.financialSummary.greenEnergyValue * 0.25), ytd: result.financialSummary.greenEnergyValue, confidence: 90, source: 'SCAN', trend: [], verified: result.isGreenEligible },
    ] : [
        { id: '1', metric: 'Gross Payroll', q1: 847000, q2: 892000, q3: 923000, q4: 978000, ytd: 3640000, confidence: 98, source: 'BANK', trend: [], verified: true },
        { id: '2', metric: 'R&D Spend', q1: 156000, q2: 189000, q3: 201000, q4: 234000, ytd: 780000, confidence: 99, source: 'VERIF', trend: [], verified: true },
        { id: '3', metric: 'Cloud/SaaS', q1: 34000, q2: 38000, q3: 42000, q4: 47000, ytd: 161000, confidence: 96, source: 'BANK', trend: [], verified: true },
    ];

    const companyName = result ? `SCAN ${result.analysisId.slice(-6)}` : 'NEXGEN TECHNOLOGIES INC';
    const estCredit = result ? fmtCurrency(result.financialSummary.totalEstimatedValue) : '$234,500';
    const rdStatus = result?.isRdEligible ? 'HIGH' : 'PENDING';
    const rdColor = result?.isRdEligible ? 'text-emerald-400' : 'text-cyan-400';
    const riskLevel = result?.overallRiskLevel?.toUpperCase() || 'LOW';
    const riskColor = result ? (result.overallRiskLevel === 'low' ? 'text-emerald-400' : result.overallRiskLevel === 'medium' ? 'text-amber-400' : 'text-red-400') : 'text-amber-400';

    const getConfidenceColor = (conf: number) => conf >= 95 ? 'bg-emerald-500/20 text-emerald-400' : conf >= 85 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400';

    return (
        <div className={`flex flex-col h-full bg-slate-900 border-r border-slate-700 ${result ? 'ring-2 ring-emerald-500/50 ring-inset' : ''}`}>
            <div className="px-2 py-1 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wider">UNDERWRITING MATRIX</span>
                {result && <span className="text-[8px] px-1 py-0.5 bg-emerald-900/50 text-emerald-400 rounded ml-auto animate-pulse">SCANNED</span>}
            </div>
            <div className="px-2 py-1 bg-slate-800/50 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Building className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-white font-mono">{companyName}</span>
                    {result?.isRdEligible && <span className="text-[8px] px-1 py-0.5 bg-cyan-900/50 text-cyan-400 rounded">R&D</span>}
                    {result?.isTrainingEligible && <span className="text-[8px] px-1 py-0.5 bg-purple-900/50 text-purple-400 rounded">TRAINING</span>}
                    {result?.isGreenEligible && <span className="text-[8px] px-1 py-0.5 bg-emerald-900/50 text-emerald-400 rounded flex items-center gap-0.5"><Leaf className="w-2 h-2" />GREEN</span>}
                </div>
                {result && <div className="text-[8px] text-slate-500 font-mono mt-0.5">{result.processingDetails.totalMatchesFound} MATCHES | {result.processingDetails.uniqueKeywordsFound} KEYWORDS</div>}
            </div>
            <div className="grid grid-cols-3 gap-px bg-slate-700 border-b border-slate-700">
                <div className="bg-slate-800 p-2"><div className="text-[9px] text-slate-500">EST CREDIT</div><div className="text-sm font-bold text-emerald-400 font-mono">{estCredit}</div></div>
                <div className="bg-slate-800 p-2"><div className="text-[9px] text-slate-500">R&D INTENS</div><div className={`text-sm font-bold font-mono ${rdColor}`}>{rdStatus}</div></div>
                <div className="bg-slate-800 p-2"><div className="text-[9px] text-slate-500">RISK</div><div className={`text-sm font-bold font-mono ${riskColor}`}>{riskLevel}</div></div>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-slate-800"><tr className="border-b border-slate-700">
                        <th className="px-2 py-1 text-left text-slate-400 font-mono">METRIC</th>
                        <th className="px-1 py-1 text-right text-slate-400 font-mono">Q1</th>
                        <th className="px-1 py-1 text-right text-slate-400 font-mono">Q2</th>
                        <th className="px-1 py-1 text-right text-slate-400 font-mono">Q3</th>
                        <th className="px-1 py-1 text-right text-slate-400 font-mono">Q4</th>
                        <th className="px-1 py-1 text-right text-slate-400 font-mono">YTD</th>
                        <th className="px-1 py-1 text-center text-slate-400 font-mono">CONF</th>
                    </tr></thead>
                    <tbody>{financials.map(row => (
                        <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="px-2 py-1"><div className="flex items-center gap-1">
                                {row.verified ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                                <span className="text-white">{row.metric}</span>
                            </div></td>
                            <td className="px-1 py-1 text-right text-slate-300 font-mono">{formatCurrency(row.q1)}</td>
                            <td className="px-1 py-1 text-right text-slate-300 font-mono">{formatCurrency(row.q2)}</td>
                            <td className="px-1 py-1 text-right text-slate-300 font-mono">{formatCurrency(row.q3)}</td>
                            <td className="px-1 py-1 text-right text-slate-300 font-mono">{formatCurrency(row.q4)}</td>
                            <td className="px-1 py-1 text-right text-white font-mono font-bold">{formatCurrency(row.ytd)}</td>
                            <td className="px-1 py-1 text-center"><span className={`text-[9px] px-1 py-0.5 rounded ${getConfidenceColor(row.confidence)}`}>{row.confidence}%</span></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
            {result && (
                <div className="bg-emerald-900/20 border-t border-emerald-700/50 px-2 py-1">
                    <div className="text-[9px] text-emerald-400 font-mono">✓ {result.processingDetails.rulesTriggered} RULES TRIGGERED | {result.riskIndicators.length} RISK FLAGS</div>
                </div>
            )}
        </div>
    );
};

const VerificationGauntlet: React.FC<{ onAnalysisComplete?: (result: AnalyzedResult) => void }> = ({ onAnalysisComplete }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeStage, setActiveStage] = useState(0);
    const [stageProgress, setStageProgress] = useState([847, 0, 0, 0, 0]);
    const [showIngestModal, setShowIngestModal] = useState(false);
    const [ingestFlash, setIngestFlash] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const logRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Handle file ingest - run forensic analysis with actual text scanning
    const handleFileIngest = async (file: File) => {
        setShowIngestModal(false);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

        // Initial ingest logs
        const ingestLogs: LogEntry[] = [
            { id: `ingest-${Date.now()}-1`, timestamp: new Date(), level: 'system', message: '>> [SYS] INCOMING DATA STREAM DETECTED...', module: 'SYS' },
            { id: `ingest-${Date.now()}-2`, timestamp: new Date(), level: 'success', message: `>> [INGEST] CAPTURED PAYLOAD: ${file.name} (${sizeMB} MB)`, module: 'INGEST' },
            { id: `ingest-${Date.now()}-3`, timestamp: new Date(), level: 'info', message: '>> [SEC] READING FILE CONTENT...', module: 'SEC' },
        ];
        setLogs(prev => [...prev, ...ingestLogs]);

        // Flash ingest icon
        setIngestFlash(true);
        setTimeout(() => setIngestFlash(false), 2000);
        setStageProgress(prev => [prev[0] + 1, ...prev.slice(1)]);

        // READ THE ACTUAL FILE TEXT (PDF or plain text) and run the rule-based scanner
        let text: string;
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            // Use PDF extraction for PDF files
            setLogs(prev => [...prev, {
                id: `pdf-${Date.now()}`,
                timestamp: new Date(),
                level: 'info',
                message: `>> [PDF] EXTRACTING TEXT FROM ${file.name.toUpperCase()}...`,
                module: 'OCR',
            }]);
            text = await extractPdfText(file);
        } else {
            // Plain text or CSV
            text = await file.text();
        }
        const result = scanFileContent(text);

        // Log the scan result
        setLogs(prev => [...prev, {
            id: `scan-${Date.now()}`,
            timestamp: new Date(),
            level: 'success',
            message: `>> [SCAN] ANALYZED ${result.statistics.totalWords} WORDS, ${result.processingDetails.totalMatchesFound} MATCHES FOUND`,
            module: 'SCAN',
        }]);

        // Animate through stages with analysis results
        let stage = 0;
        const stageInterval = setInterval(() => {
            stage++;
            setActiveStage(stage);
            setStageProgress(prev => {
                const next = [...prev];
                next[stage] = Math.round(prev[0] * (0.95 - stage * 0.1));
                return next;
            });

            // Log stage-specific messages using new result format
            const stageMsgs: Record<number, LogEntry> = {
                1: { id: `stage-1-${Date.now()}`, timestamp: new Date(), level: 'success', message: `>> [SCAN] PROCESSED ${result.source.contentLength} CHARS (${result.processingTimeMs}ms)`, module: 'SCAN' },
                2: { id: `stage-2-${Date.now()}`, timestamp: new Date(), level: result.riskIndicators.length > 3 ? 'warning' : 'success', message: `>> [FRAUD] ${result.riskIndicators.length} RISK FLAGS - LEVEL: ${result.overallRiskLevel.toUpperCase()}`, module: 'FRAUD' },
                3: { id: `stage-3-${Date.now()}`, timestamp: new Date(), level: 'system', message: `>> [RULES] ${result.processingDetails.rulesTriggered}/${result.processingDetails.rulesApplied} RULES TRIGGERED`, module: 'RULES' },
                4: { id: `stage-4-${Date.now()}`, timestamp: new Date(), level: 'success', message: `>> [READY] ESTIMATED VALUE: ${fmtCurrency(result.financialSummary.totalEstimatedValue)}`, module: 'READY' },
            };
            if (stageMsgs[stage]) setLogs(prev => [...prev, stageMsgs[stage]]);

            if (stage >= 4) {
                clearInterval(stageInterval);

                // Log eligibility flags
                if (result.isRdEligible) {
                    setLogs(prev => [...prev, { id: `elig-rd-${Date.now()}`, timestamp: new Date(), level: 'success', message: `>> [ELIGIBLE] R&D TAX CREDIT: ${fmtCurrency(result.financialSummary.rdCreditValue)}`, module: 'GRANT' }]);
                }
                if (result.isTrainingEligible) {
                    setLogs(prev => [...prev, { id: `elig-trn-${Date.now()}`, timestamp: new Date(), level: 'success', message: `>> [ELIGIBLE] TRAINING GRANT: ${fmtCurrency(result.financialSummary.trainingCreditValue)}`, module: 'GRANT' }]);
                }
                if (result.isGreenEligible) {
                    setLogs(prev => [...prev, { id: `elig-grn-${Date.now()}`, timestamp: new Date(), level: 'success', message: `>> [ELIGIBLE] GREEN ENERGY: ${fmtCurrency(result.financialSummary.greenEnergyValue)}`, module: 'GRANT' }]);
                }

                // Log keyword matches
                result.allMatches.slice(0, 5).forEach((match, i) => {
                    setTimeout(() => {
                        setLogs(prev => [...prev, {
                            id: `match-${Date.now()}-${i}`,
                            timestamp: new Date(),
                            level: 'info',
                            message: `>> [MATCH] "${match.keyword}" @ line ${match.lineNumber}`,
                            module: 'SCAN',
                        }]);
                    }, i * 200);
                });

                // Call parent callback with analysis results
                if (onAnalysisComplete) {
                    onAnalysisComplete(result);
                }
            }
        }, 800);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        // Allow any text-readable file (.txt, .pdf, .csv, .json, .md, etc)
        if (file) {
            handleFileIngest(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileIngest(file);
    };

    // Stage-synchronized techno-babble
    const stageLogs: Record<number, Array<{ level: LogEntry['level'], message: string }>> = {
        0: [
            { level: 'info', message: '> CONNECTING TO IRS DATABASE API_V4...' },
            { level: 'success', message: '> [INGEST] BATCH UPLOAD COMPLETE: 847 DOCS' },
            { level: 'info', message: '> VALIDATING DOCUMENT CHECKSUMS...' },
        ],
        1: [
            { level: 'info', message: '> [OCR] PARSING "PAYROLL_Q3.PDF"... CONFIDENCE: 99.4%' },
            { level: 'success', message: '> [OCR] W-2 EXTRACTION: 47 RECORDS MATCHED' },
            { level: 'info', message: '> [OCR] 1099-NEC BATCH PROCESSING...' },
            { level: 'success', message: '> [OCR] BANK STATEMENT RECOGNIZED: CHASE_2024' },
        ],
        2: [
            { level: 'info', message: '> [FRAUD_CHECK] RUNNING ANOMALY DETECTION...' },
            { level: 'warning', message: '> [FRAUD_CHECK] FLAG: CONTRACTOR SPIKE Q3 (+34%)' },
            { level: 'success', message: '> [FRAUD_CHECK] CROSS-REF COMPLETE: NO RED FLAGS' },
            { level: 'info', message: '> [FRAUD_CHECK] PAYROLL VELOCITY: NORMAL' },
        ],
        3: [
            { level: 'system', message: '[AI] GPT-4o VOICE AGENT INITIALIZED' },
            { level: 'info', message: '> [VOICE_AI] DIALING CFO: +1 (555) 847-2910...' },
            { level: 'success', message: '> [VOICE_AI] CONNECTED. VERIFYING R&D ACTIVITIES...' },
            { level: 'success', message: '> [VOICE_AI] CFO CONFIRMED: "Yes, software development"' },
        ],
        4: [
            { level: 'success', message: '>> [READY] DEAL PACKET ASSEMBLED: LEAD-48291' },
            { level: 'system', message: '[SYS] ESTIMATED CREDIT: $234,500 ±$12K' },
            { level: 'success', message: '>> PUSHING TO ARBITRAGE FLOOR...' },
        ],
    };

    const stageNames = ['INGEST', 'OCR', 'FRAUD', 'VOICE', 'READY'];
    const stageIcons = [Upload, Scan, Shield, Mic, FileCheck];

    // Main animation loop - 800ms for fast terminal feel
    useInterval(() => {
        const currentLogs = stageLogs[activeStage];
        const randomLog = currentLogs[Math.floor(Math.random() * currentLogs.length)];

        setLogs(prev => [...prev.slice(-12), {
            id: Date.now().toString(),
            timestamp: new Date(),
            level: randomLog.level,
            message: randomLog.message,
            module: stageNames[activeStage],
        }]);

        // Update stage progress
        setStageProgress(prev => {
            const next = [...prev];
            if (activeStage < 4 && next[activeStage + 1] < 800) {
                next[activeStage + 1] = Math.min(next[activeStage + 1] + Math.floor(Math.random() * 50 + 30), next[activeStage]);
            }
            return next;
        });
    }, 800);

    // Stage cycling - every 4 seconds
    useInterval(() => {
        setActiveStage(prev => (prev + 1) % 5);
    }, 4000);

    // Auto-scroll log
    React.useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    const getStageStatus = (idx: number) => {
        if (idx < activeStage) return 'complete';
        if (idx === activeStage) return 'active';
        return 'pending';
    };

    const getColor = (status: string, idx?: number) => {
        // Special flash for ingest
        if (idx === 0 && ingestFlash) return 'border-emerald-400 bg-emerald-500/40 shadow-lg shadow-emerald-500/30';
        if (status === 'complete') return 'border-emerald-500 bg-emerald-900/30';
        if (status === 'active') return 'border-cyan-400 bg-cyan-900/40 animate-pulse shadow-lg shadow-cyan-500/20';
        return 'border-slate-600 bg-slate-800';
    };

    const logColor = (l: string) => l === 'success' ? 'text-emerald-400' : l === 'warning' ? 'text-amber-400' : l === 'system' ? 'text-cyan-400' : 'text-slate-400';

    return (
        <div className="flex flex-col h-full bg-slate-900">
            <div className="px-3 py-1 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wider">VERIFICATION GAUNTLET</span>
                <span className="text-[9px] px-2 py-0.5 bg-cyan-900/50 text-cyan-400 rounded font-mono ml-2">LEAD-48291</span>
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 p-3 border-r border-slate-700 flex items-center justify-between">
                    {stageNames.map((name, idx) => {
                        const status = getStageStatus(idx);
                        const Icon = stageIcons[idx];
                        const isClickable = idx === 0; // Only INGEST is clickable
                        return (
                            <React.Fragment key={idx}>
                                <div
                                    onClick={isClickable ? () => setShowIngestModal(true) : undefined}
                                    className={`flex flex-col items-center p-2 rounded border-2 transition-all duration-300 ${getColor(status, idx)} min-w-[90px] ${isClickable ? 'cursor-pointer hover:border-emerald-400 hover:bg-emerald-900/20' : ''}`}
                                >
                                    <Icon className={`w-5 h-5 mb-1 transition-colors ${ingestFlash && idx === 0 ? 'text-emerald-300' : status === 'complete' ? 'text-emerald-400' : status === 'active' ? 'text-cyan-300' : 'text-slate-500'}`} />
                                    <div className="text-[9px] font-bold text-white">{name}</div>
                                    <div className="text-[8px] text-slate-400 font-mono">{stageProgress[idx] > 0 ? stageProgress[idx] : '--'}</div>
                                    {status === 'active' && <div className="mt-1 flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" /></div>}
                                    {ingestFlash && idx === 0 && <div className="mt-1 text-[7px] text-emerald-400 font-mono animate-pulse">RECEIVED</div>}
                                </div>
                                {idx < 4 && (
                                    <div className="flex items-center">
                                        <div className={`h-0.5 w-6 transition-colors ${idx < activeStage ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                        <ChevronRight className={`w-3 h-3 transition-colors ${idx < activeStage ? 'text-emerald-500' : 'text-slate-600'}`} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                <div className="w-[350px] bg-slate-950 flex flex-col">
                    <div className="px-2 py-1 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                        <Terminal className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-white font-mono">LOG</span>
                    </div>
                    <div ref={logRef} className="flex-1 overflow-auto p-2 font-mono text-[10px] scroll-smooth">
                        {logs.map((log, i) => (
                            <div key={log.id} className={`flex items-start gap-2 mb-1 ${i === logs.length - 1 ? 'animate-pulse' : ''}`}>
                                <span className="text-slate-600 flex-shrink-0">{log.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{String(log.timestamp.getMilliseconds()).padStart(3, '0').slice(0, 2)}</span>
                                <span className={logColor(log.level)}>{log.message}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1 mt-2"><span className="text-emerald-400">$</span><span className="text-slate-500 animate-pulse">█</span></div>
                    </div>
                </div>
            </div>

            {/* INGEST MODAL */}
            {showIngestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowIngestModal(false)}>
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
                    <div
                        className="relative bg-slate-900 border-2 border-emerald-500/50 rounded-lg p-6 w-[480px] shadow-2xl shadow-emerald-500/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Upload className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm font-bold text-white tracking-wider">SECURE FILE INGEST</span>
                            </div>
                            <button onClick={() => setShowIngestModal(false)} className="text-slate-500 hover:text-white">
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>

                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragging
                                ? 'border-emerald-400 bg-emerald-900/20'
                                : 'border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/50'
                                }`}
                        >
                            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <div className="text-sm font-bold text-white mb-1">SECURE DROP // FINANCIAL PAYLOADS ONLY</div>
                            <div className="text-xs text-slate-500 mb-3">Drag files here or click to browse</div>
                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">
                                <span className="px-2 py-1 bg-slate-800 rounded">.PDF</span>
                                <span className="px-2 py-1 bg-slate-800 rounded">.CSV</span>
                                <span className="px-2 py-1 bg-slate-800 rounded">.JSON</span>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.csv,.json"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="mt-4 flex items-center justify-between text-[9px] text-slate-600 font-mono">
                            <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                <span>AES-256 ENCRYPTED CHANNEL</span>
                            </div>
                            <span>MAX SIZE: 50MB</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ArbitrageFloorProps {
    bids: MarketBid[];
    selectedDeal: Lead | null;
    onSell: (bid: MarketBid) => void;
    totalVolume: number;
}

const ArbitrageFloor: React.FC<ArbitrageFloorProps> = ({ bids, selectedDeal, onSell, totalVolume }) => {
    const [selling, setSelling] = useState<string | null>(null);

    const handleSell = async (bid: MarketBid) => {
        setSelling(bid.id);
        await new Promise(r => setTimeout(r, 800)); // Simulate processing
        onSell(bid);
        setSelling(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
            <div className="px-2 py-1 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /><span className="text-xs font-bold text-white tracking-wider">ARBITRAGE FLOOR</span></div>
                <div className="flex items-center gap-1"><Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" /><span className="text-[9px] text-emerald-400 font-mono">LIVE</span></div>
            </div>
            <div className="grid grid-cols-3 gap-px bg-slate-700 border-b border-slate-700">
                <div className="bg-slate-800 p-2 text-center"><div className="text-[9px] text-slate-500">VOLUME</div><div className="text-sm font-bold text-emerald-400 font-mono">{formatBidAmount(totalVolume)}</div></div>
                <div className="bg-slate-800 p-2 text-center"><div className="text-[9px] text-slate-500">BIDS</div><div className="text-sm font-bold text-white font-mono">{bids.length}</div></div>
                <div className="bg-slate-800 p-2 text-center"><div className="text-[9px] text-slate-500">SPREAD</div><div className="text-sm font-bold text-cyan-400 font-mono">{bids.length > 0 ? `${Math.round(bids[0]?.metadata?.spreadPercentage || 0)}%` : '--'}</div></div>
            </div>
            <div className="flex-1 overflow-auto">
                {!selectedDeal ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <Database className="w-8 h-8 text-slate-600 mb-2" />
                        <div className="text-[10px] text-slate-500 font-mono">MARKET STANDBY</div>
                        <div className="text-[9px] text-slate-600 font-mono mt-1">SELECT INVENTORY TO GENERATE BIDS</div>
                    </div>
                ) : bids.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                        <div className="text-[10px] text-slate-400 font-mono">GENERATING BIDS...</div>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {bids.map((bid, idx) => (
                            <div key={bid.id} className={`p-2 rounded border ${idx === 0 ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-slate-800/50 border-slate-700/50'} hover:bg-slate-800`}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] px-1 py-0.5 rounded ${getTierColor(bid.firmTier)} bg-slate-800`}>{getTierBadge(bid.firmTier)}</span>
                                        <span className="text-white text-[11px] font-medium">{bid.firmName}</span>
                                    </div>
                                    {idx === 0 && <span className="text-[7px] px-1 py-0.5 bg-emerald-500 text-white rounded font-bold">TOP BID</span>}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-emerald-400 font-mono font-bold text-sm">{formatBidAmount(bid.bidAmount)}</div>
                                        <div className="text-[8px] text-slate-500">{bid.bidPercentage}% • {bid.metadata.estimatedCloseTime}d close</div>
                                    </div>
                                    <button
                                        onClick={() => handleSell(bid)}
                                        disabled={selling !== null}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${selling === bid.id
                                            ? 'bg-amber-600 text-white cursor-wait'
                                            : 'bg-red-600 hover:bg-red-500 text-white hover:scale-105'
                                            }`}
                                    >
                                        {selling === bid.id ? 'SELLING...' : 'SELL'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {selectedDeal && bids.length > 0 && (
                <div className="bg-slate-800 border-t border-slate-700 px-2 py-1.5 text-center">
                    <div className="text-[9px] text-slate-400 font-mono">SELLING: <span className="text-white">{selectedDeal.company}</span></div>
                    <div className="text-[8px] text-slate-500 font-mono">VALUE: {formatCurrency(selectedDeal.estValue)}</div>
                </div>
            )}
        </div>
    );
};

interface LeadGridProps {
    vaultDeals: Deal[];
    selectedId: string | null;
    onSelectLead: (lead: Lead) => void;
}

const LeadGrid: React.FC<LeadGridProps> = ({ vaultDeals, selectedId, onSelectLead }) => {
    // Combine static leads with vault deals
    const staticLeads: Lead[] = [
        { id: 'L-48291', company: 'NexGen Tech', ein: '82-4729103', sector: 'SaaS', eligibility: 94, estValue: 234500, stage: 4, priority: 'critical', timestamp: new Date() },
        { id: 'L-48290', company: 'Quantum Labs', ein: '91-2847291', sector: 'Biotech', eligibility: 87, estValue: 189000, stage: 3, priority: 'high', timestamp: new Date() },
    ];

    // Convert vault deals to Lead format
    const vaultLeads: Lead[] = vaultDeals.map((d, i) => ({
        id: `V-${d.id || i}`,
        company: d.company,
        ein: '-- VAULT --',
        sector: 'DB',
        eligibility: 95,
        estValue: d.value,
        stage: d.status === 'VERIFIED' ? 5 : 4,
        priority: d.value > 200000 ? 'critical' : d.value > 100000 ? 'high' : 'medium',
        timestamp: new Date(d.created_at || Date.now()),
        dbId: d.id, // Store original DB id for sale execution
    }));

    const leads = [...vaultLeads, ...staticLeads];
    const prioColor = (p: string) => p === 'critical' ? 'bg-red-500/20 text-red-400' : p === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400';

    return (
        <div className="bg-slate-900 border-t border-slate-700">
            <div className="px-3 py-1 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white tracking-wider">ACTIVE PIPELINE</span>
                <span className="text-[9px] px-2 py-0.5 bg-amber-900/50 text-amber-400 rounded font-mono">{leads.length}</span>
                {vaultDeals.length > 0 && <span className="text-[8px] px-1 py-0.5 bg-emerald-900/50 text-emerald-400 rounded font-mono ml-1">VAULT: {vaultDeals.length}</span>}
                <span className="text-[8px] text-slate-500 ml-auto">CLICK TO SELECT</span>
            </div>
            <div className="overflow-x-auto max-h-[140px]">
                <table className="w-full text-[10px]">
                    <thead className="bg-slate-800 sticky top-0"><tr className="border-b border-slate-700">
                        <th className="px-3 py-1.5 text-left text-slate-400 font-mono">ID</th>
                        <th className="px-3 py-1.5 text-left text-slate-400 font-mono">COMPANY</th>
                        <th className="px-3 py-1.5 text-center text-slate-400 font-mono">ELIG</th>
                        <th className="px-3 py-1.5 text-right text-slate-400 font-mono">VALUE</th>
                        <th className="px-3 py-1.5 text-center text-slate-400 font-mono">STAGE</th>
                        <th className="px-3 py-1.5 text-center text-slate-400 font-mono">PRIO</th>
                    </tr></thead>
                    <tbody>{leads.map(lead => (
                        <tr
                            key={lead.id}
                            onClick={() => onSelectLead(lead)}
                            className={`border-b border-slate-800 cursor-pointer transition-colors ${selectedId === lead.id
                                ? 'bg-cyan-900/30 ring-1 ring-cyan-500/50 ring-inset'
                                : 'hover:bg-slate-800/50'
                                }`}
                        >
                            <td className="px-3 py-1.5 text-cyan-400 font-mono font-bold">{lead.id}</td>
                            <td className="px-3 py-1.5 text-white">{lead.company}</td>
                            <td className="px-3 py-1.5 text-center"><div className="flex items-center justify-center gap-1"><div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${lead.eligibility >= 90 ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${lead.eligibility}%` }} /></div><span className="text-white font-mono">{lead.eligibility}%</span></div></td>
                            <td className="px-3 py-1.5 text-right text-emerald-400 font-mono font-bold">{formatCurrency(lead.estValue)}</td>
                            <td className="px-3 py-1.5 text-center"><div className="flex items-center justify-center gap-0.5">{[1, 2, 3, 4, 5].map(s => <div key={s} className={`w-2.5 h-2.5 rounded-sm ${s <= lead.stage ? 'bg-emerald-500' : 'bg-slate-700'}`} />)}</div></td>
                            <td className="px-3 py-1.5 text-center"><span className={`text-[8px] px-1.5 py-0.5 rounded ${prioColor(lead.priority)}`}>{lead.priority.toUpperCase()}</span></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
};

function TerminalApp() {
    const [activeResult, setActiveResult] = useState<AnalyzedResult | null>(null);
    const [dashboardFlash, setDashboardFlash] = useState(false);
    const [vaultDeals, setVaultDeals] = useState<Deal[]>([]);
    const [vaultError, setVaultError] = useState<string | null>(null);

    // Marketplace state
    const [selectedDeal, setSelectedDeal] = useState<Lead | null>(null);
    const [activeBids, setActiveBids] = useState<MarketBid[]>([]);
    const [totalVolume, setTotalVolume] = useState(847000); // Starting volume
    const [saleToast, setSaleToast] = useState<string | null>(null);

    // Fetch existing deals from Supabase on load
    useEffect(() => {
        const fetchDeals = async () => {
            const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
            if (error) {
                console.error('[VAULT] Supabase error:', error.message);
                setVaultError(`VAULT ERROR: ${error.message}`);
            } else if (data) {
                setVaultDeals(data as Deal[]);
                console.log(`[VAULT] Loaded ${data.length} deals from Supabase`);
            }
        };
        fetchDeals();
    }, []);

    // Handle lead selection - generate bids
    const handleSelectLead = (lead: Lead) => {
        console.log(`[MARKET] Selected lead: ${lead.company} (${lead.id})`);
        setSelectedDeal(lead);
        setActiveBids([]); // Clear old bids

        // Generate new bids after a brief delay
        setTimeout(() => {
            const bids = generateMarketBids(lead.estValue, {
                dealId: lead.id,
                costBasis: lead.estValue * 0.008,
            });
            setActiveBids(bids);
            console.log(`[MARKET] Generated ${bids.length} bids for ${lead.company}`);
        }, 600);
    };

    // Handle sale execution
    const handleSell = async (bid: MarketBid) => {
        if (!selectedDeal) return;

        console.log(`[SALE] Executing sale to ${bid.firmName} for $${bid.bidAmount}`);

        // Get the database ID if this is a vault deal
        const dbId = (selectedDeal as Lead & { dbId?: number }).dbId;

        if (dbId) {
            // Execute real sale in database
            const result = await executeSale(dbId, bid.firmName, bid.bidAmount);
            if (result.success) {
                console.log(`[SALE] Transaction ${result.transactionId} complete!`);
                // Remove from vault deals
                setVaultDeals(prev => prev.filter(d => d.id !== dbId));
            } else {
                console.error(`[SALE] Failed: ${result.error}`);
            }
        }

        // Update volume ticker
        setTotalVolume(prev => prev + bid.bidAmount);

        // Show toast
        setSaleToast(`SOLD TO ${bid.firmName.toUpperCase()} FOR ${formatBidAmount(bid.bidAmount)}`);
        setTimeout(() => setSaleToast(null), 4000);

        // Clear selection
        setSelectedDeal(null);
        setActiveBids([]);

        // Flash dashboard
        setDashboardFlash(true);
        setTimeout(() => setDashboardFlash(false), 1500);
    };

    const handleAnalysisComplete = async (result: AnalyzedResult) => {
        setActiveResult(result);
        // Flash the dashboard
        setDashboardFlash(true);
        setTimeout(() => setDashboardFlash(false), 1500);

        // Save to Supabase
        const { error } = await supabase.from('deals').insert([{
            company: `SCAN-${result.analysisId.slice(-6)}`,
            value: result.financialSummary.totalEstimatedValue,
            status: result.isRdEligible ? 'RD_ELIGIBLE' : 'VERIFIED',
            packet_id: result.analysisId,
            risk_score: result.overallRiskLevel === 'low' ? 25 : result.overallRiskLevel === 'medium' ? 50 : 75,
            anomaly_count: result.riskIndicators.length,
        }]);

        if (error) {
            console.error('[VAULT] INSERT failed:', error.message);
            setVaultError(`INSERT FAILED: ${error.message}`);
        } else {
            console.log('[VAULT] Deal saved to Supabase');
            // Refresh the deals list
            const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
            if (data) setVaultDeals(data as Deal[]);
        }
    };

    return (
        <div className={`h-screen w-screen bg-slate-950 flex flex-col overflow-hidden transition-all duration-300 ${dashboardFlash ? 'ring-4 ring-emerald-500/30 ring-inset' : ''}`}>
            <GlobalCommandHeader />

            {/* Sale Toast */}
            {saleToast && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-2xl shadow-emerald-500/30 animate-pulse">
                    ✓ {saleToast}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                <div className="w-[340px] flex-shrink-0"><UnderwritingMatrix result={activeResult} /></div>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0"><LeadGrid vaultDeals={vaultDeals} selectedId={selectedDeal?.id || null} onSelectLead={handleSelectLead} /></div>
                    <div className="flex-1 grid grid-cols-2 gap-px bg-slate-700 overflow-hidden">
                        <div className="bg-slate-900 p-2"><div className="flex items-center gap-1 mb-2"><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-[10px] font-bold text-white">VELOCITY</span></div><div className="h-32"><ResponsiveContainer width="100%" height="100%"><AreaChart data={Array.from({ length: 24 }, (_, i) => ({ h: i, v: 80 + Math.random() * 60 }))}><defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="h" tick={{ fontSize: 8 }} stroke="#475569" /><YAxis tick={{ fontSize: 8 }} stroke="#475569" /><Area type="monotone" dataKey="v" stroke="#10b981" fill="url(#vg)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
                        <div className="bg-slate-900 p-2"><div className="flex items-center gap-1 mb-2"><Target className="w-3 h-3 text-amber-400" /><span className="text-[10px] font-bold text-white">CONVERSION</span></div><div className="h-32 flex flex-col justify-center gap-1">{[{ s: 'INGEST', v: 1247, p: 100 }, { s: 'QUALIFY', v: 892, p: 71 }, { s: 'VERIFY', v: 634, p: 51 }, { s: 'SOLD', v: 342, p: 27 }].map(i => <div key={i.s} className="flex items-center gap-2"><span className="text-[8px] text-slate-500 w-10 font-mono">{i.s}</span><div className="flex-1 h-2.5 bg-slate-800 rounded overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded" style={{ width: `${i.p}%` }} /></div><span className="text-[9px] text-white font-mono w-8 text-right">{i.v}</span></div>)}</div></div>
                    </div>
                    <div className="h-[180px] flex-shrink-0 border-t border-slate-700"><VerificationGauntlet onAnalysisComplete={handleAnalysisComplete} /></div>
                </div>
                <div className="w-[280px] flex-shrink-0"><ArbitrageFloor bids={activeBids} selectedDeal={selectedDeal} onSell={handleSell} totalVolume={totalVolume} /></div>
            </div>
            <footer className="bg-slate-900 border-t border-slate-700 px-3 py-1 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[9px] font-mono">
                    <div className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${activeResult ? 'bg-emerald-400' : 'bg-emerald-500'} animate-pulse`} /><span className="text-slate-400">{activeResult ? 'SCAN ACTIVE' : 'SYSTEMS NOMINAL'}</span></div>
                    {activeResult && <span className="text-emerald-400">ID: {activeResult.analysisId}</span>}
                    {activeResult?.isRdEligible && <span className="text-cyan-400">R&D: ELIGIBLE</span>}
                    {vaultError && <span className="text-red-400">{vaultError}</span>}
                    <span className="text-cyan-400">VAULT: {vaultDeals.length} DEALS</span>
                    <span className="text-emerald-400">VOLUME: {formatBidAmount(totalVolume)}</span>
                    <span className="text-slate-500">UPTIME: <span className="text-white">99.97%</span></span>
                </div>
                <div className="text-[9px] font-mono text-slate-500">© 2026 GRANTFLOW</div>
            </footer>
        </div>
    );
}

// ============================================================================
// ROOT APP WITH VIEW TOGGLE + GATEKEEPER AUTHENTICATION
// ============================================================================

// Gatekeeper Modal Component
const GatekeeperModal: React.FC<{
    onAuthenticate: () => void;
    onCancel: () => void;
}> = ({ onAuthenticate, onCancel }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code === 'PROFIT_2026') {
            onAuthenticate();
        } else {
            setError(true);
            setShake(true);
            setCode('');
            setTimeout(() => setShake(false), 500);
            setTimeout(() => setError(false), 3000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Dark backdrop - no click to close */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <div className={`relative w-[420px] bg-gradient-to-b from-slate-900 to-slate-950 border border-red-900/50 rounded-lg shadow-2xl shadow-red-900/20 overflow-hidden ${shake ? 'animate-pulse' : ''}`}>
                {/* Danger stripe header */}
                <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

                {/* Classified header */}
                <div className="bg-red-950/30 border-b border-red-900/30 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-900/50 border border-red-700/50 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-red-400 font-mono text-sm tracking-widest uppercase">Classified Access</h2>
                            <p className="text-slate-500 text-xs font-mono">TERMINAL SECURITY PROTOCOL</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-red-400 font-mono text-xs tracking-wider">RESTRICTED ZONE</span>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <p className="text-slate-400 text-sm">Enter authorization code to access Terminal</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="relative mb-4">
                            <input
                                ref={inputRef}
                                type="password"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="••••••••••"
                                className={`w-full bg-slate-800/50 border ${error ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-700'} rounded-lg px-4 py-3 text-white font-mono text-center tracking-[0.5em] text-lg placeholder:text-slate-600 placeholder:tracking-[0.3em] focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                                autoComplete="off"
                            />
                            {error && (
                                <div className="absolute -bottom-5 left-0 right-0 text-center">
                                    <span className="text-red-500 text-xs font-mono animate-pulse">⚠ ACCESS DENIED</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-mono text-sm rounded-lg transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-mono text-sm font-bold rounded-lg shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Terminal className="w-4 h-4" />
                                AUTHENTICATE
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="bg-slate-900/50 border-t border-slate-800 px-6 py-3 flex items-center justify-between">
                    <span className="text-slate-600 text-[10px] font-mono">GRANTFLOW SECURITY v2.0</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-slate-600 text-[10px] font-mono">ARMED</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AppWithViewToggle() {
    const [viewMode, setViewMode] = useState<'TERMINAL' | 'PUBLIC'>('PUBLIC'); // Default to PUBLIC
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleToggle = () => {
        if (viewMode === 'TERMINAL') {
            // Switching to PUBLIC - always allowed
            setViewMode('PUBLIC');
        } else {
            // Switching to TERMINAL - check auth
            if (isAuthenticated) {
                setViewMode('TERMINAL');
            } else {
                setShowAuthModal(true);
            }
        }
    };

    const handleAuthenticate = () => {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setViewMode('TERMINAL');
    };

    const handleCancelAuth = () => {
        setShowAuthModal(false);
    };

    return (
        <>
            {viewMode === 'TERMINAL' ? <TerminalApp key="terminal" /> : <PublicLanding key="public" />}

            {/* Auth Modal */}
            {showAuthModal && (
                <GatekeeperModal
                    onAuthenticate={handleAuthenticate}
                    onCancel={handleCancelAuth}
                />
            )}

            {/* Dev Switch Button */}
            <button
                onClick={handleToggle}
                className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg shadow-lg transition-all hover:scale-105 ${viewMode === 'TERMINAL'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/30'
                    : 'bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-red-500/30'
                    }`}
            >
                {viewMode === 'TERMINAL' ? (
                    <>
                        <Eye className="w-4 h-4" />
                        VIEW PUBLIC
                    </>
                ) : (
                    <>
                        <Shield className="w-4 h-4" />
                        ACCESS TERMINAL
                    </>
                )}
            </button>
        </>
    );
}
