import { useEffect, useImperativeHandle, useState } from 'react';
import { buildBankActivity } from '../data/dailyProcessingMockData';
import RiskDebitModal from './RiskDebitModal';

function fmtUSD(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function fmtUSDPrecise(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function SectionHeader({ title, subtitle, summary }) {
  return (
    <header className="dp-section-header">
      <div>
        <h2 className="dp-section-title">{title}</h2>
        {subtitle && <p className="dp-section-sub">{subtitle}</p>}
      </div>
      <div className="dp-section-header-right">
        {summary}
      </div>
    </header>
  );
}

function RiskDebitsSection({ data, onReviewDebit }) {
  const totals = data.riskTotals;
  return (
    <section className="dp-section">
      <SectionHeader
        title="Risk Debits — Today"
        subtitle="Debits scheduled today that are likely to return or bounce based on prior signals"
        summary={
          <div className="dp-totals">
            <span className="dp-total-pill dp-total-pill-error">{fmtUSD(totals.amount)} at risk</span>
            <span className="dp-total-amount">{totals.count} transactions</span>
            {totals.highCount > 0 && (
              <span className="dp-total-pill dp-total-pill-error">{totals.highCount} high severity</span>
            )}
          </div>
        }
      />
      <div className="dp-table-wrap">
        <table className="dp-file-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Account</th>
              <th>Product · Method</th>
              <th>Scheduled</th>
              <th className="dp-num">Amount</th>
              <th>Risk reason</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.riskDebits.map(d => (
              <tr key={d.id}>
                <td>
                  <span className={`dp-risk-sev dp-risk-sev-${d.severity}`}>
                    {d.severity === 'high' ? '⚠ High' : '· Medium'}
                  </span>
                </td>
                <td>
                  <div>{d.account}</div>
                  <div className="dp-cell-meta">acct ···{d.accountTail}</div>
                </td>
                <td>
                  <div>{d.product}</div>
                  <div className="dp-cell-meta">{d.paymentMethod}</div>
                </td>
                <td className="dp-cell-time">{d.scheduledFor}</td>
                <td className="dp-num">{fmtUSDPrecise(d.amount)}</td>
                <td>
                  <span className="dp-risk-reason">{d.reason}</span>
                </td>
                <td>
                  <button className="dp-row-action-btn" onClick={() => onReviewDebit?.(d)}>
                    Review &amp; act →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlaceholderSection({ title, body }) {
  return (
    <section className="dp-section">
      <SectionHeader title={title} />
      <div className="dp-empty">{body}</div>
    </section>
  );
}

export default function ACHCompliance({ refreshRef }) {
  const [snapshot, setSnapshot] = useState(() => ({
    bankActivity: buildBankActivity(),
    asOf: new Date(),
  }));
  const [riskDebit, setRiskDebit] = useState(null);

  const refresh = () => {
    setSnapshot({ bankActivity: buildBankActivity(), asOf: new Date() });
  };

  useImperativeHandle(refreshRef, () => refresh, []);

  return (
    <div className="dp-root">
      <RiskDebitsSection data={snapshot.bankActivity} onReviewDebit={setRiskDebit} />

      <PlaceholderSection
        title="Returns &amp; NOCs"
        body="ACH returns and Notification of Change queue. Coming soon."
      />
      <PlaceholderSection
        title="Transaction Monitoring"
        body="TaktTile alert queue, UAR / SAR generation. Coming soon."
      />
      <PlaceholderSection
        title="Open Exceptions"
        body="ACH debit exceptions requiring decisioning (PAY / RETURN). Coming soon."
      />

      <RiskDebitModal
        open={!!riskDebit}
        debit={riskDebit}
        onClose={() => setRiskDebit(null)}
      />
    </div>
  );
}
