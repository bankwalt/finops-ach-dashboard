// Mock data for Retry Monitor view
// Models the retry decision engine for Loan Funding and Instant Payouts
//
// Business rules:
//   Loan Funding:  FedNow or RTP (pick one), max 5 retries in 1 hr, fallback → Same-Day ACH
//   Instant Payout: OCT first (3 attempts), then FedNow (3), then RTP (3), 5-min window
//   All real-time rails are near-synchronous — attempts are success or failed, never pending

const LOAN_PRIMARY_RAILS = ['FedNow', 'RTP'];
const LOAN_FALLBACK_RAIL = 'Same-Day ACH';
const PAYOUT_RAILS = ['OCT', 'FedNow', 'RTP']; // cascade order for instant payouts

const TRANSIENT_ERRORS = [
  { code: 'TIMEOUT', message: 'Network timeout - no response within 2s' },
  { code: 'HTTP_502', message: 'Bad gateway from processor' },
  { code: 'HTTP_503', message: 'Service temporarily unavailable' },
  { code: 'CONN_RESET', message: 'Connection reset by peer' },
  { code: 'DNS_FAIL', message: 'DNS resolution failure' },
];

const HARD_ERRORS = [
  { code: 'ACCT_CLOSED', message: 'Destination account closed' },
  { code: 'INVALID_RTN', message: 'Invalid routing number' },
  { code: 'OFAC_HOLD', message: 'OFAC compliance hold' },
  { code: 'ACCT_FROZEN', message: 'Account frozen by institution' },
  { code: 'INVALID_ACCT', message: 'Account number does not exist' },
];

const SOFT_ERRORS = [
  { code: 'RATE_LIMIT', message: 'Rate limit exceeded (429)' },
  { code: 'DAILY_CAP', message: 'Daily volume cap reached' },
  { code: 'WINDOW_CLOSED', message: 'Batch processing window closed' },
];

const FIRST_NAMES = ['James', 'Maria', 'Robert', 'Patricia', 'David', 'Jennifer', 'Michael', 'Linda', 'William', 'Sarah', 'Carlos', 'Aisha', 'Wei', 'Priya', 'Omar'];
const LAST_NAMES = ['Thompson', 'Rodriguez', 'Chen', 'Patel', 'Williams', 'Kim', 'Martinez', 'Johnson', 'Okafor', 'Singh', 'Anderson', 'Garcia', 'Lee', 'Brown', 'Davis'];

