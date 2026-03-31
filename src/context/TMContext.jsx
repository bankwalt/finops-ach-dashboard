import { createContext, useContext, useReducer, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import { getServices } from '../services/serviceFactory';

const TMContext = createContext(null);

const initialState = {
  isLoading: false,
  error: null,
  lastRefreshed: null,
  summary: null,
  alerts: [],
  filters: {
    severity: null,
    dateFrom: null,
    dateTo: null,
    partnerId: null,
    merchantId: null,
    network: null,
    status: null,
    search: '',
  },
  sortField: 'timestamp',
  sortDir: 'desc',
  expandedAlertId: null,
  activeDecisionAlertId: null,
  decisionAction: null,
  uarFormAlertId: null,
  merchantHistory: [],
  merchantHistoryLoading: false,
  isSubmitting: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_TM':
      return {
        ...state,
        summary: action.payload.summary,
        alerts: action.payload.alerts,
        lastRefreshed: new Date().toISOString(),
        error: null,
        isLoading: false,
      };
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value },
        expandedAlertId: null,
        activeDecisionAlertId: null,
        decisionAction: null,
      };
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters };
    case 'SET_SEVERITY_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          severity: state.filters.severity === action.payload ? null : action.payload,
        },
      };
    case 'SET_SORT':
      return {
        ...state,
        sortField: action.payload,
        sortDir: state.sortField === action.payload && state.sortDir === 'asc' ? 'desc' : 'asc',
      };
    case 'SET_EXPANDED_ALERT':
      return {
        ...state,
        expandedAlertId: state.expandedAlertId === action.payload ? null : action.payload,
        activeDecisionAlertId: null,
        decisionAction: null,
        merchantHistory: [],
      };
    case 'SET_MERCHANT_HISTORY_LOADING':
      return { ...state, merchantHistoryLoading: action.payload };
    case 'LOAD_MERCHANT_HISTORY':
      return { ...state, merchantHistory: action.payload, merchantHistoryLoading: false };
    case 'OPEN_DECISION':
      return {
        ...state,
        activeDecisionAlertId: action.payload.alertId,
        decisionAction: action.payload.action,
        expandedAlertId: action.payload.alertId,
      };
    case 'CLOSE_DECISION':
      return { ...state, activeDecisionAlertId: null, decisionAction: null };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'DECISION_COMPLETE': {
      const statusMap = { CLEAR: 'CLEARED', CONTACT: 'CONTACTED', ESCALATE: 'ESCALATED' };
      const newStatus = statusMap[action.payload.action] || 'PENDING_REVIEW';
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.decisionId === action.payload.decisionId
            ? {
                ...a,
                status: newStatus,
                outcome: newStatus,
                analystNotes: action.payload.notes,
                updatedBy: 'current.user@jaris.io',
                updatedAt: action.payload.decidedAt,
                uarRequired: action.payload.action === 'ESCALATE',
              }
            : a
        ),
        summary: {
          ...state.summary,
          pendingReview: state.summary.pendingReview - 1,
          byStatus: {
            ...state.summary.byStatus,
            PENDING_REVIEW: state.summary.byStatus.PENDING_REVIEW - 1,
            [newStatus]: (state.summary.byStatus[newStatus] || 0) + 1,
          },
          uarsGenerated: action.payload.action === 'ESCALATE'
            ? state.summary.uarsGenerated + 1
            : state.summary.uarsGenerated,
        },
        activeDecisionAlertId: null,
        decisionAction: null,
        isSubmitting: false,
      };
    }
    case 'OPEN_UAR_FORM':
      return { ...state, uarFormAlertId: action.payload };
    case 'CLOSE_UAR_FORM':
      return { ...state, uarFormAlertId: null };
    default:
      return state;
  }
}

export function TMProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { apiMode } = useDashboard();

  const loadTM = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const services = getServices(apiMode);
      const [summaryResult, alertsResult] = await Promise.all([
        services.tm.getAlertSummary(),
        services.tm.getAlerts(),
      ]);
      if (!summaryResult.ok || !alertsResult.ok) {
        throw new Error('Failed to load transaction monitoring data');
      }
      dispatch({
        type: 'LOAD_TM',
        payload: { summary: summaryResult.data, alerts: alertsResult.data },
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [apiMode]);

  const loadMerchantHistory = useCallback(async (merchantId) => {
    dispatch({ type: 'SET_MERCHANT_HISTORY_LOADING', payload: true });
    try {
      const services = getServices(apiMode);
      const result = await services.tm.getMerchantAlertHistory(merchantId);
      if (!result.ok) throw new Error('Failed to load merchant history');
      dispatch({ type: 'LOAD_MERCHANT_HISTORY', payload: result.data });
    } catch {
      dispatch({ type: 'SET_MERCHANT_HISTORY_LOADING', payload: false });
    }
  }, [apiMode]);

  const submitDecision = useCallback(async (decisionId, decision) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const services = getServices(apiMode);
      const result = await services.tm.submitDecision(decisionId, decision);
      if (!result.ok) throw new Error('Failed to submit decision');
      dispatch({
        type: 'DECISION_COMPLETE',
        payload: {
          decisionId,
          action: decision.action,
          notes: decision.notes,
          decidedAt: result.data.decidedAt,
        },
      });
      return result.data;
    } catch (err) {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: err.message });
      return null;
    }
  }, [apiMode]);

  const setFilter = useCallback((key, value) => {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const setSeverityFilter = useCallback((severity) => {
    dispatch({ type: 'SET_SEVERITY_FILTER', payload: severity });
  }, []);

  const setSort = useCallback((field) => {
    dispatch({ type: 'SET_SORT', payload: field });
  }, []);

  const toggleExpandedAlert = useCallback((id) => {
    dispatch({ type: 'SET_EXPANDED_ALERT', payload: id });
  }, []);

  const openDecision = useCallback((alertId, action) => {
    dispatch({ type: 'OPEN_DECISION', payload: { alertId, action } });
  }, []);

  const closeDecision = useCallback(() => {
    dispatch({ type: 'CLOSE_DECISION' });
  }, []);

  const openUARForm = useCallback((alertId) => {
    dispatch({ type: 'OPEN_UAR_FORM', payload: alertId });
  }, []);

  const closeUARForm = useCallback(() => {
    dispatch({ type: 'CLOSE_UAR_FORM' });
  }, []);

  const value = {
    ...state,
    loadTM,
    loadMerchantHistory,
    submitDecision,
    setFilter,
    clearFilters,
    setSeverityFilter,
    setSort,
    toggleExpandedAlert,
    openDecision,
    closeDecision,
    openUARForm,
    closeUARForm,
  };

  return (
    <TMContext.Provider value={value}>
      {children}
    </TMContext.Provider>
  );
}

export function useTM() {
  const context = useContext(TMContext);
  if (!context) {
    throw new Error('useTM must be used within a TMProvider');
  }
  return context;
}
