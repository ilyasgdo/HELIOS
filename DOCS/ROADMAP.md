# 🛰️ HELIOS — ROADMAP GÉNÉRAL

> **Vision** : Terminal de veille mondiale en temps réel — globe 3D interactif avec 10 couches de données (avions, conflits, marchés, satellites, CCTV, météo...).

---

## 📁 Structure des Documents

| Fichier | Description |
|---|---|
| [MVP.md](./MVP.md) | Vision initiale + stack technique |
| [ROADMAP.md](./ROADMAP.md) | Ce fichier — plan général |
| [RULES.md](./RULES.md) | Règles et conventions de développement |
| [ETAPE_1_SETUP.md](./ETAPE_1_SETUP.md) | Setup initial du projet |
| [ETAPE_2_GLOBE.md](./ETAPE_2_GLOBE.md) | Globe 3D CesiumJS |
| [ETAPE_3_BACKEND_API.md](./ETAPE_3_BACKEND_API.md) | Backend FastAPI + WebSocket |
| [ETAPE_4_COUCHES_DATA.md](./ETAPE_4_COUCHES_DATA.md) | 10 couches de données |
| [ETAPE_5_CCTV.md](./ETAPE_5_CCTV.md) | Module CCTV streams live |
| [ETAPE_6_ALERTES.md](./ETAPE_6_ALERTES.md) | Système d'alertes |
| [ETAPE_7_UI_PANELS.md](./ETAPE_7_UI_PANELS.md) | Panels latéraux UI |
| [ETAPE_8_POLISH_DEPLOY.md](./ETAPE_8_POLISH_DEPLOY.md) | Finition + déploiement |

---

## 🗺️ Vue d'ensemble des Phases

```
PHASE 1 — Fondations (Étapes 1-2)
  └── Setup projet + Globe 3D vide fonctionnel

PHASE 2 — Core Backend (Étapes 3-4)
  └── API temps réel + 10 couches de données

PHASE 3 — Features Avancées (Étapes 5-6)
  └── CCTV live + Système d'alertes

PHASE 4 — UI & Production (Étapes 7-8)
  └── Panels UI complets + Deploy
```

---

## ⏱️ Timeline Estimée

| Phase | Étapes | Durée estimée | Priorité |
|---|---|---|---|
| **Phase 1** | Étapes 1-2 | ~1 semaine | 🔴 Critique |
| **Phase 2** | Étapes 3-4 | ~2 semaines | 🔴 Critique |
| **Phase 3** | Étapes 5-6 | ~1.5 semaines | 🟠 Haute |
| **Phase 4** | Étapes 7-8 | ~1 semaine | 🟡 Moyenne |

**Total estimé : ~5-6 semaines (développement solo)**

---

## 🏗️ Architecture Globale

```
helios/
├── frontend/               # React + Vite + CesiumJS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Globe/          # Globe 3D + toutes les couches
│   │   │   ├── Panels/         # Panels droits (News, Finance...)
│   │   │   ├── CCTV/           # Grid de streams vidéo
│   │   │   ├── Alerts/         # Bandeau + modal alertes
│   │   │   └── Search/         # Barre de recherche CLI
│   │   ├── hooks/              # useWebSocket, useGlobe, ...
│   │   ├── stores/             # Zustand stores (état global)
│   │   └── App.jsx
│   └── package.json
│
├── backend/                # Python FastAPI
│   ├── main.py             # App FastAPI + routes
│   ├── websocket.py        # WebSocket manager
│   ├── scheduler.py        # APScheduler jobs
│   ├── db.py               # SQLite avec SQLModel
│   ├── routes/
│   │   ├── aviation.py     # OpenSky
│   │   ├── news.py         # NewsData / GDELT
│   │   ├── finance.py      # Finnhub / AlphaVantage
│   │   ├── weather.py      # USGS + NASA GIBS
│   │   └── cctv.py         # Streams CCTV
│   └── requirements.txt
│
└── DOCS/                   # Documentation (ce dossier)
```

---

## 🎯 Critères de Succès MVP

- [ ] Globe 3D tourne, zoomable, avec au moins 3 couches actives
- [ ] Données avions se mettent à jour en temps réel (WebSocket)
- [ ] Au moins 5 APIs intégrées et fonctionnelles
- [ ] 1 stream CCTV live fonctionne
- [ ] Interface dark, responsive, visuellement impressionnante
- [ ] Aucune clé API hardcodée dans le code source

---

## 🔗 APIs & Clés à Obtenir

| API | URL | Usage | Free Tier |
|---|---|---|---|
| **CesiumJS Ion** | cesium.com/ion | Globe 3D terrain | 1 compte gratuit |
| **OpenSky** | opensky-network.org | Avions live | Gratuit sans clé |
| **Finnhub** | finnhub.io | Finance + news | 60 req/min |
| **NewsData** | newsdata.io | News monde | 200 req/jour |
| **AlphaVantage** | alphavantage.co | Forex, macro | 25 req/jour |
| **NASA GIBS** | nasa.gov/GIBS | Satellite tiles | Gratuit |
| **TradingEconomics** | tradingeconomics.com | Indicateurs macro | Free tier |
| **USGS** | earthquake.usgs.gov | Séismes | Gratuit |

> ⚠️ Stocker toutes les clés dans un fichier `.env` jamais commité sur Git.
