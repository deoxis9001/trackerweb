"""
Converts randomizer Settings YAML presets into src/data/presets.json.
Filename suffix _N determines display order.
"""
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required: py -m pip install pyyaml", file=sys.stderr)
    sys.exit(1)

PRESETS_DIR = Path(__file__).parent.parent / "SubModule/randomizer/MinishCapRandomizerUI/Resources/Presets/Settings"
OUT_FILE = Path(__file__).parent.parent / "src/data/presets.json"


def sort_key(path: Path) -> int:
    m = re.search(r"_(\d+)\.yaml$", path.name)
    return int(m.group(1)) if m else 9999


def load_preset(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return {
        "name": data.get("name", path.stem),
        "description": data.get("description", ""),
        "settings": data.get("settings", {}),
    }


def main():
    if not PRESETS_DIR.exists():
        print(f"Presets dir not found: {PRESETS_DIR}", file=sys.stderr)
        print("Run: git submodule update --init SubModule/randomizer", file=sys.stderr)
        sys.exit(1)

    files = sorted(PRESETS_DIR.glob("*.yaml"), key=sort_key)
    if not files:
        print(f"No YAML files found in {PRESETS_DIR}", file=sys.stderr)
        sys.exit(1)

    presets = [load_preset(f) for f in files]

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(presets, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(presets)} presets -> {OUT_FILE}")


if __name__ == "__main__":
    main()
