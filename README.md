# Simple SIEM

A minimal SIEM-like application built with Python, FastAPI, and SQLite.

## Features

- HTTP event ingest (`POST /events/`)
- Event storage in SQLite
- Simple rule engine with YAML rules
- Alert creation
- Basic alert listing UI at `/`

## Quick start

```bash
pip install -r requirements.txt
python run_manager.py