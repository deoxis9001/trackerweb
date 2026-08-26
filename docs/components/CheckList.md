# components/CheckList.vue

Panneau checklist des locations : recherche textuelle, filtre par pool, groupement par donjon/région, et affichage en arbre de préfixes repliable.

---

## Rôle

Affiche `store.visibleLocations` sous forme de groupes repliables :

- **Filtres** (haut) — un champ de recherche et un `<select>` de pool.
- **Barre de stats** — `cochées / visibles`, plus un indice si `settings.showInaccessible` est faux.
- **Groupes de locations** — un groupe par région/donjon, chacun avec un en-tête cliquable (toggle, compteur `coché/total`).
  - Sans recherche active : rendu via `LocationTreeNode` (arbre de préfixes).
  - Avec recherche active : liste plate de `.location-row`.

Interaction : clic gauche sur une location non cochée → `store.toggleLocation`. Clic droit sur une location cochée → la décoche (`onRightClickLoc`).

---

## État / refs

| Ref | Valeur initiale | Rôle |
|-----|-----------------|------|
| `searchQuery` | `''` | Texte de recherche (filtre par nom traduit) |
| `filterPool` | `'all'` | Pool sélectionné dans le `<select>` |
| `collapsedRegions` | `new Set()` | Clés de groupes région/donjon repliés |
| `collapsedTreeKeys` | `new Set()` | `nodeKey` de sous-nœuds d'arbre repliés (passé à `LocationTreeNode`) |

Constantes locales : `POOL_LABELS` (computed, labels i18n des pools), `STATUS_COLOR`, `DUNGEON_LABELS` (noms d'affichage des clés de donjon).

---

## Computed

| Nom | Rôle |
|-----|------|
| `POOL_LABELS` | Map `val → label` traduit pour les options du `<select>` |
| `visibleLocations` | `store.visibleLocations` filtré par `filterPool` (via `l.pools`) puis par `searchQuery` (sur le nom traduit) |
| `groupedLocations` | Regroupe : donjon → clé `__dungeon__<dungeon>`, sinon `region_key`. Retourne des tuples `[key, locs, label]` triés par label localisé |
| `locationTrees` | Pour chaque groupe, l'arbre de préfixes construit par `buildPrefixTree` |
| `totalVisible` | Nombre de locations visibles |
| `totalChecked` | Nombre de visibles cochées |

---

## Fonctions

- **`buildPrefixTree(locs, keyPrefix, depth)`** — construit récursivement un arbre à partir des noms de location : extrait un préfixe commun (mots partagés, en laissant toujours au moins un mot distinct), puis regroupe par premier mot non partagé. Une entrée unique devient une feuille (`shortName`) ; un groupe multiple devient un sous-nœud récursif. Garde-fous : noms vides → liste plate ; `locs.length === 1` → feuille unique ; `depth > 10` → aplatissement. Le champ `_treeDisplay` propage le nom raccourci aux sous-niveaux.
- **`toggleRegion(key)`** — replie/déplie un groupe région/donjon.
- **`toggleTreeKey(nodeKey)`** — replie/déplie un sous-nœud d'arbre.
- **`regionCheckedCount(locs)`** — nombre de locations cochées d'un groupe.
- **`onRightClickLoc(e, loc)`** — décoche la location si elle est cochée.
- **`locColor()`** — retourne une couleur fixe (`#d82828`) pour le point de location.

---

## Stores utilisés

- **stateStore** (`store`) — `visibleLocations`, `isChecked`, `toggleLocation`.
- **settingsStore** (`settings`) — `showInaccessible` (indice de stats).

i18n : `useLocale` fournit `t`, `tLocation`, `tRegion`.
