"""
Extracts TMC-APWorld data into JSON files for the web tracker frontend.
Parses Python source files using AST without requiring Archipelago installed.

Usage: python scripts/extract_tmc_data.py
Outputs: data/items.json, data/locations.json, data/regions.json, data/ap_tables.json
"""

import ast
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
TMC_SRC = ROOT / "SubModule" / "TMC-APWorld" / "tmc"
DATA_OUT = ROOT / "data"
DATA_OUT.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# Generic AST helpers
# ---------------------------------------------------------------------------

def load_ast(path: Path):
    return ast.parse(path.read_text(encoding="utf-8"))


def extract_str_enum(tree, class_name: str) -> dict[str, str]:
    """Extract { KEY: value } from a StrEnum class definition."""
    result = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            for item in node.body:
                if isinstance(item, ast.Assign):
                    for target in item.targets:
                        if isinstance(target, ast.Name):
                            key = target.id
                            if isinstance(item.value, ast.Constant):
                                result[key] = item.value.value
    return result


def attr_name(node) -> str | None:
    """Return the attribute name from Enum.VALUE nodes."""
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def const_or_none(node):
    """Return int/None from an ast node."""
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name) and node.id == "None":
        return None
    return None


def parse_set_of_strings(node) -> list[str]:
    """Parse {POOL_DIG, POOL_WATER, ...} — each element is a Name."""
    if isinstance(node, (ast.Set, ast.Call)):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "frozenset":
            node = node.args[0] if node.args else ast.Set(elts=[])
        elts = getattr(node, "elts", [])
        result = []
        for elt in elts:
            if isinstance(elt, ast.Name):
                result.append(elt.id)
            elif isinstance(elt, ast.Attribute):
                result.append(elt.attr)
        return result
    return []


# ---------------------------------------------------------------------------
# Parse constants.py
# ---------------------------------------------------------------------------

def parse_constants():
    tree = load_ast(TMC_SRC / "constants.py")
    items   = extract_str_enum(tree, "TMCItem")
    locs    = extract_str_enum(tree, "TMCLocation")
    regions = extract_str_enum(tree, "TMCRegion")
    events  = extract_str_enum(tree, "TMCEvent")
    print(f"  TMCItem: {len(items)} | TMCLocation: {len(locs)} | TMCRegion: {len(regions)} | TMCEvent: {len(events)}")
    return items, locs, regions, events


# ---------------------------------------------------------------------------
# Parse items.py  →  item_table
# ---------------------------------------------------------------------------

CLASSIFICATION_MAP = {
    "progression":                              "progression",
    "useful":                                   "useful",
    "filler":                                   "filler",
    "trap":                                     "trap",
    "progression_skip_balancing":               "progression",
    "progression_deprioritized_skip_balancing": "progression",
}


def parse_item_table(tmc_items: dict[str, str]) -> dict[str, dict]:
    """
    Returns { item_key: { name, classification, item_id } }
    """
    tree = load_ast(TMC_SRC / "items.py")
    result = {}
    item_table_node = None

    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "item_table":
                    item_table_node = node.value
        elif isinstance(node, ast.AnnAssign):
            if isinstance(node.target, ast.Name) and node.target.id == "item_table":
                item_table_node = node.value

    if not isinstance(item_table_node, ast.Dict):
        print("  WARNING: item_table not found as a dict literal")
        return result

    for key_node, val_node in zip(item_table_node.keys, item_table_node.values):
        item_key = attr_name(key_node)
        if item_key is None:
            continue
        if not isinstance(val_node, ast.Call):
            continue
        # ItemData(ItemClassification.xxx, (0x01, 0x02))
        if len(val_node.args) < 2:
            continue
        class_node = val_node.args[0]
        bytes_node = val_node.args[1]

        classification_raw = attr_name(class_node) or ""
        classification = CLASSIFICATION_MAP.get(classification_raw, "filler")

        # byte_ids tuple
        if isinstance(bytes_node, ast.Tuple) and len(bytes_node.elts) == 2:
            b0 = const_or_none(bytes_node.elts[0]) or 0
            b1 = const_or_none(bytes_node.elts[1]) or 0
            item_id = (b0 << 8) + b1
        else:
            item_id = None

        item_name = tmc_items.get(item_key, item_key)
        result[item_key] = {
            "key":            item_key,
            "name":           item_name,
            "classification": classification,
            "item_id":        item_id,
        }

    print(f"  item_table: {len(result)} entries")
    return result


