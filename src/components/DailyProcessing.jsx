import { useEffect, useImperativeHandle, useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import {
  buildSwimSnapshot,
  buildOdfiSnapshot,
  buildRdfiSnapshot,
  buildReconReporting,
  buildProductFlows,
} from '../data/dailyProcessingMockData';
import RejectionsModal from './RejectionsModal';

function fmtUSD(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function fmtUSDPrecise(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function fmtCount(n) {
  return new Intl.NumberFormat('en-US').format(n);
}

function fmtCreatedAt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtLag(seconds) {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
  const min = seconds / 60;
  if (min < 60) return `${min.toFixed(1)} min`;
  return `${(min / 60).toFixed(1)} h`;
}

// SLA targets per file family (in seconds, after expected). Used to colour the lag pill.
const LAG_THRESHOLDS = {
  swim: { ok: 30,    warn: 120 },   // SWIM: <30s ok, <2min warn, else late
  odfi: { ok: 60,    warn: 300 },   // ODFI: <1min ok, <5min warn
  rdfi: { ok: 600,   warn: 900 },   // RDFI: <10min ok, <15min warn (bank-paced)
};

function LagIndicator({ lagSeconds, family = 'rdfi' }) {
  if (lagSeconds == null) return <span className="dp-lag dp-lag-pending">—</span>;
  const t = LAG_THRESHOLDS[family] || LAG_THRESHOLDS.rdfi;
  const cls =
    lagSeconds <= t.ok   ? 'dp-lag-ok'   :
    lagSeconds <= t.warn ? 'dp-lag-warn' :
                            'dp-lag-error';
  const glyph =
    cls === 'dp-lag-ok'   ? '✓' :
    cls === 'dp-lag-warn' ? '⏱' :
                             '⚠';
  return (
    <span className={`dp-lag ${cls}`}>
      {glyph} {fmtLag(lagSeconds)}
    </span>
  );
}

function TimingCell({ expected, processed, lagSeconds, family }) {
  if (!processed) {
    return (
      <div className="dp-timing-cell">
        <div className="dp-timing-expected">Expected {expected}</div>
        <div className="dp-timing-pending">awaiting</div>
      </div>
    );
  }
  return (
    <div className="dp-timing-cell">
      <div className="dp-timing-expected">Exp {expected}</div>
      <div className="dp-timing-actual">Got {processed}</div>
      <LagIndicator lagSeconds={lagSeconds} family={family} />
    </div>
  );
}

function StatusBadge({ status }) {
  const cls =
    status === 'COMPLETED' ? 'dp-file-status-ok' :
    status === 'PENDING'   ? 'dp-file-status-pending' :
    status === 'FAILED'    ? 'dp-file-status-error' :
                              'dp-file-status-pending';
  return <span className={`dp-file-status ${cls}`}>{status}</span>;
}

function ArchiveLink({ url, label = 'View archive' }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="dp-archive-link">
      {label} <span className="dp-archive-arrow">→</span>
    </a>
  );
}

function SectionHeader({ title, subtitle, archiveUrl, archiveLabel, summary }) {
  return (
    <header className="dp-section-header">
      <div>
        <h2 className="dp-section-title">{title}</h2>
        {subtitle && <p className="dp-section-sub">{subtitle}</p>}
      </div>
      <div className="dp-section-header-right">
        {summary}
        {archiveUrl && <ArchiveLink url={archiveUrl} label={archiveLabel} />}
      </div>
    </header>
  );
}

/* ============== SWIM ============== */
function SwimSection({ swim }) {
  const today = swim.today;
  return (
    <section className="dp-section">
      <SectionHeader
        title="SWIM"
        subtitle={`Daily GL extract — yesterday's activity (${swim.activityDate})`}
        archiveUrl={swim.archiveUrl}
        archiveLabel="View all SWIM files"
      />
      {today ? (
        <div className="dp-table-wrap">
          <table className="dp-file-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Extract Name</th>
                <th>Status</th>
                <th>Date</th>
                <th>Expected SLA</th>
                <th>Processed (FinXact)</th>
                <th>Lag</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="dp-cell-mono">{today.fileName}</td>
                <td className="dp-cell-mono">{today.extractName}</td>
                <td><StatusBadge status={today.status} /></td>
                <td>{today.date}</td>
                <td className="dp-cell-time">{today.expectedAtLabel}</td>
                <td className="dp-cell-time">{today.processedAtLabel}</td>
                <td><LagIndicator lagSeconds={today.lagSeconds} family="swim" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dp-empty">
          Today's SWIM run hasn't started yet — scheduled for {swim.nextRunAtLabel}.
        </div>
      )}
    </section>
  );
}

/* ============== ODFI ============== */
function OdfiSection({ odfi }) {
  const summary = (
    <div className="dp-totals">
      <span className="dp-total-pill">{odfi.totals.completed} sent</span>
      {odfi.totals.pending > 0 && <span className="dp-total-pill dp-total-pending">{odfi.totals.pending} pending</span>}
      <span className="dp-total-amount">{fmtCount(odfi.totals.entries)} entries · {fmtUSD(odfi.totals.credits + odfi.totals.debits)}</span>
    </div>
  );
  return (
    <section className="dp-section">
      <SectionHeader
        title="ODFI"
        subtitle="Outbound files sent to bank today"
        archiveUrl={odfi.archiveUrl}
        archiveLabel="View ODFI files"
        summary={summary}
      />
      <div className="dp-table-wrap">
        <table className="dp-file-table">
          <thead>
            <tr>
              <th>Window</th>
              <th>File Name</th>
              <th>Mapped Name</th>
              <th>Type</th>
              <th>Status</th>
              <th className="dp-num">Entries</th>
              <th className="dp-num">Volume</th>
              <th>Expected → Processed</th>
            </tr>
          </thead>
          <tbody>
            {odfi.files.map(f => (
              <tr key={f.id}>
                <td>{f.windowLabel}</td>
                <td className="dp-cell-mono">{f.fileName}</td>
                <td className="dp-cell-mono dp-cell-muted">{f.mappedName}</td>
                <td>
                  {f.isReturnFile
                    ? <span className="dp-type-tag dp-type-return">Return</span>
                    : <span className="dp-type-tag">Forward</span>}
                </td>
                <td><StatusBadge status={f.status} /></td>
                <td className="dp-num">{f.status === 'PENDING' ? '—' : fmtCount(f.entries)}</td>
                <td className="dp-num">{f.status === 'PENDING' ? '—' : fmtUSDPrecise(f.totalCredits + f.totalDebits)}</td>
                <td>
                  <TimingCell
                    expected={f.expectedAtLabel}
                    processed={f.processedAtLabel}
                    lagSeconds={f.lagSeconds}
                    family="odfi"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============== RDFI ============== */
function RdfiSection({ rdfi }) {
  const summary = (
    <div className="dp-totals">
      <span className="dp-total-pill">{rdfi.totals.completed} received</span>
      {rdfi.totals.pending > 0 && <span className="dp-total-pill dp-total-pending">{rdfi.totals.pending} pending</span>}
      <span className="dp-total-amount">{fmtCount(rdfi.totals.entries)} entries · {fmtUSD(rdfi.totals.credits + rdfi.totals.debits)}</span>
    </div>
  );
  return (
    <section className="dp-section">
      <SectionHeader
        title="RDFI"
        subtitle="Inbound files received from bank today"
        archiveUrl={rdfi.archiveUrl}
        archiveLabel="View RDFI files"
        summary={summary}
      />
      <div className="dp-table-wrap">
        <table className="dp-file-table">
          <thead>
            <tr>
              <th>Window</th>
              <th>File Name</th>
              <th>Status</th>
              <th className="dp-num">Entries</th>
              <th className="dp-num">Volume</th>
              <th>Expected → Processed</th>
            </tr>
          </thead>
          <tbody>
            {rdfi.files.map(f => (
              <tr key={f.id}>
                <td>{f.windowLabel}</td>
                <td className="dp-cell-mono">{f.fileName}</td>
                <td><StatusBadge status={f.status} /></td>
                <td className="dp-num">{f.status === 'PENDING' ? '—' : fmtCount(f.entries)}</td>
                <td className="dp-num">{f.status === 'PENDING' ? '—' : fmtUSDPrecise(f.totalCredits + f.totalDebits)}</td>
                <td>
                  <TimingCell
                    expected={f.expectedAtLabel}
                    processed={f.processedAtLabel}
                    lagSeconds={f.lagSeconds}
                    family="rdfi"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============== Recon ============== */
function FirdCard({ data }) {
  const allGreen = data.generated && data.reconciled && data.balanced;
  return (
    <div className="dp-card">
      <div className="dp-card-header">
        <h3 className="dp-card-title">{data.name}</h3>
        <span className={`dp-pill ${allGreen ? 'dp-pill-ok' : 'dp-pill-warn'}`}>
          {allGreen ? 'On track' : 'Action needed'}
        </span>
      </div>
      <p className="dp-card-desc">{data.description}</p>
      <ul className="dp-checklist">
        <li className={data.generated ? 'dp-check-ok' : 'dp-check-pending'}>
          <span className="dp-check-glyph">{data.generated ? '✓' : '—'}</span>
          Generated {data.generatedAt && <span className="dp-check-meta">at {data.generatedAt}</span>}
        </li>
        <li className={data.reconciled ? 'dp-check-ok' : 'dp-check-pending'}>
          <span className="dp-check-glyph">{data.reconciled ? '✓' : '—'}</span>
          Reconciled {data.reconciledAt && <span className="dp-check-meta">at {data.reconciledAt}</span>}
        </li>
        <li className={data.balanced ? 'dp-check-ok' : 'dp-check-warn'}>
          <span className="dp-check-glyph">{data.balanced ? '✓' : '⚠'}</span>
          Balanced {data.balanced ? '— $0 variance' : `— variance ${fmtUSD(data.varianceAmount)}`}
        </li>
        <li className="dp-check-info">
          <span className="dp-check-glyph">i</span>
          {fmtCount(data.lineCount)} lines
        </li>
      </ul>
    </div>
  );
}

const FINTECH_STATUS = {
  SENT:         { glyph: '✓', label: 'Sent',         cls: 'dp-fintech-sent' },
  FAILED:       { glyph: '✗', label: 'Failed',       cls: 'dp-fintech-failed' },
  NOT_YET:      { glyph: '⏱', label: 'Not yet',      cls: 'dp-fintech-pending' },
  NOT_REQUIRED: { glyph: '—', label: 'Not required', cls: 'dp-fintech-na' },
};

function FintechFileSpecCard({ data }) {
  const [expanded, setExpanded] = useState(false);
  const c = data.counts;
  const requiredTotal = c.sent + c.failed + c.notYet;       // files we expect today
  const requiredOk = c.sent;                                 // sent successfully

  const overall =
    c.failed > 0  ? 'critical' :
    c.notYet > 0  ? 'warn'     :
                     'ok';
  const overallPill =
    overall === 'critical' ? <span className="dp-pill dp-pill-error">{c.failed} failed</span> :
    overall === 'warn'     ? <span className="dp-pill dp-pill-warn">{c.notYet} not yet sent</span> :
                              <span className="dp-pill dp-pill-ok">All required sent</span>;

  // Highlight the actionable files (failed/not-yet) by name in the summary
  const failedFiles = data.files.filter(f => f.status === 'FAILED');
  const pendingFiles = data.files.filter(f => f.status === 'NOT_YET');

  return (
    <div className="dp-card dp-card-wide">
      <div className="dp-card-header">
        <div>
          <h3 className="dp-card-title">{data.name}</h3>
          <p className="dp-card-desc">{data.description}</p>
        </div>
        {overallPill}
      </div>

      <div className="dp-fintech-summary">
        <span className="dp-fintech-summary-item">Recipient: <strong>{data.recipient}</strong></span>
        <span className="dp-fintech-summary-item">Program: <strong>{data.programName}</strong></span>
        <span className="dp-fintech-summary-item">SLA: <strong>{data.expectedAtLabel}</strong></span>
      </div>

      {/* Compact progress + status segment bar */}
      <div className="dp-fintech-progress">
        <div className="dp-fintech-progress-label">
          <strong>{requiredOk} of {requiredTotal}</strong> required files sent today
          <span className="dp-fintech-progress-meta">{c.notReq} not required</span>
        </div>
        <div className="dp-fintech-progress-bar" role="img" aria-label="File delivery status">
          {c.sent > 0 && (
            <div className="dp-fintech-seg dp-fintech-seg-sent" style={{ flex: c.sent }} title={`${c.sent} sent`} />
          )}
          {c.failed > 0 && (
            <div className="dp-fintech-seg dp-fintech-seg-failed" style={{ flex: c.failed }} title={`${c.failed} failed`} />
          )}
          {c.notYet > 0 && (
            <div className="dp-fintech-seg dp-fintech-seg-pending" style={{ flex: c.notYet }} title={`${c.notYet} not yet`} />
          )}
          {c.notReq > 0 && (
            <div className="dp-fintech-seg dp-fintech-seg-na" style={{ flex: c.notReq }} title={`${c.notReq} not required`} />
          )}
        </div>
      </div>

      {/* Actionable callouts (only failed / not-yet) */}
      {(failedFiles.length > 0 || pendingFiles.length > 0) && (
        <div className="dp-fintech-callouts">
          {failedFiles.map(f => (
            <div key={f.id} className="dp-fintech-callout dp-fintech-callout-fail">
              <span className="dp-fintech-callout-glyph">✗</span>
              <div>
                <div className="dp-fintech-callout-file">{f.fileName}</div>
                <div className="dp-fintech-callout-reason">{f.errorReason}</div>
              </div>
            </div>
          ))}
          {pendingFiles.map(f => (
            <div key={f.id} className="dp-fintech-callout dp-fintech-callout-pending">
              <span className="dp-fintech-callout-glyph">⏱</span>
              <div>
                <div className="dp-fintech-callout-file">{f.fileName}</div>
                <div className="dp-fintech-callout-reason">Not yet delivered — past {data.expectedAtLabel} SLA</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="dp-fintech-toggle"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <span className={`dp-fintech-toggle-chevron ${expanded ? 'dp-fintech-toggle-open' : ''}`}>▶</span>
        {expanded
          ? `Hide file details`
          : `View all ${data.files.length} file details`}
      </button>

      {expanded && (
        <div className="dp-table-wrap dp-fintech-detail">
          <table className="dp-fintech-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>File</th>
                <th>Description</th>
                <th className="dp-num">Rows</th>
                <th>Sent At</th>
                <th>Lag</th>
              </tr>
            </thead>
            <tbody>
              {data.files.map(f => {
                const s = FINTECH_STATUS[f.status];
                return (
                  <tr key={f.id} className={`dp-fintech-row ${s.cls}`}>
                    <td>
                      <span className={`dp-fintech-status ${s.cls}`}>
                        <span className="dp-fintech-glyph">{s.glyph}</span> {s.label}
                      </span>
                    </td>
                    <td className="dp-cell-mono">{f.fileName}</td>
                    <td>
                      <div>{f.description}</div>
                      {f.errorReason && <div className="dp-fintech-error">{f.errorReason}</div>}
                      {f.naReason && <div className="dp-fintech-na-reason">{f.naReason}</div>}
                    </td>
                    <td className="dp-num">
                      {f.status === 'SENT' || f.status === 'FAILED' ? fmtCount(f.rowCount) : '—'}
                    </td>
                    <td className="dp-cell-time">{f.sentAtLabel || '—'}</td>
                    <td>
                      {f.status === 'SENT' && <LagIndicator lagSeconds={f.lagSeconds} family="rdfi" />}
                      {f.status === 'FAILED' && <span className="dp-lag dp-lag-error">⚠ Failed</span>}
                      {f.status === 'NOT_YET' && <span className="dp-lag dp-lag-warn">⏱ Past SLA</span>}
                      {f.status === 'NOT_REQUIRED' && <span className="dp-lag dp-lag-pending">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReconReportingSection({ recon }) {
  return (
    <section className="dp-section">
      <SectionHeader
        title="Reconciliation &amp; Bank Reporting"
        subtitle="Daily reconciliation (FIRD) and the FinTech File Spec delivery to First Internet Bank"
      />
      <div className="dp-recon-stack">
        <FirdCard data={recon.fird} />
        <FintechFileSpecCard data={recon.fintechFileSpec} />
      </div>
    </section>
  );
}

/* ============== Product flows ============== */
const RAIL_LABELS = {
  fednow: 'FedNow',
  rtp:    'RTP',
  ingo:   'Ingo OCT',
  ach:    'ACH',
};

function ProductCard({ product, onReviewRejections }) {
  const rails = product.rails;
  const railEntries = ['fednow', 'rtp', 'ingo', 'ach']
    .map(k => ({ key: k, label: RAIL_LABELS[k], ...rails[k] }))
    .filter(r => r.count > 0);
  const totalCount = railEntries.reduce((s, r) => s + r.count, 0);
  const totalAmount = railEntries.reduce((s, r) => s + r.amount, 0);
  const totalRejected = Object.values(rails).reduce((s, r) => s + (r.rejected || 0), 0);
  const rejectReason = Object.values(rails).find(r => r.rejected > 0)?.rejectReason;

  const successCount = totalCount - totalRejected;
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

  return (
    <div className={`dp-product-card ${totalRejected > 0 ? 'dp-product-card-warn' : ''}`}>
      <div className="dp-product-card-header">
        <h3 className="dp-product-card-title">{product.name}</h3>
        {totalRejected > 0 ? (
          <span className="dp-pill dp-pill-error">{totalRejected} rejected</span>
        ) : totalCount > 0 ? (
          <span className="dp-pill dp-pill-ok">Healthy</span>
        ) : (
          <span className="dp-pill dp-pill-warn">No activity</span>
        )}
      </div>
      <p className="dp-product-card-desc">{product.description}</p>

      <div className="dp-product-card-stats">
        <div>
          <div className="dp-product-card-num">{fmtCount(totalCount)}</div>
          <div className="dp-product-card-num-meta">transactions</div>
        </div>
        <div>
          <div className="dp-product-card-num">{fmtUSD(totalAmount)}</div>
          <div className="dp-product-card-num-meta">total</div>
        </div>
        <div>
          <div className="dp-product-card-num">{successRate.toFixed(1)}%</div>
          <div className="dp-product-card-num-meta">success</div>
        </div>
      </div>

      {totalCount > 0 && (
        <>
          <div className="dp-railmix-label">Rail mix</div>
          <div className="dp-railmix-bar" role="img" aria-label="Rail distribution">
            {railEntries.map(r => {
              const pct = (r.count / totalCount) * 100;
              return (
                <div
                  key={r.key}
                  className={`dp-railmix-seg dp-railmix-${r.key}`}
                  style={{ width: `${pct}%` }}
                  title={`${r.label}: ${r.count} (${pct.toFixed(0)}%)`}
                >
                  {pct >= 12 ? `${r.label} ${pct.toFixed(0)}%` : ''}
                </div>
              );
            })}
          </div>
          <div className="dp-railmix-legend">
            {railEntries.map(r => (
              <span key={r.key} className="dp-railmix-legend-item">
                <span className={`dp-railmix-dot dp-railmix-${r.key}`}></span>
                <span className="dp-railmix-legend-label">{r.label}</span>
                <span className="dp-railmix-legend-count">{fmtCount(r.count)}</span>
                <span className="dp-railmix-legend-amount">{fmtUSD(r.amount)}</span>
              </span>
            ))}
          </div>
        </>
      )}

      {totalRejected > 0 && (
        <div className="dp-product-card-action">
          <span className="dp-product-card-reason">⚠ {rejectReason}</span>
          <button className="dp-action-btn" onClick={() => onReviewRejections?.(product)}>
            Review &amp; resolve →
          </button>
        </div>
      )}
    </div>
  );
}

function RailWaterfallCard({ leg, order, isFallback }) {
  const successRate = leg.attempted > 0 ? (leg.succeeded / leg.attempted) * 100 : 0;
  const failed = leg.attempted - leg.succeeded;
  const idle = leg.status === 'idle' || leg.attempted === 0;
  return (
    <div className={`dp-rail-card ${isFallback ? 'dp-rail-fallback' : ''} ${idle ? 'dp-rail-idle' : ''}`}>
      <div className="dp-rail-header">
        <span className="dp-rail-order">#{order}</span>
        <div>
          <div className="dp-rail-name">{leg.rail}</div>
          <div className="dp-rail-provider">via {leg.provider}</div>
        </div>
      </div>
      <div className="dp-rail-stat">
        <div className="dp-rail-attempted">{fmtCount(leg.succeeded)}</div>
        <div className="dp-rail-stat-meta">of {fmtCount(leg.attempted)} attempted</div>
      </div>
      <div className="dp-rail-amount">{fmtUSD(leg.amount)}</div>
      <div className="dp-rail-footer">
        <span className="dp-rail-latency">{leg.avgLatencyMs ? `${leg.avgLatencyMs} ms avg` : 'idle'}</span>
        {idle ? (
          <span className="dp-pill dp-pill-neutral">Standby</span>
        ) : failed > 0 ? (
          <span className="dp-pill dp-pill-warn">{failed} failed → next rail</span>
        ) : (
          <span className="dp-pill dp-pill-ok">{successRate.toFixed(1)}%</span>
        )}
      </div>
    </div>
  );
}

function ProductFlowsSection({ products, onReviewRejections }) {
  const list = products.products;
  const w = products.railWaterfall;

  const grand = list.reduce((acc, p) => {
    const cnt = Object.values(p.rails).reduce((s, r) => s + r.count, 0);
    const amt = Object.values(p.rails).reduce((s, r) => s + r.amount, 0);
    const rej = Object.values(p.rails).reduce((s, r) => s + (r.rejected || 0), 0);
    acc.count += cnt; acc.amount += amt; acc.rejected += rej;
    return acc;
  }, { count: 0, amount: 0, rejected: 0 });

  const summary = (
    <div className="dp-totals">
      <span className="dp-total-pill">{fmtCount(grand.count)} txns</span>
      <span className="dp-total-amount">{fmtUSD(grand.amount)}</span>
      {grand.rejected > 0 && (
        <span className="dp-total-pill dp-total-pill-error">{grand.rejected} need action</span>
      )}
    </div>
  );

  return (
    <section className="dp-section">
      <SectionHeader
        title="Product Transaction Processing"
        subtitle="Today's volume by product · with rail mix and operator actions"
        summary={summary}
      />

      <div className="dp-product-card-grid">
        {list.map(p => <ProductCard key={p.id} product={p} onReviewRejections={onReviewRejections} />)}
      </div>

      <div className="dp-rail-waterfall">
        <div className="dp-rail-waterfall-header">
          <h3 className="dp-rail-waterfall-title">Aggregate Rail Health</h3>
          <span className="dp-rail-waterfall-sub">Alacriti waterfall · FedNow → RTP, Ingo OCT on standby</span>
        </div>
        <div className="dp-rail-grid">
          <RailWaterfallCard leg={w.fednow} order={1} isFallback={false} />
          <span className="dp-rail-arrow">→</span>
          <RailWaterfallCard leg={w.rtp}    order={2} isFallback />
          <span className="dp-rail-arrow">→</span>
          <RailWaterfallCard leg={w.ingo}   order={3} isFallback />
        </div>
      </div>
    </section>
  );
}

/* ============== Root ============== */
export default function DailyProcessing({ refreshRef }) {
  const { error } = useDashboard();
  const [snapshot, setSnapshot] = useState(() => ({
    swim: buildSwimSnapshot(),
    odfi: buildOdfiSnapshot(),
    rdfi: buildRdfiSnapshot(),
    recon: buildReconReporting(),
    products: buildProductFlows(),
    asOf: new Date(),
  }));
  const [rejectionsProduct, setRejectionsProduct] = useState(null);

  const refresh = () => {
    setSnapshot({
      swim: buildSwimSnapshot(),
      odfi: buildOdfiSnapshot(),
      rdfi: buildRdfiSnapshot(),
      recon: buildReconReporting(),
      products: buildProductFlows(),
      asOf: new Date(),
    });
  };

  useImperativeHandle(refreshRef, () => refresh, []);

  return (
    <div className="dp-root">
      {error && (
        <div className="error-banner">
          <span className="error-banner-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      <ProductFlowsSection
        products={snapshot.products}
        onReviewRejections={setRejectionsProduct}
      />
      <SwimSection swim={snapshot.swim} />
      <OdfiSection odfi={snapshot.odfi} />
      <RdfiSection rdfi={snapshot.rdfi} />
      <ReconReportingSection recon={snapshot.recon} />

      <RejectionsModal
        open={!!rejectionsProduct}
        product={rejectionsProduct}
        onClose={() => setRejectionsProduct(null)}
      />
    </div>
  );
}
