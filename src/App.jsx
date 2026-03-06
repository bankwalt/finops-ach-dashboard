import { useEffect, useRef, useCallback } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import Header from './components/Header';
import HealthOverview from './components/HealthOverview';
import ACHFileTimeline from './components/ACHFileTimeline';
import FIRDStatus from './components/FIRDStatus';
import SchedulerStatus from './components/SchedulerStatus';
import FailedEventsDetail from './components/FailedEventsDetail';
import AlacrtiDashboard from './components/AlacrtiDashboard';
import TransactionsDashboard from './components/TransactionsDashboard';
import './App.css';

function DashboardContent() {
  const { error, isLoading, eventSummary, loadDashboard, activePage } = useDashboard();
  const alacrtiRefreshRef = useRef(null);
  const transactionsRefreshRef = useRef(null);

  useEffect(() => {
    if (activePage === 'ach') {
      loadDashboard();
    }
  }, [loadDashboard, activePage]);

  const handleRefreshAlacriti = useCallback(() => {
    alacrtiRefreshRef.current?.();
  }, []);

  const handleRefreshTransactions = useCallback(() => {
    transactionsRefreshRef.current?.();
  }, []);

  return (
    <div className="app">
      <Header
        onRefreshAlacriti={handleRefreshAlacriti}
        onRefreshTransactions={handleRefreshTransactions}
      />
      <main className="main-content">
        {activePage === 'ach' && (
          <>
            {error && (
              <div className="error-banner">
                <span className="error-banner-icon">!</span>
                <span>{error}</span>
              </div>
            )}
            {isLoading && !eventSummary ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading dashboard data...</p>
              </div>
            ) : (
              <>
                <HealthOverview />
                <ACHFileTimeline />
                <FIRDStatus />
                <SchedulerStatus />
                <FailedEventsDetail />
              </>
            )}
          </>
        )}
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
