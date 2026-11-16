/** Level site around 398 Foam Street: mapped streets, parking and neighbouring footprints from
 * OSM, plus photo-informed planting, curb paint, poles and the street tree. Widths, curb paint
 * extents, planting and neighbour heights are authored estimates. */
import type { LodLevel } from '../../shared/lod/geometry';
import { ARCADE_BAYS, ARCADE_CONTEXT as K, ARCADE_SITE } from '../../../data/twoPlayerArcade';
import { palette, type Painter } from './painter';

export const SITE_COLORS = palette({
  ground: '#a9a688', skirt: '#8a8670', asphalt: '#62666a', lane: '#e8e2cf', sidewalk: '#c6c3ba', curb: '#b3b0a7', redCurb: '#b6443b',
  concrete: '#b9b5ab', stall: '#ecebe4', mulch: '#6e5843', hedge: '#4f6b3a', hedgeShade: '#3f5730', tile: '#b46f4e',
  crown: '#73833d', crownShade: '#56662e', bark: '#8c867a', pole: '#6d6253', sign: '#2f6b4b', mailbox: '#c9b89b',
  n1: '#d6c3a5', n2: '#c9b8a6', n3: '#b8c0b1', n4: '#d8cbb6', n5: '#c4a98e', n6: '#bfb7a8', parapet: '#9a8f80', lot: '#7b7f80',
});
const C = SITE_COLORS;

/** Hedge runs in the Foam Street planting strip; porches and the service door stay open. */
export const ARCADE_HEDGES: readonly [number, number][] = [[.4, 6.9], [17.7, 20.4], [26.5, 36.6], [45.0, 54.0]];
export const ARCADE_TREE = { x: 7.7, z: 2.35, trunk: .22 } as const;
export const ARCADE_POLES: readonly [number, number, number][] = [[27.4, 3.95, .16], [4.7, 3.9, .05]];
export const ARCADE_MAILBOX = { x0: .2, x1: .65, z0: -16.6, z1: -15.0 } as const;

