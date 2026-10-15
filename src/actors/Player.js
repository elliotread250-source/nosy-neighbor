// First-person controller on Rapier's kinematic character controller:
// walk, sprint with stamina, crouch (toggle or hold), jump with coyote time,
// head bob, landing dip, lean, FOV kick, and chunky cartoon hands.
import { Group, Mesh, Vector3, CapsuleGeometry, MathUtils } from 'three';
import { RAPIER, GROUP, groups } from '../core/Physics.js';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';
import { makeMat } from '../art/Materials.js';
import { roundedBox, chamferCylinder } from '../art/Geo.js';

const P = CONFIG.player;
const DEG = Math.PI / 180;
const _fwd = new Vector3();
const _right = new Vector3();
const _wish = new Vector3();
const _tmp = new Vector3();

export class Player {
  constructor(engine, physics, input) {
    this.engine = engine;
    this.physics = physics;
    this.input = input;
    this.camera = engine.camera;
    this.camera.rotation.order = 'YXZ';

    this.yaw = 0;
    this.pitch = 0;
    this.vel = new Vector3();
    this.grounded = false;
    this.wasGrounded = false;
    this.crouching = false;
    this.crouchHeld = false;
    this.crouchT = 0; // 0 standing .. 1 crouched (smoothed, visual)
    this.stamina = 1;
    this.staminaDelay = 0;
    this.exhausted = false;
    this.sprinting = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.lean = 0;
    this.bobPhase = 0;
    this.bobAmp = 0;
    this.lastStep = 0;
    this.landDip = 0;
    this.landVel = 0;
    this.fallSpeed = 0;
    this.fov = CONFIG.camera.fov;
    this.chaseIntensity = 0; // set by the game when the neighbor is chasing
    this.carrying = false;
    this.noclip = false;
    this.enabled = true;

    this.standHalf = P.height / 2 - P.radius;
    this.crouchHalf = P.crouchHeight / 2 - P.radius;

    this.prevFeet = new Vector3();
    this.curFeet = new Vector3();

    this._buildBody();
    this._buildHands();
  }

