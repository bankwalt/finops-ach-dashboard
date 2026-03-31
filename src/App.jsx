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
import ExceptionsDashboard from './components/ExceptionsDashboard';
import ACHReconciliation from './components/ACHReconciliation';
import TMDashboard from './components/TMDashboard';
import './App.css';

function DashboardContent() {
  const { error, isLoading, eventSummary, loadDashboard, activePage } = useDashboard();
  const alacrtiRefreshRef = useRef(null);
  const transactionsRefreshRef = useRef(null);
  const exceptionsRefreshRef = useRef(null);
  const reconRefreshRef = useRef(null);
  const tmRefreshRef = useRef(null);
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

  const handleRefreshExceptions = useCallback(() => {
    exceptionsRefreshRef.current?.();
  }, []);

  const handleRefreshRecon = useCallback(() => {
    reconRefreshRef.current?.();
  }, []);

  const handleRefreshTM = useCallback(() => {
    tmRefreshRef.current?.();
  }, []);

  return (
    <div className="app">
      <Header
        onRefreshAlacriti={handleRefreshAlacriti}
        onRefreshTransactions={handleRefreshTransactions}
        onRefreshExceptions={handleRefreshExceptions}
        onRefreshRecon={handleRefreshRecon}
        onRefreshTM={handleRefreshTM}
      />
      {activePage === 'recon' && (
        <ACHReconciliation refreshRef={reconRefreshRef} />
      )}
      <main className="main-content" style={activePage === 'recon' ? { display: 'none' } : undefined}>
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
        {activePage === 'exceptions' && (
          <ExceptionsDashboard refreshRef={exceptionsRefreshRef} />
        )}
        {activePage === 'tm' && (
          <TMDashboard refreshRef={tmRefreshRef} />
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
