# Stores Pinia

---

## stateStore

`src/stores/stateStore.js` — état du run (sections cochées, items, autotrack).

### État réactif

| Champ | Type | Description |
|-------|------|-------------|
| `allLocations` | `Location[]` | Toutes les locations EMO (depuis `data/locations.js`, statique) |
| `checkedSections` | `ref<Record<string, number>>` | `"Location/Section"` → nombre d'items collectés |
| `checkedLocations` | `ref<Set<number>>` | IDs numériques des locations cochées (legacy BizHawk) |
| `manualItems` | `ref<Record<string, number>>` | Items togglés manuellement `{ code: count }` |
| `autotrackItems` | `ref<Record<string, number>>` | Items détectés par BizHawk autotracking |
| `bizhawkConnected` | `ref<boolean>` | Connexion BizHawk active |
| `bizhawkFloor` | `ref<string\|null>` | Étage détecté par BizHawk |
| `activeView` | `ref<string>` | Vue active : `'overworld'` ou clé de donjon |
| `activeZone` | `ref<string\|null>` | Zone overworld active (hover/click zone) |
| `activePanel` | `ref<string>` | Panel actif : `'map'` \| `'items'` \| … |
| `hoveredPinLocs` | `ref<Location[]>` | Locations survolées sur la carte |
| `showSettings` | `ref<boolean>` | Panneau paramètres ouvert |
| `showRegionPopup` | `ref<boolean>` | Popup région ouverte |
| `showFaq` | `ref<boolean>` | FAQ ouverte |
| `dungeonEntranceMap` | `ref<Record<string, string>>` | slot → dungeon key (entrance shuffle) |
| `pinnedLocations` | `ref<string[]>` | Noms des locations épinglées (ordonnées) |
| `locationNotes` | `ref<Record<number, string>>` | `locId` → itemKey de la note |

---

### Fonctions — Sections EMO

#### `sectionKey(locationName, sectionName)`

Retourne `"locationName/sectionName"` — clé utilisée dans `checkedSections`.

#### `getSectionCleared(locationName, sectionName)`

Retourne le nombre d'items collectés dans une section (0 par défaut).

#### `setSectionCleared(locationName, sectionName, count)`

Force le compte d'une section et sauvegarde.

#### `stepSection(locationName, sectionName, dir, maxCount)`

Incrémente (`dir=+1`) ou décrémente (`dir=-1`) le count de la section, clampé à `[0, maxCount]`.

#### `toggleSection(locationName, sectionName, maxCount?)`

Bascule la section entre 0 et `maxCount` (toggle complet).

#### `isSectionCleared(locationName, sectionName, itemCount?)`

Retourne `true` si la section a atteint ou dépassé `itemCount` items collectés.

---

### Fonctions — Locations legacy (BizHawk)

#### `toggleLocation(locationId)`

Ajoute ou retire un ID de `checkedLocations`.

#### `isChecked(locationId)`

Retourne `true` si l'ID est dans `checkedLocations`.

#### `markLocationsChecked(ids)`

Ajoute plusieurs IDs à `checkedLocations` (appelé par BizHawk autotracking).

---

### Fonctions — Entrances Shuffle

#### `setDungeonEntrance(slot, dungeon)`

Assigne un donjon à un slot d'entrée (`dungeonEntranceMap[slot] = dungeon`).

#### `clearDungeonEntrance(slot)`

Supprime l'assignation d'un slot.

#### `resetDungeonEntrances()`

Vide toute la map d'entrées.

---

### Fonctions — Pinned Locations

#### `pinLocation(name)`

Ajoute une location aux épinglées (si pas déjà présente).

#### `unpinLocation(name)`

Retire une location des épinglées.

#### `isPinned(name)`

Retourne `true` si la location est épinglée.

---

### Fonctions — Notes

#### `setLocationNote(id, itemKey)`

Associe une note (itemKey) à une location.

#### `clearLocationNote(id)`

Supprime la note d'une location.

---

### Fonctions — Actions globales

#### `resetTracker()`

Remet tout à zéro : sections, locations, items, notes, entrances.

#### `setActiveView(view)` / `setActiveZone(zone)` / `setActivePanel(panel)`

Setters pour la navigation (view, zone, panel).

---

### Persistence

#### `saveState()`

Sérialise l'état dans `localStorage['tmc_state']`, débounced à 200ms.

