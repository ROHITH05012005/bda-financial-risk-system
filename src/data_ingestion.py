import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from src.config import CREDIT_DATA_PATH, FRAUD_DATA_PATH, RANDOM_STATE


def generate_credit_risk_data(n_samples: int = 10000) -> pd.DataFrame:
    np.random.seed(RANDOM_STATE)

    age = np.random.normal(40, 12, n_samples).clip(18, 80)
    income = np.random.lognormal(10.5, 0.6, n_samples).clip(15000, 500000)
    employment_years = np.random.exponential(5, n_samples).clip(0, 40)
    loan_amount = np.random.lognormal(10, 0.8, n_samples).clip(1000, 500000)
    loan_term = np.random.choice([12, 24, 36, 48, 60, 72, 84], n_samples)
    interest_rate = np.random.normal(8, 3, n_samples).clip(2, 25)
    debt_to_income = np.random.gamma(2, 10, n_samples).clip(0, 80)
    credit_score = np.random.normal(680, 80, n_samples).clip(300, 850)
    num_credit_lines = np.random.poisson(5, n_samples).clip(0, 30)
    num_late_payments = np.random.poisson(0.5, n_samples).clip(0, 20)
    years_credit_history = np.random.exponential(10, n_samples).clip(0, 40)
    num_accounts = np.random.poisson(6, n_samples).clip(0, 25)
    credit_utilization = np.random.beta(2, 5, n_samples) * 100
    total_debt = income * (debt_to_income / 100) + loan_amount * 0.3
    monthly_payment = loan_amount * (interest_rate / 100 / 12) / (1 - (1 + interest_rate / 100 / 12) ** (-loan_term))

    default_prob = (
        0.3 * (debt_to_income / 80)
        + 0.25 * (1 - (credit_score - 300) / 550)
        + 0.15 * (num_late_payments / 20)
        + 0.1 * (1 - employment_years / 40)
        + 0.1 * (credit_utilization / 100)
        + 0.1 * (loan_amount / 500000)
    )
    noise = np.random.normal(0, 0.05, n_samples)
    default_prob = (default_prob + noise).clip(0, 1)
    loan_default = (default_prob > 0.35).astype(int)

    df = pd.DataFrame({
        "age": age.astype(int),
        "income": income.astype(int),
        "employment_years": employment_years.round(1),
        "loan_amount": loan_amount.astype(int),
        "loan_term": loan_term,
        "interest_rate": interest_rate.round(2),
        "debt_to_income": debt_to_income.round(1),
        "credit_score": credit_score.astype(int),
        "num_credit_lines": num_credit_lines,
        "num_late_payments": num_late_payments,
        "years_credit_history": years_credit_history.round(1),
        "num_accounts": num_accounts,
        "credit_utilization": credit_utilization.round(1),
        "total_debt": total_debt.astype(int),
        "monthly_payment": monthly_payment.clip(0).round(2),
        "loan_default": loan_default,
    })

    df.to_csv(CREDIT_DATA_PATH, index=False)
    print(f"Credit risk data saved: {CREDIT_DATA_PATH} ({n_samples} rows, {loan_default.sum()} defaults)")
    return df


