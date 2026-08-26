# components/ItemNotePicker.vue

Popup de sélection d'une note d'item pour une (ou plusieurs) location(s) : grille d'items en 6 colonnes.

---

## Rôle

Affiche une grille d'items (`PICKER_ITEMS`) permettant d'associer une note à des locations. Émet `select` (item choisi), `clear` (effacer) et `close`. Le titre affiche le nom de la location ou `N locations`, et l'item déjà noté est mis en surbrillance.

---

## Props

| Prop | Type | Description |
|------|------|-------------|
| `locs` | `Array` (requis) | Locations concernées par la note |
| `popupStyle` | `Object` | Styles inline de positionnement du popup |

---

## Événements émis

- `select(key)` — item sélectionné dans la grille
- `clear` — effacer la note
- `close` — fermer le popup

---

## État / refs

| Nom | Description |
|-----|-------------|
| `title` | `computed` : nom de la location unique ou `"N locations"` |
| `currentNote` | `computed` : première note existante parmi `locs` (via `store.locationNotes[loc.id]`) |

---

## Fonctions

#### `itemImgSrc(key)`
Résout le chemin de l'image d'un item depuis `ITEM_IMAGES` (prend le 1er si tableau), sinon `null` → fallback texte.

---

## Stores utilisés

- `stateStore` — `locationNotes` (pour la surbrillance de la note courante).
