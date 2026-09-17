// Pune-specific exceptions on top of tools/lib/geo-rules.mjs defaults.
// Same shape as every other city override file (tools/overrides/<slug>.mjs).
// Hand-edited, survives re-fetch. Keys are FOLDED (lowercase, w>v, ee>i…) so
// OSM spelling drift can never resurrect a decided duplicate.
// Canonical picks: Hinjewadi (not Hinjawadi), gaon (not gaav), Panchavati.
export default {
  // foldedKey -> canonical display name (applied when auto-merge sees the key).
  // Fold = lowercase, w>v, ee>i… so "Hinjewadi" -> "hinjevadi",
  // "Hinjawadi" -> "hinjavadi" (the e/a difference survives folding).
  canonical: {
    hinjevadi: 'Hinjewadi',
    hinjavadi: 'Hinjewadi',
    'hinjevadi phase 1': 'Hinjewadi Phase 1',
    'hinjavadi phase 1': 'Hinjewadi Phase 1',
    'hinjevadi phase 2': 'Hinjewadi Phase 2',
    'hinjavadi phase 2': 'Hinjewadi Phase 2',
    'hinjevadi phase 3': 'Hinjewadi Phase 3',
    'hinjavadi phase 3': 'Hinjewadi Phase 3',
    'vakad gaav': 'Wakad',
    vakad: 'Wakad',
    'baner gaon': 'Baner',
    baner: 'Baner',
    panchavati: 'Panchavati',
    jambhali: 'Jambhali',
    jambhli: 'Jambhali',
    kusgaav: 'Kusgaon',
    kusgaon: 'Kusgaon',
    'sus gaon': 'Sus',
    sus: 'Sus',
  },
  // Absorbed-fringe villages worth keeping (every other village/hamlet is dropped).
  keepVillages: [
    'Bavdhan',
    'Balewadi',
    'Dattawadi',
    'Kalewadi',
    'Khadakwasla',
    'Pirangut',
    'Wagholi',
    'Mundhwa',
    'Kharadi',
    'Hadapsar',
    'Katraj',
    'Warje',
    'Shivane',
    'Pashan',
    'Sus',
    'Baner',
    'Wakad',
    'Hinjewadi',
    'Ravet',
    'Thergaon',
  ],
  // Explicit drops: names in OSM that are NOT standalone areas.
  // (Empty today — Blue Ridge Town stays; it is a legitimate searchable name.)
  drop: [],
  // Manual entries with no OSM source (squares query failed) — flat areas like
  // any other. Area is the LAST level: no `nest`, no children, ever.
  manual: [{ name: 'Laxmi Chowk' }, { name: 'Shivaji Chowk' }],
};
