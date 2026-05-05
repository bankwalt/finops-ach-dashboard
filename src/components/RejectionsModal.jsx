import { useEffect, useMemo, useState } from 'react';
import { RAIL_META } from '../data/dailyProcessingMockData';

function fmtUSDPrecise(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function railLabel(railKey)  { return RAIL_META[railKey]?.label || railKey; }
function railShort(railKey)  { return RAIL_META[railKey]?.shortLabel || railKey; }

const ACTION_DEFS = {
  notify: {
    label: 'Notify Merchant',
    icon: '✉',
    description: (group) => `Email ${group.merchant} that ${group.count} payment${group.count === 1 ? '' : 's'} (${fmtUSDPrecise(group.total)}) failed for "${group.reasonCode} ${group.reason}". Request updated banking details for the closed account ending in ${group.recipientTail}.`,
    successMessage: (group) => `Notification queued — ${group.merchant} will receive an email within 5 minutes.`,
    needsRail: false,
  },
  manualRetry: {
    label: 'Manual Retry',
    icon: '↻',
    shortDesc: (group, product) => {
      const rails = manualRetryRails(product);
      return `Force a retry on a specific rail (${rails.map(r => railShort(r)).join(', ')}). Useful when auto-fallback finished but you have new info — e.g., merchant gave a different account.`;
    },
    description: (group, product, rail) =>
      `Retry all ${group.count} payments via ${railLabel(rail)} (${RAIL_META[rail]?.via}). Eligibility check runs first; failures stay in this queue.`,
    successMessage: (group, rail) => `${group.count} payments queued for ${railLabel(rail)} retry · ${fmtUSDPrecise(group.total)} total · ETA ~2 minutes.`,
    needsRail: true,
  },
  manualReroute: {
    label: 'Manual Re-Route',
    icon: '⤳',
    description: (group) => `Bypass FinXact and process all ${group.count} payments manually via Increase. Operator handles routing and posts the entry back to the ledger when settled. Use when FinXact is unavailable or stuck.`,
    successMessage: (group) => `${group.count} payments handed off to Increase manual queue · ${fmtUSDPrecise(group.total)} total · operator will reconcile.`,
    needsRail: false,
  },
  escalate: {
    label: 'Escalate to Vendor',
    icon: '↗',
    description: (group) => `Open a ticket with First Internet Bank / Alacriti including all ${group.count} payment details, fallback chain attempts, and reason codes.`,
    successMessage: () => 'Ticket #INC-78421 opened with First Internet Bank — vendor SLA: 4 hours.',
    needsRail: false,
  },
};

// For Manual Retry, present rails based on the product's fallback chain.
// fednow_or_rtp expands into FedNow + RTP as separately retryable rails.
function manualRetryRails(product) {
  const chain = product?.fallbackChain || [];
  const rails = [];
  for (const r of chain) {
    if (r === 'fednow_or_rtp') {
      rails.push('rtp', 'fednow');
    } else {
      rails.push(r);
    }
  }
  return rails;
}

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="rm-toast" role="status">
      <span className="rm-toast-glyph">✓</span>
      <span>{message}</span>
    </div>
  );
}

