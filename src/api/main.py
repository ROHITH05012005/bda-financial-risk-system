from fastapi import FastAPI, HTTPException
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

app = FastAPI(
    title="Financial Risk Analysis API",
    description="Real-time Credit Risk & Fraud Detection Prediction System",
    version="1.0.0",
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
        print("Run 'python train_models.py' first to train and save models.")


@app.on_event("startup")
async def startup_event():
    load_models()


class CreditRiskRequest(BaseModel):
    age: int = Field(ge=18, le=100, description="Applicant age")
    income: float = Field(gt=0, description="Annual income")
    employment_years: float = Field(ge=0, description="Years employed")
    loan_amount: float = Field(gt=0, description="Requested loan amount")
    loan_term: int = Field(gt=0, description="Loan term in months")
    interest_rate: float = Field(gt=0, description="Annual interest rate %")
    debt_to_income: float = Field(ge=0, description="Debt-to-income ratio")
    credit_score: int = Field(ge=300, le=850, description="Credit score")
    num_credit_lines: int = Field(ge=0, description="Number of credit lines")
    num_late_payments: int = Field(ge=0, description="Number of late payments")
    years_credit_history: float = Field(ge=0, description="Years of credit history")
    num_accounts: int = Field(ge=0, description="Number of accounts")
    credit_utilization: float = Field(ge=0, le=100, description="Credit utilization %")
    total_debt: float = Field(ge=0, description="Total outstanding debt")
    monthly_payment: float = Field(ge=0, description="Monthly payment amount")


class FraudDetectionRequest(BaseModel):
    amount: float = Field(gt=0, description="Transaction amount")
    hour_of_day: int = Field(ge=0, le=23, description="Hour of transaction")
    day_of_week: int = Field(ge=0, le=6, description="Day of week (0=Mon)")
    is_weekend: int = Field(ge=0, le=1, description="Is weekend (0/1)")
    merchant_category: int = Field(ge=0, le=9, description="Merchant category code")
    distance_from_home: float = Field(ge=0, description="Distance from home (km)")
    distance_from_last_transaction: float = Field(ge=0, description="Distance from last txn (km)")
    ratio_to_median_amount: float = Field(gt=0, description="Ratio to median amount")
    is_online: int = Field(ge=0, le=1, description="Is online transaction (0/1)")
    is_international: int = Field(ge=0, le=1, description="Is international (0/1)")
    txn_count_1h: int = Field(ge=0, description="Transaction count in last 1h")
    txn_count_24h: int = Field(ge=0, description="Transaction count in last 24h")
    avg_amount_7d: float = Field(ge=0, description="Average amount over 7 days")
    std_amount_7d: float = Field(ge=0, description="Std dev of amount over 7 days")


class StressTestRequest(BaseModel):
    scenario: Optional[str] = Field(None, description="Predefined scenario name")
    risk_type: str = Field("credit", description="Risk type: credit or fraud")
    custom_adjustments: Optional[dict] = Field(None, description="Custom feature adjustments")
    sample_size: int = Field(100, ge=10, le=1000, description="Number of samples to test")


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
    return result


@app.post("/predict/fraud")
async def predict_fraud(request: FraudDetectionRequest):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded. Run train_models.py first.")
    df = pd.DataFrame([request.model_dump()])
    result = fraud_model.predict(df)
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
        result = stress_simulator.run_fraud_stress_test(df)
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
    return stress_simulator.get_available_scenarios() if stress_simulator else []


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
