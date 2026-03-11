# FinOps ACH Dashboard

Internal operations prototype for monitoring ACH processing, Alacriti payment networks (RTP/FedNow), and FIRD reconciliation — built for the Jaris FinOps team.

## Overview

Four-tab dashboard providing real-time operational visibility:

- **ACH** — Event health (38K+ daily events), inbound file timing across 5 batch windows, clickable file detail with NACHA batch/entry records, FIRD file status with parsed settlement positions, scheduler status, and failed event drill-down
- **Alacriti** — RTP and FedNow funds availability with ledger detail, 7-day transaction volume and success rates
- **All Transactions** — Filterable list view across CORE, RTP, and FedNow networks with status/direction/network pill filters and sortable columns; cross-linked from ACH and Alacriti drill-downs
- **Exceptions** — Human-in-the-loop exception resolution queue spanning 8 categories of payment operations exceptions, with full ACH debit decisioning workflow

## FIRD Reconciliation

The FIRD (FedACH Information Return & Delivery) panel parses fixed-width Fed settlement files for RTN 074920912 (subaccount under master 074014187). Clickable file tags expand to show:

- **Header summary** — Opening/closing position, total credits/debits (master account context caveat displayed)
- **Position Records (57xxx)** — Net settlement entries grouped by window (W1–W4) with 5-digit transaction codes, spec-correct labels, and reconciliation source mapping (e.g., `57310 = 0700 OUT credit total`)
- **Item Records (44010)** — Individual FedACH transactions with offset trace ABA, cycle time, and amounts; includes double-count warning (items are a breakout within 57040/57270 received settlement)

Labels and structure follow the FIRD-to-ACH Daily Reconciliation Process doc (v3.0, March 2026).

## ACH File Detail

ACH inbound file tags expand to show NACHA structure:

- Batch accordions with company name, SEC code (PPD/CCD/WEB), entry counts, credit/debit totals
- Entry detail table with trace numbers, masked routing/account numbers, transaction codes (22/27/32/37), status, and return codes (R01–R10)

## Exception Queue

The Exceptions tab provides an operational queue for resolving payment exceptions that require human intervention. Summary cards show counts and priority breakdowns across 8 categories:

| Category | Description |
|----------|-------------|
| **ACH Debit Decisioning** | Inbound ACH debits requiring pay/return/offset decisions before the NACHA return deadline (effective date + 2 banking days) |
| **VAN Exceptions** | Transactions with unmapped or retired Virtual Account Numbers |
| **Reconciliation** | Unmatched transactions, settlement mismatches, time drift, and amount variances with match confidence scores |
| **ACH Processing Errors** | Parse failures, checksum mismatches, and duplicate batch controls |
| **ACH Returns** | Inbound return entries (R01, R02, R10, R29, etc.) requiring review |
| **RTP / FedNow** | Real-time payment timeouts and rejections |
| **Payout Exceptions** | Failed merchant payouts, delinquency blocks, and unconfigured products |
| **Infrastructure Alerts** | System-level issues (DB timeouts, connection pool exhaustion) |

### ACH Debit Decisioning

The primary queue supports a full decision workflow:

- **Expand row** to see entry details, account balance, pending credits, shortfall, and customer's other accounts
- **Pay** — Post the debit (with shortfall warning if insufficient funds)
- **Return** — Select return code (R01–R29) with optional notes
- **Offset & Pay** — Select an offset account to fund the debit, then post
- **Hold** — Defer the decision
- **Escalate** — Route to a supervisor
- **Bulk actions** — Select multiple items for batch Pay All or Return All (R01)
- **Filter** by priority (Critical/High/Medium/Low) and status (Pending/Paid/Returned/Held/Escalated)
- **Deadline countdown** — Color-coded urgency (green >24h, orange <24h, red <2h, pulsing OVERDUE)

## Tech Stack

- React 19 + Vite 7 (JavaScript, no TypeScript)
- State: Context API + useReducer
- Styling: Single `App.css`, no frameworks
- Dependencies: `react` + `react-dom` only
- Service factory pattern with mock/real API toggle

## Project Structure

```
src/
  components/            # UI panels (15 components)
    ACHFileTimeline       # Inbound file timing + batch/entry detail
    FIRDStatus            # FIRD file status + settlement detail
    HealthOverview        # ACH event health with drill links
    SchedulerStatus       # System calendar status table
    FailedEventsDetail    # Failed event error inspection
    FundsAvailability     # RTP/FedNow funds + ledger
    TransactionVolume     # 7-day network success rates
    AllTransactions       # Cross-network transaction list
    ExceptionsDashboard   # Exception queue provider wrapper
    ExceptionsSummary     # 8-category summary cards with priority dots
    ACHDebitQueue         # ACH debit decisioning table + expand/decision flow
    CategoryQueue         # Generic queue table for non-ACH exception categories
    Header                # 4-tab nav + refresh + mock/real toggle
  context/               # DashboardContext, AlacrtiContext, TransactionsContext, ExceptionsContext
  data/                  # Mock data (ACH events, FIRD records, Alacriti, transactions, exceptions)
  services/              # Service factory, mock providers, FinXact API client
```

## Running

```bash
npm install
npm run dev
```

Dev server starts on `http://localhost:5173`. Use `--host 127.0.0.1` for preview tooling.
