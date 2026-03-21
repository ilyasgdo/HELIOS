import logging
import os

import httpx
from fastapi import APIRouter
from scheduler import cache_for

logger = logging.getLogger(__name__)
router = APIRouter()

NEWSDATA_URL = "https://newsdata.io/api/1/news"
API_KEY = os.getenv("NEWSDATA_API_KEY", "")


@cache_for(240)
async def fetch_latest_news() -> list:
    """Récupère les dernières actualités mondiales via NewsData.io (ou utilise des mocks si pas de clé)."""
    if not API_KEY:
        logger.warning("NEWSDATA_API_KEY non défini, impossible de récupérer les news.")
        return []

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                NEWSDATA_URL,
                params={
                    "apikey": API_KEY,
                    "language": "en,fr",
                    "category": "world,politics,business",
                    "size": 20,
                },
            )
            resp.raise_for_status()
            articles = resp.json().get("results") or []
            
            if not articles:
                return []
                
            result = [
                {
                    "title": a.get("title", ""),
                    "source": a.get("source_id", ""),
                    "country": (a.get("country") or [None])[0] or _fallback_country(a.get("title", "")),
                    "pubDate": a.get("pubDate", ""),
                    "link": a.get("link", ""),
                    "description": a.get("description") or "",
                }
                for a in articles
                if a.get("title")
            ]
            logger.info("News: %d articles récupérés en temps réel", len(result))
            return result
        except Exception as exc:
            logger.error("NewsData error: %s", exc)
            return []

def _fallback_country(title: str) -> str:
    tl = title.lower()
    if "ukraine" in tl or "kyiv" in tl: return "ukraine"
    if "israel" in tl or "gaza" in tl: return "israel"
    if "china" in tl or "beijing" in tl: return "china"
    if "us " in tl or "biden" in tl: return "united states of america"
    if "france" in tl or "macron" in tl: return "france"
    return "united states of america"

@router.get("/latest")
async def get_news():
    return await fetch_latest_news()
