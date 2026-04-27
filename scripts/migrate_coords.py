"""
migrate_coords.py — Migrates map_coords files to new format.

New format per file: [{ "id": N, "location": [{ "map": "name", "x": N, "y": N }] }]

Output:
  data/map_coords_overworld_{area}.json  (16 files, one per overworld zone)
  data/map_coords_dungeons_{dung}.json   (7 files, updated in place)

Old files kept for reference (not deleted automatically).
"""

import json
from pathlib import Path
from collections import defaultdict

ROOT     = Path(__file__).parent.parent
DATA     = ROOT / "data"
META     = DATA / "location_meta.json"

# ---------------------------------------------------------------------------
# Area for dungeon locations appearing on the full overworld map
# ---------------------------------------------------------------------------
DUNGEON_TO_AREA = {
    "DWS": "minishwoods",
    "CoF": "crenel",
    "FoW": "swamp",
    "ToD": "hylia",
    "RC":  "valley",
    "PoW": "clouds",
    "DHC": "castle",
}

SPECIAL_REGION_TO_AREA = {
    "SANCTUARY":    "castle",
    "STAINED_GLASS":"castle",
    "FUSIONS":      None,   # fusions handled by x,y bounds below
}

# Very rough x,y bounds for each area on the 3300×2060 overworld map
# Used to assign FUSIONS (and any other unclassified) locations to an area
AREA_BOUNDS = [
    # (area, x_min, x_max, y_min, y_max)
    ("southfield",  900, 2000, 1700, 2060),
    ("town",        800, 1600,  900, 1700),
    ("northfield",  800, 1600,  250,  900),
    ("castle",      1100, 1600,   0,  400),
    ("valley",       500, 1100,   0,  400),
    ("lonlon",      1600, 2400,  500, 1300),
    ("hills",       2000, 3300, 1300, 2060),
    ("minishwoods", 2000, 3300, 1500, 2060),
    ("hylia",       2000, 3300, 700, 1500),
    ("clouds",      2200, 3300,   0,  700),
    ("swamp",        300, 1100, 1400, 2060),
    ("crenel",         0,  700,   0,  700),
    ("falls",        600, 1200, 300, 1100),
    ("ruins",          0, 1000, 1100, 2060),
    ("trilby",       600, 1400, 600, 1100),
    ("westernwoods",   0,  900,  600, 1500),
]


def guess_area(x, y):
    """Best-effort area guess from pixel coordinates."""
    best = None
    for area, xmin, xmax, ymin, ymax in AREA_BOUNDS:
        if xmin <= x <= xmax and ymin <= y <= ymax:
            best = area
            break
    return best or "southfield"   # fallback


# ---------------------------------------------------------------------------
# Load source files
# ---------------------------------------------------------------------------

map_coords = json.load((DATA / "map_coords.json").open())
area_coords = json.load((DATA / "map_coords_overworld_areas.json").open())
loc_meta    = json.load(open(META))
meta_by_id  = {l["id"]: l for l in loc_meta}

dungeon_files = {
    "dws": json.load((DATA / "map_coords_dungeons_dws.json").open()),
    "cof": json.load((DATA / "map_coords_dungeons_cof.json").open()),
    "rc":  json.load((DATA / "map_coords_dungeons_rc.json").open()),
    "fow": json.load((DATA / "map_coords_dungeons_fow.json").open()),
    "tod": json.load((DATA / "map_coords_dungeons_tod.json").open()),
    "pow": json.load((DATA / "map_coords_dungeons_pow.json").open()),
    "dhc": json.load((DATA / "map_coords_dungeons_dhc.json").open()),
}

# ---------------------------------------------------------------------------
# Build area assignments
# ---------------------------------------------------------------------------

# 1) From area_coords: id → {area: [(x, y), ...]}
area_entries = defaultdict(lambda: defaultdict(list))  # id -> area -> [(x,y)]
for e in area_coords:
    area_entries[e["id"]][e["area"]].append((e["x"], e["y"]))

# 2) Full overworld (map="map") entries: id → [(x,y)]
overworld_entries = defaultdict(list)   # id -> [(x,y)]
for e in map_coords:
    if e.get("map") == "map":
        overworld_entries[e["id"]].append((e["x"], e["y"]))