export function buildSite(p: Painter, level: LodLevel) {
  const near = level === 'near', far = level === 'far', pad = ARCADE_SITE.pad;
  const rect = (x0: number, z0: number, x1: number, z1: number, y: number, color: typeof C.ground) => p.flat([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y, color);
  // ---- Level pad and a skirt that drops into the coarse regional terrain.
  rect(pad.minX, pad.minZ, pad.maxX, pad.maxZ, 0, C.ground);
  p.extrude([[pad.minX, pad.minZ], [pad.maxX, pad.minZ], [pad.maxX, pad.maxZ], [pad.minX, pad.maxZ]], -9, 0, C.skirt);
  // ---- Streets: Foam (one-way tertiary) and Drake Avenue, plus their sidewalks.
  const fz0 = K.foamCentreZ - K.foamHalfWidth, fz1 = K.foamCentreZ + K.foamHalfWidth;
  const dx0 = K.drakeCentreX - K.drakeHalfWidth, dx1 = K.drakeCentreX + K.drakeHalfWidth;
  rect(pad.minX, fz0, pad.maxX, fz1, .006, C.asphalt);
  rect(dx0, pad.minZ, dx1, fz0, .006, C.asphalt);
  rect(dx0, fz1, dx1, pad.maxZ, .006, C.asphalt);
  const walk = (x0: number, z0: number, x1: number, z1: number) => p.box(x0, -.05, z0, x1, .07, z1, C.sidewalk, ['bottom']);
  walk(dx1, 0, pad.maxX, fz0);                         // building side of Foam
  walk(pad.minX, fz1, dx0, fz1 + K.sidewalk); walk(dx1, fz1, pad.maxX, fz1 + K.sidewalk);
  walk(dx1, pad.minZ, dx1 + K.sidewalk, 0);            // building side of Drake
  walk(dx0 - K.sidewalk, pad.minZ, dx0, fz0); walk(pad.minX, fz0 - K.sidewalk, dx0 - K.sidewalk, fz0);
  if (!far) {
    p.box(0, -.05, fz0 - .14, 20.5, .09, fz0 + .02, C.redCurb, ['bottom']);   // painted curb (street photo)
    p.box(dx1 - .02, -.05, -9, dx1 + .14, .09, fz0, C.redCurb, ['bottom']);    // corner no-parking (rear photo)
    // White crosswalk bars at the signalled Foam/Drake corner.
    const bars = near ? 8 : 4;
    for (let i = 0; i < bars; i++) { const x = dx0 + .4 + i * (dx1 - dx0 - .8) / (bars - 1); rect(x - .22, fz0 + .4, x + .22, fz0 + 2.8, .009, C.lane); }
  }
  // ---- Planting strip, porch pavers and hedges along the frontage.
  rect(.0, .0, 54.43, 1.3, .075, C.mulch);
  for (const b of ARCADE_BAYS) { const [c0, c1] = b.centre; p.box(c0 - .4, -.05, -1.4, c1 + .4, .085, 1.35, C.tile, ['bottom']); }
  p.box(25.0, -.05, 0, 26.2, .085, 1.35, C.tile, ['bottom']);
  for (const [h0, h1] of ARCADE_HEDGES) {
    if (far) { p.box(h0, 0, .1, h1, 1.0, 1.15, C.hedge, ['bottom']); continue; }
    const n = Math.max(1, Math.round((h1 - h0) / (near ? 1.1 : 2.2)));
    for (let i = 0; i < n; i++) { const w = (h1 - h0) / n, x = h0 + w * (i + .5); p.blob([x, .55, .68], [w * .62, .58, .56], C.hedge, C.hedgeShade); }
  }
  // ---- Street tree (multi-stem, broad crown above the pergola) and poles.
  const T = ARCADE_TREE;
  p.cylinder(T.x, 0, T.z, 2.6, T.trunk, C.bark, far ? 4 : 6, .14, false);
  if (!far) for (const [lean, yaw] of [[.42, .5], [.35, 2.4], [.3, 4.2]]) p.orientedBox([T.x + Math.cos(yaw) * .55, 3.3, T.z + Math.sin(yaw) * .35], [.16, 1.9, .16], [Math.sin(yaw) * lean, 0, -Math.cos(yaw) * lean], C.bark);
  const clumps: [number, number, number, number, number, number][] = [[6.0, 6.4, 2.4, 3.5, 2.3, 2.6], [10.4, 7.1, 2.1, 3.4, 2.3, 2.5], [13.9, 6.0, 2.5, 2.6, 1.9, 2.2], [8.2, 4.6, 2.7, 2.6, 1.5, 2.2], [3.6, 5.2, 2.6, 2.1, 1.5, 1.9]];
  for (const [x, y, z, rx, ry, rz] of far ? clumps.slice(0, 2).map(c => [c[0] + 2, c[1], c[2], c[3] * 1.5, c[4], c[5]] as typeof c) : clumps) p.blob([x, y, z], [rx, ry, rz], C.crown, C.crownShade);
  for (const [x, z, r] of ARCADE_POLES) {
    const tall = r > .1;
    p.cylinder(x, 0, z, tall ? 9.6 : 2.9, r, C.pole, far ? 4 : 6, r * .8, true);
    if (far) continue;
    if (tall) { p.box(x - .08, 8.7, z - 1.1, x + .08, 8.85, z + 1.1, C.pole); p.box(x - .25, 7.6, z - .25, x + .25, 8.3, z + .25, C.pole); }
    else p.box(x - .03, 2.35, z - .32, x + .03, 2.8, z + .32, C.sign);
  }
  // ---- Parking lot behind the building, with stalls along the far edge.
  p.flat(K.parking, .012, C.concrete);
  p.flat(K.neighbourLot, .012, C.lot);
  if (!far) {
    const step = near ? 2.7 : 5.4;
    for (let x = 1.5; x < 52; x += step) rect(x - .05, -32.3, x + .05, -27.3, .016, C.stall);
    for (let x = 36; x < 54; x += step) rect(x - .05, -21.4, x + .05, -16.9, .016, C.stall);
    const m = ARCADE_MAILBOX;
    p.box(m.x0, .55, m.z0, m.x1, 1.85, m.z1, C.mailbox, ['bottom']);
    for (const z of [m.z0 + .25, m.z1 - .25]) p.box(m.x0 + .15, 0, z - .05, m.x1 - .15, .55, z + .05, C.pole, ['bottom']);
  }
  // ---- Neighbouring mapped buildings as plain stucco massing with flat roofs.
  const tones = [C.n1, C.n2, C.n3, C.n4, C.n5, C.n6];
  K.neighbours.forEach((n, i) => {
    p.extrude(n.ring, -.35, n.height, tones[i % tones.length]);
    p.flat(n.ring, n.height, C.parapet);
    if (!far) p.extrude(n.ring, n.height, n.height + .35, C.parapet);
  });
}
