/** Mediterranean-revival stucco shell of 398 Foam Street, from the supplied street, side
 * and parking photographs. The mapped OSM ring owns the plan; window positions are scaled
 * from the photographs against the 54.43 m frontage, and all heights are estimates. */
import type { LodLevel } from '../../shared/lod/geometry';
import { ARCADE_BAYS, ARCADE_FOOTPRINT, ARCADE_HEIGHTS as H, ARCADE_ROOF_CORE as CORE, ARCADE_SUITE as SUITE } from '../../../data/twoPlayerArcade';
import { palette, type P3, type Painter } from './painter';

export const EXTERIOR_COLORS = palette({
  stucco: '#d9a57b', stuccoShade: '#c48d64', soffit: '#cf9a72', trim: '#3f6852', trimDark: '#2e4d3d',
  tile: '#b8623e', tileRib: '#96492d', ridge: '#a2532f', flatRoof: '#8e857b', glass: '#36423f', glassSky: '#5f7479',
  door: '#4b6555', decal: '#efe8dc', decalRed: '#c9473c', decalBlue: '#3d63b0', lamp: '#2a2a28', step: '#bdb3a4', rail: '#33503f',
});
const C = EXTERIOR_COLORS;
type Face = 'z+' | 'z-' | 'x+' | 'x-';

/** Window or door on a facade plane: frame, glazing, muntins and sill thin out by level. */
export function facadeWindow(p: Painter, level: LodLevel, face: Face, plane: number, u0: number, u1: number, y0: number, y1: number, cols = 2, rows = 3, glass = C.glass, sill = true) {
  const s = face === 'z+' || face === 'x+' ? 1 : -1, at = (o: number) => plane + s * o;
  if (level !== 'far') p.wallRect(face, at(.012), u0 - .09, u1 + .09, y0 - .09, y1 + .09, C.trim);
  p.wallRect(face, at(.02), u0, u1, y0, y1, glass);
  if (level === 'far') return;
  const t = level === 'near' ? .045 : .07;
  if (level === 'near' || cols > 1) for (let i = 1; i < cols; i++) { const u = u0 + (u1 - u0) * i / cols; p.wallRect(face, at(.03), u - t / 2, u + t / 2, y0, y1, C.trim); }
  if (level === 'near') for (let j = 1; j < rows; j++) { const y = y0 + (y1 - y0) * j / rows; p.wallRect(face, at(.03), u0, u1, y - t / 2, y + t / 2, C.trim); }
  if (sill) {
    const [a, b] = [u0 - .14, u1 + .14], d = .12;
    if (face[0] === 'z') p.box(a, y0 - .16, plane, b, y0 - .07, plane + s * d, C.trimDark, ['bottom']);
    else p.box(plane, y0 - .16, a, plane + s * d, y0 - .07, b, C.trimDark, ['bottom']);
  }
}

/** Outward hint for an edge of the mapped ring (counter-clockwise test on X/Z). */
function ringEdges(ring: readonly (readonly [number, number])[]) {
  let area = 0; for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a[0] * b[1] - b[0] * a[1]; }
  return ring.map((a, i) => { const b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], hint: P3 = area > 0 ? [dz, 0, -dx] : [-dz, 0, dx]; return { a, b, hint }; });
}
const edges = ringEdges(ARCADE_FOOTPRINT);
/** The Foam Street frontage is authored separately for its porch recesses. */
const isFront = (e: typeof edges[number]) => Math.abs(e.a[1]) < 1e-6 && Math.abs(e.b[1]) < 1e-6;
const faceOf = (e: typeof edges[number]): Face => Math.abs(e.hint[0]) > Math.abs(e.hint[2]) ? (e.hint[0] > 0 ? 'x+' : 'x-') : (e.hint[2] > 0 ? 'z+' : 'z-');

