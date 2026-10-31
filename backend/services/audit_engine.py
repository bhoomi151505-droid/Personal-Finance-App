"""
Money Copilot - Security, Audit & Personal Financial Memory (Sections 9 & 12)
Provides immutable audit trails, permission management, data privacy controls,
and contextual Personal Financial Memory.
"""

import uuid
from datetime import datetime, timezone
from ..database import get_db

def log_audit_event(user_id: str, event: str, entity_type: str, action: str, details: str, entity_id: str = None, status="success"):
    now_str = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO audit_events (id, user_id, event, entity_type, entity_id, action, status, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), user_id, event, entity_type, entity_id or str(uuid.uuid4()), action, status, details, now_str))

def get_audit_trail(user_id="demo-user", limit=50):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM audit_events 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
        """, (user_id, limit))
        return [dict(row) for row in cursor.fetchall()]

def get_financial_memory(user_id="demo-user"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM financial_memory WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
        return [dict(row) for row in cursor.fetchall()]

def upsert_financial_memory(user_id: str, key: str, value: str, category: str = "preference", confidence: float = 1.0):
    now_str = datetime.now(timezone.utc).isoformat()
    mid = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO financial_memory (id, user_id, key, value, category, confidence, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, key) DO UPDATE SET
            value = excluded.value,
            category = excluded.category,
            confidence = excluded.confidence,
            updated_at = excluded.updated_at
        """, (mid, user_id, key, value, category, confidence, now_str))
        
        log_audit_event(user_id, "Memory Updated", "financial_memory", "UPSERT", f"Updated context preference: '{key}'", mid)
    return {"ok": True, "key": key, "value": value}

def delete_financial_memory(user_id: str, key: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM financial_memory WHERE user_id = ? AND key = ?", (user_id, key))
        log_audit_event(user_id, "Memory Item Removed", "financial_memory", "DELETE", f"Removed context preference '{key}'")
    return {"ok": True, "key": key}

def reset_financial_memory(user_id="demo-user"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM financial_memory WHERE user_id = ?", (user_id,))
        log_audit_event(user_id, "Memory Reset", "financial_memory", "RESET", "Cleared all stored personalization preferences")
    return {"ok": True}
