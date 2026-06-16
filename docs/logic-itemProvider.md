# logic/itemProvider.js

Construit le "provider" qui expose l'état du tracker au moteur Lua.

Le provider est l'interface entre les stores Vue (état du run + paramètres) et les fonctions Lua de logique.

---

## Constantes

### `STAGE_CODE_MAP`

```js
const STAGE_CODE_MAP = {}  // { [stageCode]: { parentCode, minStage } }
```

Construit au chargement depuis `items_spec.json`. Mappe les codes de stade d'un item progressif vers `{ parentCode, minStage }`.

**Exemple** : pour une épée progressive avec 5 stades, `sword_1` → `{ parentCode: 'sword', minStage: 1 }`.

Utilisé dans `itemCount()` pour résoudre `has(sword_1)` = `itemCount('sword') >= 1`.

---

### `FUSION_DEFINES`

```js
const FUSION_DEFINES = {
  gold:  ['GOLD_FUSION_SETTING',  { NO_GOLD_FUSIONS: 'closed', ... }],
  red:   ['RED_FUSION_SETTING',   { NO_RED_FUSIONS:  'closed', ... }],
  blue:  ['BLUE_FUSION_SETTING',  { NO_BLUE_FUSIONS: 'closed', ... }],
  green: ['GREEN_FUSION_SETTING', { NO_GREEN_FUSIONS:'closed', ... }],
}
```

Mappe couleur de fusion → `[defineName, valueMap]`. Permet de lire l'accès aux fusions soit depuis `randoDefines` (preset importé), soit directement depuis le store.

---

### `TRICK_CODES`

```js
const TRICK_CODES = {
  'blowdust': ['BLOWDUST_SETTING', 'GUSTBOMBS', 'bomb_dust'],
  // ... 18 tricks au total
}
```

Mappe le nom de base Lua d'un trick → `[defineName, enabledValue, trickKey]`.

- `defineName` : clé dans `randoDefines` (ex. `BLOWDUST_SETTING`)
- `enabledValue` : valeur dans `randoDefines` quand le trick est actif (ex. `GUSTBOMBS`)
- `trickKey` : clé dans `settingsStore.tricks` Set (ex. `bomb_dust`)

---

## Fonctions internes

### `levelFromLuaLevel(luaLevel)`

Convertit un niveau Lua numérique en niveau string.

| luaLevel | niveau |
|----------|--------|
| 2 | `'sequence-break'` |
| 3 | `'inspect'` |
| autre | `'normal'` |

---

### `isTrickEnabled(settingsStore, base)`

Vérifie si un trick est actif.

Priorité : `randoDefines[defineName] === enabledValue` d'abord, puis `settingsStore.hasTrick(trickKey)` en fallback.

---

### `fusionAccess(settingsStore, color)`

Retourne le mode d'accès aux fusions pour une couleur (`'closed'` | `'vanilla'` | `'combined'` | `'open'`).

Priorité : `randoDefines[defineName]` mappé via `FUSION_DEFINES`, puis `settingsStore.${color}FusionAccess`.

---

### `makeProvider(stateStore, settingsStore)`

Construit et retourne l'objet provider.

**Méthodes du provider**

#### `getFusionCombined(color)`

Retourne `true` si `fusionAccess(color) === 'combined'`. Exposé aux globals Lua `fusioncombined*`.

#### `itemCount(code)`

Retourne le count numérique d'un item/code pour le moteur Lua (`Tracker:ProviderCountForCode`).

Ordre de résolution :

1. Codes de fusion hardcodés (`fusionred_removed`, `fusionred_vanilla`, `fusionred_complet`, etc.)
2. Wind crests (`crenelwindcrest_yes`, etc.)
3. Dungeon warps (`dws_warps_blue`, etc.)
4. Dungeon entrance shuffle (`dungeonser_off/on`, codes `dws_cof`, etc.)
5. Tricks : suffix `_out_on` → 1 si trick activé ; `_off` → 1 si désactivé ; `_on` → toujours 0
6. Fallback `_off` → 1 / `_on` → 0 (pour codes de settings non reconnus)
7. `STAGE_CODE_MAP` — item progressif
8. `manualItems[code] + autotrackItems[code]` — item manuel/autotrack

#### `sectionAvailable(code)`

Interprète les codes `@Location Name/Section Name` utilisés par `FindObjectForCode`.

Retourne `1` si la section a encore des items restants, `0` si cleared.

#### `callFunction(name)`

Appelle la fonction Lua via `callLuaFunction(name)` et retourne `{ count, level }`.

#### `locationReachable(_name)`

Toujours `false` — non implémenté (placeholder).

---

## Fonctions exportées

### `prepareProvider(stateStore, settingsStore)`

Construit le provider, l'injecte dans `luaEngine` via `setProvider()`, et vide les caches Lua via `resetCache()`.

**À appeler une fois avant chaque recalcul complet de l'accessibilité** (dans le computed `accessibility` de MapView).

**Retourne** le provider construit.
