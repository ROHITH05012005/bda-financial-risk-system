"""
Risk Navigator - Financial Risk Analysis & Prediction System
FastAPI Backend Gateway

This module serves as the primary REST API for the Financial Risk system, 
providing endpoints for credit risk prediction, fraud detection, 
SHAP explainability, and macroeconomic stress testing.

Author: BDA Project Team
Date: April 2026
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import pandas as pd
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.models.credit_risk_model import CreditRiskModel
from src.models.fraud_detection_model import FraudDetectionModel
from src.stress_test import StressTestSimulator
from src.explainability import RiskExplainer
from src.database import init_db, log_credit_prediction, log_fraud_prediction, get_recent_predictions, get_db_stats

app = FastAPI(
    title="Financial Risk Analysis API",
    description="Credit Risk & Fraud Detection Prediction System",
    version="1.0.0",
)

import re

# Allow localhost for dev, and all Vercel deployments for production.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

credit_model = CreditRiskModel()
fraud_model = FraudDetectionModel()
stress_simulator = None
credit_explainer = None
fraud_explainer = None
models_loaded = False


def load_models():
    global models_loaded, stress_simulator, credit_explainer, fraud_explainer
    if models_loaded:
        return
    try:
        credit_model.load()
        fraud_model.load()
        stress_simulator = StressTestSimulator(credit_model, fraud_model)
        credit_explainer = RiskExplainer(credit_model.model, credit_model.feature_names)
        fraud_explainer = RiskExplainer(fraud_model.gb_model, fraud_model.feature_names)
        models_loaded = True
        print("All models loaded successfully.")
    except Exception as e:
        print(f"Error loading models: {e}")
        print("Run 'python train_models.py' first.")


@app.on_event("startup")
async def startup_event():
    init_db()
    load_models()


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class CreditRiskRequest(BaseModel):
    age: int = Field(ge=18, le=100)
    income: float = Field(gt=0)
    employment_years: float = Field(ge=0)
    loan_amount: float = Field(gt=0)
    loan_term: int = Field(gt=0)
    interest_rate: float = Field(gt=0)
    debt_to_income: float = Field(ge=0)
    credit_score: int = Field(ge=300, le=850)
    num_credit_lines: int = Field(ge=0)
    num_late_payments: int = Field(ge=0)
    years_credit_history: float = Field(ge=0)
    num_accounts: int = Field(ge=0)
    credit_utilization: float = Field(ge=0, le=100)
    total_debt: float = Field(ge=0)
    monthly_payment: float = Field(ge=0)


class FraudDetectionRequest(BaseModel):
    amount: float = Field(gt=0)
    hour_of_day: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    is_weekend: int = Field(ge=0, le=1)
    merchant_category: int = Field(ge=0, le=9)
    distance_from_home: float = Field(ge=0)
    distance_from_last_transaction: float = Field(ge=0)
    ratio_to_median_amount: float = Field(gt=0)
    is_online: int = Field(ge=0, le=1)
    is_international: int = Field(ge=0, le=1)
    txn_count_1h: int = Field(ge=0)
    txn_count_24h: int = Field(ge=0)
    avg_amount_7d: float = Field(ge=0)
    std_amount_7d: float = Field(ge=0)


class StressTestRequest(BaseModel):
    scenario: Optional[str] = Field(None, description="Predefined scenario name")
    risk_type: str = Field("credit", description="Risk type: credit or fraud")
    custom_adjustments: Optional[dict] = Field(None, description="Custom feature adjustments")
    sample_size: int = Field(100, ge=10, le=1000, description="Number of samples to test")


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "system": "Financial Risk Analysis & Prediction System",
        "version": "1.0.0",
        "models_loaded": models_loaded,
        "endpoints": [
            "/predict/credit",
            "/predict/fraud",
            "/explain/credit",
            "/explain/fraud",
            "/stress-test",
            "/model/info",
            "/scenarios",
        ],
    }


@app.post("/predict/credit")
async def predict_credit_risk(request: CreditRiskRequest):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded. Run train_models.py first.")
    df = pd.DataFrame([request.model_dump()])
    result = credit_model.predict(df)
    log_credit_prediction(request.model_dump(), result)
    return result


@app.post("/predict/fraud")
async def predict_fraud(request: FraudDetectionRequest):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded. Run train_models.py first.")
    df = pd.DataFrame([request.model_dump()])
    result = fraud_model.predict(df)
    log_fraud_prediction(request.model_dump(), result)
    return result


@app.post("/explain/credit")
async def explain_credit_risk(request: CreditRiskRequest):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")
    df = pd.DataFrame([request.model_dump()])
    X = credit_model.preprocessor.transform(df)
    explanation = credit_explainer.explain_prediction(X)
    prediction = credit_model.predict(df)
    return {"prediction": prediction, "explanation": explanation}


@app.post("/explain/fraud")
async def explain_fraud(request: FraudDetectionRequest):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")
    df = pd.DataFrame([request.model_dump()])
    X = fraud_model.preprocessor.transform(df)
    explanation = fraud_explainer.explain_prediction(X)
    prediction = fraud_model.predict(df)
    return {"prediction": prediction, "explanation": explanation}


@app.post("/stress-test")
async def run_stress_test(request: StressTestRequest):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    if request.risk_type == "credit":
        from src.data_ingestion import load_credit_data
        df = load_credit_data().sample(n=min(request.sample_size, 1000), random_state=42)
        result = stress_simulator.run_credit_stress_test(
            df, scenario_name=request.scenario, custom_adjustments=request.custom_adjustments
        )
    elif request.risk_type == "fraud":
        from src.data_ingestion import load_fraud_data
        df = load_fraud_data().sample(n=min(request.sample_size, 1000), random_state=42)
        result = stress_simulator.run_fraud_stress_test(df, multiplier=3.0)
    else:
        raise HTTPException(status_code=400, detail="risk_type must be 'credit' or 'fraud'")

    return result


@app.get("/model/info")
async def model_info():
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")
    return {
        "credit_risk": {
            "model_type": "GradientBoosting",
            "feature_count": len(credit_model.feature_names),
            "metrics": credit_model.metrics.get("gradient_boosting", {}),
        },
        "fraud_detection": {
            "model_type": "GradientBoosting + Isolation Forest",
            "feature_count": len(fraud_model.feature_names),
            "metrics": fraud_model.metrics.get("gradient_boosting", {}),
        },
    }


@app.get("/scenarios")
async def get_scenarios():
    from src.config import STRESS_TEST_SCENARIOS
    return [{"name": k, "adjustments": v} for k, v in STRESS_TEST_SCENARIOS.items()]


@app.get("/history/{risk_type}")
async def get_history(risk_type: str, limit: int = 50):
    """Retrieve recent predictions from MongoDB (credit or fraud)."""
    if risk_type not in ("credit", "fraud"):
        raise HTTPException(status_code=400, detail="risk_type must be 'credit' or 'fraud'")
    return {"risk_type": risk_type, "records": get_recent_predictions(risk_type, limit)}


@app.get("/db/stats")
async def db_stats():
    """Return MongoDB connection status and document counts."""
    return get_db_stats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
