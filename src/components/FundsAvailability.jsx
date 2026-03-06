import { useAlacriti } from '../context/AlacrtiContext';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatCurrencyFull(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatTime(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getUsageLevel(current, limit) {
  const pct = (current / limit) * 100;
  if (pct > 50) return 'healthy';
  if (pct > 20) return 'warning';
  return 'critical';
}

function RailCard({ data, isExpanded, onToggle }) {
  const remainingPct = (data.currentBalance / data.creditLimit * 100).toFixed(1);
  const level = getUsageLevel(data.currentBalance, data.creditLimit);
  const badgeClass = level === 'healthy' ? 'badge-success' : level === 'warning' ? 'badge-warning' : 'badge-error';

  return (
    <div className="panel funds-card">
      <div className="panel-header">
        <h2 className="panel-title">{data.rail} Funds</h2>
        <span className={`status-badge ${badgeClass}`}>
          {remainingPct}% available
        </span>
      </div>

      <div className="funds-balance-hero">
        <div className="funds-current">{formatCurrency(data.currentBalance)}</div>
        <div className="funds-meta">
          <span className="funds-meta-label">of {formatCurrency(data.creditLimit)} limit</span>
        </div>
      </div>

      <div className="funds-usage-bar">
        <div className={`funds-usage-fill funds-usage-${level}`} style={{ width: `${remainingPct}%` }} />
      </div>

      <div className="funds-details">
        <div className="funds-detail-item">
          <span className="meta-label">Opening Balance</span>
          <span className="meta-value">{formatCurrency(data.openingBalance)}</span>
        </div>
        <div className="funds-detail-item">
          <span className="meta-label">Last Adjustment</span>
          <span className="meta-value">{formatTime(data.lastAdjustmentAt)}</span>
        </div>
      </div>

      <button className="btn btn-sm btn-secondary funds-ledger-toggle" onClick={onToggle}>
        <span className={`chevron ${isExpanded ? 'chevron-open' : ''}`}>&#9654;</span>
        {isExpanded ? 'Hide' : 'Show'} Ledger ({data.ledger.length} entries)
      </button>

      {isExpanded && (
        <div className="table-wrapper">
          <table className="funds-ledger-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.map(entry => (
                <tr key={entry.id} className={entry.type === 'adjustment' ? 'row-adjustment' : ''}>
                  <td className="cell-mono">{formatTime(entry.timestamp)}</td>
                  <td>{entry.description}</td>
                  <td className={`cell-mono ${entry.amount >= 0 ? 'amount-credit' : 'amount-debit'}`}>
                    {entry.amount >= 0 ? '+' : ''}{formatCurrencyFull(entry.amount)}
                  </td>
                  <td className="cell-mono">{formatCurrency(entry.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FundsAvailability() {
  const { fundsAvailability, expandedRail, toggleExpandedRail } = useAlacriti();
  if (!fundsAvailability) return null;

  return (
    <div className="funds-grid">
      <RailCard
        data={fundsAvailability.rtp}
        isExpanded={expandedRail === 'rtp'}
        onToggle={() => toggleExpandedRail('rtp')}
      />
      <RailCard
        data={fundsAvailability.fedNow}
        isExpanded={expandedRail === 'fedNow'}
        onToggle={() => toggleExpandedRail('fedNow')}
      />
    </div>
  );
}
