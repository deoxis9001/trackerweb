# components/MapView.vue

`src/components/MapView.vue` — composant principal d'affichage de la carte (overworld + donjons) avec les pins SVG, le zoom/pan, les popups de location et le note picker.

Props : `mapId` (String, défaut `null`) — si fourni, force la carte affichée indépendamment de `state.activeView`.

---

## Constantes

### `FUSION_MAP`

Construit au chargement depuis `fusion.json` (submodule). Indexe par `item.codes` → `{ img, fused_img }` (image kinstone allumée / éteinte).

### `OVERWORLD_AREAS`

Liste des 16 zones overworld (`castle`, `clouds`, `crenel`…) servant à filtrer les métadonnées de coordonnées.

### `AREA_LABELS`

Computed : mappe chaque zone overworld vers son libellé traduit (`t('map_areas.*')`).

### `DUNGEON_MAP_NAMES`

Mappe la clé de vue (`RC`, `DWS`, `CoF`…) vers le nom de carte data en minuscules (`rc`, `dws`, `cof`…).

### `DUNGEON_ENTRANCE_COORDS`

Position fixe (x, y) de l'entrée overworld de chaque donjon, utilisée pour les door pins en mode entrance shuffle.

### `DUNGEON_FLOORS`

Liste ordonnée des étages par donjon (ex. `dhc: ['B2','B1','1F','2F','3F','4F','Sanc']`).

### `DUNGEON_COORDS_RAW`

Mappe le nom de donjon vers son tableau de coordonnées brut (actuellement vides — tableaux constants déclarés en tête de fichier).

### `MAP_IMG_NAME`

Corrige le nom de fichier image pour certaines cartes (`mines` → `mine`).

### `MIN_ZOOM` / `MAX_ZOOM`

Bornes du zoom (`0.5` / `5`).

### `BASE_URL`

Raccourci vers `import.meta.env.BASE_URL` pour construire les chemins d'images de sections.

### `PIN_COLOR`

```js
const PIN_COLOR = {
  accessible:   '#7ac038',  // vert
  out_of_logic: '#d4901a',  // orange
  inaccessible: '#d82828',  // rouge
  checked:      '#606060',  // gris (location complétée)
}
```

### `SEC_DOT_COLOR`

```js
const SEC_DOT_COLOR = {
  accessible:   '#7ac038',
  out_of_logic: '#d4901a',
  inaccessible: '#d82828',
  cleared:      '#4488cc',  // bleu
}
```

---

## Computed

### `accessibility`

Recalcule l'accessibilité de toutes les locations et de leurs sections à chaque changement de settings ou d'état.

**Dépendances réactives trackées manuellement** (via `void …`) : `settings.randoDefines`, fusions (red/green/blue/gold), wind crests, warps (DWS/CoF/FoW/ToD/PoW/DHC), `settings.tricks`, `settings.dungeonEntranceShuffle`, `state.dungeonEntranceMap`, ainsi que `state.manualItems` et `state.autotrackItems` (via `JSON.stringify` pour un tracking profond).

**Algorithme** :
1. `prepareProvider(state, settings)` → provider injecté dans luaEngine.
2. Pour chaque `state.allLocations` : filtre les sections visibles via `evalRules(s.visibility_rules, settings)`. Si aucune → `'accessible'`.
3. Sinon `locationAccessibility(sections, getSectionLevel)` où `getSectionLevel` calcule `remaining = item_count - checkedSections[key]` ; `remaining <= 0` → `'cleared'`, sinon `evaluateRules(sec.access_rules, provider)`. Le niveau brut de section est mémorisé dans `secMap`.
4. Le niveau de location est converti via `levelToPinStatus`.

Retourne `{ get(id), getSection(id, secName) }` (fallback `'inaccessible'`). En cas d'erreur → `{ get: () => 'accessible', getSection: () => 'accessible' }`.

### `fittedW` / `fittedH`

Dimensions de l'image ajustées au conteneur (scale ≤ 1 conservant le ratio `naturalW`/`naturalH`).

### `wrapperTransform`

Chaîne CSS `translate(panX, panY) scale(zoom)` appliquée au wrapper de la carte.

### `mapName`

Nom de carte courant : `props.mapId` si fourni, sinon `'map'` (overworld) ou `DUNGEON_MAP_NAMES[state.activeView]`.

### `currentFloor`

Ref (pas computed) : étage courant du donjon, `null` en overworld.

### `availableFloors`

`DUNGEON_FLOORS[mapName]` ou `[]`.

### `useFloors`

`true` si `settings.autoTabDungeons === 'etage'` (affichage par étage).

