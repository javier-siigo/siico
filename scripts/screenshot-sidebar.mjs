import { chromium } from "playwright";

const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const OUT = process.env.SCREENSHOT_OUT_DIR ?? "/tmp/shots";
const EMAIL = process.env.SCREENSHOT_EMAIL;
const PASSWORD = process.env.SCREENSHOT_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error(
    "Missing credentials. Set SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD before running.",
  );
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[console.error]", msg.text());
  });
  page.on("pageerror", (err) => console.log("[pageerror]", err.message));

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  console.log("→ dashboard expanded");
  await page.screenshot({ path: `${OUT}/01-dashboard-expanded.png`, fullPage: false });

  console.log("→ collapse via rail");
  const rail = page.locator('[data-sidebar="rail"]').first();
  await rail.click({ force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/02-dashboard-collapsed.png`, fullPage: false });

  console.log("→ expand back");
  await rail.click({ force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/03-dashboard-expanded-again.png`, fullPage: false });

  console.log("→ /conciliaciones/colombia expanded");
  await page.goto(`${BASE}/conciliaciones/colombia`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/04-proceso-expanded.png`, fullPage: false });

  await rail.click({ force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/05-proceso-collapsed.png`, fullPage: false });

  console.log("→ wide viewport 1600");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/06-dashboard-wide-expanded.png`, fullPage: false });

  await rail.click({ force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/07-dashboard-wide-collapsed.png`, fullPage: false });

  console.log("→ mobile");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/08-mobile-dashboard.png`, fullPage: false });

  await browser.close();
  console.log("Done. Screenshots saved to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
