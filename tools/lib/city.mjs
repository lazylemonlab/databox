// City registry + shared paths. ONE place that knows the directory layout,
// so fetch/transform/inspect/promote scripts stay city-agnostic.
// Add a city by appending one row to tools/cities.json (see README there).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
export const TOOLS_DIR = join(LIB_DIR, '..');
export const ROOT = join(TOOLS_DIR, '..'); // databox root
export const INCOMING_DIR = join(ROOT, '_incoming');

const REGISTRY_FILE = join(TOOLS_DIR, 'cities.json');

export function loadRegistry() {
  return JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
}

/** Resolve the city slug given on the CLI against tools/cities.json. */
export function resolveCity(argv = process.argv) {
  const slug = argv.slice(2).find((a) => !a.startsWith('-'));
  const registry = loadRegistry();
  if (!slug) fail(`Missing city slug.\n\nKnown cities:\n${listSlugs(registry)}`);
  const entry = registry.find((c) => c.slug === slug.toLowerCase());
  if (!entry) fail(`Unknown city "${slug}".\n\nKnown cities:\n${listSlugs(registry)}`);
  return entry;
}

function listSlugs(registry) {
  return registry
    .map((c) => `  ${c.slug.padEnd(12)} ${c.city}, ${c.state} (${c.country})  bbox=${c.bbox}`)
    .join('\n');
}

export function fail(msg) {
  console.error(`\n ${msg}\n`);
  process.exit(1);
}

/** Standard file paths for a city, used by every tool. */
export function cityPaths(city) {
  const country = `${city.country}.json`; // geo/countries/<ISO2>.json skeleton
  const base = join(ROOT, 'geo', 'countries', city.country);
  return {
    raw: join(INCOMING_DIR, `${city.slug}.areas.json`),
    squares: join(INCOMING_DIR, `${city.slug}.squares.json`),
    report: join(INCOMING_DIR, `${city.slug}.report.json`),
    transformed: join(INCOMING_DIR, `${city.slug}.transformed.json`),
    skeleton: join(ROOT, 'geo', 'countries', country),
    manifest: join(base, 'index.json'),
    geoFile: join(base, 'cities', `${city.slug}.json`),
    rootIndex: join(ROOT, 'geo', 'index.json'),
  };
}

/**
 * City-specific decisions live in tools/overrides/<slug>.mjs (default export).
 * Missing file = pure defaults, so a brand-new city needs zero decisions.
 */
export async function loadOverrides(slug) {
  const file = join(TOOLS_DIR, 'overrides', `${slug}.mjs`);
  if (!existsSync(file)) return { canonical: {}, keepVillages: [], drop: [], manual: [] };
  const mod = await import(new URL(`../overrides/${slug}.mjs`, import.meta.url).href);
  return { canonical: {}, keepVillages: [], drop: [], manual: [], ...mod.default };
}

export const today = () => new Date().toISOString().slice(0, 10);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));