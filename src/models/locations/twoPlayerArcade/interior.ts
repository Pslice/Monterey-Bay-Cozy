/** Suite A fit-out, interpreted from the supplied interior photograph (camera at the entrance,
 * looking inland). Cabinet art, signs and posters are abstract color blocks: no game, brand or
 * poster artwork is reproduced. Furniture sizes are typical retail dimensions, not measurements. */
import type { Color } from 'three';
import type { LodLevel } from '../../shared/lod/geometry';
import { ARCADE_HEIGHTS as H, ARCADE_SUITE as S } from '../../../data/twoPlayerArcade';
import { palette, type Painter } from './painter';

export const INTERIOR_COLORS = palette({
  floor: '#86562f', seam: '#6a4124', wallDark: '#2b4541', brick: '#9a4f3f', mortar: '#b9846f', blueWall: '#3e5e98',
  sideWall: '#5a6d8a', front: '#6c7e8c', daylight: '#cfe2ea', cabinet: '#1b1b21', cabinetEdge: '#2c2c34', panel: '#2b4d9c',
  coin: '#3a3a40', coinLight: '#ff5a3c', redCab: '#b2292b', counter: '#18181c', counterTop: '#2b2b30', crt: '#d6ccb4', crtDark: '#2a2a2e',
  tableTop: '#3e3029', metal: '#141414', seat: '#25402f', sign: '#2a58b8', signWhite: '#f3f3f3', frame: '#262321', picture: '#c9c1a6',
  wreath: '#2f6b3a', bow: '#c8302c', posterWhite: '#f1ede2', posterRed: '#c52c2a', posterInk: '#222226', posterBlue: '#2f6dc0', posterGold: '#e0b13a',
  ceiling: '#d9d5cc', grid: '#f1eee7', fluor: '#fbfaf2', bulbGreen: '#5ef07c', bulbRed: '#ff4d4d', bulbWarm: '#ffe08a', wire: '#1f2a20', tinsel: '#c8ccd2',
  doorLeaf: '#4b6555', doorGlass: '#3b4a4b',
});
const C = INTERIOR_COLORS;

/** Furniture layout in suite-local metres, shared with collision so walking matches the view. */
export const ARCADE_LAYOUT = {
  cabinets: { x: S.minX, depth: .98, width: .76, centres: [-2.95, -3.8, -4.65, -5.5, -6.35] },
  redCabinet: { x: S.maxX, z: -2.35, depth: .98, width: .8 },
  table: { x0: 18.2, x1: 19.0, z0: -7.4, z1: -5.0, height: 1.02 },
  stools: [[17.75, -5.35], [17.75, -6.35], [17.75, -7.25], [19.45, -5.35], [19.45, -6.35], [19.45, -7.25], [18.6, -4.55], [20.7, -10.3], [22.1, -10.3]] as const,
  counter: { x0: 19.3, x1: 24.45, z0: S.back, z1: S.back + .62, height: .92 },
  crts: [[19.95, .46, 'crt', '#a8d4ff'], [21.05, .36, 'crtDark', '#7fe0a4'], [22.25, .48, 'crt', '#b9e6ff'], [23.5, .4, 'crt', '#ffd27a']] as const,
} as const;

/** Cabinet 0 is the playable Super Bay Drifters cabinet: ocean marquee, sea screen, white sails. */
const MARQUEES = ['#1f8fd0', '#d83a3a', '#e8c840', '#4aa0e8', '#b060d8'];
const SCREENS = ['#0b4466', '#101a34', '#151f17', '#0c1c3c', '#200c30'];
const SPRITES = [['#ffffff', '#f6f1dc', '#ffd23a'], ['#4af0ff', '#ff6ad5', '#ffffff'], ['#ffd23a', '#54ff6a', '#ffffff'], ['#ff8a2a', '#4ac8ff', '#ffffff'], ['#ff5af0', '#5affc8', '#ffe85a']];

