from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy import select

from ..db import SessionLocal
from ..models import Alert

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def list_alerts(
    status: Optional[str] = None,
    limit: int = 100,
    db=Depends(get_db),
):
    query = select(Alert).order_by(Alert.timestamp.desc()).limit(limit)
    if status:
        query = query.where(Alert.status == status)

    result = db.execute(query).scalars().all()
    return [
        {
            "id": a.id,
            "rule_id": a.rule_id,
            "timestamp": a.timestamp,
            "severity": a.severity,
            "title": a.title,
            "description": a.description,
            "events": a.events,
            "status": a.status,
        }
        for a in result
    ]

@router.patch("/{alert_id}")
def update_alert_status(alert_id: str, status: str, db=Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        return {"error": "Alert not found"}
    alert.status = status
    db.commit()
    db.refresh(alert)
    return {"status": "ok"}