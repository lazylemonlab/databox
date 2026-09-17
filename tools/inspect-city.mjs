// GENERIC reviewer — inspect the TRANSFORMED output before promoting.
//   node tools/inspect-city.mjs pune            summary + duplicate check
//   node tools/inspect-city.mjs pune --list     also print every area name
//   node tools/inspect-city.mjs pune --grep hnj  filter names by regex
import { readFileSync } from 'node:fs';
import { cityPaths, resolveCity } from './lib/city.mjs';

const city = resolveCity();
const P = cityPaths(city);
const t = JSON.parse(readFileSync(P.transformed, 'utf8'));
const names = t.areas.map((a) => a.name);

const dups = names.filter((n, i) => names.indexOf(n) !== i);
const caseDups = names.filter((n, i) => {
  const lower = names.map((x) => x.toLowerCase());
  return lower.indexOf(n.toLowerCase()) !== i;
});

console.log(`city      ${t.city}, ${t.state} (${t.country?.code})`);
console.log(`areas     ${names.length}  (file areaCount ${t.areaCount})`);
console.log(`duplicates ${dups.length ? JSON.stringify(dups) : 'none'}`);
console.log(`case-dups  ${caseDups.length ? JSON.stringify(caseDups) : 'none'}`);
console.log(`with children ${t.areas.some((a) => a.children) ? 'YES (unexpected)' : 'none (flat as intended)'}`);
console.log(`updated   ${t.updatedAt}`);
console.log(`source    ${t.source}`);

const grepIdx = process.argv.indexOf('--grep');
if (grepIdx > -1) {
  const re = new RegExp(process.argv[grepIdx + 1], 'i');
  console.log(`\nmatching /${process.argv[grepIdx + 1]}/i:\n  ${names.filter((n) => re.test(n)).join(' | ')}`);
}
if (process.argv.includes('--list')) {
  console.log('\n' + names.join(' | '));
}
if (t.squareCandidates?.length) {
  console.log(`\nsquare candidates (not included): ${t.squareCandidates.join(' | ')}`);
}
if (dups.length || caseDups.length) process.exitCode = 1;
