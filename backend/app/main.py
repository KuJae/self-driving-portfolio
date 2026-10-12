"""
FastAPI Server for Self-Driving Portfolio Agentic Architecture.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.config import IPSConfig, DEFAULT_IPS, ASSET_CLASSES
from app.pipeline import SelfDrivingPortfolioPipeline

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
