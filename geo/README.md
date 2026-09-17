# geo — generic location tree (shared by all apps)

One hierarchy, infinite depth, sharded so each UI step fetches only its level.
`name` + optional `children`. No slugs, no `microOf`, no per-app copies.

```
geo/
  README.md                # this file — shape + rules
  index.json               # countries: [{ code, file, updatedAt }]
  countries/
    IN.json                # SKELETON: states -> city names only (~2.7 KB)
    IN/
      index.json           # manifest: [{ city, state, file, areaCount, updatedAt }]
      cities/
        pune.json          # one city's subtree: areas + children (fetched lazily)
        bengaluru.json
```

## Fetch rule: never download a level below the one you're showing

| UI step | Fetch | Size |
|---|---|---|
| Country list | `geo/index.json` | ~100 B, cache 30d |
| City/state dropdown | `countries/IN.json` (names only) | ~2.7 KB, cache 30d |
| Area suggestions (after city picked) | `countries/IN/cities/<city>.json` | ~0.5–1 KB each today, cache 7d |

Roomingo posting session: ~100 B + 2.7 KB + one city file ≈ **4 KB** — not 100 KB.
Cities with no areas yet have no file (manifest lookup misses → free-text mode).

## Node shape (recursive, same at every level)

```jsonc
{ "name": "Hinjewadi", "children": [{ "name": "Hinjewadi Phase 1" }] }
// leaf: { "name": "Baner" }   — children omitted or []
```

- `IN.json`: `states[] -> cities[{ name }]`. State/city are just *levels* — a
  state-first app reads level 1, Roomingo reads city then lazy-loads areas.
- `IN/cities/<city>.json`: `{ schema, country, city, state, updatedAt, areas[] }`
  — same node shape, full subtree. Empty `areas` in skeleton = "fetch the file".
- Display names only. Rename = fix `name` in place; git history is the audit
  trail. Stored listing rows keep the plain string.
- Additive only: add nodes/files, never restructure levels (would break pinned
  CDN consumers). Depth unbounded — chowk under phase under area just nests.

## `schema` field (not a version folder)

`{ "schema": 1 }` = "this file follows the node-shape contract". Git commits are
the versions; jsDelivr `@<commit>` pins exact ones. Old apps ignore unknown keys
and keep working.

## Editing (GitHub web UI, no app release)

1. Area change: edit `IN/cities/<city>.json`, bump its `updatedAt` + the matching
   manifest row (`areaCount` must equal `areas.length`).
2. New city: add `{ "name" }` to `IN.json` skeleton (+ city file if areas known).
3. Bump `IN.json` `updatedAt` + `index.json` row for the country.
4. Live in minutes via `https://cdn.jsdelivr.net/gh/lazylemonlab/databox@main/geo/...`
5. Apps bundle skeleton + top city files as fallback; fetch fail → bundled copy.
   Pages must never break offline.

## Sources

- Cities/states: `dr5hn/countries-states-cities-database` snapshot (roomingo-web
  `scripts/sync-locations.mjs` regenerates the city list; areas preserved).
- Areas/micro: curated seed (Pune/Hinjewadi deep sample) -> over time
  `SELECT DISTINCT area` from own listings (self-improving data).
