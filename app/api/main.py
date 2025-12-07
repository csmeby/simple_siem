from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from . import routes_events, routes_alerts, routes_rules

app = FastAPI(title="Simple SIEM")

# Mount static files
static_path = Path(__file__).parent.parent / "ui" / "static"
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Include sub-routers
app.include_router(routes_events.router, prefix="/events", tags=["events"])
app.include_router(routes_alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(routes_rules.router, prefix="/rules", tags=["rules"])

@app.get("/", response_class=HTMLResponse)
def index():
    path = Path(__file__).parent.parent / "ui" / "templates" / "index.html"
    return path.read_text(encoding="utf-8")