# ---------------------------------------------------------------------------
# Parse locations.py  →  all_locations
# ---------------------------------------------------------------------------

# Pool variable name → readable pool string
POOL_NAMES = {
    "POOL_RUPEE":     "rupee",
    "POOL_PED":       "ped",
    "POOL_HP":        "hp",
    "POOL_DIG":       "dig",
    "POOL_WATER":     "water",
    "POOL_ENEMY":     "enemy",
    "POOL_SCROLL":    "scroll",
    "POOL_FAIRY":     "fairy",
    "POOL_SCRUB":     "scrub",
    "POOL_BUTTERFLY": "butterfly",
    "POOL_POT":       "pot",
    "POOL_ELEMENT":   "element",
    "POOL_SHOP":      "shop",
    "POOL_GORON":     "goron",
    "POOL_CUCCO":     "cucco",
    "POOL_GOLD_FUSE": "fuse_gold",
    "POOL_RED_FUSE":  "fuse_red",
    "POOL_GREEN_FUSE":"fuse_green",
    "POOL_BLUE_FUSE": "fuse_blue",
}

DUNGEON_REGIONS = {
    "DUNGEON_RC", "DUNGEON_RC_CLEAR",
    "DUNGEON_DWS_ENTRANCE", "DUNGEON_DWS_BARREL", "DUNGEON_DWS_MULLDOZER",
    "DUNGEON_DWS_BACK_HALF", "DUNGEON_DWS_BLUE_WARP", "DUNGEON_DWS_RED_WARP", "DUNGEON_DWS_CLEAR",
    "DUNGEON_COF_ENTRANCE", "DUNGEON_COF_MAIN", "DUNGEON_COF_MINECART",
    "DUNGEON_COF_BLUE_WARP", "DUNGEON_COF_LAVA_BASEMENT", "DUNGEON_COF_CLEAR",
    "DUNGEON_FOW_ENTRANCE", "DUNGEON_FOW_EYEGORE", "DUNGEON_FOW_BLUE_WARP", "DUNGEON_FOW_CLEAR",
    "DUNGEON_TOD_ENTRANCE", "DUNGEON_TOD_MAIN", "DUNGEON_TOD_LEFT_BASEMENT",
    "DUNGEON_TOD_DARK_MAZE_END", "DUNGEON_TOD_WEST_SWITCH_LEDGE",
    "DUNGEON_TOD_EAST_SWITCH", "DUNGEON_TOD_WEST_SWITCH", "DUNGEON_TOD_CLEAR",
    "DUNGEON_POW_ENTRANCE", "DUNGEON_POW_OUT_1F", "DUNGEON_POW_OUT_2F", "DUNGEON_POW_OUT_3F",
    "DUNGEON_POW_OUT_4F", "DUNGEON_POW_OUT_5F", "DUNGEON_POW_BLUE_WARP",
    "DUNGEON_POW_IN_1F", "DUNGEON_POW_IN_2F", "DUNGEON_POW_IN_3F", "DUNGEON_POW_IN_3F_SWITCH",
    "DUNGEON_POW_IN_4F", "DUNGEON_POW_RED_WARP", "DUNGEON_POW_IN_5F",
    "DUNGEON_POW_IN_4F_END", "DUNGEON_POW_IN_5F_END", "DUNGEON_POW_CLEAR",
    "DUNGEON_DHC_B1_WEST", "DUNGEON_DHC_B2", "DUNGEON_DHC_ENTRANCE",
    "DUNGEON_DHC_B1_EAST", "DUNGEON_DHC_1F", "DUNGEON_DHC_OUTSIDE",
    "DUNGEON_DHC_RED_WARP", "DUNGEON_DHC_BLUE_WARP",
    "STAINED_GLASS", "SANCTUARY",
}

