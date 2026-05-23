# Backend: FastAPI + Scraper. Production-ready Dockerfile.
# Für Dev mit Hot-Reload überschreibt docker-compose.yml den CMD.
FROM python:3.11-slim

WORKDIR /app

# curl für Healthchecks (Render pingt /health)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Dependencies zuerst — bessere Docker-Cache-Nutzung
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render injectet PORT — Default 8000 falls nicht gesetzt
ENV PORT=8000
EXPOSE 8000

ENV PYTHONIOENCODING=utf-8 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Shell-Form damit $PORT expandiert wird (JSON-Form macht das nicht).
# Kein --reload (das ist Dev-only und macht in Render Probleme).
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
