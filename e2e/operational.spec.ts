import { test, expect, type Page } from "@playwright/test";
import { Timestamp } from "firebase-admin/firestore";
import sharp from "sharp";
import { db, password, seedFixtures } from "./fixtures";

test.use({ locale: "en-US" });
test.beforeAll(seedFixtures);
test.beforeEach(async ({ request }) => {
  for (const name of ["contactMessages", "notificationOutbox", "contactIpLimits", "contactRateLimits", "blockedContactIps", "media"]) {
    const rows = await db.collection(name).get();
    for (let offset = 0; offset < rows.size; offset += 400) {
      const batch = db.batch();
      for (const row of rows.docs.slice(offset, offset + 400)) batch.delete(row.ref);
      await batch.commit();
    }
  }
  await db.doc("system/contactPolicy").delete();
  await request.post("http://127.0.0.1:54329/reset");
});

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await page.getByLabel("Email address").fill("test-admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
}

async function seedMessage(name: string, ip = "203.0.113.24", createdAt = Timestamp.fromMillis(Date.now() - 60000)) {
  const ref = db.collection("contactMessages").doc();
  await ref.set({ name, email: `${name.toLowerCase()}@example.test`, phone: "+966501234567", ip, message: "Wholesale order inquiry", status: "new", createdAt });
  await db.doc(`notificationOutbox/${ref.id}`).set({ status: "pending", messageId: ref.id });
  return ref;
}

test("daily settings, validation, canonical IP blocking and responsive bilingual settings", async ({ page }) => {
  await signIn(page, "/admin/settings");
  const policy = page.locator("#daily-messages").locator("xpath=ancestor::form");
  await expect(page.locator("#daily-messages")).toHaveValue("3");
  await page.locator("#daily-messages").fill("0");
  await policy.getByRole("button").click();
  await expect(policy.getByRole("alert")).toContainText("1");
  await page.locator("#daily-messages").fill("2");
  await policy.getByRole("button").click();
  await expect(policy.getByRole("status")).toHaveText("Changes saved.");
  expect((await db.doc("system/contactPolicy").get()).data()?.dailyMessagesPerIp).toBe(2);
  const block = page.locator("#blocked-ip").locator("xpath=ancestor::form");
  await page.locator("#blocked-ip").fill("999.1.1.1");
  await block.getByRole("button").click();
  await expect(block.getByRole("alert")).toBeVisible();
  await page.locator("#blocked-ip").fill("2001:0db8:0:0::7");
  await block.getByRole("button").click();
  await expect(page.locator(".blocked-ip-list")).toContainText("2001:db8::7");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("#contact-policy-title").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/operational-settings-desktop.png", animations: "disabled", caret: "initial" });
  await page.locator(".admin-topbar").getByRole("combobox").selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#contact-policy-title").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/operational-settings-mobile-ar.png", animations: "disabled", caret: "initial" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".blocked-ip-list").getByRole("button", { name: "فك حظر IP", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "فك حظر IP", exact: true }).click();
  await expect(page.locator(".blocked-ip-list")).toHaveCount(0);
  expect((await db.collection("blockedContactIps").get()).size).toBe(0);
});

