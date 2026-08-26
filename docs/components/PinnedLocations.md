# components/PinnedLocations.vue

Panneau des locations épinglées : une carte par location épinglée, avec les compteurs d'items restants par section, coffres cliquables, captures et fusions.

---

## Rôle

- Liste les locations de `pinnedLocations` (résolues depuis `allLocations`).
- Pour chaque section : affiche le coffre (ouvert/fermé selon le restant), le compteur si `item_count > 1`, la note de capture, ou l'image de fusion (kinstone).
- Clic gauche = prendre 1 item (restant -1), clic droit = rendre 1 (restant +1) ; les captures/fusions se togglent.
- Bouton ✕ pour dépingler.

---

## État / refs

| Nom | Description |
|-----|-------------|
| `FUSION_MAP` | Map `codes` → `{ img, fused_img }` construite depuis `fusion.json` |
| `pinnedLocs` | `computed` des objets location correspondant à `pinnedLocations` |
| `checkedSections`, `pinnedLocations` | refs extraites du store via `storeToRefs` |

---

## Fonctions

#### `getChecked(loc, sec)`
Nombre d'items collectés dans la section (via `store.sectionKey`).

#### `getRemaining(loc, sec)`
Restant = `item_count` (défaut 1) − collectés.

#### `chestImg(loc, sec)`
Image du coffre : `chest_opened_img` si restant ≤ 0, sinon `chest_unopened_img`.

#### `fusionImg(loc, sec)`
Image de fusion depuis `FUSION_MAP[sec.hosted_item]` (fusée si restant ≤ 0).

#### `captureNoteImg(loc, sec)`
Image de l'item noté sur une section de capture (via `store.locationNotes` + `ITEM_IMAGES`).

#### `onLeft` / `onRight` / `toggleCapture`
Décrémente / incrémente le restant (`stepSection`), ou toggle la section de capture/fusion (`toggleSection`).

---

## Stores utilisés

- `stateStore` — `checkedSections`, `pinnedLocations`, `allLocations`, `locationNotes`, `sectionKey`, `stepSection`, `toggleSection`, `unpinLocation`.
