import { readFileSync, existsSync } from 'node:fs';

export const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

// Every house spec the tests run against: the one-room test house always,
// the full house once it exists.
export function houses() {
  const out = [['test-house', load('data/act3/test-house.json')]];
  if (existsSync('data/act3/house.json')) out.push(['house', load('data/act3/house.json')]);
  return out;
}
