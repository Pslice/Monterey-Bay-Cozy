/** Separate interior screen for Suite A of the 2 Player Arcade. It is its own Scene with indoor
 * lighting, rendered instead of the outdoor Gym while the player is inside. The room keeps the
 * arcade's real world transform, so the walking controller, colliders and LOD distances are the
 * same ones used on the porch; only the rendered scene changes at the doorway. */
import { Color, DirectionalLight, HemisphereLight, Scene } from 'three';
import { createArcadeRoom } from '../../models/locations/twoPlayerArcade/room';
import { ARCADE_LAYOUT } from '../../models/locations/twoPlayerArcade';
import { ARCADE_GAMES, ARCADE_SITE, ARCADE_SUITE } from '../../data/twoPlayerArcade';
import { applyNodeStyle } from '../nodeStyle';
import type { GymInteraction } from '../testingGym';
import type { ArcadeSite } from './arcade';

export function createArcadeRoomScreen(site: ArcadeSite, rim: boolean) {
  const scene = new Scene(); scene.name = '2 Player Arcade · interior screen';
  scene.background = new Color('#141a1d');
  const room = createArcadeRoom();
  room.root.position.copy(site.root.position); room.root.rotation.y = ARCADE_SITE.yaw; room.root.updateMatrixWorld(true);
  scene.add(room.root);
  // Indoor light: cool fill plus a warm key from the entrance side, so the back wall and the
  // cabinet fronts (facing +X) read. The string lights are painted, not light sources.
  const centre = site.point(19.75, -5.9, 1.4);
  scene.add(new HemisphereLight('#c9d6e8', '#5a4636', 1.35));
  const key = new DirectionalLight('#fff1d8', 1.6), offset = site.point(19.75 + 4, -5.9 + 6, 9).sub(site.point(19.75, -5.9, 0));
  key.position.copy(centre).add(offset); key.target.position.copy(centre); key.castShadow = true;
  key.shadow.mapSize.setScalar(1024); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .5, far: 30 });
  key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.camera.updateProjectionMatrix();
  scene.add(key, key.target);
  applyNodeStyle(room.root, rim);

  const game = ARCADE_GAMES[0], L = ARCADE_LAYOUT, S = ARCADE_SUITE;
  const cabinetZ = L.cabinets.centres[game.cabinetIndex];
  const interactions: GymInteraction[] = [
    { id: game.id, label: `Play ${game.name}`, action: 'play', radius: 1.05, position: site.point(S.minX + L.cabinets.depth + .45, cabinetZ, .04),
      description: `${game.name} by ${game.publisher}: race sailboats around Monterey Bay. Press E to play.` },
    { id: 'arcade-cabinets', label: 'Look at the cabinets', action: 'inspect', radius: 1.1, position: site.point(S.minX + L.cabinets.depth + .45, -5.5, .04),
      description: 'A row of upright cabinets with lit marquees. Cabinet art is abstract here; the real line-up changes.' },
    { id: 'arcade-crt', label: 'Check the CRT counter', action: 'inspect', radius: 1.6, position: site.point(21.8, -9.9, .04),
      description: 'Console stations on small CRT televisions along the brick wall, with stools for two players.' },
    { id: 'arcade-leave', label: 'Leave the arcade', action: 'exit', radius: 1.0, position: site.point((S.door.minX + S.door.maxX) / 2, S.porchWall - .6, .04),
      description: 'Step back out onto the Foam Street porch.' },
  ];
  let disposed = false;
  return {
    scene, root: room.root, interactions, game,
    dispose() { if (disposed) return; disposed = true; key.shadow.map?.dispose(); room.dispose(); scene.clear(); },
  };
}
export type ArcadeRoomScreen = ReturnType<typeof createArcadeRoomScreen>;
