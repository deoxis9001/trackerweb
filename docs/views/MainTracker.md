# views/MainTracker.vue

Vue principale du tracker : agence la zone carte/checklist et la barre du bas (inventaire + locations épinglées).

---

## Rôle

Layout en deux zones verticales :

- **`.map-section`** — soit la `CheckList` (si `store.activePanel === 'checklist'`), soit une barre d'onglets + le contenu correspondant :
  - **Overworld** → `MapView` avec `map-id="map"`
  - **Melari's Mines** → `MapView` avec `map-id="mine"`
  - **Maps Dungeons** → `DungeonMaps`
- **`.bottom-bar`** — colonne inventaire (`ItemGrid` dans un conteneur scrollable, titre « Inventory ») et `PinnedLocations`.

---

## État / refs

| Ref | Valeur initiale | Rôle |
|-----|-----------------|------|
| `activeTab` | `'overworld'` | Onglet carte actif : `'overworld'` \| `'mines'` \| `'dungeons'` |

Le basculement checklist ↔ carte est piloté par `store.activePanel` (stateStore), pas par un ref local.

---

## Composants enfants

`CheckList`, `MapView`, `DungeonMaps`, `ItemGrid`, `PinnedLocations`.

---

## Store utilisés

- **stateStore** (`store`) — lecture de `activePanel` pour choisir entre checklist et carte.
