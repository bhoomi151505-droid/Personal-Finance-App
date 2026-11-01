/**
 * Money Copilot - Enterprise Client Application Engine
 * Connects all 13 modules to backend REST APIs with Chart.js visualizations
 */

const API = "/api";
let currentPage = "Overview";
let dashboardData = null;
let paymentSources = [];
let chartInstances = {};
let activePeriod = "This month";

// Utility: INR Currency Formatter
function money(val) {
  const n = Math.round(Number(val) || 0);
  return `₹${n.toLocaleString("en-IN")}`;
}

// Utility: Format Date
function formatDate(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return isoStr.slice(0, 10);
  }
}

// Initialize Application
async function initApp() {
  try {
    await loadDashboardData();
    await loadPaymentSources();
    await checkUnreadAnomalies();
    navigate("Overview");
  } catch (err) {
    console.error("Initialization error:", err);
    document.getElementById("app-content").innerHTML = `
      <div class="panel" style="text-align:center; padding:50px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:32px; color:var(--accent-red); margin-bottom:14px;"></i>
        <h2>Failed to connect to backend</h2>
        <p style="color:var(--text-muted); margin-top:8px;">Ensure run_server.py is running on http://127.0.0.1:8000</p>
        <button class="btn-primary" style="margin-top:16px;" onclick="initApp()">Retry Connection</button>
      </div>
    `;
  }
}

// Fetch Core Dashboard Summary
async function loadDashboardData() {
  const res = await fetch(`${API}/dashboard?period=${encodeURIComponent(activePeriod)}`);
  dashboardData = await res.json();
}

// Fetch Payment Sources
async function loadPaymentSources() {
  const res = await fetch(`${API}/payment-sources`);
  paymentSources = await res.json();
}

