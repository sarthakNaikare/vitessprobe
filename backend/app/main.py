from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog
from app.core.config import settings
from app.db.session import init_db, close_db
from app.api.routes import health, cluster, incidents, tablets, queries, simulator, reports, import_data, ws

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("vitessprobe.starting", version=settings.APP_VERSION, demo=settings.DEMO_MODE)
    await init_db()
    if settings.DEMO_MODE:
        from app.services.collector.demo_seeder import seed_demo_data
        await seed_demo_data()
    log.info("vitessprobe.ready")
    yield
    await close_db()


app = FastAPI(
    title="VitessProbe API",
    description="Autonomous Vitess cluster intelligence platform",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,      prefix="/api/health",    tags=["health"])
app.include_router(cluster.router,     prefix="/api/cluster",   tags=["cluster"])
app.include_router(incidents.router,   prefix="/api/incidents", tags=["incidents"])
app.include_router(tablets.router,     prefix="/api/tablets",   tags=["tablets"])
app.include_router(queries.router,     prefix="/api/queries",   tags=["queries"])
app.include_router(simulator.router,   prefix="/api/simulator", tags=["simulator"])
app.include_router(reports.router,     prefix="/api/reports",   tags=["reports"])
app.include_router(import_data.router, prefix="/api/import",    tags=["import"])
app.include_router(ws.router,          prefix="/ws",            tags=["websocket"])


@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "mode": "demo" if settings.DEMO_MODE else "live", "docs": "/api/docs"}
