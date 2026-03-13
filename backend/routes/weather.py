import logging
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter
from scheduler import cache_for

logger = logging.getLogger(__name__)
router = APIRouter()

USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"


@cache_for(55)
async def fetch_earthquakes(min_magnitude: float = 4.0) -> list:
    """Séismes des dernières 24h avec magnitude >= min_magnitude depuis USGS."""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=24)

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            resp = await client.get(
                USGS_URL,
                params={
                    "format": "geojson",
                    "starttime": start_time.isoformat() + "Z",
                    "endtime": end_time.isoformat() + "Z",
                    "minmagnitude": min_magnitude,
                    "orderby": "magnitude",
                    "limit": 100,
                },
            )
            resp.raise_for_status()
            features = resp.json().get("features") or []
            result = [
                {
                    "id": f["id"],
                    "magnitude": f["properties"]["mag"],
                    "place": f["properties"]["place"],
                    "time": f["properties"]["time"],
                    "longitude": f["geometry"]["coordinates"][0],
                    "latitude": f["geometry"]["coordinates"][1],
                    "depth": f["geometry"]["coordinates"][2],
                    "url": f["properties"]["url"],
                }
                for f in features
                if f["properties"].get("mag") is not None
            ]
            logger.info("Seismic: %d séismes récupérés", len(result))
            return result
        except Exception as exc:
            logger.error("USGS error: %s", exc)
            return []


@router.get("/earthquakes")
async def get_earthquakes():
    return await fetch_earthquakes()
