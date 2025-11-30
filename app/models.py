from sqlalchemy import Column, String, DateTime, JSON, Text
from .db import Base
import uuid
from datetime import datetime

def gen_uuid():
    return str(uuid.uuid4())

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=gen_uuid)
    timestamp = Column(DateTime, index=True)
    ingest_time = Column(DateTime, default=datetime.utcnow)
    host = Column(String, index=True)
    source = Column(String)
    source_type = Column(String)
    severity = Column(String)
    message = Column(Text)
    fields = Column(JSON)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    rule_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String)
    title = Column(String)
    description = Column(Text)
    events = Column(JSON)
    status = Column(String, default="open")