const OPS_USERS = ['jsmith@bank.com', 'agarcia@bank.com', 'mchen@bank.com', 'kwilliams@bank.com'];
const RESOLUTION_NOTES = [
  'Routed via alternative platform - Dwolla. Confirmation #DW-29384',
  'Manual wire transfer initiated. Fed ref #F20260319001',
  'Re-routed through Synapse. Confirmation #SYN-84712',
  'Contacted receiving institution directly. Cleared via manual credit. Ref #MC-55190',
  'Submitted as individual Same-Day ACH outside engine. Trace #0839201847362',
  'Escalated to partner bank ops. Completed via internal book transfer. Ref #BT-10294',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randAmt(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function randId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

function minutesAgo(m) { return new Date(Date.now() - m * 60000).toISOString(); }

// Near-synchronous response time: 200-2000ms
function rtResponseMs() { return Math.floor(Math.random() * 1800) + 200; }

function generateAttempt(rail, status, error, ts) {
  return {
    id: randId('att'),
    rail,
    status, // 'failed' | 'success' — near-synchronous, no pending
    error: error || null,
    timestamp: ts,
    idempotency_key: randId('idem'),
    response_time_ms: rtResponseMs(),
  };
}

// Pick a primary rail for a loan funding chain (FedNow or RTP, consistent per chain)
function pickLoanPrimaryRail() {
  return pick(LOAN_PRIMARY_RAILS);
}

function generateRetryChain(opts = {}) {
  const type = opts.type || (Math.random() > 0.4 ? 'instant_payout' : 'loan_funding');
  const isInstant = type === 'instant_payout';
  const amount = isInstant ? randAmt(50, 5000) : randAmt(5000, 250000);
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

  const correlationId = randId(isInstant ? 'IP' : 'LF');
  const routingNumber = '0' + Math.floor(Math.random() * 90000000 + 10000000);
  const accountLast4 = String(Math.floor(Math.random() * 9000) + 1000);

  // For loan funding, pick a single primary rail for this chain
  const loanPrimary = pickLoanPrimaryRail();

  const attempts = [];
  const notifications = [];
  let finalStatus = opts.finalStatus || pick(['resolved', 'resolved', 'resolved', 'escalated', 'hard_decline', 'fallback', 'manual']);
  let startTime = opts.startMinutesAgo || (finalStatus === 'fallback' ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 1400) + 5);

  const baseChain = {
    correlation_id: correlationId,
    type,
    amount,
    recipient_name: name,
    recipient_routing: routingNumber,
    recipient_account_last4: accountLast4,
    created_at: minutesAgo(startTime),
  };

  // ---------- hard_decline ----------
  if (finalStatus === 'hard_decline') {
    const rail = isInstant ? PAYOUT_RAILS[0] : loanPrimary;
    const err = pick(HARD_ERRORS);
    attempts.push(generateAttempt(rail, 'failed', err, minutesAgo(startTime)));
    notifications.push({
      type: 'hard_decline',
      message: `Transaction cannot be processed: ${err.message}. Please verify account details.`,
      timestamp: minutesAgo(startTime - 0.01),
      channel: 'email',
    });
    return {
      ...baseChain,
      status: 'hard_decline',
      error_category: 'hard_decline',
      attempts,
      notifications,
      resolved_at: minutesAgo(startTime - 0.01),
      total_duration_ms: Math.floor(Math.random() * 1800) + 200,
    };
  }

  // ---------- escalated ----------
  if (finalStatus === 'escalated') {
    let t = startTime;
    if (isInstant) {
      // OCT x3, FedNow x3, RTP x3 = 9 attempts max
      for (const rail of PAYOUT_RAILS) {
        for (let i = 0; i < 3; i++) {
          const err = pick([...TRANSIENT_ERRORS, ...SOFT_ERRORS]);
          attempts.push(generateAttempt(rail, 'failed', err, minutesAgo(t)));
          t -= 0.3; // ~18s between attempts, fits in 5-min window
        }
      }
    } else {
      // Loan: 5 attempts on primary rail, then fallback also failed
      for (let i = 0; i < 5; i++) {
        const err = pick(TRANSIENT_ERRORS);
        attempts.push(generateAttempt(loanPrimary, 'failed', err, minutesAgo(t)));
        t -= 10; // spread across 1hr window
      }
      // Fallback Same-Day ACH also failed
      const err = pick(SOFT_ERRORS);
      attempts.push(generateAttempt(LOAN_FALLBACK_RAIL, 'failed', err, minutesAgo(t)));
      t -= 0.5;
    }
    notifications.push({
      type: 'delay',
      message: "We're unable to process your payment at this time. We'll notify you once complete.",
      timestamp: minutesAgo(t + 0.5),
      channel: 'sms',
    });
    return {
      ...baseChain,
      status: 'escalated',
      error_category: 'transient',
      attempts,
      notifications,
      resolved_at: null,
      total_duration_ms: null,
    };
  }

  // ---------- manual ----------
  if (finalStatus === 'manual') {
    // Similar to escalated but an ops person has picked it up
    let t = startTime;
    if (isInstant) {
      for (const rail of PAYOUT_RAILS) {
        for (let i = 0; i < 3; i++) {
          const err = pick([...TRANSIENT_ERRORS, ...SOFT_ERRORS]);
          attempts.push(generateAttempt(rail, 'failed', err, minutesAgo(t)));
          t -= 0.3;
        }
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const err = pick(TRANSIENT_ERRORS);
        attempts.push(generateAttempt(loanPrimary, 'failed', err, minutesAgo(t)));
        t -= 10;
      }
      const err = pick(SOFT_ERRORS);
      attempts.push(generateAttempt(LOAN_FALLBACK_RAIL, 'failed', err, minutesAgo(t)));
    }
    notifications.push({
      type: 'delay',
      message: "We're unable to process your payment at this time. An operator is resolving this manually.",
      timestamp: minutesAgo(t + 0.5),
      channel: 'sms',
    });
    return {
      ...baseChain,
      status: 'manual',
      error_category: 'transient',
      attempts,
      notifications,
      resolved_at: null,
      total_duration_ms: null,
      resolved_by: pick(OPS_USERS),
    };
  }

  // ---------- fallback ----------
  if (finalStatus === 'fallback') {
    // Primary rail(s) failed, currently trying alternate rail
    let t = startTime;
    if (isInstant) {
      // OCT failed 3 times, now trying FedNow
      for (let i = 0; i < 3; i++) {
        const err = pick(TRANSIENT_ERRORS);
        attempts.push(generateAttempt('OCT', 'failed', err, minutesAgo(t)));
        t -= 0.2;
      }
      // Succeeded on FedNow
      attempts.push(generateAttempt('FedNow', 'success', null, minutesAgo(t)));
    } else {
      // Loan primary failed, fell back to Same-Day ACH and succeeded
      const failCount = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < failCount; i++) {
        const err = pick(TRANSIENT_ERRORS);
        attempts.push(generateAttempt(loanPrimary, 'failed', err, minutesAgo(t)));
        t -= 10;
      }
      attempts.push(generateAttempt(LOAN_FALLBACK_RAIL, 'success', null, minutesAgo(t)));
    }
    const settledRail = attempts[attempts.length - 1].rail;
    notifications.push({
      type: 'alternate_rail',
      message: `Your payment was processed via ${settledRail}${settledRail === LOAN_FALLBACK_RAIL ? '. Funds expected by end of day.' : '.'}`,
      timestamp: minutesAgo(t - 0.5),
      channel: Math.random() > 0.5 ? 'sms' : 'email',
    });
    return {
      ...baseChain,
      status: 'fallback',
      error_category: 'transient',
      settled_rail: settledRail,
      attempts,
      notifications,
      resolved_at: minutesAgo(t),
      total_duration_ms: (startTime - t) * 60000,
    };
  }

  // ---------- resolved ----------
  // Some resolved chains were manually resolved (have resolution_note), some resolved via automated retry
  const wasManuallyResolved = opts.manuallyResolved || false;
  const failCount = Math.floor(Math.random() * 5) + 1;
  let t = startTime;

  if (isInstant) {
    // Cascade through OCT → FedNow → RTP
    let railIdx = 0;
    let attemptsOnRail = 0;
    for (let i = 0; i < failCount; i++) {
      const err = pick([...TRANSIENT_ERRORS, ...SOFT_ERRORS]);
      attempts.push(generateAttempt(PAYOUT_RAILS[railIdx], 'failed', err, minutesAgo(t)));
      t -= 0.2;
      attemptsOnRail++;
      if (attemptsOnRail >= 3 && railIdx < PAYOUT_RAILS.length - 1) {
        railIdx++;
        attemptsOnRail = 0;
      }
    }
    // Succeed on current or next rail
    if (Math.random() > 0.5 && railIdx < PAYOUT_RAILS.length - 1) {
      railIdx++;
    }
    attempts.push(generateAttempt(PAYOUT_RAILS[railIdx], 'success', null, minutesAgo(t)));
  } else {
    // Loan funding: try primary, maybe fall back to Same-Day ACH
    let usedFallback = false;
    for (let i = 0; i < failCount; i++) {
      const rail = i >= 4 ? LOAN_FALLBACK_RAIL : loanPrimary;
      if (i >= 4) usedFallback = true;
      const err = pick([...TRANSIENT_ERRORS, ...SOFT_ERRORS]);
      attempts.push(generateAttempt(rail, 'failed', err, minutesAgo(t)));
      t -= 10;
    }
    const successRail = (failCount >= 4 || Math.random() > 0.7) ? LOAN_FALLBACK_RAIL : loanPrimary;
    attempts.push(generateAttempt(successRail, 'success', null, minutesAgo(t)));
  }

  const settledRail = attempts[attempts.length - 1].rail;
  const usedAlternateRail = isInstant
    ? settledRail !== 'OCT'
    : settledRail === LOAN_FALLBACK_RAIL;

  if (usedAlternateRail) {
    notifications.push({
      type: 'alternate_rail',
      message: `Your payment was processed via ${settledRail}${settledRail === LOAN_FALLBACK_RAIL ? '. Funds expected by end of day.' : '.'}`,
      timestamp: minutesAgo(t - 0.5),
      channel: Math.random() > 0.5 ? 'sms' : 'email',
    });
  }

  const chain = {
    ...baseChain,
    status: 'resolved',
    error_category: failCount > 0 ? 'transient' : null,
    settled_rail: settledRail,
    attempts,
    notifications,
    resolved_at: minutesAgo(t),
    total_duration_ms: (startTime - t) * 60000,
  };

  if (wasManuallyResolved) {
    chain.resolution_note = pick(RESOLUTION_NOTES);
    chain.resolved_by = pick(OPS_USERS);
  }

  return chain;
}

