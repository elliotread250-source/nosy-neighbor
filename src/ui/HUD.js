// Minimal in-game HUD: crosshair dot, stamina bar (only when not full),
// and the objective line. More arrives in Milestone 13.
export class HUD {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="hud-crosshair"></div>
      <div class="hud-objective"></div>
      <div class="hud-stamina"><div class="hud-stamina-fill"></div></div>
    `;
    this.cross = root.querySelector('.hud-crosshair');
    this.objective = root.querySelector('.hud-objective');
    this.stamina = root.querySelector('.hud-stamina');
    this.staminaFill = root.querySelector('.hud-stamina-fill');
    this._objTimer = 0;
  }

  setVisible(v) {
    this.root.style.display = v ? '' : 'none';
  }

  showObjective(text, seconds = 5) {
    this.objective.textContent = text;
    this.objective.classList.add('show');
    this._objTimer = seconds;
  }

  update(dt, player) {
    const s = player.stamina;
    this.stamina.classList.toggle('show', s < 0.999);
    this.stamina.classList.toggle('exhausted', player.exhausted);
    this.staminaFill.style.transform = `scaleX(${s.toFixed(3)})`;
    if (this._objTimer > 0) {
      this._objTimer -= dt;
      if (this._objTimer <= 0) this.objective.classList.remove('show');
    }
  }
}
