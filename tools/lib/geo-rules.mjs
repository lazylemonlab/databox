// Shared defaults for EVERY city (fetch + transform). A city override file
// (tools/overrides/<slug>.mjs) only adds exceptions on top, so a brand-new
// city works with zero decisions on day one. Rerunning fetch+transform never
// invalidates prior canonical picks: overrides persist, only unseen names
// get defaults.
export const DEFAULT_RULES = {
  // OSM `place` kinds kept in the output. hamlet is always dropped;
  // village only survives via overrides keepVillages (absorbed fringe).
  keepKinds: ['suburb', 'neighbourhood', 'quarter', 'residential'],
  villageKinds: ['village'],
  // Names matching any of these (case-insensitive) are too micro to be a
  // searchable area — societies, housing blocks, shops, schools, ATMs.
  dropPatterns: [
    'society$',
    'cooperative',
    'housing',
    'colony$',
    '\\bpark\\b',
    'school',
    'college',
    'hospital',
    'hotel',
    'petrol',
    'bank\\b',
    '\\batm\\b',
    'shop\\b',
    'store\\b',
    'mall\\b',
  ],
  // Transliteration folding for the MERGE key only — display keeps the
  // canonical spelling. Pan-Indian patterns, deliberately no per-city tuning.
  // NOTE: no 'ph'->'f' rule — it mangles the English word "Phase" into "Fase".
  foldRules: [
    ['w', 'v'], // gaav/gaon, Hinjawadi/Hinjewadi, Kusgaav/Kusgaon
    ['ee', 'i'], // Panchavati/Panchawati (applied after w>v)
    ['oo', 'u'],
    ['ou', 'u'],
    ['sh', 's'],
  ],
};

// Everything the fetch step needs. Generic — the city only supplies its bbox.
export const FETCH_RULES = {
  // `place` values worth downloading. Chowks/squares are a separate query
  // because most are place=square, not place=suburb.
  areaPlaceTags: '^(suburb|neighbourhood|quarter|residential|hamlet|village)$',
  extraQueries: { squares: 'square' },
  mirrors: [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.nchc.org.tw/api/interpreter',
  ],
  pauseBetweenQueriesMs: 5000,
  timeoutS: 90,
};

// Minimum name length after trim. Kills single letters / pure numbers.
export const MIN_NAME_LEN = 2;
