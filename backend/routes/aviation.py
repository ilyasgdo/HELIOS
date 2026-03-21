import logging

import httpx
from fastapi import APIRouter
from scheduler import cache_for

logger = logging.getLogger(__name__)
router = APIRouter()

FR24_URL = "https://data-cloud.flightradar24.com/zones/fcgi/data.js"


@cache_for(25)
async def fetch_planes() -> list:
    """Récupère les avions en temps réel depuis FlightRadar24 (API zone globale, ~15k avions)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json",
        "Referer": "https://www.flightradar24.com/"
    }
    params = {
        "bounds": "75,-75,-180,180", # Toute la terre
        "faa": "1", "satellite": "1", "mlat": "1", "flarm": "1", "adsb": "1",
        "gnd": "0", "air": "1", "vehicles": "0", "estimated": "1", "maxage": "14400",
        "gliders": "0", "stats": "0"
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(FR24_URL, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            
            planes = []
            for key, val in data.items():
                if key in ["full_count", "version", "stats"]:
                    continue
                # Structure FR24: [icao, lat, lon, heading, alt(ft), speed(kt), squawk, radar, _, type, reg, ts, from, to, flight, _, gnd, callsign]
                if not isinstance(val, list) or len(val) < 18:
                    continue
                
                planes.append({
                    "icao24": val[0],
                    "callsign": str(val[16]).strip() or str(val[17]).strip(), # callsign
                    "origin_country": str(val[10]) if val[10] else "Unknown", # reg ou type
                    "latitude": val[1],
                    "longitude": val[2],
                    "altitude": val[4] * 0.3048, # Pieds -> Mètres
                    "on_ground": val[14] == 1,
                    "velocity": val[5] * 0.514444, # Noeuds -> m/s
                    "heading": val[3],
                })
                
            logger.info("Aviation: %d avions récupérés depuis FR24", len(planes))
            return planes
        except Exception as exc:
            logger.error("FR24 error: %s", exc)
            return []


@router.get("/")
async def get_aviation():
    return await fetch_planes()
