/** Gym placement adapter for the 2 Player Arcade at 398 Foam Street. The location is ~2.2 km
 * from Lovers Point, outside the park/waterfront walking outline, so it owns a separate walking
 * region (bounds, colliders, flat floor) that the workbench selects on arrival, like the
 * museum mezzanine. Colliders come from the same layout constants as the visible geometry. */
import { Vector3 } from 'three';
import { createTwoPlayerArcade, ARCADE_LAYOUT, ARCADE_STAIR, ARCADE_HEDGES, ARCADE_MAILBOX, ARCADE_POLES, ARCADE_TREE } from '../../models/locations/twoPlayerArcade';
import { ARCADE_CONTEXT, ARCADE_FOOTPRINT, ARCADE_SITE, ARCADE_SOURCE, ARCADE_SUITE, arcadeToLocal, arcadeToWorld } from '../../data/twoPlayerArcade';
import { insidePolygon, type GymBounds, type GymCollider, type GymPoint } from '../avatarController';
import type { GymInteraction } from '../testingGym';

const { pad, floorY } = ARCADE_SITE;

function polygonCollider(local: readonly GymPoint[], top?: number): GymCollider {
  const footprint = local.map(p => arcadeToWorld(p[0], p[1])), xs = footprint.map(p => p[0]), zs = footprint.map(p => p[1]);
  return { kind: 'box', minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs), footprint, top };
}
const rect = (x0: number, z0: number, x1: number, z1: number, top = floorY + 3.6) => polygonCollider([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], top);
const circle = (x: number, z: number, radius: number): GymCollider => { const [wx, wz] = arcadeToWorld(x, z); return { kind: 'circle', x: wx, z: wz, radius }; };

