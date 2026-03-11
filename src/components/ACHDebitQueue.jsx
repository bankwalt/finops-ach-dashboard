import { useState, useMemo } from 'react';
import { useExceptions } from '../context/ExceptionsContext';
import { ACH_RETURN_CODES, TXN_CODE_LABELS } from '../data/exceptionsMockData';

// --- Helpers ---

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_LABELS = {
  PENDING_DECISION: 'Pending',
  PAID: 'Paid',
  RETURNED: 'Returned',
  HELD: 'Held',
  ESCALATED: 'Escalated',
};
const STATUS_BADGE = {
  PENDING_DECISION: 'badge-warning',
  PAID: 'badge-success',
  RETURNED: 'badge-error',
  HELD: 'badge-info',
  ESCALATED: 'badge-neutral',
};

// --- DeadlineCountdown ---

function DeadlineCountdown({ deadline }) {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl - now;

  if (diffMs <= 0) {
    return <span className="exc-deadline exc-deadline-overdue">OVERDUE</span>;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let className = 'exc-deadline ';
  if (hours < 2) className += 'exc-deadline-critical';
  else if (hours < 24) className += 'exc-deadline-warning';
  else className += 'exc-deadline-ok';

  if (hours >= 48) {
    return <span className={className}>{Math.floor(hours / 24)}d {hours % 24}h</span>;
  }
  return <span className={className}>{hours}h {minutes}m</span>;
}

// --- DecisionPanel ---

function DecisionPanel({ item }) {
  const { decisionAction, selectedOffsetAccountId, isSubmitting, submitDecision, closeDecision } = useExceptions();
  const [returnCode, setReturnCode] = useState('R01');
  const [notes, setNotes] = useState('');
  const [holdDuration, setHoldDuration] = useState('1d');
  const [escalateTo, setEscalateTo] = useState('risk');

  const handleSubmit = () => {
    const decision = { action: decisionAction };
    if (decisionAction === 'RETURN') {
      decision.returnCode = returnCode;
      decision.notes = notes;
    } else if (decisionAction === 'OFFSET') {
      decision.offsetAccountId = selectedOffsetAccountId;
      decision.notes = notes;
    } else if (decisionAction === 'HOLD') {
      decision.holdDuration = holdDuration;
      decision.reason = notes;
    } else if (decisionAction === 'ESCALATE') {
      decision.escalateTo = escalateTo;
      decision.notes = notes;
    }
    submitDecision(item.id, decision);
  };

  return (
    <div className="exc-decision-panel">
      {decisionAction === 'PAY' && (
        <>
          <div className="exc-decision-title">Confirm Pay</div>
          <p className="exc-decision-desc">
            Post debit of <strong>{formatCurrency(item.amount)}</strong> to account{' '}
            <span className="cell-mono">{item.finxactAccountId}</span> ({item.receivingName}).
            {item.shortfall > 0 && (
              <span className="exc-shortfall"> Warning: account is short {formatCurrency(item.shortfall)}.</span>
            )}
          </p>
        </>
      )}

      {decisionAction === 'RETURN' && (
        <>
          <div className="exc-decision-title">Return Entry</div>
          <div className="exc-decision-field">
            <label className="exc-field-label">Return Code</label>
            <select className="exc-return-select" value={returnCode} onChange={e => setReturnCode(e.target.value)}>
              {ACH_RETURN_CODES.map(rc => (
                <option key={rc.code} value={rc.code}>{rc.code} — {rc.label}</option>
              ))}
            </select>
          </div>
          <div className="exc-decision-field">
            <label className="exc-field-label">Notes (optional)</label>
            <textarea className="exc-notes-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for return..." />
          </div>
        </>
      )}

      {decisionAction === 'OFFSET' && (
        <>
          <div className="exc-decision-title">Offset &amp; Pay</div>
          {selectedOffsetAccountId ? (
            <p className="exc-decision-desc">
              Transfer <strong>{formatCurrency(item.shortfall)}</strong> from{' '}
              <span className="cell-mono">{selectedOffsetAccountId}</span> to{' '}
              <span className="cell-mono">{item.finxactAccountId}</span>, then post debit of{' '}
              <strong>{formatCurrency(item.amount)}</strong>.
            </p>
          ) : (
            <p className="exc-decision-desc">Select an offset account from the customer&apos;s accounts above.</p>
          )}
          <div className="exc-decision-field">
            <label className="exc-field-label">Notes (optional)</label>
            <textarea className="exc-notes-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Offset notes..." />
          </div>
        </>
      )}

      {decisionAction === 'HOLD' && (
        <>
          <div className="exc-decision-title">Hold Decision</div>
          <div className="exc-decision-field">
            <label className="exc-field-label">Hold Duration</label>
            <select className="exc-return-select" value={holdDuration} onChange={e => setHoldDuration(e.target.value)}>
              <option value="eod">End of Day</option>
              <option value="1d">1 Banking Day</option>
              <option value="2d">2 Banking Days</option>
            </select>
          </div>
          <div className="exc-decision-field">
            <label className="exc-field-label">Reason (required)</label>
            <textarea className="exc-notes-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for hold..." />
          </div>
        </>
      )}

      {decisionAction === 'ESCALATE' && (
        <>
          <div className="exc-decision-title">Escalate</div>
          <div className="exc-decision-field">
            <label className="exc-field-label">Route To</label>
            <select className="exc-return-select" value={escalateTo} onChange={e => setEscalateTo(e.target.value)}>
              <option value="risk">Risk Team</option>
              <option value="compliance">Compliance</option>
              <option value="management">Management</option>
            </select>
          </div>
          <div className="exc-decision-field">
            <label className="exc-field-label">Notes</label>
            <textarea className="exc-notes-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Escalation notes..." />
          </div>
        </>
      )}

      <div className="exc-decision-actions">
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSubmit}
          disabled={isSubmitting || (decisionAction === 'HOLD' && !notes.trim()) || (decisionAction === 'OFFSET' && !selectedOffsetAccountId)}
        >
          {isSubmitting ? 'Submitting...' : `Confirm ${decisionAction === 'PAY' ? 'Pay' : decisionAction === 'RETURN' ? 'Return' : decisionAction === 'OFFSET' ? 'Offset & Pay' : decisionAction === 'HOLD' ? 'Hold' : 'Escalate'}`}
        </button>
        <button className="btn btn-sm btn-secondary" onClick={closeDecision} disabled={isSubmitting}>Cancel</button>
      </div>
    </div>
  );
}

