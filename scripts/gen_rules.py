"""
gen_rules.py — Auto-generates src/logic/rules_generated.js from TMC-APWorld/tmc/rules.py

Translates REGION_RULES and LOCATION_RULES Python dicts to equivalent JS objects.
No AP framework installation required — uses Python AST only.

Usage:  py scripts/gen_rules.py
"""

import ast
import json
import sys
from pathlib import Path

ROOT    = Path(__file__).parent.parent
SRC_INF = ROOT / 'SubModule' / 'TMC-APWorld' / 'tmc'
OUT     = ROOT / 'src' / 'logic' / 'rules_generated.js'

# ─── Python name → JS expression  ─────────────────────────────────────────────
# Values that are already correct JS function references or inline lambdas.

PYTHON_TO_JS = {
    # Sword / combat
    'has_sword': 'hasSword', 'has_shield': 'hasShield', 'has_mirror_shield': 'hasMirrorShield',
    'has_bow': 'hasBow', 'has_lightarrows': 'hasLightArrows',
    'has_boomerang': 'hasBoomerang', 'has_magic_boomerang': 'hasMagicBoomerang',
    'has_bow_weapon': 'hasBow', 'has_bomb_weapon': 'hasBombWeapon',
    'has_bomb_weapon_boss': 'hasBombWeaponBoss', 'has_gust_weapon': 'hasGustWeapon',
    'has_lantern_weapon': 'hasLanternWeapon',
    'has_weapon': 'hasWeapon', 'has_weapon_boss': 'hasWeaponBoss',
    'has_weapon_scissor': 'hasWeaponScissor', 'has_weapon_wizzrobe': 'hasWeaponWizzrobe',
    'has_weapon_helm_ghini': 'hasWeaponWizzrobe', 'has_weapon_gleerok_mazaal': 'hasWeaponBoss',
    'can_spin': 'canSpin', 'can_beam': 'canBeam', 'can_hit_distance': 'canHitDistance',
    'can_pass_trees': 'canPassTrees',
    # Trick-gated helpers
    'blow_dust': 'blowDust', 'mushroom': 'mushroom', 'arrow_break': 'arrowBreak',
    'likelike': 'likelike', 'dark_room': 'darkRoom', 'cape_extend': 'capeExtend',
    'lake_minish': 'lakeMinish', 'cabin_swim': 'cabinSwim',
    'fow_pot': 'fowPot', 'pow_jump': 'powJump', 'downthrust': 'downthrust',
    'shark_kill': 'sharkKill',
    # Access helpers
    'access_town_left': 'accessTownLeft', 'has_bottle': 'hasBottle',
    'access_town_fountain': 'accessTownFountain',
    'access_lonlon_right': 'accessLonLonRight',
    'access_minish_woods_top_left': 'accessMinishWoodsTopLeft',
    'complete_book_quest': 'completeBookQuest',
    # Wind crests
    'smith_crest': 'smithCrest', 'crenel_crest': 'crenelCrest', 'falls_crest': 'fallsCrest',
    'clouds_crest': 'cloudsCrest', 'swamp_crest': 'swampCrest', 'minish_crest': 'minishCrest',
    # Gold fusions
    'clouds_all_can_fuse_rule': 'cloudsAllCanFuse', 'clouds_has_fusion_rule': 'cloudsHasFusion',
    'swamps_all_can_fuse_rule': 'swampsAllCanFuse', 'swamps_has_fusion_rule': 'swampsHasFusion',
    'falls_can_fuse_rule': 'fallsCanFuse', 'falls_has_fusion_rule': 'fallsHasFusion',
    # Dungeon key rules
    'dws_one_key_rule': 'dwsKey(1)', 'dws_two_key_rule': 'dwsKey(2)',
    'dws_three_key_rule': 'dwsKey(3)', 'dws_four_key_rule': 'dwsKey(4)',
    'cof_one_key_rule': 'cofKey(1)', 'cof_two_key_rule': 'cofKey(2)',
    'fow_one_key_rule': 'fowKey(1)', 'fow_two_key_rule': 'fowKey(2)',
    'fow_three_key_rule': 'fowKey(3)', 'fow_four_key_rule': 'fowKey(4)',
    'tod_one_key_rule': 'todKey(1)', 'tod_two_key_rule': 'todKey(2)',
    'tod_three_key_rule': 'todKey(3)', 'tod_four_key_rule': 'todKey(4)',
    'rc_one_key_rule': 'rcKey(1)', 'rc_two_key_rule': 'rcKey(2)', 'rc_three_key_rule': 'rcKey(3)',
    'pow_one_key_rule': 'powKey(1)', 'pow_two_key_rule': 'powKey(2)',
    'pow_three_key_rule': 'powKey(3)', 'pow_four_key_rule': 'powKey(4)',
    'pow_five_key_rule': 'powKey(5)', 'pow_six_key_rule': 'powKey(6)',
    'dhc_one_key_rule': 'dhcKey(1)', 'dhc_two_key_rule': 'dhcKey(2)',
    'dhc_three_key_rule': 'dhcKey(3)', 'dhc_four_key_rule': 'dhcKey(4)',
    'dhc_five_key_rule': 'dhcKey(5)',
    # DHC trick-gated moves (manually translated for correctness)
    'dhc_cannons': "(i,s) => (hasSword(i,s) && hasBombWeapon(i,s)) || s.hasTrick('dhc_cannons') || canSplit(4)(i,s)",
    'dhc_pads':    "(i,s) => canSplit(2,true)(i,s) || s.hasTrick('dhc_clones') || canSplit(4)(i,s)",
    'dhc_spin':    "(i,s) => canSpin(i,s) || s.hasTrick('dhc_spin') || canSplit(4)(i,s)",
    'dhc_switch_gap': "(i,s) => hasBow(i,s) || hasBoomerang(i,s) || canBeam(i,s)",
    'dhc_south_towers': "(i,s) => s.warpDHC!==0 || hasAny(\"Bomb Bag\",\"Roc's Cape\")(i)",
    # PoW pot puzzle (involves a TMCEvent that the tracker treats as an item)
    'pow_pot': "(i,s) => (has(\"Power Bracelets\")(i) && powKey(1)(i)) || (powKey(6)(i) && s.hasTrick('pot_puzzle'))",
    # ToD switch (involves TMCEvent treated as item)
    'tod_right_ice': "(i,s) => has(\"Lantern\")(i) || has(\"Droplets East Switch\")(i)",
}

