"""
Money Copilot - RuleGPT Financial Rule Builder & Execution Engine
Interprets natural language financial instructions, constructs structured rules,
and executes them deterministically against real transactions.
"""

import re
import uuid
from datetime import datetime, timezone
from ..database import get_db

def interpret_natural_language_rule(instruction: str):
    """
    NLP / RuleGPT Parser: Parses user's natural instruction into structured condition and action.
    """
    text = instruction.lower().strip()
    
    # 1. Detect Category
    category = "All"
    categories = ["food", "groceries", "shopping", "bills", "rent", "investments", "subscriptions", "entertainment", "travel", "healthcare"]
    for cat in categories:
        if cat in text:
            category = cat.capitalize()
            break

    # 2. Extract Threshold Number (INR or % or count)
    # Match ₹5,000 or 5000 or 80% or 2,000
    threshold = 2000.0
    num_match = re.search(r'(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(%|percent)?', text)
    if num_match:
        raw_val = num_match.group(1).replace(",", "")
        try:
            threshold = float(raw_val)
        except ValueError:
            threshold = 2000.0

    # 3. Detect Metric & Operator
    operator = ">"
    if "budget" in text or "%" in text:
        metric = "budget_percentage"
        if "%" in text and threshold <= 100:
            pass
        elif threshold > 100:
            threshold = 80.0
        operator = ">="
        default_name = f"{category} Budget {int(threshold)}% Ceiling Alert"
    elif "monthly" in text or "in a month" in text or "month" in text:
        metric = "monthly_category_spend"
        operator = ">"
        default_name = f"Monthly {category} Cap (₹{int(threshold):,})"
    elif "subscription" in text or "recurring" in text:
        metric = "recurring_charge"
        operator = ">="
        default_name = f"Subscription Auto-Debit Warning (₹{int(threshold):,})"
    elif "unusual" in text or "anomaly" in text:
        metric = "unusual_activity"
        operator = ">="
        threshold = 0.85
        default_name = "Unusual Transaction Anomaly Guard"
    else:
        metric = "transaction_amount"
        operator = ">"
        default_name = f"High Single Transaction Alert (₹{int(threshold):,})"

    # 4. Action & Severity
    action_type = "notification"
    severity = "warning" if threshold >= 5000 or "exceed" in text else "info"
    if "critical" in text or "block" in text or "fraud" in text:
        severity = "critical"

    return {
        "name": default_name,
        "natural_instruction": instruction,
        "category": category,
        "metric": metric,
        "operator": operator,
        "threshold": threshold,
        "action_type": action_type,
        "severity": severity,
        "status": "active",
        "explanation": f"When {metric.replace('_', ' ')} in category '{category}' {operator} {threshold}, trigger {action_type} with severity '{severity}'."
    }

