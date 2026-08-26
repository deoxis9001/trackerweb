# main.js

Point d'entrée Vue : instancie l'app, branche Pinia et Vue Router, importe le CSS Bootstrap, monte `App` puis charge l'état persistant.

---

## Rôle

- Crée l'app depuis `App.vue` et enregistre Pinia (`createPinia`) puis le router.
- Router en `createWebHashHistory` avec 3 routes : `/` → `MainTracker` (`tracker`), `/broadcast` → `BroadcastView`, `/changelog` → `ChangelogView`.
- Importe `bootstrap/dist/css/bootstrap.min.css`.
- Monte sur `#app`, puis (Pinia prêt) charge l'état persistant : `useSettingsStore().load()` et `useStateStore().loadState()`.

---

## Stores utilisés

- `settingsStore` — `load()` (settings persistés `tmc_settings`).
- `stateStore` — `loadState()` (état du run persisté `tmc_state`).
