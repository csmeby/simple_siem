from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pathlib import Path

from . import routes_events, routes_alerts

app = FastAPI(title="Simple SIEM")

# Include sub-routers
app.include_router(routes_events.router, prefix="/events", tags=["events"])
app.include_router(routes_alerts.router, prefix="/alerts", tags=["alerts"])

@app.get("/", response_class=HTMLResponse)
def index():
    path = Path(__file__).parent.parent / "ui" / "templates" / "index.html"
    return path.read_text(encoding="utf-8")