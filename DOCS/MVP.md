┌─────────────────────────────────────────────────────────────┐
│                    HELIOS Terminal                          │
│                                                             │
│  [🔍 Search bar / CLI]  [💹 Finance]  [⚠️ Alertes]  [🛰️ Sat] │
│                                                             │
│  ┌─────────────────────────────────┐  ┌───────────────────┐ │
│  │         🌍 Globe 3D             │  │  📊 Panels        │ │
│  │         CesiumJS                │  │  - News live      │ │
│  │   • Zones guerre (rouge)        │  │  - Marchés pays   │ │
│  │   • Trafic (heat map)           │  │  - OSINT results  │ │
│  │   • Avions OpenSky              │  │  - Alertes macro  │ │
│  │   • Satellite imagery           │  └───────────────────┘ │
│  │   • Indicateurs pays overlay    │  ┌───────────────────┐ │
│  └─────────────────────────────────┘  │ 📹 CCTV Grid      │ │
│                                       │ (4 streams live)  │ │
└─────────────────────────────────────────────────────────────┘
Couche	Techno	Raison
Frontend	React + Vite + CesiumJS	Globe 3D WebGL, superposition layers illimitée 
​
Backend	Python FastAPI + WebSocket	Streaming temps réel vers le front 
​
Scheduler	APScheduler (Python)	Pull des APIs toutes les 30s–5min
DB locale	SQLite	Cache OSINT, historique recherches
Carte satellite	NASA GIBS tiles XYZ	Gratuit, near real-time 
​Les 10 couches d'info sur le globe 3D
✈️ Aviation — Positions avions temps réel via OpenSky API (WebSocket)
​

🔴 Zones de conflit — Polygones GeoJSON colorés (Ukraine, Gaza, Soudan...)
​

🛰️ Satellite imagery — Tuiles NASA GIBS / Sentinel Hub superposées

🚗 Trafic routier — Heatmap via PTV Flows API / TomTom free tier
​

💹 Marchés par pays — Couleur par performance boursière (AlphaVantage / Finnhub)

📰 Hotspots news — Marqueurs pulsants là où les events se passent (NewsData / GDELT)
​

🌡️ Données macro — Inflation, PIB, chômage en overlay (TradingEconomics)
​

🛸 Satellites orbitaux — Positions TLE temps réel (SatIntel / Space-Track)
​

📷 CCTV publiques — Points cliquables → stream live (OpenTrafficCamMap 7500+ cams)
​

⚡ Alertes sismiques/météo — USGS + NASA GIBS incendies/fumée
​

CCTV publiques — comment ça marche
Pour les caméras publiques, tu as deux sources gratuites légales :

OpenTrafficCamMap (GitHub) : 7500+ caméras trafic USA avec URLs HLS/MJPEG directes
​

Insecam.org : liste de caméras IP publiques mal sécurisées (attention légalement selon pays)

OpenDataCam : pour analyser des streams vidéo avec computer vision (comptage objets)
​

Le player côté frontend : <video src="stream_url.m3u8" /> avec HLS.js. Simple.
API	Usage	Free tier
finnhub.io
Finance, news, crypto	60 req/min 
​
newsdata.io
News monde en temps réel	200 req/j 
​
opensky-network.org	Avions live	Gratuit sans clé
alphavantage.co	Cours actions, forex, macro	25 req/j 
​
nasa.gov/GIBS	Satellite tiles	Gratuit 
​
tradingeconomics.com
Indicateurs macro	Free tier 
​
cesium.com/ion	Globe 3D + terrain	Free 1 compte 
​
