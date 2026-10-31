"""
Money Copilot - AI-Powered Personal Financial Intelligence Platform
Enterprise FastAPI Backend Server
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

from .database import init_db, get_db
from .models import (
    TransactionCreate, TransactionUpdate, DuplicateActionRequest,
    PaymentSourceUpdate, BudgetCreate, GoalCreate, GoalUpdate,
    RuleInterpretRequest, RuleCreate, RuleUpdate,
    CopilotRequest, SimulationRequest, StrategyCompareRequest,
    MemoryItem, ProfileUpdate
)
from .services.seed_data import seed_database
from .services.financial_engine import get_dashboard_summary, calculate_financial_health_score
from .services.rule_engine import interpret_natural_language_rule, create_rule, evaluate_all_rules_for_transaction, get_rules_and_logs
from .services.anomaly_engine import scan_and_generate_anomalies, get_explainable_insight
from .services.duplicate_engine import detect_duplicates_in_database, handle_duplicate_action
from .services.drift_engine import get_drift_observations, update_drift_status
from .services.simulation_engine import run_financial_simulation, save_simulation, get_saved_simulations
from .services.history_engine import get_financial_history, compare_historical_months
from .services.shadow_reviewer import compare_strategies
from .services.copilot_engine import process_copilot_query
from .services.optimizer_engine import get_savings_opportunities, get_investment_intelligence
from .services.audit_engine import log_audit_event, get_audit_trail, get_financial_memory, upsert_financial_memory, delete_financial_memory, reset_financial_memory

app = FastAPI(
    title="Money Copilot AI Intelligence Platform",
    description="Cogniflow-inspired Financial Analytics, Explainability, Rules, and Simulation Engine",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database and Seed Canonical Data on startup
@app.on_event("startup")
def startup_event():
    init_db()
    seed_database()

# Health check
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "system": "Money Copilot AI Financial Intelligence OS",
        "version": "2.0.0",
        "database": "SQLite WAL Mode (Local Persistent)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ==========================================
# 1. FINANCIAL DASHBOARD & OVERVIEW (Section 3)
# ==========================================
@app.get("/api/dashboard")
def get_dashboard(period: str = "This month"):
    return get_dashboard_summary(user_id="demo-user", period=period)

@app.get("/api/health-score")
def get_health_score():
    data = get_dashboard_summary(user_id="demo-user")
    return data["health_score"]

# ==========================================
# 2. TRANSACTIONS & DUPLICATE INTELLIGENCE (Section 14)
# ==========================================
@app.get("/api/transactions")
def get_transactions(
    category: Optional[str] = None,
    source: Optional[str] = None,
    direction: Optional[str] = None,
    q: Optional[str] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM transactions WHERE user_id = 'demo-user'"
        params = []
        
        if category and category != "All categories":
            query += " AND category = ?"
            params.append(category)
        if source and source != "All sources":
            query += " AND source = ?"
            params.append(source)
        if direction and direction != "All":
            query += " AND direction = ?"
            params.append(direction.lower())
        if q:
            query += " AND (merchant LIKE ? OR category LIKE ? OR notes LIKE ?)"
            wildcard = f"%{q}%"
            params.extend([wildcard, wildcard, wildcard])
            
        query += " ORDER BY date DESC"
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

@app.post("/api/transactions")
def add_transaction(item: TransactionCreate):
    now_str = datetime.now(timezone.utc).isoformat()
    tid = str(uuid.uuid4())
    ref_id = str(uuid.uuid4())[:12].upper()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO transactions (id, user_id, merchant, amount, direction, category, date, source, status, notes, canonical, reference_id, created_at, is_duplicate, duplicate_status)
        VALUES (?, 'demo-user', ?, ?, ?, ?, ?, ?, 'completed', ?, 1, ?, ?, 0, 'none')
        """, (tid, item.merchant, item.amount, item.direction, item.category, item.date, item.source, item.notes, ref_id, now_str))

        log_audit_event("demo-user", "Transaction Created", "transaction", "CREATE", f"Recorded {item.direction} of ₹{item.amount:,.0f} at {item.merchant} ({item.category})", tid)

    # Trigger backend financial rules evaluation
    txn_dict = item.dict()
    txn_dict["id"] = tid
    rule_logs = evaluate_all_rules_for_transaction("demo-user", txn_dict)

    return {
        "id": tid,
        "reference_id": ref_id,
        "message": "Transaction added and reconciled successfully",
        "triggered_rules": rule_logs
    }

