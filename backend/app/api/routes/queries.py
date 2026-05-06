from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.models.models import QueryFingerprint

router = APIRouter()


@router.get("")
async def list_queries(
    scatter_only: bool = Query(default=False),
    sort_by: str = Query(default="count"),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(QueryFingerprint)
    if scatter_only:
        q = q.where(QueryFingerprint.is_scatter == True)
    sort_col = {
        "count": desc(QueryFingerprint.count),
        "scatter_ratio": desc(QueryFingerprint.scatter_ratio),
        "latency_p99": desc(QueryFingerprint.latency_p99_ms),
    }.get(sort_by, desc(QueryFingerprint.count))
    result = await db.execute(q.order_by(sort_col).limit(limit))
    return [_s(fp) for fp in result.scalars().all()]


@router.get("/stats")
async def query_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(QueryFingerprint))
    all_fp = result.scalars().all()
    scatter = [f for f in all_fp if f.is_scatter]
    return {
        "total_fingerprints": len(all_fp),
        "scatter_fingerprints": len(scatter),
        "scatter_pct": round(len(scatter) / max(len(all_fp), 1) * 100, 1),
        "total_query_count": sum(f.count or 0 for f in all_fp),
        "avg_p99_ms": round(sum(f.latency_p99_ms or 0 for f in all_fp) / max(len(all_fp), 1), 1),
    }


@router.post("/analyze")
async def analyze_query(body: dict):
    query = body.get("query", "")
    has_where = "WHERE" in query.upper()
    has_vindex = any(k in query.upper() for k in ["WHERE ID", "= :ID", "= :CUSTOMER_ID"])
    risk = 0.9 if not has_where else (0.2 if has_vindex else 0.6)
    return {
        "query": query,
        "scatter_risk": risk,
        "scatter_risk_label": "high" if risk > 0.7 else "medium" if risk > 0.4 else "low",
        "explanation": "No WHERE clause — scatters to all shards" if not has_where
                       else "Likely single-shard route" if has_vindex
                       else "No vindex column detected — may scatter",
    }


def _s(fp: QueryFingerprint) -> dict:
    return {
        "id": fp.id,
        "fingerprint_hash": fp.fingerprint_hash,
        "query_pattern": fp.query_pattern,
        "keyspace": fp.keyspace,
        "table_names": fp.table_names,
        "shard_count_routed": fp.shard_count_routed,
        "total_shards": fp.total_shards,
        "is_scatter": fp.is_scatter,
        "scatter_ratio": fp.scatter_ratio,
        "count": fp.count,
        "latency_p50_ms": fp.latency_p50_ms,
        "latency_p99_ms": fp.latency_p99_ms,
        "plan_type": fp.plan_type,
        "captured_at": fp.captured_at.isoformat() if fp.captured_at else None,
    }
