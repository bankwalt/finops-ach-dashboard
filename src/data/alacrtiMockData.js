function todayAt(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysAgo(days, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function formatDayLabel(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const date = `${d.getMonth() + 1}/${d.getDate()}`;
  return `${day} ${date}`;
}

export const MOCK_FUNDS_AVAILABILITY = {
  rtp: {
    rail: 'RTP',
    openingBalance: 2500000.00,
    currentBalance: 1847235.42,
    creditLimit: 3000000.00,
    lastAdjustmentAt: todayAt(6, 0),
    ledger: [
      { id: 'rtp-led-001', timestamp: todayAt(6, 0),   type: 'adjustment', description: 'Opening funding - Wire from settlement', amount: 2500000.00, runningBalance: 2500000.00 },
      { id: 'rtp-led-002', timestamp: todayAt(7, 12),  type: 'debit', description: 'RTP payment - Payroll batch ACME Corp', amount: -185000.00, runningBalance: 2315000.00 },
      { id: 'rtp-led-003', timestamp: todayAt(8, 3),   type: 'debit', description: 'RTP payment - Vendor payment #40281', amount: -42500.00, runningBalance: 2272500.00 },
      { id: 'rtp-led-004', timestamp: todayAt(8, 47),  type: 'debit', description: 'RTP payment - Insurance premium batch', amount: -78200.00, runningBalance: 2194300.00 },
      { id: 'rtp-led-005', timestamp: todayAt(9, 15),  type: 'credit', description: 'RTP received - Customer deposit #91052', amount: 15000.00, runningBalance: 2209300.00 },
      { id: 'rtp-led-006', timestamp: todayAt(9, 58),  type: 'debit', description: 'RTP payment - Utility disbursement', amount: -125800.00, runningBalance: 2083500.00 },
      { id: 'rtp-led-007', timestamp: todayAt(10, 22), type: 'debit', description: 'RTP payment - Tax remittance Q1', amount: -92340.00, runningBalance: 1991160.00 },
      { id: 'rtp-led-008', timestamp: todayAt(11, 5),  type: 'adjustment', description: 'Intraday funding top-up', amount: 250000.00, runningBalance: 2241160.00 },
      { id: 'rtp-led-009', timestamp: todayAt(11, 38), type: 'debit', description: 'RTP payment - Mortgage disbursement batch', amount: -210400.00, runningBalance: 2030760.00 },
      { id: 'rtp-led-010', timestamp: todayAt(12, 14), type: 'debit', description: 'RTP payment - Account transfer #78431', amount: -67800.00, runningBalance: 1962960.00 },
      { id: 'rtp-led-011', timestamp: todayAt(13, 2),  type: 'debit', description: 'RTP payment - Supplier payment #55102', amount: -88524.58, runningBalance: 1874435.42 },
      { id: 'rtp-led-012', timestamp: todayAt(13, 45), type: 'debit', description: 'RTP payment - Refund processing batch', amount: -27200.00, runningBalance: 1847235.42 },
    ],
  },
  fedNow: {
    rail: 'FedNow',
    openingBalance: 1800000.00,
    currentBalance: 1423891.15,
    creditLimit: 2000000.00,
    lastAdjustmentAt: todayAt(6, 0),
    ledger: [
      { id: 'fn-led-001', timestamp: todayAt(6, 0),   type: 'adjustment', description: 'Opening funding - Fed settlement', amount: 1800000.00, runningBalance: 1800000.00 },
      { id: 'fn-led-002', timestamp: todayAt(7, 30),  type: 'debit', description: 'FedNow payment - Payroll Services Inc', amount: -95000.00, runningBalance: 1705000.00 },
      { id: 'fn-led-003', timestamp: todayAt(8, 18),  type: 'debit', description: 'FedNow payment - Commercial lease #2241', amount: -34500.00, runningBalance: 1670500.00 },
      { id: 'fn-led-004', timestamp: todayAt(9, 5),   type: 'credit', description: 'FedNow received - Incoming transfer', amount: 22000.00, runningBalance: 1692500.00 },
      { id: 'fn-led-005', timestamp: todayAt(9, 42),  type: 'debit', description: 'FedNow payment - Benefits disbursement', amount: -67800.00, runningBalance: 1624700.00 },
      { id: 'fn-led-006', timestamp: todayAt(10, 15), type: 'debit', description: 'FedNow payment - Escrow funding #4482', amount: -112400.00, runningBalance: 1512300.00 },
      { id: 'fn-led-007', timestamp: todayAt(11, 0),  type: 'adjustment', description: 'Intraday funding top-up', amount: 150000.00, runningBalance: 1662300.00 },
      { id: 'fn-led-008', timestamp: todayAt(11, 33), type: 'debit', description: 'FedNow payment - Insurance claim payout', amount: -148200.00, runningBalance: 1514100.00 },
      { id: 'fn-led-009', timestamp: todayAt(12, 48), type: 'debit', description: 'FedNow payment - Vendor payment #60183', amount: -56708.85, runningBalance: 1457391.15 },
      { id: 'fn-led-010', timestamp: todayAt(13, 20), type: 'debit', description: 'FedNow payment - Account-to-account transfer', amount: -33500.00, runningBalance: 1423891.15 },
    ],
  },
};

export const MOCK_ALACRITI_TRANSACTIONS = {
  rtp: [
    { date: daysAgo(6, 0, 0), label: formatDayLabel(6), total: 342, success: 338, failed: 4 },
    { date: daysAgo(5, 0, 0), label: formatDayLabel(5), total: 289, success: 287, failed: 2 },
    { date: daysAgo(4, 0, 0), label: formatDayLabel(4), total: 415, success: 412, failed: 3 },
    { date: daysAgo(3, 0, 0), label: formatDayLabel(3), total: 378, success: 375, failed: 3 },
    { date: daysAgo(2, 0, 0), label: formatDayLabel(2), total: 301, success: 300, failed: 1 },
    { date: daysAgo(1, 0, 0), label: formatDayLabel(1), total: 356, success: 351, failed: 5 },
    { date: daysAgo(0, 0, 0), label: 'Today',           total: 187, success: 186, failed: 1 },
  ],
  fedNow: [
    { date: daysAgo(6, 0, 0), label: formatDayLabel(6), total: 198, success: 196, failed: 2 },
    { date: daysAgo(5, 0, 0), label: formatDayLabel(5), total: 167, success: 165, failed: 2 },
    { date: daysAgo(4, 0, 0), label: formatDayLabel(4), total: 234, success: 233, failed: 1 },
    { date: daysAgo(3, 0, 0), label: formatDayLabel(3), total: 212, success: 210, failed: 2 },
    { date: daysAgo(2, 0, 0), label: formatDayLabel(2), total: 189, success: 188, failed: 1 },
    { date: daysAgo(1, 0, 0), label: formatDayLabel(1), total: 221, success: 218, failed: 3 },
    { date: daysAgo(0, 0, 0), label: 'Today',           total: 104, success: 103, failed: 1 },
  ],
};
