"""
Money Copilot - Enterprise Pydantic Models & Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# --- Transactions ---
class TransactionCreate(BaseModel):
    merchant: str
    amount: float
    direction: str = "expense"
    category: str
    date: str
    source: str = "Manual entry"
    notes: Optional[str] = "Manual entry record"

class TransactionUpdate(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    direction: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    canonical: Optional[bool] = None

class DuplicateActionRequest(BaseModel):
    action: str = Field(..., description="'confirm', 'dismiss', or 'separate'")

# --- Payment Sources ---
class PaymentSourceUpdate(BaseModel):
    included: bool

# --- Budgets ---
class BudgetCreate(BaseModel):
    category: str
    limit: float
    period: str = "This month"

# --- Goals ---
class GoalCreate(BaseModel):
    name: str
    target: float
    saved: float = 0.0
    target_date: str

class GoalUpdate(BaseModel):
    saved: float

# --- Financial Rules (RuleGPT) ---
class RuleInterpretRequest(BaseModel):
    instruction: str

class RuleCreate(BaseModel):
    name: Optional[str] = None
    natural_instruction: str
    category: str = "All"
    metric: str
    operator: str
    threshold: float
    action_type: str = "notification"
    severity: str = "warning"

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    threshold: Optional[float] = None
    status: Optional[str] = None
    action_type: Optional[str] = None
    severity: Optional[str] = None

# --- AI Money Coach ---
class CopilotRequest(BaseModel):
    question: str
    context: Optional[Dict[str, Any]] = None

# --- Simulation Lab ---
class SimulationRequest(BaseModel):
    monthly: float = 5000.0
    years: int = 5
    rate: float = 8.0
    scenario_type: str = "Monthly savings growth"
    income_delta: float = 0.0
    expense_pct_delta: float = 0.0
    one_time_purchase: float = 0.0
    monthly_investment: float = 0.0
    name: Optional[str] = None

# --- Strategy Comparison (Shadow Reviewer) ---
class StrategyCompareRequest(BaseModel):
    title: str = "Strategy Comparison"
    strategy_a: Dict[str, Any]
    strategy_b: Dict[str, Any]
    risk_profile: str = "Moderate"

# --- Personal Financial Memory ---
class MemoryItem(BaseModel):
    key: str
    value: str
    category: str
    confidence: float = 1.0

# --- Audit & Security ---
class SecurityConsentUpdate(BaseModel):
    consent_key: str
    granted: bool

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    currency: Optional[str] = None
    monthly_income_pref: Optional[float] = None
    risk_profile: Optional[str] = None
