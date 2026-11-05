// Regenerates public/og/card-bg.jpg, the empty stadium behind every result card (api/card.ts).
// Start `npm run dev` first, then: node scripts/card-bg.cjs
// Needs Playwright (not a project dependency): npm i -D playwright && npx playwright install chromium
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500); // let the stadium lights finish flickering on
  await p.addStyleTag({ content: `
    .home, .sound-btn, .corner-btn, .players { display: none !important; }
    .crowd { filter: blur(1.5px); } /* softens the dot texture: keeps the PNG card under ~300 KB for WhatsApp */
    body::after { content: ''; position: fixed; inset: 0; z-index: 50;
      background: radial-gradient(ellipse 70% 62% at 50% 40%, rgba(4,8,6,0.82), rgba(4,8,6,0.35) 70%, transparent); }
  `});
  await p.waitForTimeout(400);
  await p.screenshot({ path: require('path').join(__dirname, '../public/og/card-bg.jpg'), type: 'jpeg', quality: 82 });
  await b.close();
})();
