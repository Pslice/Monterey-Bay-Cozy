# 2 Player Arcade · 398 Foam Street

A photo-informed replica of the 2 Player Arcade, a retro arcade, repair shop and lounge in Suite A of 398 Foam Street, New Monterey. The site is a separate **Testing Gym** destination: choose **Menu → 2 Player Arcade · Foam St** (the sidewalk) or **Menu → Visit 2 Player Arcade** (straight inside), use **Destination → 2 Player Arcade**, or open `?tab=gym&destination=arcade`. Walk through the open porch door, or press E there, to load Suite A as its **own interior screen**. Walk back out through the door to return to the porch on the main map. Inside, the blue cabinet nearest the door plays **Super Bay Drifters** in an overlay.

## Location and sources

| Source | Used for | Limits |
| --- | --- | --- |
| [OpenStreetMap map API](https://api.openstreetmap.org/api/0.6/map?bbox=-121.9002,36.6110,-121.8978,36.6127), retrieved November 14, 2026 (© OpenStreetMap contributors, ODbL) | Building `way/238105015`, parking `way/877383937`, Foam Street `way/690849979`, Drake Avenue `way/10467868`, neighbouring footprints and lot | Footprints are mapped outlines, not a survey; streets are straight within the pad |
| [Nominatim geocode](https://nominatim.openstreetmap.org/search?street=398+Foam+Street&city=Monterey&state=CA&format=json) | 398 Foam St resolves to this building's frontage (local X 9.95, Z −1.42, at bay A's porch) | Address interpolation, not a parcel record |
| [Arcade Museum location listing](https://arcade-museum.com/location/California/2-Player-Arcade-Shop-Monterey-1959) and Monterey County Weekly visitor guides | Business name, Suite A address, retro arcade/repair/lounge use | Line-up, hours and decor change over time |
| User-supplied photographs, November 14, 2026: Foam Street front, side, rear parking, Suite A interior | Facade composition, colors, pergolas, porches, rear stair/balcony, interior layout and fit-out | Not bundled; dimensions are scaled by eye against the mapped 54.43 m frontage |
| Cached [regional USGS grid](monterey-bay-region.md) | Provisional floor datum of 16.5 m at the building centroid | About 230 m sampling; the real block slopes toward Lighthouse Avenue |

The building is about **2.2 km southeast of Lovers Point**: Gym X ≈ 1,592–1,630 m, Z ≈ 1,520–1,560 m. That is outside the detailed waterfront crop (X ≤ 1,500, Z ≤ 900), so the arcade owns its own level pad and walking region rather than extending the park's walking outline.

## Coordinate frame and scale

`src/data/twoPlayerArcade.ts` holds the source record and all plan geometry in the building's local frame: metres, **+X along the Foam Street frontage** from the Drake Avenue corner (0) to the southeast corner (54.43 m), **+Z toward Foam Street**, floor at Y = 0. The basis is a proper rotation (tested), so the factory root takes only a translation to the Drake-corner anchor (Gym X 1,592.135, Z 1,520.949) and a yaw of −0.972829 rad. The root is never scaled.

| Dimension | Value | Basis |
| --- | ---: | --- |
| Foam Street frontage | 54.43 m | OSM `way/238105015` |
| Plan depth | 12.5–18.0 m (stepped rear) | OSM |
| Second floor / eave / gable ridge | 3.6 / 6.7 / 9.05 m | Photo estimate |
| Suite A interior | 9.9 × 10.1–11.25 m | Photo interpretation inside the mapped plan |
| Suspended ceiling | 2.85 m | 2×4 tiles and cabinet heights in the interior photo |
| Arcade cabinets | 0.76 × 0.98 × 1.86 m | Typical upright cabinet |
| Level site pad | 130 × 110 m | Authored, covers streets, lot and nearest neighbours |

## What is modelled

- **Exterior**: peach stucco with green trim; two facade bays, scaled from the Foam Street photo (bay A, Drake end) and the symmetrical side photo (bay B). Each bay has a recessed terracotta porch under a projecting stucco band, green pergola beams with outriggers along the wings, multi-pane and storefront windows, a low barrel-tile hip roof and a front-facing cross gable. Suite A's porch door stands open. The storefront carries the shop's white decal block; lettering and logos are not reproduced. The parking side has windows, doors, an exterior stair and a railed balcony from the rear photograph, plus flat-roofed rear wings.
- **Suite A interior**: wood floor, five black upright cabinets along the left wall with lit marquees, attract-mode screens, control decks and coin doors; a red cabinet beside the door; a long high-top table with seven green-topped stools; a black counter with four CRT stations and two stools against a red-brick wall with blue wainscot; a blue sign panel; framed pictures, a wreath and two posters; green/red string lights and tinsel; a suspended tile ceiling with light panels.
- **Site**: Foam Street and Drake Avenue, sidewalks, the photographed red curb, crosswalk bars, planting strip, hedges, the multi-stem street tree, a utility pole and street sign, the mapped parking lot with stalls and mailbox cluster, and the six nearest OSM buildings as plain flat-roofed massing.

**Artistic choices:** the bay split, window placement, porch depth, all heights, colors, the suite partition, rear stair geometry, furniture arrangement, hedge and tree shapes, and neighbour heights. All cabinet art, screens, signs and posters are abstract color blocks; no game, brand or poster artwork is copied. Other suites and the upper floor are closed exterior massing.

## Implementation and ownership

| Responsibility | Source |
| --- | --- |
| Source record, local frame, plan, suite and context geometry | [`src/data/twoPlayerArcade.ts`](../src/data/twoPlayerArcade.ts) |
| Exterior-site factory, batches, LOD variants, cutaway, disposal | [`src/models/locations/twoPlayerArcade/index.ts`](../src/models/locations/twoPlayerArcade/index.ts) |
| Facades, roofs, pergolas, rear stair | [`exterior.ts`](../src/models/locations/twoPlayerArcade/exterior.ts) |
| Suite A fit-out and ceiling | [`interior.ts`](../src/models/locations/twoPlayerArcade/interior.ts) |
| Streets, lot, planting, neighbours | [`site.ts`](../src/models/locations/twoPlayerArcade/site.ts) |
| Vertex-colored flat-shaded geometry writer | [`painter.ts`](../src/models/locations/twoPlayerArcade/painter.ts) |
| Interior-screen room batch (fit-out, ceiling, daylit doorway) | [`room.ts`](../src/models/locations/twoPlayerArcade/room.ts) |
| Gym placement, colliders, walking region, doorway thresholds, porch prompts | [`src/viewer/testingGym/arcade.ts`](../src/viewer/testingGym/arcade.ts) |
| Interior screen: own Scene, indoor lights, inside prompts | [`src/viewer/testingGym/arcadeRoom.ts`](../src/viewer/testingGym/arcadeRoom.ts) |
| Playable cabinet record (name, URL, cabinet) | `ARCADE_GAMES` in [`src/data/twoPlayerArcade.ts`](../src/data/twoPlayerArcade.ts) |

`createTestingGym()` owns the arcade root and disposes it; the workbench adds it to the local scene, applies node style, and registers it with the shared LOD controller through the Gym scene. On arrival, the workbench selects the arcade's **separate walking region** (pad bounds, colliders and flat floor), as it does for the museum mezzanine. Any other destination returns to the park controller. Colliders come from the same layout constants as the visible geometry: building blocks around the open door, the storefront wall, cabinets, table, stools, counter, hedges, tree, poles, stair, mailbox and neighbours. The regional bay terrain has a hole cut for the pad and is shown around the site. Its floor sampler returns the pad height, so flight and deer never sink into it. The porch prompts (shop window, Enter) live in `arcade.interactions`, and the inside prompts in the interior screen; both are offered only in the arcade's walking region. The exterior site keeps its Suite A fit-out so the room is visible through the open door, and its `setView` cutaway API remains available, but the Gym no longer uses it: going inside switches screens instead. Flight uses the exact mapped outline as an obstacle up to the gable ridge.

## Interior screen

Suite A loads as a separate screen. `arcadeRoom.ts` builds its own `Scene` on first entry, with a dark background, cool hemisphere fill and a warm shadow-casting key light from the entrance. The scene holds one room batch, then the workbench reuses it. The outdoor Gym is not rendered while you are inside. Weather does not reach the room, and the string lights are painted rather than light sources. A short fade ("Entering 2 Player Arcade…" / "Back to Foam Street…") covers the swap and locks input.

The room keeps the arcade's real world transform, so the walking controller, colliders and LOD distances stay the same at the doorway; only the rendered scene changes. Two thresholds with a dead band either side of the porch wall decide the swap: `crossedIn` a step inside the door and `crossedOut` once back on the porch. Arrival points sit beyond the opposite trigger, so you never bounce back. Entering places you a step inside, clear of the door leaf, and frames the room from the front-right as in the interior photograph. Leaving places you on the porch facing Foam Street. Prompts: **Enter 2 Player Arcade** on the porch; inside, **Play Super Bay Drifters**, **Look at the cabinets**, **Check the CRT counter** and **Leave the arcade**. Any other menu destination exits the room first.

## Super Bay Drifters cabinet

Cabinet 0, nearest the door, has an ocean-blue marquee and a sea screen with three white sails. That is an original motif, not the game's art. **Play Super Bay Drifters** opens a full-viewport overlay with an iframe pointing at `https://montereybaygames.com/play/super-bay-drifters/index.html?v=99dbe18712` (`ARCADE_GAMES`). It allows fullscreen, gamepad and autoplay. The frame loads only when opened and unloads to `about:blank` on close, which stops audio and network activity. While the overlay is open, avatar keyboard, gamepad and touch movement are locked. **Close** (or Esc while focus is outside the game) returns to the room.

**Embedding is currently blocked by the game's site.** Its page sends `X-Frame-Options: DENY` (checked November 14, 2026), so browsers show an error page inside the frame. The overlay therefore always offers **Open in a new tab ↗** and an explanatory note. The game will appear in the frame once the site allows this origin. To do that, remove `X-Frame-Options` and send `Content-Security-Policy: frame-ancestors 'self' http://127.0.0.1:5191 <deployed origin>`. Proxying or stripping the header from this app would bypass the publisher's policy and is deliberately not done.

## Budget

Five static batches share one toon material (`rim: false`), with no image textures and no per-frame geometry work. Each batch has authored Near/Mid/Far variants: Mid drops muntins, tile courses, brick mortar, bulbs and stool legs, and Far keeps massing, roofs, glazing panels and boxed furniture.

| Detail | Triangles | Draws (before culling) |
| --- | ---: | ---: |
| Near | 7,371 | 5 |
| Mid | 4,250 | 5 |
| Far | 1,278 | 5 |
| Interior screen room, Near / Mid / Far | 2,611 / 996 / 470 | 1 |

The ceilings are **9,000 / 5,200 / 1,600 triangles and 5 draws** for the site and **3,200 / 1,400 / 700 and 1 draw** for the interior room (about 430 KiB across levels), both enforced by the unit test. Geometry storage across all three levels is about **1.33 MiB** of typed arrays (non-indexed flat-shaded position/normal/color), not measured GPU memory. While you are inside, only the interior screen (one room batch plus the avatar) is rendered. Shadow passes, the avatar, sky and regional terrain are separate costs.

## Verification

- `node --import tsx --test tests/two-player-arcade.test.ts`: doorway hysteresis and arrival points, interior screen on its own scene at the real transform, room budget, reachable inside prompts and the Super Bay Drifters record, plus OSM source and geocode placement, proper rotation and round trip, unscaled metre root, toon-only/no-texture materials, finite geometry, monotonic per-level budgets, gable height and interior containment, cutaway states, an open door route from sidewalk to table, solid walls and closed suites, furniture collisions, reachable prompts, root anchor placement and single disposal.
- `node tests/two-player-arcade-browser.mjs` (dev server on port 5191): native WebGPU and WebGL 2. Covers the direct destination link and title; street, bay B and rear captures; a real keyboard walk in through the door that loads the separate interior screen; interior arrival, eye-level and cabinet captures; E at the blue cabinet opening the game overlay with the expected iframe/link URL; Close unloading the frame; a keyboard walk back out that restores the main map on the porch; both menu shortcuts; and forced Near/Mid/Far captures and LOD counters, with no page errors. Output goes to `artifacts/two-player-arcade/`.

## Limits and next steps

The site is levelled; the real block's slope, curb ramps and steps are not modelled. Overlapping floors are not supported by the 2D controller, so the upper offices and exterior stair are not walkable. The suite's rear service area, restroom and exact cabinet line-up are unverified. Otter Man can fly over the site but cannot land there, because landing hands control to the park controller. Only Super Bay Drifters is playable, and only once its site permits embedding; the other cabinets are scenery. A Map Study placement, a measured interior plan and more playable cabinets would be useful follow-ups.