// Check Unread Anomalies for Notification Badge
async function checkUnreadAnomalies() {
  try {
    const res = await fetch(`${API}/anomalies`);
    const alerts = await res.json();
    const unread = alerts.filter(a => a.status === "unread");
    
    const badge = document.getElementById("anomaly-badge");
    const counter = document.getElementById("notif-counter");
    
    if (unread.length > 0) {
      badge.textContent = unread.length;
      badge.style.display = "inline-block";
      counter.textContent = unread.length;
      counter.style.display = "grid";
    } else {
      badge.style.display = "none";
      counter.style.display = "none";
    }

    // Populate Notif Drawer
    const listEl = document.getElementById("notif-list");
    if (alerts.length === 0) {
      listEl.innerHTML = `<div style="font-size:11px; color:var(--text-dim); text-align:center; padding:10px;">No alerts</div>`;
    } else {
      listEl.innerHTML = alerts.slice(0, 5).map(a => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-line); border-radius:8px; padding:8px 10px; font-size:11px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <b style="color:#fff;">${a.title}</b>
            <span class="badge ${a.severity}">${a.severity}</span>
          </div>
          <p style="color:var(--text-muted); font-size:10px; margin:0;">${a.reason}</p>
        </div>
      `).join("");
    }
  } catch (e) {
    console.error("Alert check error:", e);
  }
}

// Clean up existing Chart.js instances
function destroyCharts() {
  Object.keys(chartInstances).forEach(key => {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
      delete chartInstances[key];
    }
  });
}

// Master Navigation Handler
async function navigate(page) {
  currentPage = page;
  destroyCharts();

  // Update active sidebar state
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`nav-${page}`);
  if (activeBtn) activeBtn.classList.add("active");

  // Update breadcrumb
  const crumbTitles = {
    Overview: "Financial Intelligence Overview",
    Transactions: "Advanced Transaction Intelligence",
    Analytics: "Financial Analytics & Cash Flow Reporting",
    AICoach: "AI Money Coach & Conversational Intelligence",
    FinancialRules: "RuleGPT Automated Financial Rule Builder",
    AnomalyDetection: "Multi-Factor Anomaly & Spending Drift Engine",
    Simulation: "Financial What-If Simulator & Scenarios Lab",
    BudgetGoals: "Dynamic Category Budgets & Savings Goals",
    InvestmentIntel: "Investment Intelligence & Portfolio Planning",
    TimeMachine: "Financial History & Time Machine Tracker",
    RecommendationLab: "Shadow Reviewer & Strategy Comparison Lab",
    SecurityAudit: "Security, Privacy Controls & Audit Timeline",
    Settings: "Workspace Settings & Personal Financial Memory"
  };
  document.getElementById("current-crumb").textContent = crumbTitles[page] || page;

  const contentArea = document.getElementById("app-content");

  switch (page) {
    case "Overview":
      await renderOverview(contentArea);
      break;
    case "Transactions":
      await renderTransactions(contentArea);
      break;
    case "Analytics":
      await renderAnalytics(contentArea);
      break;
    case "AICoach":
      await renderAICoach(contentArea);
      break;
    case "FinancialRules":
      await renderFinancialRules(contentArea);
      break;
    case "AnomalyDetection":
      await renderAnomalyDetection(contentArea);
      break;
    case "Simulation":
      await renderSimulation(contentArea);
      break;
    case "BudgetGoals":
      await renderBudgetGoals(contentArea);
      break;
    case "InvestmentIntel":
      await renderInvestmentIntel(contentArea);
      break;
    case "TimeMachine":
      await renderTimeMachine(contentArea);
      break;
    case "RecommendationLab":
      await renderRecommendationLab(contentArea);
      break;
    case "SecurityAudit":
      await renderSecurityAudit(contentArea);
      break;
    case "Settings":
      await renderSettings(contentArea);
      break;
    default:
      await renderOverview(contentArea);
  }
}

// ==========================================
// 1. OVERVIEW DASHBOARD (Section 3)
// ==========================================
async function renderOverview(container) {
  await loadDashboardData();
  const d = dashboardData;
  const hs = d.health_score;

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="eyebrow"><i class="fa-solid fa-satellite-dish"></i> Financial Command Center · Real-Time Intelligence</div>
        <h1>Good morning, Ananya ✦</h1>
        <p>Your complete AI-powered financial overview, health diagnostics and canonical cash flow.</p>
      </div>
      <button class="btn-secondary" onclick="openHealthModal()">
        <i class="fa-solid fa-heart-pulse" style="color:var(--accent-green);"></i> Explain Health Score
      </button>
    </div>

    <!-- Health Score Gauge Banner -->
    <div class="health-gauge-card">
      <div class="score-circle" style="--pct: ${hs.score}%;">
        <div class="score-inner">
          <b>${hs.score}</b>
          <small>/ 100</small>
        </div>
      </div>
      <div class="gauge-details">
        <span class="gauge-tag"><i class="fa-solid fa-shield-halved"></i> ${hs.tier}</span>
        <h2>Explainable Financial Health Index</h2>
        <p>${hs.summary}</p>
        <div style="display:flex; gap:16px; margin-top:10px; font-size:11px; color:var(--text-dim); flex-wrap:wrap;">
          ${hs.factors.map(f => `
            <span><i class="fa-solid fa-circle-check" style="color:var(--accent-green); font-size:9px;"></i> <b>${f.name}:</b> ${f.score}/${f.max_score} (${f.status})</span>
          `).join("")}
        </div>
      </div>
    </div>

    <!-- 8 Financial KPIs Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-top"><span>Total Income</span><div class="kpi-icon"><i class="fa-solid fa-arrow-trend-up"></i></div></div>
        <strong>${money(d.income)}</strong>
        <div class="kpi-meta positive"><i class="fa-solid fa-arrow-up"></i> 12.4% vs previous period</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Total Expenses</span><div class="kpi-icon" style="color:var(--accent-red); background:rgba(239,68,68,0.1);"><i class="fa-solid fa-arrow-trend-down"></i></div></div>
        <strong>${money(d.expense)}</strong>
        <div class="kpi-meta"><i class="fa-solid fa-circle" style="font-size:7px;"></i> ${d.categories.length} active categories</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Net Savings</span><div class="kpi-icon" style="color:var(--accent-green); background:rgba(16,185,129,0.1);"><i class="fa-solid fa-indian-rupee-sign"></i></div></div>
        <strong>${money(d.savings)}</strong>
        <div class="kpi-meta positive"><i class="fa-solid fa-arrow-up"></i> +₹8,321 vs Jan 2026</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Savings Rate</span><div class="kpi-icon" style="color:var(--accent-cyan); background:rgba(6,182,212,0.1);"><i class="fa-solid fa-bolt"></i></div></div>
        <strong>${d.savings_rate}%</strong>
        <div class="kpi-meta positive"><i class="fa-solid fa-circle-check"></i> Benchmark > 30% met</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Net Worth</span><div class="kpi-icon"><i class="fa-solid fa-vault"></i></div></div>
        <strong>${money(d.net_worth)}</strong>
        <div class="kpi-meta positive"><i class="fa-solid fa-arrow-up"></i> +₹4.32L this year</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Available Balance</span><div class="kpi-icon"><i class="fa-solid fa-wallet"></i></div></div>
        <strong>${money(d.available_balance)}</strong>
        <div class="kpi-meta">Liquid checking & savings</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Investment Portfolio</span><div class="kpi-icon" style="color:var(--accent-violet); background:rgba(139,92,246,0.1);"><i class="fa-solid fa-chart-pie"></i></div></div>
        <strong>${money(d.investment_portfolio_value)}</strong>
        <div class="kpi-meta">Nifty 50 Index SIP + Capital</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Monthly Cash Flow</span><div class="kpi-icon"><i class="fa-solid fa-money-bill-transfer"></i></div></div>
        <strong>${money(d.monthly_cash_flow)}</strong>
        <div class="kpi-meta positive">Surplus cash retention</div>
      </div>
    </div>

    <!-- Charts Row: Cash Flow Area + Category Donut -->
    <div class="grid-2col">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Cash Flow Dynamics</h3>
            <span>Inflows vs Outflows across October</span>
          </div>
          <div style="font-size:11px; color:var(--text-dim);">
            <span style="color:var(--accent-green); margin-right:12px;"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Income</span>
            <span style="color:var(--accent-blue);"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Expense</span>
          </div>
        </div>
        <div style="height:250px; position:relative;">
          <canvas id="chart-cashflow"></canvas>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Category Outlays</h3>
            <span>Where your money went this period</span>
          </div>
          <button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="navigate('Analytics')">Deep View</button>
        </div>
        <div style="height:250px; position:relative;">
          <canvas id="chart-categories"></canvas>
        </div>
      </div>
    </div>

    <!-- Lower Row: Recent Transactions + AI Money Coach Callout -->
    <div class="grid-2col">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Canonical Transactions</h3>
            <span>Reconciled records · Zero duplicate double-counting</span>
          </div>
          <button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="navigate('Transactions')">View All</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Category</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${d.transactions.slice(0, 5).map(t => `
                <tr style="cursor:pointer;" onclick="openExplainabilityForTxn('${t.id}')">
                  <td><b>${t.merchant}</b></td>
                  <td><span class="badge info">${t.category}</span></td>
                  <td style="color:var(--text-dim);">${t.source}</td>
                  <td class="${t.direction === 'income' ? 'positive' : ''}" style="font-weight:600;">
                    ${t.direction === 'income' ? '+' : '−'}${money(t.amount)}
                  </td>
                  <td style="font-family:var(--font-mono); font-size:11px; color:var(--text-dim);">${formatDate(t.date)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" style="background: linear-gradient(145deg, #18223a, #111a2f);">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
          <div class="brand-mark" style="width:32px; height:32px; font-size:14px;"><i class="fa-solid fa-sparkles"></i></div>
          <div>
            <div class="eyebrow" style="margin:0;">COGNIFLOW INTELLIGENCE INSIGHT</div>
            <h3 style="font-size:15px; color:#fff;">Strong Savings Momentum</h3>
          </div>
          <span class="badge info" style="margin-left:auto;">98% Confidence</span>
        </div>
        <p style="font-size:12px; line-height:1.8; color:var(--text-muted); border-left:2px solid var(--accent-green); padding-left:14px; margin-bottom:18px;">
          You retained <b>${d.savings_rate}%</b> of your income in October. Rent (₹24,000) and Automated SIP (₹5,000) formed your highest commitments. Your discretionary buffer remains fully intact.
        </p>
        <div style="display:flex; gap:10px;">
          <button class="btn-primary" onclick="openExplainabilityModal('savings-momentum-insight')">
            <i class="fa-solid fa-brain"></i> Explain Math & Evidence
          </button>
          <button class="btn-secondary" onclick="navigate('AICoach')">
            Ask Copilot <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  // Render Cashflow Area Chart
  const ctxCashflow = document.getElementById("chart-cashflow").getContext("2d");
  chartInstances["cashflow"] = new Chart(ctxCashflow, {
    type: "line",
    data: {
      labels: ["Oct 01", "Oct 07", "Oct 14", "Oct 21", "Oct 28"],
      datasets: [
        {
          label: "Income",
          data: [0, 12000, 0, 0, 82000],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          fill: true,
          tension: 0.35,
          borderWidth: 2
        },
        {
          label: "Expense",
          data: [0, 2140, 9090, 4449, 24000],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.12)",
          fill: true,
          tension: 0.35,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b", font: { family: "DM Mono" } } },
        y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b", callback: v => `₹${v/1000}k` } }
      }
    }
  });

  // Render Category Donut Chart
  const ctxCat = document.getElementById("chart-categories").getContext("2d");
  const topCats = d.categories.slice(0, 6);
  chartInstances["categories"] = new Chart(ctxCat, {
    type: "doughnut",
    data: {
      labels: topCats.map(c => c.name),
      datasets: [{
        data: topCats.map(c => c.value),
        backgroundColor: ["#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { color: "#94a3b8", font: { size: 11, family: "Inter" } } }
      },
      cutout: "68%"
    }
  });
}

// ==========================================
// 2. TRANSACTIONS & DUPLICATE INTELLIGENCE (Section 14)
// ==========================================
async function renderTransactions(container) {
  const [txnsRes, dupsRes] = await Promise.all([
    fetch(`${API}/transactions`),
    fetch(`${API}/transactions/duplicates`)
  ]);
  const txns = await txnsRes.json();
  const dups = await dupsRes.json();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">CANONICAL LEDGER · ADVANCED TRANSACTION RECONCILIATION</div>
        <h1>Transactions Intelligence</h1>
        <p>Canonical records, fuzzy duplicate detection, automated categorization, and multi-app tracking.</p>
      </div>
      <div style="display:flex; gap:10px;">
        <a href="${API}/reports/export-csv" class="btn-secondary" download>
          <i class="fa-solid fa-download"></i> Export CSV
        </a>
        <button class="btn-primary" onclick="openAddTransactionModal()">
          <i class="fa-solid fa-plus"></i> New Transaction
        </button>
      </div>
    </div>

    <!-- Duplicate Detection Alert Banner (Section 14) -->
    ${dups.length > 0 ? `
      <div class="panel" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); margin-bottom:20px;">
        <div style="display:flex; align-items:flex-start; gap:14px;">
          <div class="kpi-icon" style="background:rgba(239,68,68,0.2); color:var(--accent-red); flex-shrink:0;">
            <i class="fa-solid fa-copy"></i>
          </div>
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px;">
              <h3 style="color:#fff; font-size:14px;">Intelligent Duplicate Detection Active</h3>
              <span class="badge critical">${dups.length} Suspect Found</span>
            </div>
            <p style="color:var(--text-muted); font-size:11.5px; margin:4px 0 10px;">
              Detected potential duplicate charge: <b>${dups[0].suspect_transaction.merchant} (₹${Number(dups[0].suspect_transaction.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })})</b> occurred within ${Math.round(dups[0].time_delta_seconds / 60)} minutes of a matching record with <b>${Math.round(dups[0].confidence * 100)}% match confidence</b>.
            </p>
            <div style="display:flex; gap:8px;">
              <button class="btn-primary" style="padding:5px 10px; font-size:11px;" onclick="resolveDuplicateAction('${dups[0].suspect_transaction.id}', 'confirm')">
                <i class="fa-solid fa-check"></i> Confirm Duplicate (Exclude)
              </button>
              <button class="btn-secondary" style="padding:5px 10px; font-size:11px;" onclick="resolveDuplicateAction('${dups[0].suspect_transaction.id}', 'separate')">
                <i class="fa-solid fa-check-double"></i> Mark as Valid Separate
              </button>
              <button class="btn-secondary" style="padding:5px 10px; font-size:11px;" onclick="resolveDuplicateAction('${dups[0].suspect_transaction.id}', 'dismiss')">
                Dismiss Flag
              </button>
            </div>
          </div>
        </div>
      </div>
    ` : ""}

    <!-- Filters Toolbar -->
    <div class="panel" style="padding:14px 20px; margin-bottom:18px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
      <div class="search-box" style="flex:1; min-width:200px;">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="txn-filter-q" placeholder="Search merchant, notes, reference..." oninput="filterTransactionsTable()" />
      </div>

      <select class="period-select" id="txn-filter-cat" onchange="filterTransactionsTable()">
        <option value="">All Categories</option>
        <option>Food</option>
        <option>Groceries</option>
        <option>Shopping</option>
        <option>Bills</option>
        <option>Rent</option>
        <option>Investments</option>
        <option>Subscriptions</option>
        <option>Travel</option>
        <option>Salary</option>
      </select>

      <select class="period-select" id="txn-filter-src" onchange="filterTransactionsTable()">
        <option value="">All Sources</option>
        <option>Google Pay</option>
        <option>PhonePe</option>
        <option>Paytm</option>
        <option>BHIM</option>
        <option>Bank statement</option>
        <option>Card</option>
      </select>

      <select class="period-select" id="txn-filter-dir" onchange="filterTransactionsTable()">
        <option value="">All Inflows/Outflows</option>
        <option value="expense">Expenses Only</option>
        <option value="income">Income Only</option>
      </select>
    </div>

    <!-- Main Transactions Table -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>All Transactions (${txns.length})</h3>
          <span>Audited canonical records · Immutable timeline</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table" id="transactions-master-table">
          <thead>
            <tr>
              <th>Merchant / Entity</th>
              <th>Category</th>
              <th>Payment Source</th>
              <th>Reference ID</th>
              <th>Direction</th>
              <th>Amount (INR)</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="txn-tbody">
            ${renderTxnRows(txns)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTxnRows(list) {
  if (list.length === 0) {
    return `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-dim);">No transactions match filter criteria</td></tr>`;
  }
  return list.map(t => `
    <tr id="row-${t.id}">
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="avatar" style="width:28px; height:28px; font-size:10px; background:rgba(99,102,241,0.2); color:var(--accent-blue);">${t.merchant.charAt(0)}</div>
          <div>
            <b>${t.merchant}</b>
            ${t.notes ? `<small style="display:block; color:var(--text-dim); font-size:10px;">${t.notes}</small>` : ""}
          </div>
        </div>
      </td>
      <td><span class="badge info">${t.category}</span></td>
      <td><span style="font-size:11px; color:var(--text-muted);"><i class="fa-solid fa-credit-card" style="font-size:9px;"></i> ${t.source}</span></td>
      <td style="font-family:var(--font-mono); font-size:10px; color:var(--text-dim);">${t.reference_id || '—'}</td>
      <td><span class="badge ${t.direction === 'income' ? 'warning' : 'info'}">${t.direction}</span></td>
      <td class="${t.direction === 'income' ? 'positive' : ''}" style="font-weight:700; font-size:13px;">
        ${t.direction === 'income' ? '+' : '−'}${money(t.amount)}
      </td>
      <td style="font-family:var(--font-mono); font-size:11px; color:var(--text-dim);">${formatDate(t.date)}</td>
      <td>
        <button class="icon-btn" style="padding:4px 8px; font-size:10px;" onclick="deleteTransactionRecord('${t.id}')" title="Delete record">
          <i class="fa-solid fa-trash" style="color:var(--accent-red);"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

async function filterTransactionsTable() {
  const q = document.getElementById("txn-filter-q")?.value || "";
  const cat = document.getElementById("txn-filter-cat")?.value || "";
  const src = document.getElementById("txn-filter-src")?.value || "";
  const dir = document.getElementById("txn-filter-dir")?.value || "";

  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (cat) params.append("category", cat);
  if (src) params.append("source", src);
  if (dir) params.append("direction", dir);

  const res = await fetch(`${API}/transactions?${params.toString()}`);
  const filtered = await res.json();
  const tbody = document.getElementById("txn-tbody");
  if (tbody) tbody.innerHTML = renderTxnRows(filtered);
}

async function resolveDuplicateAction(id, action) {
  await fetch(`${API}/transactions/duplicates/${id}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action })
  });
  await renderTransactions(document.getElementById("app-content"));
}

async function deleteTransactionRecord(id) {
  if (!confirm("Are you sure you want to delete this canonical transaction record?")) return;
  await fetch(`${API}/transactions/${id}`, { method: "DELETE" });
  await renderTransactions(document.getElementById("app-content"));
}

// ==========================================
// 3. FINANCIAL RULES - RULEGPT (Section 4)
// ==========================================
async function renderFinancialRules(container) {
  const res = await fetch(`${API}/rules`);
  const data = await res.json();
  const rules = data.rules;
  const logs = data.logs;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">AUTOMATED EXECUTION · NATURAL LANGUAGE AGENT</div>
        <h1>RuleGPT Financial Rule Builder</h1>
        <p>State financial guardrails in natural English. RuleGPT compiles them into deterministic backend monitors.</p>
      </div>
    </div>

    <!-- Natural Language Instruction Box -->
    <div class="panel" style="margin-bottom:24px; background:linear-gradient(135deg, rgba(20,31,54,0.98), rgba(28,24,68,0.9)); border:1px solid rgba(99,102,241,0.35);">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
        <div class="brand-mark" style="width:32px; height:32px; font-size:14px;"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
        <h3 style="color:#fff; font-size:16px;">Create Rules with Natural Language</h3>
      </div>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
        Type any spending rule, budget limit or alert condition. RuleGPT will interpret the logic, formulate the threshold, and configure backend triggers.
      </p>
      
      <div style="display:flex; gap:10px; margin-bottom:14px;">
        <input type="text" id="rule-nl-input" class="form-group" style="margin:0; flex:1;" 
               placeholder="e.g. Alert me when my shopping expenses exceed ₹5,000 in a month" />
        <button class="btn-primary" onclick="interpretRuleInput()">
          <i class="fa-solid fa-bolt"></i> Compile Rule
        </button>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; font-size:11px;">
        <span style="color:var(--text-dim); align-self:center;">Try asking:</span>
        <button class="btn-secondary" style="padding:3px 8px; font-size:10.5px;" onclick="setRuleExample('Alert me when my shopping expenses exceed ₹5,000 in a month')">Shopping > ₹5,000/mo</button>
        <button class="btn-secondary" style="padding:3px 8px; font-size:10.5px;" onclick="setRuleExample('Notify me when I spend more than ₹2,000 in one transaction')">Single Txn > ₹2,000</button>
        <button class="btn-secondary" style="padding:3px 8px; font-size:10.5px;" onclick="setRuleExample('Alert me when 80% of my monthly food budget is used')">Food Budget >= 80%</button>
      </div>

      <!-- Generated Rule Review Card (Preview) -->
      <div id="rule-preview-card" style="display:none; margin-top:20px; padding:16px; background:#0b1120; border:1px solid rgba(6,182,212,0.3); border-radius:10px;">
        <!-- Filled by JS -->
      </div>
    </div>

    <!-- Active Rules Grid -->
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header">
        <div>
          <h3>Active Backend Rules (${rules.length})</h3>
          <span>Continuously evaluated whenever transactions occur</span>
        </div>
      </div>
      <div class="grid-3col">
        ${rules.map(r => `
          <div class="panel" style="background:#0b1120; border-color:${r.status === 'active' ? 'rgba(99,102,241,0.25)' : 'var(--border-line)'};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span class="badge ${r.severity}">${r.severity}</span>
              <span class="badge ${r.status === 'active' ? 'info' : 'warning'}">${r.status}</span>
            </div>
            <h4 style="color:#fff; font-size:14px; margin-bottom:6px;">${r.name}</h4>
            <p style="font-size:11px; color:var(--text-muted); line-height:1.5; margin-bottom:12px;">"${r.natural_instruction}"</p>
            
            <div style="font-family:var(--font-mono); font-size:10.5px; color:var(--accent-cyan); background:rgba(6,182,212,0.06); padding:6px 8px; border-radius:6px; margin-bottom:14px;">
              ${r.metric} ${r.operator} ₹${Number(r.threshold).toLocaleString()}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:var(--text-dim); border-top:1px solid var(--border-line); padding-top:10px;">
              <span>Triggered: ${r.trigger_count} times</span>
              <div style="display:flex; gap:6px;">
                <button class="btn-secondary" style="padding:3px 7px; font-size:10px;" onclick="testRuleTrigger('${r.id}')" title="Test evaluation">Test</button>
                <button class="btn-secondary" style="padding:3px 7px; font-size:10px;" onclick="toggleRuleStatus('${r.id}', '${r.status === 'active' ? 'paused' : 'active'}')">${r.status === 'active' ? 'Pause' : 'Resume'}</button>
                <button class="btn-danger" style="padding:3px 7px; font-size:10px;" onclick="deleteRuleItem('${r.id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Live Execution Logs Table -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>Rule Execution History & Audit Logs</h3>
          <span>Verified events triggered by actual transactions</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Severity</th>
              <th>Triggered Value</th>
              <th>Threshold</th>
              <th>Event Summary</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-dim);">No rule triggers recorded yet</td></tr>` : logs.map(l => `
              <tr>
                <td><b>${l.rule_name}</b></td>
                <td><span class="badge ${l.severity}">${l.severity}</span></td>
                <td style="font-family:var(--font-mono); color:var(--accent-orange);">₹${Number(l.triggered_value).toLocaleString()}</td>
                <td style="font-family:var(--font-mono); color:var(--text-dim);">₹${Number(l.threshold_value).toLocaleString()}</td>
                <td style="color:var(--text-main); font-size:11px;">${l.event_summary}</td>
                <td style="font-family:var(--font-mono); font-size:11px; color:var(--text-dim);">${formatDate(l.timestamp)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function setRuleExample(txt) {
  document.getElementById("rule-nl-input").value = txt;
}

let compiledRuleDraft = null;

async function interpretRuleInput() {
  const input = document.getElementById("rule-nl-input")?.value;
  if (!input) return;

  const res = await fetch(`${API}/rules/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction: input })
  });
  compiledRuleDraft = await res.json();

  const preview = document.getElementById("rule-preview-card");
  preview.style.display = "block";
  preview.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <b style="color:var(--accent-cyan); font-size:13px;"><i class="fa-solid fa-microchip"></i> RuleGPT Compilation Output</b>
      <span class="badge ${compiledRuleDraft.severity}">${compiledRuleDraft.severity}</span>
    </div>
    <div class="form-row" style="margin-bottom:10px;">
      <div>
        <label style="font-size:10px; color:var(--text-dim);">Rule Name</label>
        <input type="text" id="draft-name" value="${compiledRuleDraft.name}" style="background:#070b14; border:1px solid var(--border-line); color:#fff; padding:6px 10px; border-radius:6px; font-size:11px; width:100%;" />
      </div>
      <div>
        <label style="font-size:10px; color:var(--text-dim);">Category</label>
        <input type="text" id="draft-cat" value="${compiledRuleDraft.category}" style="background:#070b14; border:1px solid var(--border-line); color:#fff; padding:6px 10px; border-radius:6px; font-size:11px; width:100%;" />
      </div>
    </div>
    <div class="form-row" style="margin-bottom:14px;">
      <div>
        <label style="font-size:10px; color:var(--text-dim);">Condition Operator & Metric</label>
        <div style="font-family:var(--font-mono); font-size:11px; color:#fff; padding:6px 10px; background:#070b14; border-radius:6px;">
          ${compiledRuleDraft.metric} ${compiledRuleDraft.operator}
        </div>
      </div>
      <div>
        <label style="font-size:10px; color:var(--text-dim);">Threshold (INR ₹)</label>
        <input type="number" id="draft-threshold" value="${compiledRuleDraft.threshold}" style="background:#070b14; border:1px solid var(--border-line); color:#fff; padding:6px 10px; border-radius:6px; font-size:11px; width:100%;" />
      </div>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button class="btn-secondary" onclick="document.getElementById('rule-preview-card').style.display='none'">Discard</button>
      <button class="btn-primary" onclick="activateCompiledRule()"><i class="fa-solid fa-check"></i> Activate Rule in Backend</button>
    </div>
  `;
}

async function activateCompiledRule() {
  if (!compiledRuleDraft) return;
  const name = document.getElementById("draft-name")?.value || compiledRuleDraft.name;
  const category = document.getElementById("draft-cat")?.value || compiledRuleDraft.category;
  const threshold = parseFloat(document.getElementById("draft-threshold")?.value) || compiledRuleDraft.threshold;

  await fetch(`${API}/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      natural_instruction: compiledRuleDraft.natural_instruction,
      category,
      metric: compiledRuleDraft.metric,
      operator: compiledRuleDraft.operator,
      threshold,
      action_type: compiledRuleDraft.action_type,
      severity: compiledRuleDraft.severity
    })
  });
  await renderFinancialRules(document.getElementById("app-content"));
}