# ─── OptionFilter → JS settings check  ────────────────────────────────────────
# Maps Python option class name → JS settings info.

OPTION_CFG = {
    'DHCAccess':          {'prop': 'dhcAccess',           'enum': {0:"'closed'", 1:"'pedestal'", 2:"'open'"}},
    'GoldFusionAccess':   {'prop': 'goldFusionAccess',    'enum': {0:"'closed'", 1:"'vanilla'", 2:"'combined'", 3:"'open'"}},
    'WarpDWS':  {'prop': 'warpDWS',  'numeric': True},
    'WarpCoF':  {'prop': 'warpCoF',  'numeric': True},
    'WarpFoW':  {'prop': 'warpFoW',  'numeric': True},
    'WarpToD':  {'prop': 'warpToD',  'numeric': True},
    'WarpPoW':  {'prop': 'warpPoW',  'numeric': True},
    'WarpDHC':  {'prop': 'warpDHC',  'numeric': True},
    'WindCrestCrenel':     {'prop': 'windCrestCrenel',      'bool': True},
    'WindCrestFalls':      {'prop': 'windCrestFalls',       'bool': True},
    'WindCrestClouds':     {'prop': 'windCrestClouds',      'bool': True},
    'WindCrestSwamp':      {'prop': 'windCrestCastor',      'bool': True},
    'WindCrestSmith':      {'prop': 'windCrestSouthField',  'bool': True},
    'WindCrestMinish':     {'prop': 'windCrestMinishWoods', 'bool': True},
    'WeaponBow':     {'prop': 'weaponBow',     'bool': True},
    'WeaponBomb':    {'prop': 'weaponBomb',    'numeric': True},
    'WeaponGust':    {'prop': 'weaponGust',    'bool': True},
    'WeaponLantern': {'prop': 'weaponLantern', 'bool': True},
    'GoronJPPrices': {'prop': 'goronJPPrices', 'bool': True},
    'Tricks': {'trick': True},
}

