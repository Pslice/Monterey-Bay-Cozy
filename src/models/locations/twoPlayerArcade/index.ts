/** 2 Player Arcade · 398 Foam Street Suite A, Monterey. Procedural location factory.
 *
 * Geometry is authored in the building's local frame (see `src/data/twoPlayerArcade.ts`):
 * metres, +X along the Foam Street frontage, +Z toward the street, floor at Y = 0. The root is
 * unscaled; a placement adapter supplies one translation and yaw. Five static batches share
 * one toon material, and each has authored Near/Mid/Far variants for the shared LOD controller:
 *
 *   site      level pad, streets, lot, planting, neighbouring massing
 *   shell     ground storey, porches, pergolas, rear stair and the second-floor cap
 *   upper     upper storey, hip roof and cross gables (hidden by the interior cutaway)
 *   interior  Suite A walls, floor and fit-out
 *   ceiling   Suite A suspended ceiling (shown inside only for low camera views)
 */
import { Group, Mesh } from 'three';
import { createToonMaterial } from '../../shared/style';
import { defineGeometryLods, type LodLevel } from '../../shared/lod/geometry';
import { disposeObject } from '../../props/primitives';
import { ARCADE_HEIGHTS, ARCADE_SOURCE, ARCADE_SUITE } from '../../../data/twoPlayerArcade';
import { createPainter } from './painter';
import { buildExterior } from './exterior';
import { buildInterior } from './interior';
import { buildSite } from './site';

export { ARCADE_LAYOUT } from './interior';
export { ARCADE_STAIR, REAR_WINGS } from './exterior';
export { ARCADE_HEDGES, ARCADE_MAILBOX, ARCADE_POLES, ARCADE_TREE } from './site';

/** Whole-site ceiling (Near) and per-level targets; draws are the five batches before culling. */
export const ARCADE_BUDGET = { near: 9000, mid: 5200, far: 1600, draws: 5, imageTextures: 0 } as const;
export type ArcadeView = 'exterior' | 'inside';
const BATCHES = ['site', 'shell', 'upper', 'interior', 'ceiling'] as const;
export type ArcadeBatch = typeof BATCHES[number];

function buildLevel(level: LodLevel) {
  const painters = Object.fromEntries(BATCHES.map(b => [b, createPainter()])) as Record<ArcadeBatch, ReturnType<typeof createPainter>>;
  buildSite(painters.site, level);
  buildExterior(painters.shell, painters.upper, level);
  buildInterior(painters.interior, painters.ceiling, level);
  return Object.fromEntries(BATCHES.map(b => [b, painters[b].finish(`two-player-arcade-${b}-${level}`)])) as Record<ArcadeBatch, ReturnType<ReturnType<typeof createPainter>['finish']>>;
}

export function createTwoPlayerArcade() {
  const root = new Group(); root.name = '2 Player Arcade · 398 Foam Street';
  const material = createToonMaterial({ vertexColors: true, rim: false, name: 'two-player-arcade-matte' });
  const near = buildLevel('near');
  // Mid/Far are built once, on demand, by the shared LOD controller.
  let reduced: { mid: ReturnType<typeof buildLevel>; far: ReturnType<typeof buildLevel> } | undefined;
  const reducedLevels = () => reduced ??= { mid: buildLevel('mid'), far: buildLevel('far') };
  const meshes = {} as Record<ArcadeBatch, Mesh>;
  for (const batch of BATCHES) {
    const geometry = near[batch];
    defineGeometryLods(geometry, () => ({ mid: reducedLevels().mid[batch], far: reducedLevels().far[batch] }));
    const mesh = new Mesh(geometry, material);
    mesh.name = `2 Player Arcade · ${batch}`;
    mesh.receiveShadow = true;
    // The ceiling only renders for eye-level interior views, where its shadow keeps sun out of the room.
    mesh.castShadow = batch !== 'site';
    root.add(mesh); meshes[batch] = mesh;
  }
  root.userData = {
    assetId: 'two-player-arcade', units: 'metres', authoring: 'procedural TypeScript', budget: ARCADE_BUDGET,
    sourceId: ARCADE_SOURCE.building, address: ARCADE_SOURCE.address, sources: ARCADE_SOURCE,
    limits: 'Exact OSM footprint, streets, lot and neighbouring outlines. Facades, heights, suite partition, rear stair and interior fit-out are interpretations of user-supplied photographs. The site is levelled at a provisional regional-DEM height. Signs and cabinet art are abstract blocks.',
  };
  let view: ArcadeView = 'exterior', cameraLow = false, disposed = false;
  function apply() {
    meshes.upper.visible = view === 'exterior';
    meshes.ceiling.visible = view === 'exterior' || cameraLow;
  }
  apply();
  return {
    root, meshes, material,
    get view() { return view; },
    /** Cutaway: inside hides the upper storey and roofs; the ceiling returns for eye-level views. */
    setView(next: ArcadeView, lowCamera = false) { if (next === view && lowCamera === cameraLow) return; view = next; cameraLow = lowCamera; apply(); },
    /** Suite A interior test in local metres (floor plan only). */
    insideSuite(x: number, z: number) {
      const s = ARCADE_SUITE;
      return x > s.minX && x < s.maxX && z > s.back && (z < s.porchWall || (x > s.porch.maxX && z < s.storefrontWall));
    },
    heights: ARCADE_HEIGHTS,
    dispose() { if (disposed) return; disposed = true; disposeObject(root); },
  };
}
