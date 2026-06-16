# Plan — Reboot TMC Tracker Web

## Context

Repartir sur une base propre (branche `reboot`) en utilisant les JSON du repo
`tmcrando_maptracker_deoxis` (latest, 14-06-2026) comme source de données canonique.

**Conservé :** couleurs (`App.vue` CSS vars), système de langues (`src/langue/`),
interface existante (NavBar, ItemGrid, CheckList, MapView, AP connect).

**Change :** fondation des données, pipeline de génération, layout mobile.

---

## Étapes

### 1. Branche + référence repo

- `git checkout main && git checkout -b reboot`
- Cloner deoxis dans `src_ref/tmcrando_maptracker_deoxis/` (pas commité — ajouter à `.gitignore`)
- Inspecter les JSON du repo : relever la structure exacte (locations, items, map coords, règles)

### 2. Définir le schéma de données cible

Après inspection des JSON deoxis, définir avec l'utilisateur le format des fichiers `data/` :
- `data/locations.json` — id, name, map, x, y, region, rule_key
- `data/items.json` — id, key, name, image
- `data/map_coords.json` — coordonnées overworld et donjons

Le schéma final sera validé avant tout script.

### 3. Pipeline de données

- Adapter ou réécrire `scripts/extract_tmc_data.py` pour lire les JSON deoxis
  et produire les fichiers `data/` dans le nouveau schéma
- Supprimer les JSON `data/` actuels et les régénérer depuis deoxis

### 4. Layout mobile (swipe)

Modifier `src/views/MainTracker.vue` :
- **PC** : layout existant inchangé (left panel items + right panel map/checklist)
- **Mobile** (`max-width: 768px`) : 3 panneaux en rangée (Items / Carte / Checks),
  swipe touch horizontal via `touch-start` / `touch-end`, indicateur de page (dots)

### 5. Vérification

- `npm run dev` → tester sur PC (Chrome, layout intact)
- DevTools mobile (iPhone SE, Pixel 5) → tester swipe entre les 3 vues
- Vérifier que la logique d'accessibilité s'applique correctement avec les nouvelles données
- Vérifier les langues (FR/EN/DE/ES/IT) sur les deux layouts

---

## Fichiers touchés

- `src/views/MainTracker.vue` — layout mobile
- `scripts/extract_tmc_data.py` — pipeline données
- `data/*.json` — régénérés
- `.gitignore` — ajouter `src_ref/`
- `CLAUDE.md` — déjà créé ✅
