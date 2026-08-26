# stores/settingsStore.js

Paramètres du randomizer.

---

## Tricks

| Champ | Type | Description |
|-------|------|-------------|
| `tricks` | `ref<Set<string>>` | Set des trick keys activés |

- `hasTrick(key)` — retourne `true` si le trick est dans le Set
- `toggleTrick(key)` — ajoute/retire un trick
- `setAllTricks(enabled)` — active ou désactive tous les tricks d'un coup

Tricks disponibles définis dans `TRICKS` (export) : `bomb_dust`, `mushroom`, `arrows_break`, `bobomb_walls`, `likelike_swordless`, `boots_guards`, `beam_crenel_switch`, `downthrust_beetle`, `dark_rooms`, `cape_extensions`, `lake_minish`, `cabin_swim`, `sharks_swordless`, `pow_nocane`, `pot_puzzle`, `fow_pot`, `dhc_cannons`, `dhc_clones`, `dhc_spin`.

Côté Lua, les tricks sont interrogés via `has()` exactement comme les items : les scripts de logique appellent `has("<base>_on")` / `has("<base>_off")` / `has("<base>_out_on")` (ex. `has("blowdust_out_on")`). Ces codes sont résolus par `itemCount()` d'`itemProvider.js` via le mapping `TRICK_CODES` (nom de base Lua → trick key du Set) — voir [logic/itemProvider.md](../logic/itemProvider.md) pour le détail des suffixes.

---

## Goal & Pedestal

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `goal` | `'vaati'` | `'vaati'` \| `'pedestal'` |
| `dhcAccess` | `'pedestal'` | `'closed'` \| `'pedestal'` \| `'open'` |
| `pedElements` | `4` | 0–4 |
| `pedSwords` | `5` | 0–5 |
| `pedDungeons` | `0` | 0–6 |
| `pedFigurines` | `0` | 0–136 |
| `pedReward` | `'none'` | `'none'` \| `'dhc_big_key'` \| `'random_item'` |

---

## Dungeon Shuffle

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `shuffleElements` | `'dungeon_prize'` | `'vanilla'` \| `'dungeon_prize'` \| `'anywhere'` |
| `dungeonSmallKeys` | `'own_dungeon'` | `'own_dungeon'` \| `'anywhere'` |
| `dungeonBigKeys` | `'own_dungeon'` | `'own_dungeon'` \| `'anywhere'` |
| `dungeonMaps` | `'own_dungeon'` | `'own_dungeon'` \| `'anywhere'` \| `'start_with'` |
| `dungeonCompasses` | `'own_dungeon'` | `'own_dungeon'` \| `'anywhere'` \| `'start_with'` |
| `nonElementDungeons` | `'standard'` | `'standard'` \| `'excluded'` |

---

## Location Shuffle

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `rupeesanity` | `false` | bool |
| `shufflePots` | `false` | bool |
| `shuffleDigging` | `false` | bool |
| `shuffleUnderwater` | `false` | bool |
| `shuffleGoldEnemies` | `false` | bool |
| `biggoron` | `'disabled'` | `'disabled'` \| `'shield'` \| `'mirror_shield'` |
| `cuccoRounds` | `1` | 0–10 |
| `goronSets` | `0` | 0–5 |
| `goronJPPrices` | `false` | bool |
| `extraShopItem` | `false` | bool |
| `shuffleSanctuary` | `false` | bool (pas encore dans le rando — désactivé par défaut) |

---

## Difficulté

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `startingHearts` | `3` | 1–20 |
| `heartContainers` | `6` | 0–20 |
| `pieceOfHearts` | `11` | 0–20 |
| `earlyWeapon` | `false` | bool |

---

## Armes (Weapons)

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `weaponBow` | `false` | bool |
| `weaponBomb` | `0` | `0`=no, `1`=yes, `2`=yes+boss |
| `weaponGust` | `false` | bool |
| `weaponLantern` | `false` | bool |

---

## Progressive Items

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `progressiveSword` | `true` | bool |
| `progressiveBow` | `true` | bool |
| `progressiveBoomerang` | `true` | bool |
| `progressiveShield` | `true` | bool |
| `progressiveScroll` | `true` | bool |
| `randomBottleContents` | `false` | bool |

---

## Fusions (Kinstones)

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `goldFusionAccess` | `'vanilla'` | `'closed'` \| `'vanilla'` \| `'combined'` \| `'open'` |
| `redFusionAccess` | `'open'` | `'closed'` \| `'vanilla'` \| `'combined'` \| `'open'` |
| `blueFusionAccess` | `'open'` | `'closed'` \| `'vanilla'` \| `'combined'` \| `'open'` |
| `greenFusionAccess` | `'open'` | `'closed'` \| `'vanilla'` \| `'combined'` \| `'open'` |
| `cloudKinstoneMultiplier` | `1` | 1–9 |
| `swampKinstoneMultiplier` | `1` | 1–3 |

---

## Dungeon Warps

Chaque warp : `0`=none, `1`=blue, `2`=red, `3`=both.

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `warpDWS` | `0` | 0–3 |
| `warpCoF` | `0` | 0–3 |
| `warpFoW` | `0` | 0–3 |
| `warpToD` | `0` | 0–3 |
| `warpPoW` | `0` | 0–3 |
| `warpDHC` | `0` | 0–3 |

---

## Wind Crests

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `windCrestCrenel` | `false` | bool |
| `windCrestFalls` | `false` | bool |
| `windCrestClouds` | `false` | bool |
| `windCrestCastor` | `false` | bool (Castor Wilds) |
| `windCrestSouthField` | `false` | bool |
| `windCrestMinishWoods` | `false` | bool |

---

## Entrance Shuffle

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `dungeonEntranceShuffle` | `false` | bool |

---

## QoL / Affichage (Tracker Display & Quality of Life)

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `showInaccessible` | `false` | bool |
| `autoTabDungeons` | `'overview'` | `'non'` \| `'overview'` \| `'etage'` |
| `autoTabOverworld` | `'non'` | `'non'` \| `'oui'` |
| `ocarinaOnSelect` | `true` | bool |
| `bootsOnL` | `true` | bool |
| `bootsAsMinish` | `false` | bool |
| `bigOctoManipulation` | `true` | bool |
| `replicaTODBossDoor` | `true` | bool |
| `trapsEnabled` | `false` | bool |

---

## Custom Logic

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `logicSource` | `'default_logic'` | `'default_logic'` \| `'custom'` |
| `customLogicText` | `null` | Texte brut d'un `.logic` importé — **non persisté** (session uniquement, peut être volumineux) |
| `randoDefines` | `null` | `Record<string, bool\|string\|number>` \| `null` (`null` = non initialisé, fallback logique rando par défaut) |

---

## Serialisation

### `exportSettings()`

Sérialise tous les paramètres en objet plain JS (`tricks` sérialisé en tableau). Utilisé pour `save()` et pour comparer dans le `watch()` de debounce.

> `customLogicText` n'est **pas** inclus dans `exportSettings()` (donc non persisté).

### `importSettings(s)`

Restaure les paramètres depuis un objet plain. `tricks` est reconstruit en `Set`, les autres refs ne sont écrasées que si `s[k] != null`, et `randoDefines` est restauré si la clé est présente. Utilisé par `load()` et le preset importer.

> `customLogicText` n'est **pas** restauré par `importSettings()`.

### `save()` / `load()`

Persistence dans `localStorage['tmc_settings']`. `save()` est appelé automatiquement via un `watch` débounced à 300ms sur `exportSettings()`. `load()` est protégé par un `try/catch` silencieux.