def create_rule(user_id: str, rule_data: dict):
    now_str = datetime.now(timezone.utc).isoformat()
    rule_id = str(uuid.uuid4())
    name = rule_data.get("name") or "Custom Financial Rule"
    instruction = rule_data.get("natural_instruction", name)
    category = rule_data.get("category", "All")
    metric = rule_data.get("metric", "transaction_amount")
    operator = rule_data.get("operator", ">")
    threshold = float(rule_data.get("threshold", 2000.0))
    action_type = rule_data.get("action_type", "notification")
    severity = rule_data.get("severity", "warning")
    status = rule_data.get("status", "active")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO financial_rules (id, user_id, name, natural_instruction, category, metric, operator, threshold, action_type, severity, status, last_triggered, trigger_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)
        """, (rule_id, user_id, name, instruction, category, metric, operator, threshold, action_type, severity, status, now_str))

        # Log audit event
        cursor.execute("""
        INSERT INTO audit_events (id, user_id, event, entity_type, entity_id, action, status, details, timestamp)
        VALUES (?, ?, 'Rule Created', 'financial_rule', ?, 'CREATE', 'success', ?, ?)
        """, (str(uuid.uuid4()), user_id, rule_id, f"Activated rule '{name}': {instruction}", now_str))

    return {
        "id": rule_id,
        "name": name,
        "natural_instruction": instruction,
        "category": category,
        "metric": metric,
        "operator": operator,
        "threshold": threshold,
        "action_type": action_type,
        "severity": severity,
        "status": status,
        "created_at": now_str
    }

def evaluate_all_rules_for_transaction(user_id: str, transaction: dict):
    """
    Evaluates active rules against a new or updated transaction in the backend.
    Generates rule logs and notifications if conditions match.
    """
    triggered_logs = []
    now_str = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM financial_rules WHERE user_id = ? AND status = 'active'", (user_id,))
        rules = [dict(row) for row in cursor.fetchall()]

        amount = float(transaction.get("amount", 0.0))
        category = transaction.get("category", "")
        direction = transaction.get("direction", "expense")

        for rule in rules:
            match = False
            triggered_val = amount
            rule_cat = rule["category"]

            # Category filter check
            if rule_cat != "All" and rule_cat.lower() != category.lower():
                continue

            # Metric: Single Transaction Amount
            if rule["metric"] == "transaction_amount" and direction == "expense":
                if rule["operator"] == ">" and amount > rule["threshold"]:
                    match = True
                elif rule["operator"] == ">=" and amount >= rule["threshold"]:
                    match = True

            # Metric: Monthly Category Spend
            elif rule["metric"] == "monthly_category_spend" and direction == "expense":
                cursor.execute("""
                SELECT SUM(amount) as total_cat 
                FROM transactions 
                WHERE user_id = ? AND category = ? AND direction = 'expense' AND canonical = 1
                """, (user_id, category))
                cat_row = cursor.fetchone()
                total_cat = (cat_row["total_cat"] or 0.0)
                triggered_val = total_cat
                if rule["operator"] == ">" and total_cat > rule["threshold"]:
                    match = True
                elif rule["operator"] == ">=" and total_cat >= rule["threshold"]:
                    match = True

            # Metric: Budget Percentage
            elif rule["metric"] == "budget_percentage" and direction == "expense":
                cursor.execute("SELECT limit_amount FROM budgets WHERE user_id = ? AND category = ?", (user_id, category))
                b_row = cursor.fetchone()
                if b_row and b_row["limit_amount"] > 0:
                    cursor.execute("SELECT SUM(amount) as spent FROM transactions WHERE user_id = ? AND category = ? AND direction = 'expense' AND canonical = 1", (user_id, category))
                    spent = cursor.fetchone()["spent"] or 0.0
                    pct = (spent / b_row["limit_amount"]) * 100.0
                    triggered_val = round(pct, 1)
                    if rule["operator"] == ">=" and pct >= rule["threshold"]:
                        match = True
                    elif rule["operator"] == ">" and pct > rule["threshold"]:
                        match = True

            if match:
                log_id = str(uuid.uuid4())
                summary = f"Rule '{rule['name']}' triggered: {rule['category']} spend of ₹{amount:,.0f} violated condition ({rule['metric']} {rule['operator']} {rule['threshold']})"
                
                cursor.execute("""
                INSERT INTO rule_logs (id, user_id, rule_id, rule_name, transaction_id, event_summary, triggered_value, threshold_value, severity, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (log_id, user_id, rule["id"], rule["name"], transaction.get("id"), summary, triggered_val, rule["threshold"], rule["severity"], now_str))

                cursor.execute("""
                UPDATE financial_rules 
                SET last_triggered = ?, trigger_count = trigger_count + 1 
                WHERE id = ?
                """, (now_str, rule["id"]))

                triggered_logs.append({
                    "id": log_id,
                    "rule_name": rule["name"],
                    "summary": summary,
                    "severity": rule["severity"]
                })

    return triggered_logs

def get_rules_and_logs(user_id="demo-user"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM financial_rules WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rules = [dict(row) for row in cursor.fetchall()]

        cursor.execute("SELECT * FROM rule_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20", (user_id,))
        logs = [dict(row) for row in cursor.fetchall()]

        return {"rules": rules, "logs": logs}
