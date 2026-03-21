import logging
import os
import httpx
from fastapi import APIRouter
from scheduler import cache_for

logger = logging.getLogger(__name__)
router = APIRouter()

@cache_for(seconds=300)  # On cache pendant 5 minutes pour préserver le quota Shodan
async def fetch_shodan_cctv() -> list:
    """Récupère une liste de webcams via Shodan search."""
    SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")
    if not SHODAN_API_KEY:
        logger.warning("SHODAN_API_KEY non définie.")
        return []

    results = []
    # Requête cible : webcams courantes (SQ-WEBCAM ou webcamxp)
    query = "Server: SQ-WEBCAM"
    url = f"https://api.shodan.io/shodan/host/search?key={SHODAN_API_KEY}&query={query}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                matches = data.get("matches", [])
                
                for match in matches:
                    location = match.get("location", {})
                    lat = location.get("latitude")
                    lon = location.get("longitude")
                    
                    if lat and lon:
                        results.append({
                            "ip": match.get("ip_str"),
                            "port": match.get("port"),
                            "city": location.get("city") or "Unknown",
                            "country": location.get("country_name") or "Unknown",
                            "latitude": lat,
                            "longitude": lon,
                            "org": match.get("org") or "Unknown"
                        })
            elif resp.status_code in (401, 403):
                logger.error(f"Erreur API Shodan {resp.status_code}: Clé invalide ou nécessite un abonnement (Query Credits épuisés).")
                # Fallback sur des caméras de test pour le démo UI
                return [
                    {"ip": "217.197.102.13", "port": 80, "city": "Toulouse", "country": "France", "latitude": 43.6047, "longitude": 1.4442, "org": "Fallback Demo"},
                    {"ip": "91.132.22.4", "port": 8081, "city": "Paris", "country": "France", "latitude": 48.8566, "longitude": 2.3522, "org": "Fallback Demo"},
                    {"ip": "85.214.241.164", "port": 80, "city": "Berlin", "country": "Germany", "latitude": 52.5200, "longitude": 13.4050, "org": "Fallback Demo"},
                ]
            else:
                logger.error(f"Erreur API Shodan {resp.status_code}: {resp.text}")
                
        except Exception as exc:
            logger.error("Shodan fetch error: %s", exc)

    logger.info("Shodan CCTV: %d caméras géolocalisées trouvées.", len(results))
    return results

@router.get("/")
async def get_cctv():
    return await fetch_shodan_cctv()