DUNGEON_SHORT = {
    "DUNGEON_RC":         "RC",
    "DUNGEON_DWS":        "DWS",
    "DUNGEON_COF":        "CoF",
    "DUNGEON_FOW":        "FoW",
    "DUNGEON_TOD":        "ToD",
    "DUNGEON_POW":        "PoW",
    "DUNGEON_DHC":        "DHC",
}


def region_dungeon_key(region_key: str) -> str | None:
    for prefix, short in DUNGEON_SHORT.items():
        if region_key.startswith(prefix):
            return short
    if region_key in {"SANCTUARY", "STAINED_GLASS"}:
        return "DHC"
    return None


def parse_kwarg(call_node, name: str):
    for kw in call_node.keywords:
        if kw.arg == name:
            return kw.value
    return None


def parse_all_locations(tmc_locs: dict[str, str], tmc_regions: dict[str, str], tmc_items: dict[str, str]) -> list[dict]:
    tree = load_ast(TMC_SRC / "locations.py")
    result = []
    all_locs_node = None

    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "all_locations":
                    all_locs_node = node.value
        elif isinstance(node, ast.AnnAssign):
            if isinstance(node.target, ast.Name) and node.target.id == "all_locations":
                all_locs_node = node.value

    if not isinstance(all_locs_node, ast.List):
        print("  WARNING: all_locations not found as a list literal")
        return result

    for call in all_locs_node.elts:
        if not isinstance(call, ast.Call):
            continue

        args = call.args
        if len(args) < 7:
            continue

        loc_id        = const_or_none(args[0])
        loc_key       = attr_name(args[1])
        region_key    = attr_name(args[2])
        vanilla_key   = attr_name(args[3]) if not (isinstance(args[3], ast.Constant) and args[3].value is None) else None
        # args[4] = rom_addr, args[5] = ram_addr, args[6] = room_area
        room_area_raw = const_or_none(args[6])

        scoutable_node = parse_kwarg(call, "scoutable")
        scoutable = isinstance(scoutable_node, ast.Constant) and scoutable_node.value is True

        pools_node = parse_kwarg(call, "pools")
        pools_raw  = parse_set_of_strings(pools_node) if pools_node else []
        pools      = [POOL_NAMES.get(p, p.lower()) for p in pools_raw]

        loc_name    = tmc_locs.get(loc_key, loc_key) if loc_key else loc_key
        region_name = tmc_regions.get(region_key, region_key) if region_key else region_key
        vanilla_name = tmc_items.get(vanilla_key, vanilla_key) if vanilla_key else None
        dungeon     = region_dungeon_key(region_key or "")

        result.append({
            "id":           loc_id,
            "key":          loc_key,
            "name":         loc_name,
            "region_key":   region_key,
            "region_name":  region_name,
            "dungeon":      dungeon,
            "vanilla_item": vanilla_name,
            "room_area":    room_area_raw,
            "scoutable":    scoutable,
            "pools":        pools,
        })

    print(f"  all_locations: {len(result)} entries")
    return result


# ---------------------------------------------------------------------------
# Build AP tables (item_id → name, location_id → name)
# ---------------------------------------------------------------------------

def build_ap_tables(item_table: dict, locations: list[dict]) -> dict:
    item_map = {}
    for key, data in item_table.items():
        if data["item_id"] is not None:
            item_map[str(data["item_id"])] = data["name"]

    loc_map = {}
    for loc in locations:
        if loc["id"] is not None:
            loc_map[str(loc["id"])] = loc["name"]

    return {"items": item_map, "locations": loc_map}


# ---------------------------------------------------------------------------
# Build regions list
# ---------------------------------------------------------------------------

def build_regions(tmc_regions: dict[str, str], locations: list[dict]) -> list[dict]:
    region_info = {}
    for key, name in tmc_regions.items():
        dungeon = region_dungeon_key(key)
        region_info[key] = {
            "key":    key,
            "name":   name,
            "dungeon": dungeon,
            "is_dungeon_region": key in DUNGEON_REGIONS,
        }

    # count locations per region
    for loc in locations:
        rk = loc.get("region_key")
        if rk and rk in region_info:
            region_info[rk].setdefault("location_count", 0)
            region_info[rk]["location_count"] += 1

    for r in region_info.values():
        r.setdefault("location_count", 0)

    return list(region_info.values())