# Attribute names on option classes → integer values (for OptionFilter comparisons).
# Maps TMCTricks string values → tracker internal trick keys (used in hasTrick calls).
TRICK_AP_TO_TRACKER = {
    'bombable_dust':              'bomb_dust',
    'crenel_mushroom_gust_jar':   'mushroom',
    'light_arrows_break_objects': 'arrows_break',
    'bobombs_destroy_walls':      'bobomb_walls',
    'like_like_cave_no_sword':    'likelike_swordless',
    'boots_skip_town_guard':      'boots_guards',
    'beam_crenel_switch':         'beam_crenel_switch',
    'down_thrust_spikey_beetle':  'downthrust_beetle',
    'dark_rooms_no_lantern':      'dark_rooms',
    'cape_extensions':            'cape_extensions',
    'lake_minish_no_boots':       'lake_minish',
    'cabin_swim_no_lilypad':      'cabin_swim',
    'cloud_sharks_no_weapons':    'sharks_swordless',
    'pow_2f_no_cane':             'pow_nocane',
    'pot_puzzle_no_bracelets':    'pot_puzzle',
    'fow_pot_gust_jar':           'fow_pot',
    'dhc_cannons_no_four_sword':  'dhc_cannons',
    'dhc_pads_no_four_sword':     'dhc_clones',
    'dhc_switches_no_four_sword': 'dhc_spin',
}

OPTION_ATTR_VALUES = {
    'DHCAccess':        {'option_closed': 0, 'option_pedestal': 1, 'option_open': 2},
    'GoldFusionAccess': {'option_closed': 0, 'option_vanilla': 1, 'option_combined': 2, 'option_open': 3},
}

# ─── Load constants.py enums via AST  ─────────────────────────────────────────

def _load_enum(tree, class_name):
    """Extract {attr_name: string_value} from a StrEnum class in the AST."""
    result = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            for stmt in node.body:
                if isinstance(stmt, ast.Assign):
                    for tgt in stmt.targets:
                        if isinstance(tgt, ast.Name) and isinstance(stmt.value, ast.Constant):
                            result[tgt.id] = stmt.value.value
    return result

constants_src = (SRC_INF / 'constants.py').read_text(encoding='utf-8')
constants_tree = ast.parse(constants_src)
ITEMS     = _load_enum(constants_tree, 'TMCItem')
REGIONS   = _load_enum(constants_tree, 'TMCRegion')   # attr → human string (unused for keys)
LOCATIONS = _load_enum(constants_tree, 'TMCLocation')
EVENTS    = _load_enum(constants_tree, 'TMCEvent')
TRICKS    = _load_enum(constants_tree, 'TMCTricks')

# ─── Parse rules.py  ──────────────────────────────────────────────────────────

rules_src  = (SRC_INF / 'rules.py').read_text(encoding='utf-8')
rules_tree = ast.parse(rules_src)

# First pass: collect module-level filter-list variables.
# e.g. dws_warp_blue_filter = [OptionFilter(WarpDWS, (1,3), operator="in")]
filter_vars = {}   # name → JS filter-check expression

