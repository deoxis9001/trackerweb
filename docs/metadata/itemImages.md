# metadata/itemImages.js

Métadonnées d'affichage des items : mappe les codes items → images (sous `/images/items/`), et décrit les grilles, items composites, badges et compteurs du tracker.

---

## Exports

### `ITEM_IMAGES`

Dictionnaire `codeItem` → image. La valeur est :

- une **chaîne** (une seule image), ou
- un **tableau** pour les items progressifs, où l'index correspond au niveau/count (ex. `PROGRESSIVE_SWORD`, `PROGRESSIVE_BOOK`, `BOTTLE`).

Les chemins préfixés `../dungeons/` pointent vers le dossier des icônes de donjon (clés, maps, big keys, boss). Couvre épées, armes/outils, boucliers, scrolls, upgrades, items de quête, items de donjon, éléments et kinstones.

### Grilles d'affichage

Tableaux de lignes (chaque ligne = tableau de codes items ; `''` = case vide) définissant la disposition dans le tracker principal.

| Export | Rôle |
|--------|------|
| `SWORD_GRID_NOT_PROGRESSIVE` | Ligne épées + outils, mode épées non progressives |
| `SWORD_GRID_PROGRESSIVE` | Variante avec `PROGRESSIVE_SWORD` |
| `INVENTORY_GRID` | Inventaire principal (boucliers, bottes, cape, ocarina, cœurs, kinstones…) |
| `QUEST_GRID` | Items de quête (anneaux, noix, médailles, clés, livre, wallet…) |
| `SCROLL_GRID` | Scrolls et techniques d'épée |
| `FUSION_GRID`, `TRACKER_GRID` | Actuellement vides (réservés) |

Certaines cases référencent des codes composites/badgés (ex. `MITTS_AND_FLY`, `BOW_AND_FLY`) définis plus bas plutôt que des codes bruts d'`ITEM_IMAGES`.

### `COMPOSITE_DEFS`

Items composites : clic gauche togglé le sous-item `left`, clic droit le sous-item `right`. L'image affichée est choisie par la clé d'état `"${leftHas}${rightHas}"` (ex. `'00'`, `'10'`, `'01'`, `'11'`) dans `images`. `disabled00: true` grise l'item quand aucun des deux sous-items n'est possédé.

### `BADGED_DEFS`

Items à badge : clic gauche fait défiler l'item de base (`base`, avec `loop: true` pour reboucler), clic droit togglé un overlay `badge` dont l'image est `badgeImg`.

### `PROGRESSIVE_WITH_DISABLED`

`Set` des progressifs (`PROGRESSIVE_BOMB_BAG`, `BOTTLE`) dont `array[0]` est l'image « désactivée / zéro » — l'index dans le tableau d'images est donc directement le count.

### `ITEM_MAX_COUNT`

`codeItem` → nombre maximum (petites clés par donjon, cœurs, figurines, scrolls, kinstones…). Borne l'incrément des compteurs.

### `DUNGEON_ITEM_ROWS`

Par donjon (`DWS`, `CoF`, `FoW`, `ToD`, `PoW`, `RC`, `DHC`) → codes items associés `{ smallKey, bigKey, map, compass }`. `RC` n'a qu'une petite clé.

### `PICKER_ITEMS`

Liste plate des items proposés dans le sélecteur de note de location (grille 6 colonnes × 8 lignes).