async function toggleRuleStatus(id, newStatus) {
  await fetch(`${API}/rules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  });
  await renderFinancialRules(document.getElementById("app-content"));
}

async function deleteRuleItem(id) {
  if (!confirm("Delete this rule?")) return;
  await fetch(`${API}/rules/${id}`, { method: "DELETE" });
  await renderFinancialRules(document.getElementById("app-content"));
}

async function testRuleTrigger(id) {
  const res = await fetch(`${API}/rules/${id}/test`, { method: "POST" });
  const data = await res.json();
  alert(`Tested rule: "${data.tested_rule}" against latest transaction. Triggered: ${data.triggered}`);
  await renderFinancialRules(document.getElementById("app-content"));
}

// ==========================================
// 4. ANOMALY DETECTION & DRIFT ENGINE (Sections 10 & 15)
// ==========================================
async function renderAnomalyDetection(container) {
  const [anomRes, driftRes] = await Promise.all([
    fetch(`${API}/anomalies`),
    fetch(`${API}/drift`)
  ]);
  const anomalies = await anomRes.json();
  const drift = await driftRes.json();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">STATISTICAL OUTLIERS & STRUCTURAL DRIFT MONITOR</div>
        <h1>Anomaly Detection & Behavioral Drift</h1>
        <p>Mathematical dispersion modeling, Z-Score spikes, duplicate detection, and gradual 90-day habit creep.</p>
      </div>
      <button class="btn-primary" onclick="rescanAnomalies()"><i class="fa-solid fa-arrows-rotate"></i> Run Full Scan</button>
    </div>

    <!-- Active Anomaly Alerts -->
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header">
        <div>
          <h3>Discovered Anomalies (${anomalies.length})</h3>
          <span>Z-score deviations, category spikes, and double-swipe candidates</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:14px;">
        ${anomalies.length === 0 ? `<p style="color:var(--text-dim); font-size:12px;">Zero active anomalies detected in current period.</p>` : anomalies.map(a => `
          <div class="panel" style="background:#090e1a; border-left:4px solid ${a.severity === 'critical' ? 'var(--accent-red)' : 'var(--accent-orange)'};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge ${a.severity}">${a.severity}</span>
                  <span class="badge info">${a.category}</span>
                  <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-dim);">${a.detection_method}</span>
                </div>
                <h4 style="font-size:15px; color:#fff; margin:6px 0 4px;">${a.title}</h4>
              </div>
              <div style="text-align:right;">
                <span style="font-family:var(--font-mono); font-size:11px; color:var(--accent-cyan);">Score: ${Math.round(a.anomaly_score * 100)}%</span>
                <div style="font-size:10px; color:var(--text-dim);">${formatDate(a.created_at)}</div>
              </div>
            </div>

            <p style="font-size:12px; color:var(--text-muted); line-height:1.6; margin-bottom:12px;">${a.reason}</p>
            
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-line); border-radius:6px; padding:8px 12px; font-size:11px; color:#cbd5e1; margin-bottom:12px;">
              <i class="fa-solid fa-lightbulb" style="color:var(--accent-orange); margin-right:6px;"></i> <b>Recommended Action:</b> ${a.recommended_action}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
              <button class="btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="openExplainabilityModal('${a.id}')">
                <i class="fa-solid fa-brain"></i> Explain Math & Contributing Records
              </button>
              <div style="display:flex; gap:8px;">
                ${a.status === 'unread' ? `
                  <button class="btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="acknowledgeAlertItem('${a.id}')">Acknowledge</button>
                  <button class="btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="dismissAlertItem('${a.id}')">Dismiss</button>
                ` : `<span style="font-size:11px; color:var(--text-dim); text-transform:capitalize;"><i class="fa-solid fa-check"></i> ${a.status}</span>`}
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Section 10: Behavioral Drift Observations -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>Spending Behaviour Drift Detection (Section 10)</h3>
          <span>Longitudinal shifts comparing 30-day velocity against 90-day baseline</span>
        </div>
      </div>

      <div class="grid-2col">
        ${drift.map(d => `
          <div class="panel" style="background:#090e1a; border-color:rgba(245,158,11,0.25);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span class="badge warning">${d.category}</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--accent-red); font-weight:700;">+${d.percentage_change}% Drift</span>
            </div>
            <h4 style="font-size:14px; color:#fff; margin-bottom:8px;">${d.trend_title}</h4>
            <div style="display:flex; gap:16px; margin-bottom:12px; font-size:11px; color:var(--text-muted); background:rgba(255,255,255,0.02); padding:8px 12px; border-radius:6px;">
              <div><span>Baseline:</span> <b style="color:#fff;">₹${d.baseline_amount}</b></div>
              <div><span>Current:</span> <b style="color:var(--accent-orange);">₹${d.current_amount}</b></div>
            </div>
            <p style="font-size:11.5px; color:#cbd5e1; line-height:1.6; margin-bottom:12px;">
              <i class="fa-solid fa-shield-halved" style="color:var(--accent-cyan);"></i> ${d.corrective_action}
            </p>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
              <button class="btn-secondary" style="padding:4px 8px; font-size:10.5px;" onclick="updateDriftState('${d.id}', 'acknowledged')">Acknowledge</button>
              <button class="btn-secondary" style="padding:4px 8px; font-size:10.5px;" onclick="updateDriftState('${d.id}', 'dismissed')">Dismiss</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

async function rescanAnomalies() {
  await fetch(`${API}/anomalies`);
  await renderAnomalyDetection(document.getElementById("app-content"));
  await checkUnreadAnomalies();
}

async function acknowledgeAlertItem(id) {
  await fetch(`${API}/anomalies/${id}/acknowledge`, { method: "POST" });
  await renderAnomalyDetection(document.getElementById("app-content"));
  await checkUnreadAnomalies();
}

async function dismissAlertItem(id) {
  await fetch(`${API}/anomalies/${id}/dismiss`, { method: "POST" });
  await renderAnomalyDetection(document.getElementById("app-content"));
  await checkUnreadAnomalies();
}

async function updateDriftState(id, status) {
  await fetch(`${API}/drift/${id}?status=${status}`, { method: "PATCH" });
  await renderAnomalyDetection(document.getElementById("app-content"));
}

// ==========================================
// 5. FORECASTING & SIMULATION LAB (Section 6)
// ==========================================
async function renderSimulation(container) {
  const savedRes = await fetch(`${API}/simulations`);
  const savedSims = await savedRes.json();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">WHAT-IF SCENARIOS · 3-REGIME COMPOUND PROJECTIONS</div>
        <h1>Simulation Lab & Forecasting</h1>
        <p>Adjust variables in real-time. Projections compute conservative, expected, and optimistic trajectories.</p>
      </div>
    </div>

    <div class="grid-2col" style="grid-template-columns: 360px 1fr;">
      <!-- Interactive Scenario Controls -->
      <div class="panel">
        <h3 style="margin-bottom:18px;">Scenario Parameters</h3>
        
        <div class="form-group">
          <label style="display:flex; justify-content:space-between;">
            <span>Monthly Contribution</span>
            <b id="sim-val-monthly" style="color:var(--accent-cyan); font-family:var(--font-mono);">₹5,000</b>
          </label>
          <input type="range" min="1000" max="40000" step="1000" value="5000" id="sim-monthly" oninput="updateSimulationRun()" />
        </div>

        <div class="form-group">
          <label style="display:flex; justify-content:space-between;">
            <span>Duration (Years)</span>
            <b id="sim-val-years" style="color:var(--accent-cyan); font-family:var(--font-mono);">5 Years</b>
          </label>
          <input type="range" min="1" max="15" step="1" value="5" id="sim-years" oninput="updateSimulationRun()" />
        </div>

        <div class="form-group">
          <label style="display:flex; justify-content:space-between;">
            <span>Assumed Annual Return</span>
            <b id="sim-val-rate" style="color:var(--accent-cyan); font-family:var(--font-mono);">8.0% p.a.</b>
          </label>
          <input type="range" min="3" max="15" step="0.5" value="8" id="sim-rate" oninput="updateSimulationRun()" />
        </div>

        <div class="form-group">
          <label>One-Time Major Purchase (Deduction)</label>
          <input type="number" id="sim-purchase" value="0" placeholder="e.g. 60000 (Laptop)" onchange="updateSimulationRun()" />
        </div>

        <div style="margin-top:20px;">
          <input type="text" id="sim-save-name" placeholder="Scenario name (e.g. Aggressive SIP)" style="margin-bottom:8px;" />
          <button class="btn-primary" style="width:100%; justify-content:center;" onclick="saveCurrentSimulation()">
            <i class="fa-solid fa-floppy-disk"></i> Save Scenario Model
          </button>
        </div>

        <div style="margin-top:16px; font-size:10px; color:var(--text-dim); line-height:1.5;">
          <i class="fa-solid fa-circle-info"></i> Projections rely on mathematical compounding annuity algorithms. Stated returns are hypothetical estimates, never guaranteed.
        </div>
      </div>

      <!-- Projection Outcome Panel -->
      <div class="panel">
        <div class="panel-header">
          <div>
            <span class="eyebrow" style="margin:0;">ESTIMATED FUTURE VALUE (EXPECTED REGIME)</span>
            <h2 id="sim-fv-display" style="font-size:32px; color:var(--accent-green); margin:6px 0;">₹3,67,384</h2>
            <span id="sim-sub-display">Total invested: ₹3,00,000 · Compounded Wealth Gain: +₹67,384</span>
          </div>
          <span class="badge info">Interactive Model</span>
        </div>

        <!-- 3 Regimes Comparison Cards -->
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:18px;">
          <div style="background:#090e1a; padding:12px; border-radius:8px; border:1px solid var(--border-line);">
            <small style="color:var(--text-dim);">Conservative (5.5%)</small>
            <b id="sim-cons-val" style="display:block; font-size:16px; color:#fff; margin-top:4px;">₹3,44,404</b>
          </div>
          <div style="background:#090e1a; padding:12px; border-radius:8px; border:1px solid rgba(16,185,129,0.3);">
            <small style="color:var(--accent-green);">Expected (8.0%)</small>
            <b id="sim-exp-val" style="display:block; font-size:16px; color:#fff; margin-top:4px;">₹3,67,384</b>
          </div>
          <div style="background:#090e1a; padding:12px; border-radius:8px; border:1px solid rgba(99,102,241,0.3);">
            <small style="color:var(--accent-violet);">Optimistic (11.0%)</small>
            <b id="sim-opt-val" style="display:block; font-size:16px; color:#fff; margin-top:4px;">₹3,97,590</b>
          </div>
        </div>

        <!-- Trajectory Chart -->
        <div style="height:250px; position:relative; margin-bottom:16px;">
          <canvas id="chart-simulation"></canvas>
        </div>

        <!-- Goal Impact Notice -->
        <div id="sim-goal-impact" style="background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.25); border-radius:8px; padding:10px 14px; font-size:11.5px; color:#e2e8f0;">
          <i class="fa-solid fa-bullseye" style="color:var(--accent-cyan); margin-right:6px;"></i> At ₹5,000/month, your remaining ₹51,500 emergency reserve target will be achieved in ~11 months.
        </div>
      </div>
    </div>

    <!-- Saved Simulations Table -->
    ${savedSims.length > 0 ? `
      <div class="panel" style="margin-top:24px;">
        <div class="panel-header">
          <div>
            <h3>Saved Simulation Scenarios (${savedSims.length})</h3>
            <span>Compare multi-variable financial hypotheses</span>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Scenario Name</th>
                <th>Monthly</th>
                <th>Duration</th>
                <th>Assumed Rate</th>
                <th>Projected Value</th>
                <th>Wealth Gain</th>
                <th>Date Saved</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${savedSims.map(s => `
                <tr>
                  <td><b>${s.name}</b></td>
                  <td style="font-family:var(--font-mono);">₹${Number(s.monthly_saving_delta).toLocaleString()}</td>
                  <td>${s.duration_years} yrs</td>
                  <td>${s.expected_annual_return}%</td>
                  <td style="font-weight:700; color:var(--accent-green); font-family:var(--font-mono);">${money(s.results?.future_value)}</td>
                  <td style="color:var(--accent-cyan); font-family:var(--font-mono);">+${money(s.results?.growth)}</td>
                  <td style="font-family:var(--font-mono); font-size:11px; color:var(--text-dim);">${formatDate(s.created_at)}</td>
                  <td>
                    <button class="icon-btn" onclick="deleteSimModel('${s.id}')"><i class="fa-solid fa-trash" style="color:var(--accent-red); font-size:10px;"></i></button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : ""}
  `;

  // Run initial simulation calculation
  updateSimulationRun();
}

async function updateSimulationRun() {
  const m = parseFloat(document.getElementById("sim-monthly")?.value || 5000);
  const y = parseInt(document.getElementById("sim-years")?.value || 5);
  const r = parseFloat(document.getElementById("sim-rate")?.value || 8);
  const p = parseFloat(document.getElementById("sim-purchase")?.value || 0);

  document.getElementById("sim-val-monthly").textContent = `₹${m.toLocaleString()}`;
  document.getElementById("sim-val-years").textContent = `${y} Years`;
  document.getElementById("sim-val-rate").textContent = `${r}% p.a.`;

  const res = await fetch(`${API}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthly: m, years: y, rate: r, one_time_purchase: p })
  });
  const data = await res.json();

  document.getElementById("sim-fv-display").textContent = money(data.future_value);
  document.getElementById("sim-sub-display").textContent = `Total invested: ${money(data.contributed)} · Wealth Gain: +${money(data.growth)}`;
  document.getElementById("sim-cons-val").textContent = money(data.conservative.future_value);
  document.getElementById("sim-exp-val").textContent = money(data.future_value);
  document.getElementById("sim-opt-val").textContent = money(data.optimistic.future_value);
  document.getElementById("sim-goal-impact").innerHTML = `<i class="fa-solid fa-bullseye" style="color:var(--accent-cyan); margin-right:6px;"></i> ${data.goal_impact.summary}`;

  // Update Trajectory Chart
  const ctx = document.getElementById("chart-simulation")?.getContext("2d");
  if (ctx) {
    if (chartInstances["simulation"]) chartInstances["simulation"].destroy();
    chartInstances["simulation"] = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.trajectory.map(t => t.year),
        datasets: [
          {
            label: "Optimistic",
            data: data.trajectory.map(t => t.optimistic),
            borderColor: "#8b5cf6",
            borderDash: [5, 5],
            borderWidth: 1.5,
            tension: 0.3
          },
          {
            label: "Expected",
            data: data.trajectory.map(t => t.expected),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            borderWidth: 2.5,
            tension: 0.3
          },
          {
            label: "Conservative",
            data: data.trajectory.map(t => t.conservative),
            borderColor: "#3b82f6",
            borderDash: [3, 3],
            borderWidth: 1.5,
            tension: 0.3
          },
          {
            label: "Principal Invested",
            data: data.trajectory.map(t => t.contributions),
            borderColor: "#64748b",
            borderWidth: 1,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { color: "#94a3b8", font: { size: 10 } } } },
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b" } },
          y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b", callback: v => `₹${v/1000}k` } }
        }
      }
    });
  }
}

async function saveCurrentSimulation() {
  const m = parseFloat(document.getElementById("sim-monthly")?.value || 5000);
  const y = parseInt(document.getElementById("sim-years")?.value || 5);
  const r = parseFloat(document.getElementById("sim-rate")?.value || 8);
  const p = parseFloat(document.getElementById("sim-purchase")?.value || 0);
  const name = document.getElementById("sim-save-name")?.value || `Scenario ${y}yr @ ${r}%`;

  await fetch(`${API}/simulations/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthly: m, years: y, rate: r, one_time_purchase: p, name })
  });
  alert("Simulation scenario successfully saved!");
  await renderSimulation(document.getElementById("app-content"));
}

