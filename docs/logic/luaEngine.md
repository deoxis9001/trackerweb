# logic/luaEngine.js

Moteur Lua embarqué via [Fengari](https://github.com/fengari-lua/fengari) (Lua 5.3 compilé en WASM/JS).

Charge et exécute les scripts de logique du submodule `tmcrando_maptracker_deoxis`.

---

## Architecture

```
luaEngine.js
│
├── LUA_FILES[] — 50+ fichiers .lua importés en raw string via Vite ?raw
│   ├── scripts/logic/common/   — helpers (Function, Access, Elements, Fusion, Settings…)
│   ├── scripts/logic/dungeons/ — logique par donjon
│   ├── scripts/logic/overworld/ — logique par zone
│   └── emo/scripts/locations/  — Json_* wrapper functions (lues par access_rules)
│
├── Singleton L — état Lua (luaL_newstate), null jusqu'au premier appel
└── Singleton _provider — provider injecté par setProvider()
```

Les fichiers sont chargés dans l'ordre : les helpers `common/` en premier, puis `dungeons/`, `overworld/`, puis les wrappers `locations/` (qui dépendent des helpers).

---

## Fonctions internes

### `runLua(code, chunkName)`

Charge et exécute un bloc de code Lua dans l'état `L`.

- Utilise `luaL_loadbuffer` + `lua_pcall`
- Log les erreurs en console sans throw
- Retourne `true` si succès, `false` si erreur

---

### `setupTracker()`

Crée la table globale Lua `Tracker` avec les méthodes :

#### `Tracker:ProviderCountForCode(code)`

Appelle `_provider.itemCount(code)` → retourne un nombre Lua.

#### `Tracker:FindObjectForCode(code)`

Appelle `_provider.sectionAvailable(code)` et `_provider.itemCount(code)`.
Retourne une table Lua `{ AvailableChestCount, CurrentStage }`.

#### `Tracker.BulkUpdate`

Toujours `false` — désactive les optimisations batch du tracker EmoTracker original.

---

### `initGlobals()`

Initialise (via un bloc `runLua`) les nombreuses tables de cache et variables globales attendues par les scripts de logique. Principales catégories :

- Tables de cache : `has_item_data`, `function_data`, `function_data_fusion`, `function_count`, ainsi que les variantes dev (`has_item_data_dev`, `has_item_option_dev`) et les `setting_preset_data*`
- Flags de version : `PopVersion = true`, `VERSION_ALPHA = false`, `VERSION_BETA = true`
- `AccessibilityLevel = { None = 0, SequenceBreak = 2, Inspect = 3 }`
- Stubs pour les items de fusion combinée (`redW`, `blueL`, `greenC`, etc.) — remplacés ensuite par `setupFusionCombined()`
- `swordprogress`, `redflag`, `blueflag` — stubs ou nil

---

### `setupFusionCombined()`

Crée les globales Lua `fusionredcombined`, `fusiongreencombined`, `fusionbluecombined`, `fusiongoldcombined`.

Chaque table expose `getActive()` → appelle `_provider.getFusionCombined(color)`.

---

### `initEngine()`

Initialise l'état Lua complet (appelé une seule fois, lazy) :

1. `luaL_newstate()` + `luaL_openlibs()` — état Lua standard
2. `setupTracker()` → table `Tracker`
3. `initGlobals()` → variables globales
4. `setupFusionCombined()` → tables fusion
5. Charge tous les `LUA_FILES` via `runLua()`
6. Override de `has()` — bypass le cache `has_item_data` de `Function.lua` pour toujours lire live depuis `Tracker:ProviderCountForCode`

---

### `ensureInit()`

Appelle `initEngine()` si `L === null`. Appelé au début de `resetCache()` et `callLuaFunction()`.

---

## Fonctions exportées

### `setProvider(provider)`

Injecte le provider courant dans le singleton `_provider`. Doit être appelé avant chaque recalcul d'accessibilité.

---

### `resetCache()`

Appelle d'abord `ensureInit()` (initialise le moteur au premier appel), puis vide les caches Lua (`has_item_data`, `function_data`, `function_data_fusion`, `function_count`).

**À appeler après chaque changement d'état** (items, settings) pour forcer le recalcul des fonctions Lua. Appelé automatiquement par `prepareProvider()`.

---

### `callLuaFunction(name)`

Appelle une fonction Lua par nom et retourne `{ count, luaLevel }`.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Nom de la fonction Lua globale (ex. `Json_DWS_BossKey`) |

**Retourne**

```js
{ count: 0|1, luaLevel: 0|2|3 }
// luaLevel: 0=normal, 2=SequenceBreak, 3=Inspect
```

Les fonctions Json_* retournent `(count [, AccessibilityLevel.*])`.

- Si la fonction n'existe pas → `{ count: 0, luaLevel: 0 }`
- Si erreur Lua → log warning + `{ count: 0, luaLevel: 0 }`
