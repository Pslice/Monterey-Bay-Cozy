import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Mesh, MeshToonMaterial, Vector3 } from 'three';
import { ARCADE_FOOTPRINT, ARCADE_SITE, ARCADE_SOURCE, ARCADE_SUITE, arcadeToLocal, arcadeToWorld } from '../src/data/twoPlayerArcade';
import { ARCADE_BUDGET, ARCADE_LAYOUT, createTwoPlayerArcade } from '../src/models/locations/twoPlayerArcade';
import { createArcadeSite } from '../src/viewer/testingGym/arcade';
import { canStandAt, insidePolygon } from '../src/viewer/avatarController';
import { prepareGeometryLods, triangles, LOD_LEVELS } from '../src/models/shared/lod/geometry';

const R = 6371008.8 * Math.PI / 180, ORIGIN = [-121.91685, 36.6256] as const;
const toGym = (lon: number, lat: number) => [(lon - ORIGIN[0]) * R * Math.cos(ORIGIN[1] * Math.PI / 180), -(lat - ORIGIN[1]) * R];
const close = (a: number, b: number, tolerance: number, label: string) => assert(Math.abs(a - b) <= tolerance, `${label}: ${a} vs ${b}`);

test('398 Foam Street uses the mapped OSM building at the Drake corner, in a proper (unreflected) local frame', () => {
  assert.equal(ARCADE_SOURCE.building, 'way/238105015');
  // The geocoded address point must land on this building's frontage, not a neighbour.
  const geocode = toGym(-121.898933, 36.611855), [lx, lz] = arcadeToLocal(geocode[0], geocode[1]);
  assert(lx > 8 && lx < 12 && lz > -3 && lz < .5, `Nominatim's 398 Foam point falls at bay A's porch: ${lx}, ${lz}`);
  const { along, front } = ARCADE_SITE;
  close(Math.hypot(...along), 1, 1e-5, 'along unit'); close(Math.hypot(...front), 1, 1e-5, 'front unit');
  close(along[0] * front[0] + along[1] * front[1], 0, 1e-5, 'orthogonal');
  close(along[0] * front[1] - along[1] * front[0], 1, 1e-5, 'right-handed rotation, no reflection');
  // The Three yaw must map local +X/+Z to the same basis the data uses.
  const yaw = ARCADE_SITE.yaw;
  close(Math.cos(yaw), along[0], 1e-5, 'yaw x'); close(-Math.sin(yaw), along[1], 1e-5, 'yaw z');
  for (const [x, z] of [[0, 0], [54.43, -13.92], [-20, 30]] as const) { const w = arcadeToWorld(x, z), back = arcadeToLocal(w[0], w[1]); close(back[0], x, 1e-3, 'round trip x (1 mm)'); close(back[1], z, 1e-3, 'round trip z (1 mm)'); }
  const xs = ARCADE_FOOTPRINT.map(p => p[0]), zs = ARCADE_FOOTPRINT.map(p => p[1]);
  close(Math.max(...xs) - Math.min(...xs), 54.43, .01, 'mapped Foam Street frontage');
  assert(Math.min(...zs) < -17.9 && Math.max(...zs) === 0, 'building lies behind the facade plane');
});

test('arcade factory stays metre-scale, unscaled, toon-only and within its per-level budget', async () => {
  const arcade = createTwoPlayerArcade();
  assert.deepEqual(arcade.root.scale.toArray(), [1, 1, 1]);
  const meshes = Object.values(arcade.meshes);
  assert.equal(meshes.length, ARCADE_BUDGET.draws);
  const totals = { near: 0, mid: 0, far: 0 };
  for (const mesh of meshes) {
    assert(mesh.material instanceof MeshToonMaterial, `${mesh.name} uses the shared toon path`);
    assert.equal((mesh.material as MeshToonMaterial).map, null, 'no image textures');
    const lods = await prepareGeometryLods(mesh.geometry);
    for (const level of LOD_LEVELS) {
      const p = lods[level].attributes.position.array;
      for (let i = 0; i < p.length; i++) assert(Number.isFinite(p[i]), `${mesh.name} ${level} finite`);
      totals[level] += triangles(lods[level]);
    }
    assert(triangles(lods.mid) <= triangles(lods.near) && triangles(lods.far) <= triangles(lods.mid), `${mesh.name} reduces with distance`);
  }
  assert(totals.near <= ARCADE_BUDGET.near && totals.mid <= ARCADE_BUDGET.mid && totals.far <= ARCADE_BUDGET.far, JSON.stringify(totals));
  // Building silhouette: two storeys, gable ridge, mapped plan extent.
  const box = new Box3().setFromObject(arcade.meshes.upper);
  close(box.max.y, 9.1, .15, 'gable ridge height'); assert(box.min.x < 0 && box.max.x > 54.43, 'roof overhangs the mapped ends');
  const interior = new Box3().setFromObject(arcade.meshes.interior);
  assert(interior.min.x >= ARCADE_SUITE.minX - 1e-6 && interior.max.x <= ARCADE_SUITE.maxX + 1e-6 && interior.min.z >= ARCADE_SUITE.back - 1e-6, 'fit-out stays inside Suite A');
  arcade.dispose();
});

