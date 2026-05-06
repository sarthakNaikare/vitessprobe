import uuid
from datetime import datetime, timedelta, timezone
from random import Random
from typing import Optional
import structlog
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.models.models import Incident, IncidentEvent, IncidentType, IncidentSeverity, IncidentStatus

log = structlog.get_logger()
DEMO_CLUSTER_ID = "demo-cluster-001"

SCENARIOS = {
    "tablet_failover":           {"name": "VTTablet Primary Failover",    "description": "OOM-kills a shard primary. VTOrc detects and promotes replica.",                          "icon": "💥", "type": IncidentType.TABLET_FAILOVER},
    "scatter_storm":             {"name": "Scatter Query Storm",           "description": "A query without a vindex floods all shards. P99 latency spikes.",                         "icon": "🌪️", "type": IncidentType.SCATTER_STORM},
    "replication_lag_spike":     {"name": "Replication Lag Spike",        "description": "Large Online DDL causes replica to fall behind. VTGate removes it from read pool.",       "icon": "⏱️", "type": IncidentType.REPLICATION_LAG},
    "online_ddl_stall":          {"name": "Online DDL Stall",             "description": "Migration stalls mid-way. Ghost table partially populated, cut-over keeps failing.",      "icon": "🧱", "type": IncidentType.ONLINE_DDL_STALL},
    "connection_pool_exhaustion":{"name": "Connection Pool Exhaustion",   "description": "VTTablet connection pool fills up. Queries queue then time out.",                         "icon": "🔒", "type": IncidentType.CONNECTION_POOL_EXHAUSTION},
    "vtgate_overload":           {"name": "VTGate CPU Overload",          "description": "VTGate CPU saturated by complex cross-shard JOINs. Routing latency spikes to 800ms+.",   "icon": "🔥", "type": IncidentType.VTGATE_OVERLOAD},
}


async def get_scenarios():
    return [{"id": sid, "name": s["name"], "description": s["description"], "icon": s["icon"]} for sid, s in SCENARIOS.items()]


