# Leistungsjungle

Krankenkassen-Leistungen transparent. User-Profil + Krankenkasse → personalisierte Satzungsleistungen & Bonus-Maßnahmen.

Hackathon-MVP für [GoEcoFit](https://www.goecofit.com/). Frontend ist ein iOS-Mockup mit kompletter Onboarding-Journey, Backend filtert serverseitig nach Alter/Geschlecht/Schwangerschaft/Kinder.

## Architektur

```
backend/
  app/             FastAPI — In-Memory-Filter, kein DB-Layer
  scraper/         CLI: krankenkassen.de discover → PDF → LLM (OpenAI/Gemini) → JSON
  scraped_krankenkassen/  Gescrapete KK-JSONs + _state.json (Scrape-Diff-Tracker)
  schema.json      Single Source of Truth für Output-Form
frontend/          Vite + React + TS, iOS-26-Look (kein Tailwind)
```

Keine Datenbank, keine Migrations. Der Scraper schreibt JSON-Dateien, das Backend lädt sie beim Start in den RAM. Docker-Compose-Setup für Dev liegt im Repo-Root.

## Deployment (Netlify + Backend separat)

Das Repo enthält ein `netlify.toml` das nur das **Frontend** als statisches SPA baut.
Das Backend muss separat gehostet werden — z.B. auf Render/Fly.io/Railway/Hetzner.

**Netlify Setup:**
1. Repo connecten → Netlify erkennt das `netlify.toml` automatisch
2. In Site Settings → Environment Variables setzen:
   - `VITE_API_URL` = `https://dein-backend.example.com`
3. Deploy triggern. Output landet in `frontend/dist/`

**Backend separat deployen:**
- `docker compose up backend` lokal, oder per Dockerfile auf jedem Container-Hoster
- `OPENAI_API_KEY` + `GEMINI_API_KEY` in den Hoster-Secrets setzen
- `CORS_ORIGINS` muss die Netlify-URL enthalten (z.B. `https://leistungsjungle.netlify.app`)

## Quick Start

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env       # einmalig, dann Keys eintragen
$env:PYTHONIOENCODING = "utf-8"
uvicorn app.main:app --reload
```

API läuft auf http://localhost:8000 — Swagger-Docs auf /docs.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend auf http://localhost:5173.

## Scraping

Der Scraper findet seine KKs selbst — er crawlt die [krankenkassen.de
Satzungs-Übersicht](https://www.krankenkassen.de/gesetzliche-krankenkassen/system-gesetzliche-krankenversicherung/satzungen/),
vergleicht das Stand-Datum jeder Satzung mit dem letzten Scrape-Stand
(`scraped_krankenkassen/_state.json`) und extrahiert nur was sich geändert hat.

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
$env:PYTHONIOENCODING = "utf-8"

# Default: nur Änderungen seit letztem Lauf (OpenAI gpt-5.4-mini)
python -m scraper

# Discovery anzeigen ohne zu scrapen
python -m scraper --discover-only

# Eine bestimmte KK (überschreibt den Diff)
python -m scraper --slug techniker_krankenkasse_tk

# Alles re-extrahieren (ignoriert State)
python -m scraper --force

# Testlauf mit ersten 5 KKs
python -m scraper --limit 5

# Provider/Model overriden
python -m scraper --provider gemini --model gemini-2.5-flash

# Ohne LLM-Call (nur PDF/Text testen)
python -m scraper --slug techniker_krankenkasse_tk --dry-run
```

Pflichten in `.env`:
- `OPENAI_API_KEY=sk-...` für OpenAI
- `GEMINI_API_KEY=AI...` für Gemini

Output-Schema: [`backend/schema.json`](backend/schema.json).

### Daily Cron — automatisch neue Satzungen einspielen

Der Scraper-Lauf ist idempotent: wenn nichts neu ist, kostet's nur einen HTTP-Request
auf die Übersichts-Seite und beendet sich („Nichts zu tun. State ist aktuell.").
Damit eignet er sich für tägliche Crons.

**Linux / WSL (crontab):**

```cron
# Jeden Tag um 03:30 Lokalzeit nach neuen Satzungen checken
30 3 * * * cd /opt/leistungsjungle/backend && /opt/leistungsjungle/backend/.venv/bin/python -m scraper >> /var/log/leistungsjungle-scraper.log 2>&1
```

**systemd timer** (Datei `/etc/systemd/system/leistungsjungle-scraper.service`):

```ini
[Service]
Type=oneshot
WorkingDirectory=/opt/leistungsjungle/backend
EnvironmentFile=/opt/leistungsjungle/backend/.env
ExecStart=/opt/leistungsjungle/backend/.venv/bin/python -m scraper
```

`/etc/systemd/system/leistungsjungle-scraper.timer`:

```ini
[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

**Windows Task Scheduler:** Trigger „Daily 03:30", Action `python.exe -m scraper`,
Working Directory `backend\`.

Wenn neue JSONs entstanden sind, das Backend neu starten (`uvicorn` re-load reicht
nicht für den `load_all()`-Cache — Prozess kicken).

## Endpoints

| Method | Path | Zweck |
|---|---|---|
| GET | `/krankenkassen` | Alle KKs mit Slug, Name, Stand, Counts |
| GET | `/benefits?slug=&age=&gender=&pregnant=&has_children=` | Gefilterte Leistungen + Bonus-Meta |
| GET | `/health` | Liveness-Check |

Response von `/benefits`:
```json
{
  "krankenkasse": { "slug", "name", "website", "satzung_stand" },
  "satzungsleistungen": [ ... ],
  "bonus_massnahmen": [ ... ],
  "bonusprogramm_meta": { "programm_name", "beschreibung", "wechselkurs_cash", "wechselkurs_gesundheitskonto", "hinweis", ... }
}
```

## Datenformat

Eine KK-Datei in `backend/scraped_krankenkassen/<slug>_data.json` folgt strikt [schema.json](backend/schema.json):

- **`krankenkasse`**: name, slug, website (= Satzungs-PDF-URL), satzung_stand
- **`satzungsleistungen[]`** / **`bonus_massnahmen[]`** (identische Struktur):
  - name, kategorie, beschreibung, pdf_page
  - `erstattungs_logik`: { typ, wert, waehrung, turnus }
  - `eligibility_rules[]`: alter_min/max, geschlecht (ALL/W/M/D), requires_pregnancy, requires_children, zusatz_voraussetzung
- **`bonusprogramm_meta`** (optional): programm_name, beschreibung, waehrung, wechselkurs_cash, wechselkurs_gesundheitskonto, hinweis

Das Frontend rendert das 1:1 — neue Felder im Scraper-Output erscheinen automatisch wenn das Schema dazu passt.

## Frontend-Flow

1. **User-Onboarding** (einmalig) — Spitzname, Geburtsdatum, Geschlecht → localStorage
2. **Home** — iOS-Mockup mit Steps-Ring, Wochenserie etc. Plus dem NEU-Button „Deine Kassenleistungen"
3. **Krankenkassen-Onboarding** — GKV/PKV → KK-Auswahl → Schwangerschaft (wenn weiblich) → Personen hinzufügen (Kind/Partner:in/Andere)
4. **Kasse-Tab** — Person-Dropdown, Kategorie-Filter, getrennte Sections für Satzung + Bonus, mit Erstattungs-Pills + Zusatzvoraussetzungs-Hinweisen + PDF-Deep-Links auf die Seitenzahl

Alles im localStorage (`goecofit.profile`).

## Schema-Änderungen

Wenn das Scraper-Schema sich ändert:

1. `backend/schema.json` anpassen
2. `backend/app/schemas.py` Pydantic-Modelle anpassen (extra-Felder werden default ignoriert)
3. Frontend: in `Kasse.jsx` / `KasseOnboarding.jsx` neue Felder rendern
4. Re-Scrape mit `python -m scraper --force`

Mixed-State (alte + neue Felder gleichzeitig) ist OK — Pydantic ignoriert extras, Frontend kommt mit fehlenden optionalen Feldern klar.
