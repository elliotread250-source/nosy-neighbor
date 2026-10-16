// Screenshot camera poses and the character viewer (debug/review tooling).
import { Vector3, MeshBasicMaterial, Color } from 'three';
import { Neighbor, EXPRESSIONS } from '../actors/Neighbor.js';
import { NeighborAnimator, CLIPS } from '../actors/NeighborAnimator.js';

// Fixed camera poses for automated screenshots: ?shot=<name>
export const SHOTS = {
  // Milestone 1/2 test yard (?test=1)
  yard: { pos: [0, 1.6, 9], target: [0, 1.4, -8] },
  furniture: { pos: [4.2, 1.6, -3.2], target: [4, 1.1, -8] },
  chunk: { pos: [-3.5, 1.8, -1.5], target: [-8, 3, -9] },
  character: { pos: [-1.2, 1.75, -0.6], target: [-2, 1.5, -3] },
  sky: { pos: [0, 1.6, 6], target: [-30, 14, 10] },
  crates: { pos: [3.2, 1.6, 1.5], target: [5.5, 0.8, -2.2] },
  fence: { pos: [-8.5, 1.5, 8], target: [-9, 1.2, 2] },
  // The street
  porch: { pos: [-1.2, 1.9, 12.9], target: [0, 4, -20] },
  street: { pos: [-30, 2.2, 3], target: [10, 2, 0] },
  playerFront: { pos: [-6, 1.8, 3], target: [0, 2.5, 18] },
  aerial: { pos: [0, 38, 48], target: [0, 0, 0] },
  bedroom: { pos: [2.2, 1.9, 19.5], target: [2.8, 1.6, 14] },
  living: { pos: [0.0, 1.7, 15.2], target: [-4.4, 1.0, 20] },
  flanking: { pos: [20, 1.8, 2], target: [30, 3, 12] },
  eastEnd: { pos: [40, 2, 0], target: [60, 1.5, 0] },
  // The neighbor's house
  nhPorch: { pos: [0.5, 2.0, 12.6], target: [0, 7, -20] },
  nhCorner: { pos: [22, 2.2, 4], target: [0, 6.5, -20] },
  nhBack: { pos: [8, 2.0, -33], target: [-1, 6, -20] },
  nhWest: { pos: [-15, 2.5, -8], target: [-4, 6, -22] },
  nhTree: { pos: [13.5, 2.0, -11.0], target: [10.5, 4.5, -16.5] },
  nhRoof: { pos: [16, 14, -6], target: [-1, 9, -22] },
  // Inside
  inHall: { pos: [0.25, 2.2, -14.4], target: [0.2, 1.8, -21.5] },
  inLiving: { pos: [-2.2, 2.2, -21.3], target: [-6.0, 1.2, -15.5] },
  inDining: { pos: [2.0, 2.3, -14.6], target: [6.5, 1.0, -19.5] },
  inKitchen: { pos: [2.3, 2.2, -20.5], target: [7, 1.0, -25.5] },
  inMudroom: { pos: [-0.6, 2.2, -22.5], target: [-4, 1, -25.6] },
  inBath0: { pos: [-4.9, 2.1, -22.3], target: [-7.4, 1, -25.5] },
  inHall1: { pos: [-1.0, 6.2, -14.5], target: [-1, 5.6, -26] },
  inBedroom: { pos: [-2.8, 6.2, -14.5], target: [-6.5, 5.0, -19.5] },
  inStudy: { pos: [1.2, 6.2, -14.4], target: [6.5, 5.0, -18.5] },
  inKid: { pos: [1.0, 6.3, -20.0], target: [7.5, 5.2, -23.0] },
  inCloset: { pos: [0.9, 6.2, -24.1], target: [7.5, 5.3, -25.8] },
  inLanding: { pos: [-1.6, 9.9, -25.2], target: [-6.5, 9.2, -18.5] },
  inPurple: { pos: [0.6, 9.9, -25.4], target: [0.4, 9.0, -18.5] },
  inTomato: { pos: [5.5, 10.4, -19.6], target: [8.5, 9.5, -22.5] },
  inAttic: { pos: [-2.4, 13.6, -20.4], target: [-4.5, 12.5, -22.8] },
  inTunnel: { pos: [-3.8, -0.9, -25.3], target: [-0.3, -1.6, -25.3] },
  inBasement: { pos: [0.75, 1.6, -21.5], target: [0.75, -1.6, -25.6] },
  // Character viewer (?viewer=1 puts Grimsby on a turntable on the player's lawn)
  grimFront: { pos: [2.5, 1.55, 13.4], target: [2.5, 1.15, 9.5], viewer: true },
  grim34: { pos: [5.4, 1.6, 12.6], target: [2.5, 1.1, 9.5], viewer: true },
  grimSide: { pos: [6.6, 1.3, 9.5], target: [2.5, 1.1, 9.5], viewer: true },
  grimBack: { pos: [2.5, 1.6, 5.6], target: [2.5, 1.1, 9.5], viewer: true },
  grimClose: { pos: [2.5, 1.86, 10.55], target: [2.5, 1.84, 9.5], viewer: true },
  grimMid: { pos: [2.5, 1.5, 11.6], target: [2.5, 1.2, 9.5], viewer: true },
  grimSilhouette: { pos: [2.5, 1.3, 39], target: [2.5, 1.1, 9.5], viewer: true },
  lineup: { pos: [2.5, 1.35, 6.7], target: [2.5, 0.95, 1.0], viewer: true },
  lineupSide: { pos: [10.5, 1.2, 1.0], target: [2.5, 0.95, 1.0], viewer: true },
};

export function poseFromTarget(pos, target) {
  const d = new Vector3(...target).sub(new Vector3(...pos));
  const yaw = Math.atan2(-d.x, -d.z);
  const pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
  return { yaw, pitch };
}


// Character viewer: ?viewer=1 or any shot flagged viewer. Returns the viewer Neighbor or null.
export function setupViewer(engine, updaters) {
  const qs = new URLSearchParams(location.search);
  let viewer = null;
  if (qs.has('viewer') || (qs.get('shot') && SHOTS[qs.get('shot')]?.viewer)) {
    viewer = new Neighbor(engine.scene);
    viewer.root.position.set(2.5, 0, 9.5);
    viewer.anim = new NeighborAnimator(viewer);
    const animName = qs.get('anim') || 'idle';
    viewer.anim.play(animName, 0);
    viewer.anim.speed = { walk: 1.4, sneak: 1.0, run: 5.6 }[animName] ?? 0;
    // lineup: one Grimsby per clip, side by side
    const lineup = [];
    if (qs.get('lineup')) {
      const list = qs.get('lineup').split(',');
      viewer.root.visible = false;
      list.forEach((name, i) => {
        const n = new Neighbor(engine.scene);
        n.root.position.set(2.5 + (i - (list.length - 1) / 2) * 1.25, 0, 1.0);
        n.root.rotation.y = (+(qs.get('rot') || 0)) * Math.PI / 180;
        n.anim = new NeighborAnimator(n);
        n.anim.allowGestures = false;
        n.anim.play(name, 0);
        n.anim.speed = { walk: 1.4, sneak: 1.0, run: 5.6 }[name] ?? 0;
        n.anim.clipTime = +(qs.get('at') || 0.6) * (CLIPS[name].duration || 1);
        n.anim.phase = +(qs.get('phase') || 0.8);
        if (name === 'run') n.setExpression('angry');
        if (name === 'reach') n.setExpression('scream');
        n.lookTarget = engine.camera.position;
        lineup.push(n);
      });
    }
    viewer.root.rotation.y = (+(qs.get('rot') || 0)) * Math.PI / 180;
    viewer.setExpression(qs.get('expr') || 'suspicious');
    if (qs.get('grip')) for (const s of ['L', 'R']) viewer.setGrip(s, +qs.get('grip'));
    viewer.lookTarget = engine.camera.position;
    const names = Object.keys(EXPRESSIONS);
    let ei = 0;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyX') { ei = (ei + 1) % names.length; viewer.setExpression(names[ei]); console.log('expression', names[ei]); }
      if (e.code === 'KeyT') viewer.root.userData.spin = !viewer.root.userData.spin;
    });
    if (qs.has('silhouette')) {
      const black = new MeshBasicMaterial({ color: 0x000000 });
      viewer.root.traverse((m) => { if (m.isMesh && m.userData.isOutline) m.visible = false; else if (m.isMesh) m.material = black; });
      engine.scene.background = new Color(0xffffff);
      engine.scene.fog = null;
      for (const c of [...engine.scene.children]) if (c !== viewer.root && !c.isLight && !c.isCamera) c.visible = false;
    }
    const freeze = qs.has('freeze');
    updaters.push((dt) => {
      if (viewer.root.userData.spin) viewer.root.rotation.y += dt * 0.6;
      viewer.anim.update(dt);
      viewer.update(dt);
      for (const n of lineup) { n.anim.update(freeze ? 0 : dt); n.update(dt); }
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        const names = Object.keys(CLIPS);
        const i = (names.indexOf(viewer.anim.clip) + 1) % names.length;
        viewer.anim.play(names[i]);
        viewer.anim.speed = { walk: 1.4, sneak: 1.0, run: 5.6 }[names[i]] ?? 0;
        console.log('clip', names[i]);
      }
    });
  }

  return viewer;
}
