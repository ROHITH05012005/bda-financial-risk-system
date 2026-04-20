import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score, precision_recall_curve,
    average_precision_score, confusion_matrix, f1_score, recall_score,
)
import joblib
from src.config import CREDIT_MODEL_PATH, RANDOM_STATE
from src.preprocessing import CreditPreprocessor, prepare_data
from src.data_ingestion import load_credit_data


class CreditRiskModel:
    def __init__(self):
        self.preprocessor = CreditPreprocessor()
        self.model = None
        self.baseline_model = None
        self.metrics = {}
        self.feature_names = None

    def train(self):
        print("Loading credit risk data...")
        df = load_credit_data()

        X, y = self.preprocessor.fit_transform(df)
        self.feature_names = self.preprocessor.feature_names

        X_train, X_test, y_train, y_test, sample_weights = prepare_data(X, y)

        print("Training baseline model (Logistic Regression)...")
        self.baseline_model = LogisticRegression(
            random_state=RANDOM_STATE, max_iter=1000, class_weight="balanced"
        )
        self.baseline_model.fit(X_train, y_train)

        print("Training Gradient Boosting model...")
        self.model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            random_state=RANDOM_STATE,
        )
        self.model.fit(X_train, y_train, sample_weight=sample_weights)

        self._evaluate(X_test, y_test)
        self.preprocessor.save()
        self.save()
        return self.metrics

    def _evaluate(self, X_test, y_test):
        for name, mdl in [("baseline_lr", self.baseline_model), ("gradient_boosting", self.model)]:
            y_pred = mdl.predict(X_test)
            y_prob = mdl.predict_proba(X_test)[:, 1]
            self.metrics[name] = {
                "classification_report": classification_report(y_test, y_pred, output_dict=True),
                "roc_auc": roc_auc_score(y_test, y_prob),
                "avg_precision": average_precision_score(y_test, y_prob),
                "f1": f1_score(y_test, y_pred),
                "recall": recall_score(y_test, y_pred),
                "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
            }
        print("\n--- Gradient Boosting Credit Risk Model ---")
        print(classification_report(y_test, self.model.predict(X_test)))
        print(f"ROC-AUC: {self.metrics['gradient_boosting']['roc_auc']:.4f}")
        print(f"Recall:  {self.metrics['gradient_boosting']['recall']:.4f}")

    def predict(self, df: pd.DataFrame) -> dict:
        X = self.preprocessor.transform(df)
        prob = self.model.predict_proba(X)[0, 1]
        pred = int(prob >= 0.5)
        return {
            "default_probability": round(float(prob), 4),
            "prediction": pred,
            "risk_level": self._risk_level(prob),
        }

    def predict_batch(self, df: pd.DataFrame) -> list:
        X = self.preprocessor.transform(df)
        probs = self.model.predict_proba(X)[:, 1]
        preds = (probs >= 0.5).astype(int)
        return [
            {
                "default_probability": round(float(p), 4),
                "prediction": int(pred),
                "risk_level": self._risk_level(p),
            }
            for p, pred in zip(probs, preds)
        ]

    @staticmethod
    def _risk_level(prob: float) -> str:
        if prob < 0.3:
            return "LOW"
        elif prob < 0.6:
            return "MEDIUM"
        elif prob < 0.8:
            return "HIGH"
        return "CRITICAL"

    def save(self):
        joblib.dump({
            "model": self.model,
            "baseline_model": self.baseline_model,
            "feature_names": self.feature_names,
            "metrics": self.metrics,
        }, CREDIT_MODEL_PATH)
        print(f"Credit risk model saved: {CREDIT_MODEL_PATH}")

    def load(self):
        data = joblib.load(CREDIT_MODEL_PATH)
        self.model = data["model"]
        self.baseline_model = data["baseline_model"]
        self.feature_names = data["feature_names"]
        self.metrics = data["metrics"]
        self.preprocessor.load()
        return self
