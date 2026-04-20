import numpy as np
import pandas as pd
from copy import deepcopy
from src.config import STRESS_TEST_SCENARIOS


class StressTestSimulator:
    def __init__(self, credit_model, fraud_model=None):
        self.credit_model = credit_model
        self.fraud_model = fraud_model
        self.scenarios = STRESS_TEST_SCENARIOS

    def run_credit_stress_test(
        self, df: pd.DataFrame, scenario_name: str = None, custom_adjustments: dict = None
    ) -> dict:
        df_stressed = df.copy()

        if scenario_name and scenario_name in self.scenarios:
            adjustments = self.scenarios[scenario_name]
        elif custom_adjustments:
            adjustments = custom_adjustments
        else:
            return {"error": "No valid scenario or custom adjustments provided"}

        for feature, factor in adjustments.items():
            if feature in df_stressed.columns:
                if isinstance(factor, float) and 0 < factor < 2:
                    if factor < 1:
                        df_stressed[feature] = df_stressed[feature] * factor
                    else:
                        df_stressed[feature] = df_stressed[feature] * factor
                elif isinstance(factor, (int, float)):
                    df_stressed[feature] = df_stressed[feature] + factor

        original_results = self.credit_model.predict_batch(df)
        stressed_results = self.credit_model.predict_batch(df_stressed)

        original_probs = [r["default_probability"] for r in original_results]
        stressed_probs = [r["default_probability"] for r in stressed_results]

        original_risk_dist = self._risk_distribution(original_results)
        stressed_risk_dist = self._risk_distribution(stressed_results)

        return {
            "scenario": scenario_name or "custom",
            "adjustments": adjustments,
            "original_avg_probability": round(np.mean(original_probs), 4),
            "stressed_avg_probability": round(np.mean(stressed_probs), 4),
            "probability_increase": round(np.mean(stressed_probs) - np.mean(original_probs), 4),
            "pct_increase": round(
                (np.mean(stressed_probs) - np.mean(original_probs)) / (np.mean(original_probs) + 1e-8) * 100, 2
            ),
            "original_risk_distribution": original_risk_dist,
            "stressed_risk_distribution": stressed_risk_dist,
            "max_individual_increase": round(
                max(s - o for o, s in zip(original_probs, stressed_probs)), 4
            ),
            "sample_details": [
                {
                    "original_prob": round(o, 4),
                    "stressed_prob": round(s, 4),
                    "original_risk": orig_r["risk_level"],
                    "stressed_risk": stress_r["risk_level"],
                }
                for o, s, orig_r, stress_r in zip(
                    original_probs, stressed_probs, original_results, stressed_results
                )
            ][:20],
        }

    def run_fraud_stress_test(self, df: pd.DataFrame, multiplier: float = 3.0) -> dict:
        df_stressed = df.copy()
        df_stressed["amount"] = df_stressed["amount"] * multiplier
        df_stressed["ratio_to_median_amount"] = df_stressed["ratio_to_median_amount"] * multiplier
        df_stressed["distance_from_home"] = df_stressed["distance_from_home"] * 2
        df_stressed["txn_count_1h"] = (df_stressed["txn_count_1h"] * 2).astype(int)

        original_results = self.fraud_model.predict_batch(df)
        stressed_results = self.fraud_model.predict_batch(df_stressed)

        original_probs = [r["fraud_probability"] for r in original_results]
        stressed_probs = [r["fraud_probability"] for r in stressed_results]

        return {
            "scenario": f"fraud_spike_{multiplier}x",
            "original_avg_fraud_prob": round(np.mean(original_probs), 4),
            "stressed_avg_fraud_prob": round(np.mean(stressed_probs), 4),
            "flagged_increase": sum(
                1 for o, s in zip(original_probs, stressed_probs) if s > 0.5 and o <= 0.5
            ),
        }

    def get_available_scenarios(self) -> list:
        return [
            {"name": name, "adjustments": adj}
            for name, adj in self.scenarios.items()
        ]

    @staticmethod
    def _risk_distribution(results: list) -> dict:
        dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        for r in results:
            dist[r["risk_level"]] += 1
        total = sum(dist.values())
        return {k: {"count": v, "pct": round(v / total * 100, 1)} for k, v in dist.items()}
