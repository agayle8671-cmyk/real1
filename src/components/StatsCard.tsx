import React from 'react';

interface StatsCardProps {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
}

export default function StatsCard({ label, value, change, trend }: StatsCardProps) {
    return (
        <div className="bg-white border border-border-console rounded-lg p-5">
            <div className="text-xs text-text-secondary uppercase tracking-wider mb-2 font-medium">{label}</div>
            <div className="font-google-sans text-2xl text-text-primary mb-1">{value}</div>
            <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-google-green' : 'text-google-red'}`}>
                <span className="material-icons text-[16px]">{trend === 'up' ? 'arrow_upward' : 'arrow_downward'}</span>
                {change}
            </div>
        </div>
    );
}
