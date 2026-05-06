from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.models.models import TabletSnapshot

router = APIRouter()


@router.get("")
async def list_tablets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TabletSnapshot).order_by(desc(TabletSnapshot.snapshot_at)).limit(50))
    seen = {}
    for t in result.scalars().all():
        if t.tablet_alias not in seen:
            seen[t.tablet_alias] = _s(t)
    return list(seen.values())


@router.get("/{alias}/history")
async def get_history(alias: str, minutes: int = Query(default=60), db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timedelta, timezone
    since = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    result = await db.execute(
        select(TabletSnapshot)
        .where(TabletSnapshot.tablet_alias == alias)
        .where(TabletSnapshot.snapshot_at >= since)
        .order_by(desc(TabletSnapshot.snapshot_at)).limit(200)
    )
    return [_s(t) for t in result.scalars().all()]


@router.get("/{alias}")
async def get_tablet(alias: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TabletSnapshot).where(TabletSnapshot.tablet_alias == alias)
        .order_by(desc(TabletSnapshot.snapshot_at)).limit(1)
    )
    t = result.scalar_one_or_none()
    return _s(t) if t else {"error": "Not found"}


def _s(t: TabletSnapshot) -> dict:
    return {
        "id": t.id, "tablet_alias": t.tablet_alias,
        "keyspace": t.keyspace, "shard": t.shard,
        "tablet_type": t.tablet_type.value if t.tablet_type else None,
        "is_healthy": t.is_healthy,
        "replication_lag_seconds": t.replication_lag_seconds,
        "connection_pool_used": t.connection_pool_used,
        "connection_pool_size": t.connection_pool_size,
        "connection_pool_pct": round((t.connection_pool_used or 0) / max(t.connection_pool_size or 1, 1) * 100, 1),
        "qps": t.qps, "query_kill_count": t.query_kill_count,
        "snapshot_at": t.snapshot_at.isoformat() if t.snapshot_at else None,
    }
