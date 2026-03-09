import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function formatTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatCurrencyCompact(amount) {
  if (amount >= 1_000_000_000) {
    return '$' + (amount / 1_000_000_000).toFixed(2) + 'B';
  }
  if (amount >= 1_000_000) {
    return '$' + (amount / 1_000_000).toFixed(2) + 'M';
  }
  if (amount >= 1_000) {
    return '$' + (amount / 1_000).toFixed(1) + 'K';
  }
  return formatCurrency(amount);
}

function formatCycleTime(cycle) {
  if (!cycle) return '';
  const h = parseInt(cycle.substring(0, 2), 10);
  const m = cycle.substring(2);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m} ${ampm}`;
}

const CYCLE_LABELS = {
  '0830': 'W1 — 8:30 AM Settlement',
  '1300': 'W3 — 1:00 PM Settlement',
  '1700': 'W2 — 5:00 PM Settlement',
  '1800': 'W4 — 6:00 PM Settlement',
};

const CYCLE_ORDER = ['0830', '1300', '1700', '1800'];

// 57xxx Net Settlement codes — labels per FIRD Layout spec & recon doc v3.0
const FIRD_TYPE_LABELS = {
  '57010': 'Originated Credit Sett',
  '57020': 'Originated Debit Sett',
  '57030': 'Return Settlement',
  '57040': 'Credit Received Sett',
  '57050': 'Debit Received Sett',
  '57240': 'Originated Credit Sett',
  '57260': 'Originated Debit Sett',
  '57270': 'Credit Received Sett',
  '57280': 'Debit Received Sett',
  '57290': 'Originated Credit Sett',
  '57310': 'Originated Debit Sett',
  '57330': 'Return Settlement',
  '57340': 'Originated Credit Sett',
  '57360': 'Originated Debit Sett',
};

// Reconciliation source for each 57xxx code — maps to OUT/IN file
const RECON_SOURCE = {
  '57010': 'Prev-day late OUT debit total',
  '57020': 'Prev-day late OUT credit total',
  '57030': 'Prev-day 1630 OUT credit total',
  '57040': 'Sum of IN file credits (W1)',
  '57050': 'Sum of IN file debits (W2)',
  '57240': '1115 OUT debit total',
  '57260': '1115 OUT credit total',
  '57270': 'Sum of IN file credits (W2)',
  '57280': 'Sum of IN file debits (W4)',
  '57290': '0700 OUT debit total',
  '57310': '0700 OUT credit total',
  '57330': 'Cross-day returns',
  '57340': '1315 OUT debit total',
  '57360': '1315 OUT credit total',
};

function getStatus(fird) {
  if (fird.received) return 'received';
  const now = new Date();
  const today = new Date();
  today.setHours(fird.deadlineHour, fird.deadlineMinute, 0, 0);
  if (now >= today) return 'overdue';
  return 'awaiting';
}

function PositionCycleGroup({ cycle, records }) {
  const cycleCredits = records.filter(r => r.dir === 'C').reduce((s, r) => s + r.amount, 0);
  const cycleDebits = records.filter(r => r.dir === 'D').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="fird-cycle-group">
      <div className="fird-cycle-header">
        <span className="fird-cycle-label">{CYCLE_LABELS[cycle] || cycle}</span>
        <div className="fird-cycle-totals">
          <span className="amount-credit">{formatCurrency(cycleCredits)}</span>
          <span className="fird-cycle-sep">/</span>
          <span className="amount-debit">{formatCurrency(cycleDebits)}</span>
        </div>
      </div>
      <div className="fird-cycle-records">
        {records.map((rec, i) => (
          <div key={i} className="fird-position-row">
            <span className="fird-pos-type">
              <span className="cell-mono fird-type-code">{rec.type}</span>
              <span className="fird-pos-label">{FIRD_TYPE_LABELS[rec.type] || rec.type}</span>
              {RECON_SOURCE[rec.type] && (
                <span className="fird-recon-source">= {RECON_SOURCE[rec.type]}</span>
              )}
            </span>
            <span className={`cell-mono ${rec.dir === 'C' ? 'amount-credit' : 'amount-debit'}`}>
              {rec.dir === 'D' ? '-' : '+'}{formatCurrency(rec.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemRecordTable({ records }) {
  return (
    <div className="table-wrapper">
      <table className="entry-detail-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Offset Trace</th>
            <th>Cycle</th>
            <th>Amount</th>
            <th>Direction</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => (
            <tr key={i}>
              <td className="cell-mono">{rec.reference}</td>
              <td className="cell-mono">{rec.offsetTrace}</td>
              <td className="cell-mono">{formatCycleTime(rec.cycle)}</td>
              <td className={`cell-mono ${rec.dir === 'D' ? 'amount-debit' : 'amount-credit'}`}>
                {formatCurrency(rec.amount)}
              </td>
              <td>
                <span className={`status-badge ${rec.dir === 'D' ? 'badge-error' : 'badge-success'}`}>
                  {rec.dir === 'D' ? 'Debit' : 'Credit'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FIRDDetail({ firdStatus }) {
  const [activeTab, setActiveTab] = useState('positions');
  const { header, positionRecords, itemRecords } = firdStatus;

  // Group position records by cycle
  const groupedPositions = {};
  for (const rec of positionRecords) {
    if (!groupedPositions[rec.cycle]) groupedPositions[rec.cycle] = [];
    groupedPositions[rec.cycle].push(rec);
  }

  const totalItemAmount = itemRecords.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="fird-detail">
      {/* Header Summary — master account totals (not subaccount detail) */}
      <div className="fird-header-caveat">
        Header record reflects master account ({header.fedRTN}) totals — detail records below are subaccount ({header.participantRTN}) only.
      </div>
      <div className="file-detail-summary">
        <div className="file-detail-stat">
          <span className="meta-label">Report Date</span>
          <span className="meta-value mono">{header.reportDate}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Subaccount</span>
          <span className="meta-value mono">{header.participantRTN}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Opening Position</span>
          <span className="meta-value amount-credit">{formatCurrencyCompact(header.openingPosition)}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Credits</span>
          <span className="meta-value amount-credit">{formatCurrencyCompact(header.totalCredits)}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Debits</span>
          <span className="meta-value amount-debit">{formatCurrencyCompact(header.totalDebits)}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Closing Position</span>
          <span className="meta-value amount-credit">{formatCurrencyCompact(header.closingPosition)}</span>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="fird-tabs">
        <button
          className={`fird-tab ${activeTab === 'positions' ? 'fird-tab-active' : ''}`}
          onClick={() => setActiveTab('positions')}
        >
          Position Records ({positionRecords.length})
        </button>
        <button
          className={`fird-tab ${activeTab === 'items' ? 'fird-tab-active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Item Records ({itemRecords.length})
        </button>
      </div>

      {/* Position Records — grouped by settlement cycle */}
      {activeTab === 'positions' && (
        <div className="fird-positions">
          {CYCLE_ORDER.filter(c => groupedPositions[c]).map(cycle => (
            <PositionCycleGroup key={cycle} cycle={cycle} records={groupedPositions[cycle]} />
          ))}
        </div>
      )}

      {/* Item Records — individual FedACH transactions (44010) */}
      {activeTab === 'items' && (
        <div className="fird-items">
          <div className="fird-items-warning">
            44010 items are a detail breakout within 57040/57270 received settlement — do not double-count against position totals.
          </div>
          <div className="fird-items-summary">
            <span className="fird-items-count">{itemRecords.length} item-level records (44010)</span>
            <span className="fird-items-total">
              Total: <span className="amount-debit">{formatCurrency(totalItemAmount)}</span>
            </span>
          </div>
          <ItemRecordTable records={itemRecords} />
        </div>
      )}
    </div>
  );
}

