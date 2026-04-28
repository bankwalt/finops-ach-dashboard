// Mock data for ACH Reconciliation view
// Mirrors the shape returned by the Flask /api/recon, /api/transactions, and /api/pending endpoints

function generateReconRows() {
  const rows = [];
  const start = new Date('2026-01-02');
  const end = new Date('2026-03-18');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    const baseCr = Math.round((Math.random() * 80000 + 20000) * 100) / 100;
    const baseDr = Math.round((Math.random() * 60000 + 10000) * 100) / 100;

    const rdfiCr = Math.round(baseCr * 0.7 * 100) / 100;
    const odfiCr = Math.round(baseCr * 0.3 * 100) / 100;
    const rdfiDr = Math.round(baseDr * 0.6 * 100) / 100;
    const odfiDr = Math.round(baseDr * 0.4 * 100) / 100;

    const fileCr = Math.round((rdfiCr + odfiCr) * 100) / 100;
    const fileDr = Math.round((rdfiDr + odfiDr) * 100) / 100;

    // Most days match; introduce some variances
    const rand = Math.random();
    let firdCr, firdDr, coreCr, coreDr, fvfCr, fvfDr, fvcCr, fvcDr, status;

    if (rand < 0.70) {
      // Matched
      firdCr = fileCr;
      firdDr = fileDr;
      coreCr = fileCr;
      coreDr = fileDr;
      fvfCr = 0; fvfDr = 0; fvcCr = 0; fvcDr = 0;
      status = 'Matched';
    } else if (rand < 0.82) {
      // FIRD Variance
      const varAmt = Math.round((Math.random() * 500 + 10) * 100) / 100;
      firdCr = Math.round((fileCr + varAmt) * 100) / 100;
      firdDr = fileDr;
      coreCr = fileCr;
      coreDr = fileDr;
      fvfCr = varAmt; fvfDr = 0; fvcCr = 0; fvcDr = 0;
      status = 'FIRD Variance';
    } else if (rand < 0.92) {
      // Core Variance
      firdCr = fileCr;
      firdDr = fileDr;
      const varAmt = Math.round((Math.random() * 300 + 5) * 100) / 100;
      coreCr = Math.round((fileCr - varAmt) * 100) / 100;
      coreDr = fileDr;
      fvfCr = 0; fvfDr = 0;
      fvcCr = varAmt; fvcDr = 0;
      status = 'Core Variance';
    } else {
      // Both Variance
      const v1 = Math.round((Math.random() * 200 + 10) * 100) / 100;
      const v2 = Math.round((Math.random() * 150 + 5) * 100) / 100;
      firdCr = Math.round((fileCr + v1) * 100) / 100;
      firdDr = fileDr;
      coreCr = Math.round((fileCr - v2) * 100) / 100;
      coreDr = fileDr;
      fvfCr = v1; fvfDr = 0; fvcCr = v2; fvcDr = 0;
      status = 'Both Variance';
    }

    const rdfiCount = Math.floor(Math.random() * 80) + 10;
    const odfiCount = Math.floor(Math.random() * 40) + 5;
    const coreCount = rdfiCount + odfiCount + Math.floor(Math.random() * 10) - 5;

    rows.push({
      date: iso,
      fird_cr: firdCr, fird_dr: firdDr,
      rdfi_cr: rdfiCr, rdfi_dr: rdfiDr,
      odfi_cr: odfiCr, odfi_dr: odfiDr,
      file_cr: fileCr, file_dr: fileDr,
      core_cr: coreCr, core_dr: coreDr,
      fvf_cr: fvfCr, fvf_dr: fvfDr,
      fvc_cr: fvcCr, fvc_dr: fvcDr,
      rdfi_count: rdfiCount, odfi_count: odfiCount, core_count: coreCount,
      status,
    });
  }

  // Add a couple pending rows (future dates, no FIRD)
  ['2026-03-19', '2026-03-20'].forEach(iso => {
    const cr = Math.round((Math.random() * 50000 + 10000) * 100) / 100;
    const dr = Math.round((Math.random() * 30000 + 5000) * 100) / 100;
    rows.push({
      date: iso,
      fird_cr: null, fird_dr: null,
      rdfi_cr: Math.round(cr * 0.7 * 100) / 100,
      rdfi_dr: Math.round(dr * 0.6 * 100) / 100,
      odfi_cr: Math.round(cr * 0.3 * 100) / 100,
      odfi_dr: Math.round(dr * 0.4 * 100) / 100,
      file_cr: cr, file_dr: dr,
      core_cr: cr, core_dr: dr,
      fvf_cr: null, fvf_dr: null,
      fvc_cr: 0, fvc_dr: 0,
      rdfi_count: 25, odfi_count: 12, core_count: 38,
      status: 'Pending',
    });
  });

  return rows;
}

