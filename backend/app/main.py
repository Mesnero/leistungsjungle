from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# .env als allererstes laden — sonst sieht der Coach-Router keine OPENAI_API_KEY
load_dotenv()

from app.config import settings  # noqa: E402
from app.data import load_all  # noqa: E402
from app.routers import benefits, coach, krankenkassen  # noqa: E402


# JSONs einmal beim Start einlesen
load_all()

app = FastAPI(title="Leistungsjungle API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# KK-Logos als statische SVG-Dateien servieren
LOGOS_DIR = Path(__file__).resolve().parent.parent / "Logos"
if LOGOS_DIR.exists():
    app.mount("/logos", StaticFiles(directory=str(LOGOS_DIR)), name="logos")

app.include_router(krankenkassen.router)
app.include_router(benefits.router)
app.include_router(coach.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
