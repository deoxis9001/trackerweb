"""
Extracts map coordinates for every AP location by reading:
  1. pop/scripts/autotracking/location_mapping.lua  -> AP id -> @Group/Section path(s)
  2. pop/json/locations/*.json                       -> GroupName -> map_locations (x,y,map)

Output: data/map_coords.json  [{id, name, map, x, y}, ...]
"""

import json, re, pathlib

ROOT       = pathlib.Path(__file__).resolve().parents[1]
LUA_FILE   = ROOT / "src_info/tmcrando_maptracker_deoxis/pop/scripts/autotracking/location_mapping.lua"
LOC_DIR    = ROOT / "src_info/tmcrando_maptracker_deoxis/pop/json/locations"
AP_LOCS    = ROOT / "data/locations.json"
OUT_FILE   = ROOT / "data/map_coords.json"

# ---------------------------------------------------------------------------
# 1. Parse location_mapping.lua -> {ap_id: [(GroupName, SectionName), ...]}
# ---------------------------------------------------------------------------
id_to_paths: dict[int, list[tuple[str, str]]] = {}

lua_text = LUA_FILE.read_text(encoding="utf-8")
for line in lua_text.splitlines():
    line = line.strip()
    if line.startswith("--") or not line:
        continue
    m = re.match(r'\[(\d+)\]\s*=\s*\{(.+)\}', line)
    if not m:
        continue
    ap_id = int(m.group(1))
    entries_str = m.group(2)
    paths = re.findall(r'\{"(@[^"]+)"', entries_str)
    result = []
    for path in paths:
        if "/" not in path:
            continue
        group, section = path.split("/", 1)
        group = group.lstrip("@")
        result.append((group, section))
    if result:
        id_to_paths[ap_id] = result

print(f"Parsed {len(id_to_paths)} AP id mappings from lua")

# ---------------------------------------------------------------------------
# 2. Index poptracker JSONs: {group_name -> [map_location]}
# ---------------------------------------------------------------------------
group_coords: dict[str, list[dict]] = {}

for f in sorted(LOC_DIR.glob("*.json")):
    with open(f, encoding="utf-8") as fh:
        data = json.load(fh)
    for group in data:
        gname = group.get("name", "")
        coords = group.get("map_locations", [])
        if gname and coords:
            group_coords[gname] = coords

print(f"Indexed {len(group_coords)} pop groups with coordinates")

# ---------------------------------------------------------------------------
# 3. Load AP locations for name lookup
# ---------------------------------------------------------------------------
with open(AP_LOCS, encoding="utf-8") as f:
    ap_locs = json.load(f)
loc_by_id = {l["id"]: l for l in ap_locs if l.get("id") is not None}

# ---------------------------------------------------------------------------
# 4. Build output
# ---------------------------------------------------------------------------
DUNGEON_MAP_REMAP = {
    "map_clouds": "map",   # Cloud Tops are overworld
    "map_castle": "dhc",
}

results = []
matched = 0
no_group = []

for ap_id, path_list in sorted(id_to_paths.items()):
    if ap_id not in loc_by_id:
        continue
    loc = loc_by_id[ap_id]

    placed = False
    for group_name, _section in path_list:
        if group_name not in group_coords:
            continue
        for c in group_coords[group_name]:
            raw_map = c.get("map", "map")
            mapped = DUNGEON_MAP_REMAP.get(raw_map, raw_map)
            results.append({
                "id":   ap_id,
                "name": loc["name"],
                "map":  mapped,
                "x":    c.get("x", 0),
                "y":    c.get("y", 0),
            })
        placed = True
        break

    if placed:
        matched += 1
    else:
        no_group.append((ap_id, [g for g, _ in path_list]))

print(f"Matched:    {matched} / {len(id_to_paths)} AP ids in lua")
print(f"No group:   {len(no_group)}")
print(f"Total coordinate entries: {len(results)}")

if no_group[:15]:
    print("\nNot found in pop JSONs:")
    for aid, groups in no_group[:15]:
        name = loc_by_id.get(aid, {}).get("name", "?")
        print(f"  {aid} ({name}): {groups}")

# ---------------------------------------------------------------------------
# 5. Deduplicate by id (first occurrence wins) + keep only overworld map
# ---------------------------------------------------------------------------
seen = set()
filtered = []
for r in results:
    if r["id"] in seen:
        continue
    if r["map"] != "map":
        continue
    seen.add(r["id"])
    filtered.append(r)

print(f"\nAfter dedup+filter: {len(filtered)} entries (overworld only)")

# ---------------------------------------------------------------------------
# 6. Write output
# ---------------------------------------------------------------------------
with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(filtered, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(filtered)} entries -> {OUT_FILE}")
