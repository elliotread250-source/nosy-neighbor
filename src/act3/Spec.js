// The tagged data contract (spec section 5.2). Every number that describes
// the house must carry a provenance tag. Allowed forms:
//   { "value": 3.4, "tag": "assumed", "rule": "ceiling_default" }
//   { "x": 1.5, "y": 7.45, "z": 1.5, "tag": "design" }      (a tagged point)
//   "polygon": [[0,0],[6,0]...] next to "polygonTag": "assumed"
// plus a short list of structural integers (indices, versions) that are not
// dimensions. Anything else is a build error naming the exact JSON path.
import { TAGS } from './assumptions.js';

// structural integers and counts: not dimensions, so they need no tag
const STRUCTURAL = new Set(['schemaVersion', 'revision', 'from', 'to', 'index', 'count', 'laps', 'order', 'books', 'physicsShards', 'boards', 'bolts', 'sides', 'vents', 'mannequinCount']);

export class SpecError extends Error {
  constructor(errors) {
    super(`Untagged or invalid dimensions in the house spec:\n${errors.map((e) => `  ${e.path}: ${e.message}`).join('\n')}`);
    this.errors = errors;
  }
}

// Collect every problem in the spec: untagged numbers, unknown tags, values without tags.
export function validateSpec(spec, root = 'house') {
  const errors = [];
  const walk = (node, path, parent, key) => {
    if (typeof node === 'number') {
      if (STRUCTURAL.has(key)) return;
      if (parent && !Array.isArray(parent) && typeof parent.tag === 'string') return;
      errors.push({ path, message: `plain number ${node} has no tag (wrap it as { "value": ${node}, "tag": "assumed", "rule": "..." })` });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`, node, key));
      return;
    }
    if (node && typeof node === 'object') {
      if ('tag' in node && !TAGS.includes(node.tag)) errors.push({ path: `${path}.tag`, message: `unknown tag "${node.tag}" (allowed: ${TAGS.join(', ')})` });
      if ('value' in node && !('tag' in node)) errors.push({ path, message: 'has a value but no tag' });
      for (const [k, v] of Object.entries(node)) {
        if (k.endsWith('Tag')) {
          if (!TAGS.includes(v)) errors.push({ path: `${path}.${k}`, message: `unknown tag "${v}"` });
          continue;
        }
        // arrays of raw numbers are fine when the sibling "<key>Tag" tags them as a whole
        if (Array.isArray(v) && typeof node[`${k}Tag`] === 'string') {
          const bad = JSON.stringify(v).match(/[^\d\s,.[\]eE+-]/);
          if (bad) errors.push({ path: `${path}.${k}`, message: 'tagged number array may only contain numbers' });
          continue;
        }
        walk(v, `${path}.${k}`, node, k);
      }
    }
  };
  walk(spec, root, null, null);
  return errors;
}

export function assertValid(spec, root) {
  const errors = validateSpec(spec, root);
  if (errors.length) throw new SpecError(errors);
  return spec;
}

// Read a tagged value (or a plain structural number).
export function val(x, fallback) {
  if (x === undefined || x === null) return fallback;
  if (typeof x === 'number') return x;
  if (typeof x === 'object' && 'value' in x) return x.value;
  return fallback;
}

export function tagOf(x, fallback = 'assumed') {
  return (x && typeof x === 'object' && x.tag) || fallback;
}

// Build a tagged value (used by the bootstrap and by tests).
export function T(value, tag = 'assumed', extra = {}) {
  return { value: Math.round(value * 1000) / 1000, tag, ...extra };
}

// Which audit bucket a tag falls in. Standard sizes and design choices are
// not facts about the game, so they count with the assumed share.
export function bucketOf(tag) {
  if (tag === 'measured' || tag === 'measured-rough' || tag === 'conflict') return 'measured';
  if (tag === 'documented' || tag === 'documented-weak' || tag === 'fan-plan') return 'documented';
  return 'assumed';
}

// Walk a spec and visit every tagged value with its JSON path.
export function forEachTagged(spec, fn, root = 'house') {
  const walk = (node, path) => {
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`)); return; }
    if (!node || typeof node !== 'object') return;
    if (typeof node.tag === 'string' && ('value' in node || 'x' in node)) fn(node, path);
    for (const [k, v] of Object.entries(node)) if (typeof v === 'object') walk(v, `${path}.${k}`);
  };
  walk(spec, root);
}

// Look up a tagged value by a dotted target path such as
// "F0.hall_ground.wall0.opening0.height" (measurement targets, section 14).
export function resolveTarget(spec, target) {
  const parts = target.split('.');
  if (parts[0] === 'playerHeight') return { node: spec, key: 'playerHeight' };
  const floor = spec.floors.find((f) => f.id === parts[0]);
  if (!floor) return null;
  if (parts.length === 2) return floor[parts[1]] ? { node: floor, key: parts[1] } : null;
  const room = floor.rooms.find((r) => r.id === parts[1]);
  if (!room) return null;
  let node = room;
  for (let i = 2; i < parts.length - 1; i++) {
    const p = parts[i];
    const m = /^(wall|opening)(\d+)$/.exec(p);
    if (m && m[1] === 'wall') node = (room.walls || []).find((w) => w.from === Number(m[2]));
    else if (m && m[1] === 'opening') node = (node.openings || [])[Number(m[2])];
    else node = node?.[p];
    if (!node) return null;
  }
  const key = parts[parts.length - 1];
  return key in node ? { node, key } : null;
}
