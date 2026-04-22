web: uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8001}
build: pip install -r requirements.txt && python train_models.py
