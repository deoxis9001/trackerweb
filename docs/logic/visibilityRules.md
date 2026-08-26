# logic/visibilityRules.js

Évaluation des règles de visibilité des locations et sections sur la carte.

Contrairement aux `access_rules` (qui déterminent si un item est accessible), les `visibility_rules` et `restrict_visibility_rules` déterminent si une location ou un point de carte doit être **affiché** du tout.

---

## Fonctions internes

### `evalHasToken(key, settings)`

Mappe un token `$has|key` vers une valeur booléenne issue du `settingsStore`.

**Tokens supportés**

| Token | Source settings |
|-------|----------------|
| `fusionblue_vanilla` | `settings.blueFusionAccess === 'vanilla'` |
| `fusiongold_vanilla` | `settings.goldFusionAccess === 'vanilla'` |
| `fusiongreen_vanilla` | `settings.greenFusionAccess === 'vanilla'` |
| `fusionred_vanilla` | `settings.redFusionAccess === 'vanilla'` |
| `golden_enemy_on` | `settings.shuffleGoldEnemies` |
| `digging_on` | `settings.shuffleDigging` |
| `specialpot_on` | `settings.shufflePots` |
| `shopbag_extra_on` | `settings.extraShopItem` |
| `underwater_on` | `settings.shuffleUnderwater` |
| `rupees_on` | `settings.rupeesanity` |
| `hp_vanilla` | `settings.shuffleElements === 'vanilla'` |
| `ped_items_on` | `settings.pedReward !== 'none'` |
| `biggoron_shield` | `settings.biggoron === 'shield'` |
| `biggoron_mirror` | `settings.biggoron === 'mirror_shield'` |
| `dhc_closed` | `settings.dhcAccess === 'closed'` |
| `dhc_ped` | `settings.dhcAccess === 'pedestal'` |
| `dhc_open` / `dhc_open_fast` | `settings.dhcAccess === 'open'` |
| `dhc_fast_vaati` / `dhc_warp_vaati` | `true` (toujours visible) |
| `dungeonser_on` | `settings.dungeonEntranceShuffle` |
| `dungeonser_off` | `!settings.dungeonEntranceShuffle` |
| `cucco_N` | `settings.cuccoRounds >= N` |
| `goron_N` | `settings.goronSets >= N` |
| tout le reste | `true` (token inconnu = visible par défaut) |

---

### `evalRule(rule, settings, callLua?)`

Évalue une règle AND (tokens séparés par `,`).

**Formats de token**

| Format | Comportement |
|--------|--------------|
| `$has\|key` | Appelle `evalHasToken(key, settings)` |
| `$FuncName` | Appelle `callLua('FuncName')` si fourni, sinon `true` |
| autre | `true` (ignoré) |

---

## Fonctions exportées

### `evalRules(rules, settings, callLua?)`

Évalue un tableau de règles de visibilité OR (au moins une doit passer).

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `rules` | `string[]` | Tableau de règles (ex. : `visibility_rules` d'une section) |
| `settings` | `settingsStore` | Store des paramètres |
| `callLua` | `(name) => boolean` | Optionnel — résout les tokens `$FuncName` |

**Retourne** `boolean` — `true` si la location/section doit être affichée. Si `rules` est vide ou null, retourne `true`.

**Utilisé dans MapView pour**

- Filtrer les sections visibles avant d'appeler `locationAccessibility`
- Filtrer les `map_locations` via `restrict_visibility_rules`
- Décider si une location doit apparaître sur la carte du tout
