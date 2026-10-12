"""
FastAPI Server for Self-Driving Portfolio Agentic Architecture.
"""

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.config import IPSConfig, DEFAULT_IPS, ASSET_CLASSES
from app.pipeline import SelfDrivingPortfolioPipeline
from app.backtest import run_backtest, DATA_PATH

app = FastAPI(
    title="The Self-Driving Portfolio API",
    description="Agentic Architecture for Institutional Asset Management (Andrew Ang et al.)",
    version="1.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RunPipelineRequest(BaseModel):
    ips: Optional[IPSConfig] = None
    custom_macro: Optional[Dict[str, Any]] = None

# Cache last result for instant page reload
LATEST_PIPELINE_RESULT = None

@app.on_event("startup")
def startup_event():
    global LATEST_PIPELINE_RESULT
    pipeline = SelfDrivingPortfolioPipeline(DEFAULT_IPS)
    LATEST_PIPELINE_RESULT = pipeline.run()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "architecture": "Multi-Agent SAA Pipeline", "agents_active": 50}

@app.get("/api/ips/default")
def get_default_ips():
    return {
        "ips": DEFAULT_IPS.dict(),
        "asset_classes": ASSET_CLASSES
    }

@app.get("/api/pipeline/latest")
def get_latest_run():
    global LATEST_PIPELINE_RESULT
    if LATEST_PIPELINE_RESULT is None:
        pipeline = SelfDrivingPortfolioPipeline(DEFAULT_IPS)
        LATEST_PIPELINE_RESULT = pipeline.run()
    return LATEST_PIPELINE_RESULT

@app.post("/api/pipeline/run")
def run_pipeline(payload: RunPipelineRequest):
    global LATEST_PIPELINE_RESULT
    try:
        ips_to_use = payload.ips or DEFAULT_IPS
        pipeline = SelfDrivingPortfolioPipeline(ips_to_use)
        result = pipeline.run(payload.custom_macro)
        LATEST_PIPELINE_RESULT = result
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/backtest")
def get_backtest():
    """최근 파이프라인 결과의 비중을 실제 ETF 월간 수익률로 백테스트합니다."""
    return run_backtest(get_latest_run())

@app.get("/api/backtest/data.csv")
def download_backtest_data():
    """백테스트에 쓴 원본 월간 수익률 CSV를 그대로 내려줍니다."""
    return FileResponse(DATA_PATH, media_type="text/csv", filename=DATA_PATH.name)

# Serve the built React dashboard from the same origin (Docker/Render deployment).
# Mounted last so /api/* routes take precedence; skipped in local dev where Vite serves the UI.
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="dashboard")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
