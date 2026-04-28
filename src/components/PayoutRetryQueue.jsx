import { useState, useMemo } from 'react';
import { getRetryData } from '../data/retryMockData';

// --- Helpers ---

function fmtAmt(n) {
  if (n == null) return '--';
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTime(iso) {
  if (!iso) return '--';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDateTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(ms) {
  if (!ms && ms !== 0) return '--';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function fmtMs(ms) {
  if (!ms) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// --- Badge Components ---

function TypeBadge({ type }) {
  const isInstant = type === 'instant_payout';
  return (
    <span className={`retry-type-badge ${isInstant ? 'retry-type-instant' : 'retry-type-loan'}`}>
      {isInstant ? 'Instant Payout' : 'Loan Funding'}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { cls: 'retry-status-active', label: 'Active' },
    completed: { cls: 'retry-status-completed', label: 'Resolved' },
    escalated: { cls: 'retry-status-escalated', label: 'Escalated' },
    hard_decline: { cls: 'retry-status-declined', label: 'Hard Decline' },
    failed: { cls: 'retry-status-failed', label: 'Failed' },
    fallback: { cls: 'retry-status-ambiguous', label: 'Fallback' },
    manual: { cls: 'retry-status-active', label: 'Manual' },
    resolved: { cls: 'retry-status-completed', label: 'Resolved' },
    success: { cls: 'retry-status-success', label: 'Success' },
    pending: { cls: 'retry-status-pending', label: 'In Flight' },
  };
  const s = map[status] || { cls: '', label: status };
  return <span className={`retry-badge ${s.cls}`}>{s.label}</span>;
}

function RailBadge({ rail }) {
  const cls = rail === 'FedNow' ? 'retry-rail-fednow'
    : rail === 'RTP' ? 'retry-rail-rtp'
    : rail === 'OCT' ? 'retry-rail-oct'
    : rail === 'Same-Day ACH' ? 'retry-rail-sdach'
    : 'retry-rail-ndach';
  return <span className={`retry-rail-badge ${cls}`}>{rail}</span>;
}

// --- Retry Rules Summary ---

function RetryRulesSummary({ type }) {
  if (type === 'loan_funding') {
    return (
      <div className="retry-panel-section">
        <h4 className="retry-panel-section-title">Retry Rules</h4>
        <div className="retry-rules-summary">
          <div className="retry-rules-rule">
            <span className="retry-rules-label">Type</span>
            <span className="retry-rules-value">Loan Funding</span>
          </div>
          <div className="retry-rules-rule">
            <span className="retry-rules-label">Primary Rails</span>
            <span className="retry-rules-value">
              <RailBadge rail="FedNow" /> <RailBadge rail="RTP" />
            </span>
          </div>
          <div className="retry-rules-rule">
            <span className="retry-rules-label">Retry Limit</span>
            <span className="retry-rules-value">5 retries within 1 hour</span>
          </div>
          <div className="retry-rules-rule">
            <span className="retry-rules-label">Fallback</span>
            <span className="retry-rules-value"><RailBadge rail="Same-Day ACH" /></span>
          </div>
          <div className="retry-rules-cascade-flow">
            FedNow/RTP (5 retries / 1hr) &rarr; Same-Day ACH
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="retry-panel-section">
      <h4 className="retry-panel-section-title">Retry Rules</h4>
      <div className="retry-rules-summary">
        <div className="retry-rules-rule">
          <span className="retry-rules-label">Type</span>
          <span className="retry-rules-value">Instant Payout</span>
        </div>
        <div className="retry-rules-rule">
          <span className="retry-rules-label">Cascade Order</span>
          <span className="retry-rules-value">
            <RailBadge rail="FedNow" /> &rarr; <RailBadge rail="RTP" /> &rarr; <RailBadge rail="OCT" />
          </span>
        </div>
        <div className="retry-rules-rule">
          <span className="retry-rules-label">OCT Retry Limit</span>
          <span className="retry-rules-value">3 retries, then fallback to RTP/FedNow</span>
        </div>
        <div className="retry-rules-rule">
          <span className="retry-rules-label">Escalation Window</span>
          <span className="retry-rules-value">5 minutes</span>
        </div>
        <div className="retry-rules-rule">
          <span className="retry-rules-label">All Networks Fail</span>
          <span className="retry-rules-value">Manual Resolution Required</span>
        </div>
        <div className="retry-rules-cascade-flow">
          FedNow &rarr; RTP &rarr; OCT (3 retries) &rarr; RTP/FedNow fallback &rarr; Manual
        </div>
      </div>
    </div>
  );
}

// --- Attempt Timeline ---

function AttemptTimeline({ attempts }) {
  return (
    <div className="retry-timeline">
      {attempts.map((att, i) => (
        <div key={att.id} className={`retry-timeline-item ${att.status === 'success' ? 'retry-timeline-success' : att.status === 'pending' ? 'retry-timeline-pending' : 'retry-timeline-failed'}`}>
          <div className="retry-timeline-dot" />
          <div className="retry-timeline-connector" />
          <div className="retry-timeline-content">
            <div className="retry-timeline-header">
              <span className="retry-timeline-attempt">Attempt {i + 1}</span>
              <RailBadge rail={att.rail} />
              <StatusBadge status={att.status} />
            </div>
            <div className="retry-timeline-meta">
              <span>{fmtTime(att.timestamp)}</span>
              <span>Response: {fmtMs(att.response_time_ms)}</span>
            </div>
            {att.error && (
              <div className="retry-timeline-error">
                <span className="retry-error-code">{att.error.code}</span>
                <span className="retry-error-msg">{att.error.message}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Notification Log ---

function NotificationLog({ notifications }) {
  if (!notifications || notifications.length === 0) {
    return <div className="retry-no-notifs">No customer notifications sent</div>;
  }
  return (
    <div className="retry-notif-log">
      {notifications.map((n, i) => (
        <div key={i} className="retry-notif-item">
          <div className="retry-notif-icon">{n.channel === 'sms' ? '\u{1F4AC}' : '\u{2709}\u{FE0F}'}</div>
          <div className="retry-notif-body">
            <div className="retry-notif-type">{n.type === 'alternate_rail' ? 'Alternate Rail Used' : n.type === 'delay' ? 'Processing Delay' : 'Hard Decline'}</div>
            <div className="retry-notif-msg">{n.message}</div>
            <div className="retry-notif-time">{fmtDateTime(n.timestamp)} via {n.channel.toUpperCase()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Manual Resolve Form ---

function ManualResolveForm({ chain, onResolve }) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!note.trim()) return;
    setIsSubmitting(true);
    // Simulate async resolve
    setTimeout(() => {
      onResolve(chain.correlation_id, note.trim());
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="retry-resolve-form">
      <div className="retry-resolve-title">Manually Resolve</div>
      <p className="retry-resolve-desc">
        All automated retries have been exhausted for this transaction.
        A resolution note is required before marking as resolved.
      </p>

      {chain.type === 'instant_payout' && (
        <div className="retry-resolve-routing-info">
          <div className="retry-resolve-routing-title">Alternative Platform Routing</div>
          <div className="retry-resolve-routing-options">
            <div className="retry-resolve-routing-option">
              <RailBadge rail="FedNow" /> <span>Re-attempt via FedNow with updated parameters</span>
            </div>
            <div className="retry-resolve-routing-option">
              <RailBadge rail="RTP" /> <span>Re-route through RTP with manual override</span>
            </div>
            <div className="retry-resolve-routing-option">
              <RailBadge rail="Same-Day ACH" /> <span>Downgrade to Same-Day ACH (delayed settlement)</span>
            </div>
          </div>
        </div>
      )}

      {chain.type === 'loan_funding' && (
        <div className="retry-resolve-routing-info">
          <div className="retry-resolve-routing-title">Alternative Platform Routing</div>
          <div className="retry-resolve-routing-options">
            <div className="retry-resolve-routing-option">
              <RailBadge rail="Same-Day ACH" /> <span>Same-Day ACH with manual batch inclusion</span>
            </div>
            <div className="retry-resolve-routing-option">
              <RailBadge rail="FedNow" /> <span>Re-attempt FedNow/RTP with updated credentials</span>
            </div>
          </div>
        </div>
      )}

      <div className="retry-resolve-field">
        <label className="retry-resolve-label">Resolution Note (required)</label>
        <textarea
          className="retry-resolve-textarea"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Describe the resolution action taken..."
          rows={3}
        />
      </div>
      <div className="retry-resolve-actions">
        <button
          className="retry-resolve-btn"
          onClick={handleSubmit}
          disabled={!note.trim() || isSubmitting}
        >
          {isSubmitting ? 'Resolving...' : 'Resolve'}
        </button>
      </div>
    </div>
  );
}

// --- Detail Panel ---

function DetailPanel({ chain, onClose, onResolve, resolvedNotes }) {
  if (!chain) return null;

  const isEscalated = chain.status === 'escalated';
  const resolvedNote = resolvedNotes[chain.correlation_id];

  return (
    <div className="retry-panel-overlay" onClick={onClose}>
      <div className="retry-panel" onClick={e => e.stopPropagation()}>
        <div className="retry-panel-header">
          <div>
            <h3 className="retry-panel-title">{chain.correlation_id}</h3>
            <div className="retry-panel-subtitle">
              <TypeBadge type={chain.type} />
              {resolvedNote
                ? <span className="retry-badge retry-status-completed">Resolved</span>
                : <StatusBadge status={chain.status} />
              }
            </div>
          </div>
          <button className="retry-panel-close" onClick={onClose}>&times;</button>
        </div>

        <div className="retry-panel-body">
          {/* Transaction Details */}
          <div className="retry-panel-section">
            <h4 className="retry-panel-section-title">Transaction Details</h4>
            <div className="retry-detail-grid">
              <div className="retry-detail-item">
                <span className="retry-detail-label">Amount</span>
                <span className="retry-detail-value retry-detail-amount">{fmtAmt(chain.amount)}</span>
              </div>
              <div className="retry-detail-item">
                <span className="retry-detail-label">Recipient</span>
                <span className="retry-detail-value">{chain.recipient_name}</span>
              </div>
              <div className="retry-detail-item">
                <span className="retry-detail-label">Routing #</span>
                <span className="retry-detail-value retry-mono">{chain.recipient_routing}</span>
              </div>
              <div className="retry-detail-item">
                <span className="retry-detail-label">Account</span>
                <span className="retry-detail-value retry-mono">****{chain.recipient_account_last4}</span>
              </div>
              <div className="retry-detail-item">
                <span className="retry-detail-label">Created</span>
                <span className="retry-detail-value">{fmtDateTime(chain.created_at)}</span>
              </div>
              <div className="retry-detail-item">
                <span className="retry-detail-label">Resolved</span>
                <span className="retry-detail-value">{chain.resolved_at ? fmtDateTime(chain.resolved_at) : resolvedNote ? 'Just now' : 'Pending'}</span>
              </div>
              {chain.settled_rail && (
                <div className="retry-detail-item">
                  <span className="retry-detail-label">Settled Via</span>
                  <span className="retry-detail-value"><RailBadge rail={chain.settled_rail} /></span>
                </div>
              )}
              {chain.total_duration_ms != null && (
                <div className="retry-detail-item">
                  <span className="retry-detail-label">Total Duration</span>
                  <span className="retry-detail-value">{fmtDuration(chain.total_duration_ms)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Retry Rules Summary */}
          <RetryRulesSummary type={chain.type} />

          {/* Attempt Timeline */}
          <div className="retry-panel-section">
            <h4 className="retry-panel-section-title">Attempt History ({chain.attempts.length})</h4>
            <AttemptTimeline attempts={chain.attempts} />
          </div>

          {/* Customer Notifications */}
          <div className="retry-panel-section">
            <h4 className="retry-panel-section-title">Customer Notifications</h4>
            <NotificationLog notifications={chain.notifications} />
          </div>

          {/* Resolution Note (if already resolved via manual action) */}
          {resolvedNote && (
            <div className="retry-panel-section">
              <h4 className="retry-panel-section-title">Resolution</h4>
              <div className="retry-resolved-note">
                <div className="retry-resolved-note-header">
                  <span className="retry-badge retry-status-completed">Resolved</span>
                  <span className="retry-resolved-note-time">{resolvedNote.timestamp}</span>
                </div>
                <div className="retry-resolved-note-text">{resolvedNote.note}</div>
              </div>
            </div>
          )}

          {/* Manual Resolve (for escalated items not yet resolved) */}
          {isEscalated && !resolvedNote && (
            <div className="retry-panel-section">
              <ManualResolveForm chain={chain} onResolve={onResolve} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Stats Bar ---

function StatsBar({ chains, resolvedNotes }) {
  const escalatedCount = chains.filter(c => c.status === 'escalated' && !resolvedNotes[c.correlation_id]).length;
  const failedRetrying = chains.filter(c => c.status === 'active').length;

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const resolved24h = chains.filter(c =>
    (c.status === 'completed' && c.resolved_at && new Date(c.resolved_at).getTime() > twentyFourHoursAgo) ||
    resolvedNotes[c.correlation_id]
  ).length;

  const hardDeclines = chains.filter(c => c.status === 'hard_decline').length;

  return (
    <div className="retry-stats-bar" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <div className="retry-stat-card retry-stat-escalated">
        <div className="retry-stat-value">{escalatedCount}</div>
        <div className="retry-stat-label">Escalated</div>
        <div className="retry-stat-sub">Action needed</div>
      </div>
      <div className="retry-stat-card retry-stat-active">
        <div className="retry-stat-value">{failedRetrying}</div>
        <div className="retry-stat-label">Failed</div>
        <div className="retry-stat-sub">Auto-retrying</div>
      </div>
      <div className="retry-stat-card">
        <div className="retry-stat-value">{resolved24h}</div>
        <div className="retry-stat-label">Resolved</div>
        <div className="retry-stat-sub">Last 24 hours</div>
      </div>
      <div className="retry-stat-card">
        <div className="retry-stat-value">{hardDeclines}</div>
        <div className="retry-stat-label">Hard Declines</div>
        <div className="retry-stat-sub">No retry</div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function PayoutRetryQueue() {
  const { chains: allChains, stats } = useMemo(() => getRetryData(), []);

  const [selectedChain, setSelectedChain] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resolvedNotes, setResolvedNotes] = useState({});

  // Map mock statuses to the queue's status model
  // 'active' -> 'fallback' (auto-retrying / trying next rail)
  // 'completed' -> 'resolved'
  // 'escalated' -> 'escalated'
  // 'hard_decline' -> 'hard_decline'
  function getDisplayStatus(chain) {
    if (resolvedNotes[chain.correlation_id]) return 'resolved';
    if (chain.status === 'active') return 'fallback';
    if (chain.status === 'completed') return 'resolved';
    return chain.status;
  }

  const handleResolve = (correlationId, note) => {
    setResolvedNotes(prev => ({
      ...prev,
      [correlationId]: {
        note,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      },
    }));
  };

  // Compute filter counts
  const counts = useMemo(() => {
    const c = { all: allChains.length, escalated: 0, fallback: 0, resolved: 0, hard_decline: 0 };
    allChains.forEach(chain => {
      const ds = resolvedNotes[chain.correlation_id] ? 'resolved'
        : chain.status === 'active' ? 'fallback'
        : chain.status === 'completed' ? 'resolved'
        : chain.status;
      c[ds] = (c[ds] || 0) + 1;
    });
    return c;
  }, [allChains, resolvedNotes]);

  // Filtered chains
  const filtered = useMemo(() => {
    return allChains.filter(chain => {
      const ds = getDisplayStatus(chain);
      if (statusFilter !== 'all' && ds !== statusFilter) return false;
      if (typeFilter !== 'all' && chain.type !== typeFilter) return false;
      return true;
    });
  }, [allChains, statusFilter, typeFilter, resolvedNotes]);

  return (
    <div className="retry-monitor">
      {/* Stats Bar */}
      <StatsBar chains={allChains} resolvedNotes={resolvedNotes} />

      {/* Filters */}
      <div className="retry-filter-bar">
        <div className="retry-filter-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'escalated', label: 'Escalated' },
            { key: 'fallback', label: 'Fallback' },
            { key: 'resolved', label: 'Resolved' },
            { key: 'hard_decline', label: 'Hard Decline' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`retry-filter-tab ${statusFilter === tab.key ? 'retry-filter-tab-active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label} <span className="retry-filter-count">{counts[tab.key] || 0}</span>
            </button>
          ))}
        </div>
        <div className="retry-filter-right">
          <select
            className="retry-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="instant_payout">Instant Payout</option>
            <option value="loan_funding">Loan Funding</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="retry-table-wrap">
        <table className="retry-table">
          <thead>
            <tr>
              <th>Correlation ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Rail</th>
              <th className="retry-center">Attempts</th>
              <th>Created</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="retry-empty">No transactions match the current filters</td></tr>
            ) : (
              filtered.map(chain => {
                const displayStatus = getDisplayStatus(chain);
                return (
                  <tr
                    key={chain.correlation_id}
                    className={`retry-row retry-row-${chain.status}`}
                    onClick={() => setSelectedChain(chain)}
                  >
                    <td className="retry-mono retry-corr-id">{chain.correlation_id}</td>
                    <td><TypeBadge type={chain.type} /></td>
                    <td className="retry-amt">{fmtAmt(chain.amount)}</td>
                    <td>{chain.recipient_name}</td>
                    <td><StatusBadge status={displayStatus} /></td>
                    <td>
                      {chain.current_rail
                        ? <RailBadge rail={chain.current_rail} />
                        : chain.settled_rail
                          ? <RailBadge rail={chain.settled_rail} />
                          : '--'
                      }
                    </td>
                    <td className="retry-center">{chain.attempts.length}</td>
                    <td>{fmtDateTime(chain.created_at)}</td>
                    <td>{chain.total_duration_ms != null ? fmtDuration(chain.total_duration_ms) : chain.status === 'active' ? <span className="retry-pulse">in progress</span> : '--'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedChain && (
        <DetailPanel
          chain={selectedChain}
          onClose={() => setSelectedChain(null)}
          onResolve={handleResolve}
          resolvedNotes={resolvedNotes}
        />
      )}
    </div>
  );
}
