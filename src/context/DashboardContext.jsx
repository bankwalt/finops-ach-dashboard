import { createContext, useContext, useReducer, useCallback } from 'react';
import { getServices } from '../services/serviceFactory';

const DashboardContext = createContext(null);

const initialState = {
  apiMode: 'mock',
  activePage: 'ach',
  isLoading: false,
  error: null,
  lastRefreshed: null,
  period: '24h',
  eventSummary: null,
  calendars: [],
  failedEvents: [],
  achFileTimings: [],
  firdStatus: null,
  expandedEventId: null,
  failedEventFilter: null,
  transactionFilters: { status: null, network: null, direction: null },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_API_MODE':
      return { ...state, apiMode: action.payload, eventSummary: null, calendars: [], failedEvents: [], achFileTimings: [], firdStatus: null };
    case 'SET_PERIOD':
      return { ...state, period: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_DASHBOARD':
      return {
        ...state,
        eventSummary: action.payload.eventSummary,
        calendars: action.payload.calendars,
        failedEvents: action.payload.failedEvents,
        achFileTimings: action.payload.achFileTimings,
        firdStatus: action.payload.firdStatus,
        lastRefreshed: new Date().toISOString(),
        error: null,
        isLoading: false,
      };
    case 'SET_EXPANDED_EVENT':
      return {
        ...state,
        expandedEventId: state.expandedEventId === action.payload ? null : action.payload,
      };
    case 'SET_FAILED_FILTER':
      return { ...state, failedEventFilter: action.payload };
    case 'SET_ACTIVE_PAGE':
      return { ...state, activePage: action.payload };
    case 'SET_TRANSACTION_FILTERS':
      return { ...state, transactionFilters: { ...state.transactionFilters, ...action.payload } };
    case 'NAVIGATE_TO_TRANSACTIONS':
      return { ...state, activePage: 'transactions', transactionFilters: action.payload };
    default:
      return state;
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setApiMode = useCallback((mode) => {
    dispatch({ type: 'SET_API_MODE', payload: mode });
  }, []);

  const setPeriod = useCallback((period) => {
    dispatch({ type: 'SET_PERIOD', payload: period });
  }, []);

  const toggleExpandedEvent = useCallback((eventId) => {
    dispatch({ type: 'SET_EXPANDED_EVENT', payload: eventId });
  }, []);

  const setFailedFilter = useCallback((eventType) => {
    dispatch({ type: 'SET_FAILED_FILTER', payload: eventType });
  }, []);

  const setActivePage = useCallback((page) => {
    dispatch({ type: 'SET_ACTIVE_PAGE', payload: page });
  }, []);

  const setTransactionFilters = useCallback((filters) => {
    dispatch({ type: 'SET_TRANSACTION_FILTERS', payload: filters });
  }, []);

  const navigateToTransactions = useCallback((filters = {}) => {
    dispatch({ type: 'NAVIGATE_TO_TRANSACTIONS', payload: { status: null, network: null, direction: null, ...filters } });
  }, []);

  const loadDashboard = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const services = getServices(state.apiMode);

      const [summaryResult, calendarsResult, failedResult, timingsResult, firdResult] = await Promise.all([
        services.events.getEventContexts(state.period),
        services.calendar.getACHCalendars(),
        services.events.getFailedEvents(state.period),
        services.events.getACHFileTimings(),
        services.events.getFIRDStatus(),
      ]);

      const allResults = [summaryResult, calendarsResult, failedResult, timingsResult, firdResult];
      const failedCall = allResults.find(r => !r.ok);
      if (failedCall) {
        throw new Error(failedCall?.data?.error || 'API request failed');
      }

      dispatch({
        type: 'LOAD_DASHBOARD',
        payload: {
          eventSummary: summaryResult.data,
          calendars: calendarsResult.data,
          failedEvents: failedResult.data,
          achFileTimings: timingsResult.data,
          firdStatus: firdResult.data,
        },
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [state.apiMode, state.period]);

  const value = {
    ...state,
    setApiMode,
    setPeriod,
    loadDashboard,
    toggleExpandedEvent,
    setFailedFilter,
    setActivePage,
    setTransactionFilters,
    navigateToTransactions,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
