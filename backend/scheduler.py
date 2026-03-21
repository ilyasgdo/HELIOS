import logging
import time
from functools import wraps

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

# Cache mémoire simple : {clé: (données, timestamp)}
_mem_cache: dict[str, tuple] = {}


def cache_for(seconds: int):
    """Décorateur async : cache le résultat pour N secondes."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"{func.__module__}.{func.__name__}"
            if key in _mem_cache:
                result, ts = _mem_cache[key]
                if time.monotonic() - ts < seconds:
                    return result
            result = await func(*args, **kwargs)
            _mem_cache[key] = (result, time.monotonic())
            return result
        return wrapper
    return decorator


class HeliosScheduler:
    def __init__(self, ws_manager) -> None:
        self.ws = ws_manager
        self.scheduler = AsyncIOScheduler(timezone="UTC")

    def start(self) -> None:
        # Avions — toutes les 30s
        self.scheduler.add_job(
            self._broadcast_aviation,
            IntervalTrigger(seconds=30),
            id="aviation",
            max_instances=1,
            replace_existing=True,
        )
        # News — toutes les 5min
        self.scheduler.add_job(
            self._broadcast_news,
            IntervalTrigger(minutes=5),
            id="news",
            max_instances=1,
            replace_existing=True,
        )
        # Finance — toutes les 2min
        self.scheduler.add_job(
            self._broadcast_finance,
            IntervalTrigger(minutes=2),
            id="finance",
            max_instances=1,
            replace_existing=True,
        )
        # Séismes — toutes les 60s
        self.scheduler.add_job(
            self._broadcast_seismic,
            IntervalTrigger(seconds=60),
            id="seismic",
            max_instances=1,
            replace_existing=True,
        )
        # Shodan CCTV — toutes les 10 minutes (API lente/limitée)
        self.scheduler.add_job(
            self._broadcast_cctv,
            IntervalTrigger(minutes=10),
            id="shodan_cctv",
            max_instances=1,
            replace_existing=True,
        )
        self.scheduler.start()
        logger.info("Scheduler HELIOS démarré.")

    async def _broadcast_cctv(self) -> None:
        try:
            from routes.shodan import fetch_shodan_cctv
            data = await fetch_shodan_cctv()
            await self.ws.broadcast({"type": "cctv", "data": data})
        except Exception as exc:
            logger.error("Scheduler cctv error: %s", exc)

    async def _broadcast_aviation(self) -> None:
        try:
            from routes.aviation import fetch_planes
            data = await fetch_planes()
            await self.ws.broadcast({"type": "aviation", "data": data})
        except Exception as exc:
            logger.error("Scheduler aviation error: %s", exc)

    async def _broadcast_news(self) -> None:
        try:
            from routes.news import fetch_latest_news
            data = await fetch_latest_news()
            await self.ws.broadcast({"type": "news", "data": data})
        except Exception as exc:
            logger.error("Scheduler news error: %s", exc)

    async def _broadcast_finance(self) -> None:
        try:
            from routes.finance import fetch_global_markets
            from services.alert_engine import process_market_crash
            data = await fetch_global_markets()
            await self.ws.broadcast({"type": "finance", "data": data})
            
            # Détection d'alertes financières
            await process_market_crash(data, self.ws)
        except Exception as exc:
            logger.error("Scheduler finance error: %s", exc)

    async def _broadcast_seismic(self) -> None:
        try:
            from routes.weather import fetch_earthquakes
            from services.alert_engine import process_seismic_events
            data = await fetch_earthquakes()
            await self.ws.broadcast({"type": "seismic", "data": data})
            
            # Détection d'alertes sismiques
            await process_seismic_events(data, self.ws)
        except Exception as exc:
            logger.error("Scheduler seismic error: %s", exc)
