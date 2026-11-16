// Browser review for the 2 Player Arcade destination (398 Foam St). Requires the dev server on
// http://127.0.0.1:5191/. Captures street, interior eye-level, cutaway and forced Near/Mid/Far
// views on native WebGPU and the WebGL 2 backend, and walks through the Suite A door.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const out = 'artifacts/two-player-arcade'; await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-webgpu'] });
const results = [], errors = [];
const entry = () => document.querySelector('script[type="module"][src*="/src/main.ts"]').src;
try {
  for (const webgl of [false, true]) {
    const backend = webgl ? 'webgl2' : 'webgpu';
    const p = await browser.newPage({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await p.routeWebSocket(u => u.hostname === '127.0.0.1' && u.searchParams.has('token'), s => s.send(JSON.stringify({ type: 'connected' })));
    p.on('pageerror', e => errors.push(`${backend}: ${e.message}`));
    await p.goto(`http://127.0.0.1:5191/?tab=gym&destination=arcade&quality=standard${webgl ? '&webgl' : ''}`);
    await p.getByRole('tab', { name: 'Testing Gym', exact: true }).click();
    await p.waitForFunction(async src => { const { viewer: v } = await import(src); window.qaViewer = v; return v.avatarWorkbench?.getSnapshot().gymReady; }, await p.evaluate(entry), { timeout: 90000 });
    // Fix the sky so captures are comparable: clear afternoon.
    await p.locator('#gym-menu > summary').click();
    await p.locator('.gym-weather > summary').click(); await p.selectOption('#gym-weather-mode', 'clear'); await p.selectOption('#gym-weather-clock', 'preview');
    await p.fill('#gym-weather-date', '2026-11-14T14:00'); await p.locator('#gym-weather-date').dispatchEvent('change');
    await p.locator('#gym-menu > summary').click();
    await p.waitForTimeout(1200);
    const snap = await p.evaluate(() => { const w = qaViewer.avatarWorkbench, s = w.getSnapshot(); return { destination: s.destination, backend: s.backend, title: document.querySelector('.gym-place h1').textContent, avatar: w.avatar.root.position.toArray() }; });
    assert.equal(snap.destination, 'arcade'); assert.equal(snap.title, '2 Player Arcade');
    await p.screenshot({ path: `${out}/${backend}-arrival-street.png` });

    // Street-photo framing: from the far Foam Street sidewalk toward bay A.
    const shoot = async (name, avatarLocal, cameraLocal, wait = 900) => {
      await p.evaluate(([a, c]) => {
        const w = qaViewer.avatarWorkbench, g = w.gym.arcade, at = g.point(a[0], a[1], .045);
        w.controller.restoreState({ ...w.controller.getState(), position: at.toArray(), velocity: [0, 0] });
        if (c) w.camera.position.copy(g.point(c[0], c[1], c[2]));
      }, [avatarLocal, cameraLocal]);
      await p.waitForTimeout(wait); await p.screenshot({ path: `${out}/${backend}-${name}.png` });
    };
    await shoot('front-facade', [13.5, 3.4], [13.5, 16.5, 4.2]);
    await shoot('bay-b-facade', [40.8, 3.4], [40.8, 17.0, 4.0]);
    await shoot('rear-parking', [24, -24], [30, -46, 7]);

    // Walk in through the porch door with real keyboard input: the interior loads as its own screen.
    const walkThrough = async (startLocal, cameraLocal, ms = 2600) => {
      await p.evaluate(([a]) => { const w = qaViewer.avatarWorkbench, g = w.gym.arcade, at = g.point(a[0], a[1], .045); w.controller.restoreState({ ...w.controller.getState(), position: at.toArray(), velocity: [0, 0] }); }, [startLocal]);
      await p.locator('#gym-viewport canvas').focus();
      await p.waitForTimeout(1500); // let the follow target settle so camera-relative input is straight
      await p.evaluate(([c]) => { const w = qaViewer.avatarWorkbench, g = w.gym.arcade; w.camera.position.copy(g.point(c[0], c[1], c[2])); }, [cameraLocal]);
      await p.waitForTimeout(150);
      await p.keyboard.down('KeyW'); await p.waitForTimeout(ms); await p.keyboard.up('KeyW');
    };
    await walkThrough([16.5, 1.6], [16.5, 5.0, 2.4]);
    await p.waitForFunction(() => { const s = qaViewer.avatarWorkbench.getSnapshot(); return s.arcadeInside; }, null, { timeout: 15000 });
    const inside = await p.evaluate(() => { const w = qaViewer.avatarWorkbench, s = w.getSnapshot(); return { arcadeInside: s.arcadeInside, separateScene: w.scene !== w.gym.root.parent?.parent && w.scene.name, avatarInRoom: w.avatar.root.parent === w.scene, title: document.querySelector('.gym-place h1').textContent }; });
    assert(inside.arcadeInside && inside.avatarInRoom && inside.separateScene === '2 Player Arcade · interior screen', `Interior screen ${JSON.stringify(inside)}`);
    await p.waitForTimeout(800); await p.screenshot({ path: `${out}/${backend}-interior-arrival.png` });
    await shoot('interior-eye', [20.6, -3.9], [22.9, -.9, 1.7], 1200);
    await shoot('interior-cabinets', [17.3, -4.2], [19.6, -2.0, 2.2], 1200);

    // Play Super Bay Drifters at the lone red cabinet across from the entrance: E dollies the
    // camera to the glass and lays the game iframe exactly over it.
    await p.evaluate(() => { const w = qaViewer.avatarWorkbench, g = w.gym.arcade, at = g.point(23.27, -2.35, .045); w.controller.restoreState({ ...w.controller.getState(), position: at.toArray(), velocity: [0, 0] }); return true; });
    await p.waitForTimeout(500); await p.locator('#gym-viewport canvas').focus(); await p.keyboard.press('e');
    await p.waitForFunction(() => { const s = qaViewer.avatarWorkbench.getSnapshot(); return s.gameOpen && s.cabinetView.frameShown; }, null, { timeout: 8000 });
    await p.waitForTimeout(600);
    const game = await p.evaluate(() => {
      const w = qaViewer.avatarWorkbench, o = document.querySelector('.gym-arcade-game'), f = o.querySelector('iframe'), r = f.getBoundingClientRect(), c = w.renderer.domElement.getBoundingClientRect();
      const glass = w.arcadeRoom.screen, centre = glass.centre.clone().project(w.camera);
      return { visible: !o.hidden && getComputedStyle(f).visibility === 'visible', src: f.src, title: f.title, link: o.querySelector('a').href, avatarHidden: !w.avatar.root.visible,
        rect: [r.left, r.top, r.width, r.height].map(Math.round), aspect: r.width / r.height, fill: Math.max(r.width / c.width, r.height / c.height),
        centreError: Math.hypot(r.left + r.width / 2 - (c.left + (centre.x * .5 + .5) * c.width), r.top + r.height / 2 - (c.top + (-centre.y * .5 + .5) * c.height)),
        hudHidden: getComputedStyle(document.querySelector('.gym-toolbar')).display === 'none' };
    });
    assert(game.visible && game.src === 'https://montereybaygames.com/play/super-bay-drifters/embed' && game.link.startsWith('https://montereybaygames.com/play/super-bay-drifters/index.html'), JSON.stringify(game));
    assert(game.avatarHidden && game.hudHidden && Math.abs(game.aspect - 16 / 9) < .03 && game.centreError < 2 && game.fill > .5 && game.fill < .6, `Cabinet framing ${JSON.stringify(game)}`);
    await p.screenshot({ path: `${out}/${backend}-game-cabinet.png` });
    // The glass with the frame hidden, to confirm the bezel lines up with the frame rectangle.
    await p.evaluate(() => document.querySelector('.gym-arcade-game').style.display = 'none'); await p.waitForTimeout(200);
    await p.screenshot({ path: `${out}/${backend}-game-cabinet-glass.png` });
    await p.evaluate(() => document.querySelector('.gym-arcade-game').style.display = '');
    await p.locator('[data-game="close"]').click();
    await p.waitForFunction(() => qaViewer.avatarWorkbench.getSnapshot().cabinetView.blend === 0, null, { timeout: 5000 });
    const closed = await p.evaluate(() => { const w = qaViewer.avatarWorkbench; return { open: w.getSnapshot().gameOpen, src: document.querySelector('.gym-arcade-game iframe').src, avatar: w.avatar.root.visible, hud: getComputedStyle(document.querySelector('.gym-toolbar')).display !== 'none' }; });
    assert(!closed.open && closed.src === 'about:blank' && closed.avatar && closed.hud, JSON.stringify(closed));
    await p.waitForTimeout(400); await p.screenshot({ path: `${out}/${backend}-game-closed.png` });

    // Walk back out through the door: the main map loads and the player stands on the porch.
    await walkThrough([16.5, -3.0], [16.5, -6.4, 2.2]);
    await p.waitForFunction(() => !qaViewer.avatarWorkbench.getSnapshot().arcadeInside, null, { timeout: 15000 });
    const outside = await p.evaluate(() => { const w = qaViewer.avatarWorkbench, q = w.avatar.root.position, g = w.gym.arcade; return { position: q.toArray(), onPorch: g.crossedOut(q.x, q.z) || !g.insideSuiteAt(q.x, q.z), mainMap: w.avatar.root.parent === w.scene && w.scene.name !== '2 Player Arcade · interior screen', title: document.querySelector('.gym-place h1').textContent }; });
    assert(outside.onPorch && outside.mainMap && outside.title === '2 Player Arcade', `Back outside ${JSON.stringify(outside)}`);
    await p.waitForTimeout(700); await p.screenshot({ path: `${out}/${backend}-back-outside.png` });
    // The menu shortcut loads the interior directly.
    await p.locator('#gym-menu > summary').click(); await p.locator('#gym-arcade-visit').click();
    await p.waitForFunction(() => qaViewer.avatarWorkbench.getSnapshot().arcadeInside, null, { timeout: 15000 });
    await p.locator('#gym-menu > summary').click(); await p.locator('#gym-arcade-street').click();
    await p.waitForFunction(() => !qaViewer.avatarWorkbench.getSnapshot().arcadeInside, null, { timeout: 15000 });
    await p.locator('#gym-viewport canvas').focus();

    // Forced detail levels from a mid-distance oblique view.
    const levels = {};
    const setLod = value => p.evaluate(v => { const s = document.getElementById('gym-lod'); s.value = v; s.dispatchEvent(new Event('change')); }, value);
    for (const level of ['near', 'mid', 'far']) {
      await setLod(level);
      await shoot(`lod-${level}`, [13.5, 3.4], [-14, 30, 14], 700);
      levels[level] = await p.evaluate(() => { const w = qaViewer.avatarWorkbench, s = w.lod.stats(w.gym.arcade.root); return s; });
    }
    await setLod('auto');
    const stats = levels.near;
    results.push({ backend, snap, inside, game, outside, lod: { near: stats.near, mid: stats.mid, far: stats.far, bytes: stats.bytes } });
    await p.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await fs.writeFile(`${out}/browser-qa.json`, JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 1));