### `mapSrc`

Chemin de l'image de carte : zone overworld, overworld complet, étage de donjon (si `useFloors`) ou image de donjon globale (via `MAP_IMG_NAME`).

### `pins`

Construit la liste des pins SVG. Pour chaque `state.visibleLocations` :
1. Ignore si `id` nul ou si aucune section visible.
2. Filtre `map_locations` sur `map === dataMapKey`.
3. Filtre via `restrict_visibility_rules` (avec test `callLuaFunction(n).count > 0`) et coordonnées `> 0`.
4. Groupe par `x:y` dans `byCoord` (coordonnées scalées).

Puis mappe chaque groupe (`regularPins`) vers un objet pin : `x`, `y`, `locs`, `allChecked`, `tooltip`, `type` (`pinType`), `segments` (`pinSegments`), `noteImg` (`noteImgSrcForLocs`). Ajoute les `doorPins` (entrées de donjons non assignées en mode entrance shuffle, overworld complet uniquement) avec `slot`, `isDoor`, `status`.

### `doorPinsList` / `regularPinsList`

Filtrent `pins` selon `isDoor`.

### `popupStyle`

Position/dimensions du popup de pin selon le point de clic (ouverture vers le bas ou vers le haut si manque de place, `maxHeight` 400px).

### `popupGroups`

Regroupe les locations du pin cliqué par nom de base (`locBaseName`). Chaque groupe expose `name`, `locs`, `checked`, `total`, `status`.

### `popupSubAreas`

Pour les pins de donjon uniquement : détermine le préfixe commun (`regionName`), regroupe les locations par sous-zone d'étage (`parseSubArea`) et sépare les locations sans code d'étage (`flat`). Retourne `null` hors donjon ou si aucun groupe. Expose `regionName`, `groups` (avec `checked`/`total`/`status`), `flat`.

### `notePickerStyle`

Position CSS (`left`/`top`) du note picker, repositionné pour rester dans la fenêtre.

---

## Interaction carte

### `onMapLoad(e)`

Lit `naturalWidth`/`naturalHeight` de l'image (défauts 3300 × 2060).

### `onMousemoveMap(e)` / `onMouseleaveMap()`

Calculent les coordonnées image sous la souris (`mouseImgX`/`mouseImgY`, affichées en dev) ; remises à `null` en sortie.

### `onWheel(e)`

Zoom centré sur le curseur : ajuste `zoom` (borné `MIN_ZOOM`/`MAX_ZOOM`) et compense `panX`/`panY` pour garder le point sous le curseur fixe.

### `onMousedown(e)` / `onMousemove(e)` / `onMouseup()`

Drag-to-pan au bouton gauche (ignoré si le clic vise un `.pin-group`). Met à jour `panX`/`panY` pendant le glissement.

### `resetView()`

Réinitialise `zoom = 1`, `panX = 0`, `panY = 0`.

### `setFloor(floor)`

Change l'étage courant puis `resetView()`.

### `setArea(area)`

Change la zone overworld, met à jour `state.activeZone`, puis `resetView()`.

**Note** : `onMounted`/`onUnmounted` gèrent le `ResizeObserver` (taille conteneur) et les listeners globaux (`wheel`, `mousemove`, `mouseup`, `keydown`, `click`). Des `watch` synchronisent l'étage/zone à `state.activeView`, `props.mapId`, `state.bizhawkFloor` et `state.activeZone`.

---

## Pins & couleurs

### `levelToPinStatus(level)`

| `level` | retourne |
|---------|----------|
| `'normal'` | `'accessible'` |
| `'sequence-break'` / `'partial'` | `'out_of_logic'` |
| `'cleared'` | `'checked'` |
| autre | `'inaccessible'` |

### `secLevelColor(rawLevel)`

Niveau brut de section → couleur hex (`SEC_DOT_COLOR`).

| `rawLevel` | couleur |
|-----------|---------|
| `'normal'` | vert |
| `'sequence-break'` / `'partial'` / `'inspect'` | orange |
| `'cleared'` | bleu |
| autre | rouge |

### `secDotColor(locId, secName)`

`secLevelColor(accessibility.getSection(locId, secName))` — couleur du dot de section dans le popup.

### `pinSegments(locs)`

Segments colorés du pin. Si tout est coché → `[{ status: 'checked' }]`. Sinon compte les locations non cochées par statut et retourne les segments non vides dans l'ordre `accessible`, `out_of_logic`, `inaccessible`, `checked`.

### `pinOpacity(pin)`