# 3) Dungeon overview entries: dungeon_name -> {id -> [(x,y)]}
dungeon_overview = defaultdict(lambda: defaultdict(list))
for e in map_coords:
    m = e.get("map")
    if m and m != "map":
        dungeon_overview[m][e["id"]].append((e["x"], e["y"]))

# ---------------------------------------------------------------------------
# Assign each overworld location to an area
# ---------------------------------------------------------------------------

# Start with known area-zoom assignments
id_to_area = {}
for loc_id, areas in area_entries.items():
    # A location may technically appear in multiple areas (rare), pick first
    id_to_area[loc_id] = next(iter(areas))

# For full-overworld entries without area-zoom: derive from dungeon or coords
for loc_id, positions in overworld_entries.items():
    if loc_id in id_to_area:
        continue
    meta = meta_by_id.get(loc_id)
    if meta:
        dungeon = meta.get("dungeon")
        if dungeon and dungeon in DUNGEON_TO_AREA:
            id_to_area[loc_id] = DUNGEON_TO_AREA[dungeon]
            continue
        rk = meta.get("region_key", "")
        special = SPECIAL_REGION_TO_AREA.get(rk)
        if special:
            id_to_area[loc_id] = special
            continue
    # Fallback: guess from pixel position
    if positions:
        x, y = positions[0]
        id_to_area[loc_id] = guess_area(x, y)

# ---------------------------------------------------------------------------
# Build overworld per-area files
# ---------------------------------------------------------------------------

AREAS = [
    "castle","clouds","crenel","falls","hills","hylia","lonlon",
    "minishwoods","northfield","ruins","southfield","swamp",
    "town","trilby","valley","westernwoods",
]

# Collect all IDs for each area
area_to_ids = defaultdict(set)
for loc_id, area in id_to_area.items():
    area_to_ids[area].add(loc_id)

# Build entries per area
for area in AREAS:
    ids = area_to_ids.get(area, set())
    entries = {}   # id -> {id, location: [...]}

    for loc_id in ids:
        locs = []

        # Full overworld positions (map="map")
        for x, y in overworld_entries.get(loc_id, []):
            locs.append({"map": "map", "x": x, "y": y})

        # Area zoom positions (map=area_name)
        for a, positions in area_entries.get(loc_id, {}).items():
            # deduplicate by (x,y)
            seen = set()
            for x, y in positions:
                if (x, y) not in seen:
                    locs.append({"map": a, "x": x, "y": y})
                    seen.add((x, y))

        if locs:
            entries[loc_id] = {"id": loc_id, "location": locs}

    result = sorted(entries.values(), key=lambda e: e["id"])
    out = DATA / f"map_coords_overworld_{area}.json"
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  -> {out.name} ({len(result)} entries)")

# ---------------------------------------------------------------------------
# Build updated dungeon files
# ---------------------------------------------------------------------------

DUNGEON_NAMES = {"dws", "cof", "rc", "fow", "tod", "pow", "dhc"}

for dname, raw in dungeon_files.items():
    entries = {}   # id -> {id, location: [...]}

    for e in raw:
        loc_id = e["id"]
        floor  = e.get("floor") or e.get("map")
        x, y   = e["x"], e["y"]
        if loc_id not in entries:
            entries[loc_id] = {"id": loc_id, "location": []}
        if x > 0 or y > 0:
            entries[loc_id]["location"].append({"map": floor, "x": x, "y": y})

    # Merge dungeon overview coords from map_coords.json
    for loc_id, positions in dungeon_overview.get(dname, {}).items():
        if loc_id not in entries:
            entries[loc_id] = {"id": loc_id, "location": []}
        seen_maps = {l["map"] for l in entries[loc_id]["location"]}
        if dname not in seen_maps:
            for x, y in positions:
                entries[loc_id]["location"].append({"map": dname, "x": x, "y": y})

    result = sorted(entries.values(), key=lambda e: e["id"])
    out = DATA / f"map_coords_dungeons_{dname}.json"
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  -> {out.name} ({len(result)} entries)")

print("Migration complete.")
print("Old files (map_coords.json, map_coords_overworld_areas.json) kept as backup.")
