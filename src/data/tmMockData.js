// Transaction Monitoring Mock Data
// Derived from TakTile CSV structure with enriched context fields

const PARTNERS = [
  { id: 'cb55effa-a899-4250-a30b-04e0cec65d04', name: 'QuickLend Financial' },
  { id: '2dac5e14-040a-4826-bee6-8067e095579e', name: 'PayRight Solutions' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'CashFlow Partners' },
  { id: 'd4e5f6a7-b8c9-0123-4567-890abcdef123', name: 'MerchantPay Corp' },
];

const MERCHANTS = [
  { id: '3b40d6b1-c207-45ee-97ee-913c85e31255', name: 'Sunrise Auto Sales', state: 'CA', businessType: 'AUTO_DEALER', accountAgeDays: 56 },
  { id: 'f8a1b2c3-d4e5-6789-0abc-def123456789', name: 'GreenLeaf Dispensary', state: 'CO', businessType: 'RETAIL', accountAgeDays: 120 },
  { id: 'a2b3c4d5-e6f7-8901-2345-678901abcdef', name: 'Metro Logistics LLC', state: 'TX', businessType: 'TRANSPORTATION', accountAgeDays: 243 },
  { id: 'b3c4d5e6-f7a8-9012-3456-789012bcdef0', name: 'TechWave Solutions', state: 'NY', businessType: 'TECHNOLOGY', accountAgeDays: 365 },
  { id: 'c4d5e6f7-a8b9-0123-4567-890123cdef01', name: 'Harbor Fish Market', state: 'MA', businessType: 'FOOD_SERVICE', accountAgeDays: 89 },
  { id: 'd5e6f7a8-b9c0-1234-5678-901234def012', name: 'Elite Home Services', state: 'FL', businessType: 'HOME_SERVICES', accountAgeDays: 412 },
  { id: 'e6f7a8b9-c0d1-2345-6789-012345ef0123', name: 'Rapid Check Cashing', state: 'NV', businessType: 'FINANCIAL_SERVICES', accountAgeDays: 30 },
  { id: 'f7a8b9c0-d1e2-3456-7890-123456f01234', name: 'Downtown Jewelry Exchange', state: 'NJ', businessType: 'RETAIL', accountAgeDays: 67 },
  { id: '08a9b0c1-d2e3-4567-8901-234567012345', name: 'Pacific Trading Co', state: 'WA', businessType: 'IMPORT_EXPORT', accountAgeDays: 180 },
  { id: '19b0c1d2-e3f4-5678-9012-345678123456', name: 'Valley Medical Supply', state: 'AZ', businessType: 'HEALTHCARE', accountAgeDays: 290 },
  { id: '2a0c1d2e-f3a4-6789-0123-456789234567', name: 'Express Money Transfer', state: 'IL', businessType: 'MONEY_SERVICES', accountAgeDays: 15 },
  { id: '3b1d2e3f-a4b5-7890-1234-567890345678', name: 'Golden State Realty', state: 'CA', businessType: 'REAL_ESTATE', accountAgeDays: 520 },
  { id: '4c2e3f4a-b5c6-8901-2345-678901456789', name: 'BlueSky Aviation', state: 'TX', businessType: 'AVIATION', accountAgeDays: 145 },
  { id: '5d3f4a5b-c6d7-9012-3456-789012567890', name: 'Cornerstone Construction', state: 'OH', businessType: 'CONSTRUCTION', accountAgeDays: 330 },
  { id: '6e4a5b6c-d7e8-0123-4567-890123678901', name: 'NightOwl Entertainment', state: 'NV', businessType: 'ENTERTAINMENT', accountAgeDays: 75 },
];

const USE_CASES = ['loan_funding', 'withholding', 'instant_payouts', 'managed_settlements'];
const USE_CASE_LABELS = {
  loan_funding: 'Loan Funding',
  withholding: 'Withholding',
  instant_payouts: 'Instant Payouts',
  managed_settlements: 'Managed Settlements',
};

