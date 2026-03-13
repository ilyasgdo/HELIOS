import logging

import httpx
from fastapi import APIRouter
from scheduler import cache_for

logger = logging.getLogger(__name__)
router = APIRouter()

OPENSKY_URL = "https://opensky-network.org/api/states/all"


@cache_for(25)
async def fetch_planes() -> list:
    """Récupère les avions en temps réel depuis OpenSky (gratuit, sans clé)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(OPENSKY_URL)
            resp.raise_for_status()
            states = resp.json().get("states") or []
            planes = []
            for s in states:
                if s[5] is None or s[6] is None:
                    continue
                planes.append({
                    "icao24": s[0],
                    "callsign": (s[1] or "").strip(),
                    "origin_country": s[2],
                    "longitude": s[5],
                    "latitude": s[6],
                    "altitude": s[7],
                    "on_ground": s[8],
                    "velocity": s[9],
                    "heading": s[10],
                })
            logger.info("Aviation: %d avions récupérés", len(planes))
            return planes
        except Exception as exc:
            logger.error("OpenSky error: %s", exc)
            return []


@router.get("/")
async def get_aviation():
    return await fetch_planes()
