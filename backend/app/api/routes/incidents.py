from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from app.db.session import get_db
from app.models.models import Incident

router = APIRouter()


@router.get("")
async def list_incidents(
    limit: int = Query(default=20, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Incident).order_by(desc(Incident.detected_at)).limit(limit)
    if severity:
        q = q.where(Incident.severity == severity)
    if status:
        q = q.where(Incident.status == status)
    result = await db.execute(q)
    return [_s(i) for i in result.scalars().all()]


@router.get("/share/{token}")
async def get_by_token(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.share_token == token))
    i = result.scalar_one_or_none()
    if not i:
        raise HTTPException(status_code=404, detail="Not found")
    return _s(i)


@router.get("/{incident_id}")
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    i = result.scalar_one_or_none()
    if not i:
        raise HTTPException(status_code=404, detail="Not found")
    return _s(i)


@router.patch("/{incident_id}/status")
async def update_status(incident_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    i = result.scalar_one_or_none()
    if not i:
        raise HTTPException(status_code=404, detail="Not found")
    i.status = body.get("status", i.status)
    await db.commit()
    return _s(i)


def _s(i: Incident) -> dict:
    return {
        "id": i.id, "cluster_id": i.cluster_id,
        "incident_type": i.incident_type.value if i.incident_type else None,
        "severity": i.severity.value if i.severity else None,
        "status": i.status.value if i.status else None,
        "title": i.title, "summary": i.summary,
        "causation_graph": i.causation_graph,
        "recommendations": i.recommendations,
        "affected_queries": i.affected_queries,
        "detected_at": i.detected_at.isoformat() if i.detected_at else None,
        "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
        "duration_seconds": i.duration_seconds,
        "share_token": i.share_token,
    }
