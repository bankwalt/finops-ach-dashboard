import { createContext, useContext, useReducer, useCallback } from 'react';
import { getServices } from '../services/serviceFactory';
import { useDashboard } from './DashboardContext';

const AlacrtiContext = createContext(null);

const initialState = {
  isLoading: false,
  error: null,
  lastRefreshed: null,
  fundsAvailability: null,
  transactions: null,
  expandedRail: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_ALACRITI':
      return {
        ...state,
        fundsAvailability: action.payload.fundsAvailability,
        transactions: action.payload.transactions,
        lastRefreshed: new Date().toISOString(),
        error: null,
        isLoading: false,
      };
    case 'TOGGLE_EXPANDED_RAIL':
      return {
        ...state,
        expandedRail: state.expandedRail === action.payload ? null : action.payload,
      };
    default:
      return state;
  }
}

export function AlacrtiProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { apiMode } = useDashboard();

  const loadAlacriti = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const services = getServices(apiMode);
      const [fundsResult, txnResult] = await Promise.all([
        services.alacriti.getFundsAvailability(),
        services.alacriti.getTransactions(),
      ]);

      const failed = [fundsResult, txnResult].find(r => !r.ok);
      if (failed) {
        throw new Error(failed?.data?.error || 'Alacriti API request failed');
      }

      dispatch({
        type: 'LOAD_ALACRITI',
        payload: {
          fundsAvailability: fundsResult.data,
          transactions: txnResult.data,
        },
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [apiMode]);

  const toggleExpandedRail = useCallback((rail) => {
    dispatch({ type: 'TOGGLE_EXPANDED_RAIL', payload: rail });
  }, []);

  const value = {
    ...state,
    loadAlacriti,
    toggleExpandedRail,
  };

  return (
    <AlacrtiContext.Provider value={value}>
      {children}
    </AlacrtiContext.Provider>
  );
}

export function useAlacriti() {
  const context = useContext(AlacrtiContext);
  if (!context) {
    throw new Error('useAlacriti must be used within an AlacrtiProvider');
  }
  return context;
}
