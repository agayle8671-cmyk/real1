import React, { useState, useCallback, useRef } from 'react';
import {
    Upload,
    CheckCircle,
    Shield,
    FileText,
    ArrowRight,
    Users,
    Award,
    ChevronRight,
    AlertCircle,
    Sparkles,
    Building2,
    Star,
    Phone,
    Mail,
    Lock,
    TrendingUp,
    DollarSign,
    Loader2,
    Check,
    HelpCircle,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { scanFileContent, formatCurrency } from './forensicEngine';
import extractPdfText from './lib/pdfReader';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ScanResult {
    isRdEligible: boolean;
    isTrainingEligible: boolean;
    isGreenEligible: boolean;
    totalEstimatedValue: number;
    rdCreditValue: number;
    trainingCreditValue: number;
    greenEnergyValue: number;
    matchCount: number;
    confidence: number;
}

type UploadState = 'idle' | 'scanning' | 'success' | 'error' | 'no_results';

// ============================================================================
// COMPONENTS
// ============================================================================

// Header Component
const Header: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-gray-900">GrantFlow</span>
                            <span className="text-xs text-gray-500 block -mt-1">Tax Credit Solutions</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">How It Works</a>
                        <a href="#programs" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">Programs</a>
                        <a href="#faq" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">FAQ</a>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <button className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 transition-colors">Sign In</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm">Get Started</button>
                    </div>

                    <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

// Trust Badge
const TrustBadge: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="flex items-center gap-2 text-gray-600">
        <span className="text-blue-600">{icon}</span>
        <span className="text-sm font-medium">{text}</span>
    </div>
);

// Stats Component
const StatCard: React.FC<{ value: string; label: string; icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="text-center px-6 py-4">
        <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-blue-600">{icon}</span>
            <span className="text-3xl font-bold text-gray-900">{value}</span>
        </div>
        <span className="text-sm text-gray-500">{label}</span>
    </div>
);