function generateRetryData() {
  const chains = [];

  // Escalated (2-4)
  const escCount = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < escCount; i++) {
    chains.push(generateRetryChain({ finalStatus: 'escalated', startMinutesAgo: Math.floor(Math.random() * 60) + 6 }));
  }

  // Manual — ops is actively working these (2-4)
  const manualCount = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < manualCount; i++) {
    chains.push(generateRetryChain({ finalStatus: 'manual', startMinutesAgo: Math.floor(Math.random() * 120) + 10 }));
  }

  // Fallback — primary failed, succeeded on alternate rail (3-6)
  const fbCount = Math.floor(Math.random() * 4) + 3;
  for (let i = 0; i < fbCount; i++) {
    chains.push(generateRetryChain({ finalStatus: 'fallback', startMinutesAgo: Math.floor(Math.random() * 300) + 5 }));
  }

  // Hard declines (2-4)
  const hdCount = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < hdCount; i++) {
    chains.push(generateRetryChain({ finalStatus: 'hard_decline', startMinutesAgo: Math.floor(Math.random() * 300) + 10 }));
  }

  // Resolved via automated retry (15-25)
  const autoResolvedCount = Math.floor(Math.random() * 11) + 15;
  for (let i = 0; i < autoResolvedCount; i++) {
    chains.push(generateRetryChain({ finalStatus: 'resolved', startMinutesAgo: Math.floor(Math.random() * 1400) + 5 }));
  }

  // Resolved via manual intervention — has resolution_note (3-6)
  const manualResolvedCount = Math.floor(Math.random() * 4) + 3;
  for (let i = 0; i < manualResolvedCount; i++) {
    chains.push(generateRetryChain({ finalStatus: 'resolved', manuallyResolved: true, startMinutesAgo: Math.floor(Math.random() * 1400) + 30 }));
  }

  chains.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return chains;
}

