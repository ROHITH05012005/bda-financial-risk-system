# Setup & Run Instructions

This guide provides the necessary steps to set up the **Risk Navigator** project both locally and for production deployment.

---

## 💻 Local Setup (Localhost)

Follow these steps to run the full stack on your machine.

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **MongoDB** (Local instance running on port 27017)

### 2. Backend Configuration
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Train the models (required for first-time use):
   ```bash
   python train_models.py
   ```
3. Create a `.env` file in the root directory:
   ```env
   # Local MongoDB connection
   MONGO_URI=mongodb://localhost:27017/
   ```
4. Start the API:
   ```bash
   python -m src.api.main
   ```

### 3. Frontend Configuration
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
   - Access the dashboard at [http://localhost:5173](http://localhost:5173).

---

## 🌐 Production Deployment (Cloud)

The system is designed for a split deployment using **Render** (Backend) and **Vercel** (Frontend).

### 1. MongoDB Atlas (Database)
- Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas).
- Set Network Access to `0.0.0.0/0` to allow Render connections.
- Copy your connection string.

### 2. Render (Backend API)
- Connect your GitHub repository to Render as a **Web Service**.
- Render will automatically use the `render.yaml` or `Procfile`.
- **Environment Variables**:
  - Add `MONGO_URI` = Your Atlas connection string.
  - Ensure `PYTHON_VERSION` = `3.11.0`.

### 3. Vercel (Frontend UI)
- Connect your GitHub repository to Vercel.
- Set the **Root Directory** to `frontend`.
- **Environment Variables**:
  - Add `VITE_API_URL` = Your Render Web Service URL (e.g., `https://...onrender.com`).

---

## 🛠️ Troubleshooting

- **"Address already in use"**: Kill the process on port 8001 (Backend) or 5173 (Frontend).
- **"Bad Auth"**: Check that your MongoDB Atlas password doesn't contain special symbols like `@` or `:`.
- **"Models not found"**: Ensure `python train_models.py` has been run on whichever environment is hosting the backend.
