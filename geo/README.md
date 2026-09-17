# geo — generic location tree (shared by all apps)

One hierarchy, infinite depth. `name` + optional `children`. No slugs, no
`microOf`, no per-app copies. A node with `children: []` (or no `children`)
is a leaf; a node with `children` is a parent. Apps read whatever depth they
need and ignore the rest.

```
geo/
  README.md                # this file — shape + rules
  index.json               # which countries exist: [{ code, file, updatedAt }]
  countries/
    IN.json                # { schema, country, updatedAt, source, states[] }
    US.json                # later, same shape (swap state->province if needed)
```

## Node shape (recursive, same at every level)

```jsonc
{ "name": "Hinjewadi", "children": [{ "name": "Hinjewadi Phase 1" }] }
// leaf: { "name": "Baner" }   — children omitted or []
```

- `IN.json`: `states[] -> cities[] -> areas[] -> children[]...`. State/city/area
  are just *levels* — an app needing state-first reads level 1, Roomingo reads
  city->area, a future app reads country->state only. Same file serves all.
- Display names only. Rename = fix the `name` in place; git history is the
  audit trail. No slugs — stored listing rows keep the plain string.
- Additive only: add nodes, never restructure levels (would break pinned CDN
  consumers). Depth is unbounded — chowk under phase under area just nests.

## `schema` field (not a version folder)

`{ "schema": 1 }` inside the JSON = "this file follows the node-shape contract".
Git commits are the version history; jsDelivr `@<commit>` pins exact versions.
`v1/` folders would force every app to migrate paths on bump — the field lets
old apps ignore unknown keys (`children` they don't render) and keep working.

## Editing (GitHub web UI, no app release)

1. Edit `countries/<CC>.json` (keep A–Z, bump `updatedAt`).
2. Update `index.json` `updatedAt` for that country.
3. Live in minutes: `https://cdn.jsdelivr.net/gh/lazylemonlab/databox@main/geo/countries/IN.json`.
4. Apps bundle a fallback copy + cache fetched file 7 days; fetch failure keeps
   bundled/cached copy — pages must never break offline.

## Sources

- Cities/states: `dr5hn/countries-states-cities-database` snapshot (roomingo-web
  `scripts/sync-locations.mjs` regenerates the city list; areas preserved).
- Areas/micro: curated seed (Pune/Hinjewadi deep sample) -> over time
  `SELECT DISTINCT area` from own listings (self-improving data).
