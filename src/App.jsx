import { useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import NewService from './components/NewService';
import DailySales from './components/DailySales';
import Accounts from './components/Accounts';
import AllRecords from './components/AllRecords';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('new');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSaleCreated = () => {
    // Trigger refresh in all tabs
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <Header />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === 'new' && <NewService onSaleCreated={handleSaleCreated} />}
        {activeTab === 'daily' && <DailySales refreshTrigger={refreshTrigger} />}
        {activeTab === 'accounts' && <Accounts refreshTrigger={refreshTrigger} />}
        {activeTab === 'all' && <AllRecords refreshTrigger={refreshTrigger} />}
      </main>
    </>
  );
}

export default App;