def generate_fraud_data(n_samples: int = 10000, fraud_rate: float = 0.05) -> pd.DataFrame:
    np.random.seed(RANDOM_STATE)
    n_fraud = int(n_samples * fraud_rate)
    n_legit = n_samples - n_fraud

    amount_legit = np.random.lognormal(3.5, 1.0, n_legit).clip(1, 5000)
    amount_fraud = np.random.lognormal(5.5, 1.5, n_fraud).clip(10, 50000)

    hour_legit = np.random.normal(14, 4, n_legit).clip(0, 23)
    hour_fraud = np.random.normal(2, 3, n_fraud).clip(0, 23)

    distance_home_legit = np.random.exponential(5, n_legit).clip(0, 100)
    distance_home_fraud = np.random.exponential(50, n_fraud).clip(0, 500)

    distance_last_legit = np.random.exponential(2, n_legit).clip(0, 50)
    distance_last_fraud = np.random.exponential(40, n_fraud).clip(0, 300)

    ratio_median_legit = np.random.normal(1.0, 0.3, n_legit).clip(0.01, 5)
    ratio_median_fraud = np.random.normal(4.0, 2.0, n_fraud).clip(0.5, 20)

    is_online_legit = np.random.binomial(1, 0.4, n_legit)
    is_online_fraud = np.random.binomial(1, 0.85, n_fraud)

    is_international_legit = np.random.binomial(1, 0.05, n_legit)
    is_international_fraud = np.random.binomial(1, 0.45, n_fraud)

    txn_1h_legit = np.random.poisson(1, n_legit).clip(0, 10)
    txn_1h_fraud = np.random.poisson(5, n_fraud).clip(0, 30)

    txn_24h_legit = np.random.poisson(5, n_legit).clip(0, 30)
    txn_24h_fraud = np.random.poisson(20, n_fraud).clip(0, 80)

    avg_7d_legit = np.random.lognormal(3.5, 0.8, n_legit).clip(1, 3000)
    avg_7d_fraud = np.random.lognormal(4.5, 1.0, n_fraud).clip(10, 10000)

    std_7d_legit = np.random.exponential(200, n_legit).clip(0, 2000)
    std_7d_fraud = np.random.exponential(1500, n_fraud).clip(0, 15000)

    merchant_legit = np.random.choice(range(10), n_legit, p=[0.15, 0.12, 0.11, 0.10, 0.10, 0.10, 0.09, 0.08, 0.08, 0.07])
    merchant_fraud = np.random.choice(range(10), n_fraud, p=[0.05, 0.05, 0.05, 0.05, 0.05, 0.10, 0.15, 0.15, 0.17, 0.18])

    day_legit = np.random.randint(0, 7, n_legit)
    day_fraud = np.random.randint(0, 7, n_fraud)

    df_legit = pd.DataFrame({
        "amount": amount_legit.round(2),
        "hour_of_day": hour_legit.astype(int),
        "day_of_week": day_legit,
        "is_weekend": (day_legit >= 5).astype(int),
        "merchant_category": merchant_legit,
        "distance_from_home": distance_home_legit.round(1),
        "distance_from_last_transaction": distance_last_legit.round(1),
        "ratio_to_median_amount": ratio_median_legit.round(2),
        "is_online": is_online_legit,
        "is_international": is_international_fraud if False else is_international_legit,
        "txn_count_1h": txn_1h_legit,
        "txn_count_24h": txn_24h_legit,
        "avg_amount_7d": avg_7d_legit.round(2),
        "std_amount_7d": std_7d_legit.round(2),
        "is_fraud": 0,
    })

    df_fraud = pd.DataFrame({
        "amount": amount_fraud.round(2),
        "hour_of_day": hour_fraud.astype(int),
        "day_of_week": day_fraud,
        "is_weekend": (day_fraud >= 5).astype(int),
        "merchant_category": merchant_fraud,
        "distance_from_home": distance_home_fraud.round(1),
        "distance_from_last_transaction": distance_last_fraud.round(1),
        "ratio_to_median_amount": ratio_median_fraud.round(2),
        "is_online": is_online_fraud,
        "is_international": is_international_fraud,
        "txn_count_1h": txn_1h_fraud,
        "txn_count_24h": txn_24h_fraud,
        "avg_amount_7d": avg_7d_fraud.round(2),
        "std_amount_7d": std_7d_fraud.round(2),
        "is_fraud": 1,
    })

    df = pd.concat([df_legit, df_fraud], ignore_index=True)
    df = df.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)

    df.to_csv(FRAUD_DATA_PATH, index=False)
    print(f"Fraud data saved: {FRAUD_DATA_PATH} ({n_samples} rows, {n_fraud} fraud)")
    return df


def load_credit_data() -> pd.DataFrame:
    if not CREDIT_DATA_PATH.exists():
        return generate_credit_risk_data()
    return pd.read_csv(CREDIT_DATA_PATH)


def load_fraud_data() -> pd.DataFrame:
    if not FRAUD_DATA_PATH.exists():
        return generate_fraud_data()
    return pd.read_csv(FRAUD_DATA_PATH)
