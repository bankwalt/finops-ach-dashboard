import { useDashboard } from '../context/DashboardContext';
import { useTransactions } from '../context/TransactionsContext';

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function truncateId(id) {
  if (!id || id.length <= 16) return id || '--';
  return id.slice(0, 8) + '...' + id.slice(-6);
}

const STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'FAILED', 'RETURNED'];
const NETWORK_OPTIONS = ['CORE', 'RTP', 'FEDNOW'];
const DIRECTION_OPTIONS = ['CREDIT', 'DEBIT'];

const STATUS_BADGE = {
  PENDING: 'badge-warning',
  COMPLETED: 'badge-success',
  FAILED: 'badge-error',
  RETURNED: 'badge-info',
};

const NETWORK_BADGE = {
  CORE: 'net-core',
  RTP: 'net-rtp',
  FEDNOW: 'net-fednow',
};

function FilterBar({ filters, onFilterChange, counts }) {
  return (
    <div className="txn-filter-bar">
      <div className="txn-filter-group">
        <span className="txn-filter-label">Status</span>
        <div className="txn-filter-pills">
          <button
            className={`txn-pill ${!filters.status ? 'txn-pill-active' : ''}`}
            onClick={() => onFilterChange({ status: null })}
          >All ({counts.total})</button>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              className={`txn-pill txn-pill-${s.toLowerCase()} ${filters.status === s ? 'txn-pill-active' : ''}`}
              onClick={() => onFilterChange({ status: filters.status === s ? null : s })}
            >{s} ({counts.byStatus[s] || 0})</button>
          ))}
        </div>
      </div>

      <div className="txn-filter-group">
        <span className="txn-filter-label">Network</span>
        <div className="txn-filter-pills">
          <button
            className={`txn-pill ${!filters.network ? 'txn-pill-active' : ''}`}
            onClick={() => onFilterChange({ network: null })}
          >All</button>
          {NETWORK_OPTIONS.map(n => (
            <button
              key={n}
              className={`txn-pill ${filters.network === n ? 'txn-pill-active' : ''}`}
              onClick={() => onFilterChange({ network: filters.network === n ? null : n })}
            >{n} ({counts.byNetwork[n] || 0})</button>
          ))}
        </div>
      </div>

      <div className="txn-filter-group">
        <span className="txn-filter-label">Direction</span>
        <div className="txn-filter-pills">
          <button
            className={`txn-pill ${!filters.direction ? 'txn-pill-active' : ''}`}
            onClick={() => onFilterChange({ direction: null })}
          >All</button>
          {DIRECTION_OPTIONS.map(d => (
            <button
              key={d}
              className={`txn-pill ${filters.direction === d ? 'txn-pill-active' : ''}`}
              onClick={() => onFilterChange({ direction: filters.direction === d ? null : d })}
            >{d}</button>
          ))}
        </div>
      </div>

      {(filters.status || filters.network || filters.direction) && (
        <button
          className="txn-clear-filters"
          onClick={() => onFilterChange({ status: null, network: null, direction: null })}
        >Clear filters</button>
      )}
    </div>
  );
}

function SortHeader({ label, field, currentField, currentDir, onSort }) {
  const isActive = currentField === field;
  return (
    <th className="txn-sortable" onClick={() => onSort(field)}>
      {label}
      <span className={`sort-icon ${isActive ? 'sort-active' : ''}`}>
        {isActive ? (currentDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BC'}
      </span>
    </th>
  );
}

export default function AllTransactions() {
  const { transactionFilters, setTransactionFilters } = useDashboard();
  const { transactions, sortField, sortDir, setSort } = useTransactions();

  if (!transactions || transactions.length === 0) return null;

  // Compute counts from full dataset (before filtering)
  const counts = {
    total: transactions.length,
    byStatus: {},
    byNetwork: {},
  };
  transactions.forEach(t => {
    counts.byStatus[t.status] = (counts.byStatus[t.status] || 0) + 1;
    counts.byNetwork[t.network] = (counts.byNetwork[t.network] || 0) + 1;
  });

  // Apply filters
  let filtered = transactions;
  if (transactionFilters.status) {
    filtered = filtered.filter(t => t.status === transactionFilters.status);
  }
  if (transactionFilters.network) {
    filtered = filtered.filter(t => t.network === transactionFilters.network);
  }
  if (transactionFilters.direction) {
    filtered = filtered.filter(t => t.direction === transactionFilters.direction);
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'amount') {
      aVal = Math.abs(aVal);
      bVal = Math.abs(bVal);
    }
    if (sortField === 'createdAt' || sortField === 'holdEndedAt') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleFilterChange = (patch) => {
    setTransactionFilters(patch);
  };

  return (
    <section className="panel all-txn-panel">
      <div className="panel-header">
        <h2 className="panel-title">All Transactions</h2>
        <span className="count-badge">
          Showing {sorted.length} of {transactions.length}
        </span>
      </div>

      <FilterBar
        filters={transactionFilters}
        onFilterChange={handleFilterChange}
        counts={counts}
      />

      <div className="table-wrapper">
        <table className="all-txn-table">
          <thead>
            <tr>
              <SortHeader label="Created At" field="createdAt" currentField={sortField} currentDir={sortDir} onSort={setSort} />
              <th>Status</th>
              <th>Network</th>
              <th>Direction</th>
              <SortHeader label="Amount" field="amount" currentField={sortField} currentDir={sortDir} onSort={setSort} />
              <th>Note</th>
              <th>Payment Order ID</th>
              <th>Return Txn ID</th>
              <th>Account ID</th>
              <th>Hold Ended At</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={10} className="empty-state">No transactions match the current filters.</td></tr>
            ) : (
              sorted.map(txn => (
                <tr key={txn.id} className={txn.status === 'FAILED' ? 'row-failed' : ''}>
                  <td className="cell-mono">{formatDateTime(txn.createdAt)}</td>
                  <td>
                    <span className={`status-badge ${STATUS_BADGE[txn.status] || 'badge-neutral'}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td>
                    <span className={`network-badge ${NETWORK_BADGE[txn.network] || ''}`}>
                      {txn.network}
                    </span>
                  </td>
                  <td>{txn.direction}</td>
                  <td className={`cell-mono ${txn.amount < 0 ? 'amount-debit' : 'amount-credit'}`}>
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="cell-note" title={txn.note}>{txn.note}</td>
                  <td className="cell-mono" title={txn.paymentOrderId}>{truncateId(txn.paymentOrderId)}</td>
                  <td className="cell-mono">{txn.returnTransactionId ? truncateId(txn.returnTransactionId) : '--'}</td>
                  <td className="cell-mono" title={txn.accountId}>{truncateId(txn.accountId)}</td>
                  <td className="cell-mono">{txn.holdEndedAt ? formatDateTime(txn.holdEndedAt) : '--'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
