from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.db.session import get_db
from app.models.models import ClusterConfig, Incident, TabletSnapshot, IncidentStatus, QueryFingerprint
from app.core.config import settings
from datetime import datetime, timezone
import random

router = APIRouter()


@router.get("/config")
async def get_config(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClusterConfig).where(ClusterConfig.is_active == True).limit(1))
    cluster = result.scalar_one_or_none()
    if not cluster:
        return {"id": None, "name": "No cluster connected", "is_demo": settings.DEMO_MODE}
    return {
        "id": cluster.id, "name": cluster.name,
        "vtgate_host": cluster.vtgate_host, "vtgate_port": cluster.vtgate_port,
        "is_demo": cluster.is_demo, "is_active": cluster.is_active,
        "created_at": cluster.created_at.isoformat() if cluster.created_at else None,
    }


@router.get("/health")
async def get_health(db: AsyncSession = Depends(get_db)):
    tablets_result = await db.execute(select(TabletSnapshot).order_by(desc(TabletSnapshot.snapshot_at)).limit(20))
    all_snaps = tablets_result.scalars().all()
    seen = {}
    for t in all_snaps:
        if t.tablet_alias not in seen:
            seen[t.tablet_alias] = t
    tablets = list(seen.values())
    healthy_count = sum(1 for t in tablets if t.is_healthy)
    total_count = len(tablets)
    max_lag = max((t.replication_lag_seconds or 0 for t in tablets), default=0)
    inc_result = await db.execute(select(func.count()).where(Incident.status == IncidentStatus.ACTIVE))
    active_incidents = inc_result.scalar() or 0
    score = 100
    if total_count > 0:
        score -= int(((total_count - healthy_count) / total_count) * 40)
    if max_lag > 30:
        score -= 20
    elif max_lag > 10:
        score -= 10
    score -= min(active_incidents * 15, 40)
    score = max(score, 0)
    qfp_result = await db.execute(select(QueryFingerprint))
    fps = qfp_result.scalars().all()
    scatter_fps = [f for f in fps if f.is_scatter]
    scatter_rate = len(scatter_fps) / max(len(fps), 1)
    return {
        "overall_score": score,
        "vtgate_healthy": active_incidents == 0,
        "scatter_query_rate": round(scatter_rate, 3),
        "tablets_healthy": healthy_count,
        "tablets_total": total_count,
        "max_replication_lag_s": round(max_lag, 1),
        "active_incidents": active_incidents,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/connect")
async def connect_cluster(body: dict, db: AsyncSession = Depends(get_db)):
    cluster = ClusterConfig(
        name=body.get("name", "My Vitess Cluster"),
        vtgate_host=body.get("vtgate_host", "localhost"),
        vtgate_port=body.get("vtgate_port", 15001),
        is_demo=False, is_active=True,
    )
    db.add(cluster)
    await db.commit()
    return {"id": cluster.id, "name": cluster.name, "message": "Cluster connected"}


@router.get("/metrics")
async def get_metrics(component: str = "vtgate", metric: str = "qps", minutes: int = 60):
    rng = random.Random(42)
    now = datetime.now(timezone.utc)
    from datetime import timedelta
    base = {"qps": 280, "latency_p99_ms": 18, "scatter_ratio": 0.04, "replication_lag_s": 0.3, "cpu_pct": 42}.get(metric, 100)
    points = []
    for i in range(minutes * 2):
        t = now - timedelta(seconds=(minutes * 60) - i * 30)
        noise = rng.uniform(-base * 0.1, base * 0.1)
        points.append({"time": t.isoformat(), "value": round(base + noise, 2)})
    return {"name": metric, "component": component, "points": points}
