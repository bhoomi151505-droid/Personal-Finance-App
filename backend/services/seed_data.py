"""
Money Copilot - Canonical Seed Data & Historical Generator
Populates authentic data matching the original preview app while providing
rich historical snapshots, rules, and anomalies for advanced analytics.
"""

import uuid
from datetime import datetime, timezone, timedelta
from ..database import get_db

def seed_database(force_reset=False):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) as count FROM transactions WHERE user_id = 'demo-user'")
        row = cursor.fetchone()
        if row and row["count"] > 0 and not force_reset:
            return

        if force_reset:
            cursor.execute("DELETE FROM transactions WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM payment_sources WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM budgets WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM goals WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM financial_rules WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM rule_logs WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM anomaly_alerts WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM drift_observations WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM simulations WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM strategy_comparisons WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM financial_memory WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM audit_events WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM historical_snapshots WHERE user_id = 'demo-user'")
            cursor.execute("DELETE FROM users WHERE id = 'demo-user'")

        # 1. User
        now_str = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        INSERT OR REPLACE INTO users (id, name, email, currency, timezone, monthly_income_pref, risk_profile, created_at)
        VALUES ('demo-user', 'Ananya Rao', 'ananya.rao@example.com', 'INR', 'Asia/Kolkata', 94000, 'Moderate', ?)
        """, (now_str,))

        # 2. Canonical Transactions (Current Month - October 2026)
        # Exactly mirrors preview app
        canonical_txns = [
            ("8309c985-d1a9-49fb-a65b-698fb9ba3071", "Salary · Acme Labs", 82000, "income", "Salary", "2026-10-27T18:51:51Z", "Bank statement", "completed", "Monthly primary payroll", 1, "39FFCB11-7E4"),
            ("6d8fd609-e245-491d-9db9-0b6818466822", "Rent · HSR Layout", 24000, "expense", "Rent", "2026-10-26T18:51:51Z", "Bank statement", "completed", "Monthly house rent", 1, "A0295260-C75"),
            ("52f7ab68-789e-4d61-a4e9-1b5405434867", "Zepto groceries", 1680, "expense", "Groceries", "2026-10-24T18:51:51Z", "PhonePe", "completed", "Weekly organic groceries", 1, "D1C77610-D4B"),
            ("c92ca889-164e-4a47-92f7-f6bda6a12ac7", "Swiggy", 740, "expense", "Food", "2026-10-22T18:51:51Z", "Google Pay", "completed", "Dinner order", 1, "EB7458C2-92C"),
            ("87d4408e-fb53-49c9-be53-76066e9f6668", "Netflix", 649, "expense", "Subscriptions", "2026-10-20T18:51:51Z", "Card", "completed", "Monthly Premium plan", 1, "73C38472-AC5"),
            ("a16b87b7-97d5-41b1-9629-fb62f9ca2938", "Uber India", 520, "expense", "Travel", "2026-10-18T18:51:51Z", "PhonePe", "completed", "Office commute", 1, "DBDF185C-36E"),
            ("e169ab3e-f044-4187-88d8-d5aee24f8235", "HealthKart", 1250, "expense", "Healthcare", "2026-10-15T18:51:51Z", "Paytm", "completed", "Vitamins & supplements", 1, "3BA58C39-CEE"),
            ("aa724cd8-425c-4af4-9555-224945d468a4", "Amazon", 2840, "expense", "Shopping", "2026-10-12T18:51:51Z", "Amazon Pay", "completed", "Ergonomic chair cushion & books", 1, "0F0D9527-2C8"),
            ("8b33eb98-86df-465c-90c5-624fe2198a08", "SIP · Nifty 50", 5000, "expense", "Investments", "2026-10-10T18:51:51Z", "Bank statement", "completed", "Automated index fund SIP", 1, "B548184D-808"),
            ("9312fc20-5f02-4481-b393-abf312db4091", "Electricity bill", 2140, "expense", "Bills", "2026-10-07T18:51:51Z", "BHIM", "completed", "BESCOM utility bill", 1, "3174BE53-795"),
            ("c325f20d-8ac7-4b0c-ab92-a5440cbe3246", "Freelance project", 12000, "income", "Freelance income", "2026-10-05T18:51:51Z", "Bank statement", "completed", "UI/UX advisory project", 1, "F6823CFD-F08"),
            ("219c9af2-db50-40af-9991-e220d8d22ac8", "BookMyShow", 860, "expense", "Entertainment", "2026-10-03T18:51:51Z", "Google Pay", "completed", "Movie tickets", 1, "7A90E2D3-969"),
        ]

        for tid, merch, amt, direc, cat, dt, src, stat, nts, canon, ref in canonical_txns:
            cursor.execute("""
            INSERT INTO transactions (id, user_id, merchant, amount, direction, category, date, source, status, notes, canonical, reference_id, created_at, is_duplicate, duplicate_status)
            VALUES (?, 'demo-user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'none')
            """, (tid, merch, amt, direc, cat, dt, src, stat, nts, canon, ref, dt))

        # Add a realistic near-duplicate suspect to demonstrate Section 14 Duplicate Detection
        dup_id = str(uuid.uuid4())
        cursor.execute("""
        INSERT INTO transactions (id, user_id, merchant, amount, direction, category, date, source, status, notes, canonical, reference_id, created_at, is_duplicate, duplicate_of, duplicate_confidence, duplicate_status)
        VALUES (?, 'demo-user', 'Swiggy', 740, 'expense', 'Food', '2026-10-22T18:54:12Z', 'Google Pay', 'completed', 'Possible duplicate swipe within 3 minutes', 0, 'EB7458C2-92D', '2026-10-22T18:54:12Z', 1, 'c92ca889-164e-4a47-92f7-f6bda6a12ac7', 0.94, 'flagged')
        """, (dup_id,))

        # Add historical transactions for August & September 2026 to support Drift Detection & Time Machine
        hist_txns = [
            # September 2026
            (str(uuid.uuid4()), "Salary · Acme Labs", 82000, "income", "Salary", "2026-09-27T10:00:00Z", "Bank statement"),
            (str(uuid.uuid4()), "Rent · HSR Layout", 24000, "expense", "Rent", "2026-09-26T10:00:00Z", "Bank statement"),
            (str(uuid.uuid4()), "SIP · Nifty 50", 5000, "expense", "Investments", "2026-09-10T10:00:00Z", "Bank statement"),
            (str(uuid.uuid4()), "Zepto groceries", 1450, "expense", "Groceries", "2026-09-22T14:00:00Z", "PhonePe"),
            (str(uuid.uuid4()), "Swiggy", 520, "expense", "Food", "2026-09-19T20:00:00Z", "Google Pay"),
            (str(uuid.uuid4()), "Amazon", 1950, "expense", "Shopping", "2026-09-14T11:00:00Z", "Amazon Pay"),
            (str(uuid.uuid4()), "Electricity bill", 1980, "expense", "Bills", "2026-09-07T09:00:00Z", "BHIM"),
            (str(uuid.uuid4()), "Netflix", 649, "expense", "Subscriptions", "2026-09-20T10:00:00Z", "Card"),
            # August 2026
            (str(uuid.uuid4()), "Salary · Acme Labs", 82000, "income", "Salary", "2026-08-27T10:00:00Z", "Bank statement"),
            (str(uuid.uuid4()), "Freelance project", 8000, "income", "Freelance income", "2026-08-15T12:00:00Z", "Bank statement"),
            (str(uuid.uuid4()), "Rent · HSR Layout", 24000, "expense", "Rent", "2026-08-26T10:00:00Z", "Bank statement"),
            (str(uuid.uuid4()), "SIP · Nifty 50", 5000, "expense", "Investments", "2026-08-10T10:00:00Z", "Bank statement"),
            (str(uuid.uuid4()), "Zepto groceries", 1320, "expense", "Groceries", "2026-08-21T15:00:00Z", "PhonePe"),
            (str(uuid.uuid4()), "Swiggy", 420, "expense", "Food", "2026-08-18T20:00:00Z", "Google Pay"),
            (str(uuid.uuid4()), "Amazon", 1450, "expense", "Shopping", "2026-08-12T16:00:00Z", "Amazon Pay"),
            (str(uuid.uuid4()), "Electricity bill", 1850, "expense", "Bills", "2026-08-07T09:00:00Z", "BHIM"),
            (str(uuid.uuid4()), "Netflix", 649, "expense", "Subscriptions", "2026-08-20T10:00:00Z", "Card"),
        ]
        for tid, merch, amt, direc, cat, dt, src in hist_txns:
            cursor.execute("""
            INSERT INTO transactions (id, user_id, merchant, amount, direction, category, date, source, status, notes, canonical, reference_id, created_at, is_duplicate, duplicate_status)
            VALUES (?, 'demo-user', ?, ?, ?, ?, ?, ?, 'completed', 'Historical canonical record', 1, ?, ?, 0, 'none')
            """, (tid, merch, amt, direc, cat, dt, src, str(uuid.uuid4())[:12].upper(), dt))

        # 3. Payment Sources
        sources = [
            ("533b67ee-5757-4db7-8f00-f3df47f8a9f4", "Google Pay", 1, "Demo mode", 18, "Today, 09:42"),
            ("99179d8f-1448-4b67-9071-1d19d2848d17", "PhonePe", 1, "Demo mode", 11, "Today, 09:42"),
            ("b1dfef97-ffc0-47b3-971d-75e8dc97dccc", "Paytm", 1, "Demo mode", 7, "Today, 09:42"),
            ("6bbc5800-b744-4a18-8736-eae80b285b04", "BHIM", 1, "Demo mode", 4, "Today, 09:42"),
            ("9bf99e68-1752-49d9-aba9-241837b56203", "Amazon Pay", 1, "Demo mode", 6, "Today, 09:42"),
        ]
        for sid, sname, sinc, sstat, scnt, ssyn in sources:
            cursor.execute("""
            INSERT INTO payment_sources (id, user_id, name, included, status, count, last_sync)
            VALUES (?, 'demo-user', ?, ?, ?, ?, ?)
            """, (sid, sname, sinc, sstat, scnt, ssyn))

        # 4. Budgets
        budgets = [
            ("100260fe-16e9-4795-adf7-41520f16e101", "Food", 6000, "This month"),
            ("783843f6-e53b-462a-8ab4-e9e8dda1720c", "Shopping", 10000, "This month"),
            ("81bb1a7a-344d-48fa-9232-0ca1727ac1c5", "Travel", 5000, "This month"),
            ("a52b11ef-93cc-49d7-832c-15a9f240ef10", "Entertainment", 4000, "This month"),
        ]
        for bid, bcat, blim, bper in budgets:
            cursor.execute("""
            INSERT INTO budgets (id, user_id, category, limit_amount, period)
            VALUES (?, 'demo-user', ?, ?, ?)
            """, (bid, bcat, blim, bper))

        # 5. Goals
        goals = [
            ("cc2c75b0-c899-4308-9467-9c77d4503e30", "Emergency fund", 150000, 98500, "Dec 2025"),
            ("a06409bd-2fb4-49bf-ab33-a7a69d6da660", "Japan trip", 120000, 42000, "Jun 2026"),
            ("f893e210-4491-4ac1-9de3-cba98305912a", "MacBook Pro M-Series", 80000, 35000, "Mar 2026"),
        ]
        for gid, gname, gtar, gsav, gdate in goals:
            cursor.execute("""
            INSERT INTO goals (id, user_id, name, target, saved, target_date)
            VALUES (?, 'demo-user', ?, ?, ?, ?)
            """, (gid, gname, gtar, gsav, gdate))

        # 6. Financial Rules (Section 4)
        rules = [
            (str(uuid.uuid4()), "Shopping Spree Alert", "Alert me when my shopping expenses exceed ₹5,000 in a month", "Shopping", "monthly_category_spend", ">", 5000, "notification", "warning", "active", "2026-10-12T18:51:51Z", 1),
            (str(uuid.uuid4()), "High Single Transaction Guard", "Notify me when I spend more than ₹2,000 in one transaction", "All", "transaction_amount", ">", 2000, "notification", "info", "active", "2026-10-26T18:51:51Z", 3),
            (str(uuid.uuid4()), "Food Budget 80% Safety Rail", "Alert me when 80% of my monthly food budget is used", "Food", "budget_percentage", ">=", 80, "notification", "warning", "active", None, 0),
        ]
        for rid, rname, rinst, rcat, rmet, rop, rthr, ract, rsev, rstat, rlast, rcnt in rules:
            cursor.execute("""
            INSERT INTO financial_rules (id, user_id, name, natural_instruction, category, metric, operator, threshold, action_type, severity, status, last_triggered, trigger_count, created_at)
            VALUES (?, 'demo-user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (rid, rname, rinst, rcat, rmet, rop, rthr, ract, rsev, rstat, rlast, rcnt, now_str))

        # 7. Rule Execution Logs
        cursor.execute("""
        INSERT INTO rule_logs (id, user_id, rule_id, rule_name, transaction_id, event_summary, triggered_value, threshold_value, severity, timestamp)
        VALUES 
        (?, 'demo-user', ?, 'High Single Transaction Guard', 'aa724cd8-425c-4af4-9555-224945d468a4', 'Transaction at Amazon exceeded ₹2,000 threshold (₹2,840 spent)', 2840, 2000, 'info', '2026-10-12T18:52:00Z'),
        (?, 'demo-user', ?, 'High Single Transaction Guard', '6d8fd609-e245-491d-9db9-0b6818466822', 'Transaction at Rent · HSR Layout exceeded ₹2,000 threshold (₹24,000 spent)', 24000, 2000, 'info', '2026-10-26T18:52:00Z')
        """, (str(uuid.uuid4()), rules[1][0], str(uuid.uuid4()), rules[1][0]))

        # 8. Anomaly Alerts (Section 15)
        cursor.execute("""
        INSERT INTO anomaly_alerts (id, user_id, title, severity, category, transaction_id, reason, supporting_evidence, detection_method, anomaly_score, recommended_action, status, created_at)
        VALUES 
        (?, 'demo-user', 'Sudden Spike in Shopping Expenditure', 'warning', 'Shopping', 'aa724cd8-425c-4af4-9555-224945d468a4', 'Single transaction of ₹2,840 is 95% higher than your 90-day shopping transaction average (₹1,450).', 
        '{"avg_shopping_txn": 1450, "current_txn": 2840, "historical_variance": 1.96, "similar_merchants": ["Amazon"]}', 'Statistical Z-Score (z=2.14)', 0.88, 'Review order items and consider earmarking under seasonal budget buffer.', 'unread', '2026-10-12T19:00:00Z'),
        
        (?, 'demo-user', 'Potential Duplicate Food Swipe', 'critical', 'Food', ?, 'Two identical charges of ₹740 at Swiggy occurred within 2 minutes 21 seconds on Google Pay.',
        '{"original_txn_id": "c92ca889-164e-4a47-92f7-f6bda6a12ac7", "time_gap_seconds": 141, "merchant_match": 1.0, "amount_match": 1.0, "upi_source": "Google Pay"}', 'Fuzzy Temporal & Deterministic Matching', 0.94, 'Inspect your banking application to verify if payment was debited twice or auto-refunded.', 'unread', '2026-10-22T19:00:00Z')
        """, (str(uuid.uuid4()), str(uuid.uuid4()), dup_id))

        # 9. Drift Observations (Section 10)
        cursor.execute("""
        INSERT INTO drift_observations (id, user_id, category, trend_title, baseline_period, baseline_amount, current_period, current_amount, percentage_change, supporting_txns, corrective_action, status, created_at)
        VALUES
        (?, 'demo-user', 'Food & Dining', 'Food spending has gradually increased over 3 consecutive months', 'August 2026 (₹420) → September 2026 (₹520)', 470, 'October 2026', 740, 57.4, 
        '["c92ca889-164e-4a47-92f7-f6bda6a12ac7"]', 'Set a weekly discretionary dining cap of ₹1,200 to prevent lifestyle creep before month-end.', 'active', '2026-10-28T10:00:00Z'),
        
        (?, 'demo-user', 'Shopping Expenses', 'Consistently higher frequency of mid-size online shopping carts', 'July-August Baseline', 1450, 'September-October Baseline', 2840, 95.8,
        '["aa724cd8-425c-4af4-9555-224945d468a4"]', 'Add a 48-hour cooling-off rule for non-essential online carts over ₹1,500.', 'active', '2026-10-28T10:00:00Z')
        """, (str(uuid.uuid4()), str(uuid.uuid4())))

        # 10. Financial Memory (Section 12)
        memories = [
            (str(uuid.uuid4()), "primary_savings_goal", "Reach ₹1,50,000 liquid emergency reserve by Dec 2025 (currently ₹98,500)", "goal", 1.0),
            (str(uuid.uuid4()), "discretionary_limit", "Keep discretionary weekend dining & leisure spend under ₹3,500/month", "preference", 0.95),
            (str(uuid.uuid4()), "investment_discipline", "Automated ₹5,000 monthly SIP into Nifty 50 Index fund on the 10th of every month", "recurring", 1.0),
            (str(uuid.uuid4()), "risk_appetite", "Moderate: Prefers capital protection for emergency funds and index-based long term growth", "risk", 0.90),
            (str(uuid.uuid4()), "lifestyle_preference", "Prefers organic grocery deliveries (Zepto) and public transit over owning a personal vehicle", "preference", 0.85)
        ]
        for mid, mkey, mval, mcat, mconf in memories:
            cursor.execute("""
            INSERT INTO financial_memory (id, user_id, key, value, category, confidence, updated_at)
            VALUES (?, 'demo-user', ?, ?, ?, ?, ?)
            """, (mid, mkey, mval, mcat, mconf, now_str))

        # 11. Audit Events (Section 9)
        cursor.execute("""
        INSERT INTO audit_events (id, user_id, event, entity_type, entity_id, action, status, details, timestamp)
        VALUES 
        (?, 'demo-user', 'Authentication Session', 'user_session', 'demo-user', 'LOGIN_PASSWORDLESS', 'success', 'Session authenticated via local secure token from 127.0.0.1', '2026-10-31T09:42:00Z'),
        (?, 'demo-user', 'Canonical Workspace Refresh', 'transaction_workspace', 'all', 'RECONCILE', 'success', 'Reconciled 12 completed records across 5 connected payment channels', '2026-10-31T09:42:30Z'),
        (?, 'demo-user', 'Duplicate Detection Scan', 'duplicate_engine', 'c92ca889-164e-4a47-92f7-f6bda6a12ac7', 'FLAG_DUPLICATE', 'success', 'Identified potential duplicate Swiggy transaction with 94% confidence', '2026-10-31T09:43:00Z')
        """, (str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())))

        # 12. Historical Snapshots for Financial Time Machine (Section 7)
        # Months Jan 2026 - Oct 2026
        months_data = [
            ("2026-01", 82000, 36000, 46000, 56.1, 46000, 240000, 40000, 78, 92),
            ("2026-02", 82000, 38500, 43500, 53.0, 89500, 283500, 45000, 77, 90),
            ("2026-03", 82000, 35000, 47000, 57.3, 136500, 330500, 50000, 81, 95),
            ("2026-04", 94000, 39000, 55000, 58.5, 191500, 385500, 55000, 83, 91),
            ("2026-05", 82000, 41000, 41000, 50.0, 232500, 426500, 60000, 79, 88),
            ("2026-06", 82000, 34500, 47500, 57.9, 280000, 474000, 65000, 84, 96),
            ("2026-07", 82000, 37200, 44800, 54.6, 324800, 518800, 70000, 82, 93),
            ("2026-08", 90000, 36419, 53581, 59.5, 378381, 572381, 75000, 85, 94),
            ("2026-09", 82000, 36249, 45751, 55.8, 424132, 618132, 80000, 83, 92),
            ("2026-10", 94000, 39679, 54321, 57.8, 478453, 672453, 85000, 86, 91),
        ]

        for mkey, inc, exp, sav, srate, bal, nw, inv, hsc, badh in months_data:
            cursor.execute("""
            INSERT INTO historical_snapshots (id, user_id, month_key, income, expense, savings, savings_rate, available_balance, net_worth, investment_value, health_score, budget_adherence_pct, milestones, created_at)
            VALUES (?, 'demo-user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '["Completed monthly savings milestone", "Active SIP execution"]', ?)
            """, (str(uuid.uuid4()), mkey, inc, exp, sav, srate, bal, nw, inv, hsc, badh, now_str))
