# components/LocationTreeNode.vue

Nœud récursif de l'arbre de préfixes de la checklist : rend ses feuilles (locations) et ses sous-nœuds repliables, avec compteur de progression.

---

## Rôle

Rend un nœud d'arbre construit par `CheckList.buildPrefixTree` :

- **En-tête de sous-zone** (sauf pour la racine `isRoot`) — cliquable pour replier/déplier (`toggleCollapse(node.nodeKey)`), avec toggle `▶/▼`, le `node.label` et le compteur `checked/total`.
- **Feuilles** (`node.leaves`) — une `.location-row` par location : clic gauche coche si non cochée, clic droit délègue à `onRightClick`. Le nom affiché est `tLocation(leaf.loc.key, leaf.shortName)`.
- **Enfants** (`node.children`) — se re-rend lui-même récursivement (`<LocationTreeNode>`).

L'indentation (`paddingLeft`) est calculée à partir de `depth`. Les feuilles et enfants ne sont rendus que si la racine ou le nœud n'est pas replié.

---

## Props

| Prop | Type | Rôle |
|------|------|------|
| `node` | Object (requis) | Nœud courant : `{ nodeKey, label, leaves, children }` |
| `isRoot` | Boolean | Racine du groupe : pas d'en-tête, toujours dépliée, indentation réduite |
| `depth` | Number | Profondeur, pilote l'indentation et se réinitialise à 0 pour les enfants d'une racine |
| `collapsedKeys` | Object (requis) | `Set` des `nodeKey` repliés (partagé, `collapsedTreeKeys` du parent) |
| `toggleCollapse` | Function (requis) | Replie/déplie un `nodeKey` |
| `locColor` | Function (requis) | Couleur du point de location |
| `isChecked` | Function (requis) | `(id) → bool` |
| `toggleLocation` | Function (requis) | `(id) → void`, coche/décoche |
| `onRightClick` | Function (requis) | Handler du clic droit sur une feuille |
| `tLocation` | Function (requis) | Traduction du nom de location |

---

## Computed

| Nom | Rôle |
|-----|------|
| `isCollapsed` | `true` si `node.nodeKey` est dans `collapsedKeys` |
| `total` | Nombre de feuilles sous ce nœud (récursif, `countLeaves`) |
| `checked` | Nombre de feuilles cochées sous ce nœud (récursif, `countChecked`) |

---

## Fonctions

- **`countLeaves(n)`** — total récursif des feuilles d'un nœud (ses `leaves` + celles de ses `children`).
- **`countChecked(n)`** — total récursif des feuilles cochées (via `props.isChecked`).

---

## Récursion

Le composant se référence lui-même dans son template pour rendre `node.children` (`defineOptions({ name: 'LocationTreeNode' })`). L'arbre lui-même est construit hors composant, dans `CheckList` ; ce composant ne fait que le parcourir. `collapsedKeys` et les fonctions de callback sont passés inchangés à chaque niveau, de sorte que l'état de repli et les handlers restent centralisés dans le parent.

---

## Stores utilisés

Aucun accès direct à un store : tout passe par les props (`isChecked`, `toggleLocation`, etc.) fournies par `CheckList`.