const NETWORKS = ['ACH', 'FEDNOW', 'RTP'];
const DIRECTIONS = ['CREDIT', 'DEBIT'];
const TRANSACTION_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT'];
const AMOUNT_TIERS = ['SMALL', 'MEDIUM', 'LARGE', 'VERY_LARGE'];
const LOAN_TYPES = ['BNPL', 'WORKING_CAPITAL', 'TERM_LOAN', ''];
const OWNER_TYPES = ['INTERNAL', 'BANKING_CUSTOMER'];

// TakTile rules version history — maps to response__metadata__version and traffic_policy_name from CSV
const TAKTILE_VERSIONS = [
  { version: 'v1.3', policyName: 'Policy 4', effectiveDate: '2026-03-15', rules: 7 },
  { version: 'v1.2', policyName: 'Policy 3', effectiveDate: '2026-02-20', rules: 6 },
  { version: 'v1.1', policyName: 'Policy 2', effectiveDate: '2026-02-10', rules: 5 },
  { version: 'v1.0', policyName: 'Policy 1', effectiveDate: '2026-02-01', rules: 4 },
];

const TRIGGERED_CONDITIONS = [
  { rule: 'velocity_exceeded', label: 'Velocity threshold exceeded', description: '5+ transactions in 1 hour' },
  { rule: 'structuring_detected', label: 'Potential structuring', description: 'Multiple transactions just below $10,000' },
  { rule: 'round_number_pattern', label: 'Round number pattern', description: '3+ consecutive round-number transactions' },
  { rule: 'rapid_deposit_payout', label: 'Rapid deposit-to-payout', description: 'Payout within 30 minutes of deposit' },
  { rule: 'new_account_high_volume', label: 'New account high volume', description: 'Account < 30 days with > $50K volume' },
  { rule: 'international_wire_mismatch', label: 'International wire mismatch', description: 'Wire to country not matching merchant profile' },
  { rule: 'weekend_holiday_anomaly', label: 'Weekend/holiday anomaly', description: 'Unusual transaction pattern on non-business days' },
  { rule: 'routing_not_whitelisted', label: 'Routing not whitelisted', description: 'Transaction to non-whitelisted routing number' },
  { rule: 'amount_deviation', label: 'Amount deviation', description: 'Transaction amount 3x above merchant average' },
  { rule: 'geographic_anomaly', label: 'Geographic anomaly', description: 'Transaction origin inconsistent with merchant location' },
];

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function getTaktileVersion(timestamp) {
  const ts = new Date(timestamp);
  for (const v of TAKTILE_VERSIONS) {
    if (ts >= new Date(v.effectiveDate)) return v;
  }
  return TAKTILE_VERSIONS[TAKTILE_VERSIONS.length - 1];
}

