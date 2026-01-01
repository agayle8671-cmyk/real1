import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: '1', value: 4000 },
    { name: '5', value: 3000 },
    { name: '10', value: 2000 },
    { name: '15', value: 2780 },
    { name: '20', value: 1890 },
    { name: '25', value: 2390 },
    { name: '30', value: 3490 },
];

export default function BillingChart() {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                    <XAxis dataKey="name" stroke="#9AA0A6" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9AA0A6" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DADCE0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#3C4043' }}
                        cursor={{ stroke: '#1A73E8', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#1A73E8" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} activeDot={{ r: 4, strokeWidth: 0 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