export function createArcadeSite() {
  const model = createTwoPlayerArcade();
  model.root.position.set(ARCADE_SITE.anchor[0], floorY, ARCADE_SITE.anchor[1]);
  model.root.rotation.y = ARCADE_SITE.yaw;
  model.root.updateMatrixWorld(true);
  const point = (x: number, z: number, y = 0) => { const [wx, wz] = arcadeToWorld(x, z); return new Vector3(wx, floorY + y, wz); };
  const S = ARCADE_SUITE, L = ARCADE_LAYOUT;

  const colliders: GymCollider[] = [
    // Building blocks around Suite A. Porch recesses stay open; neighbouring suites are closed.
    rect(0, -12.5, S.porch.minX, 0), rect(5.85, -14.4, S.porch.minX, -12.5),
    rect(S.porch.minX, -14.4, S.minX, S.porchWall), rect(12.72, -17.99, 16.49, -14.4),
    rect(S.minX, -15.1, 26.2, S.back), rect(16.49, -15.1, 26.19, -12.5),
    rect(S.maxX, -12.68, 37.1, 0), rect(37.1, -12.68, 44.5, S.porchWall), rect(44.5, -12.68, 54.43, 0),
    rect(34.2, -16.55, 42.23, -12.68), rect(42.23, -14.71, 49.61, -12.68), rect(49.61, -13.92, 54.43, -12.68),
    // Suite A front: porch wall either side of the open door, the jog and the storefront.
    rect(S.minX, S.porchWall - .1, S.door.minX, S.porchWall + .1), rect(S.door.maxX, S.porchWall - .1, S.porch.maxX + .1, S.porchWall + .1),
    rect(S.porch.maxX, S.porchWall, S.porch.maxX + .12, 0), rect(S.porch.maxX, S.storefrontWall, S.maxX, .05),
    // Fit-out.
    rect(S.minX, L.cabinets.centres.at(-1)! - L.cabinets.width / 2, S.minX + L.cabinets.depth, L.cabinets.centres[0] + L.cabinets.width / 2, floorY + 1.9),
    rect(S.maxX - L.redCabinet.depth, L.redCabinet.z - L.redCabinet.width / 2, S.maxX, L.redCabinet.z + L.redCabinet.width / 2, floorY + 1.9),
    rect(L.table.x0, L.table.z0, L.table.x1, L.table.z1, floorY + 1.05),
    rect(L.counter.x0, L.counter.z0, L.counter.x1, L.counter.z1, floorY + 1.4),
    rect(S.door.maxX - .06, S.porchWall - 1.1, S.door.maxX, S.porchWall - .02, floorY + 2.3),
    ...L.stools.map(([x, z]) => circle(x, z, .2)),
    // Site.
    rect(ARCADE_STAIR.footX, ARCADE_STAIR.z0, ARCADE_STAIR.landingX, ARCADE_STAIR.z1 + .05),
    ...ARCADE_HEDGES.map(([h0, h1]) => rect(h0, .15, h1, 1.2, floorY + 1.1)),
    circle(ARCADE_TREE.x, ARCADE_TREE.z, ARCADE_TREE.trunk + .1),
    ...ARCADE_POLES.map(([x, z, r]) => circle(x, z, r + .05)),
    rect(ARCADE_MAILBOX.x0, ARCADE_MAILBOX.z0, ARCADE_MAILBOX.x1, ARCADE_MAILBOX.z1, floorY + 1.9),
    ...ARCADE_CONTEXT.neighbours.map(n => polygonCollider(n.ring, floorY + n.height)),
  ];
  const padLocal: GymPoint[] = [[pad.minX, pad.minZ], [pad.maxX, pad.minZ], [pad.maxX, pad.maxZ], [pad.minX, pad.maxZ]];
  // Keep the walking body a little inside the pad edge so it never steps onto the skirt.
  const walkable = ([[pad.minX + 1, pad.minZ + 1], [pad.maxX - 1, pad.minZ + 1], [pad.maxX - 1, pad.maxZ - 1], [pad.minX + 1, pad.maxZ - 1]] as GymPoint[]).map(p => arcadeToWorld(p[0], p[1]));
  const padWorld = padLocal.map(p => arcadeToWorld(p[0], p[1]));
  const bounds: GymBounds = { minX: Math.min(...walkable.map(p => p[0])), maxX: Math.max(...walkable.map(p => p[0])), minZ: Math.min(...walkable.map(p => p[1])), maxZ: Math.max(...walkable.map(p => p[1])), walkable };
  // Flight: the exact mapped outline up to the gable ridge.
  const flight = polygonCollider(ARCADE_FOOTPRINT);
  if (flight.kind !== 'box') throw new Error('Arcade flight obstacle must be a box');
  const flightObstacles = [{ minX: flight.minX, maxX: flight.maxX, minZ: flight.minZ, maxZ: flight.maxZ, top: floorY + 9.2, footprint: flight.footprint! }];
  const interactions: GymInteraction[] = [
    { id: 'arcade-storefront', label: 'Read the shop window', action: 'inspect', radius: 2.4, position: point(22.5, 2.4, .04),
      description: '2 Player Arcade Shop · 398 Foam St, Suite A. A retro arcade, repair shop and lounge in New Monterey. Enter through the porch door on the left.' },
    { id: 'arcade-enter', label: 'Enter 2 Player Arcade', action: 'enter', radius: 1.3, position: point((S.door.minX + S.door.maxX) / 2, S.porchWall + .55, .04),
      description: 'Suite A, the 2 Player Arcade. Walk through the open door or press E to go inside.' },
  ];
  /** Avatar yaw facing a local X/Z direction (yaw 0 faces world +Z). */
  const yawToward = (dx: number, dz: number) => { const wx = ARCADE_SITE.along[0] * dx + ARCADE_SITE.front[0] * dz, wz = ARCADE_SITE.along[1] * dx + ARCADE_SITE.front[1] * dz; return Math.atan2(wx, wz); };
  const yawInland = yawToward(0, -1);
  return {
    ...model, colliders, bounds, interactions, flightObstacles, floorY, point,
    source: ARCADE_SOURCE,
    // Getter must remain live after spreading the factory result.
    get view() { return model.view; },
    /** World-space pad outline: cut from the regional terrain so the two surfaces never overlap. */
    regionFootprint: padWorld,
    footprint: ARCADE_FOOTPRINT.map(p => arcadeToWorld(p[0], p[1])),
    entrance: point(16.5, -.2, .045), inside: point(20.6, -3.9, .045), street: point(13.5, 3.0, .12),
    yawInland, yawInside: yawToward(-2.4, -3.6),
    /** Camera spot matching the interior photograph: front-right of the room beside the red cabinet,
     * looking toward the cabinet row and the brick wall. */
    photoView: { position: point(22.9, -.9, 1.7) },
    contains(x: number, z: number) { return insidePolygon(x, z, padWorld); },
    floorAt(x: number, z: number) { return insidePolygon(x, z, padWorld) ? floorY : undefined; },
    insideSuiteAt(x: number, z: number) { const [lx, lz] = arcadeToLocal(x, z); return model.insideSuite(lx, lz); },
    /** Doorway thresholds with hysteresis: enter a step past the porch wall, leave once back on the porch. */
    crossedIn(x: number, z: number) { const [lx, lz] = arcadeToLocal(x, z); return model.insideSuite(lx, lz) && lz < S.porchWall - .3; },
    crossedOut(x: number, z: number) { const [lx, lz] = arcadeToLocal(x, z); return !model.insideSuite(lx, lz) && lz > S.porchWall + .15; },
    /** Porch spot outside the door, facing Foam Street, for returning from the interior screen. */
    porch: point((S.door.minX + S.door.maxX) / 2, S.porchWall + .75, .045), yawStreet: yawToward(0, 1),
    /** Arrival spot a step inside, clear of the door leaf, with an open view from the front-right. */
    doorInside: point(17.6, -2.9, .045), yawArrive: yawToward(-1.5, -1.5),
  };
}
export type ArcadeSite = ReturnType<typeof createArcadeSite>;
