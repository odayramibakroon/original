import { test, expect, type Page } from "@playwright/test";
import { db, password, seedFixtures } from "./fixtures";

test.beforeAll(seedFixtures);
test.use({ locale: "en-US" });

async function signIn(page: Page, next: string) {
  await page.goto(next);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email address").fill("test-admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${next}$`));
}

test("product creation, piece count, publication, editing and deletion", async ({ page }) => {
  const slug = `test-created-${Date.now()}`;
  await signIn(page, "/admin/products/new");
  await expect(page.locator('[name="pieces"]')).toHaveValue("24");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".cms-form-footer").getByRole("status")).toContainText("highlighted");
  await page.locator('[name="slug"]').fill(slug);
  for (const [key, arabic, english] of [
    ["name", "منتج جديد للاختبار", "Created Test Product"], ["category", "تصنيف جديد", "Test Category"],
    ["shortDescription", "وصف قصير للاختبار", "A short test description"], ["description", "تفاصيل المنتج الجديد للاختبار", "Details of the new test product"],
  ]) {
    await page.locator(`[name="${key}.ar"]`).fill(arabic); await page.locator(`[name="${key}.en"]`).fill(english);
  }
  const imageSection = page.locator(".cms-array").last();
  await imageSection.locator('input[type="url"]').fill("/og.jpg");
  await imageSection.getByRole("button", { name: "Add", exact: true }).click();
  await page.locator('[name="isPublished"]').check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products\/[A-Za-z0-9]+\/edit$/);
  const id = page.url().split("/").at(-2)!;
  expect((await db.doc(`products/${id}`).get()).data()?.pieces).toBe(24);
  await page.goto(`/products/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Created Test Product");
  await expect(page.locator(".product-specs")).toContainText("24");
  await expect(page.locator('a[href*="wa.me"]')).toHaveCount(1);
  await expect(page.locator(".product-detail")).not.toContainText(/price|order this/i);
  await page.goto(`/admin/products/${id}/edit`);
  await expect(page.locator('[name="pieces"]')).toHaveValue("24");
  await page.locator('[name="pieces"]').fill("36");
  await expect(page.locator('[name="pieces"]')).toHaveValue("36");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".cms-form-footer").getByRole("status")).toHaveText("Changes saved.");
  expect((await db.doc(`products/${id}`).get()).data()?.pieces).toBe(36);
  await page.goto(`/products/${slug}`);
  await expect(page.locator(".product-specs")).toContainText("36");
  await page.goto("/admin/products");
  await page.getByRole("searchbox").fill("Created Test Product");
  const row = page.locator("tbody tr");
  await row.getByRole("switch").uncheck();
  await expect(page.getByRole("status")).toHaveText("Changes saved.");
  await page.goto(`/products/${slug}`);
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await page.goto("/admin/products");
  await page.getByRole("searchbox").fill("Created Test Product");
  await page.locator("tbody tr").getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("No items yet.")).toBeVisible();
  expect((await db.doc(`products/${id}`).get()).exists).toBe(false);
  expect((await db.doc(`productSlugs/${slug}`).get()).exists).toBe(false);
});

