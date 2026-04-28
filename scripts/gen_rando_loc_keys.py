"""
Extracts location names from default.logic and attempts to match them
to entries in location_meta.json by key, then writes key_rando into location_meta.json.

Run modes:
  py scripts/gen_rando_loc_keys.py --report   # show matches + unmatched (default)
  py scripts/gen_rando_loc_keys.py --apply    # inject key_rando into location_meta.json
"""
import json
import re
import sys
from pathlib import Path

LOGIC_FILE = Path(__file__).parent.parent / "SubModule/randomizer/RandomizerCore/Resources/default.logic"
META_FILE  = Path(__file__).parent.parent / "data/location_meta.json"
MANUAL_MAP_FILE = Path(__file__).parent / "rando_loc_manual_map.json"
FUSION_MAP_FILE = Path(__file__).parent / "fusion_slot_map.json"

KEPT_TYPES = {"Any", "Dungeon", "Major", "Minor", "Nice", "Unshuffled", "UnshuffledPrize", "DungeonPrize",
              "Inaccessible"}
# Types that are structural/routing — not trackable locations
SKIP_TYPES = {"Helper", "Music", "DungeonEntrance", "DungeonConstraint", "OverworldConstraint"}

# Patterns that signal compact format: type is embedded in the name field,
# while parts[1] holds a ROM address or a variable-name define reference.
# Valid types always start with an uppercase letter or backtick.
_ADDR_PAT = re.compile(r"^0x[0-9A-Fa-f]|^\d+-|^[a-z]")


def extract_rando_locations(logic_text: str) -> list[str]:
    """Return list of unique location names from default.logic, preserving order."""
    names = []
    seen = set()
    for line in logic_text.splitlines():
        # strip inline comments
        if "#" in line:
            line = line[:line.index("#")]
        line = line.strip()
        if not line or line.startswith("!"):
            continue
        parts = [p.strip() for p in line.split(";")]
        if len(parts) < 2:
            continue
        loc_type = parts[1].strip()

        # Compact format: some lines embed type as last backtick in the name field,
        # leaving the ROM address in the type slot.  Detect and fix.
        if _ADDR_PAT.match(loc_type):
            backticks = re.findall(r"`[^`]*`", parts[0])
            loc_type = backticks[-1] if backticks else ""

        # Skip structural types
        if loc_type in SKIP_TYPES:
            continue
        # Accept explicit kept types OR backtick-defined types (e.g. `CUCCO1`)
        is_backtick_type = loc_type.startswith("`") and loc_type.endswith("`")
        if loc_type not in KEPT_TYPES and not is_backtick_type:
            continue
        # strip backtick define suffixes: "Name `SUFFIX`" -> "Name"
        raw_name = re.sub(r"`[^`]*`", "", parts[0]).strip()
        # strip colon-separated dungeon IDs: "Name:DungeonID:NoSpoiler" -> "Name"
        raw_name = raw_name.split(":")[0].strip()
        # skip item pool entries
        if raw_name.startswith(("Items.", "Dummy_", "Shared", "FakeDojo")):
            continue
        if raw_name and raw_name not in seen:
            names.append(raw_name)
            seen.add(raw_name)
    return names


def camel_to_upper_snake(seg: str) -> str:
    """CamelCase segment to UPPER_SNAKE.

    'SlugTorches' -> 'SLUG_TORCHES'
    'CoF'         -> 'COF'          (abbreviation: final uppercase not split)
    '80Item'      -> '80_ITEM'      (digit before word)
    'NPC1'        -> 'NPC1'         (short suffix, left as-is)
    """
    # lowercase -> Uppercase-starting-a-word (lookahead: must be followed by lowercase)
    # This avoids splitting 'CoF' -> 'CO_F' since 'F' has no following lowercase.
    seg = re.sub(r"([a-z])([A-Z](?=[a-z]))", r"\1_\2", seg)
    # digit -> Uppercase-starting-a-word  ('80Item' -> '80_Item')
    seg = re.sub(r"([0-9])([A-Z](?=[a-z]))", r"\1_\2", seg)
    return seg.upper()


def rando_to_ap_key(rando_name: str) -> str:
    """Convert rando location name to AP key format.

    Examples:
      Smith_House_Chest       -> SMITH_HOUSE_CHEST
      SouthField_Tingle_NPC   -> SOUTH_FIELD_TINGLE_NPC
      Town_CafeLady_NPC       -> TOWN_CAFE_LADY_NPC
      CoF_B1_HazyRoom_BigChest -> COF_B1_HAZY_ROOM_BIG_CHEST
      Droplets_LeftPath_B1_Waterfall_BigChest -> DROPLETS_LEFT_PATH_B1_WATERFALL_BIG_CHEST
    """
    segments = rando_name.split("_")
    return "_".join(camel_to_upper_snake(s) for s in segments)


def main():
    apply_mode = "--apply" in sys.argv

    logic_text = LOGIC_FILE.read_text(encoding="utf-8")
    rando_names = extract_rando_locations(logic_text)

    meta = json.loads(META_FILE.read_text(encoding="utf-8"))
    ap_key_to_entry = {loc["key"]: loc for loc in meta}

    # Load manual overrides (rando_name -> ap_key | null)
    manual_map: dict[str, str | None] = {}
    if MANUAL_MAP_FILE.exists():
        manual_map = json.loads(MANUAL_MAP_FILE.read_text(encoding="utf-8"))

    # Load fusion slot map (ap_key -> helper reference like "Helpers.BelariFusion")
    fusion_slot_map: dict[str, str] = {}
    if FUSION_MAP_FILE.exists():
        fusion_slot_map = json.loads(FUSION_MAP_FILE.read_text(encoding="utf-8"))

    matched   = {}   # rando_name -> ap_key
    unmatched = []   # rando_name

    for rando_name in rando_names:
        if rando_name in manual_map:
            target = manual_map[rando_name]
            matched[rando_name] = target
            continue
        candidate = rando_to_ap_key(rando_name)
        if candidate in ap_key_to_entry:
            matched[rando_name] = candidate
        else:
            unmatched.append(rando_name)

    # Build reverse map: ap_key -> rando_name  (for injection)
    ap_to_rando = {v: k for k, v in matched.items() if v is not None}

    if not apply_mode:
        print(f"Rando locations found : {len(rando_names)}")
        print(f"Auto-matched          : {len(matched)}")
        print(f"Unmatched             : {len(unmatched)}")
        print(f"Fusion slot map       : {len(fusion_slot_map)} entries")
        print()
        if unmatched:
            print("=== UNMATCHED (need manual map in scripts/rando_loc_manual_map.json) ===")
            for name in unmatched:
                print(f"  {name}")
        print()
        print("=== AP locations without key_rando ===")
        not_covered = [loc["key"] for loc in meta
                       if loc["key"] not in ap_to_rando
                       and loc["key"] not in fusion_slot_map]
        for k in not_covered:
            print(f"  {k}")
        return

    # Apply mode: inject key_rando
    for loc in meta:
        ap_key = loc["key"]
        if ap_key in fusion_slot_map:
            loc["key_rando"] = fusion_slot_map[ap_key]
        else:
            loc["key_rando"] = ap_to_rando.get(ap_key, None)

    META_FILE.write_text(
        json.dumps(meta, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    non_null = sum(1 for loc in meta if loc.get("key_rando") is not None)
    print(f"Wrote key_rando to {len(meta)} entries ({non_null} non-null).")


if __name__ == "__main__":
    main()
