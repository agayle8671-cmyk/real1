

export default function DataTable() {
    const rows = [
        { name: 'prod-api-server-1', status: 'running', zone: 'us-east1-b', type: 'n2-standard-4', ip: '10.142.0.12', created: 'Dec 1, 2024' },
        { name: 'prod-api-server-2', status: 'running', zone: 'us-east1-c', type: 'n2-standard-4', ip: '10.142.0.15', created: 'Dec 1, 2024' },
        { name: 'staging-web-server', status: 'running', zone: 'europe-west1-b', type: 'e2-medium', ip: '10.132.0.8', created: 'Nov 28, 2024', flag: '🇪🇺' },
        { name: 'dev-test-instance', status: 'stopped', zone: 'us-central1-a', type: 'e2-small', ip: '10.128.0.22', created: 'Nov 15, 2024' },
        { name: 'ml-training-gpu', status: 'provisioning', zone: 'us-west1-b', type: 'n1-standard-8-gpu', ip: '—', created: 'Just now' },
    ];

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'running': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#e6f4ea] text-[#137333]"><span className="w-2 h-2 rounded-full bg-[#137333]"></span>Running</span>;
            case 'stopped': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#f1f3f4] text-[#5f6368]"><span className="w-2 h-2 rounded-full bg-[#5f6368]"></span>Stopped</span>;
            case 'provisioning': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#fef7e0] text-[#b06000]"><span className="w-2 h-2 rounded-full bg-[#b06000]"></span>Provisioning</span>;
            default: return null;
        }
    };

    return (
        <div className="bg-white border border-border-console rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border-console">
                <h2 className="font-google-sans text-base font-medium">VM Instances</h2>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 border border-border-console rounded px-3 py-1.5">
                        <span className="material-icons text-text-secondary text-[20px]">search</span>
                        <input type="text" placeholder="Filter resources" className="border-none outline-none text-sm w-48 text-text-primary placeholder-text-secondary" />
                    </div>
                    <button className="w-9 h-9 border border-border-console rounded flex items-center justify-center hover:bg-bg-console text-text-secondary">
                        <span className="material-icons">refresh</span>
                    </button>
                    <button className="w-9 h-9 border border-border-console rounded flex items-center justify-center hover:bg-bg-console text-text-secondary">
                        <span className="material-icons">view_column</span>
                    </button>
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-bg-console border-b border-border-console text-left text-xs font-medium text-text-secondary">
                        <th className="px-5 py-3 w-10"><input type="checkbox" className="cursor-pointer" /></th>
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Zone</th>
                        <th className="px-5 py-3">Machine Type</th>
                        <th className="px-5 py-3">Internal IP</th>
                        <th className="px-5 py-3">Created</th>
                        <th className="px-5 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-border-console hover:bg-bg-console group transition-colors">
                            <td className="px-5 py-4"><input type="checkbox" className="cursor-pointer" /></td>
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-[#e8f0fe] text-primary-blue flex items-center justify-center">
                                        <span className="material-icons text-[18px]">dns</span>
                                    </div>
                                    <a href="#" className="text-sm font-medium text-primary-blue hover:underline">{row.name}</a>
                                </div>
                            </td>
                            <td className="px-5 py-4">{getStatusChip(row.status)}</td>
                            <td className="px-5 py-4 text-sm text-text-primary">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base">{row.flag || '🇺🇸'}</span>
                                    {row.zone}
                                </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-text-primary">{row.type}</td>
                            <td className="px-5 py-4 text-sm text-text-primary">{row.ip}</td>
                            <td className="px-5 py-4 text-sm text-text-primary">{row.created}</td>
                            <td className="px-5 py-4 text-text-secondary cursor-pointer hover:bg-gray-200 rounded-full">
                                <span className="material-icons">more_vert</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
