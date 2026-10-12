@echo off
echo Starting The Self-Driving Portfolio Backend (FastAPI on 0.0.0.0)...
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