// --- ACHDebitDetail (expand row) ---

function ACHDebitDetail({ item }) {
  const { activeDecisionItemId, decisionAction, openDecision } = useExceptions();
  const isDeciding = activeDecisionItemId === item.id;
  const isPending = item.status === 'PENDING_DECISION';

  return (
    <div className="expand-content">
      <div className="exc-detail-grid">
        {/* Left: Entry Details */}
        <div className="exc-detail-section">
          <h4 className="exc-detail-heading">Entry Details</h4>
          <div className="expand-meta">
            <div className="meta-item"><span className="meta-label">Trace #</span><span className="meta-value cell-mono">{item.traceNumber}</span></div>
            <div className="meta-item"><span className="meta-label">Company Name</span><span className="meta-value">{item.companyName}</span></div>
            <div className="meta-item"><span className="meta-label">Company ID</span><span className="meta-value cell-mono">{item.companyId}</span></div>
            <div className="meta-item"><span className="meta-label">SEC Code</span><span className="meta-value"><span className="event-type-badge">{item.secCode}</span></span></div>
            <div className="meta-item"><span className="meta-label">Description</span><span className="meta-value">{item.companyEntryDescription}</span></div>
            <div className="meta-item"><span className="meta-label">Txn Code</span><span className="meta-value">{item.transactionCode} — {TXN_CODE_LABELS[item.transactionCode] || 'Unknown'}</span></div>
            <div className="meta-item"><span className="meta-label">Effective Date</span><span className="meta-value">{formatDate(item.effectiveDate)}</span></div>
            <div className="meta-item"><span className="meta-label">Source File</span><span className="meta-value cell-mono">{item.sourceFileName}</span></div>
            <div className="meta-item"><span className="meta-label">Batch Window</span><span className="meta-value">{item.batchWindow}</span></div>
            <div className="meta-item"><span className="meta-label">Received</span><span className="meta-value">{formatDateTime(item.receivedAt)}</span></div>
          </div>
        </div>

        {/* Center: Account & Balance */}
        <div className="exc-detail-section">
          <h4 className="exc-detail-heading">Account &amp; Balance</h4>
          <div className="expand-meta">
            <div className="meta-item"><span className="meta-label">Routing #</span><span className="meta-value cell-mono">{item.routingNumber}</span></div>
            <div className="meta-item"><span className="meta-label">Account #</span><span className="meta-value cell-mono">{item.accountNumber}</span></div>
            <div className="meta-item"><span className="meta-label">Receiving Name</span><span className="meta-value">{item.receivingName}</span></div>
            <div className="meta-item"><span className="meta-label">VAN</span><span className="meta-value cell-mono">{item.receivingVAN}</span></div>
            <div className="meta-item"><span className="meta-label">FinXact Account</span><span className="meta-value cell-mono">{item.finxactAccountId}</span></div>
          </div>
          <div className="exc-balance-block">
            <div className="exc-balance-row">
              <span>Debit Amount</span>
              <span className="cell-mono amount-debit">{formatCurrency(item.amount)}</span>
            </div>
            <div className="exc-balance-row">
              <span>Available Balance</span>
              <span className="cell-mono">{formatCurrency(item.availableBalance)}</span>
            </div>
            {item.pendingCredits > 0 && (
              <div className="exc-balance-row">
                <span>Pending Credits</span>
                <span className="cell-mono" style={{ color: '#64748b' }}>+{formatCurrency(item.pendingCredits)}</span>
              </div>
            )}
            <div className="exc-balance-row exc-balance-total">
              <span>Shortfall</span>
              {item.shortfall > 0
                ? <span className="cell-mono exc-shortfall">{formatCurrency(item.shortfall)}</span>
                : <span className="cell-mono exc-no-shortfall">None — sufficient</span>
              }
            </div>
          </div>
        </div>

        {/* Right: Other Accounts */}
        <div className="exc-detail-section">
          <h4 className="exc-detail-heading">Customer Other Accounts</h4>
          {item.customerOtherAccounts.length === 0 ? (
            <p className="exc-no-accounts">No other accounts on file</p>
          ) : (
            <table className="exc-offset-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Balance</th>
                  {isPending && <th></th>}
                </tr>
              </thead>
              <tbody>
                {item.customerOtherAccounts.map(acct => (
                  <tr key={acct.accountId}>
                    <td className="cell-mono">{acct.accountId}</td>
                    <td>{acct.type}</td>
                    <td className="cell-mono">{formatCurrency(acct.balance)}</td>
                    {isPending && (
                      <td>
                        <button
                          className="btn btn-sm btn-offset"
                          onClick={() => openDecision(item.id, 'OFFSET', acct.accountId)}
                          disabled={acct.balance < item.shortfall}
                        >
                          Offset
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Notes */}
      {item.notes.length > 0 && (
        <div className="exc-notes-section">
          {item.notes.map((note, i) => (
            <div key={i} className="exc-note-item">
              <span className="exc-note-icon">&#9888;</span> {note}
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      {isPending && !isDeciding && (
        <div className="exc-action-bar">
          <button className="btn btn-sm btn-pay" onClick={() => openDecision(item.id, 'PAY')}>Pay</button>
          <button className="btn btn-sm btn-return" onClick={() => openDecision(item.id, 'RETURN')}>Return</button>
          {item.customerOtherAccounts.length > 0 && item.shortfall > 0 && (
            <button className="btn btn-sm btn-offset" onClick={() => openDecision(item.id, 'OFFSET')}>Offset &amp; Pay</button>
          )}
          <button className="btn btn-sm btn-hold" onClick={() => openDecision(item.id, 'HOLD')}>Hold</button>
          <button className="btn btn-sm btn-escalate" onClick={() => openDecision(item.id, 'ESCALATE')}>Escalate</button>
        </div>
      )}

      {/* Decision confirmation panel */}
      {isDeciding && decisionAction && <DecisionPanel item={item} />}

      {/* Decision history (for already-actioned items) */}
      {item.decisionHistory.length > 0 && (
        <div className="exc-history">
          <h4 className="exc-detail-heading">Decision History</h4>
          {item.decisionHistory.map((entry, i) => (
            <div key={i} className="exc-history-entry">
              <span className="status-badge badge-info">{entry.action}</span>
              {entry.returnCode && <span className="cell-mono"> {entry.returnCode}</span>}
              {entry.escalateTo && <span> → {entry.escalateTo}</span>}
              <span className="exc-history-time">{formatDateTime(entry.decidedAt)}</span>
              {entry.notes && <span className="exc-history-notes">{entry.notes}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Queue Component ---

export default function ACHDebitQueue() {
  const {
    achDebitQueue, priorityFilter, statusFilter, sortField, sortDir,
    selectedIds, expandedItemId,
    setPriorityFilter, setStatusFilter, setSort,
    toggleSelect, selectAll, clearSelection, toggleExpandedItem,
    submitDecision, isSubmitting,
  } = useExceptions();

  const [bulkAction, setBulkAction] = useState(null);

  // Filter
  const filtered = useMemo(() => {
    let items = achDebitQueue;
    if (priorityFilter) items = items.filter(i => i.priority === priorityFilter);
    if (statusFilter) items = items.filter(i => i.status === statusFilter);
    return items;
  }, [achDebitQueue, priorityFilter, statusFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'returnDeadline') {
        cmp = new Date(a.returnDeadline) - new Date(b.returnDeadline);
      } else if (sortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (sortField === 'priority') {
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      } else if (sortField === 'companyName') {
        cmp = a.companyName.localeCompare(b.companyName);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const pendingCount = achDebitQueue.filter(i => i.status === 'PENDING_DECISION').length;
  const hasSelection = selectedIds.length > 0;

  const handleSelectAll = () => {
    const visiblePendingIds = sorted.filter(i => i.status === 'PENDING_DECISION').map(i => i.id);
    if (selectedIds.length === visiblePendingIds.length) {
      clearSelection();
    } else {
      selectAll(visiblePendingIds);
    }
  };

  const handleBulkPay = async () => {
    setBulkAction('PAY');
    for (const id of selectedIds) {
      await submitDecision(id, { action: 'PAY' });
    }
    clearSelection();
    setBulkAction(null);
  };

  const handleBulkReturn = async () => {
    setBulkAction('RETURN');
    for (const id of selectedIds) {
      await submitDecision(id, { action: 'RETURN', returnCode: 'R01' });
    }
    clearSelection();
    setBulkAction(null);
  };

  const SortHeader = ({ field, children }) => {
    const isActive = sortField === field;
    return (
      <th onClick={() => setSort(field)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        {children}
        {isActive && <span className="sort-icon">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}
      </th>
    );
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          ACH Debit Decisioning
          <span className="count-badge">{pendingCount} pending</span>
        </h2>
      </div>

      {/* Filter Bar */}
      <div className="txn-filter-bar">
        <div className="txn-filter-group">
          <span className="txn-filter-label">Priority</span>
          <div className="txn-filter-pills">
            {['critical', 'high', 'medium', 'low'].map(p => (
              <button
                key={p}
                className={`txn-pill ${priorityFilter === p ? `txn-pill-active badge-${p}` : ''}`}
                onClick={() => setPriorityFilter(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="txn-filter-group">
          <span className="txn-filter-label">Status</span>
          <div className="txn-filter-pills">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`txn-pill ${statusFilter === key ? 'txn-pill-active' : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {(priorityFilter || statusFilter) && (
          <button className="txn-clear-filters" onClick={() => { setPriorityFilter(null); setStatusFilter(null); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {hasSelection && (
        <div className="exc-bulk-bar">
          <span>{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</span>
          <button className="btn btn-sm btn-pay" onClick={handleBulkPay} disabled={!!bulkAction}>
            {bulkAction === 'PAY' ? 'Paying...' : 'Pay All'}
          </button>
          <button className="btn btn-sm btn-return" onClick={handleBulkReturn} disabled={!!bulkAction}>
            {bulkAction === 'RETURN' ? 'Returning...' : 'Return All (R01)'}
          </button>
          <button className="btn btn-sm btn-secondary" onClick={clearSelection} disabled={!!bulkAction}>Clear</button>
        </div>
      )}

      {/* Queue Table */}
      <div className="table-wrapper">
        <table className="exc-queue-table">
          <thead>
            <tr>
              <th className="exc-checkbox-cell">
                <input type="checkbox" className="exc-checkbox" onChange={handleSelectAll} checked={hasSelection && selectedIds.length === sorted.filter(i => i.status === 'PENDING_DECISION').length} />
              </th>
              <SortHeader field="priority">Priority</SortHeader>
              <SortHeader field="companyName">Company Name</SortHeader>
              <th>Description</th>
              <SortHeader field="amount">Amount</SortHeader>
              <th>Receiving Acct</th>
              <th>Balance</th>
              <th>Shortfall</th>
              <SortHeader field="returnDeadline">Deadline</SortHeader>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          {sorted.map(item => {
              const isExpanded = expandedItemId === item.id;
              const isPending = item.status === 'PENDING_DECISION';
              return (
                <tbody key={item.id}>
                  <tr
                    className={`${isExpanded ? 'row-expanded' : ''} ${item.priority === 'critical' ? 'row-overdue' : ''}`}
                    onClick={() => toggleExpandedItem(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="exc-checkbox-cell" onClick={e => e.stopPropagation()}>
                      {isPending && (
                        <input
                          type="checkbox"
                          className="exc-checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      )}
                    </td>
                    <td>
                      <span className={`priority-dot priority-${item.priority}`} title={item.priority} />
                    </td>
                    <td>
                      <span className="cell-name">{item.companyName}</span>
                      <span className="event-type-badge" style={{ marginLeft: '0.375rem' }}>{item.secCode}</span>
                    </td>
                    <td>{item.companyEntryDescription}</td>
                    <td className="cell-mono amount-debit">{formatCurrency(item.amount)}</td>
                    <td className="cell-mono">{item.receivingVAN}</td>
                    <td className="cell-mono">{formatCurrency(item.availableBalance)}</td>
                    <td>
                      {item.shortfall > 0
                        ? <span className="cell-mono exc-shortfall">{formatCurrency(item.shortfall)}</span>
                        : <span className="exc-no-shortfall">—</span>
                      }
                    </td>
                    <td><DeadlineCountdown deadline={item.returnDeadline} /></td>
                    <td><span className={`status-badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABELS[item.status]}</span></td>
                    <td>
                      <span className={`chevron ${isExpanded ? 'chevron-open' : ''}`}>&#9654;</span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="expand-row">
                      <td colSpan="11">
                        <ACHDebitDetail item={item} />
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
        </table>
      </div>

      {sorted.length === 0 && (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>
          No items match the current filters.
        </p>
      )}
    </div>
  );
}
