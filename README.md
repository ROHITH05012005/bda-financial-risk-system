# Financial Risk Analysis & Prediction System

A comprehensive system for **Credit Risk Assessment** and **Fraud Detection** built with Python, XGBoost, Isolation Forest, and SHAP explainability.

## Features

- **Credit Risk Prediction** — XGBoost classifier predicts loan default probability with engineered features (DTI, payment-to-income ratio, etc.)
- **Fraud Detection** — Dual-model approach: XGBoost classifier + Isolation Forest anomaly detection with combined risk scoring
- **Explainable AI (XAI)** — SHAP-based explanations for every prediction; regulators can see *why* a risk was flagged
- **Stress-Testing Simulator** — What-If scenarios (market crash, recession, interest rate hike) to assess portfolio resilience
- **Interactive Dashboard** — React-based risk cockpit with gauges, charts, and batch analysis
- **REST API** — FastAPI backend for real-time prediction serving

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Data Ingestion │───>│ Feature Engineer │───>│  Model Engine   │
│  (Synthetic/CSV)│    │  (DTI, RSI, etc) │    │  (XGB + IF)     │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                        │
                        ┌──────────────────┐    ┌───────┴─────────┐
                        │  SHAP Explainer  │<───┤  Risk Scoring   │
                        │  (XAI)           │    │  & Thresholding │
                        └──────────────────┘    └───────┬─────────┘
                                                        │
                        ┌──────────────────┐    ┌───────┴─────────┐
                        │  Stress Tester   │<───┤  React UI       │
                        │  (What-If)       │    │  + FastAPI      │
                        └──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train Models

```bash
python train_models.py
```

This generates synthetic data and trains both models. Expected output:
- Credit Risk XGBoost ROC-AUC: ~0.95+
- Fraud Detection XGBoost ROC-AUC: ~0.98+

### 3. Launch Dashboard

```bash
cd frontend
npm install
npm run dev
```


### 4. Start API Server (Optional)

```bash
python -m src.api.main
```

API available at `http://localhost:8001` with auto-docs at `/docs`.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict/credit` | POST | Predict loan default probability |
| `/predict/fraud` | POST | Detect transaction fraud |
| `/explain/credit` | POST | Credit prediction with SHAP explanation |
| `/explain/fraud` | POST | Fraud prediction with SHAP explanation |
| `/stress-test` | POST | Run What-If stress test scenario |
| `/model/info` | GET | Model metrics and configuration |
| `/scenarios` | GET | Available stress test scenarios |

## Project Structure

```
├── frontend/                       # React dashboard
├── train_models.py                 # Training pipeline
├── requirements.txt                # Dependencies
├── src/
│   ├── config.py                   # Configuration & paths
│   ├── data_ingestion.py           # Synthetic data generators
│   ├── preprocessing.py            # Feature engineering & SMOTE
│   ├── explainability.py           # SHAP explainer
│   ├── stress_test.py              # What-If simulator
│   ├── models/
│   │   ├── credit_risk_model.py    # XGBoost credit classifier
│   │   └── fraud_detection_model.py # XGBoost + Isolation Forest
│   └── api/
│       └── main.py                 # FastAPI server
├── data/                           # Generated CSVs
└── models/                         # Saved .pkl models
```

## Risk Scoring

### Credit Risk
| Score Range | Risk Level | Action |
|------------|-----------|--------|
| 0 – 30% | LOW | Auto-approve |
| 30 – 60% | MEDIUM | Manual review |
| 60 – 80% | HIGH | Enhanced due diligence |
| 80 – 100% | CRITICAL | Reject / escalate |

### Fraud Detection
| Score Range | Risk Level | Action |
|------------|-----------|--------|
| 0 – 20% | LOW | Allow transaction |
| 20 – 50% | MEDIUM | Flag for review |
| 50 – 75% | HIGH | Block & verify |
| 75 – 100% | CRITICAL | Block & alert |

## Stress Test Scenarios

- **Market Crash** — Interest rates +50%, credit scores -50, DTI +30%
- **Recession** — Income -30%, employment years -50%, DTI +40%
- **Interest Rate Hike** — Interest rates +100%, monthly payments +30%
- **Credit Crunch** — Credit scores -80, credit lines -50%, utilization +50%

## Key Design Decisions

- **Recall over Accuracy**: In financial risk, missing a real threat (false negative) is far costlier than a false alarm
- **SMOTE for Imbalance**: Both credit defaults and fraud are rare events; SMOTE balances training data
- **Dual Fraud Model**: XGBoost handles classification while Isolation Forest catches novel anomalies the classifier hasn't seen
- **SHAP Explainability**: Every prediction comes with feature-level explanations for regulatory compliance
