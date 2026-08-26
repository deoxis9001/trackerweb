# stores/stateStore.js

État du run (sections cochées, items, autotrack).

---

## État réactif

| Champ | Type | Description |
|-------|------|-------------|
| `allLocations` | `Location[]` | Toutes les locations EMO (depuis `data/locations.js`, statique) |
| `allItems` | `[]` | Tableau statique vide (placeholder exposé) |
| `allRegions` | `[]` | Tableau statique vide (placeholder exposé) |
| `checkedSections` | `ref<Record<string, number>>` | `"Location/Section"` → nombre d'items collectés |
| `checkedLocations` | `ref<Set<number>>` | IDs numériques des locations cochées (legacy BizHawk) |
| `manualItems` | `ref<Record<string, number>>` | Items togglés manuellement `{ code: count }` |
| `autotrackItems` | `ref<Record<string, number>>` | Items détectés par BizHawk autotracking |
| `bizhawkConnected` | `ref<boolean>` | Connexion BizHawk active |
| `bizhawkFloor` | `ref<string\|null>` | Étage détecté par BizHawk |
| `activeView` | `ref<string>` | Vue active : `'overworld'` ou clé de donjon |
| `activeZone` | `ref<string\|null>` | Zone overworld active (hover/click zone) |
| `activePanel` | `ref<string>` | Panel actif : `'map'` \| `'items'` \| … (défaut `'map'`) |
| `hoveredPinLocs` | `ref<Location[]>` | Locations survolées sur la carte |
| `showSettings` | `ref<boolean>` | Panneau paramètres ouvert |
| `showRegionPopup` | `ref<boolean>` | Popup région ouverte |
| `showFaq` | `ref<boolean>` | FAQ ouverte (état exposé, sans action de toggle) |
| `dungeonEntranceMap` | `ref<Record<string, string>>` | slot → dungeon key (entrance shuffle) |
| `pinnedLocations` | `ref<string[]>` | Noms des locations épinglées (ordonnées) |
| `locationNotes` | `ref<Record<number, string>>` | `locId` → itemKey de la note |

---

## Computed

### `visibleLocations`

Retourne `allLocations` (toutes les locations, sans filtrage au niveau du store).

### `totalCount`

Nombre total d'items à collecter : somme des `item_count` (défaut 1) de toutes les sections de toutes les locations.

### `checkedCount`

Nombre d'items cochés, calculé depuis `checkedLocations` : pour chaque id présent, somme des `item_count` (défaut 1) des sections de `allLocations[id]`.

---

## Fonctions — Sections EMO

### `sectionKey(locationName, sectionName)`

Retourne `"locationName/sectionName"` — clé utilisée dans `checkedSections`.

### `getSectionCleared(locationName, sectionName)`

Retourne le nombre d'items collectés dans une section (0 par défaut).

### `setSectionCleared(locationName, sectionName, count)`

Force le compte d'une section et sauvegarde.

### `stepSection(locationName, sectionName, dir, maxCount)`

Incrémente (`dir=+1`) ou décrémente (`dir=-1`) le count de la section, clampé à `[0, maxCount]`, puis sauvegarde.

### `toggleSection(locationName, sectionName, maxCount = 1)`

Bascule la section entre 0 et `maxCount` (toggle complet) et sauvegarde.

### `isSectionCleared(locationName, sectionName, itemCount = 1)`

Retourne `true` si la section a atteint ou dépassé `itemCount` items collectés.

---

## Fonctions — Locations legacy (BizHawk)

### `toggleLocation(locationId)`

Ajoute ou retire un ID (converti en `Number`) de `checkedLocations`, puis sauvegarde.

### `isChecked(locationId)`

Retourne `true` si l'ID (converti en `Number`) est dans `checkedLocations`.

### `markLocationsChecked(ids)`

Ajoute plusieurs IDs à `checkedLocations` (appelé par BizHawk autotracking), puis sauvegarde.

---

## Fonctions — Entrances Shuffle

### `setDungeonEntrance(slot, dungeon)`

Assigne un donjon à un slot d'entrée (`dungeonEntranceMap[slot] = dungeon`).

### `clearDungeonEntrance(slot)`

Supprime l'assignation d'un slot.

### `resetDungeonEntrances()`

Vide toute la map d'entrées.

---

## Fonctions — Pinned Locations

### `pinLocation(name)`

Ajoute une location aux épinglées (si pas déjà présente), puis sauvegarde.

### `unpinLocation(name)`

Retire une location des épinglées, puis sauvegarde.

### `isPinned(name)`

Retourne `true` si la location est épinglée.

---

## Fonctions — Notes

### `setLocationNote(id, itemKey)`

Associe une note (itemKey) à une location, puis sauvegarde.

### `clearLocationNote(id)`

Supprime la note d'une location, puis sauvegarde.

---

## Fonctions — Actions globales

### `resetTracker()`

Remet à zéro : `checkedSections`, `checkedLocations`, `manualItems`, `locationNotes`, `dungeonEntranceMap`, puis sauvegarde.

### `setActiveView(view)`

Assigne la vue active et sauvegarde (`activeView` est persisté).

### `setActiveZone(zone)` / `setActivePanel(panel)`

Setters de navigation (zone, panel) — pas de sauvegarde.

### `setBizhawkFloor(floor)` / `setAutotrackItems(items)`

Setters pour l'état BizHawk (`bizhawkFloor`, `autotrackItems`).

### `toggleSettings()` / `toggleRegionPopup()`

Basculent `showSettings` / `showRegionPopup`.

> Note : `showFaq` est exposé mais il n'existe pas d'action `toggleFaq` dans le store.

---

## Persistence

### `saveState()`

Sérialise l'état dans `localStorage['tmc_state']`, débounced à 200ms.

Champs persistés : `checkedSections`, `checkedLocations` (converti en tableau), `manualItems`, `locationNotes`, `activeView`, `dungeonEntranceMap`, `pinnedLocations`.

### `loadState()`

Restaure l'état depuis `localStorage['tmc_state']`.

Appelé sur événement `storage` (synchro multi-onglets, uniquement quand `window` existe). Un `watch(manualItems, saveState, { deep: true })` déclenche aussi une sauvegarde à chaque changement des items manuels.
