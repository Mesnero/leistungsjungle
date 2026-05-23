# Backend: FastAPI + Scraper. Dev-Mode mit --reload, Source als Volume gemountet.
FROM python:3.11-slim

WORKDIR /app

# Build-Tools für PyMuPDF werden nicht gebraucht (wheel verfügbar)
# nur curl für gelegentliche Healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Dependencies zuerst — bessere Docker-Cache-Nutzung
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Restlicher Code wird via Volume gemountet (siehe docker-compose.yml)
COPY . .

EXPOSE 8000

ENV PYTHONIOENCODING=utf-8 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