test("edits bilingual content, manages branches and settings", async ({ page }) => {
  await signIn(page, "/admin/content/contact");
  await page.locator('[name="title.en"]').fill("Contact our team");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".cms-form-footer").getByRole("status")).toHaveText("Changes saved.");
  await page.goto("/");
  await expect(page.locator("#contact h2")).toHaveText("Contact our team");
  await page.goto("/admin/branches");
  const before = await page.locator(".cms-array-row").count();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.locator(`[name="items.${before}.name.ar"]`).fill("فرع الاختبار");
  await page.locator(`[name="items.${before}.name.en"]`).fill("Test branch");
  await page.locator(`[name="items.${before}.address.ar"]`).fill("عنوان الاختبار");
  await page.locator(`[name="items.${before}.address.en"]`).fill("Test address");
  await page.locator(".cms-array-row").last().getByRole("button", { name: "Move up", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".cms-form-footer").getByRole("status")).toHaveText("Changes saved.");
  await page.goto("/");
  await expect(page.locator("footer")).toContainText("Test branch");
  const branches = (await db.doc("siteContent/main").get()).data()!.branches.items;
  expect(branches[before - 1].name.en).toBe("Test branch");
  expect(branches[before - 1].sortOrder).toBe(before - 1);
  await page.goto("/admin/settings");
  await page.locator('[name="seoTitle.en"]').fill("Factory test title");
  await page.locator(".cms-form").getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".cms-form-footer").getByRole("status")).toHaveText("Changes saved.");
  await page.goto("/"); await expect(page).toHaveTitle("Factory test title");
  await page.goto("/admin");
  await expect(page.locator(".admin-metric")).toHaveCount(4);
  await page.screenshot({ path: "test-results/cms-dashboard-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/cms-dashboard-mobile.png", fullPage: true, animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.locator(".admin-sidebar")).toHaveClass(/open/);
  await page.locator(".admin-sidebar").getByRole("link", { name: "Media library", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Media library" })).toBeVisible();
});

test("catalog search, filtering, square cards and two-row home cap", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const homeCards = page.locator(".home-products-grid .product-card:visible");
  await expect(homeCards).toHaveCount(8);
  const desktop = await homeCards.first().boundingBox();
  expect(Math.abs(desktop!.width - desktop!.height)).toBeLessThan(2);
  await page.locator("#products").evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
  await page.screenshot({ path: "test-results/products-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(homeCards).toHaveCount(4);
  const mobile = await homeCards.first().boundingBox();
  expect(Math.abs(mobile!.width - mobile!.height)).toBeLessThan(2);
  const first = await homeCards.nth(0).boundingBox(); const second = await homeCards.nth(1).boundingBox();
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
  await page.locator("#products").evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
  await page.screenshot({ path: "test-results/products-mobile.png" });
  await page.locator(".products-action a").click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.locator(".product-card")).toHaveCount(12);
  const history = await page.evaluate(() => window.history.length);
  await page.evaluate(() => Reflect.set(window, "liveSearchMarker", true));
  await page.getByRole("searchbox").pressSequentially("Classic", { delay: 350 });
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.getByRole("searchbox")).toBeFocused();
  await expect(page.getByRole("searchbox")).toHaveValue("Classic");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await page.getByLabel("Category", { exact: true }).selectOption("Cake");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("Chocolate Cake");
  await expect(page.locator("header")).toBeVisible();
  expect(await page.evaluate(() => window.history.length)).toBe(history);
  expect(await page.evaluate(() => Reflect.get(window, "liveSearchMarker"))).toBe(true);
  await page.screenshot({ path: "test-results/catalog-live-search-mobile.png", animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue("Cake");
  await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator(".catalog-clear").click();
  await page.getByRole("searchbox").fill("كلاسيك");
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("كلاسيك");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("بسكويت كلاسيك");
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/catalog-live-search-desktop-ar.png", animations: "disabled" });
});

test("email is required, validated, and placed directly below name", async ({ page }) => {
  await page.goto("/");
  const names = await page.locator(".contact-form input").evaluateAll((inputs) => inputs.map((input) => input.getAttribute("name")));
  expect(names).toEqual(["name", "email", "phone"]);
  await page.locator('[name="email"]').fill("invalid-address");
  await page.locator('[name="phone"]').focus();
  await expect(page.locator("#contact-email-error")).toHaveText("Enter a valid email address.");
  await page.getByRole("combobox", { name: "Language" }).selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await page.locator('[name="email"]').fill("invalid-address");
  await page.locator('[name="phone"]').focus();
  await expect(page.locator("#contact-email-error")).toHaveText("أدخل بريداً إلكترونياً صحيحاً.");
});
