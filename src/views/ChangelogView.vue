<template>
  <div class="changelog-wrap">
    <div class="changelog-inner">
      <h1 class="changelog-title">Changelog</h1>

      <section v-for="entry in changelog" :key="entry.date" class="changelog-day">
        <h2 class="day-date">{{ entry.date }}</h2>
        <ul class="commit-list">
          <li v-for="commit in entry.commits" :key="commit.title" class="commit-item">
            <span :class="['commit-tag', commit.type]">{{ commit.type }}</span>
            <span class="commit-title">{{ commit.title }}</span>
            <ul v-if="commit.details?.length" class="commit-details">
              <li v-for="d in commit.details" :key="d">{{ d }}</li>
            </ul>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
const changelog = [
  {
    date: '27.04.2026',
    commits: [
      {
        type: 'feat',
        title: 'AP hint system rebuilt as item note badges on pins',
        details: [
          'Replaced old hint system (colored halos / snowflake badges) with item notes on map pins',
          'Added 5 colored AP logos (red / white / yellow / blue / green) as selectable items',
          'AP hints are auto-mapped by item flags: progression=yellow, trap=red, useful=blue, junk=white',
          'Item notes are cleared when a location is checked',
          'Reorganized PICKER_ITEMS grid to 6×8',
          'Added generic Kinstones (red / blue / green / gold) and keys to the picker',
          'Updated TMC-APWorld submodule',
        ],
      },
      {
        type: 'feat',
        title: 'Auto-generate data & logic from TMC-APWorld submodule at build time',
        details: [
          'Added SubModule/TMC-APWorld git submodule (branch dev)',
          'Added scripts/gen_rules.py: transpiles APWorld rules.py → rules_generated.js via AST',
          'Added scripts/migrate_coords.py: converts map coords to {id, location:[{map,x,y}]} format',
          'Split overworld coords into per-area JSON files (import.meta.glob in MapView)',
          'Refactored scripts/extract_tmc_data.py: generates location_meta.json, names.json, ap_tables.json',
          'package.json: prebuild/predev runs the generate pipeline (extract + gen_rules)',
          'Added build:ci script (vite build without prebuild, for GitHub Actions)',
          'Fixed CI workflow: checkout submodules, setup-python, run scripts explicitly',
          'accessibility.js: imports REGION_RULES/LOCATION_RULES from rules_generated.js',
          'Removed scripts/extract_map_coords.py and src_info/ (no longer needed)',
        ],
      },
    ],
  },
  {
    date: '26.04.2026',
    commits: [
      {
        type: 'fix',
        title: 'Show overworld area selector for all users',
      },
      {
        type: 'fix',
        title: 'Show Regions button only in dev mode',
      },
      {
        type: 'fix',
        title: 'Remove Regions button from navbar',
      },
      {
        type: 'fix',
        title: 'Hide overworld area selector buttons outside dev mode',
      },
      {
        type: 'fix',
        title: 'Change default auto tab settings (dungeons: overview, overworld: off)',
      },
      {
        type: 'feat',
        title: 'Dungeon floor maps, overworld area zones, auto tab switching, autotrack item fix',
        details: [
          'Added per-floor map coords JSON for all 7 dungeons (DWS, CoF, FoW, ToD, RC, PoW, DHC)',
          'Added overworld area zone coords (16 zones) and sub-map images from reference tracker',
          'Added room_area_to_zone.json for room_area → overworld zone mapping',
          'MapView: floor selector for dungeons, area selector for overworld, mouse coords (dev only)',
          'Settings: Auto tab Dungeons (Off/Overview/Floor) and Auto tab Overworld (Off/On)',
          'bizhawk.js / client.js: auto-switch active view and zone on room change',
          'ItemGrid: fixed autotrack items not displaying (key name mapping for BOMB_BAG, WALLET, BOTTLE)',
          'stateStore: added activeZone ref and setActiveZone action',
        ],
      },
      {
        type: 'fix',
        title: 'Read dungeon warps and wind crests from both sd.options and top-level sd',
      },
      {
        type: 'feat',
        title: 'Hide Sanctuary items by default (not yet in AP)',
      },
      {
        type: 'fix',
        title: 'ToD Big Octo requires canSplit(2); version-aware fuse event mapping for bizhawk ≤ 0.3.1',
      },
      {
        type: 'fix',
        title: 'Fusion item names, heart piece name, cabin swim is no longer a trick',
      },
      {
        type: 'fix',
        title: 'Library Yellow requires only 3 books; book names aligned with AP table; PROGRESSIVE_BOOK mapped; Carlov NPC fixed',
      },
      {
        type: 'feat',
        title: 'Added AP chat panel',
      },
      {
        type: 'ci',
        title: 'Added contents:write permission for release creation',
      },
      {
        type: 'chore',
        title: 'Added vite-plugin-singlefile dependency',
      },
      {
        type: 'ci',
        title: 'Build & release workflow + fixed image base paths',
      },
      {
        type: 'init',
        title: 'Initial commit — TMC Archipelago tracker web',
      },
    ],
  },
]
</script>

<style scoped>
.changelog-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
  background: var(--bg-dark);
}

.changelog-inner {
  max-width: 760px;
  margin: 0 auto;
}

.changelog-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-gold);
  margin: 0 0 24px;
  letter-spacing: 0.04em;
}

.changelog-day {
  margin-bottom: 28px;
}

.day-date {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border);
}

.commit-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.commit-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
}

.commit-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}
.commit-tag.feat  { background: #1a4a1a; color: #6de06d; }
.commit-tag.fix   { background: #4a2020; color: #f08080; }
.commit-tag.ci    { background: #1a2a4a; color: #80a8f0; }
.commit-tag.chore { background: #2a2a2a; color: #aaaaaa; }
.commit-tag.init  { background: #3a2a0a; color: var(--accent-gold); }

.commit-title {
  color: var(--text);
  line-height: 1.4;
}

.commit-details {
  width: 100%;
  margin: 4px 0 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.commit-details li {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}
</style>
