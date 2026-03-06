import { useEffect } from 'react';
import { TransactionsProvider, useTransactions } from '../context/TransactionsContext';
import AllTransactions from './AllTransactions';

function TransactionsContent({ refreshRef }) {
  const { isLoading, error, loadTransactions } = useTransactions();

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = loadTransactions;
    }
  }, [refreshRef, loadTransactions]);

  if (error) {
    return (
      <div className="error-banner">
        <span className="error-banner-icon">!</span>
        <span>{error}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading transactions...</p>
      </div>
    );
  }

  return <AllTransactions />;
}

export default function TransactionsDashboard({ refreshRef }) {
  return (
    <TransactionsProvider>
      <TransactionsContent refreshRef={refreshRef} />
    </TransactionsProvider>
  );
}
