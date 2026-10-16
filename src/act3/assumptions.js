// Every proportion rule an `assumed` dimension can come from (spec section 4,
// section 18 for the player, section 35 for the baseline house). Edit here;
// house.json records which rule produced each assumed number.
// Units: meters, seconds, degrees.

export const RULES = {
  // architecture (section 4)
  ceiling_default: 3.4,
  ceiling_f2_box: 3.0,
  ceiling_basement: 3.2,
  door_height: 2.6,
  door_width: 0.95,
  window_sill: 0.9,
  window_height: 1.5,
  window_width: 0.9,
  wall_exterior: 0.3,
  wall_interior: 0.18,
  slab: 0.3,
  stair_riser: 0.2,
  stair_tread: 0.26,
  stair_width: 1.1,
  stair_headroom_min: 2.0, // tests use 2.0 (section 9 test 5); section 4 asks for 2.2 as a design target
  stair_headroom_target: 2.2,
  hall_width_min: 1.4,
  hall_width_max: 1.8,
  room_area_min: 12,
  room_area_max: 40,
  overhang_max: 1.0,
  // handrails (section 17.4)
  handrail_height: 0.9,
  baluster_gap_max: 0.1,
  // roof (section 19.1)
  roof_pitch_gable: 35,
  roof_pitch_f2_box: 12,
  eaves: 0.45,
  parapet_height: 0.55,
  parapet_thickness: 0.25,
  // ladders (section 20)
  ladder_rung_spacing: 0.28,
  ladder_rail_gap: 0.45,
};

// The player (section 18.1). All assumed until confirmed.
export const PLAYER = {
  height: 1.2,
  eyeHeight: 1.1,
  capsuleRadius: 0.22,
  walkSpeed: 2.2,
  sprintSpeed: 4.2,
  gravity: 9.81,
  jumpVelocity: 4.0,
  maxStepHeight: 0.3,
  coyoteTime: 0.1,
  jumpBuffer: 0.1,
  footClear: 0.1, // highest landable surface = jump rise minus this
};

// Design constants (tagged `design` wherever they appear).
export const DESIGN = {
  cartoonScale: 2.0, // props only, never architecture (section 20)
  ledgeForgiveness: 0, // extra collider padding on tiny ledges (section 18.4)
  styleWarpCap: 0.04, // style mode may change no dimension by more than 4 percent (section 7)
  styleBevel: 0.05, // 3 to 8 percent edge chamfer in style mode, never moving a face more than 1 cm
  jumpMarginMin: 0.05,
  jumpMarginMax: 0.4,
};

// Junction tolerance for the wall checks (section 9 test 2).
export const TOLERANCE = { junction: 0.001, overlapArea: 1e-6 };

export const TAGS = ['measured', 'measured-rough', 'documented', 'documented-weak', 'assumed', 'assumed-from-standard', 'standard', 'design', 'fan-plan', 'conflict'];
