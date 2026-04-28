import { useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { getRetryData } from '../data/retryMockData';

/* ── helpers ── */
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
    escalated: { cls: 'retry-status-escalated', label: 'Escalated' },
    resolved: { cls: 'retry-status-completed', label: 'Resolved' },
    hard_decline: { cls: 'retry-status-declined', label: 'Hard Decline' },
    manual: { cls: 'retry-status-manual', label: 'Manual' },
    fallback: { cls: 'retry-status-fallback', label: 'Fallback' },
    failed: { cls: 'retry-status-failed', label: 'Failed' },
    success: { cls: 'retry-status-success', label: 'Success' },
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

/* ── Stats Bar ── */
function StatsBar({ stats }) {
  return (
    <div className="retry-stats-bar">
      <div className="retry-stat-card retry-stat-escalated">
        <div className="retry-stat-value">{stats.escalated_count}</div>
        <div className="retry-stat-label">Escalated</div>
        <div className="retry-stat-sub">{fmtAmt(stats.escalated_total_amount)}</div>
      </div>
      <div className="retry-stat-card retry-stat-manual">
        <div className="retry-stat-value">{stats.manual_count}</div>
        <div className="retry-stat-label">Manual</div>
        <div className="retry-stat-sub">{fmtAmt(stats.manual_total_amount)}</div>
      </div>
      <div className="retry-stat-card retry-stat-fallback">
        <div className="retry-stat-value">{stats.fallback_count}</div>
        <div className="retry-stat-label">Fallback</div>
        <div className="retry-stat-sub">{fmtAmt(stats.fallback_total_amount)}</div>
      </div>
      <div className="retry-stat-card">
        <div className="retry-stat-value">{stats.success_rate}%</div>
        <div className="retry-stat-label">Success Rate</div>
        <div className="retry-stat-sub">{stats.resolved_count} resolved</div>
      </div>
      <div className="retry-stat-card">
        <div className="retry-stat-value">{stats.avg_attempts}</div>
        <div className="retry-stat-label">Avg Attempts</div>
        <div className="retry-stat-sub">{fmtDuration(stats.avg_resolution_ms)} avg resolution</div>
      </div>
      <div className="retry-stat-card">
        <div className="retry-stat-value">{stats.hard_decline_count}</div>
        <div className="retry-stat-label">Hard Declines</div>
        <div className="retry-stat-sub">No retry</div>
      </div>
    </div>
  );
}

/* ── Type Breakdown ── */
function TypeBreakdown({ stats }) {
  const { instant_payout: ip, loan_funding: lf } = stats.by_type;
  return (
    <div className="retry-type-breakdown">
      <div className="retry-breakdown-card">
        <div className="retry-breakdown-header">
          <span className="retry-type-badge retry-type-instant">Instant Payouts</span>
          <span className="retry-breakdown-total">{ip.total} transactions</span>
        </div>
        <div className="retry-breakdown-body">
          <div className="retry-breakdown-metric">
            <span className="retry-breakdown-metric-value">{fmtAmt(ip.total_amount)}</span>
            <span className="retry-breakdown-metric-label">Total volume</span>
          </div>
          <div className="retry-breakdown-statuses">
            {ip.escalated > 0 && <span className="retry-badge retry-status-escalated">{ip.escalated} escalated</span>}
            {ip.manual > 0 && <span className="retry-badge retry-status-manual">{ip.manual} manual</span>}
            {ip.fallback > 0 && <span className="retry-badge retry-status-fallback">{ip.fallback} fallback</span>}
            <span className="retry-badge retry-status-completed">{ip.resolved} resolved</span>
          </div>
        </div>
        <div className="retry-breakdown-cascade">
          <span className="retry-cascade-label">Cascade:</span>
          <span className="retry-cascade-flow">OCT (3x) → FedNow (3x) → RTP (3x) → Escalate</span>
        </div>
      </div>
      <div className="retry-breakdown-card">
        <div className="retry-breakdown-header">
          <span className="retry-type-badge retry-type-loan">Loan Funding</span>
          <span className="retry-breakdown-total">{lf.total} transactions</span>
        </div>
        <div className="retry-breakdown-body">
          <div className="retry-breakdown-metric">
            <span className="retry-breakdown-metric-value">{fmtAmt(lf.total_amount)}</span>
            <span className="retry-breakdown-metric-label">Total volume</span>
          </div>
          <div className="retry-breakdown-statuses">
            {lf.escalated > 0 && <span className="retry-badge retry-status-escalated">{lf.escalated} escalated</span>}
            {lf.manual > 0 && <span className="retry-badge retry-status-manual">{lf.manual} manual</span>}
            {lf.fallback > 0 && <span className="retry-badge retry-status-fallback">{lf.fallback} fallback</span>}
            <span className="retry-badge retry-status-completed">{lf.resolved} resolved</span>
          </div>
        </div>
        <div className="retry-breakdown-cascade">
          <span className="retry-cascade-label">Cascade:</span>
          <span className="retry-cascade-flow">FedNow/RTP (5x, 1hr) → Same-Day ACH → Escalate</span>
        </div>
      </div>
    </div>
  );
}

/* ── Rail Usage Bar ── */
function RailUsage({ stats }) {
  const usage = stats.rail_usage;
  const total = Object.values(usage).reduce((a, b) => a + b, 0);
  const ordered = ['OCT', 'FedNow', 'RTP', 'Same-Day ACH'].filter(r => usage[r]);
  const colors = { OCT: '#8b5cf6', FedNow: '#6366f1', RTP: '#3b82f6', 'Same-Day ACH': '#f59e0b' };

  return (
    <div className="retry-rail-usage">
      <div className="retry-rail-usage-title">Rail Utilization</div>
      <div className="retry-rail-bar">
        {ordered.map(rail => (
          <div
            key={rail}
            className="retry-rail-segment"
            style={{ width: `${(usage[rail] / total) * 100}%`, background: colors[rail] }}
            title={`${rail}: ${usage[rail]} attempts`}
          />
        ))}
      </div>
      <div className="retry-rail-legend">
        {ordered.map(rail => (
          <span key={rail} className="retry-rail-legend-item">
            <span className="retry-rail-dot" style={{ background: colors[rail] }} />
            {rail}: {usage[rail]} ({Math.round((usage[rail] / total) * 100)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Attempt Timeline (inside detail panel) ── */
function AttemptTimeline({ attempts }) {
  return (
    <div className="retry-timeline">
      {attempts.map((att, i) => (
        <div key={att.id} className={`retry-timeline-item ${att.status === 'success' ? 'retry-timeline-success' : 'retry-timeline-failed'}`}>
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

/* ── Notification Log (inside detail panel) ── */
function NotificationLog({ notifications }) {
  if (!notifications || notifications.length === 0) {
    return <div className="retry-no-notifs">No customer notifications sent</div>;
  }
  return (
    <div className="retry-notif-log">
      {notifications.map((n, i) => (
        <div key={i} className="retry-notif-item">
          <div className="retry-notif-icon">{n.channel === 'sms' ? '💬' : '✉️'}</div>
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

/* ── Detail Panel ── */
function DetailPanel({ chain, onClose }) {
  if (!chain) return null;

  return (
    <div className="retry-panel-overlay" onClick={onClose}>
      <div className="retry-panel" onClick={e => e.stopPropagation()}>
        <div className="retry-panel-header">
          <div>
            <h3 className="retry-panel-title">{chain.correlation_id}</h3>
            <div className="retry-panel-subtitle">
              <TypeBadge type={chain.type} />
              <StatusBadge status={chain.status} />
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
                <span className="retry-detail-value">{chain.resolved_at ? fmtDateTime(chain.resolved_at) : 'Pending'}</span>
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

          {/* Resolution Info (manual / resolved with note) */}
          {(chain.resolution_note || chain.resolved_by) && (
            <div className="retry-panel-section">
              <h4 className="retry-panel-section-title">Manual Resolution</h4>
              <div className="retry-detail-grid">
                {chain.resolved_by && (
                  <div className="retry-detail-item">
                    <span className="retry-detail-label">Resolved By</span>
                    <span className="retry-detail-value">{chain.resolved_by}</span>
                  </div>
                )}
                {chain.resolution_note && (
                  <div className="retry-detail-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="retry-detail-label">Resolution Note</span>
                    <span className="retry-detail-value">{chain.resolution_note}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}

/* ── Chain Row ── */
function ChainRow({ chain, onClick }) {
  return (
    <tr className={`retry-row retry-row-${chain.status}`} onClick={() => onClick(chain)}>
      <td className="retry-mono retry-corr-id">{chain.correlation_id}</td>
      <td><TypeBadge type={chain.type} /></td>
      <td className="retry-amt">{fmtAmt(chain.amount)}</td>
      <td>{chain.recipient_name}</td>
      <td><StatusBadge status={chain.status} /></td>
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
      <td>{chain.total_duration_ms != null ? fmtDuration(chain.total_duration_ms) : (chain.status === 'manual' || chain.status === 'escalated') ? <span className="retry-pulse">in progress</span> : '--'}</td>
    </tr>
  );
}

/* ── Main Component ── */
export default function RetryMonitor({ refreshRef }) {
  const [chains, setChains] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState(null);
  const [view, setView] = useState('all'); // 'all' | 'escalated' | 'manual' | 'fallback' | 'resolved' | 'hard_decline'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'instant_payout' | 'loan_funding'
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    // Simulate async
    setTimeout(() => {
      const { chains: c, stats: s } = getRetryData();
      setChains(c);
      setStats(s);
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (refreshRef) refreshRef.current = loadData;
  }, [refreshRef, loadData]);

  const filtered = chains.filter(c => {
    if (view !== 'all' && c.status !== view) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return c.correlation_id.toLowerCase().includes(s)
        || c.recipient_name.toLowerCase().includes(s)
        || c.recipient_account_last4.includes(s);
    }
    return true;
  });

  if (loading || !stats) {
    return (
      <div className="retry-monitor">
        <div className="retry-loading">
          <div className="loading-spinner" />
          <p>Loading retry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="retry-monitor">
      <div className="retry-header-bar">
        <h2 className="retry-title">Retry Monitor</h2>
        <div className="retry-header-right">
          <span className="retry-live-dot" />
          <span className="retry-live-label">Live</span>
        </div>
      </div>

      <StatsBar stats={stats} />
      <TypeBreakdown stats={stats} />
      <RailUsage stats={stats} />

      {/* Filters */}
      <div className="retry-filter-bar">
        <div className="retry-filter-tabs">
          {[
            { key: 'all', label: 'All', count: chains.length },
            { key: 'escalated', label: 'Escalated', count: stats.escalated_count },
            { key: 'manual', label: 'Manual', count: stats.manual_count },
            { key: 'fallback', label: 'Fallback', count: stats.fallback_count },
            { key: 'resolved', label: 'Resolved', count: stats.resolved_count },
            { key: 'hard_decline', label: 'Hard Decline', count: stats.hard_decline_count },
          ].map(tab => (
            <button
              key={tab.key}
              className={`retry-filter-tab ${view === tab.key ? 'retry-filter-tab-active' : ''}`}
              onClick={() => setView(tab.key)}
            >
              {tab.label} <span className="retry-filter-count">{tab.count}</span>
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
            <option value="instant_payout">Instant Payouts</option>
            <option value="loan_funding">Loan Funding</option>
          </select>
          <input
            className="retry-search"
            type="text"
            placeholder="Search ID, name, account..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
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
              filtered.map(c => (
                <ChainRow key={c.correlation_id} chain={c} onClick={setSelectedChain} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedChain && (
        <DetailPanel chain={selectedChain} onClose={() => setSelectedChain(null)} />
      )}
    </div>
  );
}
