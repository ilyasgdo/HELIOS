import logging
from sqlmodel import Session, select
from models.alert import Alert
from db import engine

logger = logging.getLogger(__name__)

SEISMIC_THRESHOLDS = {
    7.0: "CRITICAL",
    6.0: "HIGH",
    5.0: "MEDIUM",
    4.0: "LOW",
}

MARKET_CRASH_THRESHOLD = -3.0

async def process_seismic_events(earthquakes: list, ws_manager) -> list[Alert]:
    """Crée des alertes pour les séismes importants."""
    new_alerts = []
    
    with Session(engine) as session:
        for eq in earthquakes:
            mag = float(eq.get("magnitude", 0))
            if mag < 4.0:
                continue
            
            # Vérifier si déjà alerté via source_url (id unique de l'événement USGS)
            existing = session.exec(
                select(Alert).where(Alert.source_url == eq.get("url"))
            ).first()
            
            if existing:
                continue
            
            # Déterminer le niveau
            level = "LOW"
            for threshold, lvl in sorted(SEISMIC_THRESHOLDS.items(), reverse=True):
                if mag >= threshold:
                    level = lvl
                    break
            
            alert = Alert(
                level=level,
                category="seismic",
                title=f"🔴 Séisme M{mag} — {eq.get('place', 'Unknown')}",
                description=f"Magnitude {mag} à {eq.get('depth', 0)}km de profondeur",
                latitude=eq.get("latitude"),
                longitude=eq.get("longitude"),
                source_url=eq.get("url"),
            )
            session.add(alert)
            session.commit()
            session.refresh(alert)
            
            new_alerts.append(alert)
            logger.info("Alerte Séisme Créée: %s", alert.title)
    
    # Broadcast immédiat
    if new_alerts and ws_manager:
        await ws_manager.broadcast({
            "type": "alerts",
            "data": [a.model_dump() for a in new_alerts]  # model_dump() in SQLModel/Pydantic v2
        })
    
    return new_alerts


async def process_market_crash(markets: list, ws_manager) -> list[Alert]:
    """Alerte si un marché majeur chute de plus de X%."""
    new_alerts = []
    
    with Session(engine) as session:
        for market in markets:
            change = float(market.get("change_pct", 0))
            if change <= MARKET_CRASH_THRESHOLD:
                # Vérifier qu'on a pas déjà alerté CHUTE sur ce symbole récemment (simplifié : on checke le titre exact)
                title = f"📉 Crash marché — {market.get('country')} {change}%"
                
                existing = session.exec(
                    select(Alert).where(Alert.title == title)
                ).first()
                if existing:
                    continue
                
                alert = Alert(
                    level="HIGH",
                    category="market",
                    title=title,
                    description=f"{market.get('symbol')} en baisse de {abs(change)}%",
                    # pas de lat/long pour les marchés
                )
                session.add(alert)
                session.commit()
                session.refresh(alert)
                new_alerts.append(alert)
                logger.warning("Alerte Marché Créée: %s", alert.title)
                
    if new_alerts and ws_manager:
        await ws_manager.broadcast({
            "type": "alerts",
            "data": [a.model_dump() for a in new_alerts]
        })
        
    return new_alerts
