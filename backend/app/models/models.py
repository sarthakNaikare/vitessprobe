from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid
import enum


def gen_uuid():
    return str(uuid.uuid4())


class IncidentType(str, enum.Enum):
    TABLET_FAILOVER = "tablet_failover"
    SCATTER_STORM = "scatter_storm"
    REPLICATION_LAG = "replication_lag"
    VREPLICATION_ERROR = "vreplication_error"
    ONLINE_DDL_STALL = "online_ddl_stall"
    VTGATE_OVERLOAD = "vtgate_overload"
    CONNECTION_POOL_EXHAUSTION = "connection_pool_exhaustion"
    UNKNOWN = "unknown"


class IncidentSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class IncidentStatus(str, enum.Enum):
    ACTIVE = "active"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"


class TabletType(str, enum.Enum):
    PRIMARY = "primary"
    REPLICA = "replica"
    RDONLY = "rdonly"


class ClusterConfig(Base):
    __tablename__ = "cluster_configs"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    vtgate_host = Column(String(255), nullable=False)
    vtgate_port = Column(Integer, default=15001)
    vtctld_host = Column(String(255))
    vtctld_port = Column(Integer, default=15000)
    etcd_host = Column(String(255))
    etcd_port = Column(Integer, default=2379)
    prometheus_url = Column(String(500))
    is_demo = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    incidents = relationship("Incident", back_populates="cluster")
    tablets = relationship("TabletSnapshot", back_populates="cluster")


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, default=gen_uuid)
    cluster_id = Column(String, ForeignKey("cluster_configs.id"), nullable=False)
    incident_type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.ACTIVE)
    title = Column(String(500), nullable=False)
    summary = Column(Text)
    causation_graph = Column(JSONB)
    evidence = Column(JSONB)
    affected_queries = Column(JSONB)
    recommendations = Column(JSONB)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)
    share_token = Column(String(32), unique=True, default=lambda: uuid.uuid4().hex[:12])
    cluster = relationship("ClusterConfig", back_populates="incidents")
    reports = relationship("RCAReport", back_populates="incident")
    events = relationship("IncidentEvent", back_populates="incident", order_by="IncidentEvent.occurred_at")
    __table_args__ = (
        Index("ix_incidents_cluster_detected", "cluster_id", "detected_at"),
    )


class IncidentEvent(Base):
    __tablename__ = "incident_events"
    id = Column(String, primary_key=True, default=gen_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    component = Column(String(100))
    event_type = Column(String(100))
    description = Column(Text)
    metric_value = Column(Float)
    metric_name = Column(String(200))
    raw_data = Column(JSONB)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
    confidence = Column(Float, default=1.0)
    incident = relationship("Incident", back_populates="events")


class TabletSnapshot(Base):
    __tablename__ = "tablet_snapshots"
    id = Column(String, primary_key=True, default=gen_uuid)
    cluster_id = Column(String, ForeignKey("cluster_configs.id"), nullable=False)
    tablet_alias = Column(String(100), nullable=False)
    keyspace = Column(String(100))
    shard = Column(String(50))
    tablet_type = Column(Enum(TabletType))
    is_healthy = Column(Boolean)
    replication_lag_seconds = Column(Float)
    connection_pool_used = Column(Integer)
    connection_pool_size = Column(Integer)
    qps = Column(Float)
    query_kill_count = Column(Integer)
    raw_health = Column(JSONB)
    snapshot_at = Column(DateTime(timezone=True), server_default=func.now())
    cluster = relationship("ClusterConfig", back_populates="tablets")
    __table_args__ = (
        Index("ix_tablet_snapshots_alias_time", "tablet_alias", "snapshot_at"),
    )


class QueryFingerprint(Base):
    __tablename__ = "query_fingerprints"
    id = Column(String, primary_key=True, default=gen_uuid)
    cluster_id = Column(String, ForeignKey("cluster_configs.id"), nullable=False)
    fingerprint_hash = Column(String(64), nullable=False)
    query_pattern = Column(Text, nullable=False)
    keyspace = Column(String(100))
    table_names = Column(JSONB)
    shard_count_routed = Column(Integer)
    total_shards = Column(Integer)
    is_scatter = Column(Boolean)
    scatter_ratio = Column(Float)
    count = Column(Integer)
    latency_p50_ms = Column(Float)
    latency_p99_ms = Column(Float)
    plan_type = Column(String(100))
    captured_at = Column(DateTime(timezone=True), server_default=func.now())


class RCAReport(Base):
    __tablename__ = "rca_reports"
    id = Column(String, primary_key=True, default=gen_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    audience = Column(String(20), default="technical")
    title = Column(String(500))
    executive_summary = Column(Text)
    timeline_narrative = Column(Text)
    root_cause_explanation = Column(Text)
    affected_systems = Column(JSONB)
    recommendations = Column(JSONB)
    playbook_steps = Column(JSONB)
    share_token = Column(String(32), unique=True, default=lambda: uuid.uuid4().hex[:12])
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    generated_by = Column(String(100), default="vitessprobe-rca-engine")
    incident = relationship("Incident", back_populates="reports")
