// Boot the Act 3 House Study.
import { App } from './App.js';

App.create().catch((err) => {
  console.error(err);
  const o = document.getElementById('a3-start');
  if (o) o.querySelector('.sub').textContent = `Failed to start: ${err.message}`;
  window.__a3Error = String((err && err.stack) || err);
});
