

interface ResourceCardProps {
    icon: string;
    colorClass: string;
    title: string;
    description: string;
    instances: number;
    status: 'active' | 'warning' | 'inactive';
}

export default function ResourceCard({ icon, colorClass, title, description, instances, status }: ResourceCardProps) {
    const getStatusColor = (s: string) => {
        switch (s) {
            case 'active': return 'bg-google-green';
            case 'warning': return 'bg-google-yellow';
            default: return 'bg-gray-300';
        }
    };

    return (
        <div className="bg-white border border-border-console rounded-lg p-5 cursor-pointer hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded flex items-center justify-center ${colorClass}`}>
                    <span className="material-icons text-xl">{icon}</span>
                </div>
                <div>
                    <h3 className="font-google-sans text-base font-medium text-text-primary">{title}</h3>
                </div>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4 h-10 line-clamp-2">
                {description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></span>
                    <span className="text-xs text-text-secondary">{instances} Instances</span>
                </div>
                <a href="#" className="text-sm font-medium text-primary-blue hover:underline">Manage</a>
            </div>
        </div>
    );
}
