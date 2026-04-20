import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.models.credit_risk_model import CreditRiskModel
from src.models.fraud_detection_model import FraudDetectionModel
from src.stress_test import StressTestSimulator
from src.explainability import RiskExplainer
from src.data_ingestion import load_credit_data, load_fraud_data
from src.config import STRESS_TEST_SCENARIOS


@st.cache_resource
def load_models():
    credit = CreditRiskModel()
    fraud = FraudDetectionModel()
    try:
        credit.load()
        fraud.load()
        return credit, fraud, True
    except Exception:
        return credit, fraud, False


credit_model, fraud_model, models_loaded = load_models()

st.set_page_config(
    page_title="Financial Risk Analysis System",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    .main-header { font-size: 2rem; font-weight: 700; color: #1a1a2e; }
    .risk-low { background-color: #d4edda; color: #155724; padding: 0.5rem; border-radius: 0.5rem; }
    .risk-medium { background-color: #fff3cd; color: #856404; padding: 0.5rem; border-radius: 0.5rem; }
    .risk-high { background-color: #f8d7da; color: #721c24; padding: 0.5rem; border-radius: 0.5rem; }
    .risk-critical { background-color: #721c24; color: #fff; padding: 0.5rem; border-radius: 0.5rem; }
    .metric-card { background-color: #f8f9fa; padding: 1rem; border-radius: 0.5rem; border: 1px solid #dee2e6; }
</style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.title("🛡️ Risk Navigator")
    page = st.radio(
        "Select Module",
        ["📊 Dashboard Overview", "💳 Credit Risk Analysis", "🔍 Fraud Detection", "🧪 Stress Testing", "📈 Model Performance"],
    )

    if not models_loaded:
        st.error("⚠️ Models not loaded!")
        if st.button("Train Models", type="primary"):
            with st.spinner("Training models... This may take a minute."):
                from src.data_ingestion import generate_credit_risk_data, generate_fraud_data
                generate_credit_risk_data()
                generate_fraud_data()
                credit_model.train()
                fraud_model.train()
                st.success("Models trained! Refresh the page.")
                st.rerun()

    st.markdown("---")
    st.caption("Financial Risk Analysis & Prediction System v1.0")


if page == "📊 Dashboard Overview":
    st.markdown('<p class="main-header">Financial Risk Analysis Dashboard</p>', unsafe_allow_html=True)

    if not models_loaded:
        st.warning("Train models first using the sidebar button.")
        st.stop()

    col1, col2, col3, col4 = st.columns(4)
    credit_df = load_credit_data()
    fraud_df = load_fraud_data()

    with col1:
        st.metric("Total Loan Applications", f"{len(credit_df):,}")
    with col2:
        default_rate = credit_df["loan_default"].mean() * 100
        st.metric("Default Rate", f"{default_rate:.1f}%")
    with col3:
        st.metric("Total Transactions", f"{len(fraud_df):,}")
    with col4:
        fraud_rate = fraud_df["is_fraud"].mean() * 100
        st.metric("Fraud Rate", f"{fraud_rate:.1f}%")

    st.markdown("---")

    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("Credit Score Distribution")
        fig = px.histogram(credit_df, x="credit_score", color="loan_default",
                           nbins=40, title="Credit Score by Default Status",
                           color_discrete_map={0: "#2ecc71", 1: "#e74c3c"})
        fig.update_layout(bargap=0.1)
        st.plotly_chart(fig, use_container_width=True)

    with col_right:
        st.subheader("Transaction Amount Distribution")
        fig = px.histogram(fraud_df, x="amount", color="is_fraud",
                           nbins=50, title="Amount by Fraud Status",
                           color_discrete_map={0: "#2ecc71", 1: "#e74c3c"})
        fig.update_layout(bargap=0.1)
        st.plotly_chart(fig, use_container_width=True)

    col_left2, col_right2 = st.columns(2)

    with col_left2:
        st.subheader("Debt-to-Income vs Default")
        fig = px.box(credit_df, x="loan_default", y="debt_to_income",
                     title="DTI Distribution by Default",
                     color="loan_default", color_discrete_map={0: "#2ecc71", 1: "#e74c3c"})
        st.plotly_chart(fig, use_container_width=True)

    with col_right2:
        st.subheader("Fraud by Hour of Day")
        fraud_by_hour = fraud_df.groupby("hour_of_day")["is_fraud"].mean().reset_index()
        fig = px.bar(fraud_by_hour, x="hour_of_day", y="is_fraud",
                     title="Fraud Rate by Hour", labels={"is_fraud": "Fraud Rate", "hour_of_day": "Hour"})
        st.plotly_chart(fig, use_container_width=True)


elif page == "💳 Credit Risk Analysis":
    st.markdown('<p class="main-header">Credit Risk Analysis</p>', unsafe_allow_html=True)

    if not models_loaded:
        st.warning("Train models first.")
        st.stop()

    tab1, tab2 = st.tabs(["Single Prediction", "Batch Analysis"])

    with tab1:
        st.subheader("Loan Default Prediction")
        col1, col2, col3 = st.columns(3)

        with col1:
            age = st.slider("Age", 18, 80, 35)
            income = st.number_input("Annual Income ($)", 15000, 500000, 60000, step=5000)
            employment_years = st.slider("Employment Years", 0.0, 40.0, 5.0, 0.5)
            loan_amount = st.number_input("Loan Amount ($)", 1000, 500000, 25000, step=1000)

        with col2:
            loan_term = st.selectbox("Loan Term (months)", [12, 24, 36, 48, 60, 72, 84], index=4)
            interest_rate = st.slider("Interest Rate (%)", 2.0, 25.0, 8.0, 0.5)
            debt_to_income = st.slider("Debt-to-Income Ratio", 0.0, 80.0, 25.0, 1.0)
            credit_score = st.slider("Credit Score", 300, 850, 680)

        with col3:
            num_credit_lines = st.slider("Credit Lines", 0, 30, 5)
            num_late_payments = st.slider("Late Payments", 0, 20, 0)
            years_credit_history = st.slider("Credit History (years)", 0.0, 40.0, 10.0, 0.5)
            num_accounts = st.slider("Total Accounts", 0, 25, 8)

        credit_utilization = st.slider("Credit Utilization (%)", 0.0, 100.0, 30.0, 1.0)
        total_debt = income * (debt_to_income / 100)
        monthly_payment = loan_amount * (interest_rate / 100 / 12) / (1 - (1 + interest_rate / 100 / 12) ** (-loan_term))

        input_df = pd.DataFrame([{
            "age": age, "income": income, "employment_years": employment_years,
            "loan_amount": loan_amount, "loan_term": loan_term,
            "interest_rate": interest_rate, "debt_to_income": debt_to_income,
            "credit_score": credit_score, "num_credit_lines": num_credit_lines,
            "num_late_payments": num_late_payments, "years_credit_history": years_credit_history,
            "num_accounts": num_accounts, "credit_utilization": credit_utilization,
            "total_debt": total_debt, "monthly_payment": monthly_payment,
        }])

        if st.button("Predict Credit Risk", type="primary"):
            result = credit_model.predict(input_df)
            prob = result["default_probability"]
            risk = result["risk_level"]

            risk_colors = {"LOW": "#2ecc71", "MEDIUM": "#f39c12", "HIGH": "#e74c3c", "CRITICAL": "#8e44ad"}

            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Default Probability", f"{prob:.1%}")
            with col2:
                st.markdown(f'<div class="risk-{risk.lower()}"><h3>Risk Level: {risk}</h3></div>', unsafe_allow_html=True)
            with col3:
                fig_gauge = go.Figure(go.Indicator(
                    mode="gauge+number",
                    value=prob * 100,
                    domain={"x": [0, 1], "y": [0, 1]},
                    title={"text": "Risk Score"},
                    gauge={
                        "axis": {"range": [0, 100]},
                        "bar": {"color": risk_colors.get(risk, "#e74c3c")},
                        "steps": [
                            {"range": [0, 30], "color": "#d4edda"},
                            {"range": [30, 60], "color": "#fff3cd"},
                            {"range": [60, 80], "color": "#f8d7da"},
                            {"range": [80, 100], "color": "#721c24"},
                        ],
                    },
                ))
                fig_gauge.update_layout(height=250)
                st.plotly_chart(fig_gauge, use_container_width=True)

            with st.expander("🔍 Feature Explanation — Why this risk level?"):
                try:
                    explainer = RiskExplainer(credit_model.model, credit_model.feature_names)
                    X = credit_model.preprocessor.transform(input_df)
                    explanation = explainer.explain_prediction(X)

                    st.write("**Top Risk Factors:**")
                    for feat in explanation["top_features"][:8]:
                        direction = "🔴" if feat["impact"] == "increases_risk" else "🟢"
                        st.write(f"{direction} **{feat['feature']}** = {feat['value']} "
                                 f"(Contribution: {feat['contribution']:.4f}) — {feat['impact'].replace('_', ' ')}")

                    fig_summary = explainer.get_waterfall_plot(X)
                    st.pyplot(fig_summary)
                    plt.close()
                except Exception as e:
                    st.warning(f"Explanation unavailable: {e}")

    with tab2:
        st.subheader("Batch Credit Risk Analysis")
        credit_df = load_credit_data()
        sample_size = st.slider("Sample Size", 50, 500, 100, key="credit_batch_size")
        sample_df = credit_df.sample(n=sample_size, random_state=42)

        if st.button("Run Batch Prediction"):
            with st.spinner("Analyzing..."):
                results = credit_model.predict_batch(sample_df)
                results_df = pd.DataFrame(results)
                combined = pd.concat([sample_df.reset_index(drop=True), results_df], axis=1)

                risk_dist = results_df["risk_level"].value_counts()
                col1, col2 = st.columns(2)

                with col1:
                    fig = px.pie(values=risk_dist.values, names=risk_dist.index,
                                 title="Risk Level Distribution",
                                 color=risk_dist.index,
                                 color_discrete_map={"LOW": "#2ecc71", "MEDIUM": "#f39c12",
                                                     "HIGH": "#e74c3c", "CRITICAL": "#8e44ad"})
                    st.plotly_chart(fig, use_container_width=True)

                with col2:
                    fig = px.histogram(results_df, x="default_probability",
                                      nbins=30, title="Default Probability Distribution",
                                      color_discrete_sequence=["#3498db"])
                    st.plotly_chart(fig, use_container_width=True)

                st.dataframe(combined[["credit_score", "debt_to_income", "loan_amount",
                                       "default_probability", "risk_level"]].head(20))


elif page == "🔍 Fraud Detection":
    st.markdown('<p class="main-header">Fraud Detection Analysis</p>', unsafe_allow_html=True)

    if not models_loaded:
        st.warning("Train models first.")
        st.stop()

    tab1, tab2 = st.tabs(["Single Transaction", "Batch Analysis"])

    with tab1:
        st.subheader("Transaction Fraud Detection")
        col1, col2, col3 = st.columns(3)

        with col1:
            amount = st.number_input("Transaction Amount ($)", 1.0, 50000.0, 100.0, step=10.0)
            hour = st.slider("Hour of Day", 0, 23, 14)
            day = st.selectbox("Day of Week", range(7), format_func=lambda x: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][x])
            merchant = st.selectbox("Merchant Category", range(10), format_func=lambda x: f"Category {x}")

        with col2:
            dist_home = st.slider("Distance from Home (km)", 0.0, 500.0, 5.0, 1.0)
            dist_last = st.slider("Distance from Last Txn (km)", 0.0, 300.0, 2.0, 1.0)
            ratio_median = st.number_input("Ratio to Median Amount", 0.01, 20.0, 1.0, step=0.1)
            is_online = st.checkbox("Online Transaction")

        with col3:
            is_international = st.checkbox("International Transaction")
            txn_1h = st.slider("Txn Count (1h)", 0, 30, 1)
            txn_24h = st.slider("Txn Count (24h)", 0, 80, 5)
            avg_7d = st.number_input("Avg Amount (7d)", 1.0, 10000.0, 100.0, step=10.0)
            std_7d = st.number_input("Std Amount (7d)", 0.0, 15000.0, 200.0, step=10.0)

        input_df = pd.DataFrame([{
            "amount": amount, "hour_of_day": hour, "day_of_week": day,
            "is_weekend": int(day >= 5), "merchant_category": merchant,
            "distance_from_home": dist_home, "distance_from_last_transaction": dist_last,
            "ratio_to_median_amount": ratio_median, "is_online": int(is_online),
            "is_international": int(is_international), "txn_count_1h": txn_1h,
            "txn_count_24h": txn_24h, "avg_amount_7d": avg_7d, "std_amount_7d": std_7d,
        }])

        if st.button("Detect Fraud", type="primary"):
            result = fraud_model.predict(input_df)
            prob = result["fraud_probability"]
            combined = result["combined_risk_score"]
            risk = result["risk_level"]

            risk_colors = {"LOW": "#2ecc71", "MEDIUM": "#f39c12", "HIGH": "#e74c3c", "CRITICAL": "#8e44ad"}

            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Fraud Probability", f"{prob:.1%}")
            with col2:
                st.metric("Combined Risk Score", f"{combined:.1%}")
            with col3:
                anomaly_text = "⚠️ ANOMALY DETECTED" if result["is_anomaly"] else "✅ Normal Pattern"
                st.markdown(f"**Anomaly Detection:** {anomaly_text}")

            fig_gauge = go.Figure(go.Indicator(
                mode="gauge+number",
                value=combined * 100,
                domain={"x": [0, 1], "y": [0, 1]},
                title={"text": f"Risk Level: {risk}"},
                gauge={
                    "axis": {"range": [0, 100]},
                    "bar": {"color": risk_colors.get(risk, "#e74c3c")},
                    "steps": [
                        {"range": [0, 20], "color": "#d4edda"},
                        {"range": [20, 50], "color": "#fff3cd"},
                        {"range": [50, 75], "color": "#f8d7da"},
                        {"range": [75, 100], "color": "#721c24"},
                    ],
                },
            ))
            fig_gauge.update_layout(height=250)
            st.plotly_chart(fig_gauge, use_container_width=True)

            with st.expander("🔍 Feature Explanation"):
                try:
                    explainer = RiskExplainer(fraud_model.gb_model, fraud_model.feature_names)
                    X = fraud_model.preprocessor.transform(input_df)
                    explanation = explainer.explain_prediction(X)

                    for feat in explanation["top_features"][:8]:
                        direction = "🔴" if feat["impact"] == "increases_risk" else "🟢"
                        st.write(f"{direction} **{feat['feature']}** = {feat['value']} "
                                 f"(Contribution: {feat['contribution']:.4f})")
                except Exception as e:
                    st.warning(f"Explanation unavailable: {e}")

    with tab2:
        st.subheader("Batch Fraud Detection")
        fraud_df = load_fraud_data()
        sample_size = st.slider("Sample Size", 50, 500, 100, key="fraud_batch_size")
        sample_df = fraud_df.sample(n=sample_size, random_state=42)

        if st.button("Run Batch Fraud Scan"):
            with st.spinner("Scanning transactions..."):
                results = fraud_model.predict_batch(sample_df)
                results_df = pd.DataFrame(results)
                combined_df = pd.concat([sample_df.reset_index(drop=True), results_df], axis=1)

                flagged = results_df[results_df["prediction"] == 1]
                st.metric("Flagged Transactions", f"{len(flagged)} / {len(results_df)}",
                          delta=f"{len(flagged)/len(results_df)*100:.1f}%")

                col1, col2 = st.columns(2)
                with col1:
                    fig = px.histogram(results_df, x="fraud_probability", nbins=30,
                                       title="Fraud Probability Distribution",
                                       color_discrete_sequence=["#e74c3c"])
                    st.plotly_chart(fig, use_container_width=True)

                with col2:
                    risk_dist = results_df["risk_level"].value_counts()
                    fig = px.pie(values=risk_dist.values, names=risk_dist.index,
                                 title="Risk Distribution",
                                 color=risk_dist.index,
                                 color_discrete_map={"LOW": "#2ecc71", "MEDIUM": "#f39c12",
                                                     "HIGH": "#e74c3c", "CRITICAL": "#8e44ad"})
                    st.plotly_chart(fig, use_container_width=True)

                st.dataframe(combined_df[["amount", "hour_of_day", "distance_from_home",
                                          "fraud_probability", "is_anomaly", "risk_level"]].head(20))


elif page == "🧪 Stress Testing":
    st.markdown('<p class="main-header">Stress Testing Simulator</p>', unsafe_allow_html=True)

    if not models_loaded:
        st.warning("Train models first.")
        st.stop()

    stress_sim = StressTestSimulator(credit_model, fraud_model)

    tab1, tab2 = st.tabs(["Credit Stress Test", "Fraud Stress Test"])

    with tab1:
        st.subheader("What-If Credit Risk Scenarios")

        scenario = st.selectbox(
            "Select Scenario",
            ["None"] + list(STRESS_TEST_SCENARIOS.keys()),
            format_func=lambda x: x.replace("_", " ").title() if x != "None" else "Select a scenario..."
        )

        st.write("**Or create custom adjustments:**")
        custom = {}
        col1, col2 = st.columns(2)
        with col1:
            if st.checkbox("Adjust Interest Rate"):
                custom["interest_rate"] = st.slider("Interest Rate Multiplier", 1.0, 3.0, 1.5, 0.1)
            if st.checkbox("Adjust Credit Score"):
                custom["credit_score"] = st.slider("Credit Score Change", -150, 50, -50, 10)
        with col2:
            if st.checkbox("Adjust Debt-to-Income"):
                custom["debt_to_income"] = st.slider("DTI Multiplier", 1.0, 2.0, 1.3, 0.1)
            if st.checkbox("Adjust Income"):
                custom["income"] = st.slider("Income Multiplier", 0.3, 1.0, 0.7, 0.1)

        sample_size = st.slider("Sample Size", 50, 500, 200, key="stress_credit_size")

        if st.button("Run Credit Stress Test", type="primary"):
            scenario_name = scenario if scenario != "None" else None
            adjustments = custom if custom else None

            if not scenario_name and not adjustments:
                st.warning("Select a scenario or create custom adjustments.")
            else:
                with st.spinner("Running stress test..."):
                    credit_df = load_credit_data().sample(n=sample_size, random_state=42)
                    result = stress_sim.run_credit_stress_test(
                        credit_df, scenario_name=scenario_name, custom_adjustments=adjustments
                    )

                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Original Avg Default Prob", f"{result['original_avg_probability']:.1%}")
                    with col2:
                        st.metric("Stressed Avg Default Prob", f"{result['stressed_avg_probability']:.1%}")
                    with col3:
                        st.metric("Probability Increase", f"+{result['pct_increase']:.1f}%")

                    orig_dist = result["original_risk_distribution"]
                    stress_dist = result["stressed_risk_distribution"]

                    comparison = pd.DataFrame({
                        "Risk Level": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                        "Original %": [orig_dist[k]["pct"] for k in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]],
                        "Stressed %": [stress_dist[k]["pct"] for k in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]],
                    })
                    fig = px.bar(comparison, x="Risk Level", y=["Original %", "Stressed %"],
                                 barmode="group", title="Risk Distribution: Original vs Stressed",
                                 color_discrete_sequence=["#3498db", "#e74c3c"])
                    st.plotly_chart(fig, use_container_width=True)

                    with st.expander("View Detailed Results"):
                        st.json(result)

    with tab2:
        st.subheader("Fraud Spike Simulation")
        multiplier = st.slider("Transaction Amount Multiplier", 1.0, 5.0, 3.0, 0.5)
        sample_size = st.slider("Sample Size", 50, 500, 200, key="stress_fraud_size")

        if st.button("Run Fraud Stress Test", type="primary"):
            with st.spinner("Simulating fraud spike..."):
                fraud_df = load_fraud_data().sample(n=sample_size, random_state=42)
                result = stress_sim.run_fraud_stress_test(fraud_df, multiplier=multiplier)

                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Original Avg Fraud Prob", f"{result['original_avg_fraud_prob']:.1%}")
                with col2:
                    st.metric("Stressed Avg Fraud Prob", f"{result['stressed_avg_fraud_prob']:.1%}")

                st.metric("Newly Flagged Transactions", result["flagged_increase"])
                st.json(result)


elif page == "📈 Model Performance":
    st.markdown('<p class="main-header">Model Performance Metrics</p>', unsafe_allow_html=True)

    if not models_loaded:
        st.warning("Train models first.")
        st.stop()

    tab1, tab2 = st.tabs(["Credit Risk Model", "Fraud Detection Model"])

    with tab1:
        st.subheader("Gradient Boosting Credit Risk Classifier")
        metrics = credit_model.metrics.get("gradient_boosting", {})

        if metrics:
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("ROC-AUC", f"{metrics.get('roc_auc', 0):.4f}")
            with col2:
                st.metric("F1 Score", f"{metrics.get('f1', 0):.4f}")
            with col3:
                st.metric("Recall", f"{metrics.get('recall', 0):.4f}")
            with col4:
                st.metric("Avg Precision", f"{metrics.get('avg_precision', 0):.4f}")

            cm = np.array(metrics.get("confusion_matrix", [[0, 0], [0, 0]]))
            fig = px.imshow(cm, text_auto=True, title="Confusion Matrix",
                            labels=dict(x="Predicted", y="Actual"),
                            x=["No Default", "Default"], y=["No Default", "Default"],
                            color_continuous_scale="Blues")
            st.plotly_chart(fig, use_container_width=True)

            report = metrics.get("classification_report", {})
            if report:
                classes = [k for k in report.keys() if k in ("0", "1")]
                report_data = []
                for cls in classes:
                    r = report[cls]
                    report_data.append({
                        "Class": "No Default" if cls == "0" else "Default",
                        "Precision": r.get("precision", 0),
                        "Recall": r.get("recall", 0),
                        "F1-Score": r.get("f1-score", 0),
                        "Support": r.get("support", 0),
                    })
                st.dataframe(pd.DataFrame(report_data))

        st.subheader("Baseline vs Gradient Boosting Comparison")
        baseline_metrics = credit_model.metrics.get("baseline_lr", {})
        if baseline_metrics and metrics:
            comparison = pd.DataFrame({
                "Model": ["Logistic Regression", "Gradient Boosting"],
                "ROC-AUC": [baseline_metrics.get("roc_auc", 0), metrics.get("roc_auc", 0)],
                "F1": [baseline_metrics.get("f1", 0), metrics.get("f1", 0)],
                "Recall": [baseline_metrics.get("recall", 0), metrics.get("recall", 0)],
            })
            st.dataframe(comparison)

            fig = px.bar(comparison.melt(id_vars="Model", var_name="Metric", value_name="Score"),
                         x="Metric", y="Score", color="Model", barmode="group",
                         title="Model Comparison", color_discrete_sequence=["#3498db", "#e74c3c"])
            st.plotly_chart(fig, use_container_width=True)

        with st.expander("🔍 Feature Importance (Global)"):
            try:
                credit_df = load_credit_data().sample(n=200, random_state=42)
                explainer = RiskExplainer(credit_model.model, credit_model.feature_names)
                X = credit_model.preprocessor.transform(credit_df)
                fig = explainer.get_summary_plot(X)
                st.pyplot(fig)
                plt.close()
            except Exception as e:
                st.warning(f"Feature importance unavailable: {e}")

    with tab2:
        st.subheader("Gradient Boosting Fraud Detection Classifier")
        metrics = fraud_model.metrics.get("gradient_boosting", {})

        if metrics:
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("ROC-AUC", f"{metrics.get('roc_auc', 0):.4f}")
            with col2:
                st.metric("F1 Score", f"{metrics.get('f1', 0):.4f}")
            with col3:
                st.metric("Recall", f"{metrics.get('recall', 0):.4f}")
            with col4:
                st.metric("Avg Precision", f"{metrics.get('avg_precision', 0):.4f}")

            cm = np.array(metrics.get("confusion_matrix", [[0, 0], [0, 0]]))
            fig = px.imshow(cm, text_auto=True, title="Confusion Matrix",
                            labels=dict(x="Predicted", y="Actual"),
                            x=["Legit", "Fraud"], y=["Legit", "Fraud"],
                            color_continuous_scale="Blues")
            st.plotly_chart(fig, use_container_width=True)

        iso_metrics = fraud_model.metrics.get("isolation_forest", {})
        if iso_metrics:
            st.subheader("Isolation Forest (Anomaly Detection)")
            col1, col2 = st.columns(2)
            with col1:
                st.metric("F1 Score", f"{iso_metrics.get('f1', 0):.4f}")
            with col2:
                st.metric("Recall", f"{iso_metrics.get('recall', 0):.4f}")

        with st.expander("🔍 Feature Importance (Global)"):
            try:
                fraud_df = load_fraud_data().sample(n=200, random_state=42)
                explainer = RiskExplainer(fraud_model.gb_model, fraud_model.feature_names)
                X = fraud_model.preprocessor.transform(fraud_df)
                fig = explainer.get_summary_plot(X)
                st.pyplot(fig)
                plt.close()
            except Exception as e:
                st.warning(f"Feature importance unavailable: {e}")