def _option_filter_js(call):
    """Translate a single OptionFilter AST Call → JS expression string or None."""
    args = call.args
    kwargs = {kw.arg: kw.value for kw in call.keywords}
    if len(args) < 2:
        return None
    # arg0: option class name
    opt_name = args[0].id if isinstance(args[0], ast.Name) else None
    cfg = OPTION_CFG.get(opt_name)
    if cfg is None:
        return None

    # arg1: value (int, tuple, or Attribute)
    val_node = args[1]
    operator = kwargs.get('operator')
    op_val   = operator.value if isinstance(operator, ast.Constant) else 'eq'

    if cfg.get('trick'):
        # OptionFilter(Tricks, TMCTricks.TRICK_NAME, operator="contains")
        if isinstance(val_node, ast.Attribute) and isinstance(val_node.value, ast.Name):
            trick_key = TRICKS.get(val_node.attr, val_node.attr)
            trick_key = TRICK_AP_TO_TRACKER.get(trick_key, trick_key)
            return f"(i,s)=>s.hasTrick({json.dumps(trick_key)})"
        return None

    prop = cfg['prop']

    def _resolve_val(node):
        """Resolve OptionFilter value node to a JS-comparable value."""
        if isinstance(node, ast.Constant):
            v = node.value
            if cfg.get('enum'):
                return cfg['enum'].get(v, str(v))
            return str(v)
        if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
            cls = node.value.id
            attr_map = OPTION_ATTR_VALUES.get(cls, {})
            int_val = attr_map.get(node.attr)
            if int_val is not None and cfg.get('enum'):
                return cfg['enum'].get(int_val, str(int_val))
            if int_val is not None:
                return str(int_val)
        return None

    if isinstance(val_node, ast.Tuple):
        # operator="in" with a tuple of values
        parts = [f"s.{prop}==={_resolve_val(e)}" for e in val_node.elts if _resolve_val(e)]
        if not parts:
            return None
        return f"(i,s)=>({' || '.join(parts)})"

    resolved = _resolve_val(val_node)
    if resolved is None:
        return None

    if op_val == 'eq' or op_val is None:
        if cfg.get('bool'):
            return f"(i,s)=>!!s.{prop}"
        return f"(i,s)=>s.{prop}==={resolved}"
    if op_val == 'ne':
        return f"(i,s)=>s.{prop}!=={resolved}"
    if op_val == 'gt':
        return f"(i,s)=>s.{prop}>{resolved}"
    if op_val == 'lt':
        return f"(i,s)=>s.{prop}<{resolved}"
    return None


def _filter_list_js(node):
    """Translate a List of OptionFilter calls → combined JS filter string or None."""
    if not isinstance(node, ast.List):
        return None
    parts = []
    for elt in node.elts:
        if isinstance(elt, ast.Call) and isinstance(elt.func, ast.Name) and elt.func.id == 'OptionFilter':
            js = _option_filter_js(elt)
            if js:
                parts.append(js)
    if not parts:
        return None
    if len(parts) == 1:
        return parts[0]
    return 'and(' + ', '.join(parts) + ')'


for stmt in rules_tree.body:
    if not isinstance(stmt, ast.Assign):
        continue
    if len(stmt.targets) != 1 or not isinstance(stmt.targets[0], ast.Name):
        continue
    name = stmt.targets[0].id
    if isinstance(stmt.value, ast.List):
        js = _filter_list_js(stmt.value)
        if js:
            filter_vars[name] = js

# rule_vars: populated by the second pass below (after translate() is defined).
rule_vars = {}   # name → JS expression (for module-level rule assignments)

# ─── Expression translator  ───────────────────────────────────────────────────

_warns = []

def _warn(msg):
    _warns.append(msg)
    print(f'  [warn] {msg}', file=sys.stderr)

def _wrap(expr):
    """Wrap an expression in 'and(...)' if it's a bare arrow function."""
    return expr


def translate(node):  # noqa: C901
    """Translate an AST node to a JS expression string (a callable rule function)."""
    if node is None:
        return 'always'

    # None constant
    if isinstance(node, ast.Constant):
        if node.value is None:
            return 'always'
        if node.value is True:
            return 'always'
        if node.value is False:
            return 'never'
        return 'always'

    # Name reference
    if isinstance(node, ast.Name):
        id_ = node.id
        if id_ in ('None', 'True_', 'True', 'always'):
            return 'always'
        if id_ in ('False_', 'False', 'never'):
            return 'never'
        # Known JS equivalent
        if id_ in PYTHON_TO_JS:
            return PYTHON_TO_JS[id_]
        # Filter list variable used as a standalone rule
        if id_ in filter_vars:
            return filter_vars[id_]
        # Module-level rule variable (e.g. dws_blue_warp, pow_1st_door)
        if id_ in rule_vars:
            return rule_vars[id_]
        _warn(f'unknown name: {id_}')
        return f'always /* {id_} */'

    # Attribute access (TMCItem.X, TMCRegion.X, etc.)
    if isinstance(node, ast.Attribute):
        obj = node.value.id if isinstance(node.value, ast.Name) else None
        attr = node.attr
        if obj == 'TMCItem':
            name = ITEMS.get(attr)
            if name:
                return f'has({json.dumps(name)})'
        if obj == 'TMCEvent':
            name = EVENTS.get(attr)
            if name:
                return f'has({json.dumps(name)})'
        if obj == 'TMCRegion':
            return json.dumps(attr)  # region key = attr name
        if obj == 'TMCLocation':
            name = LOCATIONS.get(attr, attr)
            return json.dumps(name)
        _warn(f'unknown attribute: {obj}.{attr}')
        return 'always'

    # Function call
    if isinstance(node, ast.Call):
        return _translate_call(node)

    # Binary operator: a | b  or  a & b
    if isinstance(node, ast.BinOp):
        return _translate_binop(node)

    # List of OptionFilters (used as inline filter)
    if isinstance(node, ast.List):
        js = _filter_list_js(node)
        if js:
            return js
        return 'always'

    _warn(f'unhandled node type: {type(node).__name__}')
    return 'always'


