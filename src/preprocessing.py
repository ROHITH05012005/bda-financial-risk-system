import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_sample_weight
from src.config import CREDIT_FEATURES, FRAUD_FEATURES, RANDOM_STATE, TEST_SIZE
import joblib
from src.config import PREPROCESSOR_PATH


class CreditPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_names = CREDIT_FEATURES
        self.is_fitted = False

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["payment_to_income"] = df["monthly_payment"] / (df["income"] / 12 + 1)
        df["loan_to_income"] = df["loan_amount"] / (df["income"] + 1)
        df["credit_line_utilization"] = df["num_credit_lines"] / (df["num_accounts"] + 1)
        df["late_payment_rate"] = df["num_late_payments"] / (df["years_credit_history"] + 1)
        df["risk_score_proxy"] = (
            df["debt_to_income"] * 0.3
            + (850 - df["credit_score"]) / 550 * 30
            + df["num_late_payments"] * 2
        )
        self.feature_names = CREDIT_FEATURES + [
            "payment_to_income", "loan_to_income",
            "credit_line_utilization", "late_payment_rate", "risk_score_proxy",
        ]
        return df

    def fit_transform(self, df: pd.DataFrame, target_col: str = "loan_default"):
        df = self.engineer_features(df)
        X = df[self.feature_names].values
        y = df[target_col].values
        X = self.scaler.fit_transform(X)
        self.is_fitted = True
        return X, y

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        df = self.engineer_features(df)
        X = df[self.feature_names].values
        return self.scaler.transform(X)

    def save(self):
        joblib.dump({"scaler": self.scaler, "feature_names": self.feature_names}, PREPROCESSOR_PATH)

    def load(self):
        data = joblib.load(PREPROCESSOR_PATH)
        self.scaler = data["scaler"]
        self.feature_names = data["feature_names"]
        self.is_fitted = True


class FraudPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_names = FRAUD_FEATURES
        self.is_fitted = False

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["amount_deviation"] = (df["amount"] - df["avg_amount_7d"]) / (df["std_amount_7d"] + 1)
        df["velocity_1h_24h_ratio"] = df["txn_count_1h"] / (df["txn_count_24h"] + 1)
        df["distance_total"] = df["distance_from_home"] + df["distance_from_last_transaction"]
        df["high_risk_merchant"] = df["merchant_category"].isin([7, 8, 9]).astype(int)
        df["night_txn"] = ((df["hour_of_day"] >= 22) | (df["hour_of_day"] <= 5)).astype(int)
        self.feature_names = FRAUD_FEATURES + [
            "amount_deviation", "velocity_1h_24h_ratio",
            "distance_total", "high_risk_merchant", "night_txn",
        ]
        return df

    def fit_transform(self, df: pd.DataFrame, target_col: str = "is_fraud"):
        df = self.engineer_features(df)
        X = df[self.feature_names].values
        y = df[target_col].values
        X = self.scaler.fit_transform(X)
        self.is_fitted = True
        return X, y

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        df = self.engineer_features(df)
        X = df[self.feature_names].values
        return self.scaler.transform(X)

    def save(self, path=None):
        path = path or PREPROCESSOR_PATH.with_name("preprocessor_fraud.pkl")
        joblib.dump({"scaler": self.scaler, "feature_names": self.feature_names}, path)

    def load(self, path=None):
        path = path or PREPROCESSOR_PATH.with_name("preprocessor_fraud.pkl")
        data = joblib.load(path)
        self.scaler = data["scaler"]
        self.feature_names = data["feature_names"]
        self.is_fitted = True


def prepare_data(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    sample_weights = compute_sample_weight("balanced", y_train)
    return X_train, X_test, y_train, y_test, sample_weights
