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

let idCounter = 1000;
function txnId() { return `TXN-${++idCounter}`; }
function poId() { return `PO-${Math.floor(10000 + Math.random() * 90000)}`; }
function acctId() { return `ACCT-${Math.floor(1000 + Math.random() * 9000)}`; }
function retId() { return `RTN-${Math.floor(10000 + Math.random() * 90000)}`; }

export const MOCK_TRANSACTIONS = [
  // --- Today: CORE ---
  { id: txnId(), createdAt: todayAt(14, 12, 33), status: 'PENDING',   network: 'CORE',   direction: 'CREDIT',  amount: -4250.00,   note: 'Payroll direct deposit - Batch #2241',      paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(14, 8, 15),  status: 'PENDING',   network: 'CORE',   direction: 'CREDIT',  amount: -1875.50,   note: 'Vendor payment - Office supplies',           paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(13, 55, 2),  status: 'PENDING',   network: 'CORE',   direction: 'CREDIT',  amount: -12340.00,  note: 'Insurance premium disbursement',             paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(13, 42, 18), status: 'PENDING',   network: 'CORE',   direction: 'DEBIT',   amount: 8500.00,    note: 'Customer deposit - Wire transfer',           paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(13, 30, 5),  status: 'COMPLETED', network: 'CORE',   direction: 'CREDIT',  amount: -3200.00,   note: 'Tax remittance - Q1 filing',                 paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(13, 35, 0) },
  { id: txnId(), createdAt: todayAt(12, 58, 44), status: 'COMPLETED', network: 'CORE',   direction: 'CREDIT',  amount: -750.00,    note: 'Utility payment - Electric',                 paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(13, 5, 0) },
  { id: txnId(), createdAt: todayAt(12, 15, 22), status: 'COMPLETED', network: 'CORE',   direction: 'DEBIT',   amount: 25000.00,   note: 'Loan disbursement - Account funding',        paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(12, 20, 0) },
  { id: txnId(), createdAt: todayAt(11, 40, 9),  status: 'COMPLETED', network: 'CORE',   direction: 'CREDIT',  amount: -5600.00,   note: 'ACH batch - Supplier payments',              paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(11, 50, 0) },
  { id: txnId(), createdAt: todayAt(10, 22, 37), status: 'FAILED',    network: 'CORE',   direction: 'CREDIT',  amount: -9800.00,   note: 'Payroll - Insufficient funds',               paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(9, 5, 50),   status: 'RETURNED',  network: 'CORE',   direction: 'CREDIT',  amount: -2100.00,   note: 'ACH return - Account closed (R02)',          paymentOrderId: poId(), returnTransactionId: retId(),   accountId: acctId(), holdEndedAt: todayAt(9, 8, 0) },

  // --- Today: RTP ---
  { id: txnId(), createdAt: todayAt(14, 5, 12),  status: 'COMPLETED', network: 'RTP',    direction: 'CREDIT',  amount: -15000.00,  note: 'RTP payment - Mortgage disbursement',        paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(14, 5, 14) },
  { id: txnId(), createdAt: todayAt(13, 48, 3),  status: 'COMPLETED', network: 'RTP',    direction: 'DEBIT',   amount: 7200.00,    note: 'RTP received - B2B payment',                 paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(13, 48, 5) },
  { id: txnId(), createdAt: todayAt(13, 22, 55), status: 'COMPLETED', network: 'RTP',    direction: 'CREDIT',  amount: -3400.00,   note: 'RTP payment - Vendor invoice #8832',         paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(13, 22, 57) },
  { id: txnId(), createdAt: todayAt(12, 44, 18), status: 'PENDING',   network: 'RTP',    direction: 'CREDIT',  amount: -42500.00,  note: 'RTP payment - Escrow funding',               paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(11, 30, 45), status: 'COMPLETED', network: 'RTP',    direction: 'CREDIT',  amount: -8900.00,   note: 'RTP payment - Benefits payout',              paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(11, 30, 47) },
  { id: txnId(), createdAt: todayAt(10, 15, 8),  status: 'FAILED',    network: 'RTP',    direction: 'CREDIT',  amount: -22000.00,  note: 'RTP payment - Timeout (no response)',        paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(9, 48, 32),  status: 'COMPLETED', network: 'RTP',    direction: 'DEBIT',   amount: 5500.00,    note: 'RTP received - Customer payment',            paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(9, 48, 34) },
  { id: txnId(), createdAt: todayAt(8, 22, 14),  status: 'COMPLETED', network: 'RTP',    direction: 'CREDIT',  amount: -1200.00,   note: 'RTP payment - Subscription renewal',         paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(8, 22, 16) },

  // --- Today: FEDNOW ---
  { id: txnId(), createdAt: todayAt(13, 58, 40), status: 'COMPLETED', network: 'FEDNOW', direction: 'CREDIT',  amount: -6700.00,   note: 'FedNow payment - Supplier settlement',      paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(13, 58, 42) },
  { id: txnId(), createdAt: todayAt(13, 12, 5),  status: 'COMPLETED', network: 'FEDNOW', direction: 'DEBIT',   amount: 12000.00,   note: 'FedNow received - Commercial deposit',       paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(13, 12, 7) },
  { id: txnId(), createdAt: todayAt(12, 30, 22), status: 'PENDING',   network: 'FEDNOW', direction: 'CREDIT',  amount: -8400.00,   note: 'FedNow payment - Lease payment #2241',       paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(11, 55, 38), status: 'COMPLETED', network: 'FEDNOW', direction: 'CREDIT',  amount: -4300.00,   note: 'FedNow payment - Benefits disbursement',     paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(11, 55, 40) },
  { id: txnId(), createdAt: todayAt(10, 42, 55), status: 'FAILED',    network: 'FEDNOW', direction: 'CREDIT',  amount: -18500.00,  note: 'FedNow payment - Rejected (invalid RTN)',    paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: todayAt(9, 30, 12),  status: 'COMPLETED', network: 'FEDNOW', direction: 'DEBIT',   amount: 3200.00,    note: 'FedNow received - Insurance premium',        paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: todayAt(9, 30, 14) },
  { id: txnId(), createdAt: todayAt(8, 15, 44),  status: 'RETURNED',  network: 'FEDNOW', direction: 'CREDIT',  amount: -2800.00,   note: 'FedNow return - No account (R04)',           paymentOrderId: poId(), returnTransactionId: retId(),   accountId: acctId(), holdEndedAt: todayAt(8, 20, 0) },

  // --- Yesterday: mix ---
  { id: txnId(), createdAt: daysAgo(1, 16, 45, 20), status: 'COMPLETED', network: 'CORE',   direction: 'CREDIT',  amount: -45000.00,  note: 'ACH batch - Payroll processing',          paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(1, 16, 50, 0) },
  { id: txnId(), createdAt: daysAgo(1, 15, 30, 8),  status: 'COMPLETED', network: 'RTP',    direction: 'CREDIT',  amount: -6800.00,   note: 'RTP payment - Account-to-account',        paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(1, 15, 30, 10) },
  { id: txnId(), createdAt: daysAgo(1, 14, 12, 33), status: 'COMPLETED', network: 'FEDNOW', direction: 'DEBIT',   amount: 9400.00,    note: 'FedNow received - Wire equivalent',       paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(1, 14, 12, 35) },
  { id: txnId(), createdAt: daysAgo(1, 13, 5, 42),  status: 'FAILED',    network: 'CORE',   direction: 'CREDIT',  amount: -11200.00,  note: 'ACH - NSF (R01)',                         paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: daysAgo(1, 11, 22, 15), status: 'COMPLETED', network: 'RTP',    direction: 'CREDIT',  amount: -2300.00,   note: 'RTP payment - Subscription service',      paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(1, 11, 22, 17) },
  { id: txnId(), createdAt: daysAgo(1, 10, 48, 55), status: 'RETURNED',  network: 'CORE',   direction: 'CREDIT',  amount: -1500.00,   note: 'ACH return - Unauthorized (R10)',          paymentOrderId: poId(), returnTransactionId: retId(),   accountId: acctId(), holdEndedAt: daysAgo(1, 10, 52, 0) },
  { id: txnId(), createdAt: daysAgo(1, 9, 15, 30),  status: 'COMPLETED', network: 'FEDNOW', direction: 'CREDIT',  amount: -7600.00,   note: 'FedNow payment - Escrow release',         paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(1, 9, 15, 32) },
  { id: txnId(), createdAt: daysAgo(1, 8, 30, 12),  status: 'COMPLETED', network: 'CORE',   direction: 'DEBIT',   amount: 15000.00,   note: 'Wire received - Loan funding',            paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(1, 8, 35, 0) },
  { id: txnId(), createdAt: daysAgo(1, 7, 45, 8),   status: 'FAILED',    network: 'RTP',    direction: 'CREDIT',  amount: -33000.00,  note: 'RTP payment - Network timeout',           paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },

  // --- 2 days ago: mix ---
  { id: txnId(), createdAt: daysAgo(2, 15, 20, 44), status: 'COMPLETED', network: 'CORE',   direction: 'CREDIT',  amount: -8700.00,   note: 'ACH batch - Vendor disbursements',        paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(2, 15, 28, 0) },
  { id: txnId(), createdAt: daysAgo(2, 14, 5, 18),  status: 'COMPLETED', network: 'RTP',    direction: 'DEBIT',   amount: 4100.00,    note: 'RTP received - Merchant settlement',      paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(2, 14, 5, 20) },
  { id: txnId(), createdAt: daysAgo(2, 12, 30, 5),  status: 'COMPLETED', network: 'FEDNOW', direction: 'CREDIT',  amount: -5200.00,   note: 'FedNow payment - Tax remittance',         paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(2, 12, 30, 7) },
  { id: txnId(), createdAt: daysAgo(2, 11, 15, 32), status: 'FAILED',    network: 'FEDNOW', direction: 'CREDIT',  amount: -14000.00,  note: 'FedNow - Participant unavailable',        paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: null },
  { id: txnId(), createdAt: daysAgo(2, 10, 0, 18),  status: 'COMPLETED', network: 'CORE',   direction: 'CREDIT',  amount: -3400.00,   note: 'ACH payment - Insurance premium',         paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(2, 10, 5, 0) },
  { id: txnId(), createdAt: daysAgo(2, 9, 22, 40),  status: 'RETURNED',  network: 'RTP',    direction: 'CREDIT',  amount: -6000.00,   note: 'RTP return - Account frozen',             paymentOrderId: poId(), returnTransactionId: retId(),   accountId: acctId(), holdEndedAt: daysAgo(2, 9, 25, 0) },
  { id: txnId(), createdAt: daysAgo(2, 8, 10, 55),  status: 'COMPLETED', network: 'CORE',   direction: 'DEBIT',   amount: 20000.00,   note: 'Wire received - Escrow deposit',          paymentOrderId: poId(), returnTransactionId: null,      accountId: acctId(), holdEndedAt: daysAgo(2, 8, 15, 0) },
];
