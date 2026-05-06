import uuid
from datetime import datetime, timedelta, timezone
from random import Random
import structlog
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.models.models import (
    ClusterConfig, Incident, IncidentEvent, IncidentType,
    IncidentSeverity, IncidentStatus, TabletSnapshot, TabletType, QueryFingerprint,
)

log = structlog.get_logger()
rng = Random(42)
DEMO_CLUSTER_ID = "demo-cluster-001"

TABLETS = [
    {"alias": "zone1-0000000100", "shard": "-40",   "type": TabletType.PRIMARY},
    {"alias": "zone1-0000000101", "shard": "-40",   "type": TabletType.REPLICA},
    {"alias": "zone1-0000000200", "shard": "40-80", "type": TabletType.PRIMARY},
    {"alias": "zone1-0000000201", "shard": "40-80", "type": TabletType.REPLICA},
    {"alias": "zone1-0000000300", "shard": "80-",   "type": TabletType.PRIMARY},
    {"alias": "zone1-0000000301", "shard": "80-",   "type": TabletType.REPLICA},
]

DEMO_QUERIES = [
    {"hash": "hash0001", "pattern": "SELECT id, customer_id, total FROM orders WHERE customer_id = :customer_id", "tables": ["orders"], "shards": 1, "plan": "SelectEqualUnique", "count": 48291, "p50": 3.2,   "p99": 18.4},
    {"hash": "hash0002", "pattern": "SELECT * FROM order_items WHERE customer_id = :customer_id",                 "tables": ["order_items"], "shards": 3, "plan": "SelectScatter",     "count": 12847, "p50": 142.8, "p99": 2341.0},
    {"hash": "hash0003", "pattern": "INSERT INTO orders (customer_id, total, status) VALUES (:v1, :v2, :v3)",     "tables": ["orders"], "shards": 1, "plan": "Insert",            "count": 8124,  "p50": 4.1,   "p99": 22.3},
    {"hash": "hash0004", "pattern": "SELECT COUNT(*) FROM order_items WHERE customer_id = :v1 AND status = :v2", "tables": ["order_items"], "shards": 3, "plan": "SelectScatter",     "count": 6392,  "p50": 188.4, "p99": 1840.0},
    {"hash": "hash0005", "pattern": "UPDATE orders SET status = :v1 WHERE id = :id",                             "tables": ["orders"], "shards": 1, "plan": "UpdateEqual",       "count": 7831,  "p50": 5.8,   "p99": 31.2},
    {"hash": "hash0006", "pattern": "SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id",           "tables": ["orders"], "shards": 3, "plan": "SelectScatter",     "count": 203,   "p50": 3241.0,"p99": 8920.0},
    {"hash": "hash0007", "pattern": "SELECT id, name, email FROM customers WHERE id = :id",                      "tables": ["customers"], "shards": 1, "plan": "SelectEqualUnique", "count": 92841, "p50": 2.1,   "p99": 9.8},
    {"hash": "hash0008", "pattern": "SELECT p.id, p.name FROM products p JOIN order_items oi ON p.id = oi.product_id WHERE oi.order_id = :order_id", "tables": ["products", "order_items"], "shards": 2, "plan": "SelectScatter", "count": 4182, "p50": 78.3, "p99": 420.0},
]


async def seed_demo_data():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT id FROM cluster_configs WHERE id = :id"), {"id": DEMO_CLUSTER_ID})
        if result.fetchone():
            log.info("demo_seeder.already_seeded")
            return
        log.info("demo_seeder.starting")
        now = datetime.now(timezone.utc)
        db.add(ClusterConfig(
            id=DEMO_CLUSTER_ID, name="Demo Cluster — commerce keyspace, 3 shards",
            vtgate_host="localhost", vtgate_port=15001,
            vtctld_host="localhost", vtctld_port=15000,
            etcd_host="localhost", etcd_port=2379,
            is_demo=True, is_active=True,
        ))
        await db.flush()
        for t in TABLETS:
            lag = 0.0 if t["type"] == TabletType.PRIMARY else rng.uniform(0.1, 0.8)
            if t["alias"] == "zone1-0000000301":
                lag = rng.uniform(32.0, 38.0)
            db.add(TabletSnapshot(
                id=str(uuid.uuid4()), cluster_id=DEMO_CLUSTER_ID,
                tablet_alias=t["alias"], keyspace="commerce", shard=t["shard"],
                tablet_type=t["type"], is_healthy=True,
                replication_lag_seconds=lag,
                connection_pool_used=rng.randint(8, 28), connection_pool_size=40,
                qps=round(rng.uniform(180.0, 340.0), 1), query_kill_count=rng.randint(0, 3),
                raw_health={"serving": True}, snapshot_at=now,
            ))
        await db.flush()
        _seed_incidents(db, now)
        await db.flush()
        cap = now - timedelta(minutes=5)
        for q in DEMO_QUERIES:
            db.add(QueryFingerprint(
                id=str(uuid.uuid4()), cluster_id=DEMO_CLUSTER_ID,
                fingerprint_hash=q["hash"], query_pattern=q["pattern"],
                keyspace="commerce", table_names=q["tables"],
                shard_count_routed=q["shards"], total_shards=3,
                is_scatter=q["shards"] > 1, scatter_ratio=round(q["shards"] / 3, 2),
                count=q["count"], latency_p50_ms=q["p50"], latency_p99_ms=q["p99"],
                plan_type=q["plan"], captured_at=cap,
            ))
        await db.commit()
        log.info("demo_seeder.complete")


