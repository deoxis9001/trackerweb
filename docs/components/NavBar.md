# components/NavBar.vue

Barre de navigation supérieure : logo/marque, onglets de panneau (carte / checklist), compteur de progression, reset, et boutons broadcast / FAQ / settings.

---

## Rôle

- Bascule entre les panneaux `map` et `checklist` via `store.setActivePanel`, en revenant d'abord sur `/` si besoin.
- Gère le dungeon entrance shuffle : clic sur un onglet de donjon assigne / ouvre le picker d'entrée selon `settings.dungeonEntranceShuffle`.
- Affiche `checkedCount / totalCount`, un bouton reset, et ouvre la fenêtre broadcast, la FAQ et les settings.

---

## État / refs

| Nom | Description |
|-----|-------------|
| `entrancePicker` | `ref` du slot dont le picker d'entrée est ouvert (`null` si fermé) |
| `isDev` | `import.meta.env.DEV` — flag mode dev |

---

## Fonctions

#### `goToTracker()`
Navigue vers `/` si on n'y est pas déjà.

#### `onDungeonTabClick(slot)`
Sans entrance shuffle : active directement la vue `slot`. Avec shuffle : si le slot a une entrée assignée (`store.dungeonEntranceMap`), active cette vue ; sinon ouvre/ferme le picker d'entrée.

#### `onDungeonTabRightClick(e, slot)`
Clic droit (uniquement si entrance shuffle) : efface l'entrée assignée au slot (`store.clearDungeonEntrance`).

#### `assignEntrance(slot, target)`
Assigne une entrée (`store.setDungeonEntrance`), active la vue cible et ferme le picker.

#### `handleReset()`
Réinitialise le run via `store.resetTracker()`.

#### `openBroadcastItems()`
Ouvre `/broadcast` dans une nouvelle fenêtre popup (340×700).

---

## Stores utilisés

- `stateStore` — panneau actif, vues/donjons, entrance map, compteurs, reset, flags `showFaq` / `showSettings`.
- `settingsStore` — `dungeonEntranceShuffle`.
- `useLocale` — traductions (`t`) des libellés de la barre.
