import { useDashboard } from '../context/DashboardContext';
import { ACH_EVENT_TYPES } from '../data/mockData';

function DrillLink({ children, onClick }) {
  return (
    <button className="drill-link" onClick={onClick} title="View in All Transactions">
      {children}
      <span className="drill-arrow">&rarr;</span>
    </button>
  );
}

function formatNumber(n) {
  if (n == null) return '0';
  return new Intl.NumberFormat('en-US').format(n);
}

function getHealthLevel(failed, total) {
  if (total === 0) return 'healthy';
  const pct = (failed / total) * 100;
  if (pct < 1) return 'healthy';
  if (pct < 5) return 'warning';
  return 'critical';
}

function getHealthLabel(level) {
  if (level === 'healthy') return 'Healthy';
  if (level === 'warning') return 'Degraded';
  return 'Critical';
}

function formatEventTypeName(type) {
  const names = {
    achIn: 'ACH Inbound',
    achOut: 'ACH Outbound',
    achRet: 'ACH Returns',
    achInCorpOrig: 'Corp Origination',
    achOutNetTrnsAutoSettle: 'Auto Settlement',
  };
  return names[type] || type;
}

export default function HealthOverview() {
  const { eventSummary, period, setPeriod, navigateToTransactions } = useDashboard();

  if (!eventSummary) return null;

  const { total, failed, consumed, inProcess, retry, deadLettered, other } = eventSummary;
  const healthLevel = getHealthLevel(failed, total);
  const failurePct = total > 0 ? ((failed / total) * 100).toFixed(3) : '0.000';

  const segments = [
    { key: 'consumed', label: 'Consumed', value: consumed, className: 'bar-consumed' },
    { key: 'inProcess', label: 'In Process', value: inProcess, className: 'bar-inprocess' },
    { key: 'retry', label: 'Retry', value: retry, className: 'bar-retry' },
    { key: 'deadLettered', label: 'Dead Lettered', value: deadLettered, className: 'bar-dead' },
    { key: 'other', label: 'Other', value: other, className: 'bar-other' },
  ].filter(s => s.value > 0);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">ACH Event Health</h2>
        <div className="period-selector">
          <button
            className={`btn btn-sm ${period === '24h' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPeriod('24h')}
          >
            Last 24h
          </button>
          <button
            className={`btn btn-sm ${period === '5d' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPeriod('5d')}
          >
            Last 5 days
          </button>
        </div>
      </div>

      <div className="health-hero">
        <div className="hero-ratio">
          {failed > 0 ? (
            <DrillLink onClick={() => navigateToTransactions({ status: 'FAILED' })}>
              <span className="ratio-failed">{formatNumber(failed)}</span>
            </DrillLink>
          ) : (
            <span className="ratio-failed">{formatNumber(failed)}</span>
          )}
          <span className="ratio-sep">:</span>
          <span className="ratio-total">{formatNumber(total)}</span>
        </div>
        <div className={`health-indicator health-${healthLevel}`}>
          <span className="health-dot" />
          <span className="health-label">{getHealthLabel(healthLevel)}</span>
          <span className="health-pct">{failurePct}% failure rate</span>
        </div>
      </div>

      <div className="status-bar">
        {segments.map(seg => {
          const pct = (seg.value / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={seg.key}
              className={`status-bar-segment ${seg.className}`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${formatNumber(seg.value)}`}
            >
              {pct > 8 ? formatNumber(seg.value) : ''}
            </div>
          );
        })}
      </div>
      <div className="status-bar-legend">
        {segments.map(seg => (
          <div key={seg.key} className="legend-item">
            <span className={`legend-dot ${seg.className}`} />
            <span className="legend-label">{seg.label}</span>
            <span className="legend-value">{formatNumber(seg.value)}</span>
          </div>
        ))}
      </div>

      <div className="type-breakdown">
        {ACH_EVENT_TYPES.map(type => {
          const data = eventSummary.byType?.[type];
          if (!data) return null;
          const level = getHealthLevel(data.failed, data.total);
          return (
            <div key={type} className="type-card">
              <div className="type-card-header">
                <span className={`health-dot-sm health-${level}`} />
                <span className="type-card-name">{formatEventTypeName(type)}</span>
              </div>
              <div className="type-card-total">{formatNumber(data.total)}</div>
              <div className="type-card-detail">
                {data.failed > 0 && (
                  <span className="type-failed">{data.failed} failed</span>
                )}
                {data.failed === 0 && (
                  <span className="type-ok">No failures</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel-footer">
        <button className="drill-link drill-link-footer" onClick={() => navigateToTransactions({})}>
          View All Transactions <span className="drill-arrow">&rarr;</span>
        </button>
      </div>
    </section>
  );
}
