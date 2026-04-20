import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.inspection import permutation_importance


class RiskExplainer:
    def __init__(self, model, feature_names: list):
        self.model = model
        self.feature_names = feature_names
        self.perm_importance_ = None

    def _compute_perm_importance(self, X: np.ndarray, y: np.ndarray = None):
        if y is None:
            y = self.model.predict(X)
        self.perm_importance_ = permutation_importance(
            self.model, X, y, n_repeats=10, random_state=42, scoring="roc_auc"
        )

    def explain_prediction(self, X: np.ndarray, X_background: np.ndarray = None) -> dict:
        if X.ndim == 1:
            X = X.reshape(1, -1)

        baseline_prob = self.model.predict_proba(X[0:1])[0, 1]

        contributions = np.zeros(len(self.feature_names))
        for i in range(len(self.feature_names)):
            X_permuted = X[0:1].copy()
            X_permuted[0, i] = 0
            perm_prob = self.model.predict_proba(X_permuted)[0, 1]
            contributions[i] = baseline_prob - perm_prob

        top_indices = np.argsort(np.abs(contributions))[::-1]
        top_n = min(10, len(top_indices))

        feature_contributions = []
        for i in range(top_n):
            idx = top_indices[i]
            feature_contributions.append({
                "feature": self.feature_names[idx],
                "value": round(float(X[0, idx]), 4),
                "contribution": round(float(contributions[idx]), 4),
                "impact": "increases_risk" if contributions[idx] > 0 else "decreases_risk",
            })

        return {
            "base_probability": round(float(baseline_prob), 4),
            "top_features": feature_contributions,
            "contributions": contributions.tolist(),
        }

    def get_waterfall_plot(self, X: np.ndarray, X_background: np.ndarray = None):
        explanation = self.explain_prediction(X, X_background)
        contributions = np.array(explanation["contributions"])

        sorted_idx = np.argsort(np.abs(contributions))[::-1][:15]
        sorted_features = [self.feature_names[i] for i in sorted_idx]
        sorted_values = contributions[sorted_idx]

        colors = ["#e74c3c" if v > 0 else "#2ecc71" for v in sorted_values]

        fig, ax = plt.subplots(figsize=(10, 6))
        ax.barh(range(len(sorted_features)), sorted_values, color=colors)
        ax.set_yticks(range(len(sorted_features)))
        ax.set_yticklabels(sorted_features)
        ax.set_xlabel("Contribution to Risk Score")
        ax.set_title("Feature Contributions (Waterfall-style)")
        ax.invert_yaxis()
        plt.tight_layout()
        return fig

    def get_summary_plot(self, X: np.ndarray):
        if X.ndim == 1:
            X = X.reshape(1, -1)
        y = self.model.predict(X)
        self._compute_perm_importance(X, y)

        sorted_idx = self.perm_importance_.importances_mean.argsort()[::-1]
        top_idx = sorted_idx[:15]

        fig, ax = plt.subplots(figsize=(10, 8))
        ax.boxplot(
            self.perm_importance_.importances[top_idx].T,
            vert=False,
            labels=[self.feature_names[i] for i in top_idx],
        )
        ax.set_title("Permutation Feature Importance (Global)")
        ax.set_xlabel("Decrease in ROC-AUC")
        plt.tight_layout()
        return fig
