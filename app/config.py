import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./siem.db")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"