// The end of Act 1: past the basement door, a staircase that goes down far
// too long under sour cyan-green bulbs, then a small, ordinary room: a
// child's drawing taped to the wall, a teddy bear on a chair, a door at the
// far end. Built off-map and only shown during the ending.
import { Group, Mesh, Vector3, CanvasTexture, SRGBColorSpace } from 'three';
import { makeMat } from '../art/Materials.js';
import { roundedBox } from '../art/Geo.js';
import { Palette, css } from '../art/Palette.js';
import * as Tex from '../art/CanvasTextures.js';
import * as F from './props/Furniture.js';
import * as D from './props/Decor.js';
import { CLUTTER } from './props/Clutter.js';

export const END = {
  origin: new Vector3(300, -40, 0),
  steps: 44,
  rise: 0.21,
  run: 0.3,
  width: 1.3,
};

function box(parent, w, h, d, mat, x, y, z, rx = 0) {
  const m = new Mesh(roundedBox(w, h, d, Math.min(0.03, w / 4, h / 4, d / 4), 1), mat);
  m.position.set(x, y, z);
  m.rotation.x = rx;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function drawingTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 384;
  const x = c.getContext('2d');
  x.fillStyle = '#fbf6e9'; x.fillRect(0, 0, 512, 384);
  x.lineCap = 'round'; x.lineJoin = 'round';
  const crayon = (col, w) => { x.strokeStyle = col; x.lineWidth = w; };
  // sun
  crayon('#f2c94c', 8); x.beginPath(); x.arc(440, 70, 34, 0, Math.PI * 2); x.stroke();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.moveTo(440 + Math.cos(a) * 46, 70 + Math.sin(a) * 46); x.lineTo(440 + Math.cos(a) * 66, 70 + Math.sin(a) * 66); x.stroke(); }
  // house
  crayon('#e07a5f', 9); x.strokeRect(60, 170, 170, 150);
  x.beginPath(); x.moveTo(45, 175); x.lineTo(145, 90); x.lineTo(245, 175); x.stroke();
  crayon('#457b9d', 7); x.strokeRect(130, 240, 40, 80);
  // three stick figures holding hands: a big one, a smaller one, a child
  const fig = (cx, top, h, col) => {
    crayon(col, 7);
    x.beginPath(); x.arc(cx, top + h * 0.12, h * 0.12, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(cx, top + h * 0.24); x.lineTo(cx, top + h * 0.65);
    x.moveTo(cx, top + h * 0.65); x.lineTo(cx - h * 0.15, top + h); x.moveTo(cx, top + h * 0.65); x.lineTo(cx + h * 0.15, top + h);
    x.moveTo(cx - h * 0.25, top + h * 0.4); x.lineTo(cx + h * 0.25, top + h * 0.4); x.stroke();
  };
  fig(300, 170, 150, '#2a1e3a');
  fig(370, 195, 125, '#9b51e0');
  fig(430, 235, 85, '#27ae60');
  crayon('#2a1e3a', 5);
  x.font = 'bold 40px "Comic Sans MS", "Nunito", sans-serif';
  x.fillStyle = '#e63946';
  x.fillText('MY FAMLY', 40, 370);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function buildEndingSet(scene, lights, zones) {
  const root = new Group();
  root.name = 'endingSet';
  root.visible = false;
  root.position.copy(END.origin);
  scene.add(root);
  const { steps, rise, run, width } = END;
  const wallMat = makeMat('BASEMENT_WALL');
  const stepMat = makeMat('NH_PLANKS_OLD');
  const ceilMat = makeMat('BASEMENT_WALL');
  for (let i = 0; i < steps; i++) {
    const top = -i * rise;
    box(root, width, rise + 0.6, run + 0.02, stepMat, 0, top - (rise + 0.6) / 2, -i * run - run / 2);
  }
  const len = Math.hypot(steps * run, steps * rise);
  const slope = Math.atan2(steps * rise, steps * run);
  const midZ = -steps * run / 2, midY = -steps * rise / 2;
  // side walls in vertical segments that step down with the stairs (no slanted ends poking into the room)
  const seg = 4;
  for (let i = 0; i < steps; i += seg) {
    const zc = -(i + seg / 2) * run, yc = -(i + seg / 2) * rise;
    for (const s of [-1, 1]) {
      box(root, 0.12, 4.6, seg * run + 0.02, wallMat, s * (width / 2 + 0.06), yc + 1.1, zc);
      box(root, 0.05, 0.08, seg * run + 0.02, makeMat('NH_PLANKS_OLD'), s * (width / 2 - 0.01), yc + 0.95, zc);
    }
  }
  box(root, width + 0.4, 0.12, len, ceilMat, 0, midY + 2.9, midZ, -slope);
  box(root, width + 0.4, 3.0, 0.12, ceilMat, 0, 1.4, 0.3); // wall behind the top
  // bulbs, getting sparser the deeper you go
  for (const i of [2, 9, 17, 26, 36]) {
    const b = D.ceilingBulb(`end-bulb-${i}`, 'BASEMENT_LIGHT', 'BASEMENT_LIGHT', Palette.BASEMENT_LIGHT);
    b.position.set(0, -i * rise + 2.45, -i * run);
    root.add(b);
  }
  // the small room at the bottom
  const by = -steps * rise, bz = -steps * run;
  const roomD = 4.2, roomW = 3.6, roomH = 2.7;
  const paper = makeMat('WHITE', { map: Tex.wallpaper('clouds', 'WALLPAPER_BLUE', 'WHITE') });
  box(root, roomW, 0.1, roomD, makeMat('WHITE', { map: Tex.carpet('CARPET_RED') }), 0, by - 0.05, bz - roomD / 2);
  box(root, roomW, 0.1, roomD, ceilMat, 0, by + roomH, bz - roomD / 2);
  for (const s of [-1, 1]) box(root, 0.12, roomH, roomD, paper, s * roomW / 2, by + roomH / 2, bz - roomD / 2);
  box(root, roomW, roomH, 0.12, paper, 0, by + roomH / 2, bz - roomD);
  // front wall with the stair opening
  for (const s of [-1, 1]) box(root, (roomW - width) / 2, roomH, 0.12, paper, s * (width / 2 + (roomW - width) / 4), by + roomH / 2, bz);
  // child's drawing, taped
  const drawing = new Mesh(roundedBox(0.8, 0.6, 0.01, 0.005, 1), makeMat('WHITE', { map: drawingTexture() }));
  drawing.position.set(-roomW / 2 + 0.08, by + 1.45, bz - 1.6);
  drawing.rotation.y = Math.PI / 2;
  drawing.rotation.z = 0.04;
  root.add(drawing);
  for (const [dx, dy] of [[-0.38, 0.28], [0.38, 0.28]]) {
    const tape = new Mesh(roundedBox(0.12, 0.04, 0.012, 0.004, 1), makeMat('CARDBOARD_TAPE'));
    tape.position.set(-roomW / 2 + 0.09, by + 1.45 + dy, bz - 1.6 + dx);
    tape.rotation.set(0, Math.PI / 2, dx > 0 ? 0.5 : -0.5);
    root.add(tape);
  }
  // chair with a teddy bear
  const chair = F.chair('end-chair', 'WOOD_LIGHT', 'CARPET_RED');
  chair.position.set(roomW / 2 - 0.7, by, bz - 1.9);
  chair.rotation.y = -Math.PI / 2 + 0.3;
  root.add(chair);
  const teddy = CLUTTER.stuffed('end-teddy', 1.4).obj;
  teddy.position.set(roomW / 2 - 0.72, by + 0.5, bz - 1.9);
  teddy.rotation.y = -Math.PI / 2 + 0.2;
  root.add(teddy);
  // the door at the far end, a line of light under it
  const door = box(root, 0.95, 2.1, 0.08, makeMat('GRASS_DARK'), 0, by + 1.05, bz - roomD + 0.1);
  const knob = new Mesh(roundedBox(0.08, 0.08, 0.08, 0.03, 2), makeMat('BRASS', { spec: 0.6 }));
  knob.position.set(0.35, 0, 0.06);
  door.add(knob);
  const gap = new Mesh(roundedBox(0.9, 0.012, 0.3, 0.004, 1), makeMat('BASEMENT_LIGHT', { emissive: 'BASEMENT_LIGHT', emissiveIntensity: 2.2 }));
  gap.position.set(0, by + 0.01, bz - roomD + 0.25);
  root.add(gap);
  const lamp = D.ceilingBulb('end-room-bulb', 'LAMPSHADE', 'LAMPSHADE_GLOW');
  lamp.position.set(0, by + roomH - 0.05, bz - roomD / 2);
  root.add(lamp);
  root.traverse((m) => { if (m.isMesh) { m.castShadow = false; } });
  lights.addFrom(root);
  const o = END.origin;
  zones.add('ending', new Vector3(o.x - 3, o.y - steps * rise - 2, o.z - steps * run - roomD - 1), new Vector3(o.x + 3, o.y + 4, o.z + 2), { indoor: true });
  return {
    root,
    top: o.clone().add(new Vector3(0, 0, -0.4)),
    bottom: o.clone().add(new Vector3(0, by, bz - 0.4)),
    door: o.clone().add(new Vector3(0, by, bz - roomD + 0.9)),
    css,
  };
}
