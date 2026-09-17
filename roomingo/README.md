# Roomingo locations (databox) — `roomingo/v1/`

India cities + per-city micro-areas. Public, versioned, edited in GitHub web UI.

## Layout

```
roomingo/v1/
  index.json          # [{ city, state, areaCount, file, updatedAt }] — app fetches this first (~5KB)
  schema.json         # $schemaVersion contract; apps validate + ignore unknown fields
  cities/
    pune.json         # deep sample: Hinjewadi phases, chowks (microOf links)
    bengaluru.json    # small sample (12 areas)
```

## Area entry shape

```jsonc
{ "name": "Hinjewadi Phase 2", "slug": "hinjewadi-phase-2", "microOf": "Hinjewadi" }
// microOf optional — groups chowks/phases under a parent for future grouped UI.
// slug stable: renames change `name`, never `slug`, so old listings keep matching.
```

`name`-only strings are also accepted (legacy `locations-IN.json`); writers should prefer objects.

## Update workflow (no app release)

1. Edit `cities/<city>.json` in GitHub web UI (keep alphabetical, bump `updatedAt`).
2. Update `areaCount`/`updatedAt` in `index.json`.
3. Live in minutes via `https://cdn.jsdelivr.net/gh/lazylemonlab/databox@main/roomingo/v1/cities/<city>.json`.
4. Apps cache 7 days; bundled fallback covers offline/first-launch.

## Sources

- Cities/states: `dr5hn/countries-states-cities-database` snapshot (see web repo `scripts/sync-locations.mjs`).
- Areas: curated seed → replaced over time by `SELECT DISTINCT area` from own listings (self-improving) + OSM spot checks at authoring time, never runtime.
