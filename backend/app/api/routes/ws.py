from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from datetime import datetime, timezone
from typing import List

router = APIRouter()

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()


@router.websocket("/live")
async def live_feed(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.send_text(json.dumps({
                "type": "ping",
                "time": datetime.now(timezone.utc).isoformat()
            }))
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(ws)


async def broadcast_incident(incident_data: dict):
    """Call this from simulator when a new incident is created."""
    await manager.broadcast({
        "type": "incident.new",
        "data": incident_data,
    })
