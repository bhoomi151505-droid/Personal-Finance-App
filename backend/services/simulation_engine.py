"""
Money Copilot - Financial What-If Simulator & Projections Lab (Section 6)
Computes multi-horizon scenarios (Optimistic, Expected, Conservative),
goal completion shifts, cash flow deltas, and saves simulation models.
"""

import math
import uuid
import json
from datetime import datetime, timezone
from ..database import get_db

def run_financial_simulation(
    monthly_saving: float = 5000.0,
    years: int = 5,
    rate: float = 8.0,
    income_delta: float = 0.0,
    expense_pct_delta: float = 0.0,
    one_time_purchase: float = 0.0,
    monthly_investment: float = 0.0,
    scenario_type: str = "Custom Scenario"
):
    """
    Simulates multi-year financial trajectory with 3 distinct market regimes:
    1. Conservative: (rate - 2.5)%
    2. Expected: rate%
    3. Optimistic: (rate + 3.0)%
    """
    total_months = max(1, years * 12)
    
    # Net monthly cash addition
    effective_monthly_addition = monthly_saving + income_delta + monthly_investment
    
    # Base capital contributions
    total_contributed = effective_monthly_addition * total_months
    
    def compound_fv(monthly_amt, annual_rate, months, initial_deduction=0.0):
        r = (annual_rate / 100.0) / 12.0
        if r <= 0:
            fv = monthly_amt * months - initial_deduction
        else:
            # Future Value of an Ordinary Annuity: PMT * ((1+r)^n - 1) / r
            fv = monthly_amt * (((1 + r) ** months - 1) / r) - initial_deduction
        return max(0.0, round(fv, 2))

    # Calculate 3 scenarios
    conservative_rate = max(1.0, rate - 2.5)
    optimistic_rate = rate + 3.0

    fv_expected = compound_fv(effective_monthly_addition, rate, total_months, one_time_purchase)
    fv_conservative = compound_fv(effective_monthly_addition, conservative_rate, total_months, one_time_purchase)
    fv_optimistic = compound_fv(effective_monthly_addition, optimistic_rate, total_months, one_time_purchase)

    growth_expected = max(0.0, fv_expected - total_contributed)
    growth_conservative = max(0.0, fv_conservative - total_contributed)
    growth_optimistic = max(0.0, fv_optimistic - total_contributed)

    # Generate Year-by-Year Trajectory Points for visual comparison chart
    trajectory = []
    for y in range(1, years + 1):
        m = y * 12
        trajectory.append({
            "year": f"Year {y}",
            "contributions": round(effective_monthly_addition * m, 0),
            "conservative": compound_fv(effective_monthly_addition, conservative_rate, m, one_time_purchase if y == 1 else 0),
            "expected": compound_fv(effective_monthly_addition, rate, m, one_time_purchase if y == 1 else 0),
            "optimistic": compound_fv(effective_monthly_addition, optimistic_rate, m, one_time_purchase if y == 1 else 0),
        })

    # Goal Impact Evaluation (e.g. Emergency fund ₹1.5L, Japan trip ₹1.2L)
    emergency_target = 150000.0 - 98500.0 # ₹51,500 needed
    months_to_emergency = math.ceil(emergency_target / effective_monthly_addition) if effective_monthly_addition > 0 else 999

    return {
        "scenario_type": scenario_type,
        "years": years,
        "rate": rate,
        "contributed": round(total_contributed, 2),
        "future_value": fv_expected,
        "growth": growth_expected,
        "conservative": {
            "rate": conservative_rate,
            "future_value": fv_conservative,
            "growth": growth_conservative
        },
        "optimistic": {
            "rate": optimistic_rate,
            "future_value": fv_optimistic,
            "growth": growth_optimistic
        },
        "trajectory": trajectory,
        "goal_impact": {
            "emergency_fund_months_to_complete": months_to_emergency,
            "summary": f"At ₹{effective_monthly_addition:,.0f}/month, your remaining ₹51,500 emergency reserve target will be achieved in ~{months_to_emergency} months."
        },
        "disclaimer": "Assumed rates of return are illustrative scenarios, never guarantees. Past simulated performance does not assure future results."
    }

def save_simulation(user_id: str, sim_data: dict):
    now_str = datetime.now(timezone.utc).isoformat()
    sim_id = str(uuid.uuid4())
    name = sim_data.get("name") or f"Simulation ({sim_data.get('years', 5)}yr @ {sim_data.get('rate', 8)}%)"
    results = run_financial_simulation(
        monthly_saving=float(sim_data.get("monthly", 5000)),
        years=int(sim_data.get("years", 5)),
        rate=float(sim_data.get("rate", 8)),
        income_delta=float(sim_data.get("income_delta", 0)),
        expense_pct_delta=float(sim_data.get("expense_pct_delta", 0)),
        one_time_purchase=float(sim_data.get("one_time_purchase", 0)),
        monthly_investment=float(sim_data.get("monthly_investment", 0)),
        scenario_type=sim_data.get("scenario_type", "Custom Scenario")
    )

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO simulations (id, user_id, name, scenario_type, monthly_saving_delta, income_delta, expense_pct_delta, one_time_purchase, monthly_investment, expected_annual_return, duration_years, results_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sim_id, user_id, name,
            sim_data.get("scenario_type", "Custom"),
            float(sim_data.get("monthly", 5000)),
            float(sim_data.get("income_delta", 0)),
            float(sim_data.get("expense_pct_delta", 0)),
            float(sim_data.get("one_time_purchase", 0)),
            float(sim_data.get("monthly_investment", 0)),
            float(sim_data.get("rate", 8)),
            int(sim_data.get("years", 5)),
            json.dumps(results),
            now_str
        ))
    return {"id": sim_id, "name": name, "results": results}

def get_saved_simulations(user_id="demo-user"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM simulations WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows = [dict(row) for row in cursor.fetchall()]
        for r in rows:
            r["results"] = json.loads(r["results_json"])
        return rows
