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

function formatCurrencyShort(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

const TXN_CODE_LABELS = {
  22: 'Checking Credit',
  27: 'Checking Debit',
  32: 'Savings Credit',
  37: 'Savings Debit',
};

const RETURN_CODE_LABELS = {
  R01: 'Insufficient Funds',
  R02: 'Account Closed',
  R03: 'No Account / Unable to Locate',
  R04: 'Invalid Account Number',
  R10: 'Customer Advises Unauthorized',
};

function getCellStatus(window, field) {
  const now = new Date();
  const scheduled = new Date(window.scheduledTime);

  if (field === 'received') {
    if (window.received) return 'done';
    if (scheduled < now) return 'missed';
    return 'pending';
  }

  // processed
  if (window.processed) return 'done';
  if (window.received && !window.processed) return 'progress';
  if (scheduled < now && !window.received) return 'missed';
  return 'pending';
}

function StatusCell({ status, timestamp }) {
  if (status === 'done') {
    return (
      <div className="timeline-cell">
        <span className="timeline-check">&#10003;</span>
        {timestamp && <span className="timeline-time">{formatTime(timestamp)}</span>}
      </div>
    );
  }
  if (status === 'progress') {
    return (
      <div className="timeline-cell">
        <span className="timeline-progress">&#9711;</span>
        <span className="timeline-time">In progress</span>
      </div>
    );
  }
  if (status === 'missed') {
    return (
      <div className="timeline-cell">
        <span className="timeline-miss">&#10007;</span>
        <span className="timeline-time">Missed</span>
      </div>
    );
  }
  return (
    <div className="timeline-cell">
      <span className="timeline-pending">&mdash;</span>
    </div>
  );
}

function getFileStatus(batches) {
  if (!batches || batches.length === 0) return 'unknown';
  const allProcessed = batches.every(b => b.status === 'processed');
  const allPending = batches.every(b => b.status === 'pending');
  const hasFailed = batches.some(b => b.status === 'failed');
  if (allProcessed) return 'processed';
  if (allPending) return 'pending';
  if (hasFailed) return 'failed';
  return 'partial';
}

function getFileStatusBadge(status) {
  if (status === 'processed') return { label: 'Processed', cls: 'badge-success' };
  if (status === 'pending') return { label: 'Pending', cls: 'badge-neutral' };
  if (status === 'failed') return { label: 'Failed', cls: 'badge-error' };
  return { label: 'Partial', cls: 'badge-warning' };
}

function getBatchStatusBadge(status) {
  if (status === 'processed') return { label: 'Processed', cls: 'badge-success' };
  if (status === 'pending') return { label: 'Pending', cls: 'badge-neutral' };
  if (status === 'failed') return { label: 'Failed', cls: 'badge-error' };
  return { label: 'Partial', cls: 'badge-warning' };
}

function EntryTable({ entries }) {
  return (
    <div className="table-wrapper">
      <table className="entry-detail-table">
        <thead>
          <tr>
            <th>Trace #</th>
            <th>Receiving Name</th>
            <th>Routing #</th>
            <th>Account #</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const isReturned = entry.status === 'returned';
            return (
              <tr key={entry.traceNumber} className={isReturned ? 'entry-returned' : ''}>
                <td className="cell-mono">{entry.traceNumber}</td>
                <td className="cell-name">{entry.receivingName}</td>
                <td className="cell-mono">{entry.routingNumber}</td>
                <td className="cell-mono">{entry.accountNumber}</td>
                <td className={`cell-mono ${entry.transactionCode === 27 || entry.transactionCode === 37 ? 'amount-debit' : 'amount-credit'}`}>
                  {formatCurrency(entry.amount)}
                </td>
                <td>
                  <span className="txn-code-label">{TXN_CODE_LABELS[entry.transactionCode] || entry.transactionCode}</span>
                </td>
                <td>
                  {isReturned ? (
                    <span className="status-badge badge-error" title={RETURN_CODE_LABELS[entry.returnCode] || ''}>
                      {entry.returnCode}
                    </span>
                  ) : entry.status === 'pending' ? (
                    <span className="status-badge badge-neutral">Pending</span>
                  ) : (
                    <span className="status-badge badge-success">Processed</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BatchRow({ batch, isExpanded, onToggle }) {
  const batchBadge = getBatchStatusBadge(batch.status);
  const totalAmount = batch.totalCredit + batch.totalDebit;
  const hasReturns = batch.entries.some(e => e.status === 'returned');

  return (
    <>
      <div className={`batch-row ${isExpanded ? 'batch-row-expanded' : ''}`} onClick={onToggle}>
        <div className="batch-row-left">
          <span className={`chevron ${isExpanded ? 'chevron-open' : ''}`}>&#9654;</span>
          <span className="batch-row-number">Batch {batch.batchNumber}</span>
          <span className="batch-row-company">{batch.companyName}</span>
          <span className="cell-mono" style={{ fontSize: '0.7rem', color: '#64748b' }}>{batch.companyId}</span>
          <span className="sec-badge">{batch.secCode}</span>
        </div>
        <div className="batch-row-right">
          <span className="batch-row-desc">{batch.companyEntryDescription}</span>
          <span className="batch-row-entries">{batch.entryCount} entries</span>
          {hasReturns && <span className="batch-row-return-flag">Has returns</span>}
          <span className="batch-row-amount">{formatCurrencyShort(totalAmount)}</span>
          <span className={`status-badge ${batchBadge.cls}`}>{batchBadge.label}</span>
        </div>
      </div>
      {isExpanded && <EntryTable entries={batch.entries} />}
    </>
  );
}

function FileDetail({ fileWindow, expandedBatchNum, onToggleBatch }) {
  const { batches, fileName } = fileWindow;
  if (!batches || batches.length === 0) return null;

  const totalEntries = batches.reduce((sum, b) => sum + b.entryCount, 0);
  const totalCredits = batches.reduce((sum, b) => sum + b.totalCredit, 0);
  const totalDebits = batches.reduce((sum, b) => sum + b.totalDebit, 0);
  const totalReturns = batches.reduce((sum, b) => sum + b.entries.filter(e => e.status === 'returned').length, 0);
  const fileStatus = getFileStatus(batches);
  const statusBadge = getFileStatusBadge(fileStatus);

  return (
    <div className="file-detail">
      <div className="file-detail-summary">
        <div className="file-detail-stat">
          <span className="meta-label">File</span>
          <span className="meta-value mono">{fileName}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Batches</span>
          <span className="meta-value">{batches.length}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Entries</span>
          <span className="meta-value">{totalEntries}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Total Credits</span>
          <span className="meta-value amount-credit">{formatCurrencyShort(totalCredits)}</span>
        </div>
        <div className="file-detail-stat">
          <span className="meta-label">Total Debits</span>
          <span className="meta-value amount-debit">{formatCurrencyShort(totalDebits)}</span>
        </div>
        {totalReturns > 0 && (
          <div className="file-detail-stat">
            <span className="meta-label">Returns</span>
            <span className="meta-value amount-debit">{totalReturns}</span>
          </div>
        )}
        <div className="file-detail-stat">
          <span className="meta-label">Status</span>
          <span className={`status-badge ${statusBadge.cls}`}>{statusBadge.label}</span>
        </div>
      </div>

      <div className="batch-list">
        {batches.map(batch => (
          <BatchRow
            key={batch.batchNumber}
            batch={batch}
            isExpanded={expandedBatchNum === batch.batchNumber}
            onToggle={() => onToggleBatch(batch.batchNumber)}
          />
        ))}
      </div>
    </div>
  );
}

export default function ACHFileTimeline() {
  const { achFileTimings } = useDashboard();
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [expandedBatchNum, setExpandedBatchNum] = useState(null);

  if (!achFileTimings || achFileTimings.length === 0) return null;

  const hasIssue = achFileTimings.some(w => {
    const now = new Date();
    const scheduled = new Date(w.scheduledTime);
    return (!w.received && scheduled < now) || (w.received && !w.processed && scheduled < now);
  });

  const handleFileClick = (windowId) => {
    if (selectedFileId === windowId) {
      setSelectedFileId(null);
      setExpandedBatchNum(null);
    } else {
      setSelectedFileId(windowId);
      setExpandedBatchNum(null);
    }
  };

  const handleToggleBatch = (batchNum) => {
    setExpandedBatchNum(expandedBatchNum === batchNum ? null : batchNum);
  };

  const selectedFile = selectedFileId
    ? achFileTimings.find(w => w.windowId === selectedFileId)
    : null;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">ACH Inbound File Timing</h2>
        <span className={`status-badge ${hasIssue ? 'badge-warning' : 'badge-success'}`}>
          {hasIssue ? 'Attention' : 'On Track'}
        </span>
      </div>
      <div className="timeline-grid" style={{ gridTemplateColumns: `100px repeat(${achFileTimings.length}, 1fr)` }}>
        {/* Header row */}
        <div className="timeline-row-label"></div>
        {achFileTimings.map(w => (
          <div key={w.windowId} className="timeline-header">
            {w.windowLabel}
          </div>
        ))}

        {/* Received row */}
        <div className="timeline-row-label">Received</div>
        {achFileTimings.map(w => (
          <StatusCell
            key={`recv-${w.windowId}`}
            status={getCellStatus(w, 'received')}
            timestamp={w.receivedAt}
          />
        ))}

        {/* Processed row */}
        <div className="timeline-row-label">Processed</div>
        {achFileTimings.map(w => (
          <StatusCell
            key={`proc-${w.windowId}`}
            status={getCellStatus(w, 'processed')}
            timestamp={w.processedAt}
          />
        ))}
      </div>

      {/* Clickable file tags */}
      <div className="timeline-files">
        {achFileTimings.filter(w => w.fileName).map(w => (
          <button
            key={w.windowId}
            className={`timeline-file-tag ${selectedFileId === w.windowId ? 'timeline-file-tag-active' : ''}`}
            onClick={() => handleFileClick(w.windowId)}
          >
            {w.fileName}
          </button>
        ))}
      </div>

      {/* Expandable file detail */}
      {selectedFile && selectedFile.batches && (
        <FileDetail
          fileWindow={selectedFile}
          expandedBatchNum={expandedBatchNum}
          onToggleBatch={handleToggleBatch}
        />
      )}
    </section>
  );
}
