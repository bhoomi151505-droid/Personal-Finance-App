"""
Money Copilot - Historical Wealth Tracker & Financial Time Machine (Section 7)
Maintains historical month snapshots, compares any two selected periods,
and tracks net worth, health score, and milestone history over time.
"""

import json
from ..database import get_db

def get_financial_history(user_id="demo-user"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM historical_snapshots 
        WHERE user_id = ? 
        ORDER BY month_key ASC
        """, (user_id,))
        snapshots = [dict(row) for row in cursor.fetchall()]
        
        for s in snapshots:
            s["milestones"] = json.loads(s.get("milestones") or "[]")

        # Yearly summary aggregation for 2026
        total_income = sum(s["income"] for s in snapshots)
        total_expense = sum(s["expense"] for s in snapshots)
        total_savings = sum(s["savings"] for s in snapshots)
        avg_savings_rate = round(total_savings / total_income * 100, 1) if total_income > 0 else 0.0

        yearly_summary = {
            "year": "2026 (Jan - Oct)",
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "total_savings": round(total_savings, 2),
            "avg_savings_rate": avg_savings_rate,
            "peak_month": max(snapshots, key=lambda x: x["savings"])["month_key"] if snapshots else "2026-04",
            "net_worth_growth": round(snapshots[-1]["net_worth"] - snapshots[0]["net_worth"], 2) if len(snapshots) > 1 else 0.0
        }

        # Milestones Timeline
        milestones = [
            {"date": "2026-01", "title": "Automated ₹5,000 SIP Mandate Initialized", "category": "Investment"},
            {"date": "2026-03", "title": "Emergency Fund Surpassed ₹1,00,000 Balance", "category": "Savings"},
            {"date": "2026-04", "title": "Highest Monthly Surplus Recorded (₹55,000)", "category": "Cash Flow"},
            {"date": "2026-08", "title": "Net Worth Crossed ₹5,50,000 Threshold", "category": "Wealth"},
            {"date": "2026-10", "title": "Current Health Score Peak: 86/100 Prime Tier", "category": "Health Score"},
        ]

        return {
            "snapshots": snapshots,
            "yearly_summary": yearly_summary,
            "milestones": milestones
        }

def compare_historical_months(month_a: str, month_b: str, user_id="demo-user"):
    """
    Compares two monthly financial positions in depth:
    e.g. Month A (January 2026) vs Month B (October 2026)
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM historical_snapshots WHERE user_id = ? AND month_key = ?", (user_id, month_a))
        row_a = cursor.fetchone()
        cursor.execute("SELECT * FROM historical_snapshots WHERE user_id = ? AND month_key = ?", (user_id, month_b))
        row_b = cursor.fetchone()

        if not row_a or not row_b:
            return {"error": "One or both selected months not found in snapshots."}

        a = dict(row_a)
        b = dict(row_b)

        delta_income = b["income"] - a["income"]
        delta_expense = b["expense"] - a["expense"]
        delta_savings = b["savings"] - a["savings"]
        delta_net_worth = b["net_worth"] - a["net_worth"]
        delta_health_score = b["health_score"] - a["health_score"]

        verdict = f"Between {month_a} and {month_b}, your net monthly savings increased from ₹{a['savings']:,.0f} to ₹{b['savings']:,.0f} (a ₹{abs(delta_savings):,.0f} {'increase' if delta_savings >= 0 else 'decrease'}). Net worth expanded by ₹{delta_net_worth:,.0f}."

        return {
            "month_a": a,
            "month_b": b,
            "deltas": {
                "income": round(delta_income, 2),
                "expense": round(delta_expense, 2),
                "savings": round(delta_savings, 2),
                "net_worth": round(delta_net_worth, 2),
                "health_score": round(delta_health_score, 1),
            },
            "narrative_explanation": verdict
        }
