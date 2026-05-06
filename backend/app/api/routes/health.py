from fastapi import APIRouter
from datetime import datetime, timezone
router = APIRouter()

@router.get("/ping")
async def ping():
    return {"status": "ok", "service": "vitessprobe-api", "time": datetime.now(timezone.utc).isoformat()}