async function deleteSimModel(id) {
  await fetch(`${API}/simulations/${id}`, { method: "DELETE" });
  await renderSimulation(document.getElementById("app-content"));
}

// ==========================================
// 6. AI MONEY COACH (Section 13)
// ==========================================
async function renderAICoach(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">COGNIFLOW CONTEXT-AWARE INTELLIGENCE</div>
        <h1>AI Money Coach</h1>
        <p>Grounded in actual database records. Answers financial questions with mathematical proofs and zero fabricated statistics.</p>
      </div>
    </div>

    <div class="grid-2col" style="grid-template-columns: 1fr 340px;">
      <!-- Interactive Chat Interface -->
      <div class="panel" style="min-height:560px; display:flex; flex-direction:column; justify-content:space-between;">
        <div id="coach-chat-stream" style="display:flex; flex-direction:column; gap:16px; max-height:460px; overflow-y:auto; padding-right:8px;">
          <!-- System Welcome Message -->
          <div style="display:flex; gap:12px; align-items:flex-start;">
            <div class="brand-mark" style="width:34px; height:34px; font-size:15px; flex-shrink:0;"><i class="fa-solid fa-robot"></i></div>
            <div style="background:#0e1728; border:1px solid var(--border-line); border-radius:12px; padding:14px 18px; max-width:85%; font-size:12.5px; line-height:1.7;">
              <b style="color:#fff; display:block; margin-bottom:4px;">Good morning, Ananya. I'm your AI Money Coach.</b>
              I have synchronized your October financial ledger, budgets, historical snapshots, and investment allocations. Ask me anything about where your money went, spending drift, affordability, or savings milestones.
            </div>
          </div>
        </div>

        <!-- Prompt Input Bar -->
        <div style="display:flex; gap:10px; margin-top:20px; border-top:1px solid var(--border-line); padding-top:14px;">
          <input type="text" id="coach-query-input" placeholder="Ask about expenses, affordability, savings goals…" 
                 style="flex:1; background:#070b14; border:1px solid var(--border-line); border-radius:8px; padding:10px 14px; color:#fff; font-size:12px; outline:none;" 
                 onkeydown="if(event.key==='Enter') sendCoachQuestion()" />
          <button class="btn-primary" onclick="sendCoachQuestion()"><i class="fa-solid fa-paper-plane"></i> Ask</button>
        </div>
      </div>

      <!-- Quick Prompt Suggestions Sidebar -->
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="panel">
          <span class="eyebrow">COMMON QUERIES</span>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
            ${[
              "Where did most of my money go this month?",
              "Why did my expenses increase?",
              "How much did I save this month?",
              "Can I afford a ₹20,000 purchase?",
              "Which categories are exceeding my budget?",
              "How can I reach my savings goal faster?",
              "What are my biggest financial risks?"
            ].map(q => `
              <button class="btn-secondary" style="text-align:left; justify-content:space-between; font-size:11px; padding:10px;" onclick="sendQuickPrompt('${q}')">
                <span>${q}</span>
                <i class="fa-solid fa-chevron-right" style="font-size:10px; color:var(--text-dim);"></i>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="panel" style="background:#090e1a; font-size:10.5px; color:var(--text-dim); line-height:1.6;">
          <i class="fa-solid fa-shield-halved" style="color:var(--accent-green);"></i> <b>Data Grounding Guarantee:</b> Money Coach answers cite only saved canonical transactions and mathematical backend formulas. It will never invent balances.
        </div>
      </div>
    </div>
  `;
}

function sendQuickPrompt(q) {
  document.getElementById("coach-query-input").value = q;
  sendCoachQuestion();
}

async function sendCoachQuestion() {
  const inputEl = document.getElementById("coach-query-input");
  const query = inputEl?.value.trim();
  if (!query) return;

  const stream = document.getElementById("coach-chat-stream");
  
  // Render User Message
  stream.innerHTML += `
    <div style="display:flex; justify-content:flex-end;">
      <div style="background:linear-gradient(135deg, #4f46e5, #3b82f6); color:#fff; border-radius:12px; padding:10px 16px; max-width:80%; font-size:12px;">
        ${query}
      </div>
    </div>
  `;
  inputEl.value = "";
  stream.scrollTop = stream.scrollHeight;

  // Show Typing
  const typingId = `typing-${Date.now()}`;
  stream.innerHTML += `
    <div id="${typingId}" style="display:flex; gap:10px; align-items:center; color:var(--text-dim); font-size:11px;">
      <i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing ledger records & running financial formulas…
    </div>
  `;
  stream.scrollTop = stream.scrollHeight;

  try {
    const res = await fetch(`${API}/copilot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: query })
    });
    const ans = await res.json();
    document.getElementById(typingId)?.remove();

    stream.innerHTML += `
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div class="brand-mark" style="width:34px; height:34px; font-size:15px; flex-shrink:0;"><i class="fa-solid fa-robot"></i></div>
        <div style="background:#0e1728; border:1px solid var(--border-line); border-radius:12px; padding:14px 18px; max-width:85%; font-size:12.5px; line-height:1.7;">
          <div style="color:#fff; margin-bottom:8px;">${ans.answer.replace(/\n/g, '<br/>')}</div>
          
          ${ans.navigation_links && ans.navigation_links.length > 0 ? `
            <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
              ${ans.navigation_links.map(l => `
                <button class="btn-secondary" style="padding:4px 8px; font-size:10.5px;" onclick="navigate('${l.page}')">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> ${l.label}
                </button>
              `).join("")}
            </div>
          ` : ""}

          <div style="margin-top:10px; font-size:9.5px; color:var(--text-dim); border-top:1px solid var(--border-line); padding-top:6px;">
            <i class="fa-solid fa-circle-info"></i> ${ans.disclaimer}
          </div>
        </div>
      </div>
    `;
    stream.scrollTop = stream.scrollHeight;
  } catch (err) {
    document.getElementById(typingId)?.remove();
    console.error("Coach error:", err);
  }
}

// ==========================================
// 7. FINANCIAL HISTORY - TIME MACHINE (Section 7)
// ==========================================
async function renderTimeMachine(container) {
  const histRes = await fetch(`${API}/history`);
  const data = await histRes.json();
  const snaps = data.snapshots;
  const yearly = data.yearly_summary;
  const milestones = data.milestones;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">HISTORICAL WEALTH SNAPSHOTS · RECONCILED ARCHIVE</div>
        <h1>Financial Time Machine</h1>
        <p>Inspect previous financial positions, observe net worth expansion, and compare any two historical months.</p>
      </div>
    </div>

    <!-- Yearly Summary Hero Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-top"><span>2026 Cumulative Income</span><div class="kpi-icon"><i class="fa-solid fa-arrow-trend-up"></i></div></div>
        <strong>${money(yearly.total_income)}</strong>
        <div class="kpi-meta positive">Jan - Oct 2026 Inflows</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>2026 Total Expenses</span><div class="kpi-icon" style="color:var(--accent-red); background:rgba(239,68,68,0.1);"><i class="fa-solid fa-receipt"></i></div></div>
        <strong>${money(yearly.total_expense)}</strong>
        <div class="kpi-meta">Controlled living expenses</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Cumulative Net Savings</span><div class="kpi-icon" style="color:var(--accent-green); background:rgba(16,185,129,0.1);"><i class="fa-solid fa-vault"></i></div></div>
        <strong>${money(yearly.total_savings)}</strong>
        <div class="kpi-meta positive">${yearly.avg_savings_rate}% Avg Savings Rate</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top"><span>Net Worth Expansion</span><div class="kpi-icon" style="color:var(--accent-violet); background:rgba(139,92,246,0.1);"><i class="fa-solid fa-chart-line"></i></div></div>
        <strong>+${money(yearly.net_worth_growth)}</strong>
        <div class="kpi-meta positive">Peak month: ${yearly.peak_month}</div>
      </div>
    </div>

    <!-- Side-by-Side Comparison Tool (Section 7) -->
    <div class="panel" style="margin-bottom:24px; background:linear-gradient(145deg, #111a2e, #17243c); border:1px solid rgba(6,182,212,0.3);">
      <div class="panel-header">
        <div>
          <h3>Compare Any Two Historical Months</h3>
          <span>Delta breakdown across income, spending, savings, and health score</span>
        </div>
      </div>
      <div style="display:flex; gap:16px; align-items:center; margin-bottom:16px; flex-wrap:wrap;">
        <label style="font-size:11px; color:var(--text-muted);">
          Month A:
          <select id="time-month-a" class="period-select" onchange="runHistoricalComparison()">
            ${snaps.map(s => `<option value="${s.month_key}" ${s.month_key === '2026-01' ? 'selected' : ''}>${s.month_key}</option>`).join("")}
          </select>
        </label>
        <span style="color:var(--text-dim); font-size:12px;">versus</span>
        <label style="font-size:11px; color:var(--text-muted);">
          Month B:
          <select id="time-month-b" class="period-select" onchange="runHistoricalComparison()">
            ${snaps.map(s => `<option value="${s.month_key}" ${s.month_key === '2026-10' ? 'selected' : ''}>${s.month_key}</option>`).join("")}
          </select>
        </label>
      </div>

      <div id="hist-compare-result" style="background:#090e1a; padding:16px; border-radius:8px; border:1px solid var(--border-line);">
        <!-- Filled by JS -->
      </div>
    </div>

    <!-- Historical Snapshots Table -->
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header">
        <div>
          <h3>Monthly Financial Ledger Snapshots</h3>
          <span>Ten months of verified historical balances and health metrics</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Expense</th>
              <th>Net Savings</th>
              <th>Savings Rate</th>
              <th>Liquid Balance</th>
              <th>Net Worth</th>
              <th>Health Score</th>
            </tr>
          </thead>
          <tbody>
            ${snaps.map(s => `
              <tr>
                <td><b>${s.month_key}</b></td>
                <td>${money(s.income)}</td>
                <td>${money(s.expense)}</td>
                <td style="color:var(--accent-green); font-weight:700;">+${money(s.savings)}</td>
                <td>${s.savings_rate}%</td>
                <td>${money(s.available_balance)}</td>
                <td style="color:var(--accent-cyan); font-weight:600;">${money(s.net_worth)}</td>
                <td><span class="badge info">${s.health_score}/100</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Milestones Timeline -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>Financial Milestone History</h3>
          <span>Recorded achievements and capitalization marks</span>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${milestones.map(m => `
          <div style="display:flex; gap:14px; align-items:center; background:#090e1a; padding:12px 16px; border-radius:8px; border-left:3px solid var(--accent-cyan);">
            <div style="font-family:var(--font-mono); font-size:12px; color:var(--accent-cyan); width:70px;">${m.date}</div>
            <div style="flex:1;">
              <b style="color:#fff; font-size:13px;">${m.title}</b>
              <small style="display:block; color:var(--text-dim); font-size:10.5px;">${m.category}</small>
            </div>
            <span class="badge info"><i class="fa-solid fa-award"></i> Verified</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  runHistoricalComparison();
}

async function runHistoricalComparison() {
  const ma = document.getElementById("time-month-a")?.value || "2026-01";
  const mb = document.getElementById("time-month-b")?.value || "2026-10";

  const res = await fetch(`${API}/history/compare?month_a=${ma}&month_b=${mb}`);
  const comp = await res.json();

  const el = document.getElementById("hist-compare-result");
  if (!el || comp.error) return;

  el.innerHTML = `
    <div style="font-size:13px; color:#fff; line-height:1.7; margin-bottom:12px;">
      <i class="fa-solid fa-sparkles" style="color:var(--accent-cyan);"></i> ${comp.narrative_explanation}
    </div>
    <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:10px; font-size:11px;">
      <div style="background:#0e1728; padding:8px 10px; border-radius:6px;">
        <span style="color:var(--text-dim);">Income Delta</span>
        <b style="display:block; color:#fff; margin-top:2px;">${comp.deltas.income >= 0 ? '+' : ''}${money(comp.deltas.income)}</b>
      </div>
      <div style="background:#0e1728; padding:8px 10px; border-radius:6px;">
        <span style="color:var(--text-dim);">Expense Delta</span>
        <b style="display:block; color:#fff; margin-top:2px;">${comp.deltas.expense >= 0 ? '+' : ''}${money(comp.deltas.expense)}</b>
      </div>
      <div style="background:#0e1728; padding:8px 10px; border-radius:6px;">
        <span style="color:var(--text-dim);">Savings Growth</span>
        <b style="display:block; color:var(--accent-green); margin-top:2px;">+${money(comp.deltas.savings)}</b>
      </div>
      <div style="background:#0e1728; padding:8px 10px; border-radius:6px;">
        <span style="color:var(--text-dim);">Net Worth Delta</span>
        <b style="display:block; color:var(--accent-cyan); margin-top:2px;">+${money(comp.deltas.net_worth)}</b>
      </div>
      <div style="background:#0e1728; padding:8px 10px; border-radius:6px;">
        <span style="color:var(--text-dim);">Health Score</span>
        <b style="display:block; color:var(--accent-violet); margin-top:2px;">+${comp.deltas.health_score} pts</b>
      </div>
    </div>
  `;
}

// ==========================================
// 8. RECOMMENDATION LAB - SHADOW REVIEWER (Section 8)
// ==========================================
async function renderRecommendationLab(container) {
  const res = await fetch(`${API}/recommendations/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      strategy_a: { name: "Strategy A: Conservative Savings", monthly_save: 5000, monthly_invest: 0, expected_return: 4.0 },
      strategy_b: { name: "Strategy B: Balanced Growth (60% Cash / 40% Equity)", monthly_save: 3000, monthly_invest: 2000, expected_return: 10.5 },
      risk_profile: "Moderate"
    })
  });
  const data = await res.json();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">SHADOW REVIEWER · MULTI-DIMENSIONAL STRATEGY TESTING</div>
        <h1>Recommendation Lab</h1>
        <p>Compare competing financial strategies before taking action. Evaluate tradeoffs across liquidity, growth, and volatility.</p>
      </div>
    </div>

    <!-- AI Verdict Callout -->
    <div class="panel" style="background:linear-gradient(145deg, #18243c, #111a2f); border-left:4px solid var(--accent-cyan); margin-bottom:24px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <div class="brand-mark" style="width:32px; height:32px; font-size:14px;"><i class="fa-solid fa-scale-balanced"></i></div>
        <h3 style="color:#fff;">AI Shadow Reviewer Synthesis</h3>
        <span class="badge info" style="margin-left:auto;">Decision-Support Mode</span>
      </div>
      <p style="font-size:13px; line-height:1.8; color:#e2e8f0;">${data.ai_verdict}</p>
      <small style="display:block; font-size:10px; color:var(--text-dim); margin-top:8px;">
        <i class="fa-solid fa-shield-halved"></i> ${data.disclaimer}
      </small>
    </div>

    <!-- 2 Strategy Profiles Side by Side -->
    <div class="grid-2col">
      <div class="panel">
        <div class="panel-header">
          <div>
            <span class="badge info">Strategy A</span>
            <h3 style="margin-top:6px;">${data.strategy_a.name}</h3>
          </div>
          <b style="color:var(--accent-green); font-size:16px;">₹${data.strategy_a.outcome_5yr.total.toLocaleString()}</b>
        </div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:12px;">5-Year Projected Outcome (Assumed 4.0% yield)</div>
        <div style="margin-bottom:12px;">
          <small style="color:var(--text-dim); font-size:10.5px;">Advantages:</small>
          <ul style="padding-left:18px; font-size:11.5px; color:#cbd5e1; margin-top:4px;">
            ${data.strategy_a.pros.map(p => `<li>${p}</li>`).join("")}
          </ul>
        </div>
        <div>
          <small style="color:var(--text-dim); font-size:10.5px;">Disadvantages:</small>
          <ul style="padding-left:18px; font-size:11.5px; color:#94a3b8; margin-top:4px;">
            ${data.strategy_a.cons.map(c => `<li>${c}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div class="panel" style="border-color:rgba(99,102,241,0.3);">
        <div class="panel-header">
          <div>
            <span class="badge warning">Strategy B (Recommended)</span>
            <h3 style="margin-top:6px;">${data.strategy_b.name}</h3>
          </div>
          <b style="color:var(--accent-cyan); font-size:16px;">₹${data.strategy_b.outcome_5yr.total.toLocaleString()}</b>
        </div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:12px;">5-Year Projected Outcome (Assumed 10.5% hybrid yield)</div>
        <div style="margin-bottom:12px;">
          <small style="color:var(--text-dim); font-size:10.5px;">Advantages:</small>
          <ul style="padding-left:18px; font-size:11.5px; color:#cbd5e1; margin-top:4px;">
            ${data.strategy_b.pros.map(p => `<li>${p}</li>`).join("")}
          </ul>
        </div>
        <div>
          <small style="color:var(--text-dim); font-size:10.5px;">Disadvantages:</small>
          <ul style="padding-left:18px; font-size:11.5px; color:#94a3b8; margin-top:4px;">
            ${data.strategy_b.cons.map(c => `<li>${c}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>

    <!-- Tradeoff Matrix -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>Trade-off Evaluation Matrix</h3>
          <span>Quantitative stress test across key investor priorities</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Evaluation Dimension</th>
              <th>Strategy A</th>
              <th>Strategy B</th>
              <th>Advantage</th>
              <th>Variance Context</th>
            </tr>
          </thead>
          <tbody>
            ${data.comparison_matrix.map(m => `
              <tr>
                <td><b>${m.dimension}</b></td>
                <td>${m.strategy_a}</td>
                <td>${m.strategy_b}</td>
                <td><span class="badge info">${m.winner}</span></td>
                <td style="font-size:11px; color:var(--text-dim);">${m.difference}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ==========================================
// 9. BUDGET & GOALS (Section 8 & 11)
// ==========================================
async function renderBudgetGoals(container) {
  const [bRes, gRes] = await Promise.all([
    fetch(`${API}/budgets`),
    fetch(`${API}/goals`)
  ]);
  const budgets = await bRes.json();
  const goals = await gRes.json();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">CATEGORY CAPS & WEALTH MILESTONES</div>
        <h1>Budget & Goals Management</h1>
        <p>Give every rupee a job with category thresholds and monitor visual savings milestone velocity.</p>
      </div>
    </div>

    <!-- Budgets Section -->
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header">
        <div>
          <h3>Category Budgets</h3>
          <span>Dynamic spending tracking with overrun warnings</span>
        </div>
      </div>
      <div class="grid-3col">
        ${budgets.map(b => {
          const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const isOver = b.spent > b.limit;
          return `
            <div class="panel" style="background:#090e1a;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <b style="color:#fff; font-size:14px;">${b.category}</b>
                <span class="badge ${isOver ? 'critical' : pct > 75 ? 'warning' : 'info'}">${pct}% Used</span>
              </div>
              <div style="font-size:12px; margin-bottom:8px;">
                <b>${money(b.spent)}</b> <span style="color:var(--text-dim);">/ ${money(b.limit)}</span>
              </div>
              <div style="height:6px; background:#1e293b; border-radius:4px; overflow:hidden; margin-bottom:10px;">
                <div style="height:100%; width:${pct}%; background:${isOver ? 'var(--accent-red)' : 'var(--accent-green)'};"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--text-dim);">
                <span>${money(Math.max(0, b.limit - b.spent))} remaining</span>
                <button class="icon-btn" style="padding:2px 6px;" onclick="deleteBudgetItem('${b.id}')"><i class="fa-solid fa-trash" style="font-size:9px; color:var(--accent-red);"></i></button>
              </div>
            </div>
          `;
        }).join("")}

        <!-- Add Budget Inline -->
        <div class="panel" style="background:rgba(255,255,255,0.02); border:1px dashed var(--border-line); display:flex; flex-direction:column; justify-content:center;">
          <h4 style="font-size:13px; margin-bottom:10px; color:#fff;">Add Category Budget</h4>
          <div class="form-group" style="margin-bottom:8px;">
            <input type="text" id="new-b-cat" placeholder="Category (e.g. Health)" style="font-size:11px; padding:6px 10px;" />
          </div>
          <div class="form-group" style="margin-bottom:10px;">
            <input type="number" id="new-b-limit" placeholder="Monthly Limit (₹)" style="font-size:11px; padding:6px 10px;" />
          </div>
          <button class="btn-primary" style="padding:6px 12px; font-size:11px; justify-content:center;" onclick="submitNewBudget()"><i class="fa-solid fa-plus"></i> Create Budget</button>
        </div>
      </div>
    </div>

    <!-- Savings Goals Section -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>Savings Goals</h3>
          <span>Progress rings and projected horizon dates</span>
        </div>
      </div>
      <div class="grid-2col">
        ${goals.map(g => {
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
          return `
            <div class="panel" style="background:#090e1a; display:flex; align-items:center; gap:18px;">
              <div class="score-circle" style="width:70px; height:70px; --pct:${pct}%;">
                <div class="score-inner">
                  <b style="font-size:14px;">${pct}%</b>
                </div>
              </div>
              <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <h4 style="font-size:14px; color:#fff;">${g.name}</h4>
                  <small style="color:var(--text-dim); font-size:10px;">Target: ${g.target_date}</small>
                </div>
                <div style="font-size:12px; margin:4px 0 8px;">
                  <b>${money(g.saved)}</b> <span style="color:var(--text-dim);">saved of ${money(g.target)}</span>
                </div>
                <div style="height:5px; background:#1e293b; border-radius:3px; overflow:hidden;">
                  <div style="height:100%; width:${pct}%; background:var(--accent-cyan);"></div>
                </div>
              </div>
              <button class="icon-btn" onclick="deleteGoalItem('${g.id}')"><i class="fa-solid fa-trash" style="font-size:10px; color:var(--accent-red);"></i></button>
            </div>
          `;
        }).join("")}

        <!-- Add Goal Inline -->
        <div class="panel" style="background:rgba(255,255,255,0.02); border:1px dashed var(--border-line);">
          <h4 style="font-size:13px; margin-bottom:10px; color:#fff;">Create New Savings Goal</h4>
          <div class="form-row" style="margin-bottom:8px;">
            <input type="text" id="new-g-name" placeholder="Goal name (e.g. Electric Vehicle)" style="font-size:11px; padding:6px 10px;" />
            <input type="number" id="new-g-target" placeholder="Target ₹" style="font-size:11px; padding:6px 10px;" />
          </div>
          <div class="form-row" style="margin-bottom:10px;">
            <input type="number" id="new-g-saved" placeholder="Initial saved ₹ (e.g. 0)" style="font-size:11px; padding:6px 10px;" />
            <input type="text" id="new-g-date" placeholder="Target Date (e.g. Dec 2026)" style="font-size:11px; padding:6px 10px;" />
          </div>
          <button class="btn-primary" style="padding:6px 12px; font-size:11px;" onclick="submitNewGoal()"><i class="fa-solid fa-plus"></i> Save Goal</button>
        </div>
      </div>
    </div>
  `;
}

async function submitNewBudget() {
  const cat = document.getElementById("new-b-cat")?.value;
  const limit = parseFloat(document.getElementById("new-b-limit")?.value);
  if (!cat || !limit) return;
  await fetch(`${API}/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category: cat, limit, period: "This month" })
  });
  await renderBudgetGoals(document.getElementById("app-content"));
}

async function deleteBudgetItem(id) {
  await fetch(`${API}/budgets/${id}`, { method: "DELETE" });
  await renderBudgetGoals(document.getElementById("app-content"));
}

async function submitNewGoal() {
  const name = document.getElementById("new-g-name")?.value;
  const target = parseFloat(document.getElementById("new-g-target")?.value);
  const saved = parseFloat(document.getElementById("new-g-saved")?.value || 0);
  const target_date = document.getElementById("new-g-date")?.value || "Dec 2026";
  if (!name || !target) return;

  await fetch(`${API}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, target, saved, target_date })
  });
  await renderBudgetGoals(document.getElementById("app-content"));
}

async function deleteGoalItem(id) {
  await fetch(`${API}/goals/${id}`, { method: "DELETE" });
  await renderBudgetGoals(document.getElementById("app-content"));
}

// ==========================================
// 10. INVESTMENT INTELLIGENCE (Section 11)
// ==========================================
async function renderInvestmentIntel(container) {
  const res = await fetch(`${API}/optimizer/investments?mode=self_directed&risk_profile=Moderate&budget=10000&years=5`);
  const data = await res.json();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">PORTFOLIO INTELLIGENCE · ALGORITHMIC ASSET ALLOCATION</div>
        <h1>Investment Intelligence & Planning</h1>
        <p>Mode A (Self-Directed) and Mode B (Automated Asset Allocation) with 10-year historical performance benchmarks.</p>
      </div>
      <span class="badge info"><i class="fa-solid fa-flask-vial"></i> Simulated Execution Only</span>
    </div>

    <!-- Mode Selector & Overview -->
    <div class="grid-2col" style="margin-bottom:24px;">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Asset Allocation Model</h3>
            <span>Risk Profile: ${data.risk_profile} · Diversification Index: ${data.diversification_score}/100</span>
          </div>
        </div>
        <div style="height:220px; position:relative;">
          <canvas id="chart-invest-allocation"></canvas>
        </div>
        <div style="display:flex; justify-content:center; gap:16px; margin-top:12px; font-size:11px; flex-wrap:wrap;">
          ${data.allocation.map(a => `
            <span><i class="fa-solid fa-circle" style="color:${a.color}; font-size:8px;"></i> ${a.asset} (${a.pct}%)</span>
          `).join("")}
        </div>
      </div>

      <div class="panel" style="background:#090e1a;">
        <h3 style="margin-bottom:12px;">Automated SIP Planning Model</h3>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
          Directing ₹10,000 monthly across this diversified mix yields an estimated blended CAGR of <b>${data.simulation.blended_annual_rate}%</b>.
        </p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
          <div style="background:#0f172a; padding:12px; border-radius:8px;">
            <small style="color:var(--text-dim); font-size:10px;">Total Contributed (5 Yrs)</small>
            <b style="display:block; font-size:16px; color:#fff; margin-top:4px;">${money(data.simulation.total_contributed)}</b>
          </div>
          <div style="background:#0f172a; padding:12px; border-radius:8px;">
            <small style="color:var(--accent-green); font-size:10px;">Projected Future Value</small>
            <b style="display:block; font-size:16px; color:var(--accent-green); margin-top:4px;">${money(data.simulation.projected_future_value)}</b>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-dim); line-height:1.6; border-top:1px solid var(--border-line); padding-top:10px;">
          <i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-orange);"></i> <b>Transparency Guardrail:</b> Modeled for educational allocation planning. No real market orders are dispatched.
        </div>
      </div>
    </div>

    <!-- 10-Year Historical Benchmarks Table -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>10-Year Asset Class Performance Benchmarks</h3>
          <span>Historical Indian market data (2016 - 2026)</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Asset Class</th>
              <th>10-Year CAGR</th>
              <th>Volatility Regime</th>
              <th>Sharpe Ratio</th>
            </tr>
          </thead>
          <tbody>
            ${data.historical_benchmarks.map(b => `
              <tr>
                <td><b>${b.asset}</b></td>
                <td style="color:var(--accent-green); font-family:var(--font-mono); font-weight:700;">${b.cagr_10yr}</td>
                <td><span class="badge info">${b.volatility}</span></td>
                <td style="font-family:var(--font-mono);">${b.sharpe_ratio}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const ctxAlloc = document.getElementById("chart-invest-allocation").getContext("2d");
  chartInstances["invest-alloc"] = new Chart(ctxAlloc, {
    type: "doughnut",
    data: {
      labels: data.allocation.map(a => a.asset),
      datasets: [{
        data: data.allocation.map(a => a.pct),
        backgroundColor: data.allocation.map(a => a.color),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: "65%"
    }
  });
}

// ==========================================
// 11. ANALYTICS & REPORTING (Section 16)
// ==========================================
async function renderAnalytics(container) {
  await loadDashboardData();
  const d = dashboardData;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">ENTERPRISE REPORTING & CASH FLOW DRILL-DOWN</div>
        <h1>Financial Analytics & Reporting</h1>
        <p>Merchant analytics, payment source distributions, quarterly comparisons, and verified exports.</p>
      </div>
      <a href="${API}/reports/export-csv" class="btn-primary" download>
        <i class="fa-solid fa-file-csv"></i> Download Reconciled CSV
      </a>
    </div>

    <!-- Category Breakdown + Monthly Outlays Chart -->
    <div class="grid-2col">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Category Spending Distribution</h3>
            <span>Percentage of total monthly budget</span>
          </div>
        </div>
        <div style="height:250px; position:relative;">
          <canvas id="chart-analytics-cat"></canvas>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Payment Source Volume</h3>
            <span>Verified transactions by connected source</span>
          </div>
        </div>
        <div style="height:250px; position:relative;">
          <canvas id="chart-analytics-source"></canvas>
        </div>
      </div>
    </div>

    <!-- Merchant Analytics Table -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>Merchant Concentration Analysis</h3>
          <span>Highest volume transaction counterparties</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Counterparty / Merchant</th>
              <th>Category</th>
              <th>Volume (INR)</th>
              <th>Payment Channel</th>
              <th>Reconciliation Status</th>
            </tr>
          </thead>
          <tbody>
            ${d.transactions.slice(0, 8).map(t => `
              <tr>
                <td><b>${t.merchant}</b></td>
                <td><span class="badge info">${t.category}</span></td>
                <td style="font-weight:700;">${money(t.amount)}</td>
                <td style="color:var(--text-dim);">${t.source}</td>
                <td><span class="badge info"><i class="fa-solid fa-check"></i> Reconciled</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Bar Charts
  const ctxCat = document.getElementById("chart-analytics-cat").getContext("2d");
  chartInstances["analytics-cat"] = new Chart(ctxCat, {
    type: "bar",
    data: {
      labels: d.categories.slice(0, 6).map(c => c.name),
      datasets: [{
        label: "Spend (₹)",
        data: d.categories.slice(0, 6).map(c => c.value),
        backgroundColor: "#6366f1",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
        y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b", callback: v => `₹${v/1000}k` } }
      }
    }
  });

  const ctxSrc = document.getElementById("chart-analytics-source").getContext("2d");
  chartInstances["analytics-src"] = new Chart(ctxSrc, {
    type: "doughnut",
    data: {
      labels: ["Bank statement", "Google Pay", "PhonePe", "Amazon Pay", "BHIM", "Paytm"],
      datasets: [{
        data: [106000, 1600, 2200, 2840, 2140, 1250],
        backgroundColor: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { color: "#94a3b8", font: { size: 10.5 } } } },
      cutout: "60%"
    }
  });
}

// ==========================================
// 12. SECURITY & AUDIT (Section 9)
// ==========================================
async function renderSecurityAudit(container) {
  const [auditRes, srcRes] = await Promise.all([
    fetch(`${API}/audit`),
    fetch(`${API}/payment-sources`)
  ]);
  const auditLogs = await auditRes.json();
  const sources = await srcRes.json();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">IMMUTABLE LOGS · PERMISSION TRANSPARENCY · PRIVACY CONTROLS</div>
        <h1>Security & Audit Centre</h1>
        <p>Comprehensive audit timeline, consent records, and payment application integration controls.</p>
      </div>
    </div>

    <!-- Connected Payment Applications Tracking (Section 14) -->
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header">
        <div>
          <h3>Connected Payment Sources</h3>
          <span>Browser transparency: Permissions are explicit; web apps cannot secretly scan mobile storage</span>
        </div>
      </div>
      <div class="grid-3col">
        ${sources.map(s => `
          <div class="panel" style="background:#090e1a; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <b style="color:#fff; font-size:13.5px; display:block;">${s.name}</b>
              <small style="color:var(--text-dim); font-size:10px;">${s.count} records · ${s.last_sync}</small>
              <div style="font-size:10px; color:var(--accent-cyan); margin-top:4px;"><span class="status-dot"></span> ${s.status}</div>
            </div>
            <label style="cursor:pointer;">
              <input type="checkbox" ${s.included ? 'checked' : ''} onchange="togglePaymentSource('${s.id}', this.checked)" />
            </label>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Audit Events Timeline -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>System Audit Trail (${auditLogs.length})</h3>
          <span>Cryptographically auditable workspace actions</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Status</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${auditLogs.map(a => `
              <tr>
                <td><b>${a.event}</b></td>
                <td><span class="badge info">${a.action}</span></td>
                <td>${a.entity_type}</td>
                <td><span class="badge info"><i class="fa-solid fa-check"></i> ${a.status}</span></td>
                <td style="font-size:11px; color:#cbd5e1;">${a.details || '—'}</td>
                <td style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-dim);">${formatDate(a.timestamp)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function togglePaymentSource(id, included) {
  await fetch(`${API}/payment-sources/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ included })
  });
  await renderSecurityAudit(document.getElementById("app-content"));
}

// ==========================================
// 13. SETTINGS & PERSONAL MEMORY (Section 12)
// ==========================================
async function renderSettings(container) {
  const memRes = await fetch(`${API}/memory`);
  const memories = await memRes.json();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">USER PROFILE · CONTEXT PREFERENCES · DATA CONTROLS</div>
        <h1>Settings & Personal Financial Memory</h1>
        <p>Personalize AI context, manage stored financial preferences, and control demo workspace data.</p>
      </div>
    </div>

    <!-- Section 12: Personal Financial Memory -->
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header">
        <div>
          <h3>Personal Financial Memory (Section 12)</h3>
          <span>Context stored securely to personalize future AI Money Coach recommendations</span>
        </div>
        <button class="btn-danger" onclick="resetMemoryAll()">Clear AI Memory</button>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
        ${memories.map(m => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:#090e1a; padding:10px 14px; border-radius:8px; border:1px solid var(--border-line);">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <b style="color:#fff; font-size:12.5px;">${m.key}</b>
                <span class="badge info">${m.category}</span>
              </div>
              <p style="font-size:11.5px; color:var(--text-muted); margin:4px 0 0;">${m.value}</p>
            </div>
            <button class="icon-btn" onclick="removeMemoryItem('${m.key}')"><i class="fa-solid fa-trash" style="font-size:10px; color:var(--accent-red);"></i></button>
          </div>
        `).join("")}
      </div>

      <!-- Add Preference Form -->
      <div style="background:rgba(255,255,255,0.02); border:1px dashed var(--border-line); border-radius:8px; padding:14px;">
        <h4 style="font-size:12.5px; margin-bottom:10px; color:#fff;">Store New Personal Financial Preference</h4>
        <div class="form-row" style="margin-bottom:8px;">
          <input type="text" id="new-mem-key" placeholder="Key (e.g. laptop_budget_cap)" style="font-size:11px;" />
          <input type="text" id="new-mem-val" placeholder="Value (e.g. Save ₹80,000 before upgrading MacBook)" style="font-size:11px;" />
        </div>
        <button class="btn-primary" style="padding:6px 12px; font-size:11px;" onclick="submitNewMemory()">
          <i class="fa-solid fa-plus"></i> Store in Memory
        </button>
      </div>
    </div>

    <!-- Data Controls Card -->
    <div class="panel" style="background:#090e1a; border-color:rgba(239,68,68,0.25);">
      <h3 style="color:#fff; margin-bottom:8px;">Workspace Demo Data Controls</h3>
      <p style="font-size:12px; color:var(--text-muted); line-height:1.6; margin-bottom:14px;">
        Reset the workspace to the pristine canonical records (Salary Acme Labs, Swiggy, Netflix, Uber, Nifty 50 SIP) and restore 10-month historical snapshots.
      </p>
      <button class="btn-danger" onclick="resetDemoWorkspace()">
        <i class="fa-solid fa-rotate-left"></i> Reset Demo Workspace to Canonical Data
      </button>
    </div>
  `;
}

async function submitNewMemory() {
  const k = document.getElementById("new-mem-key")?.value;
  const v = document.getElementById("new-mem-val")?.value;
  if (!k || !v) return;

  await fetch(`${API}/memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: k, value: v, category: "preference", confidence: 1.0 })
  });
  await renderSettings(document.getElementById("app-content"));
}