/** Photo-scaled openings on the Foam Street frontage, local X metres. */
const FRONT = {
  lower: [
    [0.7, 2.1, .6, 3.0, 2, 5], [3.1, 6.5, .75, 3.0, 1, 1], [7.7, 8.8, .75, 3.0, 2, 4],
    [18.4, 19.7, .75, 3.0, 2, 4],
    [28.6, 29.5, .6, 3.0, 1, 6], [29.5, 33.0, .75, 3.0, 1, 1], [33.0, 34.3, .75, 3.0, 2, 4],
    [47.3, 48.6, .75, 3.0, 2, 4], [48.6, 52.1, .75, 3.0, 1, 1], [52.1, 53.0, .6, 3.0, 1, 6],
  ],
  upper: [
    [1.4, 2.5, 4.3, 5.9, 2, 4], [2.6, 4.2, 4.3, 5.9, 1, 1], [4.3, 5.4, 4.3, 5.9, 2, 4],
    [11.2, 12.6, 4.4, 5.9, 2, 3], [14.8, 16.2, 4.4, 5.9, 2, 3],
    [18.4, 19.7, 4.3, 5.9, 2, 4], [21.4, 22.6, 4.3, 5.9, 2, 4], [22.7, 24.6, 4.3, 5.9, 1, 1], [24.7, 25.8, 4.3, 5.9, 2, 4],
    [28.8, 30.0, 4.3, 5.9, 2, 4], [30.1, 32.2, 4.3, 5.9, 1, 1], [32.3, 33.4, 4.3, 5.9, 2, 4],
    [38.0, 39.6, 4.5, 6.1, 2, 3], [42.0, 43.6, 4.5, 6.1, 2, 3],
    [48.2, 49.3, 4.3, 5.9, 2, 4], [49.4, 51.6, 4.3, 5.9, 1, 1], [51.7, 52.8, 4.3, 5.9, 2, 4],
  ],
  /** Closed neighbouring-suite doors on porch back walls and the right-wing service door. */
  porchDoors: [[10.4, 11.4], [37.5, 38.5], [43.1, 44.1]],
  wingDoor: [25.1, 26.1],
  storefront: [20.8, 24.2, .7, 3.0],
} as const;

