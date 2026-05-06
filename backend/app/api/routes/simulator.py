from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services.collector.simulator import get_scenarios, inject_incident, reset_simulated_incidents

router = APIRouter()


class InjectRequest(BaseModel):
    scenario: str
    intensity: int = Field(default=5, ge=1, le=10)
    target_shard: Optional[str] = None


@router.get("/scenarios")
async def list_scenarios():
    return await get_scenarios()


@router.post("/inject")
async def inject(req: InjectRequest):
    try:
        return await inject_incident(req.scenario, req.intensity, req.target_shard)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset")
async def reset():
    return await reset_simulated_incidents()
