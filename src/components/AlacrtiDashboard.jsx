import { useEffect } from 'react';
import { AlacrtiProvider, useAlacriti } from '../context/AlacrtiContext';
import FundsAvailability from './FundsAvailability';
import TransactionVolume from './TransactionVolume';

function AlacrtiContent({ refreshRef }) {
  const { error, isLoading, fundsAvailability, loadAlacriti } = useAlacriti();

  useEffect(() => {
    loadAlacriti();
  }, [loadAlacriti]);

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = loadAlacriti;
      return () => { refreshRef.current = null; };
    }
  }, [loadAlacriti, refreshRef]);

  if (error) {
    return (
      <div className="error-banner">
        <span className="error-banner-icon">!</span>
        <span>{error}</span>
      </div>
    );
  }

  if (isLoading && !fundsAvailability) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading Alacriti data...</p>
      </div>
    );
  }

  return (
    <>
      <FundsAvailability />
      <TransactionVolume />
    </>
  );
}

export default function AlacrtiDashboard({ refreshRef }) {
  return (
    <AlacrtiProvider>
      <AlacrtiContent refreshRef={refreshRef} />
    </AlacrtiProvider>
  );
}
