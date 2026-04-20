from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

CREDIT_DATA_PATH = DATA_DIR / "credit_risk_data.csv"
FRAUD_DATA_PATH = DATA_DIR / "fraud_data.csv"

CREDIT_MODEL_PATH = MODELS_DIR / "credit_risk_model.pkl"
FRAUD_MODEL_PATH = MODELS_DIR / "fraud_detection_model.pkl"
PREPROCESSOR_PATH = MODELS_DIR / "preprocessor.pkl"

RANDOM_STATE = 42
TEST_SIZE = 0.2

CREDIT_FEATURES = [
    "age", "income", "employment_years", "loan_amount",
    "loan_term", "interest_rate", "debt_to_income", "credit_score",
    "num_credit_lines", "num_late_payments", "years_credit_history",
    "num_accounts", "credit_utilization", "total_debt", "monthly_payment",
]

FRAUD_FEATURES = [
    "amount", "hour_of_day", "day_of_week", "is_weekend",
    "merchant_category", "distance_from_home", "distance_from_last_transaction",
    "ratio_to_median_amount", "is_online", "is_international",
    "txn_count_1h", "txn_count_24h", "avg_amount_7d", "std_amount_7d",
]

RISK_THRESHOLDS = {
    "low": 0.3,
    "medium": 0.6,
    "high": 0.8,
}

STRESS_TEST_SCENARIOS = {
    "market_crash": {"interest_rate": 1.5, "credit_score": -50, "debt_to_income": 1.3},
    "recession": {"income": 0.7, "employment_years": 0.5, "debt_to_income": 1.4},
    "interest_rate_hike": {"interest_rate": 2.0, "monthly_payment": 1.3},
    "credit_crunch": {"credit_score": -80, "num_credit_lines": 0.5, "credit_utilization": 1.5},
}