def _translate_call(node):  # noqa: C901
    func = node.func
    func_name = func.id if isinstance(func, ast.Name) else (
        func.attr if isinstance(func, ast.Attribute) else None)
    if func_name is None:
        return 'always'

    args = node.args
    kwargs = {kw.arg: kw.value for kw in node.keywords}

    # ── Has(item) / Has(item, count) / Has(item, count=N, options=[...]) ──────
    if func_name == 'Has':
        if not args:
            return 'always'
        item_js = _attr_to_name(args[0])
        count = 1
        if len(args) >= 2:
            count = args[1].value if isinstance(args[1], ast.Constant) else 1
        if 'count' in kwargs:
            count = _resolve_count(kwargs['count'])
        base = f'has({item_js}, {count})' if count != 1 else f'has({item_js})'
        if 'options' in kwargs:
            f_js = _resolve_filter_kwarg(kwargs['options'])
            if f_js:
                return f'and({base}, {f_js})'
        return base

    # ── HasAny(*items) ────────────────────────────────────────────────────────
    if func_name == 'HasAny':
        names = [_attr_to_name(a) for a in args]
        js = f'hasAny({", ".join(names)})'
        if 'options' in kwargs:
            f_js = _resolve_filter_kwarg(kwargs['options'])
            if f_js:
                return f'and({js}, {f_js})'
        return js

    # ── HasAll(*items) ────────────────────────────────────────────────────────
    if func_name == 'HasAll':
        names = [_attr_to_name(a) for a in args]
        js = f'hasAll({", ".join(names)})'
        if 'options' in kwargs:
            f_js = _resolve_filter_kwarg(kwargs['options'])
            if f_js:
                return f'and({js}, {f_js})'
        return js

    # ── HasGroup(*groups) ─────────────────────────────────────────────────────
    if func_name == 'HasGroup':
        if args:
            grp = args[0].value if isinstance(args[0], ast.Constant) else 'unknown'
            if grp == 'Bottle':
                return 'hasBottle'
            if grp == 'Elements':
                return f'hasAll("Earth Element","Fire Element","Water Element","Wind Element")'
        return 'always'

    # ── And(*rules, options=[...]) ────────────────────────────────────────────
    if func_name == 'And':
        parts = [translate(a) for a in args]
        if 'options' in kwargs:
            f_js = _resolve_filter_kwarg(kwargs['options'])
            if f_js:
                parts.append(f_js)
        if not parts:
            return 'always'
        return _make_and(parts)

    # ── Or(*rules, options=[...]) ─────────────────────────────────────────────
    if func_name == 'Or':
        parts = [translate(a) for a in args]
        if not parts:
            return 'always'
        rule_js = _make_or(parts)
        if 'options' in kwargs:
            f_js = _resolve_filter_kwarg(kwargs['options'])
            if f_js:
                # Bypass when filter doesn't pass: !filter || orRule
                return f'(i,s) => !({f_js})(i,s) || ({rule_js})(i,s)'
        return rule_js

    # ── True_(options=[...]) ─────────────────────────────────────────────────
    if func_name == 'True_':
        if 'options' in kwargs:
            f_js = _resolve_filter_kwarg(kwargs['options'])
            if f_js:
                return f_js
        return 'always'

    # ── False_() ─────────────────────────────────────────────────────────────
    if func_name == 'False_':
        return 'never'

    # ── CanSplit(n) / CanSplit(n, True) ──────────────────────────────────────
    if func_name == 'CanSplit':
        n = args[0].value if args and isinstance(args[0], ast.Constant) else 0
        allow_max = False
        if len(args) >= 2:
            allow_max = bool(args[1].value) if isinstance(args[1], ast.Constant) else False
        if 'allow_max' in kwargs:
            v = kwargs['allow_max']
            allow_max = bool(v.value) if isinstance(v, ast.Constant) else False
        if allow_max:
            return f'canSplit({n}, true)'
        return f'canSplit({n})'

    # ── CanPay(price | BoolMapperResolver) ───────────────────────────────────
    if func_name == 'CanPay':
        if not args:
            return 'always'
        price_node = args[0]
        if isinstance(price_node, ast.Constant):
            return f'canPay({price_node.value})'
        # BoolMapperResolver(GoronJPPrices, true_val, false_val) → use max
        if isinstance(price_node, ast.Call):
            inner = price_node.args
            if len(inner) >= 3:
                a = inner[1].value if isinstance(inner[1], ast.Constant) else 999
                b = inner[2].value if isinstance(inner[2], ast.Constant) else 999
                return f'canPay({max(a, b)})'
        return 'always'

    # ── HasMaxHealth(n) ───────────────────────────────────────────────────────
    if func_name == 'HasMaxHealth':
        n = args[0].value if args and isinstance(args[0], ast.Constant) else 1
        return f'hasMaxHealth({n})'

    # ── CanActivatePedestal() ─────────────────────────────────────────────────
    if func_name == 'CanActivatePedestal':
        return 'canActivatePedestal'

    # ── StupidToDWestIceblock() → use simple key check fallback ──────────────
    if func_name == 'StupidToDWestIceblock':
        return 'todKey(1)'

    # ── CanReachLocation(loc) → cannot express, always accessible ────────────
    if func_name == 'CanReachLocation':
        _warn(f'CanReachLocation not supported — using always')
        return 'always'

    # ── OptionFilter standalone call (should be in a List) ───────────────────
    if func_name == 'OptionFilter':
        js = _option_filter_js(node)
        return js if js else 'always'

    # ── Filtered / other rule_builder wrappers ────────────────────────────────
    if func_name == 'Filtered':
        if args:
            return translate(args[0])
        return 'always'

    _warn(f'unknown call: {func_name}')
    return f'always /* {func_name}() */'