@app.put("/api/transactions/{transaction_id}")
def update_transaction(transaction_id: str, item: TransactionUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE id = ? AND user_id = 'demo-user'", (transaction_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Transaction not found")

        updates = []
        params = []
        for field, val in item.dict(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            params.append(val)

        if updates:
            params.extend([transaction_id, "demo-user"])
            cursor.execute(f"UPDATE transactions SET {', '.join(updates)} WHERE id = ? AND user_id = ?", params)
            log_audit_event("demo-user", "Transaction Modified", "transaction", "UPDATE", f"Updated fields for transaction {transaction_id}", transaction_id)

    return {"ok": True, "id": transaction_id}

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = 'demo-user'", (transaction_id,))
        log_audit_event("demo-user", "Transaction Deleted", "transaction", "DELETE", f"Deleted transaction {transaction_id}", transaction_id)
    return {"ok": True, "id": transaction_id}

@app.get("/api/transactions/duplicates")
def get_duplicates():
    return detect_duplicates_in_database("demo-user")

@app.post("/api/transactions/duplicates/{transaction_id}/action")
def resolve_duplicate(transaction_id: str, payload: DuplicateActionRequest):
    return handle_duplicate_action(transaction_id, payload.action, "demo-user")

# ==========================================
# 3. PAYMENT SOURCES (Supported App Tracking)
# ==========================================
@app.get("/api/payment-sources")
def get_payment_sources():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payment_sources WHERE user_id = 'demo-user'")
        return [dict(row) for row in cursor.fetchall()]

@app.patch("/api/payment-sources/{source_id}")
def update_payment_source(source_id: str, payload: PaymentSourceUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE payment_sources 
        SET included = ? 
        WHERE id = ? AND user_id = 'demo-user'
        """, (1 if payload.included else 0, source_id))
        
        log_audit_event("demo-user", "Payment Source Toggled", "payment_source", "TOGGLE", f"Payment source {source_id} inclusion set to {payload.included}", source_id)
    return {"ok": True, "id": source_id, "included": payload.included}

# ==========================================
# 4. BUDGETS & GOALS
# ==========================================
@app.get("/api/budgets")
def get_budgets():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM budgets WHERE user_id = 'demo-user'")
        budgets_raw = [dict(row) for row in cursor.fetchall()]
        
        # calculate actual spent
        for b in budgets_raw:
            cursor.execute("SELECT SUM(amount) as s FROM transactions WHERE user_id = 'demo-user' AND category = ? AND direction = 'expense' AND canonical = 1", (b["category"],))
            b["spent"] = round(cursor.fetchone()["s"] or 0.0, 2)
            b["limit"] = b["limit_amount"]
        return budgets_raw

@app.post("/api/budgets")
def create_budget(item: BudgetCreate):
    bid = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO budgets (id, user_id, category, limit_amount, period)
        VALUES (?, 'demo-user', ?, ?, ?)
        """, (bid, item.category, item.limit, item.period))
        log_audit_event("demo-user", "Budget Created", "budget", "CREATE", f"Created budget for {item.category} with limit ₹{item.limit:,.0f}", bid)
    return {"id": bid, "category": item.category, "limit": item.limit, "period": item.period}

@app.delete("/api/budgets/{budget_id}")
def delete_budget(budget_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM budgets WHERE id = ? AND user_id = 'demo-user'", (budget_id,))
    return {"ok": True, "id": budget_id}

@app.get("/api/goals")
def get_goals():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM goals WHERE user_id = 'demo-user'")
        return [dict(row) for row in cursor.fetchall()]

@app.post("/api/goals")
def create_goal(item: GoalCreate):
    gid = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO goals (id, user_id, name, target, saved, target_date)
        VALUES (?, 'demo-user', ?, ?, ?, ?)
        """, (gid, item.name, item.target, item.saved, item.target_date))
        log_audit_event("demo-user", "Goal Created", "goal", "CREATE", f"Created goal '{item.name}' targeting ₹{item.target:,.0f}", gid)
    return {"id": gid, "name": item.name, "target": item.target, "saved": item.saved, "target_date": item.target_date}

@app.patch("/api/goals/{goal_id}")
def update_goal(goal_id: str, payload: GoalUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE goals SET saved = ? WHERE id = ? AND user_id = 'demo-user'", (payload.saved, goal_id))
    return {"ok": True, "id": goal_id, "saved": payload.saved}

@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM goals WHERE id = ? AND user_id = 'demo-user'", (goal_id,))
    return {"ok": True, "id": goal_id}

# ==========================================
# 5. RULEGPT FINANCIAL RULES (Section 4)
# ==========================================
@app.post("/api/rules/interpret")
def interpret_rule(payload: RuleInterpretRequest):
    return interpret_natural_language_rule(payload.instruction)

@app.get("/api/rules")
def list_rules():
    return get_rules_and_logs("demo-user")

@app.post("/api/rules")
def add_rule(payload: RuleCreate):
    return create_rule("demo-user", payload.dict())

@app.patch("/api/rules/{rule_id}")
def modify_rule(rule_id: str, payload: RuleUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        params = []
        for k, v in payload.dict(exclude_unset=True).items():
            updates.append(f"{k} = ?")
            params.append(v)
        if updates:
            params.extend([rule_id, "demo-user"])
            cursor.execute(f"UPDATE financial_rules SET {', '.join(updates)} WHERE id = ? AND user_id = ?", params)
    return {"ok": True, "id": rule_id}

@app.delete("/api/rules/{rule_id}")
def remove_rule(rule_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM financial_rules WHERE id = ? AND user_id = 'demo-user'", (rule_id,))
    return {"ok": True, "id": rule_id}

@app.post("/api/rules/{rule_id}/test")
def test_rule(rule_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM financial_rules WHERE id = ? AND user_id = 'demo-user'", (rule_id,))
        rule = cursor.fetchone()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        # Run against latest transaction
        cursor.execute("SELECT * FROM transactions WHERE user_id = 'demo-user' ORDER BY date DESC LIMIT 1")
        sample_txn = cursor.fetchone()
        
        triggered = evaluate_all_rules_for_transaction("demo-user", dict(sample_txn))
        return {
            "tested_rule": rule["name"],
            "sample_transaction": dict(sample_txn),
            "triggered": len(triggered) > 0,
            "logs": triggered
        }

# ==========================================
# 6. ANOMALY DETECTION & EXPLAINABILITY (Sections 5 & 15)
# ==========================================
@app.get("/api/anomalies")
def get_anomalies():
    return scan_and_generate_anomalies("demo-user")

@app.post("/api/anomalies/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE anomaly_alerts SET status = 'acknowledged' WHERE id = ? AND user_id = 'demo-user'", (alert_id,))
    return {"ok": True, "id": alert_id, "status": "acknowledged"}

@app.post("/api/anomalies/{alert_id}/dismiss")
def dismiss_alert(alert_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE anomaly_alerts SET status = 'dismissed' WHERE id = ? AND user_id = 'demo-user'", (alert_id,))
    return {"ok": True, "id": alert_id, "status": "dismissed"}

@app.get("/api/explainability/{insight_id}")
def explain_insight(insight_id: str):
    return get_explainable_insight(insight_id, "demo-user")

# ==========================================
# 7. BEHAVIORAL DRIFT DETECTION (Section 10)
# ==========================================
@app.get("/api/drift")
def list_drift():
    return get_drift_observations("demo-user")

@app.patch("/api/drift/{observation_id}")
def change_drift_status(observation_id: str, status: str = Query(..., pattern="^(active|acknowledged|dismissed)$")):
    return update_drift_status(observation_id, status, "demo-user")

# ==========================================
# 8. WHAT-IF SIMULATION LAB (Section 6)
# ==========================================
@app.post("/api/simulate")
def simulate(req: SimulationRequest):
    return run_financial_simulation(
        monthly_saving=req.monthly,
        years=req.years,
        rate=req.rate,
        income_delta=req.income_delta,
        expense_pct_delta=req.expense_pct_delta,
        one_time_purchase=req.one_time_purchase,
        monthly_investment=req.monthly_investment,
        scenario_type=req.scenario_type
    )

@app.post("/api/simulations/save")
def save_sim(req: SimulationRequest):
    return save_simulation("demo-user", req.dict())

@app.get("/api/simulations")
def list_simulations():
    return get_saved_simulations("demo-user")

@app.delete("/api/simulations/{sim_id}")
def delete_sim(sim_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM simulations WHERE id = ? AND user_id = 'demo-user'", (sim_id,))
    return {"ok": True, "id": sim_id}

# ==========================================
# 9. FINANCIAL TIME MACHINE / HISTORY (Section 7)
# ==========================================
@app.get("/api/history")
def get_history():
    return get_financial_history("demo-user")

@app.get("/api/history/compare")
def compare_history(month_a: str = Query("2026-01"), month_b: str = Query("2026-10")):
    return compare_historical_months(month_a, month_b, "demo-user")

# ==========================================
# 10. RECOMMENDATION LAB / SHADOW REVIEWER (Section 8)
# ==========================================
@app.post("/api/recommendations/compare")
def shadow_review(payload: StrategyCompareRequest):
    return compare_strategies(payload.strategy_a, payload.strategy_b, payload.risk_profile)

# ==========================================
# 11. AI MONEY COACH (Section 13)
# ==========================================
@app.post("/api/copilot")
def copilot(payload: CopilotRequest):
    return process_copilot_query(payload.question, user_id="demo-user", context=payload.context)

# ==========================================
# 12. SAVINGS & INVESTMENT OPTIMIZER (Section 11)
# ==========================================
@app.get("/api/optimizer/savings")
def get_savings_opt():
    return get_savings_opportunities("demo-user")

@app.get("/api/optimizer/investments")
def get_invest_opt(
    mode: str = Query("self_directed"),
    risk_profile: str = Query("Moderate"),
    budget: float = Query(10000.0),
    years: int = Query(5)
):
    return get_investment_intelligence(mode, risk_profile, budget, years)

# ==========================================
# 13. PERSONAL FINANCIAL MEMORY (Section 12)
# ==========================================
@app.get("/api/memory")
def get_memory():
    return get_financial_memory("demo-user")

@app.post("/api/memory")
def save_memory(item: MemoryItem):
    return upsert_financial_memory("demo-user", item.key, item.value, item.category, item.confidence)

@app.delete("/api/memory/{key}")
def remove_memory(key: str):
    return delete_financial_memory("demo-user", key)

@app.post("/api/memory/reset")
def reset_memory():
    return reset_financial_memory("demo-user")

# ==========================================
# 14. SECURITY, AUDIT & DATA CONTROLS (Section 9)
# ==========================================
@app.get("/api/audit")
def get_audit(limit: int = 50):
    return get_audit_trail("demo-user", limit)

@app.post("/api/reset-demo")
def reset_demo():
    seed_database(force_reset=True)
    return {"ok": True, "message": "Demo workspace successfully restored to canonical ground truth."}

@app.get("/api/reports/export-csv")
def export_csv():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE user_id = 'demo-user' AND canonical = 1 ORDER BY date DESC")
        rows = cursor.fetchall()

    csv_data = "Transaction ID,Date,Merchant,Category,Direction,Amount (INR),Source,Reference ID,Status\n"
    for r in rows:
        csv_data += f'"{r["id"]}","{r["date"]}","{r["merchant"]}","{r["category"]}","{r["direction"]}",{r["amount"]},"{r["source"]}","{r["reference_id"]}","{r["status"]}"\n'

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=money_copilot_canonical_transactions.csv"}
    )

# ==========================================
# 15. FRONTEND STATIC ASSETS SERVING
# ==========================================
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=os.path.join(STATIC_DIR, "static")), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
