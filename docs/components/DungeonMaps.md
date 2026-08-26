# components/DungeonMaps.vue

Switcher de cartes de donjon : une barre d'onglets au-dessus d'une `MapView`, qui affiche le donjon sélectionné.

---

## Rôle

Affiche 7 onglets (DWS, CoF, FoW, ToD, RC, PoW, DHC) et rend `MapView` avec la carte du donjon actif. Le clic sur un onglet change simplement la carte affichée.

---

## État / refs

| Nom | Description |
|-----|-------------|
| `dungeons` | Tableau statique `{ id, label }` des 7 donjons (`dws`, `cof`, `fow`, `tod`, `rc`, `pow`, `dhc`) |
| `activeId` | `ref` de l'id du donjon actif (défaut `'dws'`) |

---

## Composants utilisés

- `MapView` — rendu de la carte, alimenté par `:map-id="activeId"`.
