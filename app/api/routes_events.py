from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

from sqlalchemy import select

from ..db import SessionLocal
from ..models import Event
from ..rules.engine import process_event

router = APIRouter()

class EventIn(BaseModel):
    timestamp: datetime
    host: str
    source: str
    source_type: str = "custom"
    severity: str = "INFO"
    message: str
    fields: dict = {}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def ingest_event(event: EventIn, db=Depends(get_db)):
    db_event = Event(
        timestamp=event.timestamp,
        host=event.host,
        source=event.source,
        source_type=event.source_type,
        severity=event.severity,
        message=event.message,
        fields=event.fields,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # Run through rule engine
    process_event(db, db_event)

    return {"status": "ok", "id": db_event.id}

@router.get("/")
def list_events(
    host: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 100,
    db=Depends(get_db),
):
    query = select(Event).order_by(Event.timestamp.desc()).limit(limit)
    if host:
        query = query.where(Event.host == host)
    if source:
        query = query.where(Event.source == source)

    result = db.execute(query).scalars().all()
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp,
            "host": e.host,
            "source": e.source,
            "severity": e.severity,
            "message": e.message,
            "fields": e.fields,
        }
        for e in result
    ]