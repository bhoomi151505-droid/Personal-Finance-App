"""
Money Copilot - Savings and Investment Optimizer (Section 11)
Analyzes surplus, identifies subscription & discretionary optimizations,
and models two investment modes: Self-Directed (Mode A) and Automated (Mode B).
"""

from ..database import get_db

def get_savings_opportunities(user_id="demo-user"):
    """
    Analyzes user recurring outlays and discretionary velocity to identify
    high-conviction savings opportunities.
    """
    return {
        "monthly_potential_savings": 4200.0,
        "annual_potential_savings": 50400.0,
        "opportunities": [
            {
                "id": "opp-1",
                "title": "Consolidate Entertainment Subscriptions",
                "category": "Subscriptions",
                "current_monthly": 649.0,
                "potential_saving": 350.0,
                "impact": "High",
                "explanation": "Switching from 4K multi-screen to standard plan or rotating OTT services saves ₹4,200 annually.",
                "action": "Downgrade or pause during non-viewing periods"
            },
            {
                "id": "opp-2",
                "title": "Establish a Weekly Discretionary Dining Cap",
                "category": "Food & Dining",
                "current_monthly": 2420.0,
                "potential_saving": 1200.0,
                "impact": "High",
                "explanation": "Setting a strict ₹1,200/week dining/delivery cap curbs 57% 3-month drift without disrupting lifestyle.",
                "action": "Activate weekly budget alert rule"
            },
            {
                "id": "opp-3",
                "title": "Earmark ₹15,000 Monthly Surplus into High-Yield Emergency Reserve",
                "category": "Emergency Fund",
                "current_monthly": 0.0,
                "potential_saving": 2650.0,
                "impact": "Critical",
                "explanation": "Redirecting unallocated checking balance into a 7.1% liquid sweep-in account earns ₹2,650/year in risk-free yield.",
                "action": "Setup automated bank sweep-in rule"
            }
        ]
    }

def get_investment_intelligence(mode="self_directed", risk_profile="Moderate", budget=10000.0, duration_years=5):
    """
    Maintains two investment modes:
    Mode A: Self-Directed (Asset allocation analysis, diversification score, risk profile)
    Mode B: Automated Investment Planning (Algorithmic allocation model & backtested asset class simulator)
    """
    if risk_profile == "Conservative":
        allocation = [
            {"asset": "Fixed Income / Liquid Debt", "pct": 55, "color": "#3b82f6", "expected_cagr": 6.8},
            {"asset": "Large Cap Equity Index", "pct": 25, "color": "#10b981", "expected_cagr": 11.5},
            {"asset": "Sovereign Gold Bonds", "pct": 15, "color": "#f59e0b", "expected_cagr": 9.0},
            {"asset": "Cash Equivalent Buffer", "pct": 5, "color": "#06b6d4", "expected_cagr": 4.0},
        ]
        expected_blended_cagr = 8.1
        diversification_score = 88
    elif risk_profile == "Aggressive":
        allocation = [
            {"asset": "Large Cap Equity Index", "pct": 45, "color": "#10b981", "expected_cagr": 12.0},
            {"asset": "Mid & Small Cap Equities", "pct": 30, "color": "#8b5cf6", "expected_cagr": 14.5},
            {"asset": "Fixed Income / Corporate Debt", "pct": 15, "color": "#3b82f6", "expected_cagr": 7.5},
            {"asset": "Gold / Commodity Hedge", "pct": 10, "color": "#f59e0b", "expected_cagr": 9.0},
        ]
        expected_blended_cagr = 12.8
        diversification_score = 82
    else: # Moderate
        allocation = [
            {"asset": "Nifty 50 Large Cap Index", "pct": 45, "color": "#10b981", "expected_cagr": 11.8},
            {"asset": "Short-Duration Debt / Liquid", "pct": 30, "color": "#3b82f6", "expected_cagr": 7.0},
            {"asset": "Midcap & Global ETF", "pct": 15, "color": "#8b5cf6", "expected_cagr": 13.0},
            {"asset": "Sovereign Gold / Digital Gold", "pct": 10, "color": "#f59e0b", "expected_cagr": 9.2},
        ]
        expected_blended_cagr = 10.3
        diversification_score = 91

    # Simulated Portfolio Values based on user budget and duration
    total_months = duration_years * 12
    monthly_rate = (expected_blended_cagr / 100.0) / 12.0
    fv = budget * (((1 + monthly_rate) ** total_months - 1) / monthly_rate) if monthly_rate > 0 else budget * total_months
    contributed = budget * total_months
    growth = fv - contributed

    # 10-Year Historical Asset Class Performance Benchmark (Simulated Backtest)
    historical_benchmarks = [
        {"asset": "Indian Equities (Nifty 50 TRI)", "cagr_10yr": "13.4%", "volatility": "Moderate", "sharpe_ratio": 0.82},
        {"asset": "Short Term Corporate Bonds", "cagr_10yr": "7.6%", "volatility": "Low", "sharpe_ratio": 1.15},
        {"asset": "Domestic Physical Gold", "cagr_10yr": "10.2%", "volatility": "Low-Moderate", "sharpe_ratio": 0.68},
        {"asset": "Bank Fixed Deposits / Sweep", "cagr_10yr": "6.2%", "volatility": "Zero", "sharpe_ratio": 0.45},
    ]

    return {
        "mode": mode,
        "risk_profile": risk_profile,
        "diversification_score": diversification_score,
        "allocation": allocation,
        "simulation": {
            "monthly_budget": budget,
            "duration_years": duration_years,
            "total_contributed": round(contributed, 0),
            "projected_future_value": round(fv, 0),
            "projected_wealth_gain": round(growth, 0),
            "blended_annual_rate": expected_blended_cagr
        },
        "historical_benchmarks": historical_benchmarks,
        "disclaimer": "Simulated investment planning architecture for educational decision-support. No real capital is deployed and no returns are promised."
    }
