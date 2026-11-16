/** Suite A as its own interior screen. Same local frame and fit-out as the exterior site's
 * interior batch, plus an always-on ceiling and a daylit doorway with porch pavers so the
 * exit reads clearly. One toon batch with authored Near/Mid/Far variants; no textures. */
import { Group, Mesh } from 'three';
import { createToonMaterial } from '../../shared/style';
import { defineGeometryLods, type LodLevel } from '../../shared/lod/geometry';
import { disposeObject } from '../../props/primitives';
import { ARCADE_SUITE as S } from '../../../data/twoPlayerArcade';
import { createPainter, palette } from './painter';
import { buildInterior } from './interior';

export const ARCADE_ROOM_BUDGET = { near: 3200, mid: 1400, far: 700, draws: 1, imageTextures: 0 } as const;
const C = palette({ daylight: '#f6edd2', paver: '#b46f4e', casing: '#3f6852', stucco: '#d9a57b' });

function buildRoom(level: LodLevel) {
  const p = createPainter();
  buildInterior(p, p, level);
  // Daylit porch seen through the open door: back wall, pavers and the door casing.
  const { door, porchWall: zp } = S;
  p.wallRect('z-', zp + 1.1, door.minX - .5, door.maxX + .5, -.05, door.height + .4, C.daylight);
  p.flat([[door.minX - .5, zp], [door.maxX + .5, zp], [door.maxX + .5, zp + 1.1], [door.minX - .5, zp + 1.1]], .03, C.paver);
  for (const x of [door.minX - .5, door.maxX + .5]) p.wallRect(x < door.minX ? 'x+' : 'x-', x, zp, zp + 1.1, -.05, door.height + .4, C.stucco);
  if (level !== 'far') {
    p.box(door.minX - .1, 0, zp - .06, door.minX, door.height + .1, zp, C.casing);
    p.box(door.maxX, 0, zp - .06, door.maxX + .1, door.height + .1, zp, C.casing);
    p.box(door.minX - .1, door.height, zp - .06, door.maxX + .1, door.height + .1, zp, C.casing);
  }
  return p.finish(`two-player-arcade-room-${level}`);
}

export function createArcadeRoom() {
  const root = new Group(); root.name = '2 Player Arcade · Suite A interior screen';
  const geometry = buildRoom('near');
  defineGeometryLods(geometry, () => ({ mid: buildRoom('mid'), far: buildRoom('far') }));
  const mesh = new Mesh(geometry, createToonMaterial({ vertexColors: true, rim: false, name: 'two-player-arcade-room' }));
  mesh.name = '2 Player Arcade · Suite A room'; mesh.castShadow = mesh.receiveShadow = true; root.add(mesh);
  root.userData = { assetId: 'two-player-arcade-room', units: 'metres', authoring: 'procedural TypeScript', budget: ARCADE_ROOM_BUDGET };
  let disposed = false;
  return { root, mesh, dispose() { if (disposed) return; disposed = true; disposeObject(root); } };
}
