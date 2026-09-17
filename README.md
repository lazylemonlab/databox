# databox — public, non-sensitive data for all apps

Free "database" for static data (geo, constants). Edited in GitHub web UI,
consumed via jsDelivr CDN (CORS-enabled, edge-cached). No app release needed for updates.

## Catalog

| Path | What |
|---|---|
| [`geo/`](geo/) | Location tree, sharded by level: skeleton `countries/IN.json` (~2.7 KB) + lazy `countries/IN/cities/*.json` per city |

## Consumption (all apps)

```
https://cdn.jsdelivr.net/gh/lazylemonlab/databox@main/geo/...
```

- Apps fetch files from the CDN on every refresh (no app-side disk cache;
  jsDelivr edge-caches the files, so edits go live on the next refresh).
- Fetch failure → degrade gracefully (keep last list / free-text fallback);
  app must never break offline.
- Breaking shape change → bump `schema` field; old apps ignore unknown keys (`children`).

## Adding data

1. Geo: edit `geo/countries/<CC>.json` (keep A–Z, bump `updatedAt`), update `geo/index.json`.
2. New dataset: create a top-level folder like `geo/` (generic, not per-app), add a row above.
3. Never store secrets, PII, or user data here — public repo.
