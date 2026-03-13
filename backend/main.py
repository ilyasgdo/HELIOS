import logging
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db import init_db, get_session
from websocket import manager
from scheduler import HeliosScheduler
from routes import aviation, news, finance, weather, cctv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HELIOS API",
    version="0.1.0",
    description="Global Intelligence Terminal — Backend API",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(aviation.router, prefix="/api/aviation", tags=["Aviation"])
app.include_router(news.router, prefix="/api/news", tags=["News"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(cctv.router, prefix="/api/cctv", tags=["CCTV"])

# Scheduler global
_scheduler: HeliosScheduler | None = None


@app.get("/api/health", tags=["System"])
async def health():
    """Endpoint de santé du service."""
    return {"status": "ok", "service": "HELIOS", "version": "0.1.0"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket pour le streaming temps réel vers le frontend."""
    await manager.connect(websocket)
    try:
        while True:
            # Garder la connexion ouverte
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.on_event("startup")
async def on_startup():
    global _scheduler
    logger.info("HELIOS backend starting...")
    init_db()
    _scheduler = HeliosScheduler(ws_manager=manager)
    _scheduler.start()
    logger.info("HELIOS backend ready.")


@app.on_event("shutdown")
async def on_shutdown():
    global _scheduler
    if _scheduler:
        _scheduler.scheduler.shutdown(wait=False)
    logger.info("HELIOS backend stopped.")
