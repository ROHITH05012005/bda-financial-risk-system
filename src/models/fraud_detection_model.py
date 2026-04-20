import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, GradientBoostingClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score,
    average_precision_score, confusion_matrix, f1_score, recall_score,
)
import joblib
from src.config import FRAUD_MODEL_PATH, RANDOM_STATE
from src.preprocessing import FraudPreprocessor, prepare_data
from src.data_ingestion import load_fraud_data


class FraudDetectionModel:
    def __init__(self):
        self.preprocessor = FraudPreprocessor()
        self.gb_model = None
        self.isolation_forest = None
        self.metrics = {}
        self.feature_names = None

    def train(self):
        print("Loading fraud data...")
        df = load_fraud_data()

        X, y = self.preprocessor.fit_transform(df)
        self.feature_names = self.preprocessor.feature_names

        X_train, X_test, y_train, y_test, sample_weights = prepare_data(X, y)

        print("Training Isolation Forest (anomaly detection)...")
        self.isolation_forest = IsolationForest(
            n_estimators=200,
            contamination=0.05,
            random_state=RANDOM_STATE,
        )
        self.isolation_forest.fit(X_train[y_train == 0])

        print("Training Gradient Boosting (fraud classifier)...")
        self.gb_model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            random_state=RANDOM_STATE,
        )
        self.gb_model.fit(X_train, y_train, sample_weight=sample_weights)

        self._evaluate(X_test, y_test)
        self.preprocessor.save()
        self.save()
        return self.metrics

    def _evaluate(self, X_test, y_test):
        y_pred = self.gb_model.predict(X_test)
        y_prob = self.gb_model.predict_proba(X_test)[:, 1]
        self.metrics["gradient_boosting"] = {
            "classification_report": classification_report(y_test, y_pred, output_dict=True),
            "roc_auc": roc_auc_score(y_test, y_prob),
            "avg_precision": average_precision_score(y_test, y_prob),
            "f1": f1_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        }

        iso_pred = self.isolation_forest.predict(X_test)
        iso_pred = np.where(iso_pred == -1, 1, 0)
        self.metrics["isolation_forest"] = {
            "f1": f1_score(y_test, iso_pred),
            "recall": recall_score(y_test, iso_pred),
            "confusion_matrix": confusion_matrix(y_test, iso_pred).tolist(),
        }

        print("\n--- Gradient Boosting Fraud Detection Model ---")
        print(classification_report(y_test, y_pred))
        print(f"ROC-AUC: {self.metrics['gradient_boosting']['roc_auc']:.4f}")
        print(f"Recall:  {self.metrics['gradient_boosting']['recall']:.4f}")

        print("\n--- Isolation Forest (Anomaly Detection) ---")
        print(f"F1:     {self.metrics['isolation_forest']['f1']:.4f}")
        print(f"Recall: {self.metrics['isolation_forest']['recall']:.4f}")

    def predict(self, df: pd.DataFrame) -> dict:
        X = self.preprocessor.transform(df)
        gb_prob = self.gb_model.predict_proba(X)[0, 1]
        gb_pred = int(gb_prob >= 0.5)

        iso_score = self.isolation_forest.predict(X)[0]
        iso_anomaly = int(iso_score == -1)

        combined_prob = 0.7 * gb_prob + 0.3 * iso_anomaly

        return {
            "fraud_probability": round(float(gb_prob), 4),
            "combined_risk_score": round(float(combined_prob), 4),
            "is_anomaly": iso_anomaly,
            "prediction": int(combined_prob >= 0.5),
            "risk_level": self._risk_level(combined_prob),
        }

    def predict_batch(self, df: pd.DataFrame) -> list:
        X = self.preprocessor.transform(df)
        gb_probs = self.gb_model.predict_proba(X)[:, 1]
        iso_scores = self.isolation_forest.predict(X)
        iso_anomalies = (iso_scores == -1).astype(int)
        combined = 0.7 * gb_probs + 0.3 * iso_anomalies
        preds = (combined >= 0.5).astype(int)

        return [
            {
                "fraud_probability": round(float(p), 4),
                "combined_risk_score": round(float(c), 4),
                "is_anomaly": int(a),
                "prediction": int(pred),
                "risk_level": self._risk_level(c),
            }
            for p, c, a, pred in zip(gb_probs, combined, iso_anomalies, preds)
        ]

    @staticmethod
    def _risk_level(score: float) -> str:
        if score < 0.2:
            return "LOW"
        elif score < 0.5:
            return "MEDIUM"
        elif score < 0.75:
            return "HIGH"
        return "CRITICAL"

    def save(self):
        joblib.dump({
            "gb_model": self.gb_model,
            "isolation_forest": self.isolation_forest,
            "feature_names": self.feature_names,
            "metrics": self.metrics,
        }, FRAUD_MODEL_PATH)
        print(f"Fraud detection model saved: {FRAUD_MODEL_PATH}")

    def load(self):
        data = joblib.load(FRAUD_MODEL_PATH)
        self.gb_model = data["gb_model"]
        self.isolation_forest = data["isolation_forest"]
        self.feature_names = data["feature_names"]
        self.metrics = data["metrics"]
        self.preprocessor.load()
        return self
