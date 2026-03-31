import { useState } from 'react';
import { useTM } from '../context/TMContext';
import { generateUARDocument } from '../utils/uarGenerator';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function TMUARForm({ alert }) {
  const { closeUARForm } = useTM();

  const triggeredLabels = alert.triggeredConditions.map(c => c.label).join('; ') || 'None';

  const defaultNarrative = `On ${formatDate(alert.timestamp)}, Jaris compliance identified questionable activity involving ${alert.merchantName} (${alert.merchantBusinessType}, ${alert.merchantState}). ` +
    `A ${alert.direction.toLowerCase()} transaction of ${formatCurrency(alert.amount)} was processed via ${alert.network} and flagged at ${alert.severity} severity. ` +
    (alert.triggeredConditions.length > 0
      ? `The following risk conditions were triggered: ${triggeredLabels}. `
      : '') +
    `The velocity risk score was ${alert.velocityRiskScore}. ` +
    (alert.previousAlertCount > 0
      ? `This merchant has ${alert.previousAlertCount} previous alert(s) on file. `
      : 'This is the first alert for this merchant. ') +
    `This activity has been escalated per Jaris BSA/AML compliance procedures for review and potential SAR filing consideration.`;

  const [form, setForm] = useState({
    merchantName: alert.merchantName,
    referralDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    partnerName: alert.partnerName,
    useCase: alert.useCaseLabel,
    completedBy: '',
    contactEmail: '',
    merchantId: alert.merchantId,
    accountId: alert.accountNumberHash || '',
    businessAddress: `${alert.merchantState}, US`,
    ein: '**-***',
    beneficialOwnerName: '',
    beneficialOwnerAddress: '',
    beneficialOwnerDOB: '',
    beneficialOwnerSSN: '***-**-',
    phone: '',
    email: '',
    activityDateRange: formatDate(alert.timestamp),
    detectionDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    dollarAmount: formatCurrency(alert.amount),
    transactionId: alert.transactionId,
    decisionId: alert.decisionId,
    severity: alert.severity,
    network: alert.network,
    triggeredConditions: triggeredLabels,
    velocityRiskScore: alert.velocityRiskScore,
    description: `${alert.severity} severity alert - ${alert.transactionType} via ${alert.network}`,
    narrative: defaultNarrative,
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleGenerate = () => {
    generateUARDocument(form);
  };

  return (
    <div className="tm-uar-overlay" onClick={e => e.target === e.currentTarget && closeUARForm()}>
      <div className="tm-uar-modal">
        <div className="tm-uar-header">
          <h2 className="tm-uar-title">QAR Referral Form</h2>
          <button className="tm-uar-close" onClick={closeUARForm}>&times;</button>
        </div>

        <div className="tm-uar-body">
          {/* QAR Details */}
          <fieldset className="tm-uar-section">
            <legend>QAR Details</legend>
            <div className="tm-uar-grid">
              <Field label="Merchant Name" value={form.merchantName} onChange={v => update('merchantName', v)} />
              <Field label="Referral Date" value={form.referralDate} onChange={v => update('referralDate', v)} />
              <Field label="Partner Platform" value={form.partnerName} onChange={v => update('partnerName', v)} />
              <Field label="Product" value={form.useCase} onChange={v => update('useCase', v)} />
              <Field label="Completed By" value={form.completedBy} onChange={v => update('completedBy', v)} placeholder="Your name" />
              <Field label="Contact Email" value={form.contactEmail} onChange={v => update('contactEmail', v)} placeholder="your.email@jaris.io" />
            </div>
          </fieldset>

          {/* Business Details */}
          <fieldset className="tm-uar-section">
            <legend>Business Details</legend>
            <div className="tm-uar-grid">
              <Field label="Customer ID" value={form.merchantId} onChange={v => update('merchantId', v)} />
              <Field label="Account ID" value={form.accountId} onChange={v => update('accountId', v)} />
              <Field label="Business Name" value={form.merchantName} readOnly />
              <Field label="Business Address" value={form.businessAddress} onChange={v => update('businessAddress', v)} />
              <Field label="Business EIN" value={form.ein} onChange={v => update('ein', v)} />
            </div>
          </fieldset>

          {/* Beneficial Owner */}
          <fieldset className="tm-uar-section">
            <legend>Beneficial Owner(s) Details</legend>
            <p className="tm-uar-hint">Complete manually with verified information</p>
            <div className="tm-uar-grid">
              <Field label="Name" value={form.beneficialOwnerName} onChange={v => update('beneficialOwnerName', v)} />
              <Field label="Address" value={form.beneficialOwnerAddress} onChange={v => update('beneficialOwnerAddress', v)} />
              <Field label="DOB" value={form.beneficialOwnerDOB} onChange={v => update('beneficialOwnerDOB', v)} />
              <Field label="SSN" value={form.beneficialOwnerSSN} onChange={v => update('beneficialOwnerSSN', v)} />
              <Field label="Phone" value={form.phone} onChange={v => update('phone', v)} />
              <Field label="Email" value={form.email} onChange={v => update('email', v)} />
            </div>
          </fieldset>

          {/* Activity Details */}
          <fieldset className="tm-uar-section">
            <legend>Details of Questionable Activity</legend>
            <div className="tm-uar-grid">
              <Field label="Date / Range" value={form.activityDateRange} onChange={v => update('activityDateRange', v)} />
              <Field label="Detection Date" value={form.detectionDate} readOnly />
              <Field label="Dollar Amount" value={form.dollarAmount} readOnly />
              <Field label="Transaction ID" value={form.transactionId} readOnly mono />
              <Field label="Decision ID" value={form.decisionId} readOnly mono />
              <Field label="Severity" value={form.severity} readOnly />
              <Field label="Network" value={form.network} readOnly />
              <Field label="Risk Score" value={String(form.velocityRiskScore)} readOnly />
            </div>
            <div className="tm-uar-field-full">
              <label className="tm-uar-label">Triggered Conditions</label>
              <input className="tm-uar-input" value={form.triggeredConditions} readOnly />
            </div>
            <div className="tm-uar-field-full">
              <label className="tm-uar-label">Description</label>
              <input className="tm-uar-input" value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
          </fieldset>

          {/* Narrative */}
          <fieldset className="tm-uar-section">
            <legend>Questionable Activity Summary</legend>
            <textarea
              className="tm-uar-narrative"
              value={form.narrative}
              onChange={e => update('narrative', e.target.value)}
              rows={8}
            />
          </fieldset>
        </div>

        <div className="tm-uar-footer">
          <button className="tm-btn tm-btn-cancel" onClick={closeUARForm}>Cancel</button>
          <button className="tm-btn tm-btn-escalate" onClick={handleGenerate}>
            Generate QAR Document
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, readOnly, placeholder, mono }) {
  return (
    <div className="tm-uar-field">
      <label className="tm-uar-label">{label}</label>
      <input
        className={`tm-uar-input ${mono ? 'tm-mono' : ''} ${readOnly ? 'tm-uar-readonly' : ''}`}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
      />
    </div>
  );
}