def _translate_binop(node):
    left_node  = node.left
    right_node = node.right
    op         = node.op

    # Handle filter-list as right-hand side of & or |
    if isinstance(right_node, (ast.Name, ast.List)):
        if isinstance(right_node, ast.Name) and right_node.id in filter_vars:
            f_js = filter_vars[right_node.id]
            left_js = translate(left_node)
            if isinstance(op, ast.BitAnd):
                return _make_and([left_js, f_js])
            if isinstance(op, ast.BitOr):
                return _make_or([left_js, f_js])
        if isinstance(right_node, ast.List):
            f_js = _filter_list_js(right_node)
            if f_js:
                left_js = translate(left_node)
                if isinstance(op, ast.BitAnd):
                    return _make_and([left_js, f_js])
                if isinstance(op, ast.BitOr):
                    return _make_or([left_js, f_js])

    # Same for left-hand side
    if isinstance(left_node, (ast.Name, ast.List)):
        if isinstance(left_node, ast.Name) and left_node.id in filter_vars:
            f_js = filter_vars[left_node.id]
            right_js = translate(right_node)
            if isinstance(op, ast.BitAnd):
                return _make_and([f_js, right_js])
            if isinstance(op, ast.BitOr):
                return _make_or([f_js, right_js])
        if isinstance(left_node, ast.List):
            f_js = _filter_list_js(left_node)
            if f_js:
                right_js = translate(right_node)
                if isinstance(op, ast.BitAnd):
                    return _make_and([f_js, right_js])
                if isinstance(op, ast.BitOr):
                    return _make_or([f_js, right_js])

    left_js  = translate(left_node)
    right_js = translate(right_node)

    if isinstance(op, ast.BitAnd):
        return _make_and([left_js, right_js])
    if isinstance(op, ast.BitOr):
        return _make_or([left_js, right_js])

    _warn(f'unhandled BinOp: {type(op).__name__}')
    return left_js


