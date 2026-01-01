

export default function BillingBreakdown() {
    return (
        <div className="bg-white border border-border-console rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-5">
                <div>
                    <div className="font-google-sans text-[36px] text-text-primary">$1,847.32</div>
                    <div className="text-sm text-text-secondary">Current month to date • Forecasted: $2,450</div>
                </div>
                <a href="#" className="text-sm font-medium text-primary-blue hover:underline">View billing details →</a>
            </div>

            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex mb-3">
                <div className="h-full bg-primary-blue" style={{ width: '48%' }}></div>
                <div className="h-full bg-google-green" style={{ width: '23%' }}></div>
                <div className="h-full bg-google-yellow" style={{ width: '17%' }}></div>
                <div className="h-full bg-google-red" style={{ width: '12%' }}></div>
            </div>

            <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <span className="w-3 h-3 rounded-sm bg-primary-blue"></span>
                    Compute: $892.45
                </div>
                <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <span className="w-3 h-3 rounded-sm bg-google-green"></span>
                    Storage: $423.12
                </div>
                <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <span className="w-3 h-3 rounded-sm bg-google-yellow"></span>
                    Network: $312.80
                </div>
                <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <span className="w-3 h-3 rounded-sm bg-google-red"></span>
                    Other: $218.95
                </div>
            </div>
        </div>
    );
}
