// GENERIC transform — one script for every city.
//
//   node tools/transform-city.mjs pune
//
// Input : _incoming/pune.areas.json (raw OSM, from fetch-city.mjs)
//         tools/overrides/pune.json.mjs (your decisions — optional, survives re-fetch)
// Output: _incoming/pune.transformed.json  (REVIEW FILE — geo/ untouched)
//
// Deterministic + idempotent: re-running with a fresh OSM pull keeps every
// prior decision (overrides are keyed by FOLDED key), so only genuinely new
// names show up as new. Area is the LAST level — output is flat, no children.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { DEFAULT_RULES, MIN_NAME_LEN } from './lib/geo-rules.mjs';
import { foldKey, titleCase } from './lib/names.mjs';
import { cityPaths, loadOverrides, resolveCity, today } from './lib/city.mjs';

const city = resolveCity();
const P = cityPaths(city);
const OV = await loadOverrides(city.slug);

if (!existsSync(P.raw)) {
  console.error(`\n Missing ${P.raw}\n Run first: node tools/fetch-city.mjs ${city.slug}\n`);
  process.exit(1);
}

const rows = JSON.parse(readFileSync(P.raw, 'utf8'));
const squares = existsSync(P.squares) ? JSON.parse(readFileSync(P.squares, 'utf8')) : [];

const dropRes = DEFAULT_RULES.dropPatterns.map((p) => new RegExp(p, 'i'));
const keepVillages = new Set((OV.keepVillages ?? []).map(foldKey));

// 1. Filter — drop micro names (societies/shops/…), hamlets, non-kept villages.
const kept = [];
const dropped = { short: 0, micro: 0, hamlet: 0, village: 0 };
for (const r of rows) {
  const name = (r.name ?? '').trim();
  if (name.length < MIN_NAME_LEN || /^\d+$/.test(name)) { dropped.short++; continue; }
  if (dropRes.some((re) => re.test(name))) { dropped.micro++; continue; }
  const kinds = r.kinds ?? [];
  const isKeptKind = kinds.some((k) => DEFAULT_RULES.keepKinds.includes(k));
  const isVillage = kinds.some((k) => DEFAULT_RULES.villageKinds.includes(k));
  if (kinds.includes('hamlet') && !isKeptKind) { dropped.hamlet++; continue; }
  if (isVillage && !isKeptKind && !keepVillages.has(foldKey(name))) { dropped.village++; continue; }
  kept.push(r);
}

// 2. Merge on folded key (w>v, ee>i…) — canonical = your override, else most hits.
const groups = new Map();
for (const r of kept) {
  const k = foldKey(r.name);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(r);
}
const mergedKeyed = [];
for (const [k, g] of groups) {
  g.sort((a, b) => b.hits - a.hits);
  const hits = g.reduce((s, x) => s + x.hits, 0);
  const display = titleCase(OV.canonical[k] ?? g[0].name);
  mergedKeyed.push({ name: display, hits, variants: g.map((x) => x.name) });
}

// 3. Display dedupe — two folded keys landing on the same display name are one area.
const byDisplay = new Map();
for (const m of mergedKeyed) {
  const d = m.name.toLowerCase();
  const prev = byDisplay.get(d);
  if (!prev) byDisplay.set(d, m);
  else {
    prev.hits += m.hits;
    prev.variants.push(...m.variants);
  }
}

// 4. Explicit drops, then manual entries (names with no OSM source, e.g. chowks).
const dropSet = new Set((OV.drop ?? []).map(foldKey));
const areas = [...byDisplay.values()].filter((m) => !dropSet.has(foldKey(m.name)));
for (const m of OV.manual ?? []) {
  const name = titleCase(m.name ?? m);
  if (!areas.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
    areas.push({ name, hits: 0, variants: ['(manual)'] });
  }
}

// 5. Sort A-Z, emit clean flat output.
areas.sort((a, b) => a.name.localeCompare(b.name));
const mergedVariants = areas
  .filter((a) => a.variants.length > 1)
  .map((a) => `${a.name} <= ${a.variants.join(' / ')}`);

const out = {
  schema: 1,
  country: { code: city.country, name: city.countryName },
  city: city.city,
  state: city.state,
  updatedAt: today(),
  source: `OSM Overpass one-shot (bbox ${city.bbox}) + tools/overrides/${city.slug}.json.mjs`,
  areaCount: areas.length,
  areas: areas.map(({ name }) => ({ name })),
  // Squares (chowks) are a separate OSM query — reported so you can promote
  // any that matter into overrides.manual (they are NOT auto-added).
  ...(squares.length ? { squareCandidates: squares.map((s) => s.name) } : {}),
};
writeFileSync(P.transformed, JSON.stringify(out, null, 2));

console.log(
  `\n${city.city}: kept=${kept.length} dropped=${JSON.stringify(dropped)} ` +
    `merged=${mergedVariants.length} areas=${areas.length}`,
);
if (mergedVariants.length) {
  console.log('--- auto-merged variants ---');
  console.log(mergedVariants.join('\n'));
}
if (out.squareCandidates?.length) {
  console.log(`\n--- ${out.squareCandidates.length} square candidates (not included) ---`);
  console.log(out.squareCandidates.join(' | '));
}
console.log(`\nSTOP — review ${P.transformed}`);
console.log(`Promote when happy: node tools/promote-city.mjs ${city.slug}`);