export default function FIRDStatus() {
  const { firdStatus } = useDashboard();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (!firdStatus) return null;

  const status = getStatus(firdStatus);
  const hasDetail = firdStatus.header && firdStatus.positionRecords;

  return (
    <section className="panel fird-panel">
      <div className="fird-layout">
        <div className="fird-left">
          <h2 className="panel-title">FIRD File Status</h2>
          <span className="fird-deadline">Deadline: {firdStatus.deadline}</span>
        </div>
        <div className="fird-right">
          {status === 'received' && (
            <div className="fird-badge fird-received">
              <span className="fird-icon">&#10003;</span>
              <div>
                <div className="fird-badge-label">Received</div>
                <div className="fird-badge-time">{formatTime(firdStatus.receivedAt)}</div>
              </div>
            </div>
          )}
          {status === 'awaiting' && (
            <div className="fird-badge fird-awaiting">
              <span className="fird-icon">&mdash;</span>
              <div className="fird-badge-label">Awaiting</div>
            </div>
          )}
          {status === 'overdue' && (
            <div className="fird-badge fird-overdue">
              <span className="pulse-dot"></span>
              <div>
                <div className="fird-badge-label">Not Received — OVERDUE</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clickable filename tag (reuses ACH file tag pattern) */}
      {firdStatus.fileName && status === 'received' && (
        <div className="timeline-files">
          <button
            className={`timeline-file-tag ${isDetailOpen ? 'timeline-file-tag-active' : ''}`}
            onClick={() => setIsDetailOpen(!isDetailOpen)}
          >
            {firdStatus.fileName}
          </button>
        </div>
      )}

      {/* Expandable detail panel */}
      {isDetailOpen && hasDetail && (
        <FIRDDetail firdStatus={firdStatus} />
      )}
    </section>
  );
}
