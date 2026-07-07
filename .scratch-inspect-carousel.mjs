import { chromium } from 'playwright';

const shotDir = 'C:/Users/User/AppData/Local/Temp/claude/c--Users-User-Documents-GitHub-embah-lp/d201f6cf-ef76-4e6a-8f11-4a4da7c6326d/scratchpad';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

await page.locator('#review').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

await page.screenshot({ path: `${shotDir}/review-initial.png`, clip: await page.locator('#review').boundingBox() });

const box = await page.locator('.feedback-track').boundingBox();
console.log('track box', JSON.stringify(box));

const slideBoxes = [];
const slides = await page.locator('.feedback-slide').all();
for (const s of slides) {
  slideBoxes.push(await s.boundingBox());
}
console.log('slide boxes', JSON.stringify(slideBoxes));
console.log('slide count (incl clones)', slides.length);

// Check overflow / clipping: compare slider height to content scrollHeight
const sliderInfo = await page.locator('.feedback-slider').evaluate((el) => ({
  clientHeight: el.clientHeight,
  scrollHeight: el.scrollHeight,
  overflow: getComputedStyle(el).overflow,
}));
console.log('slider info', JSON.stringify(sliderInfo));

const trackInfo = await page.locator('.feedback-track').evaluate((el) => ({
  clientHeight: el.clientHeight,
  scrollHeight: el.scrollHeight,
  offsetHeight: el.offsetHeight,
}));
console.log('track info', JSON.stringify(trackInfo));

// Drag from last real slide -> should wrap to first
// First, click dot 3 (last) if present
const dots = await page.locator('.feedback-dot').all();
console.log('dot count', dots.length);
if (dots.length) {
  await dots[dots.length - 1].click();
  await page.waitForTimeout(700);
}

await page.screenshot({ path: `${shotDir}/review-last-active.png`, clip: await page.locator('#review').boundingBox() });

// Now drag left (negative) to go forward past the last item.
// Use the VISIBLE slider viewport (not the track's own transformed box,
// which can sit off-screen once translateX has moved it far left).
const sliderBox = await page.locator('.feedback-slider').boundingBox();
const startX = sliderBox.x + sliderBox.width / 2;
const startY = sliderBox.y + sliderBox.height / 2;

await page.mouse.move(startX, startY);
await page.mouse.down();
for (let i = 1; i <= 20; i++) {
  await page.mouse.move(startX - i * 45, startY, { steps: 2 });
  await page.waitForTimeout(30);
}
await page.screenshot({ path: `${shotDir}/review-mid-drag.png`, clip: await page.locator('#review').boundingBox() });
await page.mouse.up();
await page.waitForTimeout(800);

await page.screenshot({ path: `${shotDir}/review-after-wrap-drag.png`, clip: await page.locator('#review').boundingBox() });

const activeDotIndex = await page.evaluate(() => {
  const dots = Array.from(document.querySelectorAll('.feedback-dot'));
  return dots.findIndex((d) => d.classList.contains('is-active'));
});
console.log('active dot index after wrap drag', activeDotIndex);

const consoleTransform = await page.locator('.feedback-track').evaluate((el) => el.style.transform);
console.log('final transform', consoleTransform);

await browser.close();
