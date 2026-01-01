

const SidebarItem = ({ icon, label, active = false }: { icon: string, label: string, active?: boolean }) => (
    <div className={`flex items-center px-6 h-10 text-sm cursor-pointer transition-colors ${active ? 'bg-google-blue-light text-primary-blue' : 'text-text-primary hover:bg-gray-100'}`}>
        <span className={`material-icons text-[20px] mr-4 ${active ? 'text-primary-blue' : 'text-text-secondary'}`}>{icon}</span>
        <span className="font-medium">{label}</span>
    </div>
);

const SidebarSectionHeader = ({ label }: { label: string }) => (
    <div className="px-6 pt-4 pb-2 text-[11px] font-medium text-text-secondary uppercase tracking-wider">
        {label}
    </div>
);

export default function Sidebar() {
    return (
        <div className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-border-console overflow-y-auto z-10 pb-4">
            <div className="py-2 border-b border-gray-100">
                <SidebarItem icon="home" label="Home" active />
                <SidebarItem icon="dashboard" label="Dashboard" />
                <SidebarItem icon="history" label="Activity" />
            </div>

            <SidebarSectionHeader label="Compute" />
            <SidebarItem icon="computer" label="Compute Engine" />
            <SidebarItem icon="dns" label="Kubernetes Engine" />
            <SidebarItem icon="functions" label="Cloud Functions" />

            <SidebarSectionHeader label="Storage" />
            <SidebarItem icon="storage" label="Cloud Storage" />
            <SidebarItem icon="dataset" label="BigQuery" />
            <SidebarItem icon="table_chart" label="Cloud SQL" />

            <SidebarSectionHeader label="Networking" />
            <SidebarItem icon="share" label="VPC Network" />
            <SidebarItem icon="security" label="Network Security" />
            <SidebarItem icon="router" label="Hybrid Connectivity" />

            <SidebarSectionHeader label="Operations" />
            <SidebarItem icon="assessment" label="Monitoring" />
            <SidebarItem icon="bug_report" label="Logging" />
        </div>
    );
}
