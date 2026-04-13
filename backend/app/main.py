from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import json_tool

app = FastAPI(title="DevKit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(json_tool.router, prefix="/api/json", tags=["JSON Tool"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