async def inject_incident(scenario: str, intensity: int = 5, target_shard: Optional[str] = None) -> dict:
    if scenario not in SCENARIOS:
        raise ValueError(f"Unknown scenario: {scenario}")
    rng = Random()
    sc = SCENARIOS[scenario]
    incident_id = f"sim-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    shard = target_shard or "-40"
    severity = (IncidentSeverity.CRITICAL if intensity >= 8 else
                IncidentSeverity.HIGH     if intensity >= 6 else
                IncidentSeverity.MEDIUM   if intensity >= 4 else
                IncidentSeverity.LOW)
    p99 = 200 + intensity * 220
    scatter_pct = min(70 + intensity * 3, 99)
    lag_s = 10 + intensity * 4
    events = []
    if scenario == "scatter_storm":
        events = [
            {"component": "application", "event_type": "deploy",        "description": "New query pattern deployed without vindex",                     "metric_name": None, "metric_value": None,        "offset": 0,  "conf": 0.95},
            {"component": "vtgate",      "event_type": "scatter_spike", "description": f"Scatter rate jumped to {scatter_pct}%",                       "metric_name": "vtgate_scatter_query_ratio", "metric_value": scatter_pct/100, "offset": 30, "conf": 0.98},
            {"component": "vtgate",      "event_type": "latency_spike", "description": f"P99 latency reached {p99}ms",                                 "metric_name": "vtgate_query_latency_p99_ms", "metric_value": float(p99), "offset": 60, "conf": 0.99},
        ]
        graph = {
            "root_cause_node_id": "node-deploy",
            "nodes": [
                {"id": "node-deploy",  "component": "application", "event_type": "deploy",        "description": "Query deployed without vindex", "is_root_cause": True,  "confidence": 0.95, "occurred_at": now.isoformat()},
                {"id": "node-scatter", "component": "vtgate",      "event_type": "scatter_storm", "description": f"All queries scatter — {scatter_pct}% scatter rate", "is_root_cause": False, "confidence": 0.98, "occurred_at": (now + timedelta(seconds=30)).isoformat()},
                {"id": "node-lat",     "component": "vtgate",      "event_type": "latency_spike", "description": f"P99 latency: {p99}ms", "is_root_cause": False, "confidence": 0.99, "occurred_at": (now + timedelta(seconds=60)).isoformat()},
            ],
            "edges": [
                {"source": "node-deploy",  "target": "node-scatter", "relationship": "caused_by", "confidence": 0.95},
                {"source": "node-scatter", "target": "node-lat",     "relationship": "amplified",  "confidence": 0.91},
            ],
        }
        recs = [{"priority": "immediate", "title": "Add lookup vindex on queried column", "description": "Apply VSchema change.", "action": "vtctldclient ApplyVSchema", "vitess_command": "vtctldclient ApplyVSchema --vschema '{...}' commerce"}]
        title = f"[Simulated] Scatter Query Storm at intensity {intensity}/10"
        summary = f"Synthetic scatter storm. Scatter rate: {scatter_pct}%. P99: {p99}ms."
    elif scenario == "tablet_failover":
        events = [
            {"component": f"vttablet-zone1-0000000100", "event_type": "oom_kill",          "description": f"OOM kill — memory at {90+intensity}% of limit", "metric_name": "vttablet_memory_bytes", "metric_value": 8053063680.0, "offset": 0,  "conf": 1.0},
            {"component": "vtgate",                     "event_type": "health_check_fail", "description": "3 consecutive health check failures",             "metric_name": "vtgate_healthcheck_errors", "metric_value": 3.0, "offset": 8,  "conf": 1.0},
            {"component": f"vttablet-zone1-0000000101", "event_type": "promoted_to_primary","description": "Replica promoted to primary",                    "metric_name": "vttablet_tablet_type",  "metric_value": 1.0, "offset": 22, "conf": 1.0},
        ]
        graph = {
            "root_cause_node_id": "node-oom",
            "nodes": [
                {"id": "node-oom",   "component": "vttablet-zone1-0000000100", "event_type": "oom_kill",   "description": f"OOM kill on shard {shard} primary", "is_root_cause": True,  "confidence": 1.0, "occurred_at": now.isoformat()},
                {"id": "node-promo", "component": "vttablet-zone1-0000000101", "event_type": "promotion",  "description": "Replica promoted to primary",         "is_root_cause": False, "confidence": 1.0, "occurred_at": (now + timedelta(seconds=22)).isoformat()},
            ],
            "edges": [{"source": "node-oom", "target": "node-promo", "relationship": "caused_by", "confidence": 1.0}],
        }
        recs = [{"priority": "immediate", "title": "Increase VTTablet memory limit", "description": "Raise from 8GB to 16GB.", "action": "Update Kubernetes resource limits", "vitess_command": None}]
        title = f"[Simulated] VTTablet Failover — shard {shard} at intensity {intensity}/10"
        summary = f"Synthetic OOM-kill on shard {shard} primary."
    else:
        events = [
            {"component": "vttablet-zone1-0000000301", "event_type": "lag_rising", "description": f"Replica lag: {lag_s}s and rising", "metric_name": "vttablet_replica_lag_seconds", "metric_value": float(lag_s), "offset": 300, "conf": 0.99},
        ]
        graph = {
            "root_cause_node_id": "node-ddl",
            "nodes": [
                {"id": "node-ddl", "component": "vttablet-zone1-0000000300", "event_type": "online_ddl",      "description": "Large Online DDL generating heavy binlog", "is_root_cause": True,  "confidence": 0.99, "occurred_at": now.isoformat()},
                {"id": "node-lag", "component": "vttablet-zone1-0000000301", "event_type": "replication_lag", "description": f"Replica lag: {lag_s}s",                   "is_root_cause": False, "confidence": 0.99, "occurred_at": (now + timedelta(seconds=300)).isoformat()},
            ],
            "edges": [{"source": "node-ddl", "target": "node-lag", "relationship": "caused_by", "confidence": 0.97}],
        }
        recs = [{"priority": "immediate", "title": "Throttle Online DDL", "description": "Reduce throttle ratio.", "action": "vtctldclient UpdateThrottlerConfig", "vitess_command": "vtctldclient UpdateThrottlerConfig --enable --threshold=0.3 commerce"}]
        title = f"[Simulated] {sc['name']} at intensity {intensity}/10"
        summary = f"Synthetic {scenario} injected."

    async with AsyncSessionLocal() as db:
        incident = Incident(
            id=incident_id, cluster_id=DEMO_CLUSTER_ID,
            incident_type=sc["type"], severity=severity, status=IncidentStatus.ACTIVE,
            title=title, summary=summary, causation_graph=graph, recommendations=recs,
            affected_queries=[], evidence={"source": "simulator", "intensity": intensity},
            detected_at=now, share_token=f"sim{uuid.uuid4().hex[:10]}",
        )
        db.add(incident)
        await db.flush()
        for ev in events:
            db.add(IncidentEvent(
                id=str(uuid.uuid4()), incident_id=incident_id,
                component=ev["component"], event_type=ev["event_type"],
                description=ev["description"], metric_name=ev.get("metric_name"),
                metric_value=ev.get("metric_value"),
                occurred_at=now + timedelta(seconds=ev["offset"]),
                confidence=ev["conf"], raw_data={"simulator": True},
            ))
        await db.commit()
    log.info("simulator.injected", scenario=scenario, incident_id=incident_id)
    await broadcast_new_incident(incident_id, title)
    return {"incident_id": incident_id, "message": f"Injected {scenario} at intensity {intensity}/10"}


async def reset_simulated_incidents() -> dict:
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("DELETE FROM incidents WHERE id LIKE 'sim-%' RETURNING id"))
        deleted = result.rowcount
        await db.commit()
    return {"deleted": deleted, "message": f"Removed {deleted} simulated incidents"}


async def broadcast_new_incident(incident_id: str, title: str):
    """Broadcast to all WebSocket clients after injection."""
    try:
        from app.api.routes.ws import manager
        await manager.broadcast({
            "type": "incident.new",
            "data": {"id": incident_id, "title": title}
        })
    except Exception:
        pass
