import { useDashboard } from '../context/DashboardContext';

const TABS = [
  { key: 'ach', label: 'ACH' },
  { key: 'alacriti', label: 'Alacriti' },
  { key: 'transactions', label: 'All Transactions' },
];

export default function Header({ onRefreshAlacriti, onRefreshTransactions, alacrtiLoading, transactionsLoading }) {
  const { apiMode, setApiMode, lastRefreshed, loadDashboard, isLoading, activePage, setActivePage } = useDashboard();

  const formattedTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--';

  const handleRefresh =
    activePage === 'alacriti' && onRefreshAlacriti ? onRefreshAlacriti :
    activePage === 'transactions' && onRefreshTransactions ? onRefreshTransactions :
    loadDashboard;

  const refreshLoading =
    activePage === 'alacriti' ? alacrtiLoading :
    activePage === 'transactions' ? transactionsLoading :
    isLoading;

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">FinOps Dashboard</h1>
        <nav className="header-nav">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`nav-tab ${activePage === tab.key ? 'nav-tab-active' : ''}`}
              onClick={() => setActivePage(tab.key)}
            >{tab.label}</button>
          ))}
        </nav>
      </div>
      <div className="header-right">
        <div className="api-toggle">
          <span className={`toggle-label ${apiMode === 'mock' ? 'active' : ''}`}>Mock</span>
          <button
            className="toggle-switch"
            onClick={() => setApiMode(apiMode === 'mock' ? 'real' : 'mock')}
            aria-label="Toggle API mode"
          >
            <span className={`toggle-thumb ${apiMode === 'real' ? 'toggle-on' : ''}`} />
          </button>
          <span className={`toggle-label ${apiMode === 'real' ? 'active' : ''}`}>Real</span>
        </div>
        <span className="last-updated">Updated {formattedTime}</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleRefresh}
          disabled={refreshLoading}
        >
          {refreshLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}
