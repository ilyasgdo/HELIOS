import logging
import os

import httpx
from fastapi import APIRouter
from scheduler import cache_for

logger = logging.getLogger(__name__)
router = APIRouter()

FINNHUB_BASE = "https://finnhub.io/api/v1"
API_KEY = os.getenv("FINNHUB_API_KEY", "")

# Indices majeurs par pays
INDICES = {
    "US": "^GSPC",
    "DE": "^GDAXI",
    "FR": "^FCHI",
    "JP": "^N225",
    "GB": "^FTSE",
    "CN": "000001.SS",
}


@cache_for(90)
async def fetch_global_markets() -> list:
    """Récupère les cours des principaux indices mondiaux via Finnhub."""
    if not API_KEY:
        logger.warning("FINNHUB_API_KEY non défini, retour liste vide")
        return []

    results = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for country, symbol in INDICES.items():
            try:
                resp = await client.get(
                    f"{FINNHUB_BASE}/quote",
                    params={"symbol": symbol, "token": API_KEY},
                )
                data = resp.json()
                c = data.get("c", 0)
                pc = data.get("pc", 0)
                change_pct = round((c - pc) / pc * 100, 2) if pc else 0.0
                results.append({
                    "country": country,
                    "symbol": symbol,
                    "price": c,
                    "change_pct": change_pct,
                    "trend": "up" if change_pct >= 0 else "down",
                })
            except Exception as exc:
                logger.error("Finance %s error: %s", symbol, exc)

    logger.info("Finance: %d marchés récupérés", len(results))
    return results


@router.get("/markets")
async def get_markets():
    return await fetch_global_markets()
