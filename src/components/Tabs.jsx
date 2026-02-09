export default function Tabs({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'new', label: 'New Service' },
        { id: 'daily', label: 'Daily Sales' },
        { id: 'accounts', label: '30-Day Accounts' },
        { id: 'paylater', label: 'Pay Later' },
        { id: 'all', label: 'All Records' }
    ];

    return (
        <div className="tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
