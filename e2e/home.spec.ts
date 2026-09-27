import { test, expect } from "@playwright/test";
import { seedFixtures } from "./fixtures";

test.beforeAll(seedFixtures);

test("detects English, switches to Arabic and remembers the selection", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.getByRole("combobox", { name: "Language" }).selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.screenshot({ path: "test-results/home-ar-desktop.png", fullPage: true, caret: "initial" });
  await context.close();
});

for (const locale of ["ar-SA", "en-US"]) {
  test(`mobile navigation, form direction and layout in ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await page.goto("/");
    await page.locator(".hero-mobile-image").evaluate((image: HTMLImageElement) => image.decode());
    await expect(page.locator(".hero-card")).toHaveCSS("opacity", "1");
    const hero = await page.locator(".hero").boundingBox();
    const image = await page.locator(".hero-mobile-image").boundingBox();
    expect(Math.abs(image!.height - hero!.height)).toBeLessThan(2);
    expect(hero!.height).toBeLessThan(844);
    const nav = await page.locator(".nav").boundingBox();
    const content = await page.locator(".hero-content").boundingBox();
    const quality = await page.locator(".hero-card").boundingBox();
    expect(content!.y).toBeGreaterThan(nav!.y + nav!.height);
    expect(quality!.y).toBeGreaterThanOrEqual(content!.y + content!.height);
    expect(quality!.y + quality!.height).toBeLessThan(image!.y + image!.height);
    await expect(page.locator(".hero-mobile-image-stage")).toHaveCSS("position", "absolute");
    await page.screenshot({ path: `test-results/home-${locale}-mobile.png`, caret: "initial" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const footerColumns = await page.locator(".footer-column").evaluateAll((columns) => columns.map((column) => {
      const { x, y } = column.getBoundingClientRect();
      return { x, y };
    }));
    expect(footerColumns).toHaveLength(4);
    expect(footerColumns[0].y).toBe(footerColumns[1].y);
    expect(footerColumns[2].y).toBe(footerColumns[3].y);
    expect(footerColumns[2].y).toBeGreaterThan(footerColumns[0].y);
    expect(footerColumns[0].x).toBe(footerColumns[2].x);
    expect(footerColumns[1].x).toBe(footerColumns[3].x);
    await page.locator(".menu-btn").click();
    await expect(page.locator(".mobile-menu")).toHaveClass(/open/);
    await page.locator('.mobile-menu a[href="#contact"]').click();
    await expect(page.locator(".mobile-menu")).not.toHaveClass(/open/);
    const phone = page.locator('input[type="tel"]');
    await phone.focus();
    await phone.fill("٠٥٥١٢٣٤٥٦٧");
    await expect(phone).toHaveCSS("text-align", locale.startsWith("ar") ? "right" : "left");
    await expect(phone).toHaveCSS("direction", locale.startsWith("ar") ? "rtl" : "ltr");
    await page.locator('input[name="name"]').fill("A");
    await phone.focus();
    await expect(page.locator(".form-error").first()).toContainText(locale.startsWith("ar") ? "حرفين" : "two characters");
    await page.locator("#contact").evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "center" }));
    await expect(phone).toBeInViewport();
    await expect(page.locator(".contact-form")).toHaveCSS("opacity", "1");
    await page.screenshot({ path: `test-results/contact-${locale}-mobile.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await context.close();
  });
}

test("mobile hero image covers all text on narrow and large phones without a black tail", async ({ browser }) => {
  for (const locale of ["ar-SA", "en-US"]) {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.goto("/");
    for (const viewport of [{ width: 320, height: 640 }, { width: 430, height: 932 }]) {
      await page.setViewportSize(viewport);
      await page.locator(".hero-card").scrollIntoViewIfNeeded();
      await expect(page.locator(".hero-card")).toHaveCSS("opacity", "1");
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      const hero = await page.locator(".hero").boundingBox();
      const image = await page.locator(".hero-mobile-image").boundingBox();
      const quality = await page.locator(".hero-card").boundingBox();
      const description = await page.locator(".hero-text").boundingBox();
      const actions = await page.locator(".hero-actions a").first().boundingBox();
      expect(Math.abs(image!.height - hero!.height)).toBeLessThan(2);
      expect(quality!.y + quality!.height).toBeLessThan(hero!.height);
      expect(description!.y + description!.height).toBeLessThan(image!.height * 0.44);
      expect(actions!.y).toBeGreaterThan(image!.height * 0.72);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator(".hero-mobile-image").evaluate((image: HTMLImageElement) => image.decode());
      await page.screenshot({ path: `test-results/hero-overlay-${locale}-${viewport.width}.png`, animations: "disabled" });
      await page.evaluate(() => window.scrollTo({ top: 250, behavior: "instant" }));
      const shiftedHero = await page.locator(".hero").boundingBox();
      const shiftedImage = await page.locator(".hero-mobile-image").boundingBox();
      expect(Math.abs(shiftedHero!.y - shiftedImage!.y)).toBeLessThan(2);
      expect(Math.abs(shiftedHero!.height - shiftedImage!.height)).toBeLessThan(2);
    }
    await context.close();
  }
});

test("protects admin routes and cron from anonymous requests", async ({ page, request }) => {
  await page.goto("/admin/messages/AAAAAAAAAAAAAAAAAAAA");
  await expect(page).toHaveURL(/\/login\?next=/);
  expect((await request.post("/api/notifications/retry")).status()).toBe(401);
  expect((await request.post("/api/admin/media", { headers: { origin: "http://127.0.0.1:3101" } })).status()).toBe(403);
  const worker = await request.get("/sw.js");
  expect(worker.status()).toBe(200);
  expect(worker.headers()["cache-control"]).toContain("no-store");
  expect((await request.get("/icon-192.png")).headers()["content-type"]).toContain("image/png");
});
