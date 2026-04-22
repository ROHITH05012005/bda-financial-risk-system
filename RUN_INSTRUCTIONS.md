# Running the BDA Project

This document outlines the exact commands needed to start the Financial Risk Analysis System project. The project consists of a Python FastAPI backend and a React/Vite frontend.

## 1. Start the Backend API Server

Open a terminal at the root of the project (`c:\Users\rohib\BDA PROJECT`) and run the following command:

```bash
python -m src.api.main
```

By default, the backend server will start on `http://0.0.0.0:8001/` (or `http://localhost:8001/`).

## 2. Start the Frontend Application

Open a **separate** terminal, navigate to the `frontend` directory, and start the development server:

```bash
cd frontend
npm run dev
```

The frontend will typically start on `http://localhost:5173/` (or `http://localhost:5174/` if the port is already in use).

## Important Notes
- **Keep both terminals running** simultaneously for the application to function properly.
- If you encounter a `[winerror 10048] address already in use` error for the backend, it means another instance of the backend is already running on port 8001 in the background.
