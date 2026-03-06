import { useAlacriti } from '../context/AlacrtiContext';
import { useDashboard } from '../context/DashboardContext';

function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n);
}

function RailTransactionPanel({ rail, networkKey, data, onDrillFailed, onDrillAll }) {
  const totals = data.reduce((acc, d) => ({
    total: acc.total + d.total,
    success: acc.success + d.success,
    failed: acc.failed + d.failed,
  }), { total: 0, success: 0, failed: 0 });

  const successRate = totals.total > 0 ? ((totals.success / totals.total) * 100).toFixed(2) : '0.00';

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">{rail} Transactions</h2>
        <span className="count-badge">7-day: {formatNumber(totals.total)}</span>
      </div>

      <div className="txn-summary">
        <div className="txn-summary-item">
          <span className="txn-summary-value">{formatNumber(totals.success)}</span>
          <span className="txn-summary-label">Successful</span>
        </div>
        <div className="txn-summary-item">
          {totals.failed > 0 ? (
            <button className="drill-link" onClick={onDrillFailed} title="View failed in All Transactions">
              <span className="txn-summary-value txn-failed-value">{formatNumber(totals.failed)}</span>
              <span className="drill-arrow">&rarr;</span>
            </button>
          ) : (
            <span className="txn-summary-value txn-failed-value">{formatNumber(totals.failed)}</span>
          )}
          <span className="txn-summary-label">Failed</span>
        </div>
        <div className="txn-summary-item">
          <span className="txn-summary-value">{successRate}%</span>
          <span className="txn-summary-label">Success Rate</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="txn-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Total</th>
              <th>Success</th>
              <th>Failed</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.map(day => {
              const rate = day.total > 0 ? ((day.success / day.total) * 100).toFixed(1) : '0.0';
              return (
                <tr key={day.date}>
                  <td className="cell-name">{day.label}</td>
                  <td className="cell-mono">{formatNumber(day.total)}</td>
                  <td className="cell-mono">{formatNumber(day.success)}</td>
                  <td className={`cell-mono ${day.failed > 0 ? 'amount-debit' : ''}`}>{day.failed}</td>
                  <td>
                    <span className={`status-badge ${parseFloat(rate) >= 99 ? 'badge-success' : 'badge-warning'}`}>
                      {rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="panel-footer">
        <button className="drill-link drill-link-footer" onClick={onDrillAll}>
          View {rail} Transactions <span className="drill-arrow">&rarr;</span>
        </button>
      </div>
    </div>
  );
}

export default function TransactionVolume() {
  const { transactions } = useAlacriti();
  const { navigateToTransactions } = useDashboard();
  if (!transactions) return null;

  return (
    <div className="txn-grid">
      <RailTransactionPanel
        rail="RTP"
        networkKey="RTP"
        data={transactions.rtp}
        onDrillFailed={() => navigateToTransactions({ network: 'RTP', status: 'FAILED' })}
        onDrillAll={() => navigateToTransactions({ network: 'RTP' })}
      />
      <RailTransactionPanel
        rail="FedNow"
        networkKey="FEDNOW"
        data={transactions.fedNow}
        onDrillFailed={() => navigateToTransactions({ network: 'FEDNOW', status: 'FAILED' })}
        onDrillAll={() => navigateToTransactions({ network: 'FEDNOW' })}
      />
    </div>
  );
}
