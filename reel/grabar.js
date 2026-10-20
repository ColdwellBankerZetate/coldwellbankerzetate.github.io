const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const solo = process.argv[2]; // "prueba" = solo algunos cuadros
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:' + (process.env.PORT || 8777) + '/reel/', { waitUntil: 'networkidle' });
  const total = await p.evaluate(() => window.cargar());
  const FPS = 30, N = Math.round(total * FPS);
  fs.mkdirSync('reel/trabajo/cuadros', { recursive: true });
  const lista = solo ? [10, 75, 120, 150, 200, 330, 560, N - 30] : [...Array(N).keys()];
  for (const f of lista) {
    await p.evaluate(t => window.render(t), f / FPS);
    await p.screenshot({ path: `reel/trabajo/cuadros/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  console.log('cuadros', lista.length, 'de', N);
  await b.close();
})();
