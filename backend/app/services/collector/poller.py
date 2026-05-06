import structlog
log = structlog.get_logger()

async def start_polling():
    log.info("poller.starting — live mode not active in demo")
