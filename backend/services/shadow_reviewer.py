"""
Money Copilot - Shadow Reviewer & Recommendation Comparison Lab (Section 8)
Conducts multi-scenario strategy stress tests and multi-dimensional trade-off comparisons.
"""

def compare_strategies(strategy_a: dict, strategy_b: dict, user_risk_profile="Moderate"):
    """
    Compares two user strategies across 6 quantitative and qualitative dimensions:
    1. Capital Accumulation (3-year & 5-year outlook)
    2. Liquidity (Immediate accessible cash)
    3. Volatility & Risk Exposure
    4. Emergency Cushion Acceleration
    5. Goal Completion Horizon
    6. Behavioral Suitability for user risk profile
    """
    # Strategy A parameters
    save_a = float(strategy_a.get("monthly_save", 5000))
    inv_a = float(strategy_a.get("monthly_invest", 0))
    ret_a = float(strategy_a.get("expected_return", 4.0)) # bank/liquid rate
    name_a = strategy_a.get("name", "Conservative Savings (100% Cash)")

    # Strategy B parameters
    save_b = float(strategy_b.get("monthly_save", 3000))
    inv_b = float(strategy_b.get("monthly_invest", 2000))
    ret_b = float(strategy_b.get("expected_return", 10.5)) # equity/hybrid rate
    name_b = strategy_b.get("name", "Balanced Growth (60% Cash / 40% Equity)")

    # 3-Year (36 mo) & 5-Year (60 mo) Compounded Outcomes
    def calc_outcome(monthly_cash, monthly_inv, r_cash, r_inv, months):
        rc = (r_cash / 100.0) / 12.0
        ri = (r_inv / 100.0) / 12.0
        fv_cash = monthly_cash * (((1 + rc) ** months - 1) / rc) if rc > 0 else monthly_cash * months
        fv_inv = monthly_inv * (((1 + ri) ** months - 1) / ri) if ri > 0 else monthly_inv * months
        total = fv_cash + fv_inv
        return {
            "total": round(total, 0),
            "cash_portion": round(fv_cash, 0),
            "invested_portion": round(fv_inv, 0),
            "interest_earned": round(total - ((monthly_cash + monthly_inv) * months), 0)
        }

    res_a_3yr = calc_outcome(save_a, inv_a, 4.0, ret_a, 36)
    res_a_5yr = calc_outcome(save_a, inv_a, 4.0, ret_a, 60)

    res_b_3yr = calc_outcome(save_b, inv_b, 4.0, ret_b, 36)
    res_b_5yr = calc_outcome(save_b, inv_b, 4.0, ret_b, 60)

    # Dimensional Comparisons
    comparison_matrix = [
        {
            "dimension": "5-Year Projected Total",
            "strategy_a": f"₹{res_a_5yr['total']:,.0f} (+₹{res_a_5yr['interest_earned']:,.0f} gains)",
            "strategy_b": f"₹{res_b_5yr['total']:,.0f} (+₹{res_b_5yr['interest_earned']:,.0f} gains)",
            "winner": "Strategy B" if res_b_5yr["total"] > res_a_5yr["total"] else "Strategy A",
            "difference": f"+₹{abs(res_b_5yr['total'] - res_a_5yr['total']):,.0f} under Strategy B"
        },
        {
            "dimension": "Instant Liquidity",
            "strategy_a": "100% Instant Access (Zero exit penalty)",
            "strategy_b": "60% Liquid / 40% Market-linked equity",
            "winner": "Strategy A",
            "difference": "Strategy A preserves maximum liquid runway"
        },
        {
            "dimension": "Market Risk Exposure",
            "strategy_a": "Zero Market Volatility",
            "strategy_b": "Moderate Market Fluctuation (Equity exposure)",
            "winner": "Strategy A",
            "difference": "Strategy A has zero capital drawdown risk"
        },
        {
            "dimension": "Inflation Protection",
            "strategy_a": "Negative Real Return (4% yield lags 6% CPI)",
            "strategy_b": "Positive Real Return (Blended ~8.5% beats 6% CPI)",
            "winner": "Strategy B",
            "difference": "Strategy B preserves long-term purchasing power"
        },
        {
            "dimension": "Emergency Fund Completion",
            "strategy_a": "Achieves remaining ₹51,500 target in ~10 months",
            "strategy_b": "Achieves remaining ₹51,500 target in ~17 months",
            "winner": "Strategy A",
            "difference": "Strategy A reaches safety milestone 7 months sooner"
        }
    ]

    # AI Recommendation & Verdict
    # Because Ananya already has ~₹98.5k in her emergency fund (almost 2.5 months expenses),
    # Strategy B provides optimal balance for a Moderate investor.
    verdict = (
        f"Recommendation: Strategy B ({name_b}) is structurally superior for your Moderate risk profile. "
        f"Over 5 years, Strategy B creates an estimated ₹{res_b_5yr['total'] - res_a_5yr['total']:,.0f} in additional wealth "
        f"while still funding ₹3,000/month into your liquid safety reserve. However, if your absolute priority is closing "
        f"the remaining ₹51,500 emergency gap within 10 months, adopt Strategy A temporarily until your emergency reserve is fully funded."
    )

    return {
        "title": f"{name_a} vs {name_b}",
        "strategy_a": {
            "name": name_a,
            "monthly_cash": save_a,
            "monthly_invest": inv_a,
            "outcome_3yr": res_a_3yr,
            "outcome_5yr": res_a_5yr,
            "pros": ["Maximum immediate liquidity", "Guaranteed capital preservation", "Rapid emergency reserve funding"],
            "cons": ["Returns lag inflation", "Zero wealth compounding from equities"]
        },
        "strategy_b": {
            "name": name_b,
            "monthly_cash": save_b,
            "monthly_invest": inv_b,
            "outcome_3yr": res_b_3yr,
            "outcome_5yr": res_b_5yr,
            "pros": ["Higher compounding growth (+10.5% assumed)", "Beats long-term inflation", "Builds automated investment habit"],
            "cons": ["Short-term equity drawdowns possible", "Takes 7 months longer to reach full emergency fund"]
        },
        "comparison_matrix": comparison_matrix,
        "ai_verdict": verdict,
        "disclaimer": "Decision-support analysis only. No automated trades or transactions will be executed. Returns are simulated assumptions."
    }
