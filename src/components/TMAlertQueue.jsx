import { useState, useMemo, useEffect } from 'react';
import { useTM } from '../context/TMContext';
import { SEVERITY_CONFIG } from '../data/tmMockData';

// --- Helpers ---

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDateTime(iso) {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
}

const STATUS_LABELS = {
  PENDING_REVIEW: 'Pending',
  CLEARED: 'Cleared',
  CONTACTED: 'Contacted',
  ESCALATED: 'Escalated',
};

const STATUS_BADGE = {
  PENDING_REVIEW: 'tm-badge-pending',
  CLEARED: 'tm-badge-cleared',
  CONTACTED: 'tm-badge-contacted',
  ESCALATED: 'tm-badge-escalated',
};

// --- SLA Countdown ---

function SLACountdown({ alert }) {
  const slaHours = SEVERITY_CONFIG[alert.severity]?.slaHours || 168;
  const created = new Date(alert.timestamp);
  const deadline = new Date(created.getTime() + slaHours * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = deadline - now;

  if (alert.status !== 'PENDING_REVIEW') return null;

  if (diffMs <= 0) {
    return <span className="tm-sla tm-sla-overdue">OVERDUE</span>;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let className = 'tm-sla ';
  if (hours < 2) className += 'tm-sla-critical';
  else if (hours < 24) className += 'tm-sla-warning';
  else className += 'tm-sla-ok';

  if (hours >= 48) {
    return <span className={className}>{Math.floor(hours / 24)}d {hours % 24}h</span>;
  }
  return <span className={className}>{hours}h {minutes}m</span>;
}

// --- Filter Bar ---

function FilterBar() {
  const { filters, setFilter, clearFilters, alerts } = useTM();

  const partners = useMemo(() => {
    const map = new Map();
    alerts.forEach(a => { if (a.partnerId) map.set(a.partnerId, a.partnerName); });
    return [...map.entries()];
  }, [alerts]);

  const merchants = useMemo(() => {
    const map = new Map();
    alerts.forEach(a => { if (a.merchantId) map.set(a.merchantId, a.merchantName); });
    return [...map.entries()];
  }, [alerts]);

  const hasFilters = Object.values(filters).some(v => v !== null && v !== '');

  return (
    <div className="tm-filter-bar">
      <div className="tm-filter-row">
        <input
          type="text"
          className="tm-filter-input"
          placeholder="Search transaction ID..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
        <select
          className="tm-filter-select"
          value={filters.severity || ''}
          onChange={e => setFilter('severity', e.target.value || null)}
        >
          <option value="">All Severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          className="tm-filter-select"
          value={filters.status || ''}
          onChange={e => setFilter('status', e.target.value || null)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="CLEARED">Cleared</option>
          <option value="CONTACTED">Contacted</option>
          <option value="ESCALATED">Escalated</option>
        </select>
        <select
          className="tm-filter-select"
          value={filters.network || ''}
          onChange={e => setFilter('network', e.target.value || null)}
        >
          <option value="">All Networks</option>
          <option value="ACH">ACH</option>
          <option value="FEDNOW">FedNow</option>
          <option value="RTP">RTP</option>
        </select>
        <select
          className="tm-filter-select"
          value={filters.partnerId || ''}
          onChange={e => setFilter('partnerId', e.target.value || null)}
        >
          <option value="">All Partners</option>
          {partners.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          className="tm-filter-select"
          value={filters.merchantId || ''}
          onChange={e => setFilter('merchantId', e.target.value || null)}
        >
          <option value="">All Merchants</option>
          {merchants.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <input
          type="date"
          className="tm-filter-input tm-filter-date"
          value={filters.dateFrom || ''}
          onChange={e => setFilter('dateFrom', e.target.value || null)}
          placeholder="From"
        />
        <input
          type="date"
          className="tm-filter-input tm-filter-date"
          value={filters.dateTo || ''}
          onChange={e => setFilter('dateTo', e.target.value || null)}
          placeholder="To"
        />
        {hasFilters && (
          <button className="tm-filter-clear" onClick={clearFilters}>Clear</button>
        )}
      </div>
    </div>
  );
}

// --- Alert Detail ---

function AlertDetail({ alert }) {
  const { loadMerchantHistory, merchantHistory, merchantHistoryLoading, openDecision, activeDecisionAlertId } = useTM();

  useEffect(() => {
    loadMerchantHistory(alert.merchantId);
  }, [alert.merchantId, loadMerchantHistory]);

  return (
    <div className="tm-detail">
      <div className="tm-detail-grid">
        {/* Transaction Column */}
        <div className="tm-detail-col">
          <h4 className="tm-detail-heading">Transaction</h4>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Amount</span>
            <span className="tm-detail-value tm-amount">{formatCurrency(alert.amount)}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Direction</span>
            <span className="tm-detail-value">{alert.direction}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Network</span>
            <span className="tm-detail-value">{alert.network}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Type</span>
            <span className="tm-detail-value">{alert.transactionType}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Timestamp</span>
            <span className="tm-detail-value">{formatDateTime(alert.timestamp)}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Transaction ID</span>
            <span className="tm-detail-value tm-mono">{alert.transactionId.slice(0, 12)}...</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">TakTile Decision</span>
            <a className="tm-detail-link" href={alert.taktileDecisionUrl} target="_blank" rel="noopener noreferrer">
              View in TakTile
            </a>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Rules Version</span>
            <span className="tm-detail-value">
              <span className="tm-version-badge">{alert.taktileVersion}</span>
              {' '}<span className="tm-version-policy">{alert.taktilePolicyName}</span>
              {' '}<span className="tm-version-rules">({alert.taktileRuleCount} rules)</span>
            </span>
          </div>
          {alert.loanId && (
            <>
              <div className="tm-detail-row">
                <span className="tm-detail-label">Loan ID</span>
                <span className="tm-detail-value tm-mono">{alert.loanId.slice(0, 12)}...</span>
              </div>
              <div className="tm-detail-row">
                <span className="tm-detail-label">Loan Type</span>
                <span className="tm-detail-value">{alert.loanType}</span>
              </div>
            </>
          )}
        </div>

        {/* Context Column */}
        <div className="tm-detail-col">
          <h4 className="tm-detail-heading">Context</h4>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Merchant</span>
            <span className="tm-detail-value">{alert.merchantName}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Merchant ID</span>
            <span className="tm-detail-value tm-mono">{alert.merchantId.slice(0, 12)}...</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Business Type</span>
            <span className="tm-detail-value">{alert.merchantBusinessType}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">State</span>
            <span className="tm-detail-value">{alert.merchantState}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Account Age</span>
            <span className="tm-detail-value">{alert.merchantAccountAgeDays} days</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Partner</span>
            <span className="tm-detail-value">{alert.partnerName}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Use Case</span>
            <span className="tm-detail-value">{alert.useCaseLabel}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Source</span>
            <span className="tm-detail-value">{alert.sourceSystem}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Account Balance</span>
            <span className="tm-detail-value">{formatCurrency(alert.accountBalance)}</span>
          </div>
        </div>

        {/* Risk Indicators Column */}
        <div className="tm-detail-col">
          <h4 className="tm-detail-heading">Risk Indicators</h4>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Severity</span>
            <span className={`tm-severity-badge tm-severity-${alert.severity.toLowerCase()}`}>
              {alert.severity}
            </span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Velocity Score</span>
            <span className="tm-detail-value">{alert.velocityRiskScore}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Amount Tier</span>
            <span className="tm-detail-value">{alert.amountTier}</span>
          </div>
          <div className="tm-detail-row">
            <span className="tm-detail-label">Routing Status</span>
            <span className="tm-detail-value">{alert.routingWhitelistStatus}</span>
          </div>
          <div className="tm-risk-flags">
            {alert.isStructuringRange && <span className="tm-risk-flag tm-risk-flag-warn">Structuring Range</span>}
            {alert.isRoundNumber && <span className="tm-risk-flag tm-risk-flag-warn">Round Number ({alert.consecutiveRoundCount}x)</span>}
            {alert.weekendHolidayFlag && <span className="tm-risk-flag tm-risk-flag-info">Weekend/Holiday</span>}
            {alert.internationalFlag && <span className="tm-risk-flag tm-risk-flag-warn">International</span>}
            {alert.wireTransferFlag && <span className="tm-risk-flag tm-risk-flag-info">Wire Transfer</span>}
            {alert.depositToPayoutMinutes < 60 && <span className="tm-risk-flag tm-risk-flag-warn">Rapid Payout ({alert.depositToPayoutMinutes}m)</span>}
          </div>
          {alert.triggeredConditions.length > 0 && (
            <div className="tm-conditions">
              <span className="tm-detail-label">Triggered Conditions</span>
              <div className="tm-condition-chips">
                {alert.triggeredConditions.map(c => (
                  <span key={c.rule} className="tm-condition-chip" title={c.description}>
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="tm-detail-row">
            <span className="tm-detail-label">Previous Alerts</span>
            <span className="tm-detail-value">{alert.previousAlertCount}</span>
          </div>
        </div>
      </div>

      {/* Decision Panel or History */}
      {alert.status === 'PENDING_REVIEW' && activeDecisionAlertId !== alert.decisionId && (
        <div className="tm-action-bar">
          <button className="tm-btn tm-btn-clear" onClick={() => openDecision(alert.decisionId, 'CLEAR')}>Clear</button>
          <button className="tm-btn tm-btn-contact" onClick={() => openDecision(alert.decisionId, 'CONTACT')}>Contact Party</button>
          <button className="tm-btn tm-btn-escalate" onClick={() => openDecision(alert.decisionId, 'ESCALATE')}>Escalate</button>
        </div>
      )}

      {activeDecisionAlertId === alert.decisionId && (
        <DecisionPanel alert={alert} />
      )}

      {alert.status !== 'PENDING_REVIEW' && (
        <div className="tm-outcome-summary">
          <div className="tm-outcome-row">
            <span className="tm-detail-label">Outcome</span>
            <span className={`tm-status-badge ${STATUS_BADGE[alert.status]}`}>{STATUS_LABELS[alert.status]}</span>
          </div>
          <div className="tm-outcome-row">
            <span className="tm-detail-label">Analyst</span>
            <span className="tm-detail-value">{alert.updatedBy}</span>
          </div>
          <div className="tm-outcome-row">
            <span className="tm-detail-label">Date</span>
            <span className="tm-detail-value">{formatDateTime(alert.updatedAt)}</span>
          </div>
          {alert.analystNotes && (
            <div className="tm-outcome-notes">
              <span className="tm-detail-label">Notes</span>
              <p className="tm-notes-text">{alert.analystNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Merchant Alert History */}
      <div className="tm-history">
        <h4 className="tm-detail-heading">Merchant Alert History</h4>
        {merchantHistoryLoading ? (
          <p className="tm-history-loading">Loading history...</p>
        ) : merchantHistory.length === 0 ? (
          <p className="tm-history-empty">No previous alerts for this merchant.</p>
        ) : (
          <table className="tm-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Severity</th>
                <th>Outcome</th>
                <th>Analyst</th>
              </tr>
            </thead>
            <tbody>
              {merchantHistory.map(h => (
                <tr key={h.decisionId}>
                  <td>{formatDate(h.timestamp)}</td>
                  <td>{formatCurrency(h.amount)}</td>
                  <td>
                    <span className="tm-severity-dot" style={{ background: SEVERITY_CONFIG[h.severity]?.color }} />
                    {h.severity}
                  </td>
                  <td><span className={`tm-status-badge ${STATUS_BADGE[h.status]}`}>{STATUS_LABELS[h.status]}</span></td>
                  <td>{h.updatedBy?.split('@')[0] || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- Decision Panel ---

function DecisionPanel({ alert }) {
  const { decisionAction, isSubmitting, submitDecision, closeDecision, openUARForm } = useTM();
  const [notes, setNotes] = useState('');
  const [generateUAR, setGenerateUAR] = useState(true);

  const actionLabels = { CLEAR: 'Clear Alert', CONTACT: 'Contact Party', ESCALATE: 'Escalate to Bank' };
  const actionColors = { CLEAR: 'tm-btn-clear', CONTACT: 'tm-btn-contact', ESCALATE: 'tm-btn-escalate' };

  const handleSubmit = async () => {
    if (notes.trim().length < 10) return;
    const result = await submitDecision(alert.decisionId, {
      action: decisionAction,
      notes: notes.trim(),
    });
    if (result && decisionAction === 'ESCALATE' && generateUAR) {
      openUARForm(alert.decisionId);
    }
  };

  return (
    <div className="tm-decision-panel">
      <div className="tm-decision-header">
        <span className="tm-decision-title">{actionLabels[decisionAction]}</span>
        <button className="tm-decision-close" onClick={closeDecision}>&times;</button>
      </div>
      {decisionAction === 'CLEAR' && (
        <p className="tm-decision-desc">Confirm no suspicious activity for this transaction of <strong>{formatCurrency(alert.amount)}</strong> from <strong>{alert.merchantName}</strong>.</p>
      )}
      {decisionAction === 'CONTACT' && (
        <p className="tm-decision-desc">Initiate contact with <strong>{alert.partnerName}</strong> regarding <strong>{alert.merchantName}</strong> transaction of <strong>{formatCurrency(alert.amount)}</strong>.</p>
      )}
      {decisionAction === 'ESCALATE' && (
        <p className="tm-decision-desc">Escalate <strong>{alert.severity}</strong> alert for <strong>{alert.merchantName}</strong> ({formatCurrency(alert.amount)}) to bank sponsor.</p>
      )}
      <div className="tm-decision-field">
        <label className="tm-field-label">Notes (required, min 10 characters)</label>
        <textarea
          className="tm-notes-textarea"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Enter decision rationale..."
          rows={3}
        />
        {notes.length > 0 && notes.length < 10 && (
          <span className="tm-field-hint">{10 - notes.length} more characters needed</span>
        )}
      </div>
      {decisionAction === 'ESCALATE' && (
        <label className="tm-checkbox-label">
          <input type="checkbox" checked={generateUAR} onChange={e => setGenerateUAR(e.target.checked)} />
          Generate Unusual Activity Report (UAR)
        </label>
      )}
      <div className="tm-decision-actions">
        <button className="tm-btn tm-btn-cancel" onClick={closeDecision}>Cancel</button>
        <button
          className={`tm-btn ${actionColors[decisionAction]}`}
          onClick={handleSubmit}
          disabled={isSubmitting || notes.trim().length < 10}
        >
          {isSubmitting ? 'Submitting...' : `Confirm ${actionLabels[decisionAction]}`}
        </button>
      </div>
    </div>
  );
}

// --- Sort Header ---

function SortHeader({ field, label }) {
  const { sortField, sortDir, setSort } = useTM();
  const active = sortField === field;
  return (
    <th className="tm-sort-header" onClick={() => setSort(field)}>
      {label}
      {active && <span className="tm-sort-arrow">{sortDir === 'asc' ? ' \u25B2' : ' \u25BC'}</span>}
    </th>
  );
}

// --- Main Queue ---

export default function TMAlertQueue() {
  const { alerts, filters, sortField, sortDir, expandedAlertId, toggleExpandedAlert } = useTM();

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    if (filters.severity) result = result.filter(a => a.severity === filters.severity);
    if (filters.status) result = result.filter(a => a.status === filters.status);
    if (filters.network) result = result.filter(a => a.network === filters.network);
    if (filters.partnerId) result = result.filter(a => a.partnerId === filters.partnerId);
    if (filters.merchantId) result = result.filter(a => a.merchantId === filters.merchantId);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(a =>
        a.transactionId.toLowerCase().includes(q) ||
        a.decisionId.toLowerCase().includes(q) ||
        a.merchantName.toLowerCase().includes(q)
      );
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(a => new Date(a.timestamp) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(a => new Date(a.timestamp) <= to);
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'amount') {
        aVal = Math.abs(aVal);
        bVal = Math.abs(bVal);
      }
      if (sortField === 'severity') {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        aVal = order[aVal];
        bVal = order[bVal];
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [alerts, filters, sortField, sortDir]);

  return (
    <div className="tm-queue-section">
      <div className="tm-queue-header">
        <h3 className="tm-queue-title">Alert Queue</h3>
        <span className="tm-queue-count">{filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}</span>
      </div>
      <FilterBar />
      <div className="tm-table-wrapper">
        <table className="tm-alert-table">
          <thead>
            <tr>
              <th className="tm-col-severity">Sev</th>
              <SortHeader field="timestamp" label="Timestamp" />
              <SortHeader field="amount" label="Amount" />
              <th>Dir</th>
              <th>Network</th>
              <th>Merchant</th>
              <th>Partner</th>
              <th>Use Case</th>
              <SortHeader field="severity" label="Risk" />
              <th>Status</th>
              <th>Rules</th>
              <th>SLA</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map(alert => (
              <AlertRow
                key={alert.decisionId}
                alert={alert}
                isExpanded={expandedAlertId === alert.decisionId}
                onToggle={() => toggleExpandedAlert(alert.decisionId)}
              />
            ))}
            {filteredAlerts.length === 0 && (
              <tr><td colSpan={12} className="tm-empty">No alerts match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertRow({ alert, isExpanded, onToggle }) {
  return (
    <>
      <tr className={`tm-alert-row ${isExpanded ? 'tm-alert-row-expanded' : ''} tm-alert-row-${alert.severity.toLowerCase()}`} onClick={onToggle}>
        <td>
          <span className="tm-severity-dot" style={{ background: SEVERITY_CONFIG[alert.severity]?.color }} />
        </td>
        <td>{formatDateTime(alert.timestamp)}</td>
        <td className="tm-amount">{formatCurrency(alert.amount)}</td>
        <td>{alert.direction}</td>
        <td>{alert.network}</td>
        <td className="tm-cell-merchant">{alert.merchantName}</td>
        <td>{alert.partnerName}</td>
        <td>{alert.useCaseLabel}</td>
        <td>{alert.velocityRiskScore}</td>
        <td><span className={`tm-status-badge ${STATUS_BADGE[alert.status]}`}>{STATUS_LABELS[alert.status]}</span></td>
        <td><span className="tm-version-badge">{alert.taktileVersion}</span></td>
        <td><SLACountdown alert={alert} /></td>
      </tr>
      {isExpanded && (
        <tr className="tm-detail-row-wrapper">
          <td colSpan={12}>
            <AlertDetail alert={alert} />
          </td>
        </tr>
      )}
    </>
  );
}
