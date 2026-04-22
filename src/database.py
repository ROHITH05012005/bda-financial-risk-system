"""
MongoDB connection and logging utilities.
Gracefully falls back to no-op mode if MONGO_URI is not set.
"""
import os
from datetime import datetime, timezone
from typing import Optional

_db = None
_enabled = False


def get_db():
    global _db, _enabled
    if _db is not None or not _enabled:
        return _db

    mongo_uri = os.environ.get("MONGO_URI", "")
    if not mongo_uri:
        return None

    try:
        from pymongo import MongoClient
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")          # verify connection
        _db = client["financial_risk"]
        _enabled = True
        print("✅ MongoDB connected.")
    except Exception as e:
        print(f"⚠️  MongoDB unavailable: {e}. Running without persistence.")
        _enabled = False
    return _db


def init_db():
    """Call once at startup to initialise the connection."""
    global _enabled
    mongo_uri = os.environ.get("MONGO_URI", "")
    if mongo_uri:
        _enabled = True
        get_db()          # attempt connection immediately


# ── Logging helpers ───────────────────────────────────────────────────────────

def _log(collection_name: str, payload: dict):
    db = get_db()
    if db is None:
        return
    try:
        payload["timestamp"] = datetime.now(timezone.utc)
        db[collection_name].insert_one(payload)
    except Exception as e:
        print(f"DB log error: {e}")


def log_credit_prediction(input_data: dict, result: dict):
    _log("credit_predictions", {"input": input_data, "result": result})


def log_fraud_prediction(input_data: dict, result: dict):
    _log("fraud_predictions", {"input": input_data, "result": result})


# ── History retrieval ─────────────────────────────────────────────────────────

def get_recent_predictions(risk_type: str, limit: int = 50) -> list:
    db = get_db()
    if db is None:
        return []
    collection = "credit_predictions" if risk_type == "credit" else "fraud_predictions"
    try:
        docs = list(
            db[collection]
            .find({}, {"_id": 0})
            .sort("timestamp", -1)
            .limit(limit)
        )
        # Convert datetime to ISO string for JSON serialisation
        for d in docs:
            if "timestamp" in d:
                d["timestamp"] = d["timestamp"].isoformat()
        return docs
    except Exception as e:
        print(f"DB fetch error: {e}")
        return []


def get_db_stats() -> dict:
    db = get_db()
    if db is None:
        return {"connected": False, "credit_count": 0, "fraud_count": 0}
    try:
        return {
            "connected": True,
            "credit_count": db["credit_predictions"].count_documents({}),
            "fraud_count": db["fraud_predictions"].count_documents({}),
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}
