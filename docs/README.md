# TMCR Tracker Web — Documentation

Documentation des fonctions et modules du tracker.

## Modules

### Logique (`src/logic/`)

| Fichier | Doc |
|---------|-----|
| `accessibility.js` | [logic/accessibility.md](logic/accessibility.md) |
| `visibilityRules.js` | [logic/visibilityRules.md](logic/visibilityRules.md) |
| `itemProvider.js` | [logic/itemProvider.md](logic/itemProvider.md) |
| `luaEngine.js` | [logic/luaEngine.md](logic/luaEngine.md) |
| `logicParser.js` | [logic/logicParser.md](logic/logicParser.md) |
| `settingsString.js` | [logic/settingsString.md](logic/settingsString.md) |
| `presetMapper.js` | [logic/presetMapper.md](logic/presetMapper.md) |
| `defaultLogic.js` | [logic/defaultLogic.md](logic/defaultLogic.md) |

### Stores (`src/stores/`)

| Fichier | Doc |
|---------|-----|
| `stateStore.js` | [stores/stateStore.md](stores/stateStore.md) |
| `settingsStore.js` | [stores/settingsStore.md](stores/settingsStore.md) |

### Données & composables

| Fichier | Doc |
|---------|-----|
| `src/data/locations.js` | [data/locations.md](data/locations.md) |
| `src/metadata/itemImages.js` | [metadata/itemImages.md](metadata/itemImages.md) |
| `src/composables/useLocale.js` | [composables/useLocale.md](composables/useLocale.md) |
| `src/composables/useFont.js` | [composables/useFont.md](composables/useFont.md) |

### Vues (`src/views/`)

| Fichier | Doc |
|---------|-----|
| `MainTracker.vue` | [views/MainTracker.md](views/MainTracker.md) |
| `SettingsView.vue` | [views/SettingsView.md](views/SettingsView.md) |
| `BroadcastView.vue` | [views/BroadcastView.md](views/BroadcastView.md) |
| `ChangelogView.vue` | [views/ChangelogView.md](views/ChangelogView.md) |

### Composants (`src/components/`)

| Fichier | Doc |
|---------|-----|
| `MapView.vue` | [components/MapView.md](components/MapView.md) |
| `CheckList.vue` | [components/CheckList.md](components/CheckList.md) |
| `LocationTreeNode.vue` | [components/LocationTreeNode.md](components/LocationTreeNode.md) |
| `ItemGrid.vue` | [components/ItemGrid.md](components/ItemGrid.md) |
| `LogicSettingsTab.vue` | [components/LogicSettingsTab.md](components/LogicSettingsTab.md) |
| `DungeonMaps.vue` | [components/DungeonMaps.md](components/DungeonMaps.md) |
| `NavBar.vue` | [components/NavBar.md](components/NavBar.md) |
| `PinnedLocations.vue` | [components/PinnedLocations.md](components/PinnedLocations.md) |
| `ItemNotePicker.vue` | [components/ItemNotePicker.md](components/ItemNotePicker.md) |
| `FaqPanel.vue` | [components/FaqPanel.md](components/FaqPanel.md) |

### Racine

| Fichier | Doc |
|---------|-----|
| `src/App.vue` | [App.md](App.md) |
| `src/main.js` | [main.md](main.md) |

## Architecture globale

```
settingsStore ─┐
stateStore   ──┴─► itemProvider ──► luaEngine
                        │               │
                        └─── provider ──┘
                               │
settingsStore ─────────────────┤   (visibility_rules → filtrage direct)
(visibilité)                   ▼
                    accessibility computed
                               │
                          MapView pins
```

1. `settingsStore` stocke les paramètres rando (tricks, fusions, warps, wind crests, dungeon shuffle, etc.)
2. `stateStore` stocke l'état du run (sections cochées, items manuels, autotrack BizHawk)
3. `prepareProvider(state, settings)` construit un provider à partir des **deux stores** : il expose item counts + section availability au moteur Lua. Les valeurs de `settingsStore` (tricks, fusions, warps, wind crests, dungeon shuffle) sont résolues par le provider et donc consommées par le moteur Lua via `has(code)` → `Tracker:ProviderCountForCode(code)`.
4. `luaEngine` exécute les fonctions Lua de logique (Json_* wrappers) via Fengari (Lua en WASM), en interrogeant le provider
5. `evaluateRules()` / `locationAccessibility()` calculent le niveau d'accessibilité de chaque location
6. `MapView` construit les pins SVG colorés selon le résultat

> `settingsStore` alimente aussi **directement** `accessibility`, sans passer par Lua, pour le filtrage de visibilité des sections (`evalRules(s.visibility_rules, settings)`).
