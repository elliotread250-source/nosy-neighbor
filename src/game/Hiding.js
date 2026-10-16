// Hiding: the camera tucks into the spot (wardrobe slats, under a bed,
// behind the sofa), movement stops, looking is limited, and the player's
// collider goes away so he can walk right past. Safe unless he saw you go
// in, or he decides to check this one.
import { Events } from '../core/Events.js';

export class Hiding {
  constructor(game) {
    this.game = game;
    this.spot = null;
    this.enteredAt = 0;
  }

  get active() { return !!this.spot; }

  enter(spot) {
    const g = this.game;
    const p = g.player;
    if (this.spot) return;
    g.interaction?.carry && g.interaction.dropCarry(0);
    this.spot = spot;
    this.enteredAt = performance.now() / 1000;
    p.hiding = true;
    p.hideSpot = spot;
    p.collider.setEnabled(false);
    p.vel.set(0, 0, 0);
    p.hideYaw = Math.atan2(-spot.look.x, -spot.look.z);
    p.hideFrom = p.camera.position.clone();
    p.hideT = 0;
    p.yaw = p.hideYaw;
    p.pitch = spot.kind === 'underBed' || spot.kind === 'underTable' ? 0.05 : -0.05;
    p.curFeet.set(spot.eye.x, spot.floorY, spot.eye.z);
    p.prevFeet.copy(p.curFeet);
    Events.emit('hide:enter', { spot });
    Events.emit('sfx', { name: spot.kind === 'wardrobe' ? 'wardrobeIn' : 'rustle', position: spot.eye.clone() });
  }

  exit(teleport = true) {
    const p = this.game.player;
    const spot = this.spot;
    if (!spot) return;
    this.spot = null;
    p.hiding = false;
    p.hideSpot = null;
    p.collider.setEnabled(true);
    if (teleport) p.spawn(spot.exit, p.hideYaw);
    Events.emit('hide:exit', { spot });
    Events.emit('sfx', { name: spot.kind === 'wardrobe' ? 'wardrobeOut' : 'rustle', position: spot.eye.clone() });
  }

  forceExit(teleport = true) {
    this.exit(teleport);
  }
}
