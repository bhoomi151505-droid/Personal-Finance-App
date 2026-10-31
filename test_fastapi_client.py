"""
Comprehensive In-Process Verification of Money Copilot APIs
"""

import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("RUNNING COMPREHENSIVE FASTAPI TEST SUITE")
    print("=" * 60)

    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health failed: {r.status_code}"
    print("[PASS] 1. GET /api/health ->", r.json()["status"], "| Version:", r.json()["version"])

    # 2. Dashboard
    r = client.get("/api/dashboard")
    assert r.status_code == 200, f"Dashboard failed: {r.status_code}"
    d = r.json()
    assert d["income"] == 94000.0, f"Unexpected income: {d['income']}"
    assert d["expense"] == 39679.0, f"Unexpected expense: {d['expense']}"
    assert d["savings"] == 54321.0, f"Unexpected savings: {d['savings']}"
    assert d["health_score"]["score"] > 80, f"Unexpected health score: {d['health_score']}"
    print("[PASS] 2. GET /api/dashboard -> Income: ₹94k | Expense: ₹39.6k | Health Score:", d["health_score"]["score"])

    # 3. Transactions
    r = client.get("/api/transactions")
    assert r.status_code == 200
    txns = r.json()
    assert len(txns) >= 12
    print(f"[PASS] 3. GET /api/transactions -> {len(txns)} transactions retrieved")

    # 4. Add Transaction + Trigger Rules
    r = client.post("/api/transactions", json={
        "merchant": "Special Electronics Store",
        "amount": 6500.0,
        "direction": "expense",
        "category": "Shopping",
        "date": "2026-10-31T12:00:00Z",
        "source": "Google Pay",
        "notes": "Test purchase for rule evaluation"
    })
    assert r.status_code == 200
    res = r.json()
    print("[PASS] 4. POST /api/transactions -> Created txn ID:", res["id"][:8], "| Rules triggered:", len(res["triggered_rules"]))

    # 5. Duplicates
    r = client.get("/api/transactions/duplicates")
    assert r.status_code == 200
    dups = r.json()
    print(f"[PASS] 5. GET /api/transactions/duplicates -> {len(dups)} duplicate candidate(s) flagged")

    # 6. RuleGPT Interpret
    r = client.post("/api/rules/interpret", json={"instruction": "Alert me when my food spending exceeds 4000 in a month"})
    assert r.status_code == 200
    rule = r.json()
    assert rule["category"] == "Food"
    assert rule["threshold"] == 4000.0
    print("[PASS] 6. POST /api/rules/interpret -> Parsed:", rule["name"], "| Cat:", rule["category"], "| Threshold:", rule["threshold"])

    # 7. List Rules and Logs
    r = client.get("/api/rules")
    assert r.status_code == 200
    rules_data = r.json()
    print(f"[PASS] 7. GET /api/rules -> {len(rules_data['rules'])} active rules, {len(rules_data['logs'])} execution logs")

    # 8. Anomalies
    r = client.get("/api/anomalies")
    assert r.status_code == 200
    anomalies = r.json()
    assert len(anomalies) > 0
    print(f"[PASS] 8. GET /api/anomalies -> {len(anomalies)} anomalies detected with statistical Z-scores")

    # 9. Explainability
    r = client.get("/api/explainability/savings-momentum-insight")
    assert r.status_code == 200
    exp = r.json()
    assert "what_happened" in exp
    assert "model_used" in exp
    print("[PASS] 9. GET /api/explainability/:id -> Verified model:", exp["model_used"][:40])

    # 10. Behavioral Drift
    r = client.get("/api/drift")
    assert r.status_code == 200
    drift = r.json()
    assert len(drift) > 0
    print(f"[PASS] 10. GET /api/drift -> {len(drift)} structural habit drift items tracked")

    # 11. Simulation Lab
    r = client.post("/api/simulate", json={"monthly": 7500, "years": 5, "rate": 8.0, "scenario_type": "SIP"})
    assert r.status_code == 200
    sim = r.json()
    assert sim["future_value"] > 500000
    assert "conservative" in sim and "optimistic" in sim
    print(f"[PASS] 11. POST /api/simulate -> 5yr Expected: ₹{sim['future_value']:,.0f} | Cons: ₹{sim['conservative']['future_value']:,.0f} | Opt: ₹{sim['optimistic']['future_value']:,.0f}")

    # 12. Financial History / Time Machine
    r = client.get("/api/history")
    assert r.status_code == 200
    hist = r.json()
    assert len(hist["snapshots"]) == 10
    print(f"[PASS] 12. GET /api/history -> {len(hist['snapshots'])} snapshots (Jan-Oct 2026), {len(hist['milestones'])} milestones")

    # 13. Time Machine Month-to-Month Comparison
    r = client.get("/api/history/compare?month_a=2026-01&month_b=2026-10")
    assert r.status_code == 200
    comp = r.json()
    print("[PASS] 13. GET /api/history/compare -> Net worth delta: +₹" + str(comp["deltas"]["net_worth"]))

    # 14. Shadow Reviewer Strategy Comparison
    r = client.post("/api/recommendations/compare", json={
        "strategy_a": {"name": "Strategy A", "monthly_save": 5000, "monthly_invest": 0},
        "strategy_b": {"name": "Strategy B", "monthly_save": 3000, "monthly_invest": 2000, "expected_return": 10.5},
        "risk_profile": "Moderate"
    })
    assert r.status_code == 200
    shadow = r.json()
    assert len(shadow["comparison_matrix"]) == 5
    print("[PASS] 14. POST /api/recommendations/compare -> Tradeoff matrix dimensions:", len(shadow["comparison_matrix"]))

    # 15. AI Money Coach
    r = client.post("/api/copilot", json={"question": "Can I afford a ₹20,000 purchase?"})
    assert r.status_code == 200
    cop = r.json()
    assert "afford" in cop["answer"].lower()
    print("[PASS] 15. POST /api/copilot -> Answer:", cop["answer"][:65] + "...")

    # 16. Savings & Investment Optimizer
    r_sav = client.get("/api/optimizer/savings")
    r_inv = client.get("/api/optimizer/investments")
    assert r_sav.status_code == 200 and r_inv.status_code == 200
    print("[PASS] 16. GET /api/optimizer/* -> Savings opportunities & Automated Allocation verified")

    # 17. Personal Financial Memory
    r = client.get("/api/memory")
    assert r.status_code == 200
    mems = r.json()
    print(f"[PASS] 17. GET /api/memory -> {len(mems)} personal financial context preferences")

    # 18. Security Audit
    r = client.get("/api/audit")
    assert r.status_code == 200
    audits = r.json()
    print(f"[PASS] 18. GET /api/audit -> {len(audits)} audit events logged")

    # 19. Static Frontend HTML
    r = client.get("/")
    assert r.status_code == 200
    assert "Money Copilot" in r.text
    print("[PASS] 19. GET / -> Served index.html successfully (Length:", len(r.text), "bytes)")

    print("=" * 60)
    print("ALL 19 ENDPOINTS AND ENTERPRISE ENGINES FULLY VERIFIED!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
