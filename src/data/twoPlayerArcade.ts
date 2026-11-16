/** 2 Player Arcade, 398 Foam Street Suite A, New Monterey.
 *
 * Plan geometry comes from OpenStreetMap (© OpenStreetMap contributors, ODbL),
 * retrieved November 14, 2026 through the public map API for bbox
 * -121.9002,36.6110,-121.8978,36.6127. Points are projected with the Gym origin
 * (-121.91685, 36.6256) and the repository's spherical metre projection, then
 * expressed in the building's local frame:
 *
 *   +X runs along the Foam Street frontage, from the Drake Avenue corner (0) to
 *      the southeast corner (54.43 m);
 *   +Z points out of the facade toward Foam Street; the building occupies Z ≤ 0;
 *   +Y is up, with the ground-floor level at local Y = 0.
 *
 * The rotation is a proper rotation (no reflection), so the factory root only needs
 * a translation and a yaw. Heights, facades, the suite partition and the interior
 * fit-out are photo interpretations; they are not surveyed.
 */
import type { GymPoint } from '../viewer/avatarController';

export const ARCADE_SOURCE = {
  name: '2 Player Arcade',
  address: '398 Foam St, Suite A, Monterey, CA 93940',
  retrieved: '2026-11-14',
  osmRequest: 'https://api.openstreetmap.org/api/0.6/map?bbox=-121.9002,36.6110,-121.8978,36.6127',
  license: '© OpenStreetMap contributors · ODbL 1.0',
  building: 'way/238105015',
  parking: 'way/877383937',
  foamStreet: 'way/690849979',
  drakeAvenue: 'way/10467868',
  // Nominatim's 398 Foam Street point projects to local (9.95, −1.42): bay A's porch on this
  // building's frontage. Tenant nodes node/9125371806–08 also fall inside the footprint.
  geocode: 'https://nominatim.openstreetmap.org/search?street=398+Foam+Street&city=Monterey&state=CA&format=json',
  listing: 'https://arcade-museum.com/location/California/2-Player-Arcade-Shop-Monterey-1959',
  photos: 'User-supplied November 14, 2026 references: front (Foam St), side, rear parking and Suite A interior. Not bundled.',
} as const;

/** Gym-space placement. `anchor` is the Drake/Foam frontage corner (OSM node of way/238105015). */
export const ARCADE_SITE = {
  anchor: [1592.135, 1520.949] as GymPoint,
  /** Unit vector of local +X in Gym X/Z. */
  along: [0.562964, 0.826482] as GymPoint,
  /** Unit vector of local +Z (toward Foam Street) in Gym X/Z. */
  front: [-0.826482, 0.562964] as GymPoint,
  /** Three.js yaw that maps local +X to `along` and local +Z to `front`. */
  yaw: -0.972829,
  /** Provisional floor datum: cached regional USGS grid sampled at the building centroid
   * (≈230 m spacing). The real block slopes toward Lighthouse Avenue; the site is levelled. */
  floorY: 16.5,
  /** Level site pad, local X/Z. Covers the building, both streets, the lot and nearest neighbours. */
  pad: { minX: -50, maxX: 80, minZ: -56, maxZ: 54 },
} as const;

export const ARCADE_HEIGHTS = {
  /** Ground floor to second floor, eave and the centre gable ridge. Photo estimates. */
  upperFloor: 3.6, eave: 6.7, gableRidge: 9.05, hipRise: 2.15,
  /** Suite A drop ceiling, estimated from 2×4 tiles and cabinet height in the interior photo. */
  ceiling: 2.85,
} as const;

/** OSM way/238105015 outer ring, local metres (closing point removed). */
export const ARCADE_FOOTPRINT: readonly GymPoint[] = [
  [54.43, -13.92], [49.61, -13.92], [49.61, -14.71], [42.23, -14.71], [42.23, -16.54], [34.2, -16.55],
  [34.21, -14.66], [34.2, -12.68], [26.2, -12.68], [26.19, -15.1], [16.49, -15.1], [16.5, -17.29],
  [16.49, -17.99], [12.72, -17.98], [12.72, -14.4], [5.85, -14.4], [5.85, -12.5], [0, -12.5], [0, 0], [54.43, 0],
];

/** Rectangle under the shared hip roof; deeper rear wings get flat caps. */
export const ARCADE_ROOF_CORE = { minX: 0, maxX: 54.43, minZ: -12.5, maxZ: 0 } as const;

/** Two photographed facade bays share the 54.43 m frontage. Bay A (Drake end) follows the
 * Foam Street photograph; bay B follows the symmetrical side photograph. Split is authored. */
