// ===== Exception Queue Mock Data =====

function todayAt(hour, minute, second = 0) {
  const d = new Date();
  d.setHours(hour, minute, second, 0);
  return d.toISOString();
}

function daysAgo(days, hour, minute, second = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, second, 0);
  return d.toISOString();
}

function bankingDaysFromNow(days) {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

function bankingDaysFrom(dateStr, days) {
  const d = new Date(dateStr);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

// --- Exception Category Summary ---
export const MOCK_EXCEPTION_SUMMARY = {
  achDebitDecisioning: { total: 12, critical: 2, high: 5, medium: 3, low: 2 },
  vanExceptions:       { total: 4,  critical: 0, high: 1, medium: 2, low: 1 },
  reconExceptions:     { total: 7,  critical: 0, high: 2, medium: 3, low: 2 },
  achProcessingErrors: { total: 3,  critical: 1, high: 1, medium: 1, low: 0 },
  achReturns:          { total: 5,  critical: 0, high: 3, medium: 2, low: 0 },
  rtpFedNowExceptions: { total: 2,  critical: 0, high: 1, medium: 1, low: 0 },
  payoutExceptions:    { total: 3,  critical: 0, high: 1, medium: 1, low: 1 },
  infraAlerts:         { total: 1,  critical: 1, high: 0, medium: 0, low: 0 },
};

export const EXCEPTION_CATEGORY_LABELS = {
  achDebitDecisioning: 'ACH Debit Decisioning',
  vanExceptions:       'VAN Exceptions',
  reconExceptions:     'Reconciliation',
  achProcessingErrors: 'ACH Processing Errors',
  achReturns:          'ACH Returns',
  rtpFedNowExceptions: 'RTP / FedNow',
  payoutExceptions:    'Payout Exceptions',
  infraAlerts:         'Infrastructure Alerts',
};

// --- ACH Return Codes for decisioning ---
export const ACH_RETURN_CODES = [
  { code: 'R01', label: 'Insufficient Funds' },
  { code: 'R02', label: 'Account Closed' },
  { code: 'R04', label: 'Invalid Account Number' },
  { code: 'R10', label: 'Customer Advises Unauthorized' },
  { code: 'R13', label: 'Invalid ACH Routing Number' },
  { code: 'R16', label: 'Account Frozen' },
  { code: 'R17', label: 'File Record Edit Criteria / Duplicate' },
  { code: 'R20', label: 'Non-Transaction Account' },
  { code: 'R29', label: 'Corporate Customer Not Authorized' },
];

// --- Transaction code labels ---
export const TXN_CODE_LABELS = {
  27: 'Checking Debit',
  28: 'Checking Debit Prenote',
  37: 'Savings Debit',
  38: 'Savings Debit Prenote',
};

// --- ACH Debit Decisioning Queue (12 items) ---
export const MOCK_ACH_DEBIT_QUEUE = [
  // CRITICAL: Insufficient funds, deadline imminent
  {
    id: 'EXC-DD-001',
    sourceFileName: 'ACH20260308_B1.txt',
    batchWindow: '7:00 AM',
    receivedAt: daysAgo(2, 7, 2),
    effectiveDate: daysAgo(2, 7, 0),
    returnDeadline: bankingDaysFrom(daysAgo(2, 7, 0), 2),
    traceNumber: '071000010000004',
    originatorCompanyName: 'RIVERSIDE MORTGAGE',
    originatorCompanyId: '9876543210',
    secCode: 'PPD',
    entryDescription: 'MORTGAGE',
    amount: 3200.00,
    transactionCode: 27,
    receivingVAN: 'VAN-8832-001',
    receivingAccountId: 'ACCT-FX-8832',
    receivingAccountName: 'JOHNSON, MICHAEL',
    availableBalance: 1450.00,
    pendingCredits: 800.00,
    shortfall: 950.00,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-8833', type: 'Savings', balance: 8200.00 },
      { accountId: 'ACCT-FX-8834', type: 'Money Market', balance: 15400.00 },
    ],
    priority: 'critical',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
  // CRITICAL: Large debit, no offset accounts
  {
    id: 'EXC-DD-002',
    sourceFileName: 'ACH20260309_B2.txt',
    batchWindow: '10:00 AM',
    receivedAt: daysAgo(1, 10, 1),
    effectiveDate: daysAgo(1, 10, 0),
    returnDeadline: bankingDaysFrom(daysAgo(1, 10, 0), 2),
    traceNumber: '071000020000006',
    originatorCompanyName: 'FIRST NATIONAL LENDING',
    originatorCompanyId: '5551234567',
    secCode: 'WEB',
    entryDescription: 'LOAN PMT',
    amount: 12500.00,
    transactionCode: 27,
    receivingVAN: 'VAN-9902-001',
    receivingAccountId: 'ACCT-FX-9902',
    receivingAccountName: 'GARCIA, ROBERTO',
    availableBalance: 3200.00,
    pendingCredits: 0,
    shortfall: 9300.00,
    customerOtherAccounts: [],
    priority: 'critical',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
  // HIGH: Shortfall but offset available
  {
    id: 'EXC-DD-003',
    sourceFileName: 'ACH20260310_B1.txt',
    batchWindow: '7:00 AM',
    receivedAt: todayAt(7, 2),
    effectiveDate: todayAt(7, 0),
    returnDeadline: bankingDaysFrom(todayAt(7, 0), 2),
    traceNumber: '071000010000010',
    originatorCompanyName: 'PAYSERV BENEFITS',
    originatorCompanyId: '3334567890',
    secCode: 'PPD',
    entryDescription: 'INSURANCE',
    amount: 2400.00,
    transactionCode: 27,
    receivingVAN: 'VAN-8832-002',
    receivingAccountId: 'ACCT-FX-8832',
    receivingAccountName: 'JOHNSON, MICHAEL',
    availableBalance: 1450.00,
    pendingCredits: 500.00,
    shortfall: 450.00,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-8833', type: 'Savings', balance: 8200.00 },
      { accountId: 'ACCT-FX-8834', type: 'Money Market', balance: 15400.00 },
    ],
    priority: 'high',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
  // HIGH: Corporate debit, possible unauthorized
  {
    id: 'EXC-DD-004',
    sourceFileName: 'ACH20260310_B1.txt',
    batchWindow: '7:00 AM',
    receivedAt: todayAt(7, 2),
    effectiveDate: todayAt(7, 0),
    returnDeadline: bankingDaysFrom(todayAt(7, 0), 2),
    traceNumber: '071000010000020',
    originatorCompanyName: 'ACME PAYROLL INC',
    originatorCompanyId: '1234567890',
    secCode: 'CCD',
    entryDescription: 'PAYROLL ADJ',
    amount: 5234.10,
    transactionCode: 27,
    receivingVAN: 'VAN-3341-001',
    receivingAccountId: 'ACCT-FX-3341',
    receivingAccountName: 'MARTINEZ, SARAH',
    availableBalance: 8750.00,
    pendingCredits: 0,
    shortfall: 0,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-3342', type: 'Savings', balance: 2100.00 },
    ],
    priority: 'high',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: ['Customer called disputing this debit — verify authorization on file'],
    decisionHistory: [],
  },
  // HIGH: Savings debit, balance tight
  {
    id: 'EXC-DD-005',
    sourceFileName: 'ACH20260310_B2.txt',
    batchWindow: '10:00 AM',
    receivedAt: todayAt(10, 1),
    effectiveDate: todayAt(10, 0),
    returnDeadline: bankingDaysFrom(todayAt(10, 0), 2),
    traceNumber: '071000020000003',
    originatorCompanyName: 'METRO UTILITIES',
    originatorCompanyId: '7778901234',
    secCode: 'PPD',
    entryDescription: 'UTILITIES',
    amount: 892.25,
    transactionCode: 37,
    receivingVAN: 'VAN-7714-001',
    receivingAccountId: 'ACCT-FX-7714',
    receivingAccountName: 'CHEN, DAVID',
    availableBalance: 420.00,
    pendingCredits: 350.00,
    shortfall: 122.25,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-7715', type: 'Checking', balance: 1890.00 },
    ],
    priority: 'high',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
  // HIGH: Large utility debit, multiple offsets
  {
    id: 'EXC-DD-006',
    sourceFileName: 'ACH20260310_B2.txt',
    batchWindow: '10:00 AM',
    receivedAt: todayAt(10, 1),
    effectiveDate: todayAt(10, 0),
    returnDeadline: bankingDaysFrom(todayAt(10, 0), 2),
    traceNumber: '071000020000004',
    originatorCompanyName: 'METRO UTILITIES',
    originatorCompanyId: '7778901234',
    secCode: 'PPD',
    entryDescription: 'UTILITIES',
    amount: 1532.25,
    transactionCode: 27,
    receivingVAN: 'VAN-5518-001',
    receivingAccountId: 'ACCT-FX-5518',
    receivingAccountName: 'PATEL, RAJESH',
    availableBalance: 800.00,
    pendingCredits: 200.00,
    shortfall: 532.25,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-5519', type: 'Savings', balance: 3400.00 },
      { accountId: 'ACCT-FX-5520', type: 'CD', balance: 25000.00 },
    ],
    priority: 'high',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
  // HIGH: WEB entry, account flagged
  {
    id: 'EXC-DD-007',
    sourceFileName: 'ACH20260310_B2.txt',
    batchWindow: '10:00 AM',
    receivedAt: todayAt(10, 1),
    effectiveDate: todayAt(10, 0),
    returnDeadline: bankingDaysFrom(todayAt(10, 0), 2),
    traceNumber: '071000020000005',
    originatorCompanyName: 'FIRST NATIONAL LENDING',
    originatorCompanyId: '5551234567',
    secCode: 'WEB',
    entryDescription: 'LOAN PMT',
    amount: 2875.00,
    transactionCode: 27,
    receivingVAN: 'VAN-6650-001',
    receivingAccountId: 'ACCT-FX-6650',
    receivingAccountName: 'THOMPSON, LISA',
    availableBalance: 1200.00,
    pendingCredits: 2875.00,
    shortfall: 0,
    customerOtherAccounts: [],
    priority: 'high',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: ['Pending credit of $2,875.00 expected from payroll — may cover if posted today'],
    decisionHistory: [],
  },
  // MEDIUM: Sufficient balance, duplicate check needed
  {
    id: 'EXC-DD-008',
    sourceFileName: 'ACH20260310_B3.txt',
    batchWindow: '1:45 PM',
    receivedAt: todayAt(13, 46),
    effectiveDate: todayAt(13, 45),
    returnDeadline: bankingDaysFrom(todayAt(13, 45), 2),
    traceNumber: '071000030000001',
    originatorCompanyName: 'RIVERSIDE MORTGAGE',
    originatorCompanyId: '9876543210',
    secCode: 'PPD',
    entryDescription: 'MORTGAGE',
    amount: 3200.00,
    transactionCode: 27,
    receivingVAN: 'VAN-8832-001',
    receivingAccountId: 'ACCT-FX-8832',
    receivingAccountName: 'JOHNSON, MICHAEL',
    availableBalance: 4500.00,
    pendingCredits: 0,
    shortfall: 0,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-8833', type: 'Savings', balance: 8200.00 },
    ],
    priority: 'medium',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: ['Possible duplicate — same originator, amount, and account as EXC-DD-001 from 2 days ago'],
    decisionHistory: [],
  },
  // MEDIUM: Savings debit prenote
  {
    id: 'EXC-DD-009',
    sourceFileName: 'ACH20260310_B3.txt',
    batchWindow: '1:45 PM',
    receivedAt: todayAt(13, 46),
    effectiveDate: todayAt(13, 45),
    returnDeadline: bankingDaysFrom(todayAt(13, 45), 2),
    traceNumber: '071000030000003',
    originatorCompanyName: 'RIVERSIDE MORTGAGE',
    originatorCompanyId: '9876543210',
    secCode: 'PPD',
    entryDescription: 'MORTGAGE',
    amount: 5250.00,
    transactionCode: 37,
    receivingVAN: 'VAN-7714-002',
    receivingAccountId: 'ACCT-FX-7714',
    receivingAccountName: 'CHEN, DAVID',
    availableBalance: 6100.00,
    pendingCredits: 0,
    shortfall: 0,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-7715', type: 'Checking', balance: 1890.00 },
    ],
    priority: 'medium',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
  // MEDIUM: Moderate shortfall
  {
    id: 'EXC-DD-010',
    sourceFileName: 'ACH20260310_B3.txt',
    batchWindow: '1:45 PM',
    receivedAt: todayAt(13, 46),
    effectiveDate: todayAt(13, 45),
    returnDeadline: bankingDaysFrom(todayAt(13, 45), 2),
    traceNumber: '071000030000005',
    originatorCompanyName: 'RIVERSIDE MORTGAGE',
    originatorCompanyId: '9876543210',
    secCode: 'PPD',
    entryDescription: 'MORTGAGE',
    amount: 4700.00,
    transactionCode: 27,
    receivingVAN: 'VAN-9902-002',
    receivingAccountId: 'ACCT-FX-9902',
    receivingAccountName: 'GARCIA, ROBERTO',
    availableBalance: 3200.00,
    pendingCredits: 1000.00,
    shortfall: 500.00,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-9903', type: 'Savings', balance: 1200.00 },
    ],
    priority: 'medium',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
  // LOW: Sufficient balance, standard check
  {
    id: 'EXC-DD-011',
    sourceFileName: 'ACH20260310_B3.txt',
    batchWindow: '1:45 PM',
    receivedAt: todayAt(13, 46),
    effectiveDate: todayAt(13, 45),
    returnDeadline: bankingDaysFrom(todayAt(13, 45), 2),
    traceNumber: '071000030000006',
    originatorCompanyName: 'ABC TAX SERVICES',
    originatorCompanyId: '2223456789',
    secCode: 'CCD',
    entryDescription: 'TAX PMT',
    amount: 4800.00,
    transactionCode: 27,
    receivingVAN: 'VAN-2209-001',
    receivingAccountId: 'ACCT-FX-2209',
    receivingAccountName: 'WILLIAMS, ANGELA',
    availableBalance: 12400.00,
    pendingCredits: 0,
    shortfall: 0,
    customerOtherAccounts: [],
    priority: 'low',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
  // LOW: Small debit, sufficient balance
  {
    id: 'EXC-DD-012',
    sourceFileName: 'ACH20260310_B3.txt',
    batchWindow: '1:45 PM',
    receivedAt: todayAt(13, 46),
    effectiveDate: todayAt(13, 45),
    returnDeadline: bankingDaysFrom(todayAt(13, 45), 2),
    traceNumber: '071000030000008',
    originatorCompanyName: 'ABC TAX SERVICES',
    originatorCompanyId: '2223456789',
    secCode: 'CCD',
    entryDescription: 'TAX PMT',
    amount: 4200.00,
    transactionCode: 27,
    receivingVAN: 'VAN-1145-001',
    receivingAccountId: 'ACCT-FX-1145',
    receivingAccountName: 'KIM, JENNIFER',
    availableBalance: 9800.00,
    pendingCredits: 0,
    shortfall: 0,
    customerOtherAccounts: [
      { accountId: 'ACCT-FX-1146', type: 'Savings', balance: 5600.00 },
    ],
    priority: 'low',
    status: 'PENDING_DECISION',
    assignedTo: null,
    notes: [],
    decisionHistory: [],
  },
];

// --- Stub queues for other categories (MVP placeholders) ---
export const MOCK_VAN_EXCEPTIONS = [
  { id: 'EXC-VAN-001', type: 'UNMAPPED_VAN', van: 'VAN-0000-999', amount: 5200.00, receivedAt: todayAt(7, 5), sourceFile: 'ACH20260310_B1.txt', priority: 'high', status: 'PENDING' },
  { id: 'EXC-VAN-002', type: 'RETIRED_VAN', van: 'VAN-4400-001', amount: 1800.00, receivedAt: todayAt(10, 3), sourceFile: 'ACH20260310_B2.txt', priority: 'medium', status: 'PENDING' },
  { id: 'EXC-VAN-003', type: 'RETIRED_VAN', van: 'VAN-2200-003', amount: 750.00, receivedAt: daysAgo(1, 13, 48), sourceFile: 'ACH20260309_B3.txt', priority: 'medium', status: 'PENDING' },
  { id: 'EXC-VAN-004', type: 'UNMAPPED_VAN', van: 'VAN-0000-112', amount: 320.00, receivedAt: daysAgo(1, 7, 4), sourceFile: 'ACH20260309_B1.txt', priority: 'low', status: 'PENDING' },
];

export const MOCK_RECON_EXCEPTIONS = [
  { id: 'EXC-REC-001', type: 'UNMATCHED', txnId: 'TXN-50001', amount: 5000.00, sourceFile: 'ACH_RDFI_20260308', date: daysAgo(2, 14, 30), confidence: 45, priority: 'high', status: 'PENDING' },
  { id: 'EXC-REC-002', type: 'UNMATCHED', txnId: 'TXN-50002', amount: 12500.00, sourceFile: 'SWIM_20260309', date: daysAgo(1, 12, 15), confidence: 0, priority: 'high', status: 'PENDING' },
  { id: 'EXC-REC-003', type: 'SETTLE_MISMATCH', txnId: 'TXN-50003', amount: 1250.00, sourceFile: 'FIRD_20260310', date: todayAt(10, 12), confidence: null, priority: 'medium', status: 'PENDING' },
  { id: 'EXC-REC-004', type: 'UNMATCHED', txnId: 'TXN-50004', amount: 3200.00, sourceFile: 'RTP_20260309', date: daysAgo(1, 9, 22), confidence: 62, priority: 'medium', status: 'PENDING' },
  { id: 'EXC-REC-005', type: 'UNMATCHED', txnId: 'TXN-50005', amount: 8750.00, sourceFile: 'ACH_ODFI_20260308', date: daysAgo(2, 17, 0), confidence: 38, priority: 'medium', status: 'PENDING' },
  { id: 'EXC-REC-006', type: 'TIME_DRIFT', txnId: 'TXN-50006', amount: 2100.00, sourceFile: 'ACH_RDFI_20260307', date: daysAgo(3, 7, 5), confidence: 55, priority: 'low', status: 'PENDING' },
  { id: 'EXC-REC-007', type: 'AMOUNT_VARIANCE', txnId: 'TXN-50007', amount: 450.25, sourceFile: 'FEDNOW_20260309', date: daysAgo(1, 14, 12), confidence: 72, priority: 'low', status: 'PENDING' },
];

export const MOCK_ACH_PROCESSING_ERRORS = [
  { id: 'EXC-APE-001', errCode: 'ACH_PARSE_ERR', eventId: 'evt-ach-20260310-fail-001', sourceFile: 'ACH20260310_B1.txt', errorDesc: 'Malformed batch header at line 42', priority: 'critical', status: 'PENDING' },
  { id: 'EXC-APE-002', errCode: 'ACH_CHECKSUM_FAIL', eventId: 'evt-ach-20260310-fail-002', sourceFile: 'ACH20260310_B2.txt', errorDesc: 'Entry count mismatch: expected 1247, actual 1245', priority: 'high', status: 'PENDING' },
  { id: 'EXC-APE-003', errCode: 'ACH_DUPLICATE_BATCH', eventId: 'evt-ach-20260310-fail-003', sourceFile: 'ACH20260310_B3.txt', errorDesc: 'Duplicate batch control 00045821', priority: 'medium', status: 'PENDING' },
];

export const MOCK_ACH_RETURNS_QUEUE = [
  { id: 'EXC-RET-001', returnCode: 'R01', originalTrace: '071000010000004', amount: 9800.00, originatorName: 'ACME PAYROLL INC', returnedAt: todayAt(15, 3), priority: 'high', status: 'PENDING' },
  { id: 'EXC-RET-002', returnCode: 'R10', originalTrace: '071000020000002', amount: 1180.00, originatorName: 'METRO UTILITIES', returnedAt: todayAt(15, 3), priority: 'high', status: 'PENDING' },
  { id: 'EXC-RET-003', returnCode: 'R02', originalTrace: '071000010000008', amount: 8200.00, originatorName: 'GREENFIELD LOGISTICS', returnedAt: daysAgo(1, 15, 5), priority: 'high', status: 'PENDING' },
  { id: 'EXC-RET-004', returnCode: 'R29', originalTrace: '071000030000002', amount: 4500.00, originatorName: 'RIVERSIDE MORTGAGE', returnedAt: daysAgo(1, 15, 5), priority: 'medium', status: 'PENDING' },
  { id: 'EXC-RET-005', returnCode: 'R01', originalTrace: '071000020000007', amount: 2850.00, originatorName: 'FIRST NATIONAL LENDING', returnedAt: daysAgo(1, 15, 5), priority: 'medium', status: 'PENDING' },
];

export const MOCK_RTP_FEDNOW_EXCEPTIONS = [
  { id: 'EXC-RTF-001', network: 'RTP', type: 'TIMEOUT', txnId: 'TXN-1016', amount: 22000.00, note: 'No response after 30s SLA', createdAt: todayAt(10, 15), priority: 'high', status: 'PENDING' },
  { id: 'EXC-RTF-002', network: 'FEDNOW', type: 'INVALID_RTN', txnId: 'TXN-1022', amount: 18500.00, note: 'Rejected — invalid routing number', createdAt: todayAt(10, 42), priority: 'medium', status: 'PENDING' },
];

export const MOCK_PAYOUT_EXCEPTIONS = [
  { id: 'EXC-PO-001', type: 'PAYOUT_FAILED', shopId: 'SHOP-1234', merchantName: 'Sunrise Coffee', amount: 4500.00, error: 'Bank reject — account number invalid', createdAt: todayAt(8, 30), priority: 'high', status: 'PENDING' },
  { id: 'EXC-PO-002', type: 'PAYOUT_UNAVAILABLE', shopId: 'SHOP-5678', merchantName: 'Metro Fitness', amount: 0, error: 'Delinquency check failed', createdAt: daysAgo(1, 14, 0), priority: 'medium', status: 'PENDING' },
  { id: 'EXC-PO-003', type: 'PRODUCT_NOT_CONFIGURED', shopId: 'SHOP-9012', merchantName: 'Harbor Books', amount: 0, error: 'Instant payout not configured for partner', createdAt: daysAgo(2, 9, 15), priority: 'low', status: 'PENDING' },
];

export const MOCK_INFRA_ALERTS = [
  { id: 'EXC-INF-001', type: 'DB_TIMEOUT', system: 'FinXact Core', errorDesc: 'Connection pool exhausted: 100/100 active', detectedAt: todayAt(21, 3), priority: 'critical', status: 'PENDING' },
];