Champs persistés : `checkedSections`, `checkedLocations`, `manualItems`, `locationNotes`, `activeView`, `dungeonEntranceMap`, `pinnedLocations`.

#### `loadState()`

Restaure l'état depuis `localStorage['tmc_state']`.

Appelé au démarrage et sur événement `storage` (synchro multi-onglets).

---

## settingsStore

`src/stores/settingsStore.js` — paramètres du randomizer.

### Tricks

| Champ | Type | Description |
|-------|------|-------------|
| `tricks` | `ref<Set<string>>` | Set des trick keys activés |

#### `hasTrick(key)` — retourne `true` si le trick est dans le Set
#### `toggleTrick(key)` — ajoute/retire un trick
#### `setAllTricks(enabled)` — active ou désactive tous les tricks d'un coup

Tricks disponibles définis dans `TRICKS` (export) : `bomb_dust`, `mushroom`, `arrows_break`, `bobomb_walls`, `likelike_swordless`, `boots_guards`, `beam_crenel_switch`, `downthrust_beetle`, `dark_rooms`, `cape_extensions`, `lake_minish`, `cabin_swim`, `sharks_swordless`, `pow_nocane`, `pot_puzzle`, `fow_pot`, `dhc_cannons`, `dhc_clones`, `dhc_spin`.

---

### Paramètres principaux

| Champ | Défaut | Valeurs |
|-------|--------|---------|
| `goal` | `'vaati'` | `'vaati'` \| `'pedestal'` |
| `dhcAccess` | `'pedestal'` | `'closed'` \| `'pedestal'` \| `'open'` |
| `pedElements` | `4` | 0–4 |
| `pedSwords` | `5` | 0–5 |
| `pedDungeons` | `0` | 0–6 |
| `pedFigurines` | `0` | 0–136 |
| `shuffleElements` | `'dungeon_prize'` | `'vanilla'` \| `'dungeon_prize'` \| `'anywhere'` |
| `dungeonSmallKeys` | `'own_dungeon'` | `'own_dungeon'` \| `'anywhere'` |
| `dungeonBigKeys` | `'own_dungeon'` | `'own_dungeon'` \| `'anywhere'` |
| `dungeonMaps` | `'own_dungeon'` | `'own_dungeon'` \| `'anywhere'` \| `'start_with'` |
| `dungeonCompasses` | `'own_dungeon'` | idem |
| `nonElementDungeons` | `'standard'` | `'standard'` \| `'excluded'` |
| `rupeesanity` | `false` | bool |
| `shufflePots` | `false` | bool |
| `shuffleDigging` | `false` | bool |
| `shuffleUnderwater` | `false` | bool |
| `shuffleGoldEnemies` | `false` | bool |
| `biggoron` | `'disabled'` | `'disabled'` \| `'shield'` \| `'mirror_shield'` |
| `cuccoRounds` | `1` | 0–10 |
| `goronSets` | `0` | 0–5 |
| `extraShopItem` | `false` | bool |
| `pedReward` | `'none'` | `'none'` \| `'dhc_big_key'` \| `'random_item'` |
| `goldFusionAccess` | `'vanilla'` | `'closed'` \| `'vanilla'` \| `'combined'` \| `'open'` |
| `redFusionAccess` | `'open'` | idem |
| `blueFusionAccess` | `'open'` | idem |
| `greenFusionAccess` | `'open'` | idem |
| `dungeonEntranceShuffle` | `false` | bool |
| `warpDWS/CoF/FoW/ToD/PoW/DHC` | `0` | `0`=none `1`=blue `2`=red `3`=both |
| `windCrestCrenel/Falls/Clouds/Castor/SouthField/MinishWoods` | `false` | bool |
| `logicSource` | `'default_logic'` | `'default_logic'` \| `'custom'` |
| `randoDefines` | `null` | `Record<string, any>` \| `null` |

---

### Serialisation

#### `exportSettings()`

Sérialise tous les paramètres en objet plain JS. Utilisé pour `save()` et pour comparer dans le `watch()` de debounce.

#### `importSettings(s)`

Restaure les paramètres depuis un objet plain. Utilisé par `load()` et le preset importer.

#### `save()` / `load()`

Persistence dans `localStorage['tmc_settings']`. `save()` est appelé automatiquement via un `watch` débounced à 300ms sur `exportSettings()`.
