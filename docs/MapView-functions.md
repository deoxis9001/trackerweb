# MapView.vue — Fonctions clés

`src/components/MapView.vue` — composant principal d'affichage de la carte avec les pins SVG.

---

## Constantes

### `PIN_COLOR`

```js
const PIN_COLOR = {
  accessible:   '#7ac038',  // vert
  out_of_logic: '#d4901a',  // orange
  inaccessible: '#d82828',  // rouge
  checked:      '#606060',  // gris (location completée)
}
```

### `SEC_DOT_COLOR`

```js
const SEC_DOT_COLOR = {
  accessible:   '#7ac038',
  out_of_logic: '#d4901a',
  inaccessible: '#d82828',
  cleared:      '#4488cc',  // bleu (section vidée dans le popup)
}
```

---

## Fonctions de mapping

### `levelToPinStatus(level)`

Convertit un niveau d'accessibilité en statut pin (clé de `PIN_COLOR`).

| `level` | retourne |
|---------|----------|
| `'normal'` | `'accessible'` |
| `'sequence-break'` / `'partial'` | `'out_of_logic'` |
| `'cleared'` | `'checked'` |
| tout le reste | `'inaccessible'` |

---

### `secLevelColor(rawLevel)`

Convertit un niveau de section (raw depuis `evaluateRules`) en couleur hex pour les dots dans le popup.

| `rawLevel` | couleur |
|-----------|---------|
| `'normal'` | `#7ac038` vert |
| `'sequence-break'` / `'partial'` / `'inspect'` | `#d4901a` orange |
| `'cleared'` | `#4488cc` bleu |
| tout le reste | `#d82828` rouge |

---

## Computed

### `accessibility`

Computed Vue qui recalcule l'accessibilité de toutes les locations à chaque changement de settings ou d'état.

**Dépendances réactives trackées manuellement** (via `void ...`) :
- `settings.randoDefines`, toutes les fusions, crests, warps, tricks
- `settings.dungeonEntranceShuffle`, `state.dungeonEntranceMap`
- `state.manualItems`, `state.autotrackItems` (via `JSON.stringify` pour deep tracking)

**Algorithme** :
1. Appelle `prepareProvider(state, settings)` → injecte le provider dans luaEngine + vide cache
2. Pour chaque location :
   - Filtre les sections visibles via `evalRules(s.visibility_rules, settings)`
   - Si aucune section visible → `'accessible'` par défaut
   - Sinon calcule `locationAccessibility(sections, getSectionLevel)` où `getSectionLevel` :
     - Calcule `remaining = item_count - checkedSections[key]`
     - Si `remaining <= 0` → `'cleared'`
     - Sinon → `evaluateRules(sec.access_rules, provider)`
   - Mappe le niveau vers un statut pin via `levelToPinStatus()`
3. Retourne `{ get(id), getSection(id, secName) }`

En cas d'erreur → fallback `{ get: () => 'accessible', getSection: () => 'accessible' }`.

---

### `pins`

Computed qui construit la liste des pins SVG à afficher sur la carte.

Pour chaque location visible :
1. Filtre les `map_locations` correspondant à la carte courante
2. Filtre via `restrict_visibility_rules`
3. Groupe les locations par coordonnée `x:y`
4. Pour chaque groupe construit un objet pin :

```js
{
  x, y,           // coordonnées en pixels (scalées)
  locs,           // locations au même point
  allChecked,     // toutes cochées via isChecked()
  tooltip,        // noms des locations
  type,           // 'location' | 'dungeon' | 'fused'
  segments,       // résultat de pinSegments()
  noteImg,        // src image note ou null
}
```

Ajoute aussi les `doorPins` (entrées de donjons non assignées en mode entrance shuffle).

---

## Fonctions de rendu pin

### `pinSegments(locs)`

Calcule les segments colorés du pin SVG pour un groupe de locations.

**Logique** :
- Si toutes les locations sont cochées (`isChecked`) → `[{ status: 'checked' }]`
- Sinon compte les locations non-cochées par statut d'accessibilité
- Retourne les segments dans l'ordre : `accessible`, `out_of_logic`, `inaccessible`, `checked`

Un pin multi-locations peut avoir plusieurs segments de couleurs différentes.

---

### `pinOpacity(pin)`

Retourne l'opacité du groupe fill SVG du pin.

| Condition | Opacité |
|-----------|---------|
| `pin.allChecked` (coché manuellement) | `0.4` |
| Seul segment = `'checked'` (completé via sections) | `0.5` |
| Sinon | `0.9` |

---

### `pinType(locs)`

Retourne le type de pin pour le rendu SVG.

| Condition | Type |
|-----------|------|
| Une location a `dungeon != null` | `'dungeon'` |
| Toutes les sections ont `hosted_item` | `'fused'` |
| Sinon | `'location'` |

---

### `dungeonPath(x, y)`

Génère un path SVG en forme de losange/diamant pour les pins de type `'dungeon'`.

```
M x-7,y+7 H x+7 V y A 7,7 0 0 0 x-7,y Z
```

---

### `secDotColor(locId, secName)`

Retourne la couleur hex pour le dot d'une section dans le popup.

Appelle `secLevelColor(accessibility.value.getSection(locId, secName))`.