  _buildBody() {
    const { world } = this.physics;
    this.body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 5, 0));
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(this.standHalf, P.radius)
        .setCollisionGroups(groups(GROUP.PLAYER, GROUP.STATIC | GROUP.PROP | GROUP.NEIGHBOR | GROUP.TRIGGER)),
      this.body,
    );
    this.physics.colliderData.set(this.collider.handle, { kind: 'player' });
    const cc = world.createCharacterController(P.controllerOffset);
    cc.setUp({ x: 0, y: 1, z: 0 });
    cc.enableAutostep(P.autostepHeight, P.autostepMinWidth, true);
    cc.enableSnapToGround(P.snapToGround);
    cc.setMaxSlopeClimbAngle(P.maxSlopeClimb * DEG);
    cc.setMinSlopeSlideAngle(P.minSlopeSlide * DEG);
    cc.setSlideEnabled(true);
    cc.setApplyImpulsesToDynamicBodies(true);
    cc.setCharacterMass(P.pushMass);
    this.controller = cc;
  }

  _buildHands() {
    const hands = new Group();
    hands.name = 'playerHands';
    const skin = makeMat('PLAYER_SKIN', { rim: 0.3, spec: 0.15 });
    const sleeve = makeMat('PLAYER_SLEEVE', { rim: 0.3 });
    const makeHand = (side) => {
      const g = new Group();
      const palm = new Mesh(roundedBox(0.085, 0.045, 0.1, 0.02, 3), skin);
      const thumb = new Mesh(new CapsuleGeometry(0.014, 0.03, 4, 8), skin);
      thumb.rotation.z = Math.PI / 2;
      thumb.rotation.y = side * 0.5;
      thumb.position.set(side * -0.05, 0.005, -0.02);
      const fingers = new Mesh(roundedBox(0.08, 0.035, 0.06, 0.016, 3), skin);
      fingers.position.set(0, -0.008, -0.07);
      fingers.rotation.x = 0.35;
      const wrist = new Mesh(chamferCylinder(0.034, 0.03, 0.08, 12, 0.01), skin);
      wrist.rotation.x = Math.PI / 2;
      wrist.position.z = 0.07;
      const cuff = new Mesh(chamferCylinder(0.05, 0.05, 0.07, 14, 0.018), sleeve);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.z = 0.13;
      const arm = new Mesh(chamferCylinder(0.047, 0.047, 0.3, 12, 0.01), sleeve);
      arm.rotation.x = Math.PI / 2;
      arm.position.z = 0.3;
      g.add(palm, thumb, fingers, wrist, cuff, arm);
      g.traverse((m) => { m.castShadow = false; m.receiveShadow = false; });
      return g;
    };
    this.handL = makeHand(-1);
    this.handR = makeHand(1);
    this.handRest = {
      L: new Vector3(-0.2, -0.2, -0.34),
      R: new Vector3(0.2, -0.2, -0.34),
    };
    this.handL.position.copy(this.handRest.L);
    this.handR.position.copy(this.handRest.R);
    this.handL.rotation.set(0.15, 0.2, 0.3);
    this.handR.rotation.set(0.15, -0.2, -0.3);
    hands.add(this.handL, this.handR);
    this.hands = hands;
    this.camera.add(hands);
  }

  spawn(pos, yaw = 0) {
    if (!this.spawnPoint) this.spawnPoint = pos.clone();
    const half = this.crouching ? this.crouchHalf : this.standHalf;
    const cy = pos.y + half + P.radius + 0.02;
    this.body.setTranslation({ x: pos.x, y: cy, z: pos.z }, true);
    this.body.setNextKinematicTranslation({ x: pos.x, y: cy, z: pos.z });
    this.yaw = yaw;
    this.pitch = 0;
    this.vel.set(0, 0, 0);
    this.curFeet.set(pos.x, pos.y + 0.02, pos.z);
    this.prevFeet.copy(this.curFeet);
  }

  get halfHeight() {
    return this.crouching ? this.crouchHalf : this.standHalf;
  }

  feetFromBody(out = new Vector3()) {
    const t = this.body.translation();
    return out.set(t.x, t.y - this.halfHeight - P.radius, t.z);
  }

  eyePosition(out = new Vector3()) {
    return out.copy(this.camera.position);
  }

  // ---------- per-frame (look, toggles) ----------

  update(dt, alpha) {
    const inp = this.input;
    if (this.enabled) {
      const [lx, ly] = inp.consumeLook(dt);
      const sens = P.mouseSensitivity;
      this.yaw -= lx * sens;
      this.pitch -= ly * sens * (P.invertY ? -1 : 1);
      this.pitch = MathUtils.clamp(this.pitch, -P.pitchLimit * DEG, P.pitchLimit * DEG);

      if (P.crouchToggle) {
        if (inp.pressed('crouch') && !this.noclip) this.crouchHeld = !this.crouchHeld;
      } else this.crouchHeld = inp.down('crouch') && !this.noclip;
      if (inp.pressed('jump')) this.jumpBuffer = P.jumpBuffer;
    } else inp.consumeLook(dt);

    if (this.noclip) {
      this._updateNoclip(dt);
    } else {
      const feet = _tmp.lerpVectors(this.prevFeet, this.curFeet, alpha);
      this.crouchT = MathUtils.damp(this.crouchT, this.crouching ? 1 : 0, P.crouchLerp, dt);
      const eye = MathUtils.lerp(P.eyeHeight, P.crouchEyeHeight, this.crouchT);
      this.camera.position.set(feet.x, feet.y + eye, feet.z);
    }

    this._updateFeel(dt);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    this._applyLeanAndBob(dt);
    this._updateHands(dt);
  }

  // ---------- fixed step (movement) ----------

  fixedUpdate(dt) {
    if (this.noclip) return;
    this.prevFeet.copy(this.curFeet);
    const inp = this.input;
    this._updateCrouch();

    const [mx, my] = this.enabled ? inp.moveAxis() : [0, 0];
    const moving = Math.abs(mx) + Math.abs(my) > 0.01;
    const wantsSprint = this.enabled && inp.down('sprint') && my > 0.3 && !this.crouching;

    // stamina
    if (this.exhausted && this.stamina >= P.staminaMinToSprint) this.exhausted = false;
    this.sprinting = wantsSprint && moving && !this.exhausted && this.stamina > 0;
    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - dt / P.staminaDrainTime);
      this.staminaDelay = P.staminaRecoverDelay;
      if (this.stamina <= 0) this.exhausted = true;
    } else if (this.staminaDelay > 0) this.staminaDelay -= dt;
    else this.stamina = Math.min(1, this.stamina + dt / P.staminaRecoverTime);

    let speed = this.crouching ? P.crouchSpeed : this.sprinting ? P.sprintSpeed : P.walkSpeed;
    if (this.carrying) speed *= P.carrySpeedMul;

    _fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    _wish.set(0, 0, 0).addScaledVector(_fwd, my).addScaledVector(_right, mx).multiplyScalar(speed);

    const accel = this.grounded ? P.groundAccel : P.airAccel;
    const k = 1 - Math.exp(-accel * dt);
    this.vel.x += (_wish.x - this.vel.x) * k;
    this.vel.z += (_wish.z - this.vel.z) * k;

    // jumping with coyote time + buffer
    this.coyote = this.grounded ? P.coyoteTime : Math.max(0, this.coyote - dt);
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;
    if (this.jumpBuffer > 0 && this.coyote > 0 && !this.crouching) {
      this.vel.y = P.jumpVelocity;
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.grounded = false;
      Events.emit('player:jump', { position: this.curFeet.clone() });
    }
    this.vel.y += CONFIG.physics.gravity * dt;

    const desired = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    this.controller.computeColliderMovement(this.collider, desired, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS);
    const m = this.controller.computedMovement();
    const t = this.body.translation();
    this.body.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });

    this.wasGrounded = this.grounded;
    this.grounded = this.controller.computedGrounded();
    // bonk head on ceilings
    if (this.vel.y > 0 && m.y < desired.y * 0.5) this.vel.y = 0;
    if (!this.grounded) this.fallSpeed = Math.max(this.fallSpeed, -this.vel.y);
    if (this.grounded) {
      if (!this.wasGrounded && this.fallSpeed > 3) {
        this.landVel = -Math.min(P.landDipMax, this.fallSpeed * P.landDipPerMs);
        Events.emit('player:land', { speed: this.fallSpeed, position: this.curFeet.clone() });
      }
      this.fallSpeed = 0;
      if (this.vel.y < 0) this.vel.y = -1; // keep pressed into the ground for snapping
    }
    // horizontal speed actually achieved (walls stop us)
    this.horizSpeed = Math.hypot(m.x, m.z) / dt;
    this.curFeet.set(t.x + m.x, t.y + m.y - this.halfHeight - P.radius, t.z + m.z);
    // fell out of the world: put them back
    if (this.curFeet.y < -30) this.spawn(this.spawnPoint ?? new Vector3(0, 1, 0), this.yaw);
  }

  _updateCrouch() {
    const want = this.crouchHeld;
    const d = this.standHalf - this.crouchHalf;
    const t = this.body.translation();
    if (want && !this.crouching) {
      this.crouching = true;
      this.collider.setHalfHeight(this.crouchHalf);
      if (this.grounded) {
        this.body.setTranslation({ x: t.x, y: t.y - d, z: t.z }, true);
      } else {
        // in the air, tuck the legs up (crouch-jump onto crates); the head stays put
        this.body.setTranslation({ x: t.x, y: t.y + d, z: t.z }, true);
        this.curFeet.y += 2 * d;
        this.prevFeet.y += 2 * d;
        this.crouchT = 1;
      }
    } else if (!want && this.crouching) {
      // grounded: grow upward. airborne: extend the legs downward.
      const tries = this.grounded ? [d + 0.02] : [-d, d + 0.02];
      const shape = new RAPIER.Capsule(this.standHalf, P.radius - 0.02);
      for (const dy of tries) {
        const test = { x: t.x, y: t.y + dy, z: t.z };
        const blocked = this.physics.world.intersectionWithShape(
          test, { x: 0, y: 0, z: 0, w: 1 }, shape,
          RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(GROUP.PLAYER, GROUP.STATIC | GROUP.PROP),
          this.collider,
        );
        if (blocked) continue;
        this.crouching = false;
        this.collider.setHalfHeight(this.standHalf);
        this.body.setTranslation(test, true);
        if (dy < 0) {
          this.curFeet.y -= 2 * d;
          this.prevFeet.y -= 2 * d;
          this.crouchT = 0;
        }
        break;
      }
    }
  }

  // ---------- camera feel ----------

  _updateFeel(dt) {
    const target = CONFIG.camera.fov +
      (this.sprinting && this.horizSpeed > 1 ? CONFIG.camera.sprintFovBoost : 0) +
      this.chaseIntensity * CONFIG.camera.chaseFovBoost;
    this.fov = MathUtils.damp(this.fov, target, CONFIG.camera.fovLerp, dt);
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    // landing dip: critically damped spring
    const kSpring = 120, kDamp = 18;
    this.landVel += (-kSpring * this.landDip - kDamp * this.landVel) * dt;
    this.landDip += this.landVel * dt * 6;
    this.landDip = MathUtils.clamp(this.landDip, -P.landDipMax, 0.05);
  }

  _applyLeanAndBob(dt) {
    const inp = this.input;
    let leanTarget = 0;
    if (this.enabled && !this.noclip) {
      if (inp.down('leanLeft')) leanTarget -= 1;
      if (inp.down('leanRight')) leanTarget += 1;
    }
    // don't lean through walls
    if (leanTarget !== 0) {
      _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(Math.sign(leanTarget));
      const hit = this.physics.raycast(this.camera.position, _right, P.leanDistance + 0.2, this.collider);
      if (hit) leanTarget *= MathUtils.clamp((hit.toi - 0.2) / P.leanDistance, 0, 1);
    }
    this.lean = MathUtils.damp(this.lean, leanTarget, P.leanLerp, dt);

    // head bob from distance travelled on the ground
    const hs = this.grounded && !this.noclip ? this.horizSpeed || 0 : 0;
    const ampTarget = !P.headBob || hs < 0.3 ? 0 : this.sprinting ? P.bobSprintAmp : this.crouching ? P.bobWalkAmp * 0.6 : P.bobWalkAmp;
    this.bobAmp = MathUtils.damp(this.bobAmp, ampTarget, 8, dt);
    this.bobPhase += (hs * dt / P.bobStride) * Math.PI * 2;
    const step = Math.floor(this.bobPhase / Math.PI);
    if (step !== this.lastStep && hs > 0.3) {
      this.lastStep = step;
      const loudness = this.sprinting ? 1 : this.crouching ? 0.08 : 0.45;
      Events.emit('player:footstep', { loudness, position: this.curFeet.clone() });
    }

    const bobY = Math.sin(this.bobPhase * 2) * this.bobAmp;
    const bobX = Math.sin(this.bobPhase) * (P.headBob ? P.bobSwayAmp : 0) * (this.bobAmp > 0.001 ? 1 : 0);

    if (this.noclip) return;
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.camera.position.addScaledVector(_right, this.lean * P.leanDistance + bobX);
    this.camera.position.y += bobY + this.landDip;
    this.camera.rotation.z = -this.lean * P.leanRoll * DEG;
  }

  _updateHands(dt) {
    const t = performance.now() / 1000;
    const sway = this.bobAmp * 2.2;
    const run = this.sprinting ? 1 : 0;
    const idle = Math.sin(t * 1.6) * 0.004;
    for (const [hand, rest, side] of [[this.handL, this.handRest.L, -1], [this.handR, this.handRest.R, 1]]) {
      const ph = this.bobPhase + (side > 0 ? Math.PI : 0);
      hand.position.set(
        rest.x + Math.sin(ph) * sway * 0.6,
        rest.y + Math.abs(Math.cos(ph)) * sway * 0.5 + idle - run * 0.02 + this.landDip * 0.4,
        rest.z + Math.sin(ph) * sway * run * 1.2,
      );
    }
  }

  _updateNoclip(dt) {
    const inp = this.input;
    const [mx, my] = inp.moveAxis();
    const sp = P.noclipSpeed * (inp.down('sprint') ? 3 : 1);
    _fwd.set(0, 0, -1).applyEuler(this.camera.rotation);
    _right.set(1, 0, 0).applyEuler(this.camera.rotation);
    this.camera.position.addScaledVector(_fwd, my * sp * dt).addScaledVector(_right, mx * sp * dt);
    if (inp.down('flyUp')) this.camera.position.y += sp * dt;
    if (inp.down('flyDown')) this.camera.position.y -= sp * dt;
  }

  setNoclip(on) {
    this.noclip = on;
    if (!on) {
      const p = this.camera.position;
      this.spawn(new Vector3(p.x, p.y - P.eyeHeight, p.z), this.yaw);
    }
  }
}
