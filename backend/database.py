"""
Money Copilot - Enterprise SQLite Database Management
Preserves compatibility with demo-user, auto-seeds realistic data, and provides ACID persistence.
"""

import sqlite3
import json
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "money_copilot.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            currency TEXT DEFAULT 'INR',
            timezone TEXT DEFAULT 'Asia/Kolkata',
            monthly_income_pref REAL DEFAULT 94000,
            risk_profile TEXT DEFAULT 'Moderate',
            created_at TEXT NOT NULL
        )
        """)

        # 2. Transactions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            merchant TEXT NOT NULL,
            amount REAL NOT NULL,
            direction TEXT NOT NULL CHECK(direction IN ('income', 'expense')),
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            source TEXT NOT NULL,
            status TEXT DEFAULT 'completed',
            notes TEXT,
            canonical INTEGER DEFAULT 1,
            reference_id TEXT,
            created_at TEXT NOT NULL,
            is_duplicate INTEGER DEFAULT 0,
            duplicate_of TEXT,
            duplicate_confidence REAL DEFAULT 0.0,
            duplicate_status TEXT DEFAULT 'none' CHECK(duplicate_status IN ('none', 'flagged', 'confirmed', 'dismissed', 'separate'))
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category)")

        # 3. Payment Sources
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_sources (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            included INTEGER DEFAULT 1,
            status TEXT DEFAULT 'Demo mode',
            count INTEGER DEFAULT 0,
            last_sync TEXT NOT NULL
        )
        """)

        # 4. Budgets
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            category TEXT NOT NULL,
            limit_amount REAL NOT NULL,
            period TEXT DEFAULT 'This month'
        )
        """)

        # 5. Goals
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            target REAL NOT NULL,
            saved REAL DEFAULT 0,
            target_date TEXT NOT NULL
        )
        """)

        # 6. Financial Rules (RuleGPT Engine)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS financial_rules (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            natural_instruction TEXT NOT NULL,
            category TEXT DEFAULT 'All',
            metric TEXT NOT NULL,
            operator TEXT NOT NULL,
            threshold REAL NOT NULL,
            action_type TEXT DEFAULT 'notification',
            severity TEXT DEFAULT 'warning',
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused')),
            last_triggered TEXT,
            trigger_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
        """)

        # 7. Rule Execution Logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS rule_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            rule_id TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            transaction_id TEXT,
            event_summary TEXT NOT NULL,
            triggered_value REAL,
            threshold_value REAL,
            severity TEXT DEFAULT 'warning',
            timestamp TEXT NOT NULL
        )
        """)

        # 8. Anomaly Alerts
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS anomaly_alerts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
            category TEXT NOT NULL,
            transaction_id TEXT,
            reason TEXT NOT NULL,
            supporting_evidence TEXT, -- JSON
            detection_method TEXT NOT NULL,
            anomaly_score REAL NOT NULL,
            recommended_action TEXT NOT NULL,
            status TEXT DEFAULT 'unread' CHECK(status IN ('unread', 'acknowledged', 'dismissed')),
            created_at TEXT NOT NULL
        )
        """)

        # 9. Drift Observations (Behavioral Drift Engine)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS drift_observations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            category TEXT NOT NULL,
            trend_title TEXT NOT NULL,
            baseline_period TEXT NOT NULL,
            baseline_amount REAL NOT NULL,
            current_period TEXT NOT NULL,
            current_amount REAL NOT NULL,
            percentage_change REAL NOT NULL,
            supporting_txns TEXT, -- JSON array of txn ids
            corrective_action TEXT NOT NULL,
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'dismissed')),
            created_at TEXT NOT NULL
        )
        """)

        # 10. Saved Simulations (Simulation Lab)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS simulations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            scenario_type TEXT DEFAULT 'Custom',
            monthly_saving_delta REAL DEFAULT 0,
            income_delta REAL DEFAULT 0,
            expense_pct_delta REAL DEFAULT 0,
            one_time_purchase REAL DEFAULT 0,
            monthly_investment REAL DEFAULT 0,
            expected_annual_return REAL DEFAULT 8.0,
            duration_years INTEGER DEFAULT 5,
            results_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)

        # 11. Strategy Comparisons (Shadow Reviewer)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS strategy_comparisons (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            strategy_a_name TEXT NOT NULL,
            strategy_a_config TEXT NOT NULL, -- JSON
            strategy_b_name TEXT NOT NULL,
            strategy_b_config TEXT NOT NULL, -- JSON
            comparison_data TEXT NOT NULL,   -- JSON
            verdict TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)

        # 12. Personal Financial Memory
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS financial_memory (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            category TEXT NOT NULL,
            confidence REAL DEFAULT 1.0,
            updated_at TEXT NOT NULL,
            UNIQUE(user_id, key)
        )
        """)

        # 13. Security and Audit Events
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            event TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            action TEXT NOT NULL,
            status TEXT DEFAULT 'success',
            details TEXT,
            timestamp TEXT NOT NULL
        )
        """)

        # 14. Historical Snapshots (Financial Time Machine)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS historical_snapshots (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            month_key TEXT NOT NULL, -- e.g. '2026-01'
            income REAL NOT NULL,
            expense REAL NOT NULL,
            savings REAL NOT NULL,
            savings_rate REAL NOT NULL,
            available_balance REAL NOT NULL,
            net_worth REAL NOT NULL,
            investment_value REAL NOT NULL,
            health_score REAL NOT NULL,
            budget_adherence_pct REAL NOT NULL,
            milestones TEXT, -- JSON
            created_at TEXT NOT NULL,
            UNIQUE(user_id, month_key)
        )
        """)
