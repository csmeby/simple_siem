from app.db import Base, engine
from app.models import Event, Alert
import uvicorn

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    uvicorn.run("app.api.main:app", host="127.0.0.1", port=8000, reload=True)