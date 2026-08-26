# data/locations.js

Charge les locations EMO depuis les JSON du submodule `tmcrando_maptracker_deoxis`, les enrichit (clé, région, donjon, pools) et expose la liste plate + l'index par fichier.

---

## Chargement

Glob eager sur `SubModule/tmcrando_maptracker_deoxis/emo/json/locations/*.json`. Chaque fichier correspond à une région (nom de fichier = `region_key`). Le fichier `Maps.json` est ignoré.

Chaque location du JSON est copiée (spread) puis enrichie des champs suivants :

| Champ ajouté | Description |
|--------------|-------------|
| `id` | Identifiant numérique incrémental (unique, tous fichiers confondus) |
| `key` | Clé slug du nom (`toKey`) |
| `region_key` | Nom du fichier source |
| `region_name` | Nom de région lisible via `REGION_NAMES` (fallback : `region_key`) |
| `dungeon` | Code court du donjon, ou `null` hors donjon |
| `pools` | Tableau de pools dérivés (`derivePools`) |

## Constantes

- `REGION_NAMES` : `region_key` → nom de région affiché (ex. `Swamp` → `Castor Wilds`). `Dungeons` vaut `null`, `General` → `Shared`.
- `DUNGEON_SHORT` : nom de donjon → code court (`CoF`, `RC`, `DWS`, `FoW`, `PoW`, `ToD`, `DHC`).

## Exports

### `locationsByFile`

`region_key` → tableau des locations enrichies de ce fichier.

### `allLocations`

Tableau plat de toutes les locations enrichies, dans l'ordre de chargement (ordre des `id`).

---

## Fonctions internes

### `toKey(name)`

Slugifie un nom : minuscules, tout caractère non `[a-z0-9]` → `_`, underscores de bord supprimés.

### `derivePools(loc)`

Déduit les « pools » d'une location (tags de catégorisation) à partir de son nom et de ses sections, retournés en tableau dédupliqué.

- **Depuis les sections** : image de coffre / nom de section → `hp` (heart piece), `scroll` (Tiger Scroll), `pot`, `water` (underwater), `butterfly`, `element` (reward). Une section `hosted_item` avec des `visibility_rules` de fusion ajoute le pool de fusion correspondant (`fusionPool`).
- **Depuis le nom de location** : `scrub`, `fairy` (great fairy), `butterfly`, `scroll` (dojo), `dig`, `shop` (shop / goron merchant), `enemy` (golden).

### `fusionPool(rules)`

À partir d'un tableau `visibility_rules`, retourne le pool de fusion (`fuse_gold` / `fuse_red` / `fuse_blue` / `fuse_green`) si une règle contient `fusiongold`/`fusionred`/`fusionblue`/`fusiongreen`, sinon `null`.

### Détermination du donjon

Pour le fichier `Dungeons`, `dungeon` vaut `loc.short_name`, sinon `DUNGEON_SHORT[loc.name]`, sinon `null`. Hors ce fichier, `dungeon` est toujours `null`.