async function removeMemoryItem(key) {
  await fetch(`${API}/memory/${key}`, { method: "DELETE" });
  await renderSettings(document.getElementById("app-content"));
}

async function resetMemoryAll() {
  if (!confirm("Reset all stored AI memory?")) return;
  await fetch(`${API}/memory/reset`, { method: "POST" });
  await renderSettings(document.getElementById("app-content"));
}

async function resetDemoWorkspace() {
  if (!confirm("Reset demo workspace data to canonical state?")) return;
  await fetch(`${API}/reset-demo`, { method: "POST" });
  alert("Workspace reset to canonical ground truth!");
  await initApp();
}

// ==========================================
// MODALS & EVENT HANDLERS
// ==========================================
function toggleNotifications() {
  const d = document.getElementById("notif-drawer");
  d.classList.toggle("open");
}

function openAddTransactionModal() {
  const now = new Date();
  const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById("txn-date").value = isoLocal;
  document.getElementById("modal-transaction").style.display = "grid";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

async function submitTransaction(e) {
  e.preventDefault();
  const merchant = document.getElementById("txn-merchant").value;
  const amount = parseFloat(document.getElementById("txn-amount").value);
  const direction = document.getElementById("txn-direction").value;
  const category = document.getElementById("txn-category").value;
  const source = document.getElementById("txn-source").value;
  const dateStr = document.getElementById("txn-date").value;
  const notes = document.getElementById("txn-notes").value;

  const res = await fetch(`${API}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant,
      amount,
      direction,
      category,
      source,
      date: new Date(dateStr).toISOString(),
      notes
    })
  });
  const result = await res.json();
  closeModal("modal-transaction");

  if (result.triggered_rules && result.triggered_rules.length > 0) {
    alert(`Transaction recorded!\n\nTriggered Financial Rule: ${result.triggered_rules[0].rule_name}\n${result.triggered_rules[0].summary}`);
  }

  await loadDashboardData();
  await checkUnreadAnomalies();
  navigate(currentPage);
}

// Open Explainability Engine Deep-Dive (Section 5)
async function openExplainabilityModal(insightId) {
  const res = await fetch(`${API}/explainability/${insightId}`);
  const exp = await res.json();

  document.getElementById("exp-title").textContent = exp.title;
  document.getElementById("exp-body").innerHTML = `
    <div style="margin-bottom:14px; background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px;">
      <b style="color:var(--accent-cyan); display:block; margin-bottom:4px;">1. What happened?</b>
      <p style="margin:0; color:#e2e8f0;">${exp.what_happened}</p>
    </div>

    <div style="margin-bottom:14px; background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px;">
      <b style="color:var(--accent-cyan); display:block; margin-bottom:4px;">2. Why did it happen?</b>
      <p style="margin:0; color:#e2e8f0;">${exp.why_did_it_happen}</p>
    </div>

    <div style="margin-bottom:14px; background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px;">
      <b style="color:var(--accent-cyan); display:block; margin-bottom:4px;">3. Calculation Model & Assumptions</b>
      <p style="margin:0 0 6px; color:#cbd5e1;"><b>Model:</b> ${exp.model_used}</p>
      <p style="margin:0; color:#cbd5e1;"><b>Assumptions:</b> ${exp.assumptions_made}</p>
    </div>

    <div style="margin-bottom:14px; background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px;">
      <b style="color:var(--accent-cyan); display:block; margin-bottom:4px;">4. Financial Indicators Considered</b>
      <div style="display:flex; gap:8px; margin-top:4px; flex-wrap:wrap;">
        ${exp.indicators_considered.map(ind => `<span class="badge info">${ind}</span>`).join("")}
      </div>
    </div>

    <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.25); border-radius:8px; padding:10px 14px;">
      <b style="color:var(--accent-green); display:block; margin-bottom:4px;">5. Recommended Action</b>
      <p style="margin:0; color:#e2e8f0;">${exp.recommended_action}</p>
    </div>
  `;
  document.getElementById("modal-explainability").style.display = "grid";
}

function openExplainabilityForTxn(tid) {
  openExplainabilityModal(tid);
}

// Open Financial Health Score Factor Breakdown
function openHealthModal() {
  if (!dashboardData?.health_score) return;
  const hs = dashboardData.health_score;

  document.getElementById("health-factors-list").innerHTML = hs.factors.map(f => `
    <div style="background:#090e1a; border:1px solid var(--border-line); border-radius:8px; padding:12px 14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <b style="color:#fff; font-size:13px;">${f.name} (Weight: ${f.weight})</b>
        <span class="badge info">${f.score} / ${f.max_score} (${f.status})</span>
      </div>
      <p style="font-size:11.5px; color:var(--text-muted); margin:0;">${f.explanation}</p>
    </div>
  `).join("");

  document.getElementById("modal-health").style.display = "grid";
}

function handleGlobalSearch(val) {
  if (currentPage !== "Transactions") {
    navigate("Transactions");
    setTimeout(() => {
      const qInput = document.getElementById("txn-filter-q");
      if (qInput) {
        qInput.value = val;
        filterTransactionsTable();
      }
    }, 100);
  } else {
    const qInput = document.getElementById("txn-filter-q");
    if (qInput) {
      qInput.value = val;
      filterTransactionsTable();
    }
  }
}

function handlePeriodChange(p) {
  activePeriod = p;
  loadDashboardData().then(() => navigate(currentPage));
}

// Boot application when DOM is ready
window.addEventListener("DOMContentLoaded", initApp);
