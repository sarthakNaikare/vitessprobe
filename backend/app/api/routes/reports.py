from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.models import Incident, RCAReport

router = APIRouter()


class GenerateRequest(BaseModel):
    incident_id: str
    audience: str = "technical"


@router.post("/generate")
async def generate_report(req: GenerateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == req.incident_id))
    i = result.scalar_one_or_none()
    if not i:
        raise HTTPException(status_code=404, detail="Incident not found")
    graph = i.causation_graph or {}
    nodes = graph.get("nodes", [])
    root_id = graph.get("root_cause_node_id")
    root = next((n for n in nodes if n.get("id") == root_id), None)
    root_cause_text = (
        f"Root cause identified with {int(root.get('confidence', 0) * 100)}% confidence: "
        f"{root.get('description', '')} on component {root.get('component', '')}."
        if root else "Root cause analysis pending."
    )
    report = RCAReport(
        id=str(uuid.uuid4()),
        incident_id=i.id,
        audience=req.audience,
        title=f"RCA Report: {i.title}",
        executive_summary=(
            f"On {i.detected_at.strftime('%Y-%m-%d at %H:%M UTC') if i.detected_at else 'unknown date'}, "
            f"VitessProbe detected a {i.severity.value if i.severity else 'unknown'}-severity incident: {i.title}. {i.summary or ''}"
        ),
        root_cause_explanation=root_cause_text,
        recommendations=i.recommendations or [],
        playbook_steps=[
            {"step": idx + 1, "title": r.get("title", ""), "description": r.get("description", ""),
             "command": r.get("vitess_command")}
            for idx, r in enumerate(i.recommendations or [])
        ],
        affected_systems=["vtgate", "vttablet", "mysql"],
        share_token=uuid.uuid4().hex[:12],
        generated_at=datetime.now(timezone.utc),
    )
    db.add(report)
    await db.commit()
    return _s(report, i)


@router.get("/share/{token}")
async def get_by_token(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RCAReport).where(RCAReport.share_token == token))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    i = await db.get(Incident, r.incident_id)
    return _s(r, i)


@router.get("/{report_id}")
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    r = await db.get(RCAReport, report_id)
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    i = await db.get(Incident, r.incident_id)
    return _s(r, i)


def _s(r, i):
    return {
        "id": r.id, "incident_id": r.incident_id, "audience": r.audience,
        "title": r.title, "executive_summary": r.executive_summary,
        "root_cause_explanation": r.root_cause_explanation,
        "recommendations": r.recommendations, "playbook_steps": r.playbook_steps,
        "affected_systems": r.affected_systems, "share_token": r.share_token,
        "generated_at": r.generated_at.isoformat() if r.generated_at else None,
        "incident": {"title": i.title, "severity": i.severity.value if i and i.severity else None} if i else None,
    }
