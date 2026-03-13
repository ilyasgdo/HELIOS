import logging
from typing import Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Gère toutes les connexions WebSocket actives."""

    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)
        logger.info(
            "Nouveau client WebSocket. Total: %d", len(self._connections)
        )

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)
        logger.info(
            "Client WebSocket déconnecté. Total: %d", len(self._connections)
        )

    async def broadcast(self, message: dict) -> None:
        """Envoie un message JSON à tous les clients connectés."""
        dead: Set[WebSocket] = set()
        for ws in self._connections.copy():
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        self._connections -= dead


# Instance singleton utilisée dans toute l'application
manager = ConnectionManager()
