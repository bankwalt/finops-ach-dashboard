import { createContext, useContext, useReducer, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import { getServices } from '../services/serviceFactory';

const ExceptionsContext = createContext(null);

const initialState = {
  isLoading: false,
  error: null,
  lastRefreshed: null,
  summary: null,
  achDebitQueue: [],
  categoryQueue: [],
  categoryQueueLoading: false,
  activeCategory: 'achDebitDecisioning',
  statusFilter: null,
  sortField: 'returnDeadline',
  sortDir: 'asc',
  selectedIds: [],
  expandedItemId: null,
  activeDecisionItemId: null,
  decisionAction: null,
  selectedOffsetAccountId: null,
  isSubmitting: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_EXCEPTIONS':
      return {
        ...state,
        summary: action.payload.summary,
        achDebitQueue: action.payload.achDebitQueue,
        lastRefreshed: new Date().toISOString(),
        error: null,
        isLoading: false,
      };
    case 'SET_ACTIVE_CATEGORY':
      return {
        ...state,
        activeCategory: action.payload,
        categoryQueue: [],
        categoryQueueLoading: false,
        expandedItemId: null,
        activeDecisionItemId: null,
        decisionAction: null,
        selectedOffsetAccountId: null,
        selectedIds: [],
      };
    case 'SET_CATEGORY_LOADING':
      return { ...state, categoryQueueLoading: action.payload };
    case 'LOAD_CATEGORY_QUEUE':
      return { ...state, categoryQueue: action.payload, categoryQueueLoading: false };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: state.statusFilter === action.payload ? null : action.payload };
    case 'SET_SORT':
      return {
        ...state,
        sortField: action.payload,
        sortDir: state.sortField === action.payload && state.sortDir === 'asc' ? 'desc' : 'asc',
      };
    case 'TOGGLE_SELECT': {
      const id = action.payload;
      return {
        ...state,
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds.filter(sid => sid !== id)
          : [...state.selectedIds, id],
      };
    }
    case 'SELECT_ALL':
      return { ...state, selectedIds: action.payload };
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: [] };
    case 'SET_EXPANDED_ITEM':
      return {
        ...state,
        expandedItemId: state.expandedItemId === action.payload ? null : action.payload,
        activeDecisionItemId: null,
        decisionAction: null,
        selectedOffsetAccountId: null,
      };
    case 'OPEN_DECISION':
      return {
        ...state,
        activeDecisionItemId: action.payload.itemId,
        decisionAction: action.payload.action,
        expandedItemId: action.payload.itemId,
        selectedOffsetAccountId: action.payload.offsetAccountId || null,
      };
    case 'CLOSE_DECISION':
      return { ...state, activeDecisionItemId: null, decisionAction: null, selectedOffsetAccountId: null };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'DECISION_COMPLETE':
      return {
        ...state,
        achDebitQueue: state.achDebitQueue.map(item =>
          item.id === action.payload.id
            ? { ...item, status: action.payload.status, decisionHistory: [...item.decisionHistory, action.payload.entry] }
            : item
        ),
        activeDecisionItemId: null,
        decisionAction: null,
        selectedOffsetAccountId: null,
        isSubmitting: false,
      };
    default:
      return state;
  }
}

export function ExceptionsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { apiMode } = useDashboard();

  const loadExceptions = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const services = getServices(apiMode);
      const [summaryResult, queueResult] = await Promise.all([
        services.exceptions.getExceptionSummary(),
        services.exceptions.getACHDebitQueue(),
      ]);
      if (!summaryResult.ok || !queueResult.ok) {
        throw new Error('Failed to load exceptions');
      }
      dispatch({
        type: 'LOAD_EXCEPTIONS',
        payload: { summary: summaryResult.data, achDebitQueue: queueResult.data },
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [apiMode]);

  const loadCategoryQueue = useCallback(async (category) => {
    if (category === 'achDebitDecisioning') return;
    dispatch({ type: 'SET_CATEGORY_LOADING', payload: true });
    try {
      const services = getServices(apiMode);
      const result = await services.exceptions.getQueueByCategory(category);
      if (!result.ok) throw new Error('Failed to load category queue');
      dispatch({ type: 'LOAD_CATEGORY_QUEUE', payload: result.data });
    } catch (err) {
      dispatch({ type: 'SET_CATEGORY_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [apiMode]);

  const submitDecision = useCallback(async (itemId, decision) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const services = getServices(apiMode);
      const result = await services.exceptions.submitDecision(itemId, decision);
      if (!result.ok) {
        throw new Error('Failed to submit decision');
      }
      const statusMap = { PAY: 'PAID', RETURN: 'RETURNED' };
      dispatch({
        type: 'DECISION_COMPLETE',
        payload: {
          id: itemId,
          status: statusMap[decision.action] || 'PENDING_DECISION',
          entry: { ...decision, decidedAt: result.data.decidedAt },
        },
      });
    } catch (err) {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [apiMode]);

  const setActiveCategory = useCallback((category) => {
    dispatch({ type: 'SET_ACTIVE_CATEGORY', payload: category });
  }, []);

  const setStatusFilter = useCallback((status) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: status });
  }, []);

  const setSort = useCallback((field) => {
    dispatch({ type: 'SET_SORT', payload: field });
  }, []);

  const toggleSelect = useCallback((id) => {
    dispatch({ type: 'TOGGLE_SELECT', payload: id });
  }, []);

  const selectAll = useCallback((ids) => {
    dispatch({ type: 'SELECT_ALL', payload: ids });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const toggleExpandedItem = useCallback((id) => {
    dispatch({ type: 'SET_EXPANDED_ITEM', payload: id });
  }, []);

  const openDecision = useCallback((itemId, action, offsetAccountId) => {
    dispatch({ type: 'OPEN_DECISION', payload: { itemId, action, offsetAccountId } });
  }, []);

  const closeDecision = useCallback(() => {
    dispatch({ type: 'CLOSE_DECISION' });
  }, []);

  const value = {
    ...state,
    loadExceptions,
    loadCategoryQueue,
    submitDecision,
    setActiveCategory,
    setStatusFilter,
    setSort,
    toggleSelect,
    selectAll,
    clearSelection,
    toggleExpandedItem,
    openDecision,
    closeDecision,
  };

  return (
    <ExceptionsContext.Provider value={value}>
      {children}
    </ExceptionsContext.Provider>
  );
}

export function useExceptions() {
  const context = useContext(ExceptionsContext);
  if (!context) {
    throw new Error('useExceptions must be used within an ExceptionsProvider');
  }
  return context;
}
