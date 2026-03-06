import { createContext, useContext, useReducer, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import { getServices } from '../services/serviceFactory';

const TransactionsContext = createContext(null);

const initialState = {
  isLoading: false,
  error: null,
  lastRefreshed: null,
  transactions: [],
  sortField: 'createdAt',
  sortDir: 'desc',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
        lastRefreshed: new Date().toISOString(),
        error: null,
        isLoading: false,
      };
    case 'SET_SORT':
      return {
        ...state,
        sortField: action.payload.field,
        sortDir: state.sortField === action.payload.field && state.sortDir === 'desc' ? 'asc' : 'desc',
      };
    default:
      return state;
  }
}

export function TransactionsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { apiMode } = useDashboard();

  const loadTransactions = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const services = getServices(apiMode);
      const result = await services.transactions.getTransactions();
      if (!result.ok) {
        throw new Error(result?.data?.error || 'Failed to load transactions');
      }
      dispatch({ type: 'LOAD_TRANSACTIONS', payload: result.data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [apiMode]);

  const setSort = useCallback((field) => {
    dispatch({ type: 'SET_SORT', payload: { field } });
  }, []);

  const value = {
    ...state,
    loadTransactions,
    setSort,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