function FallbackChainPanel({ product, sample }) {
  // sample is one rejection — its fallbackAttempts shows what the auto-fallback ran
  if (!product?.fallbackChain || !sample?.fallbackAttempts) return null;

  const attemptByRail = Object.fromEntries(
    sample.fallbackAttempts.map(a => [a.rail, a])
  );

  return (
    <div className="rm-chain">
      <div className="rm-chain-label">Auto-fallback chain (exhausted before reaching your queue)</div>
      <div className="rm-chain-row">
        {product.fallbackChain.map((rail, idx) => {
          const attempt = attemptByRail[rail];
          const status = attempt?.status || 'attempted';
          const cls = status === 'failed' ? 'rm-chain-fail' : status === 'skipped' ? 'rm-chain-skip' : 'rm-chain-fail';
          return (
            <div key={rail} className="rm-chain-step">
              <div className={`rm-chain-glyph ${cls}`}>✗</div>
              <div className="rm-chain-stepbody">
                <div className="rm-chain-rail">{railLabel(rail)}</div>
                <div className="rm-chain-meta">
                  {attempt ? `${attempt.code} · ${attempt.timestamp}` : 'no attempt'}
                </div>
              </div>
              {idx < product.fallbackChain.length - 1 && <span className="rm-chain-arrow">→</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RailPicker({ rails, attemptedRailKeys, onPick, onCancel }) {
  const attemptedLabels = attemptedRailKeys.map(railLabel).join(', ');
  return (
    <div className="rm-railpicker">
      <h4 className="rm-railpicker-title">Pick a rail to retry on</h4>
      <p className="rm-railpicker-desc">
        Auto-fallback already attempted {attemptedLabels}. Operator override will retry regardless.
      </p>
      <div className="rm-railpicker-grid">
        {rails.map(r => {
          const wasAttempted = attemptedRailKeys.includes(r);
          return (
            <button
              key={r}
              className={`rm-railpicker-btn ${wasAttempted ? 'rm-railpicker-btn-attempted' : ''}`}
              onClick={() => onPick(r)}
            >
              <div className="rm-railpicker-rail">{railLabel(r)}</div>
              <div className="rm-railpicker-via">via {RAIL_META[r]?.via}</div>
              {wasAttempted && <div className="rm-railpicker-badge">Already attempted</div>}
            </button>
          );
        })}
      </div>
      <div className="rm-confirm-actions">
        <button className="rm-btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ActionConfirm({ action, group, product, rail, onConfirm, onCancel }) {
  const def = ACTION_DEFS[action];
  return (
    <div className="rm-confirm">
      <div className="rm-confirm-icon">{def.icon}</div>
      <div className="rm-confirm-body">
        <h4 className="rm-confirm-title">{def.label}{rail ? ` via ${railLabel(rail)}` : ''}?</h4>
        <p className="rm-confirm-desc">
          {def.needsRail ? def.description(group, product, rail) : def.description(group, product)}
        </p>
        <div className="rm-confirm-actions">
          <button className="rm-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="rm-btn-primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function RejectionsModal({ open, onClose, product }) {
  const [pendingAction, setPendingAction] = useState(null); // 'notify' | 'manualRetry' | ...
  const [pickedRail, setPickedRail] = useState(null);
  const [toast, setToast] = useState(null);
  const [resolved, setResolved] = useState(new Set());

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset on open/close
  useEffect(() => {
    if (!open) { setPendingAction(null); setPickedRail(null); setToast(null); setResolved(new Set()); }
  }, [open]);

  const rejections = product?.rejections || [];

  const merchantGroup = useMemo(() => {
    if (rejections.length === 0) return null;
    const merchant = rejections[0].recipientName;
    const recipientTail = rejections[0].recipientAccountTail;
    const senderTail = rejections[0].senderAccountTail;
    const total = rejections.reduce((s, r) => s + r.amount, 0);
    const reason = rejections[0].reasonLabel;
    const reasonCode = rejections[0].reasonCode;
    const rail = rejections[0].paymentMethod;
    const allSameMerchant = rejections.every(r => r.recipientName === merchant);
    return { merchant, recipientTail, senderTail, total, reason, reasonCode, rail, count: rejections.length, allSameMerchant };
  }, [rejections]);

  if (!open || !product) return null;

  const handleActionClick = (key) => {
    setPendingAction(key);
    setPickedRail(null);
  };

  const handleRailPick = (rail) => {
    setPickedRail(rail);
  };

  const handleConfirm = () => {
    const def = ACTION_DEFS[pendingAction];
    const msg = def.needsRail
      ? def.successMessage(merchantGroup, pickedRail)
      : def.successMessage(merchantGroup);
    setToast(msg);
    const resolvedKey = pendingAction === 'manualRetry' ? `manualRetry:${pickedRail}` : pendingAction;
    setResolved(prev => new Set(prev).add(resolvedKey));
    setPendingAction(null);
    setPickedRail(null);
  };

  const handleCancel = () => {
    setPendingAction(null);
    setPickedRail(null);
  };

  const sampleRejection = rejections[0];
  const attemptedRails = sampleRejection?.fallbackAttempts?.flatMap(a =>
    a.rail === 'fednow_or_rtp' ? ['fednow', 'rtp'] : [a.rail]
  ) || [];

  // Determine view
  const showRailPicker = pendingAction === 'manualRetry' && !pickedRail;
  const showConfirm = pendingAction && (!ACTION_DEFS[pendingAction].needsRail || pickedRail);

  return (
    <>
      <div className="rm-overlay" onClick={onClose} role="presentation" />
      <div className="rm-drawer" role="dialog" aria-modal="true" aria-labelledby="rm-title">
        <header className="rm-header">
          <div>
            <h2 id="rm-title" className="rm-title">Review &amp; Resolve Rejections</h2>
            <p className="rm-sub">
              {rejections.length} rejection{rejections.length === 1 ? '' : 's'} · {product.name} ·
              <span className="rm-reason"> {merchantGroup.reasonCode} {merchantGroup.reason}</span>
            </p>
          </div>
          <button className="rm-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        {merchantGroup.allSameMerchant && (
          <div className="rm-insight">
            <span className="rm-insight-glyph">💡</span>
            <div>
              <strong>All {merchantGroup.count} rejections belong to {merchantGroup.merchant}.</strong>
              {' '}Recipient account at {rejections[0].recipientBank} (ending in {merchantGroup.recipientTail}) was closed.
              Likely a stale destination — {merchantGroup.reasonCode} typically requires merchant action.
            </div>
          </div>
        )}

        <FallbackChainPanel product={product} sample={sampleRejection} />

        <div className="rm-summary-strip">
          <div className="rm-summary-item">
            <div className="rm-summary-label">Total exposure</div>
            <div className="rm-summary-value">{fmtUSDPrecise(merchantGroup.total)}</div>
          </div>
          <div className="rm-summary-item">
            <div className="rm-summary-label">Originated via</div>
            <div className="rm-summary-value">{merchantGroup.rail}</div>
          </div>
          <div className="rm-summary-item">
            <div className="rm-summary-label">Returned to</div>
            <div className="rm-summary-value">acct ···{merchantGroup.senderTail}</div>
          </div>
        </div>

        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th>Rejected at</th>
                <th>Instruction ID</th>
                <th>Recipient</th>
                <th className="rm-num">Amount</th>
                <th>Rail</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rejections.map(r => (
                <tr key={r.id}>
                  <td>{r.scheduledAt}</td>
                  <td className="rm-mono">{r.id.slice(0, 18)}…</td>
                  <td>
                    <div>{r.recipientName}</div>
                    <div className="rm-cell-meta">{r.recipientBank} ···{r.recipientAccountTail}</div>
                  </td>
                  <td className="rm-num">{fmtUSDPrecise(r.amount)}</td>
                  <td>{r.paymentMethod}</td>
                  <td><span className="rm-reason-tag">{r.reasonCode}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showRailPicker && (
          <RailPicker
            rails={manualRetryRails(product)}
            attemptedRailKeys={attemptedRails}
            onPick={handleRailPick}
            onCancel={handleCancel}
          />
        )}

        {showConfirm && (
          <ActionConfirm
            action={pendingAction}
            group={merchantGroup}
            product={product}
            rail={pickedRail}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}

        {!pendingAction && (
          <div className="rm-actions">
            <div className="rm-actions-label">Operator actions</div>
            <div className="rm-actions-grid">
              {Object.entries(ACTION_DEFS).map(([key, def]) => {
                const wasResolved = key === 'manualRetry'
                  ? Array.from(resolved).some(r => r.startsWith('manualRetry:'))
                  : resolved.has(key);
                const desc = def.needsRail
                  ? def.shortDesc(merchantGroup, product)
                  : def.description(merchantGroup, product);
                return (
                  <button
                    key={key}
                    className={`rm-action-btn ${wasResolved ? 'rm-action-resolved' : ''}`}
                    onClick={() => handleActionClick(key)}
                  >
                    <span className="rm-action-icon">{wasResolved ? '✓' : def.icon}</span>
                    <div className="rm-action-text">
                      <div className="rm-action-label">{def.label}</div>
                      <div className="rm-action-desc">{desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      </div>
    </>
  );
}
