// Daily Processing mock data — current-day activity only.
// Schemas mirror production /ach-operations/{swim,odfi,rdfi} tables.
// Historic data lives behind those nav links — we only show today here.

const PROD_ARCHIVE_URLS = {
  swim: 'https://finops.jaris.com/ach-operations/swim',
  odfi: 'https://finops.jaris.com/ach-operations/odfi',
  rdfi: 'https://finops.jaris.com/ach-operations/rdfi',
};

export { PROD_ARCHIVE_URLS };

// ---- helpers ----
function pad(n, w = 2) { return n.toString().padStart(w, '0'); }

function fmtDateYMD(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtTimeShortET(d) {
  // Display as "8:10 a.m. ET" style
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? 'a.m.' : 'p.m.';
  h = ((h + 11) % 12) + 1;
  return `${h}:${pad(m)} ${ampm} ET`;
}

function fmtTimeWithSecET(d) {
  // Display as "8:10:25 a.m. ET" style — used for processed timestamps where seconds matter
  let h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ms = d.getMilliseconds();
  const ampm = h < 12 ? 'a.m.' : 'p.m.';
  h = ((h + 11) % 12) + 1;
  // Show ms only if sub-second precision is meaningful (under 10s lag)
  const secStr = ms > 0 && ms < 1000 ? `${pad(s)}.${pad(Math.floor(ms / 100), 1)}` : pad(s);
  return `${h}:${pad(m)}:${secStr} ${ampm} ET`;
}

function fmtTimestampISO(d) {
  return d.toISOString();
}

function uuid(seed) {
  // Stable mock UUID-ish from seed string
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return `${hex}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-${hex.slice(0, 4)}-${hex}${hex.slice(0, 4)}`;
}

// ---- SWIM (daily GL extract) ----
// One entry per business day. Generated daily at ~4:10 AM ET (per prod CSV: Created At 08:10 UTC).
// Today's SWIM file covers YESTERDAY's activity.
// Expected SLA: 4:10:00 AM ET. Observed lag (Created → Updated): ~1 sec.
export function buildSwimSnapshot(now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yYMD = `${yesterday.getFullYear()}${pad(yesterday.getMonth() + 1)}${pad(yesterday.getDate())}`;
  const yMDY = `${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}-${yesterday.getFullYear()}`;

  // SLA: SWIM extract should land at 4:10:00 AM ET
  const expected = new Date(now);
  expected.setHours(4, 10, 0, 0);

  // Actual processed: ~650ms after expected (mirrors prod CSV)
  const processed = new Date(expected.getTime() + 653);
  const completed = new Date(processed.getTime() + 1027);

  const hasRun = now.getTime() >= expected.getTime();
  const lagSeconds = (processed.getTime() - expected.getTime()) / 1000;

  return {
    activityDate: fmtDateYMD(yesterday),
    archiveUrl: PROD_ARCHIVE_URLS.swim,
    today: hasRun
      ? {
          id: uuid(`swim-${yYMD}`),
          fileName: `jaris_${yYMD}.swm`,
          extractName: `glExtract_${yMDY}.csv`,
          status: 'COMPLETED',
          date: fmtDateYMD(yesterday),
          createdAt: fmtTimestampISO(processed),
          updatedAt: fmtTimestampISO(completed),
          expectedAtLabel: fmtTimeShortET(expected),
          processedAtLabel: fmtTimeWithSecET(processed),
          lagSeconds,
        }
      : null,
    expectedAtLabel: fmtTimeShortET(expected),
    nextRunAtLabel: '4:10 a.m. ET',
  };
}

// ---- ODFI (outbound ACH files sent to bank) ----
// Filename pattern: ACH-YYYYMMDDHHMM.OUT (HHMM in PT)
// Mapped Name:      ACH-YYYYMMDDHHMM.OUT (HHMM in ET — actual transmission time)
// Returns prefixed ACHRET-.
//
// Production windows we observe (ET, mapped time):
//   10:00, 14:15, 16:15, 19:30, 22:15, 01:45 (next day) — files
//   10:05 — ACHRET return file
const ODFI_WINDOWS = [
  { etHour: 10, etMin: 0,  ptHour: 7,  ptMin: 0,  windowLabel: '10:30 ET deadline', isReturn: false },
  { etHour: 10, etMin: 5,  ptHour: 7,  ptMin: 5,  windowLabel: 'Returns batch',     isReturn: true  },
  { etHour: 14, etMin: 15, ptHour: 11, ptMin: 15, windowLabel: '14:45 ET deadline', isReturn: false },
  { etHour: 16, etMin: 15, ptHour: 13, ptMin: 15, windowLabel: '16:45 ET deadline', isReturn: false },
  { etHour: 19, etMin: 30, ptHour: 16, ptMin: 30, windowLabel: '20:00 ET deadline', isReturn: false },
  { etHour: 22, etMin: 15, ptHour: 19, ptMin: 15, windowLabel: '22:45 ET deadline', isReturn: false },
  { etHour: 1,  etMin: 45, ptHour: 22, ptMin: 45, windowLabel: '02:15 ET deadline', isReturn: false, prevDay: true },
];

const ODFI_VOLUMES = [
  { entries: 30, credits: 28_589.23, debits:  2_674.37 },
  { entries: 10, credits:      0.00, debits:    239.34 },
  { entries: 32, credits: 18_100.00, debits: 10_676.70 },
  { entries:  2, credits:      0.00, debits:  9_727.93 },
  { entries: 20, credits: 41_345.72, debits: 16_307.71 },
  { entries:  1, credits:      0.00, debits:    105.73 },
  { entries:  1, credits:      0.00, debits:    269.24 },
];

export function buildOdfiSnapshot(now = new Date()) {
  const todayYMD = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yYMD = `${yesterday.getFullYear()}${pad(yesterday.getMonth() + 1)}${pad(yesterday.getDate())}`;

  const files = ODFI_WINDOWS.map((w, idx) => {
    // Files transmit on PT clock; record the PT (file name) and ET (mapped name) timestamps
    const filenameDate = w.prevDay ? yesterday : now;
    const fnYMD = w.prevDay ? yYMD : todayYMD;

    const ptHHMM = `${pad(w.ptHour)}${pad(w.ptMin)}`;
    const etHHMM = `${pad(w.etHour)}${pad(w.etMin)}`;

    const fileName = `${w.isReturn ? 'ACHRET' : 'ACH'}-${fnYMD}${ptHHMM}.OUT`;
    const mappedName = `${w.isReturn ? 'ACHRET' : 'ACH'}-${fnYMD}${etHHMM}.OUT`;

    // Window cutoff in ET — used to gauge whether file has been sent yet
    const cutoff = new Date(now);
    cutoff.setHours(w.etHour, w.etMin, 0, 0);
    if (w.prevDay) cutoff.setDate(cutoff.getDate() + 1); // 01:45 ET next day

    const sent = now.getTime() >= cutoff.getTime();

    if (!sent) {
      return {
        id: uuid(`odfi-${fnYMD}-${ptHHMM}`),
        fileName,
        mappedName,
        isReturnFile: w.isReturn,
        windowLabel: w.windowLabel,
        status: 'PENDING',
        entries: 0,
        totalCredits: 0,
        totalDebits: 0,
        createdAt: null,
        expectedAtLabel: fmtTimeShortET(cutoff),
        processedAtLabel: null,
        lagSeconds: null,
      };
    }

    const v = ODFI_VOLUMES[idx % ODFI_VOLUMES.length];
    // Real lag from prod: 23-29 sec between cutoff and FinXact "Created At"
    const lagMs = 23_000 + ((idx * 1297) % 6_000);
    const created = new Date(cutoff.getTime() + lagMs);

    return {
      id: uuid(`odfi-${fnYMD}-${ptHHMM}`),
      fileName,
      mappedName,
      isReturnFile: w.isReturn,
      windowLabel: w.windowLabel,
      status: 'COMPLETED',
      entries: v.entries,
      totalCredits: v.credits,
      totalDebits: v.debits,
      createdAt: fmtTimestampISO(created),
      expectedAtLabel: fmtTimeShortET(cutoff),
      processedAtLabel: fmtTimeWithSecET(created),
      lagSeconds: lagMs / 1000,
    };
  });

  const totals = files.reduce(
    (acc, f) => {
      if (f.status === 'COMPLETED') {
        acc.entries += f.entries;
        acc.credits += f.totalCredits;
        acc.debits += f.totalDebits;
        acc.completed += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { entries: 0, credits: 0, debits: 0, completed: 0, pending: 0 }
  );

  return { archiveUrl: PROD_ARCHIVE_URLS.odfi, files, totals };
}

// ---- RDFI (inbound ACH files received from bank) ----
// Filename pattern: ACH-YYYYMMDDHHMMSS.IN — HHMMSS in ET (matches prod data)
// Production receipt windows on ET: 06:15:01, 12:15:01 (early), 12:16:01, 16:15:01, 17:45:01, 22:00:01, 23:45:01
const RDFI_WINDOWS = [
  { etHour: 6,  etMin: 15, etSec: 1, label: 'Overnight distribution' },
  { etHour: 12, etMin: 15, etSec: 1, label: 'SDA #1 settlement'      },
  { etHour: 16, etMin: 15, etSec: 1, label: 'SDA #2 settlement'      },
  { etHour: 17, etMin: 45, etSec: 1, label: 'SDA #3 settlement'      },
  { etHour: 22, etMin: 0,  etSec: 1, label: 'Standard distribution'  },
  { etHour: 23, etMin: 45, etSec: 1, label: 'Late distribution'      },
];

const RDFI_VOLUMES = [
  { entries: 1990, credits: 1_604_465.45, debits:    57.24 },
  { entries:  610, credits:   243_935.87, debits:     0.00 },
  { entries:  204, credits:    49_396.61, debits:     5.00 },
  { entries:    4, credits:     5_911.41, debits: 1_212.82 },
  { entries:  926, credits:   432_241.70, debits:   100.00 },
  { entries:  334, credits:    66_150.21, debits: 14_311.80 },
];

export function buildRdfiSnapshot(now = new Date()) {
  const todayYMD = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

  const files = RDFI_WINDOWS.map((w, idx) => {
    const cutoff = new Date(now);
    cutoff.setHours(w.etHour, w.etMin, w.etSec, 0);
    const received = now.getTime() >= cutoff.getTime();

    const hhmmss = `${pad(w.etHour)}${pad(w.etMin)}${pad(w.etSec)}`;
    const fileName = `ACH-${todayYMD}${hhmmss}.IN`;

    if (!received) {
      return {
        id: uuid(`rdfi-${todayYMD}-${hhmmss}`),
        fileName,
        windowLabel: w.label,
        status: 'PENDING',
        entries: 0,
        totalCredits: 0,
        totalDebits: 0,
        createdAt: null,
        expectedAtLabel: fmtTimeShortET(cutoff),
        processedAtLabel: null,
        lagSeconds: null,
      };
    }

    const v = RDFI_VOLUMES[idx % RDFI_VOLUMES.length];
    // Real lag from prod: ~5 min between bank's stamped delivery time and FinXact ingest
    const lagMs = 5 * 60 * 1000 + ((idx * 13_000) % 60_000); // 5–6 min jitter
    const created = new Date(cutoff.getTime() + lagMs);

    return {
      id: uuid(`rdfi-${todayYMD}-${hhmmss}`),
      fileName,
      windowLabel: w.label,
      status: 'COMPLETED',
      entries: v.entries,
      totalCredits: v.credits,
      totalDebits: v.debits,
      createdAt: fmtTimestampISO(created),
      expectedAtLabel: fmtTimeShortET(cutoff),
      processedAtLabel: fmtTimeWithSecET(created),
      lagSeconds: lagMs / 1000,
    };
  });

  const totals = files.reduce(
    (acc, f) => {
      if (f.status === 'COMPLETED') {
        acc.entries += f.entries;
        acc.credits += f.totalCredits;
        acc.debits += f.totalDebits;
        acc.completed += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { entries: 0, credits: 0, debits: 0, completed: 0, pending: 0 }
  );

  return { archiveUrl: PROD_ARCHIVE_URLS.rdfi, files, totals };
}

// ---- Recon & Bank Reporting ----
// FinTech File Spec is the daily delivery Jaris sends to First Internet Bank.
// Spec defines 14 distinct files (13 daily + compliance metric monthly).
// Filename convention: yyyymmdd_<program>_<filetype>.csv
//
// File types from the FirstIB FinTech File Specifications workbook:
//   customer, customer_address, customer_phone, customer_id, deposit_account,
//   account_cdd, transaction, card, customer_to_customer_rel,
//   account_to_customer_rel, card_to_customer_rel, subledger_rel,
//   compliance_metric (monthly), complaint (only if new complaints)
const FINTECH_FILE_TYPES = [
  { kind: 'customer',                 description: 'Customer master records',                 cadence: 'daily',         typicalRows: 1_240 },
  { kind: 'customer_address',         description: 'Customer addresses',                      cadence: 'daily',         typicalRows: 1_318 },
  { kind: 'customer_phone',           description: 'Customer phone numbers',                  cadence: 'daily',         typicalRows: 1_402 },
  { kind: 'customer_id',              description: 'Customer identification documents',       cadence: 'daily',         typicalRows: 1_580 },
  { kind: 'deposit_account',          description: 'Deposit account master + EOD balances',   cadence: 'daily',         typicalRows: 2_104 },
  { kind: 'account_cdd',              description: 'Account customer due diligence answers',  cadence: 'daily',         typicalRows: 6_312 },
  { kind: 'transaction',              description: 'Transactions for the prior business day', cadence: 'daily',         typicalRows: 38_420 },
  { kind: 'card',                     description: 'Card master records',                     cadence: 'notApplicable', typicalRows: 0, naReason: 'Jaris does not issue cards' },
  { kind: 'customer_to_customer_rel', description: 'Customer-to-customer relationships',      cadence: 'daily',         typicalRows: 312 },
  { kind: 'account_to_customer_rel',  description: 'Account-to-customer relationships',       cadence: 'daily',         typicalRows: 2_180 },
  { kind: 'card_to_customer_rel',     description: 'Card-to-customer relationships',          cadence: 'notApplicable', typicalRows: 0, naReason: 'Jaris does not issue cards' },
  { kind: 'subledger_rel',            description: 'Subledger-to-ledger relationships',       cadence: 'daily',         typicalRows: 1_902 },
  { kind: 'compliance_metric',        description: 'Monthly compliance metrics',              cadence: 'monthly',       typicalRows: 8 },
  { kind: 'complaint',                description: 'Complaints received (only if any)',       cadence: 'asNeeded',      typicalRows: 0 },
];

function buildFintechFileList(now = new Date()) {
  const yyyymmdd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const program = 'jaris';

  // SLA: all daily files delivered by 7:00 AM ET
  const slaTarget = new Date(now);
  slaTarget.setHours(7, 0, 0, 0);

  // Has the SLA window been reached yet?
  const slaPast = now.getTime() >= slaTarget.getTime();

  // Demo: most ✓, one FAILED (schema), one NOT_YET (past SLA but not delivered)
  const failedKind = 'transaction';                 // schema validation issue today
  const pendingKind = 'account_to_customer_rel';    // late delivery, past SLA

  const isFirstOfMonth = now.getDate() === 1;
  const hasComplaintsToday = false;

  return FINTECH_FILE_TYPES.map((t, idx) => {
    const fileName = `${yyyymmdd}_${program}_${t.kind}.csv`;

    let status, sentAt = null, errorReason = null;
    let rowCount = t.typicalRows;
    let naReason = null;

    // Cadence-driven exemptions
    if (t.cadence === 'notApplicable') {
      status = 'NOT_REQUIRED';
      rowCount = 0;
      naReason = t.naReason;
    } else if (t.cadence === 'monthly' && !isFirstOfMonth) {
      status = 'NOT_REQUIRED';
      rowCount = 0;
      naReason = 'Monthly cadence — first of month only';
    } else if (t.cadence === 'asNeeded' && !hasComplaintsToday) {
      status = 'NOT_REQUIRED';
      rowCount = 0;
      naReason = 'No new complaints today';
    } else if (t.kind === failedKind) {
      status = 'FAILED';
      errorReason = 'Schema validation: 7 rows missing required field "Posted Date"';
      sentAt = new Date(slaTarget.getTime() + (idx * 47_000));
    } else if (t.kind === pendingKind && slaPast) {
      status = 'NOT_YET';
      rowCount = 0;
    } else if (slaPast) {
      status = 'SENT';
      sentAt = new Date(slaTarget.getTime() + 60_000 + (idx * 47_000));
    } else {
      status = 'NOT_YET';
      rowCount = 0;
    }

    const lagSeconds = sentAt ? (sentAt.getTime() - slaTarget.getTime()) / 1000 : null;

    return {
      id: uuid(`fintech-${yyyymmdd}-${t.kind}`),
      kind: t.kind,
      description: t.description,
      cadence: t.cadence,
      fileName,
      status,
      rowCount,
      errorReason,
      naReason,
      expectedAtLabel: fmtTimeShortET(slaTarget),
      sentAtLabel: sentAt ? fmtTimeWithSecET(sentAt) : null,
      lagSeconds,
    };
  });
}

export function buildReconReporting(now = new Date()) {
  const fintechFiles = buildFintechFileList(now);

  const sent       = fintechFiles.filter(f => f.status === 'SENT').length;
  const failed     = fintechFiles.filter(f => f.status === 'FAILED').length;
  const notYet     = fintechFiles.filter(f => f.status === 'NOT_YET').length;
  const notReq     = fintechFiles.filter(f => f.status === 'NOT_REQUIRED').length;

  return {
    fird: {
      name: 'FIRD',
      description: 'Financial Institution Reporting Document — daily reconciliation file from bank',
      generated: true,
      generatedAt: '6:42 a.m. ET',
      reconciled: true,
      reconciledAt: '7:18 a.m. ET',
      balanced: true,
      varianceAmount: 0,
      lineCount: 18_402,
      issues: [],
    },
    fintechFileSpec: {
      name: 'FinTech File Spec',
      description: 'Daily delivery to First Internet Bank of Indiana per FirstIB FinTech File Spec',
      recipient: 'First Internet Bank of Indiana',
      programName: 'jaris',
      expectedAtLabel: '7:00 a.m. ET',
      files: fintechFiles,
      counts: { total: fintechFiles.length, sent, failed, notYet, notReq },
    },
  };
}

// ---- Product flows ----
// Real numbers derived from today's Alacriti transaction export (May 4, 2026, 11:04 AM).
// Per-product rail breakdown drives the operator's view of how each product is processing.
//
// Auto-fallback chains (Jaris services route in this order; ops only sees txns
// after auto-fallback is exhausted):
//   - Loan Funding:        FedNow → RTP → Same-Day ACH → ACH
//   - Instant Payouts:     FedNow → RTP → OCT (Ingo card push)
//   - Managed Settlements: FedNow/RTP (parallel) → Same-Day ACH → ACH
const PRODUCT_FALLBACK_CHAINS = {
  loanFunding:        ['fednow', 'rtp', 'sda', 'ach'],
  instantPayouts:     ['fednow', 'rtp', 'oct'],
  managedSettlements: ['fednow_or_rtp', 'sda', 'ach'],
};

export const RAIL_META = {
  fednow:        { label: 'FedNow',         shortLabel: 'FedNow',  via: 'Alacriti / FinXact' },
  rtp:           { label: 'RTP',            shortLabel: 'RTP',     via: 'Alacriti / FinXact' },
  fednow_or_rtp: { label: 'FedNow or RTP',  shortLabel: 'FN/RTP',  via: 'Alacriti / FinXact' },
  sda:           { label: 'Same-Day ACH',   shortLabel: 'SDA',     via: 'FinXact ODFI' },
  ach:           { label: 'ACH',            shortLabel: 'ACH',     via: 'FinXact ODFI' },
  oct:           { label: 'OCT (card push)', shortLabel: 'OCT',    via: 'Ingo' },
};

export function buildProductFlows() {
  return {
    products: [
      {
        id: 'loanFunding',
        name: 'Loan Funding',
        description: 'Disbursements from Jaris Lending to small business borrowers',
        senderHint: 'Jaris Lending, LLC',
        fallbackChain: PRODUCT_FALLBACK_CHAINS.loanFunding,
        rails: {
          fednow: { count:   1, amount:        27.96, rejected: 0 },
          rtp:    { count:   5, amount:     1_083.33, rejected: 0 },
          ingo:   { count:   0, amount:         0.00, rejected: 0 },
          ach:    { count:   0, amount:         0.00, rejected: 0 },
        },
        avgLatencyMs: 1_240,
      },
      {
        id: 'instantPayouts',
        name: 'Instant Payouts',
        description: 'Partner-routed payments via Integrated Partner Payments',
        senderHint: 'Partner-managed accounts',
        fallbackChain: PRODUCT_FALLBACK_CHAINS.instantPayouts,
        rails: {
          fednow: { count:   0, amount:         0.00, rejected: 0 },
          rtp:    { count:   1, amount:    11_000.00, rejected: 0 },
          ingo:   { count:   0, amount:         0.00, rejected: 0 },
          ach:    { count:   0, amount:         0.00, rejected: 0 },
        },
        avgLatencyMs: 1_640,
      },
      {
        id: 'managedSettlements',
        name: 'Managed Settlements',
        description: 'Merchant outbound transfers from Jaris-managed accounts',
        senderHint: 'Merchant-owned accounts',
        fallbackChain: PRODUCT_FALLBACK_CHAINS.managedSettlements,
        rails: {
          fednow: { count: 119, amount:   857_126.71, rejected: 4, rejectReason: 'AC04 Account Closed' },
          rtp:    { count: 104, amount:   199_735.47, rejected: 0 },
          ingo:   { count:   0, amount:         0.00, rejected: 0 },
          ach:    { count:   0, amount:         0.00, rejected: 0 },
        },
        avgLatencyMs: 1_180,
        rejections: [
          {
            id: 'CRQRXCQZNWW7c9503daa149400490a',
            scheduledAt: 'May 03, 2026 10:45 PM',
            valueDate: 'May 04, 2026',
            senderName: 'NEHA AND NOYAM KHOKHAR Inc',
            senderBank: 'FIRST INTERNET BANK OF INDIANA',
            senderAccountTail: 'EPm',
            recipientName: 'NEHA AND NOYAM KHOKHAR Inc',
            recipientBank: 'US BANK NA',
            recipientAccountTail: '7770',
            amount: 178.47,
            paymentMethod: 'FedNow',
            reasonCode: 'AC04',
            reasonLabel: 'Account Closed',
            // Auto-fallback chain attempted before this hit the operator queue
            fallbackAttempts: [
              { rail: 'fednow_or_rtp', status: 'failed', code: 'AC04', timestamp: '10:45:02 PM' },
              { rail: 'sda',           status: 'failed', code: 'R02',  timestamp: '10:45:14 PM' },
              { rail: 'ach',           status: 'failed', code: 'R02',  timestamp: '10:45:21 PM' },
            ],
          },
          {
            id: 'CRQRXCQZNWWa24046f1d40a433f842',
            scheduledAt: 'May 03, 2026 10:45 PM',
            valueDate: 'May 04, 2026',
            senderName: 'NEHA AND NOYAM KHOKHAR Inc',
            senderBank: 'FIRST INTERNET BANK OF INDIANA',
            senderAccountTail: 'EPm',
            recipientName: 'NEHA AND NOYAM KHOKHAR Inc',
            recipientBank: 'US BANK NA',
            recipientAccountTail: '7770',
            amount: 290.60,
            paymentMethod: 'FedNow',
            reasonCode: 'AC04',
            reasonLabel: 'Account Closed',
            fallbackAttempts: [
              { rail: 'fednow_or_rtp', status: 'failed', code: 'AC04', timestamp: '10:45:02 PM' },
              { rail: 'sda',           status: 'failed', code: 'R02',  timestamp: '10:45:14 PM' },
              { rail: 'ach',           status: 'failed', code: 'R02',  timestamp: '10:45:22 PM' },
            ],
          },
          {
            id: 'CRQRXCQZNWWadfb0bec764843709e5',
            scheduledAt: 'May 03, 2026 10:45 PM',
            valueDate: 'May 04, 2026',
            senderName: 'NEHA AND NOYAM KHOKHAR Inc',
            senderBank: 'FIRST INTERNET BANK OF INDIANA',
            senderAccountTail: 'EPm',
            recipientName: 'NEHA AND NOYAM KHOKHAR Inc',
            recipientBank: 'US BANK NA',
            recipientAccountTail: '7770',
            amount: 163.32,
            paymentMethod: 'FedNow',
            reasonCode: 'AC04',
            reasonLabel: 'Account Closed',
            fallbackAttempts: [
              { rail: 'fednow_or_rtp', status: 'failed', code: 'AC04', timestamp: '10:45:03 PM' },
              { rail: 'sda',           status: 'failed', code: 'R02',  timestamp: '10:45:15 PM' },
              { rail: 'ach',           status: 'failed', code: 'R02',  timestamp: '10:45:23 PM' },
            ],
          },
          {
            id: 'CRQRXCQZNWW166ffe2a48304a1f879',
            scheduledAt: 'May 03, 2026 10:45 PM',
            valueDate: 'May 04, 2026',
            senderName: 'NEHA AND NOYAM KHOKHAR Inc',
            senderBank: 'FIRST INTERNET BANK OF INDIANA',
            senderAccountTail: 'EPm',
            recipientName: 'NEHA AND NOYAM KHOKHAR Inc',
            recipientBank: 'US BANK NA',
            recipientAccountTail: '7770',
            amount: 242.71,
            paymentMethod: 'FedNow',
            reasonCode: 'AC04',
            reasonLabel: 'Account Closed',
            fallbackAttempts: [
              { rail: 'fednow_or_rtp', status: 'failed', code: 'AC04', timestamp: '10:45:03 PM' },
              { rail: 'sda',           status: 'failed', code: 'R02',  timestamp: '10:45:16 PM' },
              { rail: 'ach',           status: 'failed', code: 'R02',  timestamp: '10:45:24 PM' },
            ],
          },
        ],
      },
    ],

    // Aggregate rail health (the FedNow → RTP → Ingo waterfall, summed across products)
    railWaterfall: {
      fednow: { rail: 'FedNow',          provider: 'Alacriti', attempted: 124, succeeded: 120, amount:   857_154.67, avgLatencyMs: 1_120, status: 'warning' },
      rtp:    { rail: 'RTP',             provider: 'Alacriti', attempted: 110, succeeded: 110, amount:   211_818.80, avgLatencyMs: 1_840, status: 'healthy' },
      ingo:   { rail: 'OCT (card push)', provider: 'Ingo',     attempted:   0, succeeded:   0, amount:         0.00, avgLatencyMs: null,  status: 'idle'    },
    },
  };
}
