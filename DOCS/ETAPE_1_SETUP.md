# 🔧 ÉTAPE 1 — Setup Initial du Projet

> **Objectif** : Avoir une structure de projet fonctionnelle avec le frontend React/Vite et le backend FastAPI qui communiquent ensemble. **Aucune feature, juste les fondations.**

**Durée estimée** : 2-3 jours  
**Dépendances** : Aucune (première étape)  
**Suivant** : [ETAPE_2_GLOBE.md](./ETAPE_2_GLOBE.md)

---

## ✅ Checklist de Validation

Avant de passer à l'étape 2, tous ces points doivent être cochés :

- [ ] `npm run dev` lance le frontend sans erreur sur `http://localhost:5173`
- [ ] `uvicorn main:app --reload` lance le backend sans erreur sur `http://localhost:8000`
- [ ] La page `/docs` de FastAPI est accessible
- [ ] Le frontend peut fetch `GET /api/health` et afficher la réponse
- [ ] SQLite se crée automatiquement au premier lancement
- [ ] `.env` est dans `.gitignore`, les clés ne sont pas dans le code
- [ ] ESLint et Ruff passent sans erreur

---

## 1.1 — Prérequis à Installer

```bash
# Node.js >= 18
node --version   # doit afficher v18+

# Python >= 3.11
python --version # doit afficher 3.11+

# Git
git --version
```

**Clés API à obtenir avant de commencer :**
- [ ] CesiumJS Ion Token — [cesium.com/ion](https://cesium.com/ion) (gratuit)
- [ ] Finnhub API Key — [finnhub.io](https://finnhub.io) (gratuit)
- [ ] NewsData API Key — [newsdata.io](https://newsdata.io) (gratuit)
- [ ] AlphaVantage API Key — [alphavantage.co](https://alphavantage.co) (gratuit)

---

## 1.2 — Initialisation du Dépôt Git

```bash
cd C:\Users\ilyas\Documents\HELIOS

# Créer .gitignore IMMÉDIATEMENT
cat > .gitignore << 'EOF'
# Environment
.env
*.env
.env.*

# Python
__pycache__/
*.pyc
*.pyo
venv/
.venv/
*.egg-info/

# Node
node_modules/
dist/
.cache/

# SQLite
*.db
*.sqlite

# IDEs
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
EOF

git add .gitignore
git commit -m "chore: initial .gitignore"
```

---

## 1.3 — Setup Frontend (React + Vite)

```bash
# Créer le projet Vite + React
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Dépendances principales
npm install zustand @cesium/engine cesium
npm install axios react-router-dom
npm install hls.js  # Pour les streams CCTV

# Dépendances dev
npm install -D eslint @eslint/js eslint-plugin-react
```

### Structure des dossiers frontend

```
frontend/src/
├── components/
│   ├── Globe/
│   │   ├── Globe.jsx           # Composant principal CesiumJS
│   │   └── layers/             # Dossier pour chaque couche
│   ├── Panels/
│   │   ├── PanelContainer.jsx
│   │   ├── NewsPanel.jsx
│   │   ├── FinancePanel.jsx
│   │   └── AlertsPanel.jsx
│   ├── CCTV/
│   │   └── CCTVGrid.jsx
│   ├── Search/
│   │   └── SearchBar.jsx
│   └── common/
│       ├── Badge.jsx
│       └── LoadingSpinner.jsx
├── hooks/
│   ├── useWebSocket.js
│   └── useGlobeLayer.js
├── stores/
│   ├── globeStore.js
│   ├── alertsStore.js
│   └── panelStore.js
├── styles/
│   ├── tokens.css              # Variables CSS (couleurs, espacement)
│   └── global.css
├── constants/
│   └── api.js                  # URLs des endpoints
├── App.jsx
└── main.jsx
```

### `frontend/.env`
```env
VITE_CESIUM_TOKEN=your_cesium_ion_token_here
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

### `frontend/vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      }
    }
  }
})
```

---

## 1.4 — Setup Backend (FastAPI + Python)

```bash
cd C:\Users\ilyas\Documents\HELIOS
mkdir backend && cd backend

# Environnement virtuel
python -m venv .venv
.venv\Scripts\activate   # Windows

# Dépendances
pip install fastapi uvicorn[standard] httpx sqlmodel apscheduler
pip install python-dotenv websockets aiofiles ruff
pip freeze > requirements.txt
```

### Structure des dossiers backend

```
backend/
├── main.py                 # Entry point FastAPI
├── websocket.py            # WebSocket connection manager
├── scheduler.py            # APScheduler jobs
├── db.py                   # SQLite + SQLModel setup
├── .env                    # Clés API (JAMAIS commité)
├── requirements.txt
└── routes/
    ├── __init__.py
    ├── aviation.py
    ├── news.py
    ├── finance.py
    ├── weather.py
    └── cctv.py
```

### `backend/.env`
```env
FINNHUB_API_KEY=your_key_here
NEWSDATA_API_KEY=your_key_here
ALPHAVANTAGE_API_KEY=your_key_here

DATABASE_URL=./helios.db
ALLOWED_ORIGINS=http://localhost:5173
```

### `backend/main.py`
```python
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from db import init_db
from routes import aviation, news, finance, weather, cctv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HELIOS API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(aviation.router, prefix="/api/aviation")
app.include_router(news.router, prefix="/api/news")
app.include_router(finance.router, prefix="/api/finance")
app.include_router(weather.router, prefix="/api/weather")
app.include_router(cctv.router, prefix="/api/cctv")

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "HELIOS"}

@app.on_event("startup")
async def startup():
    logger.info("HELIOS backend starting...")
    init_db()
```

### `backend/db.py`
```python
from sqlmodel import SQLModel, create_engine, Session
import os

DATABASE_URL = f"sqlite:///{os.getenv('DATABASE_URL', './helios.db')}"
engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
```

---

## 1.5 — Design System de Base

### `frontend/src/styles/tokens.css`
```css
:root {
  /* Couleurs principales */
  --color-bg: #050b18;
  --color-surface: #0d1b2e;
  --color-surface-2: #112240;
  --color-border: #1e3a5f;
  --color-accent: #00d4ff;
  --color-accent-glow: rgba(0, 212, 255, 0.15);

  /* Texte */
  --color-text-primary: #e8f4fd;
  --color-text-secondary: #7facc8;
  --color-text-muted: #4a7a9b;

  /* Statuts */
  --color-danger: #ff4444;
  --color-warning: #ffaa00;
  --color-success: #00ff88;

  /* Espacement */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;

  /* Typographie */
  --font-sans: 'Inter', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Bordures */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  overflow: hidden; /* Globe en plein écran */
}
```

---

## 1.6 — Vérification Finale

```bash
# Terminal 1: Backend
cd backend && .venv\Scripts\activate && uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev

# Test manuel
curl http://localhost:8000/api/health
# Attendu: {"status": "ok", "service": "HELIOS"}
```

> ✅ Si tout fonctionne → Passer à [ETAPE_2_GLOBE.md](./ETAPE_2_GLOBE.md)