/** Upright cabinet with its back on a side wall. `facing` +1 faces +X, −1 faces −X. */
function cabinet(p: Painter, level: LodLevel, backX: number, zc: number, facing: 1 | -1, body: Color, marquee: string, screen: string, sprites: readonly string[], index: number) {
  const X = (d: number) => backX + facing * d, w = .38, far = level === 'far', near = level === 'near';
  const box = (d0: number, y0: number, z0: number, d1: number, y1: number, z1: number, color: Color) => p.box(X(d0), y0, zc + z0, X(d1), y1, zc + z1, color, ['bottom']);
  const face = facing > 0 ? 'x+' : 'x-';
  const front = (d: number, z0: number, z1: number, y0: number, y1: number, color: Color) => p.wallRect(face, X(d), zc + z0, zc + z1, y0, y1, color);
  box(0, 0, -w, .9, .92, w, body);                       // base and coin door
  box(0, .92, -w, .58, 1.62, w, body);                    // monitor housing
  box(.55, .9, -w + .02, .98, 1.02, w - .02, far ? body : C.panel); // control deck
  box(0, 1.62, -w, .7, 1.86, w, body);                    // marquee box
  if (far) return;
  front(.701, -w + .03, w - .03, 1.65, 1.83, palette({ m: marquee }).m);
  front(.581, -w + .06, w - .06, 1.04, 1.56, palette({ s: screen }).s);
  if (near) {
    front(.901, -.12, .12, .3, .62, C.coin);
    for (const z of [-.05, .05]) front(.905, z - .025, z + .025, .55, .6, C.coinLight);
    // Attract-mode sprites: a few bright blocks, not reproduced game graphics.
    const colors = palette({ a: sprites[0], b: sprites[1], c: sprites[2] });
    if (index === 0) {
      // Super Bay Drifters: three white sails over a sea band (an original motif, not game art).
      front(.584, -.24, .24, 1.06, 1.18, palette({ s: '#1b78a8' }).s);
      for (const [z, y, h] of [[-.14, 1.2, .2], [.02, 1.24, .26], [.16, 1.19, .17]] as const) {
        const d = X(.588), hint = [facing, 0, 0] as const;
        p.tri([d, y, zc + z - .06], [d, y, zc + z + .05], [d, y + h, zc + z], colors.a, hint);
      }
    } else for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      if ((r * 5 + c + index) % 3 === 0) continue;
      const z = -.2 + c * .1, y = 1.42 - r * .08;
      front(.586, z - .03, z + .03, y - .025, y + .025, [colors.a, colors.b, colors.c][(r + c + index) % 3]);
    }
    front(.586, -.05, .05, 1.1, 1.15, colors.c);
    // Joystick and buttons on the control deck.
    p.cylinder(X(.74), 1.02, zc - .15, 1.12, .012, C.metal, 5);
    p.blob([X(.74), 1.14, zc - .15], [.035, .035, .035], C.coinLight);
    for (let i = 0; i < 3; i++) p.cylinder(X(.76 + (i % 2) * .06), 1.02, zc + .02 + i * .07, 1.04, .022, palette({ b: sprites[i % 3] }).b, 6);
    // T-molding edge color on the front corners.
    for (const z of [-w - .005, w + .005]) p.box(X(.0), .0, zc + z - .004, X(.9), .92, zc + z + .004, palette({ m: marquee }).m, ['bottom']);
  } else {
    front(.586, -.15, .15, 1.15, 1.45, palette({ s: sprites[0] }).s);
  }
}

function stool(p: Painter, level: LodLevel, x: number, z: number) {
  if (level === 'far') { p.box(x - .17, 0, z - .17, x + .17, .78, z + .17, C.seat, ['bottom']); return; }
  p.cylinder(x, .72, z, .79, .19, C.seat, level === 'near' ? 10 : 6);
  if (level === 'mid') { p.cylinder(x, 0, z, .72, .03, C.metal, 4, .03, false); p.cylinder(x, 0, z, .03, .18, C.metal, 6); return; }
  for (let i = 0; i < 4; i++) {
    const t = Math.PI / 4 + i * Math.PI / 2, dx = Math.cos(t), dz = Math.sin(t);
    p.orientedBox([x + dx * .15, .36, z + dz * .15], [.03, .74, .03], [dz * .1, 0, -dx * .1], C.metal);
  }
  p.cylinder(x, .27, z, .29, .175, C.metal, 8, .175, false);
}