# ─── JS combinator helpers  ───────────────────────────────────────────────────

def _make_and(parts):
    p = [x for x in parts if x != 'always']
    if not p:
        return 'always'
    if len(p) == 1:
        return p[0]
    return f'and({", ".join(p)})'

def _make_or(parts):
    if 'always' in parts:
        return 'always'
    if not parts:
        return 'never'
    if len(parts) == 1:
        return parts[0]
    return f'or({", ".join(parts)})'


def _attr_to_name(node):
    """Resolve TMCItem.X / TMCEvent.X → JSON string."""
    if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
        obj  = node.value.id
        attr = node.attr
        if obj == 'TMCItem':
            name = ITEMS.get(attr, attr)
            return json.dumps(name)
        if obj == 'TMCEvent':
            name = EVENTS.get(attr, attr)
            return json.dumps(name)
    if isinstance(node, ast.Constant):
        return json.dumps(node.value)
    return json.dumps('?')


def _resolve_count(node):
    """Extract integer count from count=N or count=FromMultiplierResolver(N, ...)."""
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Call):
        # FromMultiplierResolver(base, multiplier) — use base count
        if node.args and isinstance(node.args[0], ast.Constant):
            return node.args[0].value
    return 1


def _resolve_filter_kwarg(node):
    """Resolve options=filter_var or options=[OptionFilter(...)] → JS expression or None."""
    if isinstance(node, ast.Name):
        return filter_vars.get(node.id)
    if isinstance(node, ast.List):
        return _filter_list_js(node)
    return None


# ─── Second pass: collect module-level rule variable assignments  ─────────────
# Process after translate() is defined so we can use it recursively.
# We only translate simple assignments (not dicts, not filter lists, not class defs).

_SKIP_RULE_VARS = {'REGION_RULES', 'LOCATION_RULES', 'ORDERED_SWORDS', 'DUNGEON_CLEARS'}

for stmt in rules_tree.body:
    if not isinstance(stmt, ast.Assign):
        continue
    if len(stmt.targets) != 1 or not isinstance(stmt.targets[0], ast.Name):
        continue
    name = stmt.targets[0].id
    if name in _SKIP_RULE_VARS or name in PYTHON_TO_JS or name in filter_vars:
        continue
    val = stmt.value
    # Skip plain lists (already handled as filter_vars), dicts, constants
    if isinstance(val, (ast.Dict, ast.Constant, ast.List)):
        continue
    # Translate the expression and cache it
    try:
        js = translate(val)
        if js and js not in ('always', 'never'):
            rule_vars[name] = js
    except Exception:
        pass

# Clear accumulated warnings from the second pass — real warnings come from the main pass
_warns.clear()


# ─── Extract dicts from AST  ──────────────────────────────────────────────────

def _extract_dict(tree, var_name):
    """Find `VAR_NAME = {...}` at module level and return the ast.Dict node."""
    for stmt in tree.body:
        if isinstance(stmt, ast.Assign):
            if any(isinstance(t, ast.Name) and t.id == var_name for t in stmt.targets):
                if isinstance(stmt.value, ast.Dict):
                    return stmt.value
        if isinstance(stmt, ast.AnnAssign):
            if isinstance(stmt.target, ast.Name) and stmt.target.id == var_name:
                if isinstance(stmt.value, ast.Dict):
                    return stmt.value
    return None


def _dict_to_js(d_node, key_fn):
    """Convert an ast.Dict to a JS object literal string."""
    lines = []
    for k, v in zip(d_node.keys, d_node.values):
        key_str = key_fn(k)
        if key_str is None:
            continue
        val_str = translate(v)
        lines.append(f'  {key_str}: {val_str}')
    return '{\n' + ',\n'.join(lines) + '\n}'