export const ARCADE_BAYS = [
  { id: 'A', x0: 0, x1: 27.2, centre: [10.0, 17.4] as const },
  { id: 'B', x0: 27.2, x1: 54.43, centre: [37.1, 44.5] as const },
] as const;

/** Suite A interior, local metres. The entrance is the right-hand porch door photographed with
 * the "2 PLAYER" decal; the storefront window lies to its right. Rear service space is closed. */
export const ARCADE_SUITE = {
  minX: 14.8, maxX: 24.7, back: -11.5,
  /** Porch back wall and the storefront wall, both measured from the facade plane. */
  porchWall: -1.4, storefrontWall: -0.25, porch: { minX: 10.0, maxX: 17.4 },
  door: { minX: 15.95, maxX: 17.05, height: 2.25 },
} as const;

/** Mapped context in local metres. Street centrelines are straight within the pad. */
export const ARCADE_CONTEXT = {
  foamCentreZ: 8.95, foamHalfWidth: 4.7,
  drakeCentreX: -8.6, drakeHalfWidth: 4.4,
  sidewalk: 2.9,
  parking: [[-1.35, -13.32], [5.1, -13.5], [5.85, -14.4], [12.72, -14.4], [12.72, -17.98], [16.49, -17.99], [16.5, -17.29], [26.13, -16.98], [30.18, -15.82], [34.21, -14.66], [34.2, -16.55], [42.23, -16.54], [49.61, -14.71], [54.43, -13.92], [59.83, -28.94], [29.8, -33.22], [16.95, -32.98], [-0.42, -32.49]] as readonly GymPoint[],
  neighbours: [
    { id: 'way/238036638', name: '400 Foam Street', height: 7.2, ring: [[-32.67, 0.02], [-32.82, -14.31], [-19.69, -14.41], [-19.92, -3.98], [-21.05, -0.57], [-26.12, -0.55], [-26.09, -1.85], [-27.62, -2.01], [-27.6, -0.03]] },
    { id: 'way/224313774', name: 'Cannery Row Deli', height: 4.6, ring: [[0.15, -34.76], [-0.02, -40.2], [9.02, -40.49], [9.19, -35.04]] },
    { id: 'way/238036682', name: 'building', height: 6.2, ring: [[-30.55, -42.31], [-30.25, -50.44], [-19.86, -50.05], [-20.16, -41.92]] },
    { id: 'way/238105172', name: 'building', height: 6.8, ring: [[-28.29, 35.07], [-18.19, 35.08], [-18.2, 50.84], [-28.27, 50.83], [-28.27, 45.96], [-30.55, 45.95], [-30.55, 40.7], [-28.29, 40.7]] },
    { id: 'way/238105217', name: 'building', height: 7.4, ring: [[-46.01, 21.46], [-45.97, 37.67], [-36.33, 37.65], [-36.33, 34.59], [-35.61, 34.59], [-35.62, 30.88], [-34.83, 30.88], [-34.85, 23.22], [-40.02, 23.23], [-40.03, 21.45]] },
    { id: 'way/238105241', name: 'building', height: 6.4, ring: [[-31.38, 21.58], [-21.12, 21.66], [-21.16, 27.14], [-19.1, 28.46], [-19.16, 34.74], [-25.83, 34.69], [-25.82, 33.03], [-31.47, 32.98]] },
  ] as const,
  /** way/690838448, the neighbouring lot beside 400 Foam Street. */
  neighbourLot: [[-33.2, -15.4], [-18.01, -15.52], [-18.15, -33.43], [-33.34, -33.32]] as readonly GymPoint[],
} as const;

export function arcadeToWorld(x: number, z: number): GymPoint {
  const { anchor, along, front } = ARCADE_SITE;
  return [anchor[0] + along[0] * x + front[0] * z, anchor[1] + along[1] * x + front[1] * z];
}
export function arcadeToLocal(x: number, z: number): GymPoint {
  const { anchor, along, front } = ARCADE_SITE, dx = x - anchor[0], dz = z - anchor[1];
  return [dx * along[0] + dz * along[1], dx * front[0] + dz * front[1]];
}

/** Playable cabinets. The game runs in an iframe overlay from its own site; nothing is bundled. */
export const ARCADE_GAMES = [
  { id: 'super-bay-drifters', name: 'Super Bay Drifters', cabinetIndex: 0, url: 'https://montereybaygames.com/play/super-bay-drifters/index.html?v=99dbe18712', publisher: 'Monterey Bay Games' },
] as const;
