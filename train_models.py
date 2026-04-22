import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

"""
Risk Navigator - Model Orchestrator
Automated Training Pipeline

This script serves as the primary entry point for model training. It orchestrates 
synthetic data generation, feature engineering, and model training for both 
the Credit Risk and Fraud Detection engines.
"""
from src.models.credit_risk_model import CreditRiskModel
from src.models.fraud_detection_model import FraudDetectionModel


def main():
    print("=" * 60)
    print("  Financial Risk Analysis & Prediction System")
    print("  Model Training Pipeline")
    print("=" * 60)

    print("\n[1/2] Training Credit Risk Model...")
    credit_model = CreditRiskModel()
    credit_metrics = credit_model.train()
    print(f"  -> Gradient Boosting ROC-AUC: {credit_metrics['gradient_boosting']['roc_auc']:.4f}")
    print(f"  -> Gradient Boosting Recall:  {credit_metrics['gradient_boosting']['recall']:.4f}")

    print("\n[2/2] Training Fraud Detection Model...")
    fraud_model = FraudDetectionModel()
    fraud_metrics = fraud_model.train()
    print(f"  -> Gradient Boosting ROC-AUC: {fraud_metrics['gradient_boosting']['roc_auc']:.4f}")
    print(f"  -> Gradient Boosting Recall:  {fraud_metrics['gradient_boosting']['recall']:.4f}")

    print("\n" + "=" * 60)
    print("  All models trained and saved successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Start API:  python -m src.api.main")
    print("  2. Start Dashboard:  streamlit run app.py")


if __name__ == "__main__":
    main()
