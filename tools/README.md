# tools — generic geo pipeline (one script per step, every city)

Four commands. The city is always an **argument** (`tools/cities.json` is the
registry); no city-specific script files exist. Only `overrides/<slug>.mjs` is
per-city, and it is optional.

```bash
node tools/fetch-city.mjs pune            # Overpass -> _incoming/pune.areas.json (+ squares)
node tools/transform-city.mjs pune        # raw + overrides -> _incoming/pune.transformed.json  (REVIEW)
node tools/inspect-city.mjs pune --list   # reviewer: counts, duplicates, flat check
node tools/promote-city.mjs pune          # write geo/ + bump manifests   (--dry-run to preview)
```

Flow: **fetch → transform → inspect → promote**. `_incoming/` is scratch
(gitignored); `geo/` is only ever written by `promote-city.mjs`.

## Layout

```
tools/
  cities.json           registry: one row per city (slug, state, country, bbox)
  fetch-city.mjs        Overpass fetch (mirrors, --help for manual URLs, --reuse to skip network)
  transform-city.mjs    filter + fold + merge + manual -> flat areas (no children)
  inspect-city.mjs      validate transformed output before promoting
  promote-city.mjs      copy to geo/countries/<CC>/cities/<slug>.json + update manifests
  lib/
    city.mjs            registry lookup + every path (single source of truth)
    names.mjs           normKey (dup detection) / foldKey (merge) / titleCase
    geo-rules.mjs       shared defaults: keepKinds, dropPatterns, foldRules, FETCH_RULES
  overrides/<slug>.mjs  city-specific exceptions only (canonical / keepVillages / drop / manual)
```

## Adding a city

1. Append a row to `tools/cities.json` (`slug` = lowercase file name, `bbox` = `S,W,N,E`).
2. `node tools/fetch-city.mjs <slug>` → review raw → `node tools/transform-city.mjs <slug>`.
3. If names look wrong, add `tools/overrides/<slug>.mjs` (copy `pune.mjs`) — decisions
   there survive every future re-run. Then `inspect` → `promote`.

## Override contract (per city, all keys optional)

| Key            | Meaning                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| `canonical`    | `{ foldedKey: "Display Name" }` — forces the spelling you want             |
| `keepVillages` | names to keep instead of dropping (absorbed fringe); matched by folded key |
| `drop`         | names that are not standalone areas (e.g. a township inside a bigger area) |
| `manual`       | `[{ name }]` — areas with no OSM source (chowks etc.), appended flat       |

**Area is the last level.** Output is always flat `{ name }` — no `children`,
no `nest`. If you ever need micro-level nesting, add it deliberately as a schema
change (see `geo/README.md`), not via an override.

## Re-running later (safe by design)

`fetch` overwrites only `_incoming/<slug>.areas.json`. Overrides are untouched,
so re-running `transform` keeps every prior decision; only genuinely new names
appear as new. Nothing in `geo/` changes until you promote.