test("default daily IP quota survives new browser sessions and forged forwarded headers", async ({ browser }) => {
  for (let index = 0; index < 4; index++) {
    const context = await browser.newContext({ locale: "en-US", extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${index + 1}` } });
    const page = await context.newPage();
    await page.goto("/");
    await page.locator('[name="name"]').fill(`Quota visitor ${index}`);
    await page.locator('[name="email"]').fill(`quota${index}@example.test`);
    await page.locator('[name="phone"]').fill(`+96650123000${index}`);
    await page.locator('[name="message"]').fill("Please contact me about a wholesale order.");
    await page.locator('.contact-form button[type="submit"]').click();
    if (index < 3) await expect(page.locator(".form-result")).toHaveClass(/success/);
    else await expect(page.locator(".form-result")).toContainText("today's message limit");
    await context.close();
  }
  expect((await db.collection("contactMessages").get()).size).toBe(3);
});

test("inbox search, IP block, selected deletion and delete all outside filters preserve newer messages", async ({ page }) => {
  const first = await seedMessage("Alpha");
  const second = await seedMessage("Beta", "2001:db8::8");
  await signIn(page, "/admin/messages");
  await page.getByRole("searchbox").fill("alpha@example.test");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.locator("tbody tr").getByRole("button", { name: "Block IP", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Block IP", exact: true }).click();
  await expect(page.locator("tbody tr").getByRole("button", { name: "Unblock IP" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Select message from Alpha" }).check();
  await page.getByRole("button", { name: "Delete selected", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(async () => (await first.get()).exists).toBe(false);
  expect((await db.doc(`notificationOutbox/${first.id}`).get()).exists).toBe(false);
  expect((await second.get()).exists).toBe(true);
  await page.goto("/admin/messages");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/inbox-tools-desktop.png", fullPage: true, animations: "disabled", caret: "initial" });
  await page.getByRole("combobox", { name: "Language" }).selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/inbox-tools-mobile-ar.png", fullPage: true, animations: "disabled", caret: "initial" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("combobox", { name: "اللغة" }).selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.getByRole("searchbox").fill("not-found");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  const newer = await seedMessage("Newer", "203.0.113.22", Timestamp.now());
  await page.getByRole("button", { name: "Delete all messages", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("outside the current search");
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(async () => (await second.get()).exists).toBe(false);
  expect((await newer.get()).exists).toBe(true);
  expect((await db.collection("blockedContactIps").get()).size).toBe(1);
});

test("inbox live search replaces history, preserves focus, combines filters and cancels stale input", async ({ page }) => {
  await seedMessage("Alpha");
  const beta = await seedMessage("Beta");
  await beta.update({ status: "read" });
  await signIn(page, "/admin");
  await page.locator(".admin-sidebar").getByRole("link", { name: "Messages", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/messages$/);
  await expect(page.locator("tbody tr")).toHaveCount(2);
  const history = await page.evaluate(() => window.history.length);
  await page.evaluate(() => Reflect.set(window, "liveSearchMarker", true));
  const input = page.getByRole("searchbox");
  await input.fill("Alpha");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Alpha");
  await expect(input).toBeFocused();
  expect(await page.evaluate(() => window.history.length)).toBe(history);
  await input.fill("Beta");
  await expect(page.locator("tbody tr")).toContainText("Beta");
  expect(await page.evaluate(() => window.history.length)).toBe(history);
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("new");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("read");
  await expect(page.locator("tbody tr")).toContainText("Beta");
  await input.fill("not-found");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(input).toHaveValue("");
  await expect(page.getByRole("search")).toHaveAttribute("aria-busy", "false");
  expect(await page.evaluate(() => window.history.length)).toBe(history);
  expect(await page.evaluate(() => Reflect.get(window, "liveSearchMarker"))).toBe(true);
  await input.fill("Alpha");
  await input.press("Enter");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await input.fill("Beta");
  await page.goBack();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goForward();
  await expect(input).toHaveValue("Alpha");
  await expect(page.locator("tbody tr")).toContainText("Alpha");
});

test("row and keyboard open messages while selection and bulk read do not navigate", async ({ page }) => {
  const first = await seedMessage("Readable");
  const second = await seedMessage("Replied");
  const third = await seedMessage("Untouched");
  await second.update({ status: "replied" });
  await signIn(page, "/admin/messages");
  const row = page.getByRole("row", { name: "Open message from Readable" });
  await row.locator(".message-preview").click();
  await expect(page).toHaveURL(new RegExp(`/admin/messages/${first.id}$`));
  await page.getByRole("link", { name: "All messages", exact: true }).click();
  await row.focus(); await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/admin/messages/${first.id}$`));
  await page.getByRole("link", { name: "All messages", exact: true }).click();
  await page.getByRole("checkbox", { name: "Select message from Readable" }).check();
  await page.getByRole("checkbox", { name: "Select message from Replied" }).check();
  await expect(page).toHaveURL(/\/admin\/messages$/);
  await page.getByRole("button", { name: "Mark selected as read", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "1 messages marked as read." })).toBeVisible();
  expect((await first.get()).data()?.status).toBe("read");
  expect((await second.get()).data()?.status).toBe("replied");
  expect((await third.get()).data()?.status).toBe("new");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/inbox-read-mobile-en.png", animations: "disabled", caret: "initial" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("country selector validates national numbers and saves the full international phone", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator('[name="country"]')).toHaveValue("EG");
  await expect(page.locator(".contact-country-value")).toContainText("+20");
  await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator('[name="country"]').selectOption("PS");
  await expect(page.locator(".contact-country-value")).toContainText("+970");
  await page.locator('[name="name"]').fill("Phone Test Visitor");
  await page.locator('[name="email"]').fill("phone-test@example.test");
  await page.locator('[name="phone"]').fill("٠٥٩٩١٢٣٤٥٦");
  await page.locator('[name="message"]').fill("Please contact me about a wholesale order.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".contact-form").scrollIntoViewIfNeeded();
  await page.locator('[name="phone"]').focus();
  await expect(page.locator('[name="phone"]')).toHaveCSS("text-align", "right");
  await page.screenshot({ path: "test-results/phone-country-mobile-ar.png", animations: "disabled", caret: "initial" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.contact-form button[type="submit"]').click();
  await expect(page.locator(".form-result")).toHaveClass(/success/);
  await expect(page.locator('[name="country"]')).toHaveValue("EG");
  const messages = await db.collection("contactMessages").where("email", "==", "phone-test@example.test").get();
  expect(messages.docs[0].data().phone).toBe("+970599123456");
  await page.locator('[name="phone"]').fill("+1 202 555 0123");
  await expect(page.locator('[name="country"]')).toHaveValue("US");
  await expect(page.locator(".contact-country-value")).toContainText("+1");
  await expect(page.locator('[name="phone"]')).toHaveValue("2025550123");
  await page.getByRole("combobox", { name: "اللغة", exact: true }).selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator(".contact-form").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/phone-country-desktop-en.png", animations: "disabled", caret: "initial" });
  expect(errors).toEqual([]);
});

test("actual bucket limit changes, browser and API oversize errors, and successful image upload", async ({ page, context, request }) => {
  await signIn(page, "/admin/settings");
  const mediaPolicy = page.locator("#max-image-kb").locator("xpath=ancestor::form");
  await expect(page.locator("#max-image-kb")).toHaveValue("500");
  await page.locator("#max-image-kb").fill("250");
  await mediaPolicy.getByRole("button").click();
  await expect(mediaPolicy.getByRole("status")).toHaveText("Changes saved.");
  const bucket = await request.get("http://127.0.0.1:54329/storage/v1/bucket/site-media");
  expect((await bucket.json()).file_size_limit).toBe(250 * 1024);
  await page.goto("/admin/media");
  let attempts = 0;
  page.on("request", (req) => { if (req.url().endsWith("/api/admin/media") && req.method() === "POST") attempts++; });
  await page.locator('input[type="file"]').setInputFiles({ name: "too-large.png", mimeType: "image/png", buffer: Buffer.alloc(251 * 1024) });
  await expect(page.locator(".media-library").getByRole("status")).toHaveText("The image is too large. The maximum allowed size is 250 KB.");
  expect(attempts).toBe(0);
  const response = await context.request.post("/api/admin/media", {
    headers: { Origin: "http://127.0.0.1:3101" },
    multipart: { file: { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(251 * 1024) } },
  });
  expect(response.status()).toBe(413);
  expect(await response.json()).toMatchObject({ maxBytes: 250 * 1024 });
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "#b80e38" } }).png().toBuffer();
  await page.locator('input[type="file"]').setInputFiles({ name: "valid-test.png", mimeType: "image/png", buffer: png });
  await expect(page.locator(".media-item")).toHaveCount(1);
  await expect(page.locator(".media-item img")).toBeVisible();
  await expect.poll(() => page.locator(".media-item img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect((await db.collection("media").get()).size).toBe(1);
  const settings = await context.newPage();
  await settings.goto("/admin/settings");
  await settings.locator("#max-image-kb").fill("1");
  const lowerLimit = settings.locator("#max-image-kb").locator("xpath=ancestor::form");
  await lowerLimit.getByRole("button").click();
  await expect(lowerLimit.getByRole("status")).toHaveText("Changes saved.");
  await page.locator('input[type="file"]').setInputFiles({ name: "stale-limit.png", mimeType: "image/png", buffer: Buffer.alloc(2048) });
  await expect(page.locator(".media-library").getByRole("status")).toHaveText("The image is too large. The maximum allowed size is 1 KB.");
  await expect(page.locator(".media-limit")).toHaveText("Maximum image size: 1 KB");
  expect((await db.collection("media").get()).size).toBe(1);
  await settings.close();
});
