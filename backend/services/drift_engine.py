"""
Money Copilot - Spending Behaviour Drift Detection Engine (Section 10)
Identifies longitudinal, structural habit shifts across 30-90 day windows.
"""

from ..database import get_db

def get_drift_observations(user_id="demo-user"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM drift_observations 
        WHERE user_id = ? 
        ORDER BY created_at DESC
        """, (user_id,))
        rows = [dict(row) for row in cursor.fetchall()]

        # Format supporting transactions
        results = []
        for r in rows:
            results.append({
                "id": r["id"],
                "category": r["category"],
                "trend_title": r["trend_title"],
                "baseline_period": r["baseline_period"],
                "baseline_amount": r["baseline_amount"],
                "current_period": r["current_period"],
                "current_amount": r["current_amount"],
                "percentage_change": r["percentage_change"],
                "corrective_action": r["corrective_action"],
                "status": r["status"],
                "created_at": r["created_at"]
            })
        return results

def update_drift_status(observation_id: str, new_status: str, user_id="demo-user"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE drift_observations 
        SET status = ? 
        WHERE id = ? AND user_id = ?
        """, (new_status, observation_id, user_id))
        return {"ok": True, "id": observation_id, "status": new_status}
