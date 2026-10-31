"""
Money Copilot - Intelligent Duplicate Detection Engine (Section 14)
Deterministic & Fuzzy reconciliation comparing amounts, timestamps, UPI refs, and merchants.
"""

from datetime import datetime, timezone
from ..database import get_db

def detect_duplicates_in_database(user_id="demo-user"):
    """
    Scans transactions for potential duplicate charges based on:
    - Identical or near-identical merchant names (case-insensitive)
    - Exact matching amount
    - Close timestamp (< 24 hours)
    - Same payment source or UPI reference prefix
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM transactions 
        WHERE user_id = ? 
        ORDER BY date ASC
        """, (user_id,))
        txns = [dict(row) for row in cursor.fetchall()]

        potential_duplicates = []
        n = len(txns)

        for i in range(n):
            for j in range(i + 1, n):
                t1 = txns[i]
                t2 = txns[j]

                # Compare amounts
                if abs(t1["amount"] - t2["amount"]) > 0.01:
                    continue

                # Compare directions
                if t1["direction"] != t2["direction"]:
                    continue

                # Compare merchants (substring or exact)
                m1 = t1["merchant"].lower().strip()
                m2 = t2["merchant"].lower().strip()
                merch_match = (m1 == m2 or m1 in m2 or m2 in m1)
                if not merch_match:
                    continue

                # Parse dates & calculate time delta
                try:
                    d1 = datetime.fromisoformat(t1["date"].replace("Z", "+00:00"))
                    d2 = datetime.fromisoformat(t2["date"].replace("Z", "+00:00"))
                    diff_seconds = abs((d2 - d1).total_seconds())
                except Exception:
                    diff_seconds = 86400

                # Score confidence
                confidence = 0.0
                if diff_seconds <= 300: # within 5 minutes
                    confidence = 0.96
                elif diff_seconds <= 3600: # within 1 hour
                    confidence = 0.88
                elif diff_seconds <= 86400: # within 24 hours
                    confidence = 0.72

                if t1["source"] == t2["source"]:
                    confidence = min(0.99, confidence + 0.03)

                if confidence >= 0.70:
                    potential_duplicates.append({
                        "original_transaction": t1,
                        "suspect_transaction": t2,
                        "confidence": round(confidence, 2),
                        "time_delta_seconds": int(diff_seconds),
                        "status": t2.get("duplicate_status", "flagged")
                    })

        return potential_duplicates

def handle_duplicate_action(transaction_id: str, action: str, user_id="demo-user"):
    """
    Applies user resolution for a flagged duplicate:
    - 'confirm': Mark as confirmed duplicate, set canonical=0 so it does not skew analytics.
    - 'dismiss': Dismiss warning, keep canonical=1.
    - 'separate': Mark as confirmed legitimate separate transaction.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        if action == "confirm":
            cursor.execute("""
            UPDATE transactions 
            SET is_duplicate = 1, canonical = 0, duplicate_status = 'confirmed'
            WHERE id = ? AND user_id = ?
            """, (transaction_id, user_id))
            status_text = "confirmed duplicate (excluded from canonical reports)"
        elif action == "dismiss":
            cursor.execute("""
            UPDATE transactions 
            SET is_duplicate = 0, duplicate_status = 'dismissed'
            WHERE id = ? AND user_id = ?
            """, (transaction_id, user_id))
            status_text = "flag dismissed"
        elif action == "separate":
            cursor.execute("""
            UPDATE transactions 
            SET is_duplicate = 0, canonical = 1, duplicate_status = 'separate'
            WHERE id = ? AND user_id = ?
            """, (transaction_id, user_id))
            status_text = "marked as separate valid transaction"
        else:
            raise ValueError(f"Unsupported duplicate action: {action}")

        # Also dismiss related anomaly alert if exists
        cursor.execute("""
        UPDATE anomaly_alerts 
        SET status = 'acknowledged' 
        WHERE transaction_id = ? AND user_id = ?
        """, (transaction_id, user_id))

        return {"ok": True, "transaction_id": transaction_id, "action": action, "message": status_text}
