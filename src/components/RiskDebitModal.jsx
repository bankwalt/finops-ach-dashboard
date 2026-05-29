import { useEffect, useState } from 'react';

function fmtUSDPrecise(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

const ACTION_DEFS = {
  hold: {
    label: 'Hold debit',
    icon: '⏸',
    description: (d) => `Stop this debit from processing. ${fmtUSDPrecise(d.amount)} will not be debited from ${d.account} at ${d.scheduledFor}. Originator will need to reschedule manually.`,
    successMessage: (d) => `Debit held — ${d.account} will not be debited at ${d.scheduledFor}. Originator notified.`,
  },
  notify: {
    label: 'Notify account holder',
    icon: '✉',
    description: (d) => `Send proactive email + SMS to ${d.account} warning that ${fmtUSDPrecise(d.amount)} will debit at ${d.scheduledFor}. Gives them time to fund the account.`,
    successMessage: (d) => `Notification sent to ${d.account} — email + SMS dispatched.`,
  },
  reschedule: {
    label: 'Switch to slower rail',
    icon: '↻',
    description: (d) => `Move this debit from ${d.paymentMethod} to standard next-day ACH. Reduces same-day risk; settlement shifts to T+1.`,
    successMessage: (d) => `Debit re-scheduled — ${d.account} will now process via standard ACH (T+1).`,
  },
  escalate: {
    label: 'Escalate to vendor',
    icon: '↗',
    description: (d) => `Open a ticket with First Internet Bank to manually review ${d.account}'s account status before this ${fmtUSDPrecise(d.amount)} debit processes.`,
    successMessage: () => 'Ticket #INC-78463 opened with First Internet Bank — vendor SLA: 4 hours.',
  },
};

const RISK_REASON_DETAIL = {
  'R01-history':  { title: 'Prior R01 returns',         body: 'Account has had 3+ R01 (Insufficient Funds) returns in the last 90 days.' },
  'new-rtn':      { title: 'New routing number',        body: 'This is the first debit attempted against this RTN. No prior signal.' },
  'nsf-history':  { title: 'NSF history',                body: 'Account has had 2 of last 5 debits returned for insufficient funds.' },
  'fraud-flag':   { title: 'Fraud signal',               body: 'Account flagged by transaction monitoring (TaktTile).' },
  'r02-warning':  { title: 'R02 warning',                body: 'Account holder bank notified us last week that this account may be closing soon.' },
};

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

function ActionConfirm({ action, debit, onConfirm, onCancel }) {
  const def = ACTION_DEFS[action];
  return (
    <div className="rm-confirm">
      <div className="rm-confirm-icon">{def.icon}</div>
      <div className="rm-confirm-body">
        <h4 className="rm-confirm-title">{def.label}?</h4>
        <p className="rm-confirm-desc">{def.description(debit)}</p>
        <div className="rm-confirm-actions">
          <button className="rm-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="rm-btn-primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function RiskDebitModal({ open, debit, onClose }) {
  const [pendingAction, setPendingAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [resolved, setResolved] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setPendingAction(null);
      setToast(null);
      setResolved(new Set());
    }
  }, [open]);

  if (!open || !debit) return null;

  const reasonDetail = RISK_REASON_DETAIL[debit.reasonCode] || { title: debit.reason, body: '' };

  const handleConfirm = () => {
    const def = ACTION_DEFS[pendingAction];
    setToast(def.successMessage(debit));
    setResolved(prev => new Set(prev).add(pendingAction));
    setPendingAction(null);
  };

  return (
    <>
      <div className="rm-overlay" onClick={onClose} role="presentation" />
      <div className="rm-drawer" role="dialog" aria-modal="true" aria-labelledby="rdm-title">
        <header className="rm-header">
          <div>
            <h2 id="rdm-title" className="rm-title">Risk Debit Review</h2>
            <p className="rm-sub">
              {debit.product} · {debit.paymentMethod} ·
              <span className={`rm-reason rdm-sev-${debit.severity}`}>
                {' '}{debit.severity === 'high' ? '⚠ High severity' : '· Medium severity'}
              </span>
            </p>
          </div>
          <button className="rm-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="rm-insight">
          <span className="rm-insight-glyph">💡</span>
          <div>
            <strong>{reasonDetail.title}.</strong>{' '}
            {reasonDetail.body} Acting now (before {debit.scheduledFor}) prevents a return and keeps the originator's send-rate clean.
          </div>
        </div>

        <div className="rm-summary-strip">
          <div className="rm-summary-item">
            <div className="rm-summary-label">Amount</div>
            <div className="rm-summary-value">{fmtUSDPrecise(debit.amount)}</div>
          </div>
          <div className="rm-summary-item">
            <div className="rm-summary-label">Account</div>
            <div className="rm-summary-value">···{debit.accountTail}</div>
          </div>
          <div className="rm-summary-item">
            <div className="rm-summary-label">Scheduled</div>
            <div className="rm-summary-value">{debit.scheduledFor}</div>
          </div>
        </div>

        <div className="rdm-detail">
          <div className="rdm-detail-label">Account holder</div>
          <div className="rdm-detail-value">{debit.account}</div>
          <div className="rdm-detail-label">Product</div>
          <div className="rdm-detail-value">{debit.product}</div>
          <div className="rdm-detail-label">Payment method</div>
          <div className="rdm-detail-value">{debit.paymentMethod}</div>
          <div className="rdm-detail-label">Risk reason</div>
          <div className="rdm-detail-value">{debit.reason}</div>
        </div>

        {pendingAction ? (
          <ActionConfirm
            action={pendingAction}
            debit={debit}
            onConfirm={handleConfirm}
            onCancel={() => setPendingAction(null)}
          />
        ) : (
          <div className="rm-actions">
            <div className="rm-actions-label">Operator actions</div>
            <div className="rm-actions-grid">
              {Object.entries(ACTION_DEFS).map(([key, def]) => {
                const wasResolved = resolved.has(key);
                return (
                  <button
                    key={key}
                    className={`rm-action-btn ${wasResolved ? 'rm-action-resolved' : ''}`}
                    onClick={() => setPendingAction(key)}
                    disabled={wasResolved}
                  >
                    <span className="rm-action-icon">{wasResolved ? '✓' : def.icon}</span>
                    <div className="rm-action-text">
                      <div className="rm-action-label">{def.label}</div>
                      <div className="rm-action-desc">{def.description(debit)}</div>
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
