#!/usr/bin/env python3
"""
Generate language files from APWorld constants.py.

Steps:
  1. Parse SubModule/TMC-APWorld/tmc/constants.py to extract
     TMCItem, TMCLocation, TMCRegion enums.
  2. Write src/langue/en/items.json, locations.json, regions.json.
  3. For each other language, copy missing EN entries as placeholders
     (values identical to EN are left for the translator to fill in).

Usage:
  python generate_translations.py              # sync all languages
  python generate_translations.py --lang fr,de # specific languages only
  python generate_translations.py --en-only    # only regenerate EN files
"""

import json
import re
import sys
import argparse
from pathlib import Path

ROOT         = Path(__file__).parent
CONSTANTS_PY = ROOT / "SubModule/TMC-APWorld/tmc/constants.py"
LANGUE_DIR   = ROOT / "src/langue"
REF_LANG     = "en"

SKIP_ITEMS = {"INACCESSIBLE", "BOTTLE", "KINSTONE", "KINSTONE_BAG", "PROGRESSIVE_BOMB"}


def parse_constants() -> dict[str, dict[str, str]]:
    """
    Parse TMCItem, TMCLocation, TMCRegion StrEnum classes from constants.py
    without importing the module (no Archipelago dependency needed).
    Returns { "TMCItem": {name: value, ...}, ... }
    """
    text = CONSTANTS_PY.read_text(encoding="utf-8")
    enums: dict[str, dict[str, str]] = {}
    current: str | None = None

    for line in text.splitlines():
        m = re.match(r'^class (TMC\w+)\(', line)
        if m:
            current = m.group(1)
            enums[current] = {}
            continue

        if line and not line[0].isspace():
            current = None

        if current:
            m = re.match(r'^\s+(\w+)\s*=\s*"([^"]*)"', line)
            if m:
                enums[current][m.group(1)] = m.group(2)

    return enums


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {path.relative_to(ROOT)}  ({len(data)} entries)")


def generate_en_files(enums: dict) -> dict[str, dict[str, str]]:
    items     = {k: v for k, v in enums.get("TMCItem", {}).items() if k not in SKIP_ITEMS}
    locations = dict(enums.get("TMCLocation", {}))
    regions   = dict(enums.get("TMCRegion", {}))

    print("\n[EN] Generating reference files…")
    write_json(LANGUE_DIR / "en/items.json",     items)
    write_json(LANGUE_DIR / "en/locations.json", locations)
    write_json(LANGUE_DIR / "en/regions.json",   regions)

    return {"items": items, "locations": locations, "regions": regions}


def process_lang(code: str, en_data: dict[str, dict]) -> None:
    lang_dir = LANGUE_DIR / code
    if not lang_dir.exists():
        print(f"\n[{code.upper()}] directory not found — skipping.")
        return

    print(f"\n[{code.upper()}]")

    for file_name, en_entries in en_data.items():
        target_path = lang_dir / f"{file_name}.json"
        target = load_json(target_path)

        # Only add entries that are completely absent
        missing = {k: v for k, v in en_entries.items() if k not in target}

        if not missing:
            print(f"  {file_name}.json — up to date ({len(target)} entries)")
            continue

        print(f"  {file_name}.json — {len(missing)} missing entries added (EN placeholder)")
        for k, v in missing.items():
            target[k] = v
            print(f"    + {k}: {v!r}")

        write_json(target_path, target)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync language files from APWorld constants.py"
    )
    parser.add_argument(
        "--lang",
        help="Comma-separated language codes (default: all non-EN directories)",
    )
    parser.add_argument(
        "--en-only",
        action="store_true",
        help="Only generate/update EN reference files",
    )
    args = parser.parse_args()

    if not CONSTANTS_PY.exists():
        print(f"Error: {CONSTANTS_PY} not found.")
        print("Run: git submodule update --init")
        sys.exit(1)

    print(f"Parsing {CONSTANTS_PY.relative_to(ROOT)} …")
    enums   = parse_constants()
    en_data = generate_en_files(enums)

    if args.en_only:
        print("\nDone.")
        return

    langs = (
        [l.strip() for l in args.lang.split(",")]
        if args.lang else
        [d.name for d in sorted(LANGUE_DIR.iterdir()) if d.is_dir() and d.name != REF_LANG]
    )

    for code in langs:
        process_lang(code, en_data)

    print("\nAll done.")


if __name__ == "__main__":
    main()
