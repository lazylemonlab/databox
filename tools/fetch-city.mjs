// GENERIC fetch — one script for every city. The city only supplies its bbox
// (tools/cities.json); all rules live in lib/geo-rules.mjs.
//
//   node tools/fetch-city.mjs pune            fetch Overpass -> _incoming/pune.*.json
//   node tools/fetch-city.mjs pune --reuse    keep existing raw, only re-summarize
//   node tools/fetch-city.mjs pune --help     print mirrors + manual fallback URLs
//
// Writes ONLY to _incoming/ (scratch). geo/ is never touched here.
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { FETCH_RULES } from './lib/geo-rules.mjs';
import { normKey } from './lib/names.mjs';
import { cityPaths, fail, resolveCity, sleep, today } from './lib/city.mjs';

const city = resolveCity();
const P = cityPaths(city);
mkdirSync(P.raw.replace(/[\\/][^\\/]+$/, ''), { recursive: true });

const QUERIES = {
  areas: `[out:json][timeout:${FETCH_RULES.timeoutS}];(nwr["place"~"${FETCH_RULES.areaPlaceTags}"](${city.bbox}););out center tags;`,
  squares: `[out:json][timeout:${FETCH_RULES.timeoutS}];(nwr["place"="${FETCH_RULES.extraQueries.squares}"](${city.bbox}););out center tags;`,
};
const urlsFor = (q) => FETCH_RULES.mirrors.map((m) => `${m}?data=${encodeURIComponent(q)}`);

const reuse = process.argv.includes('--reuse');

if (process.argv.includes('--help')) {
  console.log(`\n${city.city} (${city.country}) — bbox ${city.bbox}\n`);
  console.log('Overpass queries (open in a browser, save the JSON if the script is blocked):');
  for (const [k, q] of Object.entries(QUERIES)) console.log(`\n  [${k}]\n  ${urlsFor(q).join('\n  ')}`);
  console.log(`\nThen: node tools/fetch-city.mjs ${city.slug}`);
  console.log(`\nOptional pincode CSV (India Post / data.gov.in), saved as:`);
  console.log(`  _incoming/${city.slug}.pincode.csv   (columns must include office + district)`);
  process.exit(0);
}

/** Fetch one Overpass query, trying every mirror. Returns elements[] or null. */
async function overpass(key) {
  for (const url of urlsFor(QUERIES[key])) {
    try {
      console.log(`GET [${key}] ${new URL(url).host} ...`);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'databox-geo-fetch (one-shot, low volume)' },
      });
      if (res.status === 429 || res.status === 504 || !res.ok) {
        console.log(`  -> HTTP ${res.status}, next mirror...`);
        continue;
      }
      const j = await res.json();
      console.log(`  -> OK, ${(j.elements ?? []).length} elements`);
      return j.elements ?? [];
    } catch (e) {
      console.log(`  -> failed (${e.message}), next mirror...`);
    }
  }
  return null;
}

const pickName = (el) => el.tags?.['name:en'] ?? el.tags?.name ?? null;

/** Collapse raw OSM elements into [{ name, hits, kinds }] sorted A-Z. */
function summarize(elements) {
  const seen = new Map();
  for (const el of elements ?? []) {
    const name = pickName(el);
    if (!name || name.length < 2) continue;
    const k = normKey(name);
    if (!seen.has(k)) seen.set(k, { name, hits: 0, kinds: new Set() });
    const e = seen.get(k);
    e.hits += 1;
    if (el.tags?.place) e.kinds.add(el.tags.place);
  }
  return [...seen.values()]
    .map((e) => ({ name: e.name, hits: e.hits, kinds: [...e.kinds].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// --reuse: keep whatever raw file already exists (useful when Overpass is
// rate-limiting and you only want to re-review an existing pull).
if (reuse) {
  if (!existsSync(P.raw)) fail(`--reuse given but ${P.raw} does not exist.`);
  const rows = JSON.parse(readFileSync(P.raw, 'utf8'));
  if (!existsSync(P.report)) {
    writeFileSync(P.report, JSON.stringify({ city: city.city, areas: rows.length, reuse: true }, null, 2));
  }
  console.log(`\nReused ${rows.length} rows from ${P.raw} — nothing fetched.`);
  process.exit(0);
}

const areaRows = summarize(await overpass('areas'));
if (!areaRows?.length) fail(`No areas returned for ${city.city}. Try --help and fetch from a mirror manually.`);

await sleep(FETCH_RULES.pauseBetweenQueriesMs);
const squareRows = summarize(await overpass('squares')); // may be empty/failed — optional

writeFileSync(P.raw, JSON.stringify(areaRows, null, 2));
if (squareRows?.length) writeFileSync(P.squares, JSON.stringify(squareRows, null, 2));

const report = {
  city: city.city,
  state: city.state,
  country: city.country,
  bbox: city.bbox,
  at: today(),
  areas: areaRows.length,
  squares: squareRows?.length ?? 0,
};
if (squareRows?.length) {
  const aKeys = new Set(areaRows.map((r) => normKey(r.name)));
  report.alsoInSquares = squareRows.filter((r) => aKeys.has(normKey(r.name))).map((r) => r.name);
}
writeFileSync(P.report, JSON.stringify(report, null, 2));

console.log(`\nWrote ${P.raw}`);
console.log(JSON.stringify(report, null, 2));
console.log(`\nSTOP — review, then: node tools/transform-city.mjs ${city.slug}`);
