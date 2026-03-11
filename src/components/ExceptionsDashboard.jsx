import { useEffect } from 'react';
import { ExceptionsProvider, useExceptions } from '../context/ExceptionsContext';
import ExceptionsSummary from './ExceptionsSummary';
import ACHDebitQueue from './ACHDebitQueue';
import CategoryQueue from './CategoryQueue';

function ExceptionsContent({ refreshRef }) {
  const { isLoading, error, summary, activeCategory, loadExceptions, loadCategoryQueue } = useExceptions();

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  useEffect(() => {
    if (activeCategory && activeCategory !== 'achDebitDecisioning') {
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
      {activeCategory !== 'achDebitDecisioning' && <CategoryQueue />}
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
