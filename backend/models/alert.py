from datetime import datetime
from typing import Literal, Optional

from sqlmodel import Field, SQLModel

AlertLevel = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
AlertCategory = Literal["seismic", "weather", "market", "conflict", "news"]

class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    level: str
    category: str
    title: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False
