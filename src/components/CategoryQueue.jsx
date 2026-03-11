import { useExceptions } from '../context/ExceptionsContext';
import { EXCEPTION_CATEGORY_LABELS } from '../data/exceptionsMockData';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatAmount(val) {
  if (val == null || val === 0) return '—';
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PriorityDot({ priority }) {
  return <span className={`priority-dot priority-${priority}`} />;
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  return <span className={`exc-status-badge exc-status-${s}`}>{status}</span>;
}

function TypeBadge({ value, variant }) {
  const cls = variant || 'default';
  return <span className={`exc-cat-type-badge exc-cat-badge-${cls}`}>{value}</span>;
}

function ConfidenceBar({ value }) {
  if (value == null) return <span className="exc-cat-note">N/A</span>;
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="exc-confidence-bar" title={`${value}% confidence`}>
      <div className="exc-confidence-fill" style={{ width: `${value}%`, backgroundColor: color }} />
      <span className="exc-confidence-label">{value}%</span>
    </div>
  );
}

// --- Column configurations per category ---

const COLUMN_CONFIGS = {
  vanExceptions: {
    columns: [
      { key: 'id', label: 'ID', width: '120px' },
      { key: 'type', label: 'Type', render: (v) => <TypeBadge value={v.replace('_', ' ')} variant={v === 'UNMAPPED_VAN' ? 'critical' : 'medium'} /> },
      { key: 'van', label: 'VAN', className: 'mono' },
      { key: 'amount', label: 'Amount', render: (v) => <span className="exc-amount">{formatAmount(v)}</span> },
      { key: 'sourceFile', label: 'Source File', className: 'mono small' },
      { key: 'receivedAt', label: 'Received', render: (v) => formatDate(v) },
      { key: 'priority', label: 'Priority', render: (v) => <PriorityDot priority={v} /> },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
  },
  reconExceptions: {
    columns: [
      { key: 'id', label: 'ID', width: '120px' },
      { key: 'type', label: 'Type', render: (v) => {
        const variants = { UNMATCHED: 'critical', SETTLE_MISMATCH: 'high', TIME_DRIFT: 'medium', AMOUNT_VARIANCE: 'low' };
        return <TypeBadge value={v.replace(/_/g, ' ')} variant={variants[v] || 'default'} />;
      }},
      { key: 'txnId', label: 'Txn ID', className: 'mono' },
      { key: 'amount', label: 'Amount', render: (v) => <span className="exc-amount">{formatAmount(v)}</span> },
      { key: 'sourceFile', label: 'Source', className: 'mono small' },
      { key: 'date', label: 'Date', render: (v) => formatDate(v) },
      { key: 'confidence', label: 'Confidence', render: (v) => <ConfidenceBar value={v} /> },
      { key: 'priority', label: 'Priority', render: (v) => <PriorityDot priority={v} /> },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
  },
  achProcessingErrors: {
    columns: [
      { key: 'id', label: 'ID', width: '120px' },
      { key: 'errCode', label: 'Error Code', render: (v) => <TypeBadge value={v} variant="critical" /> },
      { key: 'eventId', label: 'Event ID', className: 'mono small' },
      { key: 'sourceFile', label: 'Source File', className: 'mono small' },
      { key: 'errorDesc', label: 'Description', className: 'exc-cat-note-cell' },
      { key: 'priority', label: 'Priority', render: (v) => <PriorityDot priority={v} /> },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
  },
  achReturns: {
    columns: [
      { key: 'id', label: 'ID', width: '120px' },
      { key: 'returnCode', label: 'Return Code', render: (v) => <TypeBadge value={v} variant="high" /> },
      { key: 'originalTrace', label: 'Original Trace', className: 'mono' },
      { key: 'amount', label: 'Amount', render: (v) => <span className="exc-amount">{formatAmount(v)}</span> },
      { key: 'originatorName', label: 'Originator' },
      { key: 'returnedAt', label: 'Returned At', render: (v) => formatDate(v) },
      { key: 'priority', label: 'Priority', render: (v) => <PriorityDot priority={v} /> },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
  },
  rtpFedNowExceptions: {
    columns: [
      { key: 'id', label: 'ID', width: '120px' },
      { key: 'network', label: 'Network', render: (v) => <TypeBadge value={v} variant={v === 'RTP' ? 'high' : 'medium'} /> },
      { key: 'type', label: 'Type', render: (v) => <TypeBadge value={v.replace(/_/g, ' ')} variant="default" /> },
      { key: 'txnId', label: 'Txn ID', className: 'mono' },
      { key: 'amount', label: 'Amount', render: (v) => <span className="exc-amount">{formatAmount(v)}</span> },
      { key: 'note', label: 'Note', className: 'exc-cat-note-cell' },
      { key: 'createdAt', label: 'Created', render: (v) => formatDate(v) },
      { key: 'priority', label: 'Priority', render: (v) => <PriorityDot priority={v} /> },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
  },
  payoutExceptions: {
    columns: [
      { key: 'id', label: 'ID', width: '120px' },
      { key: 'type', label: 'Type', render: (v) => <TypeBadge value={v.replace(/_/g, ' ')} variant="high" /> },
      { key: 'shopId', label: 'Shop ID', className: 'mono' },
      { key: 'merchantName', label: 'Merchant' },
      { key: 'amount', label: 'Amount', render: (v) => <span className="exc-amount">{formatAmount(v)}</span> },
      { key: 'error', label: 'Error', className: 'exc-cat-note-cell' },
      { key: 'createdAt', label: 'Created', render: (v) => formatDate(v) },
      { key: 'priority', label: 'Priority', render: (v) => <PriorityDot priority={v} /> },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
  },
  infraAlerts: {
    columns: [
      { key: 'id', label: 'ID', width: '120px' },
      { key: 'type', label: 'Type', render: (v) => <TypeBadge value={v.replace(/_/g, ' ')} variant="critical" /> },
      { key: 'system', label: 'System' },
      { key: 'errorDesc', label: 'Description', className: 'exc-cat-note-cell' },
      { key: 'detectedAt', label: 'Detected', render: (v) => formatDate(v) },
      { key: 'priority', label: 'Priority', render: (v) => <PriorityDot priority={v} /> },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
  },
};

export default function CategoryQueue() {
  const { activeCategory, categoryQueue, categoryQueueLoading } = useExceptions();
  const config = COLUMN_CONFIGS[activeCategory];
  const label = EXCEPTION_CATEGORY_LABELS[activeCategory] || activeCategory;

  if (!config) return null;

  if (categoryQueueLoading) {
    return (
      <div className="panel">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading {label}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          {label}
          <span className="exc-queue-count">{categoryQueue.length} items</span>
        </h2>
      </div>
      <div className="table-scroll-wrapper">
        <table className="exc-queue-table exc-cat-table">
          <thead>
            <tr>
              {config.columns.map(col => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categoryQueue.length === 0 && (
              <tr>
                <td colSpan={config.columns.length} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No items in this queue.
                </td>
              </tr>
            )}
            {categoryQueue.map(item => (
              <tr key={item.id}>
                {config.columns.map(col => (
                  <td key={col.key} className={col.className || ''}>
                    {col.render ? col.render(item[col.key], item) : (item[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
