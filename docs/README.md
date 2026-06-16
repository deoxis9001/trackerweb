# TMCR Tracker Web — Documentation

Documentation des fonctions et modules du tracker.

## Modules

| Fichier | Doc |
|---------|-----|
| `src/logic/accessibility.js` | [logic-accessibility.md](logic-accessibility.md) |
| `src/logic/visibilityRules.js` | [logic-visibilityRules.md](logic-visibilityRules.md) |
| `src/logic/itemProvider.js` | [logic-itemProvider.md](logic-itemProvider.md) |
| `src/logic/luaEngine.js` | [logic-luaEngine.md](logic-luaEngine.md) |
| `src/stores/stateStore.js` | [stores.md](stores.md#statestore) |
| `src/stores/settingsStore.js` | [stores.md](stores.md#settingsstore) |
| `src/components/MapView.vue` | [MapView-functions.md](MapView-functions.md) |

## Architecture globale

```
settingsStore ──────────────────────────────────┐
stateStore   ──► itemProvider ──► luaEngine     │
                      │               │          │
                      └───────────────┘          │
                             │                   │
                    accessibility computed ◄──────┘
                             │
                        MapView pins
```

1. `settingsStore` stocke les paramètres rando (tricks, fusions, shuffle, etc.)
2. `stateStore` stocke l'état du run (sections cochées, items manuels, autotrack BizHawk)
3. `prepareProvider()` construit un provider qui expose item counts + section availability au moteur Lua
4. `luaEngine` exécute les fonctions Lua de logique (Json_* wrappers) via Fengari (Lua en WASM)
5. `evaluateRules()` / `locationAccessibility()` calculent le niveau d'accessibilité de chaque location
6. `MapView` construit les pins SVG colorés selon le résultat