def _region_key(node):
    """TMCRegion.X → 'X' (attribute name used as region key)."""
    if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
        if node.value.id == 'TMCRegion':
            return node.attr
    return None

def _location_key(node):
    """TMCLocation.X → JSON string of the location name."""
    if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
        if node.value.id == 'TMCLocation':
            name = LOCATIONS.get(node.attr, node.attr)
            return json.dumps(name)
    return None


# ─── Build REGION_RULES JS  ───────────────────────────────────────────────────

region_dict = _extract_dict(rules_tree, 'REGION_RULES')
if region_dict is None:
    print('ERROR: REGION_RULES not found', file=sys.stderr)
    sys.exit(1)

region_lines = []
for outer_k, outer_v in zip(region_dict.keys, region_dict.values):
    rk = _region_key(outer_k)
    if rk is None:
        continue
    if isinstance(outer_v, ast.Dict):
        inner_lines = []
        for ik, iv in zip(outer_v.keys, outer_v.values):
            target_rk = _region_key(ik)
            if target_rk is None:
                continue
            val = translate(iv)
            inner_lines.append(f'    {target_rk}: {val}')
        region_lines.append(f'  {rk}: {{\n' + ',\n'.join(inner_lines) + '\n  }')
    else:
        region_lines.append(f'  {rk}: {{}}')

REGION_JS = 'export const REGION_RULES = {\n' + ',\n'.join(region_lines) + '\n}\n'

# Also add synthetic FUSIONS entry (not in Python REGION_RULES but needed by tracker)
if 'FUSIONS' not in REGION_JS:
    last_brace = REGION_JS.rfind('\n}')
    if last_brace != -1:
        REGION_JS = REGION_JS[:last_brace] + ',\n  FUSIONS: {}\n}\n'


# ─── Build LOCATION_RULES JS  ─────────────────────────────────────────────────

loc_dict = _extract_dict(rules_tree, 'LOCATION_RULES')
if loc_dict is None:
    print('ERROR: LOCATION_RULES not found', file=sys.stderr)
    sys.exit(1)

loc_lines = []
for k, v in zip(loc_dict.keys, loc_dict.values):
    key_str = _location_key(k)
    if key_str is None:
        continue
    val = translate(v)
    if val == 'always':
        continue  # omit trivial always entries to save space
    loc_lines.append(f'  {key_str}: {val}')

LOC_JS = 'export const LOCATION_RULES = {\n' + ',\n'.join(loc_lines) + '\n}\n'


# ─── Write output  ────────────────────────────────────────────────────────────

HEADER = """\
// AUTO-GENERATED by scripts/gen_rules.py — DO NOT EDIT
// Source: SubModule/TMC-APWorld/tmc/rules.py

import {
  always, never, has, hasAny, hasAll, and, or,
  canPay, canSplit, hasMaxHealth, canActivatePedestal,
  hasSword, hasShield, hasMirrorShield,
  hasBow, hasLightArrows, hasBoomerang, hasMagicBoomerang,
  hasBombWeapon, hasBombWeaponBoss, hasGustWeapon, hasLanternWeapon,
  hasWeapon, hasWeaponBoss, hasWeaponScissor, hasWeaponWizzrobe,
  canSpin, canBeam, canHitDistance, canPassTrees,
  blowDust, mushroom, arrowBreak, likelike, darkRoom, capeExtend,
  lakeMinish, cabinSwim, fowPot, powJump, downthrust, sharkKill,
  accessTownLeft, hasBottle, accessTownFountain,
  accessLonLonRight, accessMinishWoodsTopLeft, completeBookQuest,
  smithCrest, crenelCrest, fallsCrest, cloudsCrest, swampCrest, minishCrest,
  cloudsAllCanFuse, cloudsHasFusion,
  swampsAllCanFuse, swampsHasFusion,
  fallsCanFuse, fallsHasFusion,
  dwsKey, cofKey, fowKey, todKey, rcKey, powKey, dhcKey,
} from './rules.js'

"""

content = HEADER + REGION_JS + '\n' + LOC_JS
OUT.write_text(content, encoding='utf-8')

print(f'Generated {OUT.relative_to(ROOT)}')
if _warns:
    print(f'  {len(_warns)} warning(s)')
