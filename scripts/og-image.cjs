// Regenerates public/og.jpg (the 1200x630 link preview). Start `npm run dev` first, then: node scripts/og-image.cjs
// It screenshots the real home page, hides the buttons, and overlays a share-style row plus the URL.
// Needs Playwright (not a project dependency): npm i -D playwright && npx playwright install chromium
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.evaluate(() => { window.__teamsT = 6.0 });
  await p.waitForTimeout(2000);
  await p.addStyleTag({ content: `
    .home-actions, .sound-btn, .corner-btn { display: none !important; }
    .og-card { position: fixed; left: 50%; top: 432px; transform: translateX(-50%); z-index: 50;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 22px 34px 20px; border-radius: 14px; background: rgba(5,10,7,0.86);
      border: 1px solid #345241; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
    .og-squares { display: flex; gap: 12px; }
    .og-squares i { width: 46px; height: 46px; border-radius: 8px; display: block;
      box-shadow: inset 0 -5px 0 rgba(0,0,0,0.22), 0 0 16px rgba(0,0,0,0.4); }
    .og-url { font-family: 'Doto', monospace; font-weight: 800; font-size: 34px; letter-spacing: 0.12em;
      color: #ffb627; text-shadow: 0 0 6px rgba(255,182,39,0.75), 0 0 18px rgba(255,140,0,0.35); }
  `});
  await p.evaluate(() => {
    const c = document.createElement('div'); c.className = 'og-card';
    const colors = ['#ffd23f', '#4fa3ff', '#b57bff', '#7ddc5f', '#ffd23f', '#eef2ee', '#4fa3ff'];
    c.innerHTML = '<div class="og-squares">' + colors.map(x => `<i style="background:${x}"></i>`).join('') + '</div><div class="og-url">4THANDLONG.IO</div>';
    document.body.appendChild(c);
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: require('path').join(__dirname, '../public/og.jpg'), type: 'jpeg', quality: 88 });
  await b.close();
})();
