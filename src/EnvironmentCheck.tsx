import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
];

const EnvironmentCheck: React.FC = () => {
    return (
        <div className="p-8 bg-bg-console min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-border-console p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">System Health Check</h1>
                <p className="text-gray-500 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Environment Active • Gemini 3.0 Flash Preview
                </p>

                <div className="h-[400px] w-full bg-white border border-border-console rounded-md p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#9AA0A6" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9AA0A6" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DADCE0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#3C4043' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#1A73E8" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded border border-border-console">
                        <h3 className="font-medium text-gray-900">Thinking Level</h3>
                        <p className="text-sm text-gray-600">High (Deep Agentic Reasoning Active)</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded border border-border-console">
                        <h3 className="font-medium text-gray-900">Model ID</h3>
                        <p className="text-sm text-gray-600">gemini-3-flash-preview</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentCheck;