# ---------------------------------------------------------------------------
# Add item categories for frontend display grouping
# ---------------------------------------------------------------------------

ITEM_CATEGORIES = {
    "sword": [
        "SMITHS_SWORD","WHITE_SWORD_GREEN","WHITE_SWORD_RED","WHITE_SWORD_BLUE",
        "FOUR_SWORD","PROGRESSIVE_SWORD",
    ],
    "weapon": [
        "BOMB","REMOTE_BOMB","BOW","LIGHT_ARROW","PROGRESSIVE_BOW",
        "BOOMERANG","MAGIC_BOOMERANG","PROGRESSIVE_BOOMERANG",
        "LANTERN","GUST_JAR","CANE_OF_PACCI","MOLE_MITTS","ROCS_CAPE",
        "PEGASUS_BOOTS","FIRE_ROD","OCARINA","FLIPPERS",
    ],
    "shield": ["SHIELD","MIRROR_SHIELD","PROGRESSIVE_SHIELD"],
    "element": ["EARTH_ELEMENT","FIRE_ELEMENT","WATER_ELEMENT","WIND_ELEMENT"],
    "ability": [
        "SPIN_ATTACK","ROLL_ATTACK","DASH_ATTACK","ROCK_BREAKER","SWORD_BEAM",
        "GREATSPIN","DOWNTHRUST","PERIL_BEAM","FAST_SPIN_SCROLL","FAST_SPLIT_SCROLL",
        "LONG_SPIN","PROGRESSIVE_SCROLL",
    ],
    "upgrade": [
        "GRIP_RING","POWER_BRACELETS","BOMB_BAG","QUIVER","BIG_WALLET","HYRULE_MAP",
        "HEART_CONTAINER","HEART_PIECE",
    ],
    "quest": [
        "DOG_FOOD","LONLON_KEY","WAKEUP_MUSHROOM","RED_BOOK","GREEN_BOOK","BLUE_BOOK",
        "GRAVEYARD_KEY","TINGLE_TROPHY","CARLOV_MEDAL","SHELLS","JABBER_NUT",
        "SMITH_SWORD_QUEST","BROKEN_PICORI_BLADE",
    ],
    "bottle": [
        "BOTTLE_1","BOTTLE_2","BOTTLE_3","BOTTLE_4","EMPTY_BOTTLE",
        "LON_LON_BUTTER","LON_LON_MILK","LON_LON_MILK_HALF",
        "RED_POTION","BLUE_POTION","WATER","MINERAL_WATER","BOTTLED_FAIRY",
        "RED_PICOLYTE","ORANGE_PICOLYTE","YELLOW_PICOLYTE","GREEN_PICOLYTE",
        "BLUE_PICOLYTE","WHITE_PICOLYTE","NAYRU_CHARM","FARORE_CHARM","DINS_CHARM",
    ],
    "butterfly": ["BOW_BUTTERFLY","DIG_BUTTERFLY","SWIM_BUTTERFLY"],
    "dungeon": [
        "DUNGEON_MAP_DWS","DUNGEON_MAP_COF","DUNGEON_MAP_FOW","DUNGEON_MAP_TOD",
        "DUNGEON_MAP_POW","DUNGEON_MAP_DHC",
        "DUNGEON_COMPASS_DWS","DUNGEON_COMPASS_COF","DUNGEON_COMPASS_FOW",
        "DUNGEON_COMPASS_TOD","DUNGEON_COMPASS_POW","DUNGEON_COMPASS_DHC",
        "BIG_KEY_DWS","BIG_KEY_COF","BIG_KEY_FOW","BIG_KEY_TOD","BIG_KEY_POW","BIG_KEY_DHC",
        "SMALL_KEY_DWS","SMALL_KEY_COF","SMALL_KEY_FOW","SMALL_KEY_TOD",
        "SMALL_KEY_POW","SMALL_KEY_DHC","SMALL_KEY_RC",
    ],
    "kinstone": [
        "KINSTONE_GOLD_CLOUD","KINSTONE_GOLD_SWAMP","KINSTONE_GOLD_FALLS",
        "KINSTONE_RED_W","KINSTONE_RED_ANGLE","KINSTONE_RED_E",
        "KINSTONE_BLUE_L","KINSTONE_BLUE_6",
        "KINSTONE_GREEN_ANGLE","KINSTONE_GREEN_SQUARE","KINSTONE_GREEN_P","KINSTONE_BAG",
    ],
    "fusion": [f"FUSION_{i:02X}" for i in range(1, 0x65)],
    "trap": [
        "TRAP_ICE","TRAP_FIRE","TRAP_ZAP","TRAP_BOMB","TRAP_MONEY",
        "TRAP_STINK","TRAP_ROPE","TRAP_BAT","TRAP_LIKE","TRAP_CURSE",
    ],
    "filler": [
        "RUPEES_1","RUPEES_5","RUPEES_20","RUPEES_50","RUPEES_100","RUPEES_200",
        "SHELLS_30","HEART_REFILL","FAIRY_REFILL",
        "BOMB_REFILL_5","BOMB_REFILL_10","BOMB_REFILL_30",
        "ARROW_REFILL_5","ARROW_REFILL_10","ARROW_REFILL_30",
        "BRIOCHE","CROISSANT","PIE","CAKE","FIGURINE",
    ],
}