def _seed_incidents(db, now):
    incidents = [
        {
            "id": "inc-001", "type": IncidentType.SCATTER_STORM, "sev": IncidentSeverity.HIGH,
            "status": IncidentStatus.RESOLVED, "minutes_ago": 180, "duration": 247,
            "title": "Scatter Query Storm — commerce keyspace",
            "summary": "VTGate detected 847 queries/sec routed to all 3 shards due to missing vindex on order_items. P99 spiked from 18ms to 2,340ms.",
            "graph": {
                "root_cause_node_id": "node-deploy",
                "nodes": [
                    {"id": "node-deploy",  "component": "application", "event_type": "schema_change", "description": "New query deployed without vindex on order_items.customer_id", "is_root_cause": True,  "confidence": 0.96, "occurred_at": (now - timedelta(minutes=180, seconds=247)).isoformat()},
                    {"id": "node-vtgate",  "component": "vtgate",      "event_type": "scatter_storm", "description": "VTGate forced scatter to all 3 shards — no vindex route",       "is_root_cause": False, "confidence": 0.98, "occurred_at": (now - timedelta(minutes=180, seconds=200)).isoformat()},
                    {"id": "node-latency", "component": "vtgate",      "event_type": "latency_spike", "description": "P99 latency rose to 2,340ms as shards became saturated",        "is_root_cause": False, "confidence": 0.99, "occurred_at": (now - timedelta(minutes=180, seconds=100)).isoformat()},
                ],
                "edges": [
                    {"source": "node-deploy", "target": "node-vtgate",  "relationship": "caused_by", "confidence": 0.96},
                    {"source": "node-vtgate", "target": "node-latency", "relationship": "amplified",  "confidence": 0.91},
                ],
            },
            "recs": [
                {"priority": "immediate",  "title": "Add lookup vindex on order_items.customer_id", "description": "Apply VSchema change so VTGate routes to single shard.", "action": "Apply via vtctldclient", "vitess_command": "vtctldclient ApplyVSchema --vschema '{...}' commerce"},
                {"priority": "short_term", "title": "Add scatter query budget in VTGate",           "description": "Reject scatter queries above tablet count threshold.",    "action": "Set limits in VTGate config", "vitess_command": None},
            ],
            "affected": ["SELECT * FROM order_items WHERE customer_id = :customer_id"],
            "events": [
                {"component": "vtgate", "event_type": "scatter_rate_spike", "description": "Scatter rate crossed 30% threshold — reached 94%", "metric_name": "vtgate_scatter_query_ratio", "metric_value": 0.94, "offset": 0,  "conf": 0.98},
                {"component": "vttablet-zone1-0000000100", "event_type": "qps_spike", "description": "Shard -40 primary QPS jumped from 280 to 847", "metric_name": "vttablet_queries_total", "metric_value": 847.0, "offset": 45, "conf": 0.97},
            ],
        },
        {
            "id": "inc-002", "type": IncidentType.TABLET_FAILOVER, "sev": IncidentSeverity.CRITICAL,
            "status": IncidentStatus.RESOLVED, "minutes_ago": 720, "duration": 22,
            "title": "Unplanned Primary Failover — shard 40-80",
            "summary": "VTTablet zone1-0000000200 OOM-killed at 03:14 UTC. VTOrc promoted zone1-0000000201 in 22 seconds.",
            "graph": {
                "root_cause_node_id": "node-oom",
                "nodes": [
                    {"id": "node-oom",    "component": "vttablet-zone1-0000000200", "event_type": "oom_kill",      "description": "OOM kill — 8GB memory limit hit by large aggregation", "is_root_cause": True,  "confidence": 1.0,  "occurred_at": (now - timedelta(minutes=720, seconds=22)).isoformat()},
                    {"id": "node-vtorc",  "component": "vtorc",                     "event_type": "ers_triggered", "description": "EmergencyReparentShard triggered for shard 40-80",      "is_root_cause": False, "confidence": 1.0,  "occurred_at": (now - timedelta(minutes=720, seconds=13)).isoformat()},
                    {"id": "node-promo",  "component": "vttablet-zone1-0000000201", "event_type": "promotion",     "description": "Replica promoted to primary — lag at cutover: 0.3s",   "is_root_cause": False, "confidence": 1.0,  "occurred_at": (now - timedelta(minutes=720)).isoformat()},
                ],
                "edges": [
                    {"source": "node-oom",   "target": "node-vtorc", "relationship": "caused_by", "confidence": 1.0},
                    {"source": "node-vtorc", "target": "node-promo", "relationship": "triggered",  "confidence": 1.0},
                ],
            },
            "recs": [
                {"priority": "immediate", "title": "Increase VTTablet memory to 16GB", "description": "OOM caused by unbounded aggregation query.", "action": "Update Kubernetes resource limits", "vitess_command": "kubectl patch statefulset vttablet-40-80 ..."},
                {"priority": "immediate", "title": "Set query kill timeout",            "description": "Add 30s kill timeout to prevent runaway queries.", "action": "Set flag on vttablet", "vitess_command": "vttablet --queryserver-config-query-timeout=30s"},
            ],
            "affected": ["SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id"],
            "events": [
                {"component": "vttablet-zone1-0000000200", "event_type": "oom_kill",          "description": "OOM kill — memory at 98% of 8GB", "metric_name": "vttablet_memory_bytes", "metric_value": 8053063680.0, "offset": 0,  "conf": 1.0},
                {"component": "vttablet-zone1-0000000201", "event_type": "promoted_to_primary","description": "Replica promoted to primary",      "metric_name": "vttablet_tablet_type",  "metric_value": 1.0,          "offset": 22, "conf": 1.0},
            ],
        },
        {
            "id": "inc-003", "type": IncidentType.REPLICATION_LAG, "sev": IncidentSeverity.MEDIUM,
            "status": IncidentStatus.ACTIVE, "minutes_ago": 15, "duration": None,
            "title": "Replication Lag Spike — shard 80- replica",
            "summary": "zone1-0000000301 has 34s replication lag caused by large Online DDL on primary. VTGate removed it from read pool.",
            "graph": {
                "root_cause_node_id": "node-ddl",
                "nodes": [
                    {"id": "node-ddl",    "component": "vttablet-zone1-0000000300", "event_type": "online_ddl",      "description": "Large Online DDL generating heavy binlog traffic", "is_root_cause": True,  "confidence": 0.99, "occurred_at": (now - timedelta(minutes=15, seconds=900)).isoformat()},
                    {"id": "node-lag",    "component": "vttablet-zone1-0000000301", "event_type": "replication_lag", "description": "Replica lag: 34.7s and still rising",              "is_root_cause": False, "confidence": 0.99, "occurred_at": (now - timedelta(minutes=15, seconds=460)).isoformat()},
                    {"id": "node-vtgate", "component": "vtgate",                    "event_type": "replica_removed",  "description": "Replica removed from serving pool",               "is_root_cause": False, "confidence": 1.0,  "occurred_at": (now - timedelta(minutes=15, seconds=440)).isoformat()},
                ],
                "edges": [
                    {"source": "node-ddl", "target": "node-lag",    "relationship": "caused_by", "confidence": 0.97},
                    {"source": "node-lag", "target": "node-vtgate", "relationship": "triggered",  "confidence": 1.0},
                ],
            },
            "recs": [
                {"priority": "immediate", "title": "Throttle Online DDL migration", "description": "Reduce throttle ratio to allow replica to catch up.", "action": "Use vtctldclient UpdateThrottlerConfig", "vitess_command": "vtctldclient UpdateThrottlerConfig --enable --threshold=0.3 commerce"},
            ],
            "affected": [],
            "events": [
                {"component": "vttablet-zone1-0000000301", "event_type": "lag_rising",       "description": "Replica lag climbing — now at 34.7s", "metric_name": "vttablet_replica_lag_seconds", "metric_value": 34.7, "offset": 420, "conf": 0.99},
                {"component": "vtgate",                    "event_type": "replica_removed",   "description": "Replica removed from read pool",       "metric_name": "vtgate_serving_tablets",        "metric_value": -1.0, "offset": 440, "conf": 1.0},
            ],
        },
    ]
    for inc in incidents:
        detected_at = now - timedelta(minutes=inc["minutes_ago"])
        resolved_at = detected_at + timedelta(seconds=inc["duration"]) if inc["duration"] else None
        incident = Incident(
            id=inc["id"], cluster_id=DEMO_CLUSTER_ID,
            incident_type=inc["type"], severity=inc["sev"], status=inc["status"],
            title=inc["title"], summary=inc["summary"],
            causation_graph=inc["graph"], recommendations=inc["recs"],
            affected_queries=inc["affected"],
            evidence={"source": "demo", "data_points": rng.randint(120, 840)},
            detected_at=detected_at, resolved_at=resolved_at,
            duration_seconds=inc["duration"],
            share_token=f"demo{inc['id'].replace('-', '')}",
        )
        db.add(incident)
        for ev in inc["events"]:
            db.add(IncidentEvent(
                id=str(uuid.uuid4()), incident_id=inc["id"],
                component=ev["component"], event_type=ev["event_type"],
                description=ev["description"], metric_name=ev.get("metric_name"),
                metric_value=ev.get("metric_value"),
                occurred_at=detected_at + timedelta(seconds=ev["offset"]),
                confidence=ev["conf"], raw_data={"demo": True},
            ))
