import { useRef, useCallback } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import Header from './components/Header';
import DailyProcessing from './components/DailyProcessing';
import ACHCompliance from './components/ACHCompliance';
import AlacrtiDashboard from './components/AlacrtiDashboard';
import TransactionsDashboard from './components/TransactionsDashboard';
import './App.css';

function DashboardContent() {
  const { activePage } = useDashboard();
  const alacrtiRefreshRef = useRef(null);
  const transactionsRefreshRef = useRef(null);
  const dailyRefreshRef = useRef(null);
  const complianceRefreshRef = useRef(null);

  const handleRefreshAlacriti = useCallback(() => {
    alacrtiRefreshRef.current?.();
  }, []);

  const handleRefreshTransactions = useCallback(() => {
    transactionsRefreshRef.current?.();
  }, []);

  const handleRefreshDaily = useCallback(() => {
    dailyRefreshRef.current?.();
  }, []);

  const handleRefreshCompliance = useCallback(() => {
    complianceRefreshRef.current?.();
  }, []);

  const fullWidthPage = activePage === 'daily' || activePage === 'compliance';

  return (
    <div className="app">
      <Header
        onRefreshAlacriti={handleRefreshAlacriti}
        onRefreshTransactions={handleRefreshTransactions}
        onRefreshDaily={handleRefreshDaily}
        onRefreshCompliance={handleRefreshCompliance}
      />
      {activePage === 'daily' && (
        <DailyProcessing refreshRef={dailyRefreshRef} />
      )}
      {activePage === 'compliance' && (
        <ACHCompliance refreshRef={complianceRefreshRef} />
      )}
      <main className="main-content" style={fullWidthPage ? { display: 'none' } : undefined}>
        {activePage === 'alacriti' && (
          <AlacrtiDashboard refreshRef={alacrtiRefreshRef} />
        )}
        {activePage === 'transactions' && (
          <TransactionsDashboard refreshRef={transactionsRefreshRef} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
