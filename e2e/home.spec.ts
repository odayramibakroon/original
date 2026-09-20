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
    await page.screenshot({ path: `test-results/home-${locale}-mobile.png`, caret: "initial" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