function computeRetryStats(chains) {
  const escalated = chains.filter(c => c.status === 'escalated');
  const manual = chains.filter(c => c.status === 'manual');
  const fallback = chains.filter(c => c.status === 'fallback');
  const resolved = chains.filter(c => c.status === 'resolved');
  const hardDecline = chains.filter(c => c.status === 'hard_decline');

  const totalAttempts = chains.reduce((s, c) => s + c.attempts.length, 0);
  const avgAttempts = chains.length > 0 ? Math.round((totalAttempts / chains.length) * 10) / 10 : 0;

  const resolvedDurations = [...resolved, ...fallback].filter(c => c.total_duration_ms).map(c => c.total_duration_ms);
  const avgResolutionMs = resolvedDurations.length > 0
    ? Math.round(resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length)
    : 0;

  const railUsage = {};
  chains.forEach(c => {
    c.attempts.forEach(a => {
      railUsage[a.rail] = (railUsage[a.rail] || 0) + 1;
    });
  });

  const successfulChains = resolved.length + fallback.length;
  const successRate = chains.length > 0
    ? Math.round(((successfulChains / chains.length) * 100) * 10) / 10
    : 0;

  const firstAttemptSuccess = chains.filter(c => c.attempts.length === 1 && c.attempts[0].status === 'success').length;

  const instantPayouts = chains.filter(c => c.type === 'instant_payout');
  const loanFunding = chains.filter(c => c.type === 'loan_funding');

  return {
    escalated_count: escalated.length,
    fallback_count: fallback.length,
    manual_count: manual.length,
    resolved_count: resolved.length,
    hard_decline_count: hardDecline.length,
    total_count: chains.length,
    success_rate: successRate,
    avg_attempts: avgAttempts,
    avg_resolution_ms: avgResolutionMs,
    first_attempt_success: firstAttemptSuccess,
    rail_usage: railUsage,
    by_type: {
      instant_payout: {
        total: instantPayouts.length,
        resolved: instantPayouts.filter(c => c.status === 'resolved').length,
        fallback: instantPayouts.filter(c => c.status === 'fallback').length,
        escalated: instantPayouts.filter(c => c.status === 'escalated').length,
        manual: instantPayouts.filter(c => c.status === 'manual').length,
        hard_decline: instantPayouts.filter(c => c.status === 'hard_decline').length,
        total_amount: Math.round(instantPayouts.reduce((s, c) => s + c.amount, 0) * 100) / 100,
      },
      loan_funding: {
        total: loanFunding.length,
        resolved: loanFunding.filter(c => c.status === 'resolved').length,
        fallback: loanFunding.filter(c => c.status === 'fallback').length,
        escalated: loanFunding.filter(c => c.status === 'escalated').length,
        manual: loanFunding.filter(c => c.status === 'manual').length,
        hard_decline: loanFunding.filter(c => c.status === 'hard_decline').length,
        total_amount: Math.round(loanFunding.reduce((s, c) => s + c.amount, 0) * 100) / 100,
      },
    },
    escalated_total_amount: Math.round(escalated.reduce((s, c) => s + c.amount, 0) * 100) / 100,
    manual_total_amount: Math.round(manual.reduce((s, c) => s + c.amount, 0) * 100) / 100,
    fallback_total_amount: Math.round(fallback.reduce((s, c) => s + c.amount, 0) * 100) / 100,
  };
}

let _retryData = null;
let _retryStats = null;

export function getRetryData() {
  if (!_retryData) {
    _retryData = generateRetryData();
    _retryStats = computeRetryStats(_retryData);
  }
  return { chains: _retryData, stats: _retryStats };
}

export function getRetryChain(correlationId) {
  if (!_retryData) getRetryData();
  return _retryData.find(c => c.correlation_id === correlationId) || null;
}
