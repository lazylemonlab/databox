// Shared name handling for every city. Two different keys, two jobs:
//   normKey()  — exact-duplicate detection during fetch (case/punctuation only)
//   foldKey()  — transliteration-aware MERGE key during transform (w>v, ee>i…)
// Keeping both here stops fetch/transform from drifting apart.
import { DEFAULT_RULES } from './geo-rules.mjs';

const stripPunct = (s) =>
  s.toLowerCase().replace(/[.'’`\-_/()]/g, ' ').replace(/\s+/g, ' ').trim();

/** Conservative key: case + punctuation + whitespace only. */
export const normKey = stripPunct;

/** Aggressive key: also applies the pan-Indian transliteration folds. */
export function foldKey(s) {
  let k = stripPunct(s);
  for (const [a, b] of DEFAULT_RULES.foldRules) k = k.split(a).join(b);
  return k;
}

/** Title-case a raw OSM name ("blue ridge town" -> "Blue Ridge Town"). */
export function titleCase(s) {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length <= 3 && w === w.toLowerCase() ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}