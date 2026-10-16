// Boot.
import { Game } from './game/Game.js';

Game.create().catch((err) => {
  console.error(err);
  const o = document.getElementById('overlay');
  if (o) o.querySelector('.overlay-sub').textContent = `Failed to start: ${err.message}`;
  window.__nnError = String(err && err.stack || err);
});
