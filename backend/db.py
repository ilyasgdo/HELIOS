import logging
import os
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, create_engine, Session, select

# Imports des modèles pour enregistrement SQLAlchemy Base
import models.alert

logger = logging.getLogger(__name__)

DATABASE_URL = f"sqlite:///{os.getenv('DATABASE_URL', './helios.db')}"
engine = create_engine(DATABASE_URL, echo=False)


class CachedResponse(SQLModel, table=True):
    """Cache générique pour les réponses API externes."""

    id: Optional[int] = Field(default=None, primary_key=True)
    source: str = Field(index=True)
    data: str  # JSON sérialisé
    fetched_at: datetime = Field(default_factory=datetime.utcnow)


def init_db() -> None:
    """Crée les tables si elles n'existent pas."""
    SQLModel.metadata.create_all(engine)
    logger.info("Base de données initialisée.")


def get_session() -> Session:
    with Session(engine) as session:
        yield session