test('cutaway hides only the upper storey; the ceiling returns for eye-level views', () => {
  const arcade = createTwoPlayerArcade();
  assert(arcade.meshes.upper.visible && arcade.meshes.ceiling.visible);
  arcade.setView('inside');
  assert(!arcade.meshes.upper.visible && !arcade.meshes.ceiling.visible && arcade.meshes.shell.visible && arcade.meshes.interior.visible);
  arcade.setView('inside', true);
  assert(arcade.meshes.ceiling.visible && !arcade.meshes.upper.visible);
  arcade.setView('exterior');
  assert(arcade.meshes.upper.visible);
  assert(arcade.insideSuite(20, -5) && arcade.insideSuite(20, -.5) && !arcade.insideSuite(16, -.5) && !arcade.insideSuite(30, -5));
  arcade.dispose();
});

test('walking region: open Suite A door, solid neighbouring suites and furniture that matches the view', () => {
  const site = createArcadeSite(), r = .3;
  const stand = (x: number, z: number) => { const [wx, wz] = arcadeToWorld(x, z); return canStandAt(wx, wz, site.bounds, site.colliders, r); };
  // Arrival points are clear.
  for (const p of [site.entrance, site.inside, site.street]) assert(canStandAt(p.x, p.z, site.bounds, site.colliders, r), `spawn ${p.toArray()}`);
  // A straight route from the sidewalk through the porch and door to the table.
  for (let z = 3; z >= -4.2; z -= .1) assert(stand(16.5, z), `door route blocked at z=${z.toFixed(2)}`);
  // Walls either side of the door, the closed neighbouring porch doors and the storefront.
  for (const [x, z] of [[15.3, -1.4], [17.25, -1.4], [11, -2], [40, -2], [21, -.1], [30, -6], [5, -6]]) assert(!stand(x, z), `solid at ${x}, ${z}`);
  // Furniture.
  assert(!stand(ARCADE_SUITE.minX + .5, ARCADE_LAYOUT.cabinets.centres[2]), 'cabinet row');
  assert(!stand((ARCADE_LAYOUT.table.x0 + ARCADE_LAYOUT.table.x1) / 2, -6.2), 'table');
  assert(!stand(21.8, ARCADE_SUITE.back + .3), 'counter');
  // Pad edge and interior points are classified consistently.
  assert(site.contains(site.inside.x, site.inside.z) && site.insideSuiteAt(site.inside.x, site.inside.z));
  assert(!site.insideSuiteAt(site.street.x, site.street.z));
  const [fx, fz] = arcadeToWorld(200, 0); assert.equal(site.floorAt(fx, fz), undefined);
  assert.equal(site.floorAt(site.inside.x, site.inside.z), ARCADE_SITE.floorY);
  for (const p of site.bounds.walkable!) assert(insidePolygon(p[0], p[1], site.regionFootprint) || site.regionFootprint.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 2));
  // Interactions sit on reachable floor.
  for (const item of site.interactions) {
    const near = [0, .5, 1, 1.4].some(d => [0, 1, 2, 3, 4, 5, 6, 7].some(k => canStandAt(item.position.x + Math.cos(k * Math.PI / 4) * d, item.position.z + Math.sin(k * Math.PI / 4) * d, site.bounds, site.colliders, r)));
    assert(near, `${item.id} reachable`);
  }
  // Placement: the model root carries only the site translation and yaw.
  assert.deepEqual(site.root.scale.toArray(), [1, 1, 1]);
  const corner = new Vector3(0, 0, 0).applyMatrix4(site.root.matrixWorld), [cx, cz] = arcadeToWorld(0, 0);
  close(corner.x, cx, 1e-6, 'anchor x'); close(corner.z, cz, 1e-6, 'anchor z');
  const far = new Vector3(54.43, 0, 0).applyMatrix4(site.root.matrixWorld), [ex, ez] = arcadeToWorld(54.43, 0);
  close(far.x, ex, 1e-4, 'frontage end x'); close(far.z, ez, 1e-4, 'frontage end z');
  site.dispose();
});

