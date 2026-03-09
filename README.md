# FinOps ACH Dashboard

Internal operations prototype for monitoring ACH processing, Alacriti payment networks (RTP/FedNow), and FIRD reconciliation — built for the Jaris FinOps team.

## Overview

Three-tab dashboard providing real-time operational visibility:

- **ACH** — Event health (38K+ daily events), inbound file timing across 5 batch windows, clickable file detail with NACHA batch/entry records, FIRD file status with parsed settlement positions, scheduler status, and failed event drill-down
- **Alacriti** — RTP and FedNow funds availability with ledger detail, 7-day transaction volume and success rates
- **All Transactions** — Filterable list view across CORE, RTP, and FedNow networks with status/direction/network pill filters and sortable columns; cross-linked from ACH and Alacriti drill-downs

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

## Tech Stack

- React 19 + Vite 7 (JavaScript, no TypeScript)
- State: Context API + useReducer
- Styling: Single `App.css`, no frameworks
- Dependencies: `react` + `react-dom` only
- Service factory pattern with mock/real API toggle

## Project Structure

```
src/
  components/        # UI panels (11 components)
    ACHFileTimeline   # Inbound file timing + batch/entry detail
    FIRDStatus        # FIRD file status + settlement detail
    HealthOverview    # ACH event health with drill links
    SchedulerStatus   # System calendar status table
    FailedEventsDetail # Failed event error inspection
    FundsAvailability # RTP/FedNow funds + ledger
    TransactionVolume # 7-day network success rates
    AllTransactions   # Cross-network transaction list
    Header            # 3-tab nav + refresh + mock/real toggle
  context/           # DashboardContext, AlacrtiContext, TransactionsContext
  data/              # Mock data (ACH events, FIRD records, Alacriti, transactions)
  services/          # Service factory, mock providers, FinXact API client
```

## Running

```bash
npm install
npm run dev
```

Dev server starts on `http://localhost:5173`. Use `--host 127.0.0.1` for preview tooling.