KEY_TO_CATEGORY = {}
for cat, keys in ITEM_CATEGORIES.items():
    for k in keys:
        KEY_TO_CATEGORY[k] = cat


def annotate_items(item_table: dict) -> list[dict]:
    items = []
    for key, data in item_table.items():
        entry = dict(data)
        entry["category"] = KEY_TO_CATEGORY.get(key, "other")
        items.append(entry)
    return items


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Extracting TMC data...")
    tmc_items, tmc_locs, tmc_regions, tmc_events = parse_constants()

    print("Parsing item_table...")
    item_table = parse_item_table(tmc_items)

    print("Parsing all_locations...")
    locations = parse_all_locations(tmc_locs, tmc_regions, tmc_items)

    print("Building regions...")
    regions = build_regions(tmc_regions, locations)

    print("Building AP tables...")
    ap_tables = build_ap_tables(item_table, locations)

    items_list = annotate_items(item_table)

    # ── Minimal AP tables (id + key only) ────────────────────────────────────────
    items_ap = [{"item_id": d["item_id"], "key": d["key"]} for d in items_list if d["item_id"] is not None]
    locs_ap  = [{"id": l["id"], "key": l["key"]} for l in locations if l["id"] is not None]

    (DATA_OUT / "items.json").write_text(
        json.dumps(items_ap, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  -> data/items.json ({len(items_ap)} items, id+key only)")

    (DATA_OUT / "locations.json").write_text(
        json.dumps(locs_ap, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  -> data/locations.json ({len(locs_ap)} locations, id+key only)")

    # ── names.json: display names indexed by key ─────────────────────────────────
    names = {
        "items":     {d["key"]: d["name"] for d in items_list},
        "locations": {l["key"]: l["name"] for l in locations if l["key"]},
    }
    (DATA_OUT / "names.json").write_text(
        json.dumps(names, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  -> data/names.json ({len(names['items'])} item names, {len(names['locations'])} location names)")

    # ── location_meta.json: logic/display fields for frontend ────────────────────
    loc_meta = [
        {
            "id":           l["id"],
            "key":          l["key"],
            "name":         l["name"],
            "region_key":   l["region_key"],
            "region_name":  l["region_name"],
            "dungeon":      l["dungeon"],
            "pools":        l["pools"],
            "room_area":    l.get("room_area"),
            "scoutable":    l.get("scoutable", False),
            "vanilla_item": l.get("vanilla_item"),
        }
        for l in locations
    ]
    (DATA_OUT / "location_meta.json").write_text(
        json.dumps(loc_meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  -> data/location_meta.json ({len(loc_meta)} entries)")

    (DATA_OUT / "regions.json").write_text(
        json.dumps(regions, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  -> data/regions.json ({len(regions)} regions)")

    (DATA_OUT / "ap_tables.json").write_text(
        json.dumps(ap_tables, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  -> data/ap_tables.json ({len(ap_tables['items'])} item IDs, {len(ap_tables['locations'])} location IDs)")

    print("Done!")


if __name__ == "__main__":
    main()
