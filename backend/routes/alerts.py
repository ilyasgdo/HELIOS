import logging
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List

from db import get_session
from models.alert import Alert

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[Alert])
async def get_alerts(limit: int = 50, session: Session = Depends(get_session)):
    """Récupère l'historique des récentes alertes depuis la base SQLite."""
    try:
        alerts = session.exec(
            select(Alert).order_by(Alert.created_at.desc()).limit(limit)
        ).all()
        return alerts
    except Exception as exc:
        logger.error("Erreur lors de la récupération des alertes: %s", exc)
        return []

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, session: Session = Depends(get_session)):
    """Marque une alerte comme lue."""
    alert = session.get(Alert, alert_id)
    if alert:
        alert.acknowledged = True
        session.add(alert)
        session.commit()
        return {"status": "ok", "id": alert_id}
    return {"error": "Alerte non trouvée"}
