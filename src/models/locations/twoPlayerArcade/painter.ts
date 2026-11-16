/** Small vertex-colored geometry writer for the arcade location. Every primitive is
 * metre-scale, non-indexed and flat-shaded for the shared toon ramp. Faces take an
 * outward hint so authoring order never produces inside-out surfaces. */
import { BufferGeometry, Color, Euler, Float32BufferAttribute, Matrix4, ShapeUtils, Vector2, Vector3 } from 'three';

export type P3 = readonly [number, number, number];
export type Hint = P3 | undefined;
const a = new Vector3(), b = new Vector3(), n = new Vector3();

export function palette<T extends Record<string, string>>(hex: T) {
  return Object.fromEntries(Object.entries(hex).map(([k, v]) => [k, new Color(v)])) as { [K in keyof T]: Color };
}

export function createPainter() {
  const positions: number[] = [], colors: number[] = [];
  function tri(p0: P3, p1: P3, p2: P3, color: Color, hint?: Hint) {
    if (hint) {
      a.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); b.set(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]);
      n.crossVectors(a, b);
      if (n.x * hint[0] + n.y * hint[1] + n.z * hint[2] < 0) [p1, p2] = [p2, p1];
    }
    for (const p of [p0, p1, p2]) { positions.push(p[0], p[1], p[2]); colors.push(color.r, color.g, color.b); }
  }
  function quad(p0: P3, p1: P3, p2: P3, p3: P3, color: Color, hint?: Hint) { tri(p0, p1, p2, color, hint); tri(p0, p2, p3, color, hint); }
  /** Axis-aligned box from two corners. `skip` omits hidden faces (e.g. 'bottom'). */
  function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: Color, skip: readonly ('top' | 'bottom' | 'front' | 'back' | 'left' | 'right')[] = []) {
    const [l, r] = [Math.min(x0, x1), Math.max(x0, x1)], [lo, hi] = [Math.min(y0, y1), Math.max(y0, y1)], [bk, ft] = [Math.min(z0, z1), Math.max(z0, z1)];
    if (!skip.includes('front')) quad([l, lo, ft], [r, lo, ft], [r, hi, ft], [l, hi, ft], color, [0, 0, 1]);
    if (!skip.includes('back')) quad([r, lo, bk], [l, lo, bk], [l, hi, bk], [r, hi, bk], color, [0, 0, -1]);
    if (!skip.includes('left')) quad([l, lo, bk], [l, lo, ft], [l, hi, ft], [l, hi, bk], color, [-1, 0, 0]);
    if (!skip.includes('right')) quad([r, lo, ft], [r, lo, bk], [r, hi, bk], [r, hi, ft], color, [1, 0, 0]);
    if (!skip.includes('top')) quad([l, hi, ft], [r, hi, ft], [r, hi, bk], [l, hi, bk], color, [0, 1, 0]);
    if (!skip.includes('bottom')) quad([l, lo, bk], [r, lo, bk], [r, lo, ft], [l, lo, ft], color, [0, -1, 0]);
  }
  /** Box of `size` centred at `centre`, rotated by Euler XYZ radians. */
  function orientedBox(centre: P3, size: P3, rotation: P3, color: Color, skipBottom = false) {
    const m = new Matrix4().makeRotationFromEuler(new Euler(...rotation)).setPosition(...centre);
    const v = (x: number, y: number, z: number): P3 => { const p = new Vector3(x * size[0] / 2, y * size[1] / 2, z * size[2] / 2).applyMatrix4(m); return [p.x, p.y, p.z]; };
    const dir = (x: number, y: number, z: number): P3 => { const p = new Vector3(x, y, z).applyEuler(new Euler(...rotation)); return [p.x, p.y, p.z]; };
    quad(v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1), color, dir(0, 0, 1));
    quad(v(1, -1, -1), v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1), color, dir(0, 0, -1));
    quad(v(-1, -1, -1), v(-1, -1, 1), v(-1, 1, 1), v(-1, 1, -1), color, dir(-1, 0, 0));
    quad(v(1, -1, 1), v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), color, dir(1, 0, 0));
    quad(v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1), v(-1, 1, -1), color, dir(0, 1, 0));
    if (!skipBottom) quad(v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1), color, dir(0, -1, 0));
  }
  /** Rectangle on a vertical plane facing ±X/±Z. `u` is the actual X (Z planes) or Z (X planes). */
  function wallRect(normal: 'x+' | 'x-' | 'z+' | 'z-', plane: number, u0: number, u1: number, y0: number, y1: number, color: Color) {
    const p = (u: number, y: number): P3 => normal[0] === 'z' ? [u, y, plane] : [plane, y, u];
    const h: P3 = normal === 'z+' ? [0, 0, 1] : normal === 'z-' ? [0, 0, -1] : normal === 'x+' ? [1, 0, 0] : [-1, 0, 0];
    quad(p(u0, y0), p(u1, y0), p(u1, y1), p(u0, y1), color, h);
  }
  /** Horizontal polygon (X/Z ring) at height y, facing up or down. */
  function flat(ring: readonly (readonly [number, number])[], y: number, color: Color, up = true, holes: readonly (readonly (readonly [number, number])[])[] = []) {
    const all = [ring, ...holes].flat();
    const faces = ShapeUtils.triangulateShape(ring.map(p => new Vector2(p[0], p[1])), holes.map(h => h.map(p => new Vector2(p[0], p[1]))));
    for (const f of faces) tri([all[f[0]][0], y, all[f[0]][1]], [all[f[1]][0], y, all[f[1]][1]], [all[f[2]][0], y, all[f[2]][1]], color, [0, up ? 1 : -1, 0]);
  }
  /** Vertical walls around a closed X/Z ring, outward-facing. */
  function extrude(ring: readonly (readonly [number, number])[], y0: number, y1: number, color: Color, inward = false) {
    let area = 0; for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; area += p[0] * q[1] - q[0] * p[1]; }
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], q = ring[(i + 1) % ring.length], dx = q[0] - p[0], dz = q[1] - p[1];
      // Outward side of a CCW (positive-area) X/Z ring is (dz, -dx).
      let hx = area > 0 ? dz : -dz, hz = area > 0 ? -dx : dx;
      if (!Number.isFinite(hx + hz) || (hx === 0 && hz === 0)) { hx = (p[0] + q[0]) / 2 - cx; hz = (p[1] + q[1]) / 2 - cz; }
      if (inward) { hx = -hx; hz = -hz; }
      quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], color, [hx, 0, hz]);
    }
  }
  /** Low-segment vertical cylinder (or frustum) for posts, stool seats and trunks. */
  function cylinder(x: number, y0: number, z: number, y1: number, r0: number, color: Color, segments = 8, r1 = r0, caps = true) {
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments * Math.PI * 2, t1 = (i + 1) / segments * Math.PI * 2, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      quad([x + c0 * r0, y0, z + s0 * r0], [x + c1 * r0, y0, z + s1 * r0], [x + c1 * r1, y1, z + s1 * r1], [x + c0 * r1, y1, z + s0 * r1], color, [(c0 + c1) / 2, 0, (s0 + s1) / 2]);
      if (caps) tri([x, y1, z], [x + c0 * r1, y1, z + s0 * r1], [x + c1 * r1, y1, z + s1 * r1], color, [0, 1, 0]);
    }
  }
  /** Faceted ellipsoid (octahedron subdivided once) for hedges and canopy clumps. */
  function blob(centre: P3, radii: P3, color: Color, shade?: Color) {
    const base: P3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const faces = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]];
    const mid = (p: P3, q: P3): P3 => { const v = new Vector3(p[0] + q[0], p[1] + q[1], p[2] + q[2]).normalize(); return [v.x, v.y, v.z]; };
    const place = (p: P3): P3 => [centre[0] + p[0] * radii[0], centre[1] + p[1] * radii[1], centre[2] + p[2] * radii[2]];
    for (const [i, j, k] of faces) {
      const A = base[i], B = base[j], C = base[k], ab = mid(A, B), bc = mid(B, C), ca = mid(C, A);
      for (const t of [[A, ab, ca], [ab, B, bc], [ca, bc, C], [ab, bc, ca]] as P3[][]) {
        const c = shade && (t[0][1] + t[1][1] + t[2][1]) < -.4 ? shade : color;
        const h: P3 = [(t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3, (t[0][2] + t[1][2] + t[2][2]) / 3];
        tri(place(t[0]), place(t[1]), place(t[2]), c, h);
      }
    }
  }
  function finish(name: string) {
    const geometry = new BufferGeometry(); geometry.name = name;
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return geometry;
  }
  return { tri, quad, box, orientedBox, wallRect, flat, extrude, cylinder, blob, finish, get triangles() { return positions.length / 9; } };
}
export type Painter = ReturnType<typeof createPainter>;