| Condition | Opacité |
|-----------|---------|
| `pin.allChecked` | `0.4` |
| unique segment `'checked'` | `0.5` |
| sinon | `0.9` |

### `dungeonPath(x, y)`

Path SVG en demi-cercle/losange pour les pins de type `'dungeon'` (et les door pins).

### `isFusionOnly(locs)`

`true` si toutes les locations n'ont que des sections `hosted_item`.

### `pinType(locs)`

`'dungeon'` si une loc a `dungeon != null`, `'fused'` si `isFusionOnly`, sinon `'location'`.

### `isFloorCode(w)`

`true` si le mot est un code d'étage (`B\d+`, `\d+F`, ou `Sanc`).

### `noteImgSrcForLocs(locs)`

Retourne le src image de la note à afficher sur le pin : note de location (`state.locationNotes[loc.id]`) ou note sur une section `capture_item`. `null` si aucune.

---

## Popup location

### `openPinPopup(e, pin)`

Ouvre le popup sur le pin (toggle si déjà ouvert) ; mémorise `popupPos` et met à jour `state.hoveredPinLocs`.

### `closePopup()`

Ferme le popup et le note picker, vide `state.hoveredPinLocs`.

### `onKeydown(e)`

Ferme le popup sur `Escape`.

### `locBaseName(name)`

Retire le suffixe `Item N` / `N` d'un nom de location pour obtenir le nom de base.

### `toggleGroup(group)`

Coche/décoche toutes les locations d'un groupe (toggle selon si le groupe est entièrement coché).

### `parseSubArea(name, regionName)`

Retire le préfixe de région puis découpe autour du premier code d'étage. Retourne `{ subArea, shortName }`.

### `groupStatus(locs)`

Statut agrégé d'un groupe de locations : `checked` si tout coché, sinon `accessible` / `out_of_logic` / `inaccessible` selon les locations restantes.

### `shortPopupName(locName, regionName)`

`parseSubArea(locName, regionName).shortName` — nom court affiché dans le popup donjon.

### `togglePopupSub(key)`

Plie/déplie une sous-zone du popup donjon (`collapsedPopupSubs`).

---

## Sections & captures

### `secRemaining(loc, sec)`

`item_count - checkedSections[key]` : nombre d'items restants à collecter dans la section.

### `secImg(loc, sec)`

Src du coffre : `chest_opened_img` si `secRemaining <= 0`, sinon `chest_unopened_img`.

### `secFusionImg(loc, sec)`

Src kinstone (via `FUSION_MAP[sec.hosted_item]`) : grise (`fused_img`) si fait, colorée (`img`) sinon. `null` si non trouvé.

### `captureNoteImg(loc, sec)`

Src de l'item annoté sur une section capture (`state.locationNotes[sectionKey]` → `ITEM_IMAGES`). `null` si aucun.

### `isLocCleared(loc)`

`true` si toutes les sections de la location sont vidées (`secRemaining <= 0`).

### `collectOneSec(loc, sec)` / `returnOneSec(loc, sec)`

Incrémentent / décrémentent d'une unité le compteur de section (`state.stepSection`, borné par `item_count`).

### `toggleCaptureSec(loc, sec)`

Toggle une section fusion (`state.toggleSection`, cible 1).

### `openCapturePicker(e, loc, sec)`

Ouvre le note picker pour une section `capture_item` : construit un pseudo-pin avec `_captureContext` `{ loc, sec }`.

### `clearCaptureSec(e, loc, sec)`

Efface la note et remet la section capture à 0 (`clearLocationNote` + `setSectionCleared(…, 0)`).

---

## Notes & pins

### `uncheckPin(pin)`

Décoche toutes les locations cochées du pin.

### `onContextmenuPin(e, pin)`

Clic droit sur un pin : ferme le popup si ouvert, sinon `uncheckPin`.

### `openNotePicker(e, pin)`

Ouvre le note picker sur le pin ; mémorise `notePickerPos`.

### `onNoteSelect(key)`

Applique la note choisie à toutes les locations du pin (`setLocationNote`). Si `_captureContext`, marque la section clear (`setSectionCleared(…, 1)`).

### `onNoteClear()`

Efface la note de toutes les locations du pin. Si `_captureContext`, remet la section à 0.

### `toggleGroupPin(group)`

Épingle/désépingle toutes les locations d'un groupe (`pinLocation` / `unpinLocation`).

### `toggleLocPin(loc)`

Épingle/désépingle une location (`state.isPinned` → `pin`/`unpin`).

### `showTooltip(e, pin)` / `hideTooltip()`

Renseignent / vident `state.hoveredPinLocs` (survol du pin).