export function buildInterior(p: Painter, ceiling: Painter, level: LodLevel) {
  const near = level === 'near', far = level === 'far', top = H.upperFloor;
  const { minX: x0, maxX: x1, back: zb, porchWall: zp, storefrontWall: zs, door } = S, xj = S.porch.maxX;
  // ---- Floor: wood laminate running toward the back wall.
  p.flat([[x0, zb], [x1, zb], [x1, zs], [xj, zs], [xj, zp], [x0, zp]], .02, C.floor);
  if (near) for (let x = x0 + .6; x < x1 - .1; x += .6) { const z1 = x > xj ? zs : zp; p.quad([x - .012, .022, zb], [x + .012, .022, zb], [x + .012, .022, z1], [x - .012, .022, z1], C.seam, [0, 1, 0]); }
  // ---- Inward-facing walls.
  p.wallRect('x+', x0, zb, zp, 0, top, C.wallDark);
  p.wallRect('z+', zb, x0, 19.0, 0, top, C.wallDark);
  p.wallRect('z+', zb, 19.0, x1, 1.0, top, C.brick);
  p.wallRect('z+', zb, 19.0, x1, 0, 1.0, C.blueWall);
  p.wallRect('x-', x1, zb, zs, 1.0, top, C.sideWall);
  p.wallRect('x-', x1, zb, zs, 0, 1.0, C.blueWall);
  p.wallRect('z-', zs, xj, x1, 0, .7, C.front); p.wallRect('z-', zs, xj, x1, 2.75, top, C.front);
  for (const [a, b] of [[xj, 18.4], [19.7, 20.8], [24.2, x1]]) p.wallRect('z-', zs, a, b, .7, 2.75, C.front);
  p.wallRect('z-', zs - .01, 18.4, 19.7, .75, 2.75, C.daylight);
  p.wallRect('z-', zs - .01, 20.8, 24.2, .7, 2.75, C.daylight);
  p.wallRect('x+', xj, zp, zs, 0, top, C.front);
  p.wallRect('z-', zp, x0, door.minX, 0, top, C.front);
  p.wallRect('z-', zp, door.minX, door.maxX, door.height, top, C.front);
  p.wallRect('z-', zp, door.maxX, xj, 0, top, C.front);
  // Door leaf swung inward against its hinge, with the shop's small decal.
  p.box(door.maxX - .05, 0, zp - 1.08, door.maxX, door.height - .03, zp - .02, C.doorLeaf);
  if (!far) { p.wallRect('x-', door.maxX - .055, zp - .95, zp - .15, .9, 2.0, C.doorGlass); p.wallRect('x-', door.maxX - .06, zp - .8, zp - .3, 1.55, 1.75, C.signWhite); }
  if (near) for (let y = 1.1; y < top - .05; y += .32) p.wallRect('z+', zb + .004, 19.0, x1, y - .012, y + .012, C.mortar);
  // ---- Cabinets along the left wall and the red cabinet beside the door.
  const L = ARCADE_LAYOUT;
  L.cabinets.centres.forEach((z, i) => cabinet(p, level, x0, z, 1, C.cabinet, MARQUEES[i], SCREENS[i], SPRITES[i], i));
  cabinet(p, level, x1, L.redCabinet.z, -1, C.redCab, '#ffd84a', '#160c26', SPRITES[3], 7);
  // ---- High-top table and stools.
  const t = L.table;
  p.box(t.x0, t.height - .05, t.z0, t.x1, t.height, t.z1, C.tableTop);
  for (const z of [t.z0 + .45, t.z1 - .45]) { p.cylinder((t.x0 + t.x1) / 2, 0, z, t.height - .05, .045, C.metal, far ? 4 : 6, .045, false); if (!far) p.cylinder((t.x0 + t.x1) / 2, 0, z, .03, .26, C.metal, 8); }
  for (const [sx, sz] of L.stools) stool(p, level, sx, sz);
  // ---- Back counter with CRT stations, the blue sign, framed pictures and posters.
  const k = L.counter;
  p.box(k.x0, 0, k.z0, k.x1, k.height - .04, k.z1, C.counter, ['bottom', 'back']);
  p.box(k.x0 - .03, k.height - .04, k.z0, k.x1 + .03, k.height, k.z1 + .04, C.counterTop, ['back']);
  for (const [cx, size, body, glow] of L.crts) {
    const b = palette({ c: '#000000' }).c.copy(C[body as 'crt' | 'crtDark']), z0 = k.z0 + .05, y0 = k.height;
    p.box(cx - size / 2, y0, z0, cx + size / 2, y0 + size * .88, z0 + size * .95, b, ['bottom', 'back']);
    if (!far) p.wallRect('z+', z0 + size * .95 + .004, cx - size * .38, cx + size * .38, y0 + size * .14, y0 + size * .72, palette({ g: glow }).g);
  }
  if (!far) {
    p.wallRect('z+', zb + .01, 19.55, 21.75, 2.2, 2.72, C.sign);
    p.wallRect('z+', zb + .015, 19.55, 21.75, 2.22, 2.34, C.signWhite);
    if (near) for (let i = 0; i < 4; i++) p.wallRect('z+', zb + .015, 19.75 + i * .5, 20.1 + i * .5, 2.42, 2.62, C.signWhite);
    for (const [fx, fy, w, h] of [[22.15, 2.35, .42, .32], [23.0, 2.5, .34, .26], [19.2, 1.75, .3, .36]] as const) {
      p.wallRect('z+', zb + .01, fx - w / 2, fx + w / 2, fy - h / 2, fy + h / 2, C.frame);
      p.wallRect('z+', zb + .015, fx - w / 2 + .04, fx + w / 2 - .04, fy - h / 2 + .04, fy + h / 2 - .04, C.picture);
    }
    // Holiday wreath and the tall Japanese-style poster (abstract blocks only).
    const segs = near ? 12 : 6, wx = 22.7, wy = 1.75;
    for (let i = 0; i < segs; i++) {
      const a0 = i / segs * Math.PI * 2, a1 = (i + 1) / segs * Math.PI * 2, zz = zb + .02;
      p.quad([wx + Math.cos(a0) * .2, wy + Math.sin(a0) * .2, zz], [wx + Math.cos(a1) * .2, wy + Math.sin(a1) * .2, zz], [wx + Math.cos(a1) * .13, wy + Math.sin(a1) * .13, zz], [wx + Math.cos(a0) * .13, wy + Math.sin(a0) * .13, zz], C.wreath, [0, 0, 1]);
    }
    p.wallRect('z+', zb + .025, wx - .05, wx + .05, wy - .26, wy - .16, C.bow);
    p.wallRect('z+', zb + .01, 23.55, 24.45, 1.35, 2.75, C.posterWhite);
    p.wallRect('z+', zb + .015, 23.62, 24.38, 1.4, 1.85, C.posterBlue);
    if (near) {
      p.wallRect('z+', zb + .015, 23.62, 24.38, 1.95, 2.2, C.posterGold);
      for (let i = 0; i < 4; i++) p.wallRect('z+', zb + .02, 23.68 + (i % 2) * .36, 23.98 + (i % 2) * .36, 2.3 + Math.floor(i / 2) * .2, 2.45 + Math.floor(i / 2) * .2, i === 1 ? C.posterRed : C.posterInk);
    }
    // Comic poster on the right wall.
    p.wallRect('x-', x1 - .01, -9.7, -8.9, 1.2, 2.4, C.posterRed);
    p.wallRect('x-', x1 - .015, -9.6, -9.0, 1.3, 1.9, C.posterGold);
  }
  // ---- String lights and tinsel along the tops of the left and back walls.
  const y = 2.7;
  if (near) {
    let n = 0;
    const bulb = (x: number, z: number, face: 'x+' | 'z+') => { const c = [C.bulbGreen, C.bulbRed, C.bulbGreen, C.bulbWarm][n++ % 4]; p.wallRect(face, face === 'x+' ? x : z, (face === 'x+' ? z : x) - .03, (face === 'x+' ? z : x) + .03, y - .045, y + .03, c); };
    for (let z = zb + .2; z < zp - .1; z += .24) bulb(x0 + .03, z, 'x+');
    for (let x = x0 + .2; x < x1 - .1; x += .24) bulb(x, zb + .03, 'z+');
    p.wallRect('x+', x0 + .025, zb, zp, y + .02, y + .035, C.wire);
    p.wallRect('z+', zb + .025, x0, x1, y + .02, y + .035, C.wire);
    p.wallRect('x+', x0 + .02, zb, zp, 2.78, 2.84, C.tinsel);
  } else if (!far) {
    p.wallRect('x+', x0 + .03, zb, zp, y - .03, y + .03, C.bulbGreen);
    p.wallRect('z+', zb + .03, x0, x1, y - .03, y + .03, C.bulbRed);
  }
  // ---- Suspended ceiling: its own batch, shown only for low camera views inside the suite.
  const ring: [number, number][] = [[x0, zb], [x1, zb], [x1, zs], [xj, zs], [xj, zp], [x0, zp]];
  ceiling.flat(ring, H.ceiling, C.ceiling, false);
  if (!far) {
    const g = .015;
    for (let x = x0 + .6; x < x1 - .05; x += .6) { const z1 = x > xj ? zs : zp; ceiling.quad([x - g, H.ceiling - .003, zb], [x + g, H.ceiling - .003, zb], [x + g, H.ceiling - .003, z1], [x - g, H.ceiling - .003, z1], C.grid, [0, -1, 0]); }
    if (near) for (let z = zb + 1.2; z < zs - .05; z += 1.2) { const xa = z > zp ? xj : x0; ceiling.quad([xa, H.ceiling - .004, z - g], [x1, H.ceiling - .004, z - g], [x1, H.ceiling - .004, z + g], [xa, H.ceiling - .004, z + g], C.grid, [0, -1, 0]); }
    for (const [cx, cz] of [[17.4, -8.4], [21.6, -8.4], [21.6, -4.8]]) ceiling.flat([[cx - .3, cz - .6], [cx + .3, cz - .6], [cx + .3, cz + .6], [cx - .3, cz + .6]], H.ceiling - .006, C.fluor, false);
  }
}
