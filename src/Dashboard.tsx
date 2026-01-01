import Layout from './components/Layout';
import ResourceCard from './components/ResourceCard';
import BillingBreakdown from './components/BillingBreakdown';
import DataTable from './components/DataTable';
import StatsCard from './components/StatsCard';

const Dashboard = () => {
    return (
        <Layout>
            <div className="px-8 pt-6 pb-0 mb-6 bg-white border-b border-border-console">
                <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                    <a href="#" className="hover:text-primary-blue">TechVenture-Startup</a>
                    <span className="material-icons text-[14px]">chevron_right</span>
                    <span>Home</span>
                </div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="font-google-sans text-[28px] text-text-primary">Project Dashboard</h1>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-6 py-2 bg-white border border-border-console text-primary-blue font-medium rounded hover:bg-bg-console transition-colors">
                            <span className="material-icons text-[18px]">download</span>
                            Export
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2 bg-primary-blue text-white font-medium rounded hover:bg-primary-hover shadow-sm transition-colors">
                            <span className="material-icons text-[18px]">add</span>
                            Create Resource
                        </button>
                    </div>
                </div>

                <div className="flex gap-0">
                    {['Overview', 'Resources', 'Activity', 'Recommendations', 'Settings'].map((tab, i) => (
                        <a key={tab} href="#" className={`px-6 py-3 text-sm font-medium border-b-[3px] transition-colors ${i === 0 ? 'border-primary-blue text-primary-blue' : 'border-transparent text-text-secondary hover:text-primary-blue hover:bg-bg-console'}`}>
                            {tab}
                        </a>
                    ))}
                </div>
            </div>

            <div className="px-8 pb-12">
                {/* Info Banner */}
                <div className="bg-google-blue-light border border-[#aecbfa] rounded p-4 flex items-start gap-4 mb-6">
                    <span className="material-icons text-primary-blue text-[20px]">info</span>
                    <div className="flex-1">
                        <p className="text-text-primary text-sm">
                            <strong>Welcome to LaunchStack!</strong> Complete your startup setup to unlock $10,000 in credits.
                            <a href="#" className="text-primary-blue ml-2 hover:underline">Complete setup →</a>
                        </p>
                    </div>
                    <button className="text-text-secondary hover:bg-black/5 rounded p-1">
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatsCard label="Active Resources" value="24" change="3 from last week" trend="up" />
                    <StatsCard label="Monthly Spend" value="$1,847" change="12% from last month" trend="down" />
                    <StatsCard label="API Requests" value="2.4M" change="18% from last week" trend="up" />
                    <StatsCard label="Team Members" value="8" change="2 new this month" trend="up" />
                </div>

                {/* Billing Section */}
                <div className="mb-8">
                    <BillingBreakdown />
                </div>

                {/* Quick Access Grid */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-google-sans text-lg font-medium text-text-primary">Quick Access</h2>
                        <a href="#" className="text-sm font-medium text-primary-blue hover:underline">View all products →</a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ResourceCard title="Virtual Machines" icon="dns" colorClass="bg-blue-50 text-primary-blue" description="Create and manage scalable virtual machine instances." instances={6} status="active" />
                        <ResourceCard title="SQL Database" icon="database" colorClass="bg-green-50 text-google-green" description="Fully managed relational database service." instances={3} status="active" />
                        <ResourceCard title="Object Storage" icon="inventory_2" colorClass="bg-yellow-50 text-google-yellow" description="Store and serve any amount of data." instances={847} status="active" />
                        <ResourceCard title="Serverless Functions" icon="bolt" colorClass="bg-purple-50 text-purple-600" description="Run code without provisioning servers." instances={12} status="active" />
                        <ResourceCard title="Startup Analytics" icon="trending_up" colorClass="bg-cyan-50 text-cyan-600" description="Track KPIs and generate reports." instances={1} status="active" />
                        <ResourceCard title="Funding Tracker" icon="account_balance" colorClass="bg-red-50 text-google-red" description="Manage funding rounds and cap tables." instances={2} status="warning" />
                    </div>
                </div>

                {/* Data Table */}
                <div className="mb-12">
                    <DataTable />
                </div>

                <footer className="border-t border-border-console pt-6 pb-12 flex justify-between text-xs text-text-secondary">
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-text-primary">Privacy</a>
                        <a href="#" className="hover:text-text-primary">Terms</a>
                        <a href="#" className="hover:text-text-primary">Documentation</a>
                        <a href="#" className="hover:text-text-primary">Support</a>
                        <a href="#" className="hover:text-text-primary">Send Feedback</a>
                    </div>
                    <div>© 2024 LaunchStack Inc.</div>
                </footer>
            </div>
        </Layout>
    );
};

export default Dashboard;