function computeStats(rows) {
  return {
    matched: rows.filter(r => r.status === 'Matched').length,
    fird_variance: rows.filter(r => r.status === 'FIRD Variance' || r.status === 'Both Variance').length,
    core_variance: rows.filter(r => r.status === 'Core Variance' || r.status === 'Both Variance').length,
    pending: rows.filter(r => r.status === 'Pending').length,
    total_days: rows.length,
    total_fird_cr: Math.round(rows.reduce((s, r) => s + (r.fird_cr || 0), 0) * 100) / 100,
    total_fird_dr: Math.round(rows.reduce((s, r) => s + (r.fird_dr || 0), 0) * 100) / 100,
    total_file_cr: Math.round(rows.reduce((s, r) => s + r.file_cr, 0) * 100) / 100,
    total_file_dr: Math.round(rows.reduce((s, r) => s + r.file_dr, 0) * 100) / 100,
    total_core_cr: Math.round(rows.reduce((s, r) => s + (r.core_cr || 0), 0) * 100) / 100,
    total_core_dr: Math.round(rows.reduce((s, r) => s + (r.core_dr || 0), 0) * 100) / 100,
    net_fvf_cr: Math.round(rows.reduce((s, r) => s + (r.fvf_cr || 0), 0) * 100) / 100,
    net_fvf_dr: Math.round(rows.reduce((s, r) => s + (r.fvf_dr || 0), 0) * 100) / 100,
    net_fvc_cr: Math.round(rows.reduce((s, r) => s + (r.fvc_cr || 0), 0) * 100) / 100,
    net_fvc_dr: Math.round(rows.reduce((s, r) => s + (r.fvc_dr || 0), 0) * 100) / 100,
  };
}

const TRACE_CHARS = '0123456789';
function randomTrace() {
  let s = '';
  for (let i = 0; i < 15; i++) s += TRACE_CHARS[Math.floor(Math.random() * 10)];
  return s;
}

function generateTransactions(type, dateFrom, dateTo) {
  const rows = [];
  const start = new Date(dateFrom + 'T00:00:00');
  const end = new Date(dateTo + 'T00:00:00');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const count = Math.floor(Math.random() * 15) + 3;

    for (let i = 0; i < count; i++) {
      if (type === 'core') {
        const dir = Math.random() > 0.5 ? 'CREDIT' : 'DEBIT';
        rows.push({
          core_transaction_id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          match_date: iso,
          direction: dir,
          amount: Math.round((Math.random() * 5000 + 10) * 100) / 100,
          code: ['PPD', 'CCD', 'WEB', 'TEL'][Math.floor(Math.random() * 4)],
          code_description: ['Payroll Direct Deposit', 'Corporate Payment', 'Web Payment', 'Telephone Auth'][Math.floor(Math.random() * 4)],
          status: 'SETTLED',
          return_reason: null,
          jaris_transaction_id: `jtx-${Math.random().toString(36).slice(2, 14)}`,
        });
      } else {
        const tcLastDigit = Math.random() > 0.6 ? [2, 3, 4][Math.floor(Math.random() * 3)] : [7, 8][Math.floor(Math.random() * 2)];
        const tc = 20 + tcLastDigit;
        const amt = Math.round((Math.random() * 5000 + 10) * 100) / 100;
        const isCredit = [2, 3, 4, 5].includes(tcLastDigit);
        const isReturn = Math.random() < 0.05;
        rows.push({
          trace_number: randomTrace(),
          match_date: iso,
          credit: isCredit ? amt : 0,
          debit: isCredit ? 0 : amt,
          transaction_code: tc,
          rdfi_routing_number: type === 'rdfi' ? '074920912' : '0' + Math.floor(Math.random() * 90000000 + 10000000),
          odfi_routing_number: type === 'odfi' ? '074920912' : '0' + Math.floor(Math.random() * 90000000 + 10000000),
          is_return: isReturn,
          return_code: isReturn ? ['R01', 'R02', 'R03', 'R04', 'R10'][Math.floor(Math.random() * 5)] : null,
        });
      }
    }
  }

  return rows.sort((a, b) => {
    const da = a.match_date; const db = b.match_date;
    if (da !== db) return db.localeCompare(da);
    const amtA = type === 'core' ? a.amount : (a.credit + a.debit);
    const amtB = type === 'core' ? b.amount : (b.credit + b.debit);
    return amtB - amtA;
  });
}

function generatePendingData() {
  const rdfi = generateTransactions('rdfi', '2026-03-19', '2026-03-20');
  const odfi = generateTransactions('odfi', '2026-03-19', '2026-03-20');
  const core = generateTransactions('core', '2026-03-19', '2026-03-20');
  return {
    latest_fird_date: '2026-03-18',
    rdfi,
    odfi,
    core,
  };
}

// Generate once and cache
let _reconRows = null;
let _stats = null;
let _pending = null;

export function getReconData() {
  if (!_reconRows) {
    _reconRows = generateReconRows();
    _stats = computeStats(_reconRows);
  }
  return { rows: _reconRows, stats: _stats };
}

export function getTransactionData(type, dateFrom, dateTo) {
  return { rows: generateTransactions(type, dateFrom, dateTo) };
}

export function getPendingData() {
  if (!_pending) {
    _pending = generatePendingData();
  }
  return _pending;
}