test('dispose releases every arcade geometry and the shared material once', () => {
  const arcade = createTwoPlayerArcade();
  let geometries = 0, materials = 0;
  const seen = new Set();
  arcade.root.traverse(o => { if (o instanceof Mesh) { o.geometry.addEventListener('dispose', () => geometries++); if (!seen.has(o.material)) { seen.add(o.material); (o.material as MeshToonMaterial).addEventListener('dispose', () => materials++); } } });
  arcade.dispose(); arcade.dispose();
  assert.equal(geometries, 5); assert.equal(materials, 1);
  assert.equal(arcade.root.parent, null);
});

test('doorway thresholds swap screens with hysteresis, never both at once', async () => {
  const site = createArcadeSite(), S = ARCADE_SUITE, mid = (S.door.minX + S.door.maxX) / 2;
  const at = (z: number) => arcadeToWorld(mid, z);
  for (let z = 2; z >= -4; z -= .05) {
    const [x, wz] = at(z), into = site.crossedIn(x, wz), out = site.crossedOut(x, wz);
    assert(!(into && out), `both triggers at z=${z.toFixed(2)}`);
  }
  // A dead band either side of the door plane prevents flicker.
  for (const z of [S.porchWall - .2, S.porchWall, S.porchWall + .1]) { const [x, wz] = at(z); assert(!site.crossedIn(x, wz) && !site.crossedOut(x, wz), `dead band ${z}`); }
  assert(site.crossedIn(...at(S.porchWall - .5)) && site.crossedOut(...at(S.porchWall + .5)));
  // Arrival points sit on the correct side of their trigger, so arriving never bounces back.
  assert(!site.crossedOut(site.doorInside.x, site.doorInside.z) && site.crossedIn(site.doorInside.x, site.doorInside.z));
  assert(!site.crossedIn(site.porch.x, site.porch.z) && site.crossedOut(site.porch.x, site.porch.z));
  const r = .3; for (const p of [site.doorInside, site.porch]) assert(canStandAt(p.x, p.z, site.bounds, site.colliders, r), `arrival ${p.toArray()}`);
  assert(site.interactions.some(i => i.action === 'enter'), 'enter prompt at the porch door');
  site.dispose();
});

test('Suite A interior screen: own scene at the real location, one budgeted batch, playable cabinet prompt', async () => {
  const { createArcadeRoom, ARCADE_ROOM_BUDGET } = await import('../src/models/locations/twoPlayerArcade/room');
  const { createArcadeRoomScreen } = await import('../src/viewer/testingGym/arcadeRoom');
  const { ARCADE_GAMES } = await import('../src/data/twoPlayerArcade');
  const room = createArcadeRoom(), lods = await prepareGeometryLods(room.mesh.geometry);
  assert(triangles(lods.near) <= ARCADE_ROOM_BUDGET.near && triangles(lods.mid) <= ARCADE_ROOM_BUDGET.mid && triangles(lods.far) <= ARCADE_ROOM_BUDGET.far, `${triangles(lods.near)} / ${triangles(lods.mid)} / ${triangles(lods.far)}`);
  assert(room.mesh.material instanceof MeshToonMaterial); room.dispose();
  const site = createArcadeSite(), screen = createArcadeRoomScreen(site, false);
  assert.notEqual(screen.scene, site.root.parent, 'interior renders in its own scene');
  close(screen.root.position.distanceTo(site.root.position), 0, 1e-9, 'same world transform as the site');
  close(screen.root.rotation.y, site.root.rotation.y, 1e-9, 'same yaw');
  assert.equal(ARCADE_GAMES[0].name, 'Super Bay Drifters');
  assert.match(ARCADE_GAMES[0].url, /^https:\/\/montereybaygames\.com\/play\/super-bay-drifters\/index\.html/);
  const play = screen.interactions.find(i => i.action === 'play')!, leave = screen.interactions.find(i => i.action === 'exit')!;
  assert.equal(play.id, 'super-bay-drifters');
  const r = .3, reachable = (p: Vector3, radius: number) => [0, .3, .6, .9].some(d => [0, 1, 2, 3, 4, 5, 6, 7].some(k => { const x = p.x + Math.cos(k * Math.PI / 4) * d, z = p.z + Math.sin(k * Math.PI / 4) * d; return Math.hypot(x - p.x, z - p.z) <= radius && canStandAt(x, z, site.bounds, site.colliders, r) && site.insideSuiteAt(x, z); }));
  for (const item of screen.interactions) assert(reachable(item.position, item.radius), `${item.id} reachable from inside the suite`);
  assert(site.insideSuiteAt(leave.position.x, leave.position.z));
  screen.dispose(); site.dispose();
});
