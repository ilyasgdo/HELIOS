# HELIOS

HEadquarters for Live Intelligence & OSINT System

HELIOS est une plateforme de veille géospatiale en temps reel qui combine:
- un backend FastAPI (collecte OSINT + diffusion live),
- un scheduler asynchrone (polling periodique des sources),
- un frontend React + Cesium (globe 3D + panneaux d'analyse),
- un systeme d'alertes persistant (SQLite + WebSocket).

## Fonctionnalites

- Globe 3D interactif (Cesium) avec couches de donnees:
	- aviation (FlightRadar24),
	- actualites mondiales (NewsData.io),
	- finance globale (Finnhub),
	- seismicite (USGS),
	- CCTV (dataset public + Shodan optionnel).
- Mises a jour temps reel via WebSocket sur /ws.
- Chargement initial via endpoints REST.
- Moteur d'alertes:
	- alertes seismiques selon seuils de magnitude,
	- alertes de crash marche (chute >= 3%).
- Historique des alertes en base SQLite avec accusé de lecture.

## Architecture

### Backend (FastAPI)

- Entree principale: backend/main.py
- Routes API: backend/routes/
- Scheduler: backend/scheduler.py
- WebSocket manager: backend/websocket.py
- Alert engine: backend/services/alert_engine.py
- Persistance: SQLite via SQLModel (backend/db.py)

### Frontend (React + Vite)

- Entree principale: frontend/src/App.jsx
- Donnees initiales REST: frontend/src/hooks/useGlobeData.js
- Flux live WebSocket: frontend/src/hooks/useWebSocket.js
- Globe/Couches: frontend/src/components/Globe/
- Panneaux UI et alertes: frontend/src/components/

## Prerequis

- Python 3.11+
- Node.js 18+
- npm

## Variables d'environnement

Creer un fichier .env dans backend/ (ou definir ces variables dans votre environnement):

```env
# CORS (frontend)
ALLOWED_ORIGINS=http://localhost:5173

# API keys (optionnelles mais recommandees)
NEWSDATA_API_KEY=
FINNHUB_API_KEY=
SHODAN_API_KEY=

# Base SQLite (chemin local)
# Exemple: ./helios.db
DATABASE_URL=./helios.db
```

Notes:
- Sans NEWSDATA_API_KEY, les news renverront une liste vide.
- Sans FINNHUB_API_KEY, les donnees finance renverront une liste vide.
- Sans SHODAN_API_KEY, la route Shodan renverra une liste vide (ou fallback demo selon le statut API).

## Installation

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Frontend

```bash
cd frontend
npm install
```

## Lancement en developpement

Ouvrir 2 terminaux:

### Terminal A - API

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal B - Frontend

```bash
cd frontend
npm run dev
```

Application frontend: http://localhost:5173
API backend: http://localhost:8000
Doc OpenAPI: http://localhost:8000/docs

## Endpoints principaux

### Systeme
- GET /api/health
- WS /ws

### Donnees
- GET /api/aviation/
- GET /api/news/latest
- GET /api/finance/markets
- GET /api/weather/earthquakes
- GET /api/cctv/cameras
- GET /api/cctv/stream/{camera_id}
- GET /api/shodan/

### Alertes
- GET /api/alerts?limit=50
- POST /api/alerts/{alert_id}/acknowledge

## Frequences de mise a jour (scheduler)

- Aviation: toutes les 30s
- News: toutes les 5 min
- Finance: toutes les 2 min
- Seismic: toutes les 60s
- Shodan CCTV: toutes les 10 min

## Build production (frontend)

```bash
cd frontend
npm run build
npm run preview
```

## Stack technique

- Backend: FastAPI, SQLModel, APScheduler, httpx, python-dotenv
- Frontend: React 18, Vite, Cesium, Zustand, hls.js
- Transport: REST + WebSocket
- Base de donnees: SQLite
