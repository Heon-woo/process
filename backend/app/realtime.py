import json

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: list[WebSocket] = []

    @property
    def count(self) -> int:
        return len(self.connections)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.append(websocket)
        await self.broadcast({"type": "presence", "count": self.count})

    async def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.connections:
            self.connections.remove(websocket)
        await self.broadcast({"type": "presence", "count": self.count})

    async def broadcast(self, message: dict) -> None:
        payload = json.dumps(message, ensure_ascii=False)
        disconnected = []
        for connection in self.connections:
            try:
                await connection.send_text(payload)
            except RuntimeError:
                disconnected.append(connection)
        for connection in disconnected:
            if connection in self.connections:
                self.connections.remove(connection)


pas_connections = ConnectionManager()