// Progress Step
const ProgressStep: React.FC<{ step: number; label: string; active: boolean; complete: boolean }> = ({ step, label, active, complete }) => (
    <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${complete ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {complete ? <Check className="w-4 h-4" /> : step}
        </div>
        <span className={`text-sm font-medium ${active || complete ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
);

// File Drop Zone
const FileDropZone: React.FC<{
    onFileSelect: (file: File) => void;
    uploadState: UploadState;
    scanProgress: number;
    dragActive: boolean;
    setDragActive: (active: boolean) => void;
}> = ({ onFileSelect, uploadState, scanProgress, dragActive, setDragActive }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, [setDragActive]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
    }, [onFileSelect, setDragActive]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
    };

    if (uploadState === 'scanning') {
        return (
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Documents...</h3>
                <p className="text-gray-500 mb-6">Our AI is scanning for qualifying expenses</p>

                <div className="max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Scanning</span><span>{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className={`flex items-center gap-3 ${scanProgress >= 30 ? 'text-green-600' : 'text-gray-400'}`}>
                            {scanProgress >= 30 ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                            <span className="text-sm">Document parsing complete</span>
                        </div>
                        <div className={`flex items-center gap-3 ${scanProgress >= 60 ? 'text-green-600' : scanProgress >= 30 ? 'text-blue-600' : 'text-gray-400'}`}>
                            {scanProgress >= 60 ? <Check className="w-4 h-4" /> : scanProgress >= 30 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4" />}
                            <span className="text-sm">Identifying qualifying activities</span>
                        </div>
                        <div className={`flex items-center gap-3 ${scanProgress >= 100 ? 'text-green-600' : scanProgress >= 60 ? 'text-blue-600' : 'text-gray-400'}`}>
                            {scanProgress >= 100 ? <Check className="w-4 h-4" /> : scanProgress >= 60 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4" />}
                            <span className="text-sm">Calculating potential credits</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`bg-white rounded-2xl border-2 border-dashed p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${dragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.csv,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileInput} />
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Upload className={`w-10 h-10 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{dragActive ? 'Drop your file here' : 'Drop your file here or click to browse'}</h3>
            <p className="text-gray-500 mb-4">Upload financial documents, payroll records, or expense reports</p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-400">
                <span className="px-2 py-1 bg-gray-100 rounded">.txt</span>
                <span className="px-2 py-1 bg-gray-100 rounded">.csv</span>
                <span className="px-2 py-1 bg-gray-100 rounded">.pdf</span>
            </div>
            <p className="text-xs text-gray-400 mt-4"><Lock className="w-3 h-3 inline mr-1" />256-bit SSL encrypted • Your data is secure</p>
        </div>
    );
};

// Success Card
const SuccessCard: React.FC<{ result: ScanResult; fileName: string; onReset: () => void; onConnect: () => void }> = ({ result, fileName, onReset, onConnect }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-1">Potential Credit Identified!</h3>
            <p className="text-green-100">Based on our preliminary analysis</p>
        </div>

        <div className="px-6 py-8 text-center border-b border-gray-100">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Estimated Total Value</p>
            <p className="text-5xl font-bold text-gray-900 mb-2">{formatCurrency(result.totalEstimatedValue)}</p>
            <p className="text-sm text-gray-500">Confidence: {Math.round(result.confidence * 100)}%</p>
        </div>

        <div className="px-6 py-6 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Credit Breakdown</h4>

            {result.isRdEligible && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Sparkles className="w-5 h-5 text-blue-600" /></div>
                        <div><p className="font-medium text-gray-900">R&D Tax Credit</p><p className="text-sm text-gray-500">IRC Section 41</p></div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(result.rdCreditValue)}</p>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Eligible</span>
                    </div>
                </div>
            )}

            {result.isTrainingEligible && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Award className="w-5 h-5 text-purple-600" /></div>
                        <div><p className="font-medium text-gray-900">Training Credit</p><p className="text-sm text-gray-500">Education Assistance</p></div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(result.trainingCreditValue)}</p>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Eligible</span>
                    </div>
                </div>
            )}

            {result.isGreenEligible && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                        <div><p className="font-medium text-gray-900">Energy Efficiency</p><p className="text-sm text-gray-500">Section 179D</p></div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(result.greenEnergyValue)}</p>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Eligible</span>
                    </div>
                </div>
            )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" /><span className="truncate max-w-[200px]">{fileName}</span>
            </div>
            <button onClick={onReset} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Scan Another File</button>
        </div>

        <div className="px-6 py-6 bg-gray-50 border-t border-gray-100">
            <button onClick={onConnect} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />Connect with a Tax Expert<ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-center text-sm text-gray-500 mt-3">Free consultation • No obligation</p>
        </div>
    </div>
);

// No Results Card
const NoResultsCard: React.FC<{ onReset: () => void }> = ({ onReset }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Credits Detected</h3>
        <p className="text-gray-500 mb-6">Try uploading different financial records.</p>
        <button onClick={onReset} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Try Another Document</button>
    </div>
);

// Error Card
const ErrorCard: React.FC<{ error: string; onReset: () => void }> = ({ error, onReset }) => (
    <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Something Went Wrong</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={onReset} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Try Again</button>
    </div>
);

// How It Works Section
const HowItWorks: React.FC = () => {
    const steps = [
        { step: 1, title: 'Upload Documents', description: 'Securely upload your financial records.', icon: <Upload className="w-6 h-6" /> },
        { step: 2, title: 'AI Analysis', description: 'Our AI scans for qualifying activities.', icon: <Sparkles className="w-6 h-6" /> },
        { step: 3, title: 'Expert Review', description: 'A certified professional reviews your case.', icon: <Users className="w-6 h-6" /> },
        { step: 4, title: 'Claim Credits', description: 'File with confidence and receive credits.', icon: <DollarSign className="w-6 h-6" /> },
    ];

    return (
        <section id="how-it-works" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                    <p className="text-lg text-gray-600">Simple and streamlined process</p>
                </div>
                <div className="grid md:grid-cols-4 gap-8">
                    {steps.map((item) => (
                        <div key={item.step} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-4">{item.icon}</div>
                            <span className="text-xs font-semibold text-blue-600 uppercase">Step {item.step}</span>
                            <h3 className="text-lg font-semibold text-gray-900 mt-1 mb-2">{item.title}</h3>
                            <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Programs Section
const Programs: React.FC = () => {
    const programs = [
        { title: 'R&D Tax Credit', code: 'IRC §41', value: 'Up to $250,000/year', icon: <Sparkles className="w-6 h-6" />, color: 'blue' },
        { title: 'Employee Retention', code: 'ERC', value: 'Up to $26,000/employee', icon: <Users className="w-6 h-6" />, color: 'purple' },
        { title: 'Energy Efficiency', code: '§179D', value: 'Up to $5/sq ft', icon: <TrendingUp className="w-6 h-6" />, color: 'green' },
        { title: 'Work Opportunity', code: 'WOTC', value: 'Up to $9,600/employee', icon: <Award className="w-6 h-6" />, color: 'amber' },
    ];

    const colors: Record<string, string> = { blue: 'bg-blue-100 text-blue-600', purple: 'bg-purple-100 text-purple-600', green: 'bg-green-100 text-green-600', amber: 'bg-amber-100 text-amber-600' };

    return (
        <section id="programs" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tax Credit Programs</h2>
                    <p className="text-lg text-gray-600">Multiple federal and state programs</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {programs.map((p) => (
                        <div key={p.code} className="rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-lg ${colors[p.color]} flex items-center justify-center`}>{p.icon}</div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{p.title} <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{p.code}</span></h3>
                                    <p className={`text-sm font-semibold mt-2 ${colors[p.color].split(' ')[1]}`}>{p.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Testimonials
const Testimonials: React.FC = () => {
    const testimonials = [
        { quote: "GrantFlow helped us identify $127,000 in R&D credits we didn't know we qualified for.", author: "Sarah Chen", title: "CFO, TechStart Inc.", avatar: "SC" },
        { quote: "Their team found legitimate credits that our accountant had missed for years.", author: "Michael Rodriguez", title: "Owner, Rodriguez Mfg", avatar: "MR" },
        { quote: "Professional, thorough, and they deliver on their promises.", author: "Jennifer Walsh", title: "CEO, GreenBuild", avatar: "JW" },
    ];

    return (
        <section className="py-20 bg-blue-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Trusted by Growing Businesses</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}</div>
                            <p className="text-gray-600 mb-6 italic">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">{t.avatar}</div>
                                <div><p className="font-semibold text-gray-900">{t.author}</p><p className="text-sm text-gray-500">{t.title}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// FAQ Section
const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const faqs = [
        { question: "What documents do I need?", answer: "Financial statements, payroll records, or expense reports." },
        { question: "Is my data secure?", answer: "We use 256-bit SSL encryption and SOC 2 compliance." },
        { question: "How accurate is the estimate?", answer: "Our AI provides preliminary estimates; a tax professional will give final assessment." },
        { question: "What if I've already filed?", answer: "Many credits can be claimed retroactively via amended returns." },
        { question: "How much does it cost?", answer: "The scan is free. Full-service fees are only a percentage of credits we find." },
    ];

    return (
        <section id="faq" className="py-20 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <button className="w-full px-6 py-4 flex items-center justify-between text-left" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                                <span className="font-semibold text-gray-900">{faq.question}</span>
                                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === i ? 'rotate-90' : ''}`} />
                            </button>
                            {openIndex === i && <div className="px-6 pb-4"><p className="text-gray-600">{faq.answer}</p></div>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Footer
const Footer: React.FC = () => (
    <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
                    <span className="text-xl font-bold text-white">GrantFlow</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-2"><Phone className="w-4 h-4" />1-800-GRANTS</span>
                    <span className="flex items-center gap-2"><Mail className="w-4 h-4" />hello@grantflow.com</span>
                    <span className="flex items-center gap-2"><Building2 className="w-4 h-4" />San Francisco, CA</span>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">© 2024 GrantFlow. All rights reserved.</div>
        </div>
    </footer>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PublicLanding: React.FC = () => {
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [scanProgress, setScanProgress] = useState(0);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [fileName, setFileName] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');

    const handleFileSelect = useCallback(async (file: File) => {
        setFileName(file.name);
        setUploadState('scanning');
        setScanProgress(0);
        setError('');

        try {
            // Extract text from file (PDF or plain text)
            let text: string;
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                // PDF extraction
                text = await extractPdfText(file);
            } else {
                // Plain text/CSV
                text = await file.text();
            }

            // Animate progress
            const interval = setInterval(() => {
                setScanProgress(p => p >= 100 ? 100 : p + Math.random() * 15 + 5);
            }, 300);

            await new Promise(r => setTimeout(r, 3000));
            clearInterval(interval);
            setScanProgress(100);

            // Scan with the rule engine
            const analysisResult = scanFileContent(text);

            // Convert to ScanResult format
            const result: ScanResult = {
                isRdEligible: analysisResult.isRdEligible,
                isTrainingEligible: analysisResult.isTrainingEligible,
                isGreenEligible: analysisResult.isGreenEligible,
                totalEstimatedValue: analysisResult.financialSummary.totalEstimatedValue,
                rdCreditValue: analysisResult.financialSummary.rdCreditValue,
                trainingCreditValue: analysisResult.financialSummary.trainingCreditValue,
                greenEnergyValue: analysisResult.financialSummary.greenEnergyValue,
                matchCount: analysisResult.processingDetails.totalMatchesFound,
                confidence: analysisResult.processingDetails.confidenceScore,
            };

            // Save to Supabase as a lead (same table as Terminal uses)
            await supabase.from('deals').insert([{
                company: `LEAD-${file.name.slice(0, 20)}`,
                value: result.totalEstimatedValue,
                status: 'NEW_LEAD',
                packet_id: analysisResult.analysisId,
                risk_score: result.confidence * 100,
                anomaly_count: analysisResult.riskIndicators.length,
            }]);

            await new Promise(r => setTimeout(r, 500));
            setScanResult(result);
            setUploadState(result.totalEstimatedValue > 0 ? 'success' : 'no_results');

        } catch (err) {
            console.error('Scan error:', err);
            setError('Unable to process file.');
            setUploadState('error');
        }
    }, []);

    const handleReset = useCallback(() => {
        setUploadState('idle');
        setScanProgress(0);
        setScanResult(null);
        setFileName('');
        setError('');
    }, []);

    const handleConnect = useCallback(() => {
        alert('Connecting with a tax expert... (This would open a booking modal)');
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header />

            {/* Hero */}
            <section className="bg-gradient-to-b from-white to-gray-50 pt-12 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
                            <TrustBadge icon={<Shield className="w-4 h-4" />} text="IRS Compliant" />
                            <TrustBadge icon={<Lock className="w-4 h-4" />} text="256-bit Encrypted" />
                            <TrustBadge icon={<Award className="w-4 h-4" />} text="CPA Certified" />
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Check Your Grant Eligibility<br /><span className="text-blue-600">in 30 Seconds</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                            Upload your financial documents and our AI will instantly identify tax credits you may be missing.
                        </p>

                        <div className="flex flex-wrap justify-center divide-x divide-gray-200 mb-12">
                            <StatCard value="$847M+" label="Credits Identified" icon={<DollarSign className="w-5 h-5" />} />
                            <StatCard value="12,000+" label="Businesses Helped" icon={<Building2 className="w-5 h-5" />} />
                            <StatCard value="99.8%" label="Satisfaction" icon={<Star className="w-5 h-5" />} />
                        </div>
                    </div>

                    {/* Drop Zone / Results */}
                    <div className="max-w-2xl mx-auto">
                        {(uploadState === 'idle' || uploadState === 'scanning') && (
                            <FileDropZone onFileSelect={handleFileSelect} uploadState={uploadState} scanProgress={scanProgress} dragActive={dragActive} setDragActive={setDragActive} />
                        )}
                        {uploadState === 'success' && scanResult && (
                            <SuccessCard result={scanResult} fileName={fileName} onReset={handleReset} onConnect={handleConnect} />
                        )}
                        {uploadState === 'no_results' && <NoResultsCard onReset={handleReset} />}
                        {uploadState === 'error' && <ErrorCard error={error} onReset={handleReset} />}
                    </div>

                    {uploadState === 'idle' && (
                        <div className="flex items-center justify-center gap-8 mt-8">
                            <ProgressStep step={1} label="Upload" active complete={false} />
                            <div className="w-8 h-0.5 bg-gray-200" />
                            <ProgressStep step={2} label="Scan" active={false} complete={false} />
                            <div className="w-8 h-0.5 bg-gray-200" />
                            <ProgressStep step={3} label="Results" active={false} complete={false} />
                        </div>
                    )}
                </div>
            </section>

            <HowItWorks />
            <Programs />
            <Testimonials />
            <FAQ />

            {/* Final CTA */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Claim Your Credits?</h2>
                    <p className="text-lg text-gray-600 mb-8">Join thousands of businesses who discovered money they didn't know they had.</p>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl inline-flex items-center gap-2">
                        Start Your Free Scan<ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PublicLanding;
