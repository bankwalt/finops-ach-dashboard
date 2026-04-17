import { useEffect } from 'react';
import { ExceptionsProvider, useExceptions } from '../context/ExceptionsContext';
import ExceptionsSummary from './ExceptionsSummary';
import ACHDebitQueue from './ACHDebitQueue';
import PayoutRetryQueue from './PayoutRetryQueue';
import CategoryQueue from './CategoryQueue';

const SPECIAL_CATEGORIES = ['achDebitDecisioning', 'payoutRetryQueue'];

function ExceptionsContent({ refreshRef }) {
  const { isLoading, error, summary, activeCategory, loadExceptions, loadCategoryQueue } = useExceptions();

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  useEffect(() => {
    if (activeCategory && !SPECIAL_CATEGORIES.includes(activeCategory)) {
      loadCategoryQueue(activeCategory);
    }
  }, [activeCategory, loadCategoryQueue]);

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = loadExceptions;
    }
  }, [refreshRef, loadExceptions]);

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
        <p>Loading exceptions...</p>
      </div>
    );
  }

  return (
    <>
      <ExceptionsSummary />
      {activeCategory === 'achDebitDecisioning' && <ACHDebitQueue />}
      {activeCategory === 'payoutRetryQueue' && <PayoutRetryQueue />}
      {!SPECIAL_CATEGORIES.includes(activeCategory) && <CategoryQueue />}
    </>
  );
}

export default function ExceptionsDashboard({ refreshRef }) {
  return (
    <ExceptionsProvider>
      <ExceptionsContent refreshRef={refreshRef} />
    </ExceptionsProvider>
  );
}
