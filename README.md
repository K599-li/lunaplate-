# LunaPlate

LunaPlate is a cycle-aware meal, movement, and care MVP. The browser UI collects cycle, symptom, food, and movement preferences; the Python backend calls TheMealDB and ranks recommendations.

Run `python server.py` and open `http://127.0.0.1:5178/index.html`. No frontend build step is required.

## Mobile installable app

LunaPlate now includes PWA packaging:

- `manifest.webmanifest`: app name, install icons, theme color, standalone display mode
- `sw.js`: service worker for caching the app shell and movement images
- `assets/pwa`: install icons generated from the LunaPlate logo

To install on a phone, serve the app from an HTTPS origin, open it in the mobile browser, then use the browser install flow:

- Android Chrome: install prompt or `Add to Home screen`
- iOS Safari: Share -> `Add to Home Screen`

The Python backend still needs to be reachable from the phone because meal and movement recommendations call `/api/meals`, `/api/today-meal`, and `/api/female-exercises`. For production, deploy `server.py` behind the same HTTPS domain or update the app to call a hosted API base URL.

## HTTPS deployment

The simplest production shape is one Python web service that serves both the static app and the `/api/*` backend on the same HTTPS origin. This keeps PWA installation, service worker caching, and API calls same-origin.

### Render

This repository includes `render.yaml` for Render Blueprint deployment.

1. Push this folder to a GitHub repository.
2. In Render, create a new Blueprint or Web Service from that repository.
3. Use:
   - Runtime: Python
   - Build command: empty
   - Start command: `python server.py`
4. Render provides a HTTPS URL like `https://lunaplate.onrender.com`.
5. Open that URL on Android Chrome or iOS Safari and install/add to home screen.

For a custom domain, add the domain in the Render dashboard and follow Render's DNS instructions. The app should stay on one origin, for example:

- Frontend: `https://app.example.com/index.html`
- Backend: `https://app.example.com/api/meals`
- Today meal API: `https://app.example.com/api/today-meal`
- Movement API: `https://app.example.com/api/female-exercises`

## Project structure

Core runtime:

- `index.html`: app shell and page structure for Today, Insights, Health/Food, Movement, profile drawer, and cart drawer
- `styles.css`: all visual styling, responsive mobile layout, card designs, icons, bottom nav, and PWA-safe polish
- `app.js`: frontend state, local storage, rendering, locale refresh, cart behavior, and API calls
- `i18n.js`: English, Chinese, and Russian UI copy plus phase/tag/meal-type translation helpers
- `server.py`: static file server plus backend APIs for meal ranking, today meal selection, movement recommendations, and care-plan generation

Backend data:

- `data/exercises.json`: local women-centered movement recommendation catalog and generated image mapping
- `data/recommendation-rules.json`: meal phase profiles, symptom-to-food tags, diet filters, cuisine rules, and query/scoring inputs

Visual assets:

- `assets/lunaplate-logo.png`: brand/profile logo used in the top bar and profile drawer
- `assets/movement/*.webp`: generated movement guide images referenced by `data/exercises.json`
- `assets/pwa/*.png`: install icons referenced by `manifest.webmanifest` and pre-cached by `sw.js`

PWA and deployment:

- `manifest.webmanifest`: mobile install metadata, app icons, theme color, and standalone display settings
- `sw.js`: service worker cache for app shell, install icons, and movement images; API requests stay network-first
- `render.yaml`: Render HTTPS deployment blueprint for running `python server.py`
- `requirements.txt`: intentionally empty dependency marker; LunaPlate currently uses only the Python standard library
- `.gitignore`: ignores generated Python cache files, compiled bytecode, and local `.env`

## Current scope

- Phase estimate from last period date and average cycle length
- Manual phase override
- Symptom check-in
- Vegetarian, vegan, gluten-free, and dairy-free filters
- Cook-time slider
- Pantry matching
- Python-backed TheMealDB integration
- Time-aware `/api/today-meal` recommendation for the Today screen
- Backend ranking over API recipes
- Python-backed generated movement recommendations
- Ranked meal cards with API ingredients, inferred cook time, and steps
- Grocery list stored in local storage
- General care note to keep the product wellness-focused, not diagnostic

## Next build steps

- Add user accounts and encrypted cycle history
- Add a nutrition data source for structured macro and micronutrient estimates, such as Spoonacular or Edamam
- Add clinician-reviewed content and red-flag routing
- Add recipe generation with stricter dietary/allergy validation
- Add localization and culturally specific meal packs
