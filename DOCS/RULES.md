# 📏 HELIOS — RÈGLES DE DÉVELOPPEMENT

> Ce fichier définit les conventions, standards, et règles absolues à respecter tout au long du développement d'HELIOS. **Ces règles s'appliquent à tous les contributeurs.**

---

## 🔒 RÈGLES ABSOLUES (Non-négociables)

### R1 — Sécurité des clés API
```
✅ Toutes les clés API dans .env
✅ .env listé dans .gitignore AVANT le premier commit
❌ JAMAIS de clé API dans le code source
❌ JAMAIS de clé API dans un commit Git
```

### R2 — Pas de donnée sensible exposée
- Les streams CCTV passent par le backend (proxy), jamais exposés directement au frontend
- Les endpoints backend ne retournent que les champs nécessaires

### R3 — Un seul `.env` par service
```
backend/.env     ← clés API côté serveur
frontend/.env    ← uniquement VITE_CESIUM_TOKEN
```

---

## 📁 Conventions de Nommage

### Fichiers & Dossiers
| Type | Convention | Exemple |
|---|---|---|
| Composants React | PascalCase | `GlobeLayer.jsx` |
| Hooks custom | camelCase, préfixe `use` | `useWebSocket.js` |
| Stores Zustand | camelCase + `Store` | `globeStore.js` |
| Routes FastAPI | snake_case | `aviation_router.py` |
| Fichiers Python | snake_case | `news_fetcher.py` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_RETRIES = 3` |

### Branches Git
```
main          ← production stable uniquement
dev           ← développement actif
feat/xxx      ← nouvelle feature (ex: feat/cctv-grid)
fix/xxx       ← correction de bug (ex: fix/websocket-disconnect)
refactor/xxx  ← refactoring sans nouvelle feature
```

### Commits (Convention Conventionnelle)
```
feat: add OpenSky aviation layer
fix: websocket reconnect on disconnect
chore: update requirements.txt
docs: update ETAPE_2 with Cesium setup
refactor: extract globe layers into separate components
```

---

## 🧱 Architecture Rules

### Frontend
- **Zustand uniquement** pour l'état global (pas de Redux, pas de Context API pour les données)
- **Un composant = un fichier**. Maximum 200 lignes par composant
- **Custom hooks** pour toute logique réutilisable (WebSocket, fetching, etc.)
- **Pas de `useEffect` pour le fetching** — utiliser des hooks dédiés
- **Pas d'import en étoile** : `import * from` est interdit

```jsx
// ✅ Correct
import { GlobeLayer } from './GlobeLayer'

// ❌ Interdit
import * as Globe from './Globe'
```

### Backend
- **Un router FastAPI par domaine** : `/aviation`, `/news`, `/finance`, etc.
- **Toute logique métier dans des modules séparés**, pas dans `main.py`
- **Pas de bloquant dans les handlers async** — utiliser `asyncio` et `httpx`
- **Logs structurés** avec le module `logging` de Python (pas de `print()`)
- **Pydantic models** pour toutes les entrées/sorties d'API

```python
# ✅ Correct
logger = logging.getLogger(__name__)
logger.info("Fetching aviation data")

# ❌ Interdit
print("Fetching aviation data")
```

### Base de données
- **Migrations explicites** — aucun `create_all()` silencieux en production
- **Indexes** sur toutes les colonnes utilisées en filtre (`timestamp`, `country`, etc.)
- **TTL sur les données cachées** — supprimer les données > 24h automatiquement

---

## ⚡ Performance Rules

| Règle | Détail |
|---|---|
| **Cache obligatoire** | Toute réponse API externe doit être cachée min 30 secondes en SQLite |
| **WebSocket batching** | Envoyer en batch max toutes les 2 secondes, pas par événement |
| **Lazy loading** | Chaque couche du globe doit se charger indépendamment |
| **Max 10MB par tuile** | Les images satellite doivent être limitées côté backend |
| **Pas de polling front** | Tout refresh de données passe par WebSocket ou SSE |

---

## 🎨 UI/UX Rules

1. **Dark mode exclusivement** — pas de thème clair
2. **Palette de couleurs** définie dans `frontend/src/styles/tokens.css` — aucune couleur inline
3. **Animations** : max 300ms pour les transitions, 600ms pour apparitions
4. **Accessibilité** : tous les boutons ont un `aria-label`, toutes les images un `alt`
5. **Mobile** : l'interface doit rester utilisable sur tablette (min 768px)

```css
/* ✅ Correct — utiliser les tokens */
color: var(--color-text-primary);
background: var(--color-surface);

/* ❌ Interdit — couleurs hardcodées */
color: #ffffff;
background: #1a1a2e;
```

---

## 🧪 Tests & Qualité

| Règle | Minimum requis |
|---|---|
| **Tests backend** | Chaque route FastAPI a au moins 1 test `pytest` |
| **Types Python** | Type hints sur toutes les fonctions publiques |
| **Linting** | `eslint` (front) + `ruff` (back) avant tout commit |
| **Pas de `TODO` non traçé** | Tout TODO doit avoir un issue GitHub associé |

---

## 📋 Process de Validation par Étape

> Avant de passer à l'étape suivante, cocher tous les items :

```
[ ] Code review du code produit dans l'étape
[ ] Les logs ne contiennent pas d'erreurs non gérées
[ ] L'interface s'affiche correctement à 1920x1080
[ ] Aucune clé API n'est exposée (grep "api_key" .)
[ ] Le fichier .gitignore est à jour
[ ] La documentation de l'étape est à jour
```

---

## 🚫 Ce qui est interdit dans ce projet

- `console.log()` laissé en production (utiliser un logger)
- Commits directement sur `main`
- Dépendances installées sans être dans `requirements.txt` / `package.json`
- URLs d'API hardcodées (tout dans `.env` ou `constants.py`)
- CSS inline dans les composants JSX
