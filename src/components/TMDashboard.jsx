import { useEffect } from 'react';
import { TMProvider, useTM } from '../context/TMContext';
import TMSummaryCards from './TMSummaryCards';
import TMAlertQueue from './TMAlertQueue';
import TMUARForm from './TMUARForm';

function TMContent({ refreshRef }) {
  const { isLoading, error, summary, loadTM, uarFormAlertId, alerts } = useTM();

  useEffect(() => {
    loadTM();
  }, [loadTM]);

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = loadTM;
    }
  }, [refreshRef, loadTM]);

  if (error) {
    return (
      <div className="error-banner">
        <span className="error-banner-icon">!</span>
        <span>{error}</span>
      </div>
    );
  }

  if (isLoading && !summary) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading transaction monitoring...</p>
      </div>
    );
  }

  const uarAlert = uarFormAlertId ? alerts.find(a => a.decisionId === uarFormAlertId) : null;

  return (
    <>
      <TMSummaryCards />
      <TMAlertQueue />
      {uarAlert && <TMUARForm alert={uarAlert} />}
    </>
  );
}

export default function TMDashboard({ refreshRef }) {
  return (
    <TMProvider>
      <TMContent refreshRef={refreshRef} />
    </TMProvider>
  );
}