function generateAlert(index, daysAgo, severity) {
  const partner = randomItem(PARTNERS);
  const merchant = randomItem(MERCHANTS);
  const useCase = randomItem(USE_CASES);
  const network = Math.random() < 0.85 ? 'ACH' : randomItem(['FEDNOW', 'RTP']);
  const direction = Math.random() < 0.7 ? 'CREDIT' : 'DEBIT';
  const transactionType = direction === 'CREDIT' ? 'DEPOSIT' : randomItem(['WITHDRAWAL', 'PAYMENT']);

  const now = new Date();
  const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000);
  const processingTimestamp = new Date(timestamp.getTime() + Math.random() * 60 * 60 * 1000);
  const taktileVersion = getTaktileVersion(timestamp);

  let amount, amountTier;
  if (severity === 'CRITICAL') {
    amount = randomAmount(25000, 100000);
    amountTier = Math.random() < 0.5 ? 'VERY_LARGE' : 'LARGE';
  } else if (severity === 'HIGH') {
    amount = randomAmount(8000, 30000);
    amountTier = randomItem(['LARGE', 'MEDIUM']);
  } else if (severity === 'MEDIUM') {
    amount = randomAmount(2000, 12000);
    amountTier = randomItem(['MEDIUM', 'SMALL']);
  } else {
    amount = randomAmount(50, 5000);
    amountTier = 'SMALL';
  }
  if (direction === 'DEBIT') amount = -Math.abs(amount);

  const velocityRiskScore = severity === 'CRITICAL' ? Math.floor(70 + Math.random() * 30) :
    severity === 'HIGH' ? Math.floor(40 + Math.random() * 35) :
    severity === 'MEDIUM' ? Math.floor(15 + Math.random() * 30) :
    Math.floor(Math.random() * 15);

  let conditions = [];
  if (severity === 'CRITICAL') {
    conditions = [TRIGGERED_CONDITIONS[0], TRIGGERED_CONDITIONS[1], randomItem(TRIGGERED_CONDITIONS.slice(2))];
  } else if (severity === 'HIGH') {
    conditions = [randomItem(TRIGGERED_CONDITIONS), randomItem(TRIGGERED_CONDITIONS.slice(3))];
  } else if (severity === 'MEDIUM') {
    conditions = [randomItem(TRIGGERED_CONDITIONS)];
  }
  conditions = [...new Map(conditions.map(c => [c.rule, c])).values()];

  // Determine status based on age + severity
  let status, outcome, analystNotes, updatedBy, updatedAt, uarRequired;
  if (daysAgo > 5 || (daysAgo > 2 && severity === 'LOW')) {
    const outcomes = severity === 'CRITICAL'
      ? ['ESCALATED', 'ESCALATED', 'CONTACTED']
      : severity === 'HIGH'
      ? ['ESCALATED', 'CONTACTED', 'CLEARED']
      : ['CLEARED', 'CLEARED', 'CONTACTED', 'CLEARED'];
    status = randomItem(outcomes);
    outcome = status;
    analystNotes = status === 'CLEARED' ? 'Reviewed transaction pattern. No suspicious activity identified.'
      : status === 'CONTACTED' ? 'Contacted merchant regarding transaction pattern. Awaiting response.'
      : 'Escalated to bank sponsor. UAR generated and submitted.';
    updatedBy = randomItem(['sarah.chen@jaris.io', 'mike.rodriguez@jaris.io', 'anna.kim@jaris.io']);
    updatedAt = new Date(timestamp.getTime() + (severity === 'CRITICAL' ? 2 : severity === 'HIGH' ? 12 : 48) * 60 * 60 * 1000).toISOString();
    uarRequired = status === 'ESCALATED';
  } else {
    status = 'PENDING_REVIEW';
    outcome = null;
    analystNotes = '';
    updatedBy = null;
    updatedAt = null;
    uarRequired = false;
  }

  const isRoundNumber = Math.abs(amount) % 1000 === 0 || Math.abs(amount) % 500 === 0;
  const isStructuringRange = Math.abs(amount) >= 8000 && Math.abs(amount) <= 9999;
  const loanId = useCase === 'loan_funding' ? uuid() : '';
  const loanType = useCase === 'loan_funding' ? randomItem(LOAN_TYPES.filter(l => l)) : '';

  return {
    decisionId: uuid(),
    transactionId: uuid(),
    amount,
    direction,
    network,
    transactionType,
    accountOwnerType: randomItem(OWNER_TYPES),
    partnerId: partner.id,
    partnerName: partner.name,
    merchantId: merchant.id,
    merchantName: merchant.name,
    merchantState: merchant.state,
    merchantBusinessType: merchant.businessType,
    merchantAccountAgeDays: merchant.accountAgeDays,
    merchantAddressStates: merchant.state,
    routingNumber: randomItem(['322271627', '121142119', '021000021', '071000013', '111000025']),
    bankName: randomItem(['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'US Bank']),
    sourceSystem: 'FINXACT',
    timestamp: timestamp.toISOString(),
    processingTimestamp: processingTimestamp.toISOString(),
    lastDepositTimestamp: new Date(timestamp.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
    amountTier,
    velocityRiskScore,
    isStructuringRange,
    isRoundNumber,
    consecutiveRoundCount: isRoundNumber ? Math.floor(Math.random() * 5) + 1 : 0,
    depositToPayoutMinutes: severity !== 'LOW' ? Math.floor(Math.random() * 120) : Math.floor(Math.random() * 1440),
    routingWhitelistStatus: severity === 'LOW' ? 'WHITELISTED' : randomItem(['WHITELISTED', 'NOT_WHITELISTED', 'UNKNOWN']),
    weekendHolidayFlag: Math.random() < 0.15,
    internationalFlag: severity !== 'LOW' && Math.random() < 0.2,
    wireTransferFlag: Math.random() < 0.1,
    triggeredConditions: conditions,
    accountBalance: randomAmount(500, 500000),
    transactionCountry: Math.random() < 0.9 ? 'US' : randomItem(['MX', 'CA', 'GB', 'CN']),
    accountNumberHash: uuid(),
    paymentPeriodDays: Math.floor(Math.random() * 30) + 1,
    scheduledPaymentFlag: Math.random() < 0.3,
    merchantTimezone: randomItem(['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']),
    loanId,
    loanType,
    useCase,
    useCaseLabel: USE_CASE_LABELS[useCase],
    severity,
    status,
    outcome,
    analystNotes,
    uarRequired,
    updatedBy,
    updatedAt,
    previousAlertCount: Math.floor(Math.random() * (severity === 'CRITICAL' ? 8 : severity === 'HIGH' ? 5 : 2)),
    taktileDecisionUrl: `https://app.taktile.com/decide/display/decision?workspace_id=98fa3b3d-3bbb-450c-8a95-ec761dc2cf9c&flow_slug=transaction-monitoring&version_id=883a9df3-5b7c-42d5-bea6-5958cadb840f&decision_id=`,
    // TakTile metadata (from response__metadata in CSV)
    taktileVersion: taktileVersion.version,
    taktilePolicyName: taktileVersion.policyName,
    taktileRuleCount: taktileVersion.rules,
    taktileFlowSlug: 'transaction-monitoring',
    taktileStatusCode: 200,
    taktileResponseType: 'successful',
  };
}

// Generate ~120 alerts from Feb 1 to today (59 days), distribution: 50% LOW, 25% MEDIUM, 15% HIGH, 10% CRITICAL
const SEVERITY_DISTRIBUTION = [
  ...Array(60).fill('LOW'),
  ...Array(30).fill('MEDIUM'),
  ...Array(18).fill('HIGH'),
  ...Array(12).fill('CRITICAL'),
];

// Feb 1 2026 to today = ~59 days
const DATE_RANGE_DAYS = Math.ceil((new Date() - new Date('2026-02-01')) / (24 * 60 * 60 * 1000));

export const MOCK_TM_ALERTS = SEVERITY_DISTRIBUTION.map((severity, i) => {
  const daysAgo = Math.random() * DATE_RANGE_DAYS;
  const alert = generateAlert(i, daysAgo, severity);
  alert.taktileDecisionUrl += alert.decisionId;
  return alert;
}).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

export const MOCK_TM_SUMMARY = {
  total: MOCK_TM_ALERTS.length,
  bySeverity: {
    LOW: MOCK_TM_ALERTS.filter(a => a.severity === 'LOW').length,
    MEDIUM: MOCK_TM_ALERTS.filter(a => a.severity === 'MEDIUM').length,
    HIGH: MOCK_TM_ALERTS.filter(a => a.severity === 'HIGH').length,
    CRITICAL: MOCK_TM_ALERTS.filter(a => a.severity === 'CRITICAL').length,
  },
  pendingReview: MOCK_TM_ALERTS.filter(a => a.status === 'PENDING_REVIEW').length,
  uarsGenerated: MOCK_TM_ALERTS.filter(a => a.uarRequired).length,
  byStatus: {
    PENDING_REVIEW: MOCK_TM_ALERTS.filter(a => a.status === 'PENDING_REVIEW').length,
    CLEARED: MOCK_TM_ALERTS.filter(a => a.status === 'CLEARED').length,
    CONTACTED: MOCK_TM_ALERTS.filter(a => a.status === 'CONTACTED').length,
    ESCALATED: MOCK_TM_ALERTS.filter(a => a.status === 'ESCALATED').length,
  },
};

export const USE_CASE_LABELS_MAP = USE_CASE_LABELS;
export { TAKTILE_VERSIONS };

export const SEVERITY_CONFIG = {
  LOW: { label: 'Low', color: '#3b82f6', slaHours: 168 },
  MEDIUM: { label: 'Medium', color: '#f59e0b', slaHours: 72 },
  HIGH: { label: 'High', color: '#f97316', slaHours: 24 },
  CRITICAL: { label: 'Critical', color: '#ef4444', slaHours: 4 },
};
