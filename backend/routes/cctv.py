"""
CCTV Route — Liste les caméras publiques et proxy les streams live.
Source : OpenTrafficCamMap (GitHub) — 7500+ caméras trafic USA.
"""
import json
import logging
import os
import math
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# Dataset GeoJSON des caméras trafic (hébergé sur GitHub)
CAMERAS_URL = (
    "https://raw.githubusercontent.com/"
    "ubergesundheit/opendata-cams/master/cameras.geojson"
)

# Cache mémoire des caméras (chargé une seule fois)
_cameras_cache: list | None = None


async def _load_cameras() -> list:
    global _cameras_cache
    if _cameras_cache is not None:
        return _cameras_cache

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(CAMERAS_URL)
            resp.raise_for_status()
            features = resp.json().get("features", [])

        cameras = []
        for idx, f in enumerate(features):
            try:
                coords = f["geometry"]["coordinates"]
                props = f.get("properties", {})
                url = (
                    props.get("url")
                    or props.get("streamUrl")
                    or props.get("stream_url")
                    or ""
                )
                if not url or not url.startswith("http"):
                    continue
                cameras.append({
                    "id": str(idx),
                    "name": props.get("name", f"CCTV #{idx}"),
                    "city": props.get("city") or props.get("location", ""),
                    "state": props.get("state", ""),
                    "country": props.get("country", "US"),
                    "longitude": float(coords[0]),
                    "latitude": float(coords[1]),
                    "stream_url": url,
                    "type": props.get("type", "traffic"),
                })
            except (KeyError, TypeError, ValueError):
                continue

        _cameras_cache = cameras
        logger.info("CCTV: %d caméras chargées", len(cameras))
        return cameras

    except Exception as exc:
        logger.error("CCTV load error: %s", exc)
        # Retourner quelques caméras de démonstration si le dataset échoue
        return _demo_cameras()


def _demo_cameras() -> list:
    """Caméras de démonstration (URLs HLS publiques connues)."""
    return [
        {
            "id": "demo_1",
            "name": "Times Square — New York",
            "city": "New York",
            "state": "NY",
            "country": "US",
            "longitude": -73.9855,
            "latitude": 40.7580,
            "stream_url": "https://cdn.earthcam.com/stream/timessquare",
            "type": "landmark",
        },
        {
            "id": "demo_2",
            "name": "Hollywood Boulevard",
            "city": "Los Angeles",
            "state": "CA",
            "country": "US",
            "longitude": -118.3363,
            "latitude": 34.1016,
            "stream_url": "https://cdn.earthcam.com/stream/hollywoodboulevard",
            "type": "landmark",
        },
        {
            "id": "demo_3",
            "name": "Chicago River",
            "city": "Chicago",
            "state": "IL",
            "country": "US",
            "longitude": -87.6265,
            "latitude": 41.8888,
            "stream_url": "https://cdn.earthcam.com/stream/chicagoriver",
            "type": "traffic",
        },
    ]


@router.get("/cameras")
async def list_cameras(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius_km: float = 500.0,
    limit: int = 300,
):
    """
    Liste les caméras publiques disponibles.
    Filtre par rayon géographique si lat/lon fournis.
    """
    cameras = await _load_cameras()

    if lat is not None and lon is not None:
        def haversine(cam) -> float:
            dlat = math.radians(cam["latitude"] - lat)
            dlon = math.radians(cam["longitude"] - lon)
            a = (
                math.sin(dlat / 2) ** 2
                + math.cos(math.radians(lat))
                * math.cos(math.radians(cam["latitude"]))
                * math.sin(dlon / 2) ** 2
            )
            return 6371 * 2 * math.asin(math.sqrt(a))

        cameras = [c for c in cameras if haversine(c) <= radius_km]

    return cameras[:limit]


@router.get("/stream/{camera_id}")
async def proxy_stream(camera_id: str):
    """
    Proxy le flux vidéo pour éviter les problèmes CORS côté frontend.
    Le frontend n'a jamais accès à l'URL directe de la caméra.
    """
    cameras = await _load_cameras()
    cam = next((c for c in cameras if c["id"] == camera_id), None)

    if not cam:
        raise HTTPException(status_code=404, detail="Caméra introuvable")

    stream_url = cam["stream_url"]

    async def generator():
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(connect=5.0, read=30.0, write=10.0, pool=5.0),
                follow_redirects=True,
            ) as client:
                async with client.stream(
                    "GET",
                    stream_url,
                    headers={"User-Agent": "HELIOS/1.0"},
                ) as resp:
                    async for chunk in resp.aiter_bytes(chunk_size=8192):
                        yield chunk
        except Exception as exc:
            logger.error("Proxy stream error (cam %s): %s", camera_id, exc)

    # Déterminer le content-type
    content_type = "application/x-mpegURL"
    if ".mjpg" in stream_url.lower() or ".mjpeg" in stream_url.lower():
        content_type = "multipart/x-mixed-replace; boundary=--myboundary"

    return StreamingResponse(generator(), media_type=content_type)