export function buildExterior(shell: Painter, upper: Painter, level: LodLevel) {
  const F = ARCADE_FOOTPRINT, near = level === 'near', far = level === 'far';
  // ---- Mapped walls: ground storey in the always-visible shell, upper storey in the cutaway batch.
  for (const e of edges) {
    if (isFront(e)) continue;
    shell.quad([e.a[0], -.35, e.a[1]], [e.b[0], -.35, e.b[1]], [e.b[0], H.upperFloor, e.b[1]], [e.a[0], H.upperFloor, e.a[1]], C.stucco, e.hint);
    upper.quad([e.a[0], H.upperFloor, e.a[1]], [e.b[0], H.upperFloor, e.b[1]], [e.b[0], H.eave, e.b[1]], [e.a[0], H.eave, e.a[1]], C.stucco, e.hint);
  }
  // Frontage: solid wall between porch recesses; the upper storey overhangs each porch.
  const porches = ARCADE_BAYS.map(b => b.centre);
  let x = 0;
  for (const [p0, p1] of porches) { shell.wallRect('z+', 0, x, p0, -.35, H.upperFloor, C.stucco); shell.wallRect('z+', 0, p0, p1, 3.45, H.upperFloor, C.stucco); x = p1; }
  shell.wallRect('z+', 0, x, 54.43, -.35, H.upperFloor, C.stucco);
  upper.wallRect('z+', 0, 0, 54.43, H.upperFloor, H.eave, C.stucco);
  const back = SUITE.porchWall;
  for (const [p0, p1] of porches) {
    shell.wallRect('x+', p0, back, 0, -.35, 3.45, C.stuccoShade);
    shell.wallRect('x-', p1, back, 0, -.35, 3.45, C.stuccoShade);
    shell.flat([[p0, back], [p1, back], [p1, 0], [p0, 0]], 3.45, C.soffit, false);
    // Projecting stucco band over the porch, at the pergola line.
    shell.box(p0 - .1, 3.45, -.02, p1 + .1, 4.05, .34, C.stucco, ['back']);
  }
  // Porch back walls. Bay A's right-hand door is the open Suite A entrance; the rest are closed.
  const door = SUITE.door, [a0, a1] = porches[0];
  shell.wallRect('z+', back, a0, door.minX, -.35, 3.45, C.stucco);
  shell.wallRect('z+', back, door.minX, door.maxX, door.height, 3.45, C.stucco);
  shell.wallRect('z+', back, door.maxX, a1, -.35, 3.45, C.stucco);
  shell.wallRect('z+', back, porches[1][0], porches[1][1], -.35, 3.45, C.stucco);
  if (!far) {
    // Open-door casing and threshold.
    shell.box(door.minX - .1, 0, back, door.minX, door.height + .1, back + .06, C.trim);
    shell.box(door.maxX, 0, back, door.maxX + .1, door.height + .1, back + .06, C.trim);
    shell.box(door.minX - .1, door.height, back, door.maxX + .1, door.height + .1, back + .06, C.trim);
  }
  for (const [u0, u1] of FRONT.porchDoors) facadeWindow(shell, level, 'z+', back, u0, u1, .02, 2.25, 1, 3, C.door, false);
  facadeWindow(shell, level, 'z+', 0, FRONT.wingDoor[0], FRONT.wingDoor[1], .02, 2.3, 1, 3, C.door, false);
  for (const [u0, u1, y0, y1, c, r] of FRONT.lower) facadeWindow(shell, level, 'z+', 0, u0, u1, y0, y1, c, r);
  // Suite A storefront with the shop's white decal block (lettering is not modelled).
  const [s0, s1, sy0, sy1] = FRONT.storefront;
  facadeWindow(shell, level, 'z+', 0, s0, s1, sy0, sy1, 1, 1, C.glassSky);
  if (!far) {
    shell.wallRect('z+', .035, 21.55, 23.45, 1.95, 2.35, C.decal);
    shell.wallRect('z+', .04, 21.75, 22.45, 2.05, 2.25, C.decalRed);
    shell.wallRect('z+', .04, 22.55, 23.25, 2.05, 2.25, C.decalBlue);
    shell.wallRect('z+', .035, 21.8, 23.2, 1.7, 1.82, C.decal);
  }
  // Wall sconces beside the doors.
  if (!far) for (const [lx, lz] of [[24.85, 0], [9.75, 0], [36.85, 0], [44.75, 0]]) shell.box(lx - .09, 2.05, lz, lx + .09, 2.4, lz + .16, C.lamp);
  // ---- Green pergola beams with outriggers across both wings of each bay.
  const spans: [number, number][] = [[0, 10.0], [17.4, 37.1], [44.5, 54.43]];
  for (const [p0, p1] of spans) {
    shell.box(p0, 3.4, 0, p1, 3.66, .26, C.trimDark, ['back']);
    if (far) continue;
    const step = near ? .82 : 1.64;
    for (let u = p0 + .3; u < p1 - .1; u += step) shell.box(u - .06, 3.48, 0, u + .06, 3.74, .92, C.trim, ['back']);
    if (near) shell.box(p0, 3.74, .5, p1, 3.82, .58, C.trim);
  }
  // ---- Rear (parking) elevation: windows and doors along every mapped rear wall.
  for (const e of edges) {
    if (isFront(e)) continue;
    const face = faceOf(e), along = face[0] === 'z' ? [e.a[0], e.b[0]] : [e.a[1], e.b[1]], plane = face[0] === 'z' ? e.a[1] : e.a[0];
    const [u0, u1] = [Math.min(...along), Math.max(...along)], length = u1 - u0;
    if (length < 2.8) continue;
    const n = Math.max(1, Math.floor(length / 3.4));
    for (let i = 0; i < n; i++) {
      const c = u0 + length * (i + .5) / n, w = Math.min(1.5, length / n - .9);
      const ground = (i + Math.round(u0)) % 3 === 1 && face === 'z-';
      if (ground) facadeWindow(shell, level, face, plane, c - .5, c + .5, .02, 2.25, 1, 3, C.door, false);
      else facadeWindow(shell, level, face, plane, c - w / 2, c + w / 2, 1.0, 2.5, 2, 2);
      facadeWindow(upper, level, face, plane, c - w / 2, c + w / 2, 4.35, 5.85, 2, 3);
    }
  }
  // ---- Exterior stair and balcony on the parking side (rear photograph).
  const stair = ARCADE_STAIR;
  const steps = near ? 20 : level === 'mid' ? 10 : 4, rise = H.upperFloor / steps, run = (stair.topX - stair.footX) / steps;
  for (let i = 0; i < steps; i++) shell.box(stair.footX + i * run, 0, stair.z0, stair.footX + (i + 1) * run + .02, (i + 1) * rise, stair.z1, C.step, ['bottom']);
  shell.box(stair.topX, H.upperFloor - .15, stair.z0, stair.landingX, H.upperFloor, -12.68, C.step);
  shell.box(stair.landingX - .01, H.upperFloor - .15, -14.2, 34.0, H.upperFloor, -12.68, C.step);
  if (!far) {
    for (const z of [stair.z0 + .04]) {
      const rail = (x0: number, y0: number, x1: number, y1: number) => { const len = Math.hypot(x1 - x0, y1 - y0); shell.orientedBox([(x0 + x1) / 2, (y0 + y1) / 2, z], [len, .06, .06], [0, 0, Math.atan2(y1 - y0, x1 - x0)], C.rail); };
      rail(stair.footX, .95, stair.topX, H.upperFloor + .95);
      rail(stair.topX, H.upperFloor + .95, stair.landingX, H.upperFloor + .95);
    }
    shell.box(stair.landingX, H.upperFloor + .9, -14.24, 34.0, H.upperFloor + 1.0, -14.16, C.rail);
    const posts = near ? 14 : 5;
    for (let i = 0; i <= posts; i++) { const px = stair.landingX + (34.0 - stair.landingX) * i / posts; shell.box(px - .03, H.upperFloor, -14.24, px + .03, H.upperFloor + .95, -14.16, C.rail); }
    for (const [px, pz] of [[stair.landingX, -14.2], [34.0, -14.2], [stair.topX, stair.z0 + .04], [stair.landingX, stair.z0 + .04]] as const) shell.box(px - .08, 0, pz - .08, px + .08, H.upperFloor, pz + .08, C.rail);
  }
  // ---- Second-floor cap: closes the shell when the cutaway hides the upper storey, leaving
  // only Suite A open. Never visible while the upper storey is shown.
  const hole: [number, number][] = [[SUITE.minX - .2, SUITE.back], [SUITE.maxX + .2, SUITE.back], [SUITE.maxX + .2, -.1], [SUITE.minX - .2, -.1]];
  shell.flat(F, H.upperFloor, C.flatRoof, true, [hole]);

  // ---- Roofs (cutaway batch). Shared low hip over the mapped core; flat caps over rear wings.
  const o = .45, x0 = CORE.minX - o, x1 = CORE.maxX + o, z0 = CORE.minZ - o, z1 = CORE.maxZ + o, e = H.eave, r = H.hipRise;
  const d = z1 - z0, zm = (z0 + z1) / 2, rx0 = x0 + d / 2, rx1 = x1 - d / 2;
  upper.quad([x0, e, z1], [x1, e, z1], [rx1, e + r, zm], [rx0, e + r, zm], C.tile, [0, 1, 1]);
  upper.quad([x1, e, z0], [x0, e, z0], [rx0, e + r, zm], [rx1, e + r, zm], C.tile, [0, 1, -1]);
  upper.tri([x0, e, z0], [x0, e, z1], [rx0, e + r, zm], C.tile, [-1, 1, 0]);
  upper.tri([x1, e, z1], [x1, e, z0], [rx1, e + r, zm], C.tile, [1, 1, 0]);
  upper.flat([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], e - .002, C.soffit, false);
  if (!far) {
    upper.box(x0, e - .16, z1 - .08, x1, e, z1, C.trim);
    upper.box(x0, e - .16, z0, x1, e, z0 + .08, C.trim);
    upper.box(rx0, e + r - .04, zm - .1, rx1, e + r + .1, zm + .1, C.ridge);
    // Barrel-tile courses: raised ribs down both main slopes.
    const step = near ? .42 : 1.26;
    for (const side of [1, -1]) {
      const eaveZ = side > 0 ? z1 : z0, lift = .03;
      for (let u = rx0 + step / 2; u < rx1; u += step) {
        const w = .045;
        upper.quad([u - w, e + lift, eaveZ], [u + w, e + lift, eaveZ], [u + w, e + r + lift, zm], [u - w, e + r + lift, zm], C.tileRib, [0, 1, side]);
      }
    }
  }
  for (const wing of REAR_WINGS) {
    upper.flat(wing, e - .01, C.flatRoof, true);
    if (!far) upper.extrude(wing, e - .01, e + .11, C.stucco);
  }
  // Cross gables at each bay centre: front-facing, steeper than the hip, ridge slightly above it.
  for (const [g0, g1] of porches) {
    const xc = (g0 + g1) / 2, hw = (g1 - g0) / 2, ov = .35, zf = .55, zb = zm, yr = H.gableRidge;
    upper.quad([g0 - ov, e - .05, zf], [xc, yr, zf], [xc, yr, zb], [g0 - ov, e - .05, zb], C.tile, [-1, 1, 0]);
    upper.quad([xc, yr, zf], [g1 + ov, e - .05, zf], [g1 + ov, e - .05, zb], [xc, yr, zb], C.tile, [1, 1, 0]);
    upper.tri([g0, e, .005], [g1, e, .005], [xc, yr - .12, .005], C.stucco, [0, 0, 1]);
    // Underside of the front overhang; the stucco gable face stays visible behind it.
    upper.quad([g0 - ov, e - .07, zf], [xc, yr - .02, zf], [xc, yr - .02, 0], [g0 - ov, e - .07, 0], C.soffit, [1, -1, 0]);
    upper.quad([xc, yr - .02, zf], [g1 + ov, e - .07, zf], [g1 + ov, e - .07, 0], [xc, yr - .02, 0], C.soffit, [-1, -1, 0]);
    if (far) continue;
    const slope = Math.atan2(yr - e, hw + ov), len = Math.hypot(hw + ov, yr - e);
    for (const s of [-1, 1]) upper.orientedBox([xc + s * (hw + ov) / 2, (e + yr) / 2 + .02, zf - .05], [len, .16, .12], [0, 0, -s * slope], C.trim);
    upper.box(xc - .09, yr - .04, zb, xc + .09, yr + .08, zf, C.ridge);
    // Barrel courses run down-slope, from the ridge to each rake eave.
    if (near) for (let z = zf - .2; z > -2.6; z -= .42) for (const s of [-1, 1]) {
      const ex = xc + s * (hw + ov);
      upper.quad([xc, yr + .03, z - .045], [xc, yr + .03, z + .045], [ex, e - .02, z + .045], [ex, e - .02, z - .045], C.tileRib, [s, 1.2, 0]);
    }
  }
  // Upper storey windows, including the end walls (rear windows are placed above).
  for (const [u0, u1, y0, y1, c, rr] of FRONT.upper) facadeWindow(upper, level, 'z+', 0, u0, u1, y0, y1, c, rr);
  return { stair };
}

/** Flat-roofed rear wings outside the shared hip-roof core. */
export const REAR_WINGS: readonly (readonly [number, number])[][] = [
  [[5.85, -14.4], [12.72, -14.4], [12.72, -12.5], [5.85, -12.5]],
  [[12.72, -17.98], [16.49, -17.99], [16.5, -17.29], [16.49, -15.1], [16.49, -12.5], [12.72, -12.5]],
  [[16.49, -15.1], [26.19, -15.1], [26.2, -12.68], [26.2, -12.5], [16.49, -12.5]],
  [[34.2, -16.55], [42.23, -16.54], [42.23, -14.71], [42.23, -12.5], [34.21, -12.5], [34.21, -14.66]],
  [[42.23, -14.71], [49.61, -14.71], [49.61, -13.92], [54.43, -13.92], [54.43, -12.5], [42.23, -12.5]],
];

/** Exterior stair climbing west-to-east along the rear wall to the balcony (rear photograph). */
export const ARCADE_STAIR = { footX: 19.6, topX: 26.3, landingX: 27.4, z0: -16.35, z1: -15.15 } as const;
