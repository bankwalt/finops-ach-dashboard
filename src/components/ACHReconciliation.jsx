import { useState, useEffect, useCallback, useRef } from 'react';
import { getReconData, getTransactionData, getPendingData } from '../data/reconMockData';

// ── Formatters ───────────────────────────────────────────────────────────────
const fmtD = d => {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const fmtAmt = v => {
  if (v === null || v === undefined) return <span className="recon-zero-amt">—</span>;
  const n = parseFloat(v);
  const s = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (Math.abs(n) < 0.01) return <span className="recon-zero-amt">${s}</span>;
  return `$${s}`;
};

const fmtVar = v => {
  if (v === null || v === undefined) return <span className="recon-var-none">—</span>;
  const n = parseFloat(v);
  if (Math.abs(n) <= 0.02) return <span className="recon-var-ok">$0.00 ✓</span>;
  const s = (n >= 0 ? '+' : '') + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <span className="recon-var-bad">${s}</span>;
};

const BADGE_MAP = {
  'Matched': 'rb-matched',
  'FIRD Variance': 'rb-firdvar',
  'Core Variance': 'rb-corevar',
  'Both Variance': 'rb-bothvar',
  'Pending': 'rb-pending',
  'Unmatched': 'rb-unmatched',
};

const Badge = ({ status }) => (
  <span className={`recon-badge ${BADGE_MAP[status] || 'rb-zero'}`}>{status}</span>
);

const NAV_ITEMS = [
  { key: 'summary', icon: '⊞', label: 'Daily Summary', section: 'Reconciliation' },
  { key: 'rdfi', icon: '↙', label: 'RDFI', section: 'Transactions' },
  { key: 'odfi', icon: '↗', label: 'ODFI', section: 'Transactions' },
  { key: 'core', icon: '⬡', label: 'Core', section: 'Transactions' },
  { key: 'pending', icon: '⏳', label: 'Pending at Fed', section: 'Outstanding' },
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function ACHReconciliation({ refreshRef }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [reconRows, setReconRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Summary filters
  const [sumDateFrom, setSumDateFrom] = useState('2026-01-01');
  const [sumDateTo, setSumDateTo] = useState('');
  const [sumStatuses, setSumStatuses] = useState(new Set());

  // Transaction tab state
  const [tabRows, setTabRows] = useState({ rdfi: [], odfi: [], core: [] });
  const [tabDateFrom, setTabDateFrom] = useState({ rdfi: '', odfi: '', core: '' });
  const [tabDateTo, setTabDateTo] = useState({ rdfi: '', odfi: '', core: '' });
  const [tabAmtMin, setTabAmtMin] = useState({ rdfi: '', odfi: '', core: '' });
  const [tabAmtMax, setTabAmtMax] = useState({ rdfi: '', odfi: '', core: '' });
  const [tabLoading, setTabLoading] = useState({ rdfi: false, odfi: false, core: false });
  const [tabLoaded, setTabLoaded] = useState({ rdfi: false, odfi: false, core: false });

  // Pending
  const [pendingData, setPendingData] = useState(null);
  const [expandedPendingDates, setExpandedPendingDates] = useState(new Set());

  // Detail panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState(null);

  // FIRD range display
  const [firdRange, setFirdRange] = useState('Loading…');

  const loadAll = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const recon = getReconData();
      setReconRows(recon.rows);
      setStats(recon.stats);

      const firdDates = recon.rows.filter(r => r.fird_cr !== null).map(r => r.date);
      if (firdDates.length) {
        setFirdRange(`FIRD: ${fmtD(firdDates[0])} → ${fmtD(firdDates[firdDates.length - 1])}`);
      }

      const pending = getPendingData();
      setPendingData(pending);
    } catch (e) {
      setError(e.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (refreshRef) refreshRef.current = loadAll;
  }, [refreshRef, loadAll]);

  // ── Summary filtering ────────────────────────────────────────────────────
  const filteredSummary = (() => {
    let rows = [...reconRows].reverse(); // descending
    if (sumDateFrom) rows = rows.filter(r => r.date >= sumDateFrom);
    if (sumDateTo) rows = rows.filter(r => r.date <= sumDateTo);
    if (sumStatuses.size > 0) rows = rows.filter(r => sumStatuses.has(r.status));
    return rows;
  })();

  const toggleStatus = (s) => {
    setSumStatuses(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const clearSummaryFilters = () => {
    setSumDateFrom('');
    setSumDateTo('');
    setSumStatuses(new Set());
  };

  // ── Transaction tab loading ──────────────────────────────────────────────
  const loadTabData = useCallback((type) => {
    const from = tabDateFrom[type];
    const to = tabDateTo[type];
    if (!from && !to) return;
    setTabLoading(p => ({ ...p, [type]: true }));
    try {
      const data = getTransactionData(type, from || to, to || from);
      setTabRows(p => ({ ...p, [type]: data.rows }));
      setTabLoaded(p => ({ ...p, [type]: true }));
    } catch (e) {
      setError(e.message);
    }
    setTabLoading(p => ({ ...p, [type]: false }));
  }, [tabDateFrom, tabDateTo]);

  const clearTabFilters = (type) => {
    setTabDateFrom(p => ({ ...p, [type]: '' }));
    setTabDateTo(p => ({ ...p, [type]: '' }));
    setTabAmtMin(p => ({ ...p, [type]: '' }));
    setTabAmtMax(p => ({ ...p, [type]: '' }));
    setTabRows(p => ({ ...p, [type]: [] }));
    setTabLoaded(p => ({ ...p, [type]: false }));
  };

  const getFilteredTabRows = (type) => {
    const min = parseFloat(tabAmtMin[type]);
    const max = parseFloat(tabAmtMax[type]);
    return tabRows[type].filter(r => {
      const amt = type === 'core' ? parseFloat(r.amount || 0) : parseFloat(r.credit || 0) + parseFloat(r.debit || 0);
      if (!isNaN(min) && amt < min) return false;
      if (!isNaN(max) && amt > max) return false;
      return true;
    });
  };

  // ── Drill from summary row ──────────────────────────────────────────────
  const drillDate = (d, type) => {
    setPanelOpen(false);
    setPanelContent(null);
    setActiveTab(type);
    setTabDateFrom(p => ({ ...p, [type]: d }));
    setTabDateTo(p => ({ ...p, [type]: d }));
    // Load after state update
    setTimeout(() => {
      const data = getTransactionData(type, d, d);
      setTabRows(p => ({ ...p, [type]: data.rows }));
      setTabLoaded(p => ({ ...p, [type]: true }));
    }, 0);
  };

  // ── Panel helpers ──────────────────────────────────────────────────────
  const openSummaryPanel = (d) => {
    const r = reconRows.find(x => x.date === d);
    if (!r) return;
    setPanelContent({ type: 'summary', date: d, row: r });
    setPanelOpen(true);
  };

  const openFileTxnPanel = (r) => {
    setPanelContent({ type: 'file', row: r });
    setPanelOpen(true);
  };

  const openCoreTxnPanel = (r) => {
    setPanelContent({ type: 'core', row: r });
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setPanelContent(null);
  };

  // ── Pending grouping ──────────────────────────────────────────────────
  const pendingGroups = (() => {
    if (!pendingData) return {};
    const groups = {};
    const add = (arr, type) => arr.forEach(r => {
      const d = r.match_date || 'Unknown';
      if (!groups[d]) groups[d] = { rdfi: [], odfi: [], core: [] };
      groups[d][type].push(r);
    });
    add(pendingData.rdfi || [], 'rdfi');
    add(pendingData.odfi || [], 'odfi');
    add(pendingData.core || [], 'core');
    return groups;
  })();

  const pendingTotal = pendingData
    ? (pendingData.rdfi?.length || 0) + (pendingData.odfi?.length || 0) + (pendingData.core?.length || 0)
    : 0;

  const togglePendingDate = (d) => {
    setExpandedPendingDates(prev => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (isLoading && !stats) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading reconciliation data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <span className="error-banner-icon">!</span>
        <span>{error}</span>
      </div>
    );
  }

  let currentSection = '';

  return (
    <div className="recon-layout">
      {/* Left Nav */}
      <nav className="recon-nav">
        {NAV_ITEMS.map(item => {
          const showSection = item.section !== currentSection;
          if (showSection) currentSection = item.section;
          return (
            <div key={item.key}>
              {showSection && <div className="recon-nav-label">{item.section}</div>}
              <div
                className={`recon-nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="recon-nav-icon">{item.icon}</span>
                {item.label}
                {item.key === 'pending' && pendingTotal > 0 && (
                  <span className="recon-nav-badge amber">{pendingTotal}</span>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Main Area */}
      <div className="recon-main">
        {/* Stats Bar */}
        <div className="recon-stats-bar">
          <div className="recon-stat-card">
            <div className="recon-stat-lbl">FIRD↔File CR Var</div>
            <div className="recon-stat-val">{stats && fmtVar(stats.net_fvf_cr)}</div>
            <div className="recon-stat-hint">Cumulative</div>
          </div>
          <div className="recon-stat-card">
            <div className="recon-stat-lbl">FIRD↔File DR Var</div>
            <div className="recon-stat-val">{stats && fmtVar(stats.net_fvf_dr)}</div>
            <div className="recon-stat-hint">Cumulative</div>
          </div>
          <div className="recon-stat-card">
            <div className="recon-stat-lbl">File↔Core CR Var</div>
            <div className="recon-stat-val">{stats && fmtVar(stats.net_fvc_cr)}</div>
            <div className="recon-stat-hint">Cumulative</div>
          </div>
          <div className="recon-stat-card">
            <div className="recon-stat-lbl">File↔Core DR Var</div>
            <div className="recon-stat-val">{stats && fmtVar(stats.net_fvc_dr)}</div>
            <div className="recon-stat-hint">Cumulative</div>
          </div>
          <div className="recon-stat-card">
            <div className="recon-stat-lbl">Matched</div>
            <div className="recon-stat-val green">{stats?.matched}</div>
            <div className="recon-stat-hint">of {stats?.total_days} days</div>
          </div>
          <div className="recon-stat-card">
            <div className="recon-stat-lbl">FIRD Range</div>
            <div className="recon-stat-val" style={{ fontSize: 11, fontWeight: 500 }}>{firdRange}</div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="recon-panel">
            <div className="recon-panel-title">Daily Reconciliation</div>
            <div className="recon-panel-sub">FIRD ↔ Files (RDFI + ODFI) and Files ↔ Core. Click a row to drill in.</div>

            <div className="recon-filter-bar">
              <div>
                <label>From</label>
                <input type="date" value={sumDateFrom} onChange={e => setSumDateFrom(e.target.value)} />
              </div>
              <div>
                <label>To</label>
                <input type="date" value={sumDateTo} onChange={e => setSumDateTo(e.target.value)} />
              </div>
              <div>
                <label>Status</label>
                <div className="recon-spills">
                  {['Matched', 'FIRD Variance', 'Core Variance', 'Both Variance', 'Pending'].map(s => (
                    <button
                      key={s}
                      className={`recon-spill ${sumStatuses.has(s) ? 'on' : ''}`}
                      data-s={s}
                      onClick={() => toggleStatus(s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <button className="recon-f-btn sec" onClick={clearSummaryFilters}>Clear</button>
            </div>

            <div className="recon-tbl-wrap">
              <table className="recon-table">
                <thead>
                  <tr className="recon-grp">
                    <th></th>
                    <th colSpan="2">FIRD</th>
                    <th colSpan="2" className="recon-sep">Files (RDFI + ODFI)</th>
                    <th colSpan="2" className="recon-sep">Core</th>
                    <th colSpan="2" className="recon-sep">FIRD ↔ Files</th>
                    <th colSpan="2" className="recon-sep">Files ↔ Core</th>
                    <th></th>
                  </tr>
                  <tr>
                    <th>Date</th>
                    <th className="right">Credits</th>
                    <th className="right">Debits</th>
                    <th className="right recon-sep">Credits</th>
                    <th className="right">Debits</th>
                    <th className="right recon-sep">Credits</th>
                    <th className="right">Debits</th>
                    <th className="right recon-sep">CR Var</th>
                    <th className="right">DR Var</th>
                    <th className="right recon-sep">CR Var</th>
                    <th className="right">DR Var</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.length === 0 ? (
                    <tr className="recon-load-row"><td colSpan="12">No data.</td></tr>
                  ) : filteredSummary.map(r => (
                    <tr key={r.date} onClick={() => openSummaryPanel(r.date)} className="recon-clickable">
                      <td><span className="recon-dc">{fmtD(r.date)}</span></td>
                      <td className="right">{fmtAmt(r.fird_cr)}</td>
                      <td className="right">{fmtAmt(r.fird_dr)}</td>
                      <td className="right recon-sep">{fmtAmt(r.file_cr)}</td>
                      <td className="right">{fmtAmt(r.file_dr)}</td>
                      <td className="right recon-sep">{fmtAmt(r.core_cr)}</td>
                      <td className="right">{fmtAmt(r.core_dr)}</td>
                      <td className="right recon-sep">{fmtVar(r.fvf_cr)}</td>
                      <td className="right">{fmtVar(r.fvf_dr)}</td>
                      <td className="right recon-sep">{fmtVar(r.fvc_cr)}</td>
                      <td className="right">{fmtVar(r.fvc_dr)}</td>
                      <td><Badge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RDFI / ODFI tabs */}
        {(activeTab === 'rdfi' || activeTab === 'odfi') && (
          <TransactionTab
            type={activeTab}
            title={activeTab === 'rdfi' ? 'RDFI Transactions — Incoming ACH' : 'ODFI Transactions — Outgoing ACH'}
            subtitle={activeTab === 'rdfi'
              ? 'Matched on settlement_date. Credit column feeds File Credits; Debit column feeds File Debits.'
              : 'Matched on effective_entry_date. Credit column feeds File Credits; Debit column feeds File Debits.'}
            dateFrom={tabDateFrom[activeTab]}
            dateTo={tabDateTo[activeTab]}
            amtMin={tabAmtMin[activeTab]}
            amtMax={tabAmtMax[activeTab]}
            onDateFromChange={v => setTabDateFrom(p => ({ ...p, [activeTab]: v }))}
            onDateToChange={v => setTabDateTo(p => ({ ...p, [activeTab]: v }))}
            onAmtMinChange={v => setTabAmtMin(p => ({ ...p, [activeTab]: v }))}
            onAmtMaxChange={v => setTabAmtMax(p => ({ ...p, [activeTab]: v }))}
            onLoad={() => loadTabData(activeTab)}
            onClear={() => clearTabFilters(activeTab)}
            rows={getFilteredTabRows(activeTab)}
            loading={tabLoading[activeTab]}
            loaded={tabLoaded[activeTab]}
            onRowClick={openFileTxnPanel}
          />
        )}

        {/* Core tab */}
        {activeTab === 'core' && (
          <CoreTab
            dateFrom={tabDateFrom.core}
            dateTo={tabDateTo.core}
            amtMin={tabAmtMin.core}
            amtMax={tabAmtMax.core}
            onDateFromChange={v => setTabDateFrom(p => ({ ...p, core: v }))}
            onDateToChange={v => setTabDateTo(p => ({ ...p, core: v }))}
            onAmtMinChange={v => setTabAmtMin(p => ({ ...p, core: v }))}
            onAmtMaxChange={v => setTabAmtMax(p => ({ ...p, core: v }))}
            onLoad={() => loadTabData('core')}
            onClear={() => clearTabFilters('core')}
            rows={getFilteredTabRows('core')}
            loading={tabLoading.core}
            loaded={tabLoaded.core}
            onRowClick={openCoreTxnPanel}
          />
        )}

        {/* Pending tab */}
        {activeTab === 'pending' && (
          <PendingTab
            groups={pendingGroups}
            total={pendingTotal}
            expanded={expandedPendingDates}
            onToggle={togglePendingDate}
            onFileClick={openFileTxnPanel}
            onCoreClick={openCoreTxnPanel}
          />
        )}
      </div>

      {/* Detail Panel Overlay */}
      {panelOpen && <div className="recon-overlay" onClick={closePanel} />}
      <div className={`recon-detail-panel ${panelOpen ? 'open' : ''}`}>
        {panelContent && (
          <>
            <div className="recon-panel-header">
              <div>
                <div className="recon-ph-title">
                  {panelContent.type === 'summary' && fmtD(panelContent.date)}
                  {panelContent.type === 'file' && `Trace ${panelContent.row.trace_number || '—'}`}
                  {panelContent.type === 'core' && (panelContent.row.code_description || 'Core Transaction')}
                </div>
                <div className="recon-ph-sub">
                  {panelContent.type === 'summary' && panelContent.row.status}
                  {panelContent.type === 'file' && fmtD(panelContent.row.match_date)}
                  {panelContent.type === 'core' && fmtD(panelContent.row.match_date)}
                </div>
              </div>
              <button className="recon-ph-close" onClick={closePanel}>✕</button>
            </div>
            <div className="recon-panel-body">
              {panelContent.type === 'summary' && (
                <SummaryPanelContent row={panelContent.row} onDrill={drillDate} />
              )}
              {panelContent.type === 'file' && (
                <FileTxnPanelContent row={panelContent.row} />
              )}
              {panelContent.type === 'core' && (
                <CoreTxnPanelContent row={panelContent.row} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TransactionTab({ type, title, subtitle, dateFrom, dateTo, amtMin, amtMax, onDateFromChange, onDateToChange, onAmtMinChange, onAmtMaxChange, onLoad, onClear, rows, loading, loaded, onRowClick }) {
  return (
    <div className="recon-panel">
      <div className="recon-panel-title">{title}</div>
      <div className="recon-panel-sub">{subtitle}</div>
      <div className="recon-filter-bar">
        <div><label>From</label><input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)} /></div>
        <div><label>To</label><input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)} /></div>
        <div><label>Min Amount</label><input type="number" value={amtMin} placeholder="0.00" step="0.01" min="0" onChange={e => onAmtMinChange(e.target.value)} /></div>
        <div><label>Max Amount</label><input type="number" value={amtMax} placeholder="Any" step="0.01" min="0" onChange={e => onAmtMaxChange(e.target.value)} /></div>
        <button className="recon-f-btn" onClick={onLoad}>Load</button>
        <button className="recon-f-btn sec" onClick={onClear}>Clear</button>
      </div>
      <div className="recon-tbl-wrap">
        <table className="recon-table">
          <thead>
            <tr>
              <th>{type === 'rdfi' ? 'Settlement Date' : 'Match Date'}</th>
              <th className="right">Credit</th>
              <th className="right">Debit</th>
              <th>TC</th>
              <th>RDFI Routing</th>
              <th>ODFI Routing</th>
              <th>Return</th>
              <th className="mono">Trace</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="recon-load-row"><td colSpan="8">Loading…</td></tr>
            ) : !loaded ? (
              <tr className="recon-load-row"><td colSpan="8">Select a date range and click Load.</td></tr>
            ) : rows.length === 0 ? (
              <tr className="recon-load-row"><td colSpan="8">No transactions.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} onClick={() => onRowClick(r)} className="recon-clickable">
                <td><span className="recon-dc">{fmtD(r.match_date)}</span></td>
                <td className="right">{fmtAmt(r.credit)}</td>
                <td className="right">{fmtAmt(r.debit)}</td>
                <td>{r.transaction_code || '—'}</td>
                <td className="mono">{r.rdfi_routing_number || '—'}</td>
                <td className="mono">{r.odfi_routing_number || '—'}</td>
                <td>{r.is_return ? <span className="recon-badge rb-return">{r.return_code || 'RTN'}</span> : '—'}</td>
                <td className="mono" style={{ fontSize: 10 }}>{r.trace_number || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoreTab({ dateFrom, dateTo, amtMin, amtMax, onDateFromChange, onDateToChange, onAmtMinChange, onAmtMaxChange, onLoad, onClear, rows, loading, loaded, onRowClick }) {
  return (
    <div className="recon-panel">
      <div className="recon-panel-title">Core Transactions — <code>silver_prod.finxact.transaction</code></div>
      <div className="recon-panel-sub">Filtered to <code>network = 'ACH'</code>, matched on <code>settled_at</code>.</div>
      <div className="recon-filter-bar">
        <div><label>From</label><input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)} /></div>
        <div><label>To</label><input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)} /></div>
        <div><label>Min Amount</label><input type="number" value={amtMin} placeholder="0.00" step="0.01" min="0" onChange={e => onAmtMinChange(e.target.value)} /></div>
        <div><label>Max Amount</label><input type="number" value={amtMax} placeholder="Any" step="0.01" min="0" onChange={e => onAmtMaxChange(e.target.value)} /></div>
        <button className="recon-f-btn" onClick={onLoad}>Load</button>
        <button className="recon-f-btn sec" onClick={onClear}>Clear</button>
      </div>
      <div className="recon-tbl-wrap">
        <table className="recon-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Direction</th>
              <th className="right">Amount</th>
              <th>Code</th>
              <th>Description</th>
              <th>Status</th>
              <th className="mono">Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="recon-load-row"><td colSpan="7">Loading…</td></tr>
            ) : !loaded ? (
              <tr className="recon-load-row"><td colSpan="7">Select a date range and click Load.</td></tr>
            ) : rows.length === 0 ? (
              <tr className="recon-load-row"><td colSpan="7">No transactions.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} onClick={() => onRowClick(r)} className="recon-clickable">
                <td><span className="recon-dc">{fmtD(r.match_date)}</span></td>
                <td><span className={`recon-badge ${r.direction === 'CREDIT' ? 'rb-credit' : 'rb-debit'}`}>{r.direction}</span></td>
                <td className="right">{fmtAmt(r.amount)}</td>
                <td>{r.code || '—'}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.code_description || '—'}</td>
                <td><span className="recon-badge rb-matched" style={{ fontSize: 10 }}>{r.status || '—'}</span></td>
                <td className="mono" style={{ fontSize: 10 }}>{(r.core_transaction_id || '').slice(-12)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingTab({ groups, total, expanded, onToggle, onFileClick, onCoreClick }) {
  const dates = Object.keys(groups).sort().reverse();
  const r2 = v => Math.round(v * 100) / 100;
  const sum = (arr, fn) => arr.reduce((s, r) => s + (parseFloat(fn(r)) || 0), 0);

  if (!total) {
    return (
      <div className="recon-panel">
        <div className="recon-panel-title">Pending at the Federal Reserve</div>
        <div className="recon-panel-sub">Transactions with an effective date of today or later — sent to the Fed but not yet reported in FIRD.</div>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--recon-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <p>No transactions with an effective date of today or later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recon-panel">
      <div className="recon-panel-title">Pending at the Federal Reserve</div>
      <div className="recon-panel-sub">Transactions with an effective date of today or later — sent to the Fed but not yet reported in FIRD.</div>

      <div className="recon-pending-alert">
        <strong>⏳ {total} transaction{total !== 1 ? 's' : ''} pending settlement</strong>
        {' — '}effective date today or later (not yet reported by FIRD).
      </div>

      <div className="recon-tbl-wrap">
        <table className="recon-table">
          <thead>
            <tr className="recon-grp">
              <th></th>
              <th colSpan="2">Files (RDFI + ODFI)</th>
              <th colSpan="2" className="recon-sep">Core</th>
              <th></th>
              <th></th>
            </tr>
            <tr>
              <th>Date</th>
              <th className="right">Credits</th>
              <th className="right">Debits</th>
              <th className="right recon-sep">Credits</th>
              <th className="right">Debits</th>
              <th>Txns</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dates.map(d => {
              const g = groups[d];
              const fileCr = r2(sum(g.rdfi, r => r.credit) + sum(g.odfi, r => r.debit));
              const fileDr = r2(sum(g.rdfi, r => r.debit) + sum(g.odfi, r => r.credit));
              const coreCr = r2(sum(g.core, r => r.direction === 'CREDIT' ? r.amount : 0));
              const coreDr = r2(sum(g.core, r => r.direction === 'DEBIT' ? r.amount : 0));
              const count = g.rdfi.length + g.odfi.length + g.core.length;
              const isExpanded = expanded.has(d);
              const fileRows = [...g.rdfi.map(r => ({ ...r, _src: 'RDFI' })), ...g.odfi.map(r => ({ ...r, _src: 'ODFI' }))];

              return (
                <PendingDateRow
                  key={d}
                  date={d}
                  fileCr={fileCr}
                  fileDr={fileDr}
                  coreCr={coreCr}
                  coreDr={coreDr}
                  count={count}
                  isExpanded={isExpanded}
                  onToggle={() => onToggle(d)}
                  fileRows={fileRows}
                  coreRows={g.core}
                  onFileClick={onFileClick}
                  onCoreClick={onCoreClick}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingDateRow({ date, fileCr, fileDr, coreCr, coreDr, count, isExpanded, onToggle, fileRows, coreRows, onFileClick, onCoreClick }) {
  return (
    <>
      <tr onClick={onToggle} className="recon-clickable">
        <td><span className="recon-dc">{fmtD(date)}</span></td>
        <td className="right">{fmtAmt(fileCr)}</td>
        <td className="right">{fmtAmt(fileDr)}</td>
        <td className="right recon-sep">{fmtAmt(coreCr)}</td>
        <td className="right">{fmtAmt(coreDr)}</td>
        <td><span className="recon-cc">{count}</span></td>
        <td style={{ textAlign: 'center', color: isExpanded ? 'var(--recon-teal)' : 'var(--recon-muted)', fontSize: 11, width: 24 }}>
          {isExpanded ? '▼' : '▶'}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="7" style={{ padding: '0 0 10px', background: '#f8fafc', borderBottom: '2px solid var(--recon-border)' }}>
            {fileRows.length > 0 && (
              <>
                <div className="recon-subtbl-label">File Transactions (RDFI + ODFI)</div>
                <table className="recon-table recon-subtable">
                  <thead>
                    <tr>
                      <th>Src</th>
                      <th className="right">Credit</th>
                      <th className="right">Debit</th>
                      <th>TC</th>
                      <th>Return</th>
                      <th>Trace</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileRows.map((r, i) => (
                      <tr key={i} onClick={() => onFileClick(r)} className="recon-clickable">
                        <td><span className="recon-badge rb-zero">{r._src}</span></td>
                        <td className="right">{fmtAmt(r.credit)}</td>
                        <td className="right">{fmtAmt(r.debit)}</td>
                        <td>{r.transaction_code || '—'}</td>
                        <td>{r.is_return ? <span className="recon-badge rb-return">{r.return_code || 'RTN'}</span> : '—'}</td>
                        <td className="mono" style={{ fontSize: 11 }}>{r.trace_number || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {coreRows.length > 0 && (
              <>
                <div className="recon-subtbl-label">Core Transactions</div>
                <table className="recon-table recon-subtable">
                  <thead>
                    <tr>
                      <th>Dir</th>
                      <th className="right">Amount</th>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coreRows.map((r, i) => (
                      <tr key={i} onClick={() => onCoreClick(r)} className="recon-clickable">
                        <td><span className={`recon-badge ${r.direction === 'CREDIT' ? 'rb-credit' : 'rb-debit'}`}>{r.direction}</span></td>
                        <td className="right">{fmtAmt(r.amount)}</td>
                        <td>{r.code || '—'}</td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.code_description || '—'}</td>
                        <td>{r.status || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Panel Content Components ──────────────────────────────────────────────

function SummaryPanelContent({ row: r, onDrill }) {
  return (
    <>
      <div className="recon-ds">
        <div className="recon-ds-title">FIRD Totals</div>
        <table className="recon-dt">
          <tbody>
            <tr><td>Credits</td><td>{fmtAmt(r.fird_cr)}</td></tr>
            <tr><td>Debits</td><td>{fmtAmt(r.fird_dr)}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="recon-ds">
        <div className="recon-ds-title">Files (RDFI + ODFI) <span className="recon-cc">{r.rdfi_count + r.odfi_count} txns</span></div>
        <table className="recon-dt">
          <tbody>
            <tr><td>RDFI Credits</td><td>{fmtAmt(r.rdfi_cr)}</td></tr>
            <tr><td>ODFI Credits</td><td>{fmtAmt(r.odfi_cr)}</td></tr>
            <tr><td><strong>File Credits</strong></td><td><strong>{fmtAmt(r.file_cr)}</strong></td></tr>
            <tr><td>vs. FIRD Credits</td><td>{fmtVar(r.fvf_cr)}</td></tr>
            <tr><td style={{ paddingTop: 8 }}>RDFI Debits</td><td style={{ paddingTop: 8 }}>{fmtAmt(r.rdfi_dr)}</td></tr>
            <tr><td>ODFI Debits</td><td>{fmtAmt(r.odfi_dr)}</td></tr>
            <tr><td><strong>File Debits</strong></td><td><strong>{fmtAmt(r.file_dr)}</strong></td></tr>
            <tr><td>vs. FIRD Debits</td><td>{fmtVar(r.fvf_dr)}</td></tr>
          </tbody>
        </table>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          {r.rdfi_count > 0 && <button className="recon-drill" onClick={() => onDrill(r.date, 'rdfi')}>RDFI →</button>}
          {r.odfi_count > 0 && <button className="recon-drill" onClick={() => onDrill(r.date, 'odfi')}>ODFI →</button>}
        </div>
      </div>
      <div className="recon-ds">
        <div className="recon-ds-title">Core <span className="recon-cc">{r.core_count} txns</span></div>
        <table className="recon-dt">
          <tbody>
            <tr><td>Core Credits</td><td>{fmtAmt(r.core_cr)}</td></tr>
            <tr><td>vs. File Credits</td><td>{fmtVar(r.fvc_cr)}</td></tr>
            <tr><td style={{ paddingTop: 8 }}>Core Debits</td><td style={{ paddingTop: 8 }}>{fmtAmt(r.core_dr)}</td></tr>
            <tr><td>vs. File Debits</td><td>{fmtVar(r.fvc_dr)}</td></tr>
          </tbody>
        </table>
        {r.core_count > 0 && (
          <button className="recon-drill" style={{ marginTop: 8 }} onClick={() => onDrill(r.date, 'core')}>Core →</button>
        )}
      </div>
      <div className="recon-ds">
        <div className="recon-ds-title">Status</div>
        <Badge status={r.status} />
      </div>
    </>
  );
}

function FileTxnPanelContent({ row: r }) {
  return (
    <div className="recon-ds">
      <div className="recon-ds-title">Transaction</div>
      <table className="recon-dt">
        <tbody>
          <tr><td>Match Date</td><td><span className="recon-dc">{fmtD(r.match_date)}</span></td></tr>
          <tr><td>Credit</td><td>{fmtAmt(r.credit)}</td></tr>
          <tr><td>Debit</td><td>{fmtAmt(r.debit)}</td></tr>
          <tr><td>Transaction Code</td><td>{r.transaction_code || '—'}</td></tr>
          <tr><td>RDFI Routing</td><td className="mono">{r.rdfi_routing_number || '—'}</td></tr>
          <tr><td>ODFI Routing</td><td className="mono">{r.odfi_routing_number || '—'}</td></tr>
          <tr><td>Return</td><td>{r.is_return ? (r.return_code || 'Yes') : 'No'}</td></tr>
          <tr><td>Trace Number</td><td className="mono">{r.trace_number || '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function CoreTxnPanelContent({ row: r }) {
  return (
    <div className="recon-ds">
      <div className="recon-ds-title">Transaction</div>
      <table className="recon-dt">
        <tbody>
          <tr><td>Date</td><td><span className="recon-dc">{fmtD(r.match_date)}</span></td></tr>
          <tr><td>Direction</td><td><span className={`recon-badge ${r.direction === 'CREDIT' ? 'rb-credit' : 'rb-debit'}`}>{r.direction}</span></td></tr>
          <tr><td>Amount</td><td>{fmtAmt(r.amount)}</td></tr>
          <tr><td>Code</td><td>{r.code || '—'}</td></tr>
          <tr><td>Description</td><td>{r.code_description || '—'}</td></tr>
          <tr><td>Status</td><td>{r.status || '—'}</td></tr>
          <tr><td>Return Reason</td><td>{r.return_reason && r.return_reason !== 'null' ? r.return_reason : '—'}</td></tr>
          <tr><td>Jaris Txn ID</td><td className="mono" style={{ fontSize: 10 }}>{r.jaris_transaction_id || '—'}</td></tr>
          <tr><td>Core Txn ID</td><td className="mono" style={{ fontSize: 10 }}>{r.core_transaction_id || '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
