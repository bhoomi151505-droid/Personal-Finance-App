# Cogni Wealth – AI-Powered Personal Financial Intelligence Platform

> **Inspired by Cogniflow AI Analytics & Explainability Engine**  
> An enterprise-grade, intelligent financial decision-support and personal money management platform.

---

## 1. Executive Summary & Architecture Overview

**Cogni Wealth** upgrades traditional personal finance tools into an explainable, context-aware intelligence operating system. Built upon actual database records and deterministic mathematical engines, it ensures **zero fabricated AI reasoning**, complete transparency across connected payment channels, and multi-horizon simulation capabilities.

### Key Architectural Pillars:
* **Backend Core**: High-performance Python FastAPI service with ACID-compliant SQLite WAL persistence (`backend/money_copilot.db`).
* **Frontend Design**: Cogniflow-inspired fintech interface featuring deep navy backgrounds (`#070b14`), glassmorphism panels, violet/electric blue/cyan accents, and Chart.js financial charts.
* **Compatibility & Data Integrity**: 100% backward compatible with canonical user data (`demo-user` / Ananya Rao), preserving all original records while expanding intelligence depth.

---

## 2. The 13 Full-Featured Functional Modules

| # | Module | Core Capabilities |
|---|---|---|
| **1** | **Overview** | 8 real-time KPIs (Income, Expenses, Savings, Savings Rate, Net Worth, Available Balance, Portfolio Value, Cash Flow), circular Financial Health Score (0-100), Cash Flow area chart, and Category donut breakdown. |
| **2** | **Transactions** | Canonical ledger, multi-field filtering, fuzzy duplicate detection engine with confidence scoring, Add/Edit transaction modal, and CSV export. |
| **3** | **Analytics** | Category spending distribution, payment source breakdowns, counterparty merchant analytics, and verified reporting. |
| **4** | **AI Money Coach** | Context-aware conversational assistant grounded in actual database records, citing specific transactions with deep-link navigation. |
| **5** | **Financial Rules** | **RuleGPT** natural language instruction compiler that converts human instructions into deterministic backend monitors and generates real-time alerts. |
| **6** | **Anomaly Detection** | Statistical Z-score outlier detection (z > 1.8), duplicate charge alerts, and **Section 10 Behavioral Drift Detection** (30d vs 90d baseline shifts). |
| **7** | **Simulation Lab** | Multi-horizon what-if scenarios (Conservative, Expected, Optimistic trajectories), emergency fund milestone calculations, and scenario saving. |
| **8** | **Budget & Goals** | Category spending caps with dynamic spent calculation, visual progress rings, and target completion horizons. |
| **9** | **Investment Intelligence** | Mode A (Self-Directed asset allocation & diversification index) and Mode B (Automated planning with 10-year Indian asset class historical benchmarks). |
| **10** | **Financial History** | **Financial Time Machine** with 10-month historical snapshots (Jan - Oct 2026), side-by-side month comparison tool with deltas, and verified milestones. |
| **11** | **Recommendation Lab** | **Shadow Reviewer** conducting side-by-side strategy stress testing (e.g. 100% Cash vs 60/40 Equity) across 5 trade-off dimensions. |
| **12** | **Security & Audit** | Immutable audit timeline, permission management, connected payment source inclusion toggles, and user consent controls. |
| **13** | **Settings & Memory** | User profile preferences, **Personal Financial Memory** (view/edit/delete/reset stored context), and demo workspace reset controls. |

---

## 3. Explainable Financial Health Score (Section 3)

The Financial Health Score (out of 100) is calculated deterministically across 6 weighted diagnostic criteria:
1. **Savings Behavior (20%)**: Based on net savings rate (>= 35% earns full 20 pts).
2. **Expense Management (20%)**: Operating expenses as a percentage of income (<= 45% earns full 20 pts).
3. **Debt Management (15%)**: Verified absence of high-interest revolving consumer debt.
4. **Emergency Fund Adequacy (15%)**: Liquid reserves covering 6+ months of essential expenses.
5. **Investment Consistency (15%)**: Automated recurring index fund SIP execution.
6. **Budget Discipline (15%)**: Ratio of active category budgets adhering to spending limits.

*Disclaimer: Informational index for personal decision-support only. Not a formal credit rating or investment guarantee.*

---

## 4. RuleGPT: Natural Language Financial Rules (Section 4)

Users formulate rules in plain English:
* *"Alert me when my shopping expenses exceed ₹5,000 in a month"*
* *"Notify me when I spend more than ₹2,000 in one transaction"*
* *"Alert me when 80% of my monthly food budget is used"*

RuleGPT parses the intent into structured JSON (`category`, `metric`, `operator`, `threshold`, `action_type`, `severity`), displays an editable review card, and activates it in the database. When transactions are added or updated, the backend rule evaluation engine evaluates conditions and records immutable execution logs.

---

## 5. Intelligent Duplicate Detection (Section 14)

Scans transactions using temporal and deterministic matching:
* Evaluates merchant similarity, identical amount, time window (< 24 hours), and payment source.
* Flags suspects with confidence score (e.g. 94% on double Swiggy swipe).
* Allows users to:
  * **Confirm Duplicate**: Sets `canonical = 0` to prevent skewing analytics.
  * **Mark as Separate**: Explicitly acknowledges legitimate consecutive charges.
  * **Dismiss Flag**: Clears alert.

---

## 6. How to Run the Platform

### Prerequisites
* Python 3.10+ (Tested on Python 3.13)
* Dependencies installed: `pip install -r requirements.txt`

### Launch Command
```powershell
python run_server.py
```

### Accessing the Platform
* **Web Application UI**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **Interactive FastAPI Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **API Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 7. Connection Transparency & Integration Status

* **Payment Sources (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay)**: Supported via permission-based ingestion preferences and bank statement imports. A browser-based web application cannot silently scan local mobile device application sandboxes; connection states and inclusion toggles are explicitly disclosed.
* **Investment Execution**: Clearly designated as simulated workflow architecture for educational decision-support. No real-world broker orders or capital transfers are triggered without regulated credentials